import os
import uuid
import json
import shutil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Track, Genre, TrackGenre, User, Playlist, SiteSetting, Tag, TagCategory, TrackTag
from auth import require_admin
from audio import (
    get_duration, convert_to_mp3, generate_waveform_peaks,
    detect_format, extract_embedded_cover, ALLOWED_UPLOAD_EXTENSIONS,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


class GenreBody(BaseModel):
    name: str

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/opt/musicbox/uploads")
CONVERTED_DIR = os.getenv("CONVERTED_DIR", "/opt/musicbox/converted")


@router.post("/tracks")
async def upload_track(
    title: str = Form(...),
    artist: str = Form("Suno AI"),
    description: Optional[str] = Form(None),
    lyrics: Optional[str] = Form(None),
    genres: str = Form(""),  # comma-separated genre names (auto-created)
    tag_ids: str = Form(""),  # comma-separated tag IDs
    tags_json: str = Form(""),  # JSON: {"category_slug": "tag1, tag2", ...} — auto-create
    audio: UploadFile = File(...),
    cover: Optional[UploadFile] = File(None),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    track_id = uuid.uuid4()

    # Detect original format
    orig_ext = os.path.splitext(audio.filename or "file.wav")[1].lower().lstrip(".")
    if orig_ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {orig_ext}. Allowed: {', '.join(ALLOWED_UPLOAD_EXTENSIONS)}")
    original_format = detect_format(audio.filename or "file.wav")

    # Save original file with correct extension
    orig_filename = f"{track_id}.{orig_ext}"
    orig_path = os.path.join(UPLOAD_DIR, "tracks", orig_filename)
    with open(orig_path, "wb") as f:
        content = await audio.read()
        f.write(content)

    # Get duration
    duration = get_duration(orig_path)

    # Generate waveform peaks from original
    peaks = generate_waveform_peaks(orig_path)

    # Save cover
    cover_path = None
    if cover:
        ext = os.path.splitext(cover.filename)[1] if cover.filename else ".jpg"
        cover_filename = f"{track_id}{ext}"
        cover_full_path = os.path.join(UPLOAD_DIR, "covers", cover_filename)
        with open(cover_full_path, "wb") as f:
            cover_content = await cover.read()
            f.write(cover_content)
        cover_path = cover_full_path
    else:
        # Try to extract embedded cover from audio file
        embedded_cover_path = os.path.join(UPLOAD_DIR, "covers", f"{track_id}.jpg")
        if extract_embedded_cover(orig_path, embedded_cover_path):
            cover_path = embedded_cover_path

    # Create track — no auto-convert, stream original
    track = Track(
        id=track_id,
        title=title.strip(),
        artist=artist.strip(),
        duration_seconds=duration,
        file_path=orig_path,
        mp3_path="",
        original_format=original_format,
        cover_path=cover_path,
        description=description.strip() if description else None,
        lyrics=lyrics.strip() if lyrics else None,
        waveform_peaks=peaks,
    )
    db.add(track)
    await db.flush()

    # Handle genres — auto-create if not exists
    if genres:
        genre_names = [s.strip() for s in genres.split(",") if s.strip()]
        for name in genre_names:
            slug = name.lower().replace(" ", "-").replace("&", "and")
            result = await db.execute(select(Genre).where(Genre.slug == slug))
            genre = result.scalar_one_or_none()
            if not genre:
                genre = Genre(name=name, slug=slug)
                db.add(genre)
                await db.flush()
            db.add(TrackGenre(track_id=track_id, genre_id=genre.id))

    # Handle tags — by ID or by name (auto-create)
    if tag_ids:
        ids = [int(x) for x in tag_ids.split(",") if x.strip().isdigit()]
        for tid in ids:
            db.add(TrackTag(track_id=track_id, tag_id=tid))
    if tags_json:
        import json as _json
        try:
            tag_map = _json.loads(tags_json)  # {"category_slug": "tag1, tag2"}
            for cat_slug, names_str in tag_map.items():
                # Find category
                cat_result = await db.execute(select(TagCategory).where(TagCategory.slug == cat_slug))
                category = cat_result.scalar_one_or_none()
                if not category:
                    continue
                tag_names = [n.strip() for n in names_str.split(",") if n.strip()]
                for tname in tag_names:
                    tslug = tname.lower().replace(" ", "-").replace("&", "and")
                    tag_result = await db.execute(
                        select(Tag).where(Tag.category_id == category.id, Tag.slug == tslug)
                    )
                    tag = tag_result.scalar_one_or_none()
                    if not tag:
                        max_order = await db.execute(
                            select(func.coalesce(func.max(Tag.sort_order), 0)).where(Tag.category_id == category.id)
                        )
                        next_order = max_order.scalar() + 1
                        tag = Tag(category_id=category.id, name=tname, slug=tslug, sort_order=next_order)
                        db.add(tag)
                        await db.flush()
                    # Avoid duplicate track_tag
                    existing_tt = await db.execute(
                        select(TrackTag).where(TrackTag.track_id == track_id, TrackTag.tag_id == tag.id)
                    )
                    if not existing_tt.scalar_one_or_none():
                        db.add(TrackTag(track_id=track_id, tag_id=tag.id))
        except Exception:
            pass

    await db.commit()
    await db.refresh(track)

    # Reload with genres
    result = await db.execute(
        select(Track).options(selectinload(Track.genres), selectinload(Track.tags)).where(Track.id == track_id)
    )
    track = result.scalar_one()

    return {
        "id": str(track.id),
        "title": track.title,
        "artist": track.artist,
        "duration_seconds": track.duration_seconds,
        "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in track.genres],
        "has_cover": cover_path is not None,
        "has_lyrics": bool(track.lyrics),
        "has_waveform": bool(track.waveform_peaks),
    }


@router.put("/tracks/{track_id}")
async def update_track(
    track_id: str,
    title: Optional[str] = Form(None),
    artist: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    lyrics: Optional[str] = Form(None),
    genres: Optional[str] = Form(None),
    tag_ids: Optional[str] = Form(None),
    tags_json: Optional[str] = Form(None),  # JSON: {"category_slug": "tag1, tag2", ...}
    cover: Optional[UploadFile] = File(None),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Track).options(selectinload(Track.genres), selectinload(Track.tags)).where(Track.id == uuid.UUID(track_id))
    )
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    if title is not None:
        track.title = title.strip()
    if artist is not None:
        track.artist = artist.strip()
    if description is not None:
        track.description = description.strip() if description else None
    if lyrics is not None:
        track.lyrics = lyrics.strip() if lyrics else None

    if cover:
        # Remove old cover
        if track.cover_path and os.path.exists(track.cover_path):
            os.remove(track.cover_path)
        ext = os.path.splitext(cover.filename)[1] if cover.filename else ".jpg"
        cover_filename = f"{track.id}{ext}"
        cover_full_path = os.path.join(UPLOAD_DIR, "covers", cover_filename)
        with open(cover_full_path, "wb") as f:
            f.write(await cover.read())
        track.cover_path = cover_full_path

    if genres is not None:
        # Clear existing genres
        await db.execute(
            delete(TrackGenre).where(TrackGenre.track_id == track.id)
        )
        # Add new genres — auto-create if not exists
        if genres:
            genre_names = [s.strip() for s in genres.split(",") if s.strip()]
            for name in genre_names:
                slug = name.lower().replace(" ", "-").replace("&", "and")
                result = await db.execute(select(Genre).where(Genre.slug == slug))
                genre = result.scalar_one_or_none()
                if not genre:
                    genre = Genre(name=name, slug=slug)
                    db.add(genre)
                    await db.flush()
                db.add(TrackGenre(track_id=track.id, genre_id=genre.id))

    if tag_ids is not None or tags_json is not None:
        await db.execute(delete(TrackTag).where(TrackTag.track_id == track.id))
        if tag_ids:
            ids = [int(x) for x in tag_ids.split(",") if x.strip().isdigit()]
            for tid in ids:
                db.add(TrackTag(track_id=track.id, tag_id=tid))
        if tags_json:
            import json as _json
            try:
                tag_map = _json.loads(tags_json)
                for cat_slug, names_str in tag_map.items():
                    cat_result = await db.execute(select(TagCategory).where(TagCategory.slug == cat_slug))
                    category = cat_result.scalar_one_or_none()
                    if not category:
                        continue
                    tag_names = [n.strip() for n in names_str.split(",") if n.strip()]
                    for tname in tag_names:
                        tslug = tname.lower().replace(" ", "-").replace("&", "and")
                        tag_result = await db.execute(
                            select(Tag).where(Tag.category_id == category.id, Tag.slug == tslug)
                        )
                        tag = tag_result.scalar_one_or_none()
                        if not tag:
                            max_order = await db.execute(
                                select(func.coalesce(func.max(Tag.sort_order), 0)).where(Tag.category_id == category.id)
                            )
                            next_order = max_order.scalar() + 1
                            tag = Tag(category_id=category.id, name=tname, slug=tslug, sort_order=next_order)
                            db.add(tag)
                            await db.flush()
                        existing_tt = await db.execute(
                            select(TrackTag).where(TrackTag.track_id == track.id, TrackTag.tag_id == tag.id)
                        )
                        if not existing_tt.scalar_one_or_none():
                            db.add(TrackTag(track_id=track.id, tag_id=tag.id))
            except Exception:
                pass

    await db.commit()
    return {"message": "Track updated"}


@router.delete("/tracks/{track_id}")
async def delete_track(
    track_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Track).where(Track.id == uuid.UUID(track_id)))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    # Remove files
    for path in [track.file_path, track.mp3_path, track.cover_path]:
        if path and os.path.exists(path):
            os.remove(path)

    await db.delete(track)
    await db.commit()
    return {"message": "Track deleted"}


