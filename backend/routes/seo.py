import html
import json
import os
import re
import uuid
from datetime import datetime, timezone
from urllib.parse import quote

from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse, RedirectResponse, Response
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Genre, Playlist, PlaylistTrack, Tag, Track
from routes.collections import (
    STATIC_COLLECTIONS,
    _build_dynamic_collections,
    _get_genres_with_counts,
    _get_tags_by_category,
    _resolve_tracks,
)
from search_utils import (
    build_search_terms,
    compact_spaces,
    layout_swap,
    normalize_public_music_text,
    transliterate_ru_to_latin,
)


router = APIRouter(tags=["seo"])

SITE_URL = os.getenv("PUBLIC_SITE_URL", "https://musicbox.gornich.fun").rstrip("/")
SITE_NAME = "MusicBox"
SITE_DESCRIPTION = "MusicBox is a music streaming library with songs, lyrics, playlists, genres and waveform playback."
FRONTEND_INDEX_PATH = os.getenv("FRONTEND_INDEX_PATH", "/opt/musicbox/frontend/dist/index.html")
FRONTEND_DEV_INDEX_PATH = "/opt/musicbox/frontend/index.html"
LOGO_URL = f"{SITE_URL}/logo.png"

COLLECTION_NAMES = {
    "top-100": "Top 100",
    "most-played": "Most played",
    "new-releases": "New releases",
    "energy-high": "High energy",
    "energy-chill": "Chill energy",
    "vocal-male": "Male vocal",
    "vocal-female": "Female vocal",
    "instrumental": "Instrumental",
}


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def abs_url(path_or_url: str | None) -> str:
    if not path_or_url:
        return SITE_URL
    value = str(path_or_url)
    if value.startswith("http://") or value.startswith("https://"):
        return value
    if not value.startswith("/"):
        value = "/" + value
    return f"{SITE_URL}{value}"


def cover_url(track: Track | None) -> str:
    if not track or not track.cover_path:
        return LOGO_URL
    if track.cover_path.startswith("/uploads/"):
        return abs_url(track.cover_path)
    return abs_url(f"/uploads/covers/{os.path.basename(track.cover_path)}")


def iso_date(value: datetime | None) -> str:
    if not value:
        return datetime.now(timezone.utc).date().isoformat()
    return value.date().isoformat()


def iso_duration(seconds: float | int | None) -> str | None:
    if not seconds:
        return None
    total = int(round(float(seconds)))
    hours, rem = divmod(total, 3600)
    minutes, secs = divmod(rem, 60)
    if hours:
        return f"PT{hours}H{minutes}M{secs}S"
    if minutes:
        return f"PT{minutes}M{secs}S"
    return f"PT{secs}S"


def read_index_html() -> str:
    path = FRONTEND_INDEX_PATH if os.path.exists(FRONTEND_INDEX_PATH) else FRONTEND_DEV_INDEX_PATH
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def json_script(data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    return payload.replace("</", "<\\/")


def base_graph(canonical: str, page_name: str, description: str) -> list[dict]:
    return [
        {
            "@type": "Organization",
            "@id": f"{SITE_URL}/#organization",
            "name": SITE_NAME,
            "url": SITE_URL,
            "logo": {
                "@type": "ImageObject",
                "url": LOGO_URL,
            },
        },
        {
            "@type": "WebSite",
            "@id": f"{SITE_URL}/#website",
            "url": SITE_URL,
            "name": SITE_NAME,
            "description": SITE_DESCRIPTION,
            "publisher": {"@id": f"{SITE_URL}/#organization"},
            "potentialAction": {
                "@type": "SearchAction",
                "target": f"{SITE_URL}/browse?q={{search_term_string}}",
                "query-input": "required name=search_term_string",
            },
        },
        {
            "@type": "WebPage",
            "@id": f"{canonical}#webpage",
            "url": canonical,
            "name": page_name,
            "description": description,
            "isPartOf": {"@id": f"{SITE_URL}/#website"},
        },
    ]


def breadcrumb_graph(canonical: str, items: list[tuple[str, str]]) -> dict:
    return {
        "@type": "BreadcrumbList",
        "@id": f"{canonical}#breadcrumb",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": idx + 1,
                "name": name,
                "item": url,
            }
            for idx, (name, url) in enumerate(items)
        ],
    }


