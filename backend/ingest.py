"""
MusicBox Auto-Ingest: Suno → MusicBox pipeline.

Scans /opt/musicbox/upmus/ for folders containing:
  - An audio file (mp3, wav, flac, ogg, m4a)
  - info.txt with: line1 = Suno URL, line2 = artist name

For each folder:
  1. Parses Suno page → title, lyrics, genres, description, cover
  2. Uses OpenAI to determine tags (mood, vocal, energy, occasion, era, language)
  3. Processes audio (duration, waveform)
  4. Creates DB record with all metadata
  5. Moves folder to upmus/done/
"""

import os
import sys
import uuid
import json
import re
import shutil
import logging
import asyncio
from pathlib import Path

import requests
from PIL import Image
import io

# Ensure backend modules are importable
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from database import async_session, engine
from models import Track, Genre, TrackGenre, Tag, TagCategory, TrackTag
from audio import get_duration, generate_waveform_peaks, detect_format, ALLOWED_UPLOAD_EXTENSIONS
from slugify import make_slug

logger = logging.getLogger("ingest")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/opt/musicbox/uploads")
UPMUS_DIR = os.getenv("UPMUS_DIR", "/opt/musicbox/upmus")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


# ---------------------------------------------------------------------------
# 1. Suno page parser
# ---------------------------------------------------------------------------

def parse_suno(url: str) -> dict:
    """Parse a Suno song page and return metadata dict."""
    # Extract song ID from URL
    m = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', url)
    if not m:
        raise ValueError(f"Cannot extract song ID from URL: {url}")
    song_id = m.group(1)

    r = requests.get(
        f"https://suno.com/song/{song_id}",
        headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
        timeout=20,
    )
    r.raise_for_status()
    html = r.text

    result = {
        "song_id": song_id,
        "title": "",
        "lyrics": "",
        "description": "",       # metadata.tags (full style description)
        "display_tags": "",       # genres: "left-field pop, indie pop, ..."
        "image_large_url": "",
    }

    # Extract RSC payloads: self.__next_f.push([1,"..."])
    payloads = []
    for pm in re.finditer(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html, re.DOTALL):
        raw = pm.group(1)
        unesc = raw.replace('\\"', '"').replace('\\n', '\n').replace('\\\\', '\\')
        payloads.append(unesc)

    # Find the JSON object with song metadata
    for p in payloads:
        if '"metadata"' in p and '"tags"' in p and '"title"' in p:
            m2 = re.search(r'(\{"status".*)', p)
            if m2:
                try:
                    decoder = json.JSONDecoder()
                    data, _ = decoder.raw_decode(m2.group(1))
                    result["title"] = data.get("title", "")
                    result["description"] = data.get("metadata", {}).get("tags", "")
                    result["display_tags"] = data.get("display_tags", "")
                    result["image_large_url"] = data.get("image_large_url", "")
                except json.JSONDecodeError:
                    pass
            break

    # Find lyrics payload: "NN:TLEN,<lyrics>"
    for p in payloads:
        if "[Verse" in p or "[Chorus" in p or "[Intro" in p or "[Hook" in p:
            m3 = re.match(r'[\da-f]+:T\d+,(.+)', p, re.DOTALL)
            if m3:
                result["lyrics"] = m3.group(1).strip()
            else:
                result["lyrics"] = p.strip()
            break

    if not result["title"]:
        # Fallback: og:title
        m_og = re.search(r'<meta\s+property="og:title"\s+content="([^"]+)"', html)
        if m_og:
            result["title"] = m_og.group(1).split(" by ")[0].strip()

    if not result["image_large_url"]:
        result["image_large_url"] = f"https://cdn2.suno.ai/image_large_{song_id}.jpeg"

    return result


# ---------------------------------------------------------------------------
# 2. OpenAI tag analysis
# ---------------------------------------------------------------------------

