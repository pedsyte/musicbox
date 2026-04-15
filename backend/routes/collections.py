"""
Smart Collections — auto-generated dynamic playlists.

Each collection is defined by a query (genre, tag, sort, etc.)
and tracks are resolved dynamically from the DB.
"""

import os
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import (
    Track, Genre, Tag, TagCategory, TrackGenre, TrackTag,
    Favorite, User,
)
from auth import get_current_user
from routes.tracks import track_to_dict

router = APIRouter(prefix="/api/collections", tags=["collections"])

# ---------------------------------------------------------------------------
# Collection definitions
# ---------------------------------------------------------------------------

# Each collection: slug, name_key (i18n), icon, group_key (i18n), query builder
# name_key / group_key are translation keys resolved on the frontend

STATIC_COLLECTIONS = [
    # --- Популярное ---
    {"slug": "top-100", "name_key": "collections.top100", "icon": "🔥", "group_key": "collections.groupPopular",
     "query": {"sort": "popular", "limit": 100}},
    {"slug": "most-played", "name_key": "collections.mostPlayed", "icon": "📈", "group_key": "collections.groupPopular",
     "query": {"sort": "play_count", "limit": 100}},

    # --- Новинки ---
    {"slug": "new-releases", "name_key": "collections.newReleases", "icon": "🆕", "group_key": "collections.groupNew",
     "query": {"sort": "newest", "limit": 100}},

    # --- По энергии ---
    {"slug": "energy-high", "name_key": "collections.energyHigh", "icon": "⚡", "group_key": "collections.groupEnergy",
     "query": {"tag_category": "energy", "tag_slug": "высокая", "limit": 100}},
    {"slug": "energy-chill", "name_key": "collections.energyChill", "icon": "🧘", "group_key": "collections.groupEnergy",
     "query": {"tag_category": "energy", "tag_slug": "низкая", "limit": 100}},

    # --- По вокалу ---
    {"slug": "vocal-male", "name_key": "collections.vocalMale", "icon": "🎤", "group_key": "collections.groupVocal",
     "query": {"tag_category": "vocal", "tag_slug": "мужской", "limit": 100}},
    {"slug": "vocal-female", "name_key": "collections.vocalFemale", "icon": "🎙️", "group_key": "collections.groupVocal",
     "query": {"tag_category": "vocal", "tag_slug": "женский", "limit": 100}},
    {"slug": "instrumental", "name_key": "collections.instrumental", "icon": "🎹", "group_key": "collections.groupVocal",
     "query": {"tag_category": "vocal", "tag_slug": "инструментал", "limit": 100}},
]


def _build_dynamic_collections(genres: list[dict], tags_by_cat: dict[str, list[dict]]) -> list[dict]:
    """Build collections from actual DB data (genres, tags)."""
    items = []

    # By mood
    for t in tags_by_cat.get("mood", []):
        items.append({
            "slug": f"mood-{t['slug']}",
            "name": t["name"],
            "icon": "😌",
            "group_key": "collections.groupMood",
            "query": {"tag_category": "mood", "tag_slug": t["slug"], "limit": 100},
        })

    # By language
    for t in tags_by_cat.get("language", []):
        if t["slug"] == "инструментал":
            continue  # already in vocal group
        items.append({
            "slug": f"lang-{t['slug']}",
            "name": t["name"],
            "icon": "🌍",
            "group_key": "collections.groupLanguage",
            "query": {"tag_category": "language", "tag_slug": t["slug"], "limit": 100},
        })

    # By genre — only genres with ≥1 track
    for g in genres:
        if g["track_count"] < 1:
            continue
        items.append({
            "slug": f"genre-{g['slug']}",
            "name": g["name"],
            "icon": "🎵",
            "group_key": "collections.groupGenre",
            "query": {"genre_slug": g["slug"], "limit": 100},
        })

    # By era
    for t in tags_by_cat.get("era", []):
        items.append({
            "slug": f"era-{t['slug']}",
            "name": t["name"],
            "icon": "📅",
            "group_key": "collections.groupEra",
            "query": {"tag_category": "era", "tag_slug": t["slug"], "limit": 100},
        })

    # By occasion
    for t in tags_by_cat.get("occasion", []):
        items.append({
            "slug": f"occasion-{t['slug']}",
            "name": t["name"],
            "icon": "🎧",
            "group_key": "collections.groupOccasion",
            "query": {"tag_category": "occasion", "tag_slug": t["slug"], "limit": 100},
        })

    return items


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_genres_with_counts(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Genre.id, Genre.name, Genre.slug, func.count(TrackGenre.track_id).label("cnt"))
        .outerjoin(TrackGenre, TrackGenre.genre_id == Genre.id)
        .group_by(Genre.id)
        .having(func.count(TrackGenre.track_id) >= 1)
        .order_by(desc("cnt"))
    )
    return [{"id": r.id, "name": r.name, "slug": r.slug, "track_count": r.cnt} for r in result.all()]