def page_shell(
    *,
    title: str,
    description: str,
    path: str,
    fallback_html: str,
    graph_nodes: list[dict] | None = None,
    image: str | None = None,
    og_type: str = "website",
    robots: str = "index,follow",
) -> HTMLResponse:
    canonical = abs_url(path)
    description = normalize_public_music_text(description)[:280]
    title = normalize_public_music_text(title)
    image = image or LOGO_URL
    graph = {
        "@context": "https://schema.org",
        "@graph": base_graph(canonical, title, description) + (graph_nodes or []),
    }

    head_extra = "\n".join([
        f'<link rel="canonical" href="{esc(canonical)}" />',
        f'<link rel="search" type="application/opensearchdescription+xml" title="{SITE_NAME}" href="/opensearch.xml" />',
        f'<meta name="robots" content="{esc(robots)}" />',
        f'<meta property="og:type" content="{esc(og_type)}" />',
        f'<meta property="og:site_name" content="{SITE_NAME}" />',
        f'<meta property="og:title" content="{esc(title)}" />',
        f'<meta property="og:description" content="{esc(description)}" />',
        f'<meta property="og:url" content="{esc(canonical)}" />',
        f'<meta property="og:image" content="{esc(image)}" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        f'<meta name="twitter:title" content="{esc(title)}" />',
        f'<meta name="twitter:description" content="{esc(description)}" />',
        f'<meta name="twitter:image" content="{esc(image)}" />',
        '<style data-seo-fallback>.seo-shell{min-height:100vh;background:#090b11;color:#f4f7fb;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:32px;line-height:1.55}.seo-shell a{color:#67e8f9}.seo-shell h1{font-size:clamp(2rem,5vw,4rem);line-height:1;margin:0 0 12px}.seo-shell h2{margin-top:28px}.seo-shell .seo-panel{max-width:980px;border:1px solid rgba(255,255,255,.14);border-radius:24px;background:rgba(255,255,255,.06);padding:24px}.seo-shell .seo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.seo-shell .seo-cover{width:min(320px,100%);border-radius:22px}.seo-shell .seo-pills{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.seo-shell .seo-pill{border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:4px 10px;color:#dbeafe}.seo-shell pre{white-space:pre-wrap;font:inherit;background:rgba(0,0,0,.22);border-radius:18px;padding:20px;overflow:auto}</style>',
        f'<script type="application/ld+json">{json_script(graph)}</script>',
    ])

    doc = read_index_html()
    if re.search(r"<title>.*?</title>", doc, flags=re.IGNORECASE | re.DOTALL):
        doc = re.sub(r"<title>.*?</title>", f"<title>{esc(title)}</title>", doc, count=1, flags=re.IGNORECASE | re.DOTALL)
    else:
        doc = doc.replace("</head>", f"<title>{esc(title)}</title>\n</head>", 1)

    desc_tag = f'<meta name="description" content="{esc(description)}" />'
    if re.search(r'<meta\s+name=["\']description["\'][^>]*>', doc, flags=re.IGNORECASE):
        doc = re.sub(r'<meta\s+name=["\']description["\'][^>]*>', desc_tag, doc, count=1, flags=re.IGNORECASE)
    else:
        doc = doc.replace("</head>", f"{desc_tag}\n</head>", 1)

    doc = doc.replace("</head>", f"{head_extra}\n</head>", 1)
    root_html = f'<div id="root">{fallback_html}</div>'
    doc = re.sub(r'<div id="root">\s*</div>', root_html, doc, count=1)
    return HTMLResponse(doc)


def fallback_page(title: str, description: str, body: str) -> str:
    return f"""
    <main class="seo-shell">
      <section class="seo-panel">
        <p><a href="/">MusicBox</a></p>
        <h1>{esc(title)}</h1>
        <p>{esc(description)}</p>
        {body}
      </section>
    </main>
    """


async def newest_tracks(db: AsyncSession, limit: int = 12) -> list[Track]:
    result = await db.execute(
        select(Track)
        .options(selectinload(Track.genres), selectinload(Track.tags).selectinload(Tag.category))
        .order_by(desc(Track.uploaded_at))
        .limit(limit)
    )
    return list(result.scalars().unique().all())