def analyze_with_ai(
    title: str,
    lyrics: str,
    description: str,
    display_tags: str,
    categories: dict[str, list[str]],
) -> dict[str, list[str]]:
    """
    Use OpenAI to determine track characteristics.
    Returns: {"mood": ["Спокойное", "Мечтательное"], "vocal": ["Мужской"], ...}
    """
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)

    existing_tags_text = ""
    for cat_slug, tags in categories.items():
        if tags:
            existing_tags_text += f"  {cat_slug}: {', '.join(tags)}\n"

    prompt = f"""You are a music metadata analyst for a music streaming site.
Analyze this track and assign characteristics for each category.

TRACK INFO:
- Title: {title}
- Suno styles: {display_tags}
- Style description: {description}
- Lyrics (first 1500 chars): {lyrics[:1500]}

CATEGORIES TO FILL:
1. **language** — Detect the language of the lyrics. Return ONE value in Russian.
   Examples: Украинский, Английский, Русский, Испанский, Немецкий, Французский, Инструментал (if no lyrics)

2. **mood** — Emotional mood(s) of the track. Return 1-3 values in Russian.
   Examples: Весёлое, Грустное, Романтичное, Спокойное, Тревожное, Мечтательное, Энергичное, Меланхоличное, Вдохновляющее, Ностальгическое, Дерзкое, Нежное

3. **vocal** — Type of vocals. Return ONE value in Russian.
   Values: Мужской, Женский, Дуэт, Хор, Инструментал

4. **energy** — Energy level. Return ONE value in Russian.
   Values: Высокая, Средняя, Низкая

5. **occasion** — What is this music good for? Return 1-4 values in Russian.
   Examples: Для работы, Для тренировки, Для вечеринки, Для медитации, Для релакса, Для прогулки, Для вождения, Для сна, Для учёбы, Для романтики, Для утра, Фоновая музыка

6. **era** — Musical era/decade this sounds like. Return ONE value in Russian.
   Values: Классика, 70-е, 80-е, 90-е, 2000-е, 2010-е, 2020-е, Современная

EXISTING TAGS (prefer matching these when appropriate, but create new ones if needed):
{existing_tags_text}

IMPORTANT:
- All values MUST be in Russian
- Capitalize first letter of each value
- Be accurate and thoughtful, consider both lyrics and musical style
- For "occasion" think broadly about when/where this music fits

Return ONLY a valid JSON object with category slugs as keys and arrays of strings as values:
{{"language": ["..."], "mood": ["...", "..."], "vocal": ["..."], "energy": ["..."], "occasion": ["...", "..."], "era": ["..."]}}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    try:
        result = json.loads(response.choices[0].message.content)
        # Validate structure
        validated = {}
        for cat in ["language", "mood", "vocal", "energy", "occasion", "era"]:
            val = result.get(cat, [])
            if isinstance(val, str):
                val = [val]
            validated[cat] = [v.strip() for v in val if v.strip()]
        return validated
    except (json.JSONDecodeError, KeyError, IndexError):
        logger.error("Failed to parse AI response")
        return {}


# ---------------------------------------------------------------------------
# 3. Download cover image
# ---------------------------------------------------------------------------

def download_cover(url: str, track_id: str) -> str | None:
    """Download cover image, crop to square, save as WebP. Returns path or None."""
    try:
        r = requests.get(url, timeout=20)
        r.raise_for_status()
        img = Image.open(io.BytesIO(r.content))
        # Convert to RGB if needed
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        # Crop to square
        w, h = img.size
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        img = img.crop((left, top, left + side, top + side))
        # Resize to a reasonable size
        if side > 800:
            img = img.resize((800, 800), Image.LANCZOS)
        # Save
        cover_filename = f"{track_id}.webp"
        cover_path = os.path.join(UPLOAD_DIR, "covers", cover_filename)
        img.save(cover_path, "WEBP", quality=90)
        return cover_path
    except Exception as e:
        logger.warning(f"Failed to download cover: {e}")
        return None


# ---------------------------------------------------------------------------
# 4. Main ingest logic (async)
# ---------------------------------------------------------------------------

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".wma"}


def find_folders(upmus_dir: str) -> list[Path]:
    """Find all folders in upmus_dir that contain audio + info.txt."""
    folders = []
    upmus = Path(upmus_dir)
    if not upmus.exists():
        return folders
    for sub in sorted(upmus.iterdir()):
        if not sub.is_dir() or sub.name in ("done", "failed"):
            continue
        has_audio = any(f.suffix.lower() in AUDIO_EXTENSIONS for f in sub.iterdir() if f.is_file())
        has_info = (sub / "info.txt").exists()
        if has_audio and has_info:
            folders.append(sub)
    return folders


def parse_info_txt(folder: Path) -> tuple[str, str]:
    """Read info.txt → (suno_url, artist)."""
    info_path = folder / "info.txt"
    lines = info_path.read_text(encoding="utf-8").strip().splitlines()
    suno_url = lines[0].strip() if len(lines) >= 1 else ""
    artist = lines[1].strip() if len(lines) >= 2 else "Suno AI"
    return suno_url, artist


def find_audio_file(folder: Path) -> Path | None:
    """Find the first audio file in the folder."""
    for f in sorted(folder.iterdir()):
        if f.is_file() and f.suffix.lower() in AUDIO_EXTENSIONS:
            return f
    return None


async def get_existing_categories(db: AsyncSession) -> dict[str, tuple[int, list[str]]]:
    """Fetch all tag categories with their existing tag names.
    Returns: {slug: (category_id, [tag_name, ...])}
    """
    result = await db.execute(
        select(TagCategory).order_by(TagCategory.sort_order)
    )
    cats = result.scalars().all()
    out = {}
    for cat in cats:
        tags_result = await db.execute(
            select(Tag.name).where(Tag.category_id == cat.id)
        )
        tag_names = [t[0] for t in tags_result.all()]
        out[cat.slug] = (cat.id, tag_names)
    return out


async def ingest_folder(folder: Path, db: AsyncSession) -> dict:
    """Process a single folder. Returns status dict."""
    folder_name = folder.name
    log = logger.getChild(folder_name)

    # 1. Read info.txt
    suno_url, artist = parse_info_txt(folder)
    if not suno_url:
        return {"folder": folder_name, "status": "error", "message": "No Suno URL in info.txt"}

    audio_file = find_audio_file(folder)
    if not audio_file:
        return {"folder": folder_name, "status": "error", "message": "No audio file found"}

    log.info(f"Processing: {suno_url} | artist: {artist}")

    # 2. Parse Suno page
    try:
        suno = parse_suno(suno_url)
    except Exception as e:
        return {"folder": folder_name, "status": "error", "message": f"Suno parse failed: {e}"}

    title = suno["title"] or folder_name
    lyrics = suno["lyrics"]
    description = suno["description"]
    display_tags = suno["display_tags"]

    log.info(f"Title: {title} | Genres: {display_tags}")

    # 3. AI analysis for tags
    categories = await get_existing_categories(db)
    cat_tags_for_ai = {slug: names for slug, (_, names) in categories.items()}

    ai_tags = {}
    if OPENAI_API_KEY:
        try:
            ai_tags = analyze_with_ai(title, lyrics, description, display_tags, cat_tags_for_ai)
            log.info(f"AI tags: {ai_tags}")
        except Exception as e:
            log.warning(f"AI analysis failed: {e}")

    # 4. Process audio
    track_id = uuid.uuid4()
    orig_ext = audio_file.suffix.lower().lstrip(".")
    original_format = detect_format(audio_file.name)

    # Copy audio to uploads/tracks/
    dest_filename = f"{track_id}.{orig_ext}"
    dest_path = os.path.join(UPLOAD_DIR, "tracks", dest_filename)
    shutil.copy2(str(audio_file), dest_path)

    duration = get_duration(dest_path)
    peaks = generate_waveform_peaks(dest_path)

    # 5. Download cover
    cover_path = None
    if suno["image_large_url"]:
        cover_path = download_cover(suno["image_large_url"], str(track_id))

    # 6. Generate slug
    base_slug = make_slug(artist, title)
    slug = base_slug
    suffix = 2
    while True:
        existing = await db.execute(select(Track.id).where(Track.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    # 7. Create track record
    track = Track(
        id=track_id,
        slug=slug,
        title=title,
        artist=artist,
        duration_seconds=duration,
        file_path=dest_path,
        mp3_path="",
        original_format=original_format,
        cover_path=cover_path,
        description=description or None,
        lyrics=lyrics or None,
        waveform_peaks=peaks,
    )
    db.add(track)
    await db.flush()

    # 8. Add genres from display_tags
    genres_added = []
    if display_tags:
        genre_names = [g.strip() for g in display_tags.split(",") if g.strip()]
        for gname in genre_names:
            gslug = gname.lower().replace(" ", "-").replace("&", "and")
            result = await db.execute(select(Genre).where(Genre.slug == gslug))
            genre = result.scalar_one_or_none()
            if not genre:
                genre = Genre(name=gname, slug=gslug)
                db.add(genre)
                await db.flush()
            db.add(TrackGenre(track_id=track_id, genre_id=genre.id))
            genres_added.append(gname)

    # 9. Add AI-determined tags
    tags_added = {}
    for cat_slug, tag_names in ai_tags.items():
        if cat_slug not in categories:
            continue
        cat_id, _ = categories[cat_slug]
        for tname in tag_names:
            tslug = tname.lower().replace(" ", "-").replace("&", "and")
            tag_result = await db.execute(
                select(Tag).where(Tag.category_id == cat_id, Tag.slug == tslug)
            )
            tag = tag_result.scalar_one_or_none()
            if not tag:
                # Get next sort order
                max_order_result = await db.execute(
                    select(func.coalesce(func.max(Tag.sort_order), 0)).where(Tag.category_id == cat_id)
                )
                next_order = max_order_result.scalar() + 1
                tag = Tag(category_id=cat_id, name=tname, slug=tslug, sort_order=next_order)
                db.add(tag)
                await db.flush()
            # Avoid duplicate
            existing_tt = await db.execute(
                select(TrackTag).where(TrackTag.track_id == track_id, TrackTag.tag_id == tag.id)
            )
            if not existing_tt.scalar_one_or_none():
                db.add(TrackTag(track_id=track_id, tag_id=tag.id))
            tags_added.setdefault(cat_slug, []).append(tname)

    await db.commit()

    # 10. Move folder to done/
    done_dir = Path(UPMUS_DIR) / "done"
    done_dir.mkdir(exist_ok=True)
    dest_folder = done_dir / folder.name
    if dest_folder.exists():
        dest_folder = done_dir / f"{folder.name}_{track_id.hex[:8]}"
    shutil.move(str(folder), str(dest_folder))

    return {
        "folder": folder_name,
        "status": "ok",
        "track_id": str(track_id),
        "title": title,
        "artist": artist,
        "slug": slug,
        "genres": genres_added,
        "tags": tags_added,
        "duration": round(duration, 1),
        "has_cover": cover_path is not None,
        "has_lyrics": bool(lyrics),
    }


async def run_ingest() -> list[dict]:
    """Run the full ingest pipeline. Returns list of results."""
    os.makedirs(UPMUS_DIR, exist_ok=True)
    os.makedirs(os.path.join(UPMUS_DIR, "done"), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_DIR, "tracks"), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_DIR, "covers"), exist_ok=True)

    folders = find_folders(UPMUS_DIR)
    if not folders:
        return [{"status": "empty", "message": "No folders to process in upmus/"}]

    results = []
    async with async_session() as db:
        for folder in folders:
            try:
                result = await ingest_folder(folder, db)
                results.append(result)
                logger.info(f"✓ {result.get('title', folder.name)}: {result['status']}")
            except Exception as e:
                logger.error(f"✗ {folder.name}: {e}")
                results.append({"folder": folder.name, "status": "error", "message": str(e)})
                # Move to failed/
                failed_dir = Path(UPMUS_DIR) / "failed"
                failed_dir.mkdir(exist_ok=True)
                try:
                    shutil.move(str(folder), str(failed_dir / folder.name))
                except Exception:
                    pass

    return results


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s: %(message)s")
    if not OPENAI_API_KEY:
        print("WARNING: OPENAI_API_KEY not set — AI tag analysis will be skipped")
    results = asyncio.run(run_ingest())
    print(json.dumps(results, indent=2, ensure_ascii=False))