async def _get_tags_by_category(db: AsyncSession) -> dict[str, list[dict]]:
    result = await db.execute(
        select(
            TagCategory.slug.label("cat_slug"),
            Tag.id, Tag.name, Tag.slug,
            func.count(TrackTag.track_id).label("cnt"),
        )
        .join(Tag, Tag.category_id == TagCategory.id)
        .outerjoin(TrackTag, TrackTag.tag_id == Tag.id)
        .where(Tag.enabled == True)
        .group_by(TagCategory.slug, Tag.id, Tag.name, Tag.slug)
        .having(func.count(TrackTag.track_id) >= 1)
        .order_by(desc("cnt"))
    )
    out: dict[str, list[dict]] = {}
    for r in result.all():
        out.setdefault(r.cat_slug, []).append({
            "id": r.id, "name": r.name, "slug": r.slug, "track_count": r.cnt,
        })
    return out


async def _resolve_tracks(
    db: AsyncSession,
    query: dict,
    user: User | None = None,
) -> list[dict]:
    """Run a collection query and return serialized tracks."""
    q = select(Track).options(
        selectinload(Track.genres), selectinload(Track.tags).selectinload(Tag.category)
    )

    # Filters
    if "genre_slug" in query:
        q = q.join(TrackGenre, TrackGenre.track_id == Track.id).join(
            Genre, Genre.id == TrackGenre.genre_id
        ).where(Genre.slug == query["genre_slug"])

    if "tag_category" in query and "tag_slug" in query:
        q = q.join(TrackTag, TrackTag.track_id == Track.id).join(
            Tag, Tag.id == TrackTag.tag_id
        ).join(TagCategory, TagCategory.id == Tag.category_id).where(
            TagCategory.slug == query["tag_category"],
            Tag.slug == query["tag_slug"],
        )

    # Ordering
    sort = query.get("sort", "newest")
    if sort == "popular" or sort == "play_count":
        q = q.order_by(Track.play_count.desc(), Track.uploaded_at.desc())
    elif sort == "newest":
        q = q.order_by(Track.uploaded_at.desc())
    else:
        q = q.order_by(Track.uploaded_at.desc())

    q = q.limit(query.get("limit", 100))

    result = await db.execute(q)
    tracks = result.scalars().unique().all()

    # Favorites lookup
    fav_ids: set = set()
    if user:
        fav_result = await db.execute(
            select(Favorite.track_id).where(Favorite.user_id == user.id)
        )
        fav_ids = {r[0] for r in fav_result.all()}

    return [track_to_dict(t, is_favorite=(t.id in fav_ids)) for t in tracks]


def _collection_preview(tracks: list[dict]) -> dict:
    """Build preview data for a collection card."""
    covers = list(dict.fromkeys(t["cover_path"] for t in tracks[:8] if t.get("cover_path")))[:4]
    return {
        "track_count": len(tracks),
        "total_duration": sum(t.get("duration_seconds", 0) for t in tracks),
        "covers": covers,
        "preview_tracks": [{"title": t["title"], "artist": t["artist"]} for t in tracks[:5]],
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("")
async def list_collections(db: AsyncSession = Depends(get_db)):
    """
    Return all collection groups with their collections (metadata only, no tracks).
    Each collection has: slug, name/name_key, icon, group_key, track_count, covers, preview_tracks.
    """
    genres = await _get_genres_with_counts(db)
    tags_by_cat = await _get_tags_by_category(db)

    all_collections = list(STATIC_COLLECTIONS) + _build_dynamic_collections(genres, tags_by_cat)

    # Resolve minimal track data for previews
    result_items = []
    for coll in all_collections:
        tracks = await _resolve_tracks(db, coll["query"])
        if not tracks:
            continue  # skip empty collections
        preview = _collection_preview(tracks)
        item = {
            "slug": coll["slug"],
            "name": coll.get("name") or None,
            "name_key": coll.get("name_key") or None,
            "icon": coll["icon"],
            "group_key": coll["group_key"],
            **preview,
        }
        result_items.append(item)

    # Group by group_key
    groups: dict[str, list] = {}
    for item in result_items:
        gk = item["group_key"]
        groups.setdefault(gk, []).append(item)

    # Define group order
    group_order = [
        "collections.groupPopular",
        "collections.groupNew",
        "collections.groupMood",
        "collections.groupGenre",
        "collections.groupLanguage",
        "collections.groupEnergy",
        "collections.groupVocal",
        "collections.groupEra",
        "collections.groupOccasion",
    ]

    result = []
    for gk in group_order:
        if gk in groups:
            result.append({"group_key": gk, "collections": groups[gk]})

    return result


@router.get("/{slug}")
async def get_collection(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    """Return full collection detail with all tracks."""
    genres = await _get_genres_with_counts(db)
    tags_by_cat = await _get_tags_by_category(db)

    all_collections = list(STATIC_COLLECTIONS) + _build_dynamic_collections(genres, tags_by_cat)

    coll = next((c for c in all_collections if c["slug"] == slug), None)
    if not coll:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Collection not found")

    tracks = await _resolve_tracks(db, coll["query"], user)
    preview = _collection_preview(tracks)

    return {
        "slug": coll["slug"],
        "name": coll.get("name") or None,
        "name_key": coll.get("name_key") or None,
        "icon": coll["icon"],
        "group_key": coll["group_key"],
        **preview,
        "tracks": tracks,
    }