async def popular_tracks(db: AsyncSession, limit: int = 12) -> list[Track]:
    result = await db.execute(
        select(Track)
        .options(selectinload(Track.genres), selectinload(Track.tags).selectinload(Tag.category))
        .order_by(desc(Track.play_count + Track.download_count * 3), desc(Track.uploaded_at))
        .limit(limit)
    )
    return list(result.scalars().unique().all())


def track_links(tracks: list[Track]) -> str:
    if not tracks:
        return "<p>No tracks published yet.</p>"
    items = []
    for track in tracks:
        items.append(
            f'<li><a href="/track/{esc(track.slug)}">{esc(track.title)}</a> '
            f'<span>by <a href="/browse?artist={quote(track.artist, safe="")}">{esc(normalize_public_music_text(track.artist))}</a></span></li>'
        )
    return "<ul>" + "".join(items) + "</ul>"


@router.get("/", response_class=HTMLResponse)
async def seo_home(db: AsyncSession = Depends(get_db)):
    tracks = await newest_tracks(db, 10)
    popular = await popular_tracks(db, 10)
    genres = await db.execute(
        select(Genre.id, Genre.name, Genre.slug, func.count(Track.id).label("cnt"))
        .join(Genre.tracks)
        .group_by(Genre.id)
        .order_by(desc("cnt"))
        .limit(16)
    )
    genre_links = "".join(
        f'<a class="seo-pill" href="/browse?genres={esc(row.id)}">{esc(row.name)}</a>'
        for row in genres.all()
    )
    body = f"""
      <div class="seo-grid">
        <section><h2>New songs</h2>{track_links(tracks)}</section>
        <section><h2>Popular tracks</h2>{track_links(popular)}</section>
      </div>
      <h2>Genres</h2>
      <div class="seo-pills">{genre_links}</div>
      <p><a href="/browse">Browse the library</a> · <a href="/explore">Explore collections</a> · <a href="/playlists">Public playlists</a></p>
    """
    return page_shell(
        title="MusicBox - music streaming, lyrics and playlists",
        description="Listen to songs, read lyrics, browse genres, discover playlists and search MusicBox by title, artist or remembered lyric line.",
        path="/",
        fallback_html=fallback_page("MusicBox", "Music streaming, lyrics, playlists and genres.", body),
        graph_nodes=[breadcrumb_graph(SITE_URL, [("MusicBox", SITE_URL)])],
    )


@router.head("/")
@router.head("/browse")
@router.head("/explore")
@router.head("/playlists")
@router.head("/favorites")
@router.head("/track/{slug}")
@router.head("/collection/{slug}")
@router.head("/playlist/{playlist_id}")
@router.head("/robots.txt")
@router.head("/opensearch.xml")
@router.head("/sitemap.xml")
@router.head("/seo/semantic-index.json")
@router.head("/seo/structured-data.json")
async def seo_head():
    return Response(status_code=200)


@router.get("/browse", response_class=HTMLResponse)
async def seo_browse(db: AsyncSession = Depends(get_db)):
    tracks = await newest_tracks(db, 24)
    body = f"""
      <form action="/browse" method="get">
        <label for="q">Search songs, artists, lyrics and genres</label>
        <input id="q" name="q" type="search" />
        <button type="submit">Search</button>
      </form>
      <h2>Library tracks</h2>
      {track_links(tracks)}
    """
    return page_shell(
        title="Browse MusicBox songs, artists and lyrics",
        description="Search MusicBox by song title, artist, genre, tag or a line from the lyrics.",
        path="/browse",
        fallback_html=fallback_page("Browse MusicBox", "Search songs, artists, lyrics and genres.", body),
        graph_nodes=[breadcrumb_graph(abs_url("/browse"), [("MusicBox", SITE_URL), ("Browse", abs_url("/browse"))])],
    )


@router.get("/explore", response_class=HTMLResponse)
async def seo_explore(db: AsyncSession = Depends(get_db)):
    genres = await _get_genres_with_counts(db)
    tags_by_cat = await _get_tags_by_category(db)
    collections = list(STATIC_COLLECTIONS) + _build_dynamic_collections(genres, tags_by_cat)
    links = "".join(
        f'<li><a href="/collection/{esc(item["slug"])}">{esc(collection_name(item))}</a></li>'
        for item in collections[:80]
    )
    body = f"<h2>Collections</h2><ul>{links}</ul>"
    return page_shell(
        title="Explore MusicBox collections",
        description="Explore MusicBox collections by popularity, newest songs, mood, energy, vocal, genre, language and occasion.",
        path="/explore",
        fallback_html=fallback_page("Explore MusicBox", "Collections by genre, mood, energy and listening context.", body),
        graph_nodes=[breadcrumb_graph(abs_url("/explore"), [("MusicBox", SITE_URL), ("Explore", abs_url("/explore"))])],
    )