# --- Genres ---

@router.post("/genres")
async def create_genre(
    body: GenreBody,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    name = body.name
    slug = name.strip().lower().replace(" ", "-")
    existing = await db.execute(select(Genre).where(Genre.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Genre already exists")

    genre = Genre(name=name.strip(), slug=slug)
    db.add(genre)
    await db.commit()
    await db.refresh(genre)
    return {"id": genre.id, "name": genre.name, "slug": genre.slug}


@router.put("/genres/{genre_id}")
async def update_genre(
    genre_id: int,
    body: GenreBody,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    name = body.name
    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")

    new_slug = name.strip().lower().replace(" ", "-")
    dupe = await db.execute(select(Genre).where(Genre.slug == new_slug, Genre.id != genre_id))
    if dupe.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Genre name already taken")

    genre.name = name.strip()
    genre.slug = new_slug
    await db.commit()
    return {"id": genre.id, "name": genre.name, "slug": genre.slug}


@router.delete("/genres/{genre_id}")
async def delete_genre(
    genre_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")

    await db.execute(delete(TrackGenre).where(TrackGenre.genre_id == genre_id))
    await db.delete(genre)
    await db.commit()
    return {"message": "Genre deleted"}


# --- Tags ---

class TagBody(BaseModel):
    name: str
    category_id: int


@router.get("/tags")
async def list_admin_tags(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return all tag categories with tags, track counts, and enabled status."""
    result = await db.execute(
        select(TagCategory).options(selectinload(TagCategory.tags)).order_by(TagCategory.sort_order)
    )
    categories = result.scalars().all()
    count_result = await db.execute(
        select(TrackTag.tag_id, func.count(TrackTag.track_id).label("cnt"))
        .group_by(TrackTag.tag_id)
    )
    counts = {row[0]: row[1] for row in count_result.all()}
    return [
        {
            "id": cat.id, "name": cat.name, "slug": cat.slug, "icon": cat.icon,
            "tags": [
                {"id": t.id, "name": t.name, "slug": t.slug, "track_count": counts.get(t.id, 0), "enabled": t.enabled}
                for t in cat.tags
            ],
        }
        for cat in categories
    ]


@router.post("/tags")
async def create_tag(
    body: TagBody,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    name = body.name.strip()
    slug = name.lower().replace(" ", "-").replace("&", "and")
    existing = await db.execute(
        select(Tag).where(Tag.category_id == body.category_id, Tag.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tag already exists in this category")
    max_order = await db.execute(
        select(func.coalesce(func.max(Tag.sort_order), 0)).where(Tag.category_id == body.category_id)
    )
    tag = Tag(category_id=body.category_id, name=name, slug=slug, sort_order=max_order.scalar() + 1)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return {"id": tag.id, "name": tag.name, "slug": tag.slug, "category_id": tag.category_id}


@router.put("/tags/{tag_id}")
async def update_tag(
    tag_id: int,
    body: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if "name" in body:
        tag.name = body["name"].strip()
        tag.slug = tag.name.lower().replace(" ", "-").replace("&", "and")
    if "enabled" in body:
        tag.enabled = bool(body["enabled"])
    await db.commit()
    return {"id": tag.id, "name": tag.name, "slug": tag.slug, "enabled": tag.enabled}


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    await db.execute(delete(TrackTag).where(TrackTag.tag_id == tag_id))
    await db.delete(tag)
    await db.commit()
    return {"message": "Tag deleted"}


# --- Stats ---

@router.get("/stats")
async def get_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    tracks_count = (await db.execute(select(func.count(Track.id)))).scalar() or 0
    users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    genres_count = (await db.execute(select(func.count(Genre.id)))).scalar() or 0
    total_plays = (await db.execute(select(func.sum(Track.play_count)))).scalar() or 0
    playlists_count = (await db.execute(select(func.count(Playlist.id)))).scalar() or 0

    return {
        "total_tracks": tracks_count,
        "total_users": users_count,
        "total_genres": genres_count,
        "total_plays": total_plays,
        "total_playlists": playlists_count,
    }


# --- Site Settings (metadata tags etc.) ---

@router.get("/settings")
async def get_settings(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SiteSetting))
    settings = {s.key: s.value for s in result.scalars().all()}
    return settings


@router.put("/settings")
async def update_settings(
    settings: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    for key, value in settings.items():
        key = str(key).strip()[:100]
        value = str(value).strip()
        existing = await db.execute(select(SiteSetting).where(SiteSetting.key == key))
        s = existing.scalar_one_or_none()
        if s:
            s.value = value
        else:
            db.add(SiteSetting(key=key, value=value))
    await db.commit()
    return {"message": "Settings updated"}