@router.get("/playlists", response_class=HTMLResponse)
async def seo_playlists(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Playlist)
        .where(Playlist.is_public == True)
        .order_by(desc(Playlist.updated_at), desc(Playlist.created_at))
        .limit(60)
    )
    playlists = result.scalars().all()
    links = "".join(
        f'<li><a href="/playlist/{esc(playlist.id)}">{esc(playlist.name)}</a>'
        f'{": " + esc(normalize_public_music_text(playlist.description)) if playlist.description else ""}</li>'
        for playlist in playlists
    )
    body = f"<h2>Public playlists</h2><ul>{links or '<li>No public playlists yet.</li>'}</ul>"
    return page_shell(
        title="MusicBox public playlists",
        description="Public MusicBox playlists for listening, saving tracks and discovering songs by genre and mood.",
        path="/playlists",
        fallback_html=fallback_page("Public playlists", "Discover public playlists on MusicBox.", body),
        graph_nodes=[breadcrumb_graph(abs_url("/playlists"), [("MusicBox", SITE_URL), ("Playlists", abs_url("/playlists"))])],
    )


@router.get("/track/{slug}", response_class=HTMLResponse)
async def seo_track(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Track)
        .options(selectinload(Track.genres), selectinload(Track.tags).selectinload(Tag.category))
        .where(Track.slug == slug)
    )
    track = result.scalar_one_or_none()
    if not track and "suno" in slug.lower():
        cleaned_slug = re.sub("suno", "musicbox", slug, flags=re.IGNORECASE)
        result = await db.execute(select(Track.slug).where(Track.slug == cleaned_slug))
        existing_slug = result.scalar_one_or_none()
        if existing_slug:
            return RedirectResponse(abs_url(f"/track/{existing_slug}"), status_code=301)
    if not track:
        return page_shell(
            title="Track not found | MusicBox",
            description="Open MusicBox to browse songs, lyrics, genres and playlists.",
            path=f"/track/{slug}",
            fallback_html=fallback_page("Track not found", "Browse MusicBox for songs, artists and lyrics.", '<p><a href="/browse">Browse tracks</a></p>'),
            robots="noindex,follow",
        )

    artist = normalize_public_music_text(track.artist)
    description = normalize_public_music_text(track.description) if track.description else (
        f"Listen to {track.title} by {artist}, read the lyrics and explore related genres on MusicBox."
    )
    genres = [genre.name for genre in track.genres]
    tags = [tag.name for tag in track.tags]
    canonical = abs_url(f"/track/{track.slug}")
    image = cover_url(track)
    genre_links = "".join(
        f'<a class="seo-pill" href="/browse?genres={esc(genre.slug)}">{esc(genre.name)}</a>'
        for genre in track.genres
    )
    tag_pills = "".join(f'<span class="seo-pill">{esc(tag)}</span>' for tag in tags[:24])
    lyrics_html = f"<h2>Lyrics</h2><pre>{esc(track.lyrics)}</pre>" if track.lyrics else "<p>Lyrics are not published for this track yet.</p>"
    body = f"""
      <article>
        <img class="seo-cover" src="{esc(image)}" alt="{esc(track.title)} cover" />
        <p>Artist: <a href="/browse?artist={quote(artist, safe='')}">{esc(artist)}</a></p>
        <p>Published: {esc(iso_date(track.uploaded_at))}{' · Duration: ' + esc(iso_duration(track.duration_seconds) or '') if track.duration_seconds else ''}</p>
        <p>{esc(description)}</p>
        <div class="seo-pills">{genre_links}{tag_pills}</div>
        <p><a href="/track/{esc(track.slug)}">Play this track on MusicBox</a></p>
        {lyrics_html}
      </article>
    """

    recording = {
        "@type": "MusicRecording",
        "@id": f"{canonical}#recording",
        "name": track.title,
        "url": canonical,
        "image": image,
        "description": description,
        "datePublished": iso_date(track.uploaded_at),
        "byArtist": {
            "@type": "MusicGroup",
            "name": artist,
            "url": f"{SITE_URL}/browse?artist={quote(artist, safe='')}",
        },
        "genre": genres,
        "isAccessibleForFree": True,
    }
    duration = iso_duration(track.duration_seconds)
    if duration:
        recording["duration"] = duration
    if track.lyrics:
        recording["recordingOf"] = {
            "@type": "MusicComposition",
            "@id": f"{canonical}#composition",
            "name": track.title,
            "composer": {"@type": "MusicGroup", "name": artist},
            "lyrics": {
                "@type": "CreativeWork",
                "@id": f"{canonical}#lyrics",
                "text": track.lyrics,
            },
        }

    return page_shell(
        title=f"{track.title} - {artist} | Lyrics and stream",
        description=description,
        path=f"/track/{track.slug}",
        fallback_html=fallback_page(track.title, f"{artist} on MusicBox.", body),
        graph_nodes=[
            recording,
            breadcrumb_graph(canonical, [
                ("MusicBox", SITE_URL),
                ("Browse", abs_url("/browse")),
                (track.title, canonical),
            ]),
        ],
        image=image,
        og_type="music.song",
    )


def collection_name(item: dict) -> str:
    return item.get("name") or COLLECTION_NAMES.get(item["slug"]) or item["slug"].replace("-", " ").title()


@router.get("/collection/{slug}", response_class=HTMLResponse)
async def seo_collection(slug: str, db: AsyncSession = Depends(get_db)):
    genres = await _get_genres_with_counts(db)
    tags_by_cat = await _get_tags_by_category(db)
    collections = list(STATIC_COLLECTIONS) + _build_dynamic_collections(genres, tags_by_cat)
    collection = next((item for item in collections if item["slug"] == slug), None)
    if not collection:
        return page_shell(
            title="Collection not found | MusicBox",
            description="Open MusicBox to browse music collections, songs and lyrics.",
            path=f"/collection/{slug}",
            fallback_html=fallback_page("Collection not found", "Browse MusicBox collections.", '<p><a href="/explore">Explore collections</a></p>'),
            robots="noindex,follow",
        )
    tracks = await _resolve_tracks(db, collection["query"])
    name = collection_name(collection)
    body = f"<h2>Tracks</h2>{track_links([track_obj_from_dict(item) for item in tracks[:100]])}"
    canonical = abs_url(f"/collection/{slug}")
    return page_shell(
        title=f"{name} | MusicBox collection",
        description=f"Listen to the {name} collection on MusicBox with songs, lyrics and genre-based discovery.",
        path=f"/collection/{slug}",
        fallback_html=fallback_page(name, "MusicBox collection.", body),
        graph_nodes=[breadcrumb_graph(canonical, [("MusicBox", SITE_URL), ("Explore", abs_url("/explore")), (name, canonical)])],
    )


class DictTrack:
    def __init__(self, item: dict):
        self.slug = item["slug"]
        self.title = item["title"]
        self.artist = item["artist"]


def track_obj_from_dict(item: dict) -> DictTrack:
    return DictTrack(item)


@router.get("/playlist/{playlist_id}", response_class=HTMLResponse)
async def seo_playlist(playlist_id: str, db: AsyncSession = Depends(get_db)):
    try:
        pid = uuid.UUID(playlist_id)
    except ValueError:
        return private_playlist_shell(playlist_id)

    result = await db.execute(
        select(Playlist)
        .where(Playlist.id == pid, Playlist.is_public == True)
        .order_by(desc(Playlist.updated_at))
    )
    playlist = result.scalar_one_or_none()
    if not playlist:
        return private_playlist_shell(playlist_id)

    tracks_result = await db.execute(
        select(Track)
        .join(PlaylistTrack, PlaylistTrack.track_id == Track.id)
        .where(PlaylistTrack.playlist_id == pid)
        .order_by(PlaylistTrack.position)
        .limit(120)
    )
    tracks = list(tracks_result.scalars().all())
    canonical = abs_url(f"/playlist/{playlist.id}")
    body = f"<h2>Tracks</h2>{track_links(tracks)}"
    description = normalize_public_music_text(playlist.description) if playlist.description else (
        f"Listen to the {playlist.name} playlist on MusicBox."
    )
    return page_shell(
        title=f"{playlist.name} | MusicBox playlist",
        description=description,
        path=f"/playlist/{playlist.id}",
        fallback_html=fallback_page(playlist.name, description, body),
        graph_nodes=[breadcrumb_graph(canonical, [("MusicBox", SITE_URL), ("Playlists", abs_url("/playlists")), (playlist.name, canonical)])],
    )


def private_playlist_shell(playlist_id: str) -> HTMLResponse:
    return page_shell(
        title="Playlist | MusicBox",
        description="Open MusicBox to view this playlist.",
        path=f"/playlist/{playlist_id}",
        fallback_html=fallback_page("MusicBox playlist", "Open the app to view this playlist.", ""),
        robots="noindex,follow",
    )


@router.get("/favorites", response_class=HTMLResponse)
async def seo_favorites():
    return page_shell(
        title="Favorites | MusicBox",
        description="Sign in to MusicBox to view saved songs and playlists.",
        path="/favorites",
        fallback_html=fallback_page("Favorites", "Sign in to view saved songs.", ""),
        robots="noindex,follow",
    )


@router.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    return PlainTextResponse(
        "\n".join([
            "User-agent: *",
            "Allow: /",
            "Disallow: /api/",
            "Disallow: /admin",
            "Disallow: /settings",
            "Disallow: /login",
            "Disallow: /register",
            "Disallow: /favorites",
            f"Sitemap: {SITE_URL}/sitemap.xml",
            "",
        ])
    )


@router.get("/opensearch.xml")
async def opensearch_xml():
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>{SITE_NAME}</ShortName>
  <Description>Search songs, artists, lyrics, genres and playlists on MusicBox.</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image height="32" width="32" type="image/png">{SITE_URL}/favicon-32x32.png</Image>
  <Url type="text/html" method="get" template="{SITE_URL}/browse?q={{searchTerms}}" />
  <Url type="application/json" method="get" template="{SITE_URL}/api/tracks?search={{searchTerms}}" />
</OpenSearchDescription>
"""
    return Response(xml, media_type="application/opensearchdescription+xml")


@router.get("/sitemap.xml")
async def sitemap_xml(db: AsyncSession = Depends(get_db)):
    latest_result = await db.execute(select(func.max(Track.uploaded_at)))
    latest_track_date = latest_result.scalar_one_or_none()
    urls: list[tuple[str, str, str]] = [
        (SITE_URL + "/", iso_date(latest_track_date), "daily"),
        (abs_url("/browse"), iso_date(latest_track_date), "daily"),
        (abs_url("/explore"), iso_date(latest_track_date), "weekly"),
        (abs_url("/playlists"), iso_date(latest_track_date), "weekly"),
    ]

    tracks_result = await db.execute(select(Track.slug, Track.uploaded_at).order_by(desc(Track.uploaded_at)))
    urls.extend((abs_url(f"/track/{slug}"), iso_date(uploaded_at), "weekly") for slug, uploaded_at in tracks_result.all())

    playlists_result = await db.execute(
        select(Playlist.id, Playlist.updated_at, Playlist.created_at)
        .where(Playlist.is_public == True)
        .order_by(desc(Playlist.updated_at))
    )
    urls.extend(
        (abs_url(f"/playlist/{playlist_id}"), iso_date(updated_at or created_at), "weekly")
        for playlist_id, updated_at, created_at in playlists_result.all()
    )

    genres = await _get_genres_with_counts(db)
    tags_by_cat = await _get_tags_by_category(db)
    collections = list(STATIC_COLLECTIONS) + _build_dynamic_collections(genres, tags_by_cat)
    urls.extend((abs_url(f"/collection/{item['slug']}"), iso_date(latest_track_date), "weekly") for item in collections)

    body = "\n".join(
        "  <url>"
        f"<loc>{esc(loc)}</loc>"
        f"<lastmod>{esc(lastmod)}</lastmod>"
        f"<changefreq>{esc(changefreq)}</changefreq>"
        "</url>"
        for loc, lastmod, changefreq in urls
    )
    xml = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n'
    return Response(xml, media_type="application/xml")


@router.get("/seo/structured-data.json")
async def structured_data_json(db: AsyncSession = Depends(get_db)):
    tracks = await newest_tracks(db, 25)
    graph = base_graph(SITE_URL, SITE_NAME, SITE_DESCRIPTION)
    graph.append({
        "@type": "ItemList",
        "@id": f"{SITE_URL}/#new-tracks",
        "name": "New MusicBox tracks",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": idx + 1,
                "url": abs_url(f"/track/{track.slug}"),
                "name": f"{track.title} - {normalize_public_music_text(track.artist)}",
            }
            for idx, track in enumerate(tracks)
        ],
    })
    return JSONResponse({"@context": "https://schema.org", "@graph": graph})


@router.get("/seo/semantic-index.json")
async def semantic_index_json(db: AsyncSession = Depends(get_db)):
    tracks = await newest_tracks(db, 1000)
    genres_result = await db.execute(select(Genre.name, Genre.slug).order_by(Genre.name))
    tags_result = await db.execute(select(Tag.name, Tag.slug).order_by(Tag.name))
    playlists_result = await db.execute(select(Playlist.name).where(Playlist.is_public == True).order_by(Playlist.name))

    phrases: list[dict] = []
    seen: set[str] = set()

    def add_phrase(scope: str, phrase: str, source: str, track: Track | None = None):
        phrase = normalize_public_music_text(phrase)
        if len(phrase) < 2:
            return
        key = f"{scope}|{phrase.casefold()}|{track.slug if track else ''}"
        if key in seen:
            return
        seen.add(key)
        item = {
            "scope": scope,
            "phrase": phrase,
            "source": source,
            "normalized": compact_spaces(phrase.casefold()),
        }
        if track:
            item["track_slug"] = track.slug
            item["track_title"] = track.title
            item["track_artist"] = normalize_public_music_text(track.artist)
            item["url"] = abs_url(f"/track/{track.slug}")
        phrases.append(item)

    site_phrases = [
        "MusicBox",
        "MusicBox music streaming",
        "MusicBox lyrics search",
        "search songs by lyrics",
        "music playlists online",
        "музыка онлайн",
        "поиск песни по строчке",
        "найти песню по тексту",
        "тексты песен MusicBox",
        "плейлисты и жанры музыки",
    ]
    for phrase in site_phrases:
        add_phrase("site-intent", phrase, "manual")

    for track in tracks:
        artist = normalize_public_music_text(track.artist)
        add_phrase("track-title", track.title, "track.title", track)
        add_phrase("artist", artist, "track.artist", track)
        add_phrase("track-artist-title", f"{track.title} {artist}", "track.title_artist", track)
        add_phrase("lyrics-intent", f"{track.title} lyrics", "track.lyrics_intent", track)
        add_phrase("lyrics-intent", f"{track.title} текст песни", "track.lyrics_intent", track)
        for genre in track.genres[:8]:
            add_phrase("track-genre", f"{track.title} {genre.name}", "track.genre", track)
        for tag in track.tags[:10]:
            add_phrase("track-tag", f"{track.title} {tag.name}", "track.tag", track)
        if track.lyrics:
            lines = [compact_spaces(line) for line in track.lyrics.splitlines()]
            useful_lines = [line for line in lines if len(line) >= 12 and not line.startswith("[")]
            for line in useful_lines[:24]:
                add_phrase("lyric-line", line[:220], "track.lyrics", track)

        for variant in build_search_terms(track.title)[1:]:
            add_phrase("keyboard-or-translit", variant, "normalization.track_title", track)
        swapped_artist = layout_swap(artist, "ru_to_en")
        if swapped_artist != artist:
            add_phrase("keyboard-or-translit", swapped_artist, "normalization.artist", track)
        if re.search(r"[а-яё]", track.title, re.IGNORECASE):
            add_phrase("keyboard-or-translit", transliterate_ru_to_latin(track.title), "normalization.track_title", track)

    for name, slug in genres_result.all():
        add_phrase("genre", name, f"genre:{slug}")
    for name, slug in tags_result.all():
        add_phrase("tag", name, f"tag:{slug}")
    for (name,) in playlists_result.all():
        add_phrase("playlist", name, "playlist.public")

    return JSONResponse({
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "version": "2026-04-25",
        "purpose": "MusicBox semantic corpus for search, OpenSearch, sitemap audits and internal SEO planning. Do not copy into meta keywords or hidden keyword blocks.",
        "site": SITE_URL,
        "trackCount": len(tracks),
        "phraseCount": len(phrases),
        "supports": {
            "lyricsLineSearch": True,
            "keyboardLayoutVariants": True,
            "transliterationVariants": True,
            "visibleKeywordStuffing": False,
        },
        "phrases": phrases,
    })
