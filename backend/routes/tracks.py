from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc, asc, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta
import os
import tempfile
import json

from fastapi.responses import FileResponse

from database import get_db
from models import Track, Genre, TrackGenre, TrackEvent, PlaylistTrack, SiteSetting, Tag, TrackTag
from auth import get_current_user, require_user
from models import User, Favorite
from audio import convert_audio, get_available_download_formats, FORMAT_MIME, CONVERTED_DIR, STREAM_QUALITIES

router = APIRouter(prefix="/api/tracks", tags=["tracks"])


def track_to_dict(track: Track, is_favorite: bool = False) -> dict:
    return {
        "id": str(track.id),
        "title": track.title,
        "artist": track.artist,
        "duration_seconds": track.duration_seconds,
        "cover_path": f"/uploads/covers/{os.path.basename(track.cover_path)}" if track.cover_path else None,
        "description": track.description,
        "has_lyrics": bool(track.lyrics),
        "play_count": track.play_count,
        "download_count": track.download_count,
        "original_format": track.original_format or "wav",
        "uploaded_at": track.uploaded_at.isoformat(),
        "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in track.genres],
        "tags": [{"id": t.id, "name": t.name, "slug": t.slug, "category_id": t.category_id} for t in (track.tags or [])],
        "is_favorite": is_favorite,
    }


@router.get("")
async def list_tracks(
    genre_ids: Optional[str] = Query(None, description="Comma-separated genre IDs to include"),
    exclude_genre_ids: Optional[str] = Query(None, description="Comma-separated genre IDs to exclude"),
    genres: Optional[str] = Query(None, description="Comma-separated genre slugs to include"),
    exclude: Optional[str] = Query(None, description="Comma-separated genre slugs to exclude"),
    artist: Optional[str] = Query(None, description="Exact artist name filter"),
    tag_ids: Optional[str] = Query(None, description="Comma-separated tag IDs to include (AND logic)"),
    search: Optional[str] = Query(None),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Track).options(selectinload(Track.genres), selectinload(Track.tags))

    # Include filter by IDs (AND logic — track must have ALL selected genres)
    if genre_ids:
        ids = [int(x) for x in genre_ids.split(",") if x.strip().isdigit()]
        if ids:
            track_ids_q = (
                select(TrackGenre.track_id)
                .where(TrackGenre.genre_id.in_(ids))
                .group_by(TrackGenre.track_id)
                .having(func.count(TrackGenre.genre_id.distinct()) == len(ids))
            )
            query = query.where(Track.id.in_(track_ids_q))

    # Include filter by slugs (backward compat, AND logic)
    if genres:
        include_slugs = [s.strip() for s in genres.split(",") if s.strip()]
        if include_slugs:
            genre_ids_q = select(Genre.id).where(Genre.slug.in_(include_slugs))
            track_ids_q = (
                select(TrackGenre.track_id)
                .where(TrackGenre.genre_id.in_(genre_ids_q))
                .group_by(TrackGenre.track_id)
                .having(func.count(TrackGenre.genre_id.distinct()) == len(include_slugs))
            )
            query = query.where(Track.id.in_(track_ids_q))

    # Exclude filter by IDs
    if exclude_genre_ids:
        ids = [int(x) for x in exclude_genre_ids.split(",") if x.strip().isdigit()]
        if ids:
            excl_track_ids = select(TrackGenre.track_id).where(TrackGenre.genre_id.in_(ids)).distinct()
            query = query.where(Track.id.notin_(excl_track_ids))

    # Exclude filter by slugs (backward compat)
    if exclude:
        exclude_slugs = [s.strip() for s in exclude.split(",") if s.strip()]
        if exclude_slugs:
            excl_genre_ids = select(Genre.id).where(Genre.slug.in_(exclude_slugs))
            excl_track_ids = select(TrackGenre.track_id).where(TrackGenre.genre_id.in_(excl_genre_ids)).distinct()
            query = query.where(Track.id.notin_(excl_track_ids))

    # Artist exact filter
    if artist:
        query = query.where(Track.artist == artist)

    # Tag filter (AND logic — track must have ALL selected tags)
    if tag_ids:
        tids = [int(x) for x in tag_ids.split(",") if x.strip().isdigit()]
        if tids:
            tag_track_ids = (
                select(TrackTag.track_id)
                .where(TrackTag.tag_id.in_(tids))
                .group_by(TrackTag.track_id)
                .having(func.count(TrackTag.tag_id.distinct()) == len(tids))
            )
            query = query.where(Track.id.in_(tag_track_ids))

    # Search
    if search:
        like = f"%{search}%"
        query = query.where(
            (Track.title.ilike(like)) | (Track.artist.ilike(like))
        )

    # Count total
    count_q = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # Sort
    if sort == "newest":
        query = query.order_by(desc(Track.uploaded_at))
    elif sort == "oldest":
        query = query.order_by(asc(Track.uploaded_at))
    elif sort == "popular":
        query = query.order_by(desc(Track.play_count))
    elif sort == "title":
        query = query.order_by(asc(Track.title))
    elif sort == "artist":
        query = query.order_by(asc(Track.artist))
    elif sort == "duration":
        query = query.order_by(desc(Track.duration_seconds))
    else:
        query = query.order_by(desc(Track.uploaded_at))

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    tracks = result.scalars().unique().all()

    # Get favorites for current user
    fav_ids = set()
    if user:
        fav_result = await db.execute(
            select(Favorite.track_id).where(Favorite.user_id == user.id)
        )
        fav_ids = {row[0] for row in fav_result.all()}

    return {
        "tracks": [track_to_dict(t, t.id in fav_ids) for t in tracks],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/popular")
async def popular_tracks(
    period: str = Query("all", description="day, week, month, all"),
    limit: int = Query(20, ge=1, le=100),
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if period == "all":
        query = (
            select(Track)
            .options(selectinload(Track.genres), selectinload(Track.tags))
            .order_by(desc(Track.play_count + Track.download_count * 3))
            .limit(limit)
        )
    else:
        now = datetime.utcnow()
        if period == "day":
            since = now - timedelta(days=1)
        elif period == "week":
            since = now - timedelta(weeks=1)
        elif period == "month":
            since = now - timedelta(days=30)
        else:
            since = datetime(2000, 1, 1)

        score_expr = func.sum(
            case(
                (TrackEvent.event_type == "play", 1),
                (TrackEvent.event_type == "download", 3),
                (TrackEvent.event_type == "favorite", 2),
                (TrackEvent.event_type == "playlist_add", 2),
                else_=0,
            )
        ).label("score")

        subq = (
            select(TrackEvent.track_id, score_expr)
            .where(TrackEvent.created_at >= since)
            .group_by(TrackEvent.track_id)
            .order_by(desc("score"))
            .limit(limit)
            .subquery()
        )

        query = (
            select(Track)
            .options(selectinload(Track.genres), selectinload(Track.tags))
            .join(subq, Track.id == subq.c.track_id)
            .order_by(desc(subq.c.score))
        )

    result = await db.execute(query)
    tracks = result.scalars().unique().all()

    fav_ids = set()
    if user:
        fav_result = await db.execute(select(Favorite.track_id).where(Favorite.user_id == user.id))
        fav_ids = {row[0] for row in fav_result.all()}

    return [track_to_dict(t, t.id in fav_ids) for t in tracks]


@router.get("/{track_id}")
async def get_track(
    track_id: UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Track).options(selectinload(Track.genres), selectinload(Track.tags)).where(Track.id == track_id)
    )
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    is_fav = False
    if user:
        fav = await db.execute(
            select(Favorite).where(Favorite.user_id == user.id, Favorite.track_id == track_id)
        )
        is_fav = fav.scalar_one_or_none() is not None

    data = track_to_dict(track, is_fav)
    data["description"] = track.description
    data["lyrics"] = track.lyrics
    data["waveform_peaks"] = track.waveform_peaks
    return data


@router.get("/{track_id}/stream")
async def stream_track(
    track_id: UUID,
    quality: str = Query("original"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    orig_format = track.original_format or "wav"

    # Validate quality option
    allowed_qualities = STREAM_QUALITIES.get(orig_format, ["original"])
    if quality not in allowed_qualities:
        quality = "original"

    if quality == "original" or quality == orig_format:
        # Serve original file
        file_path = track.file_path
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Audio file not found")
        mime = FORMAT_MIME.get(orig_format, "application/octet-stream")
    else:
        # Serve converted/cached file
        cache_dir = os.path.join(CONVERTED_DIR, "stream_cache")
        os.makedirs(cache_dir, exist_ok=True)
        cached_path = os.path.join(cache_dir, f"{track.id}.{quality}")

        if not os.path.exists(cached_path):
            # Convert and cache
            success = convert_audio(track.file_path, cached_path, quality)
            if not success:
                # Fallback to original
                file_path = track.file_path
                mime = FORMAT_MIME.get(orig_format, "application/octet-stream")
                track.play_count += 1
                db.add(TrackEvent(track_id=track.id, event_type="play"))
                await db.commit()
                return FileResponse(file_path, media_type=mime, headers={"Accept-Ranges": "bytes"})

        file_path = cached_path
        mime = FORMAT_MIME.get(quality, "application/octet-stream")

    # Increment play count + log event
    track.play_count += 1
    db.add(TrackEvent(track_id=track.id, event_type="play"))
    await db.commit()

    return FileResponse(
        file_path,
        media_type=mime,
        headers={"Accept-Ranges": "bytes"},
    )


@router.get("/{track_id}/stream-qualities")
async def get_stream_qualities(track_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    orig = track.original_format or "wav"
    qualities = STREAM_QUALITIES.get(orig, ["original"])
    return {"original_format": orig, "qualities": qualities}


@router.get("/{track_id}/waveform")
async def get_waveform(track_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return {"peaks": track.waveform_peaks or []}


@router.get("/{track_id}/formats")
async def get_track_formats(track_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    orig = track.original_format or "wav"
    return {
        "original": orig,
        "formats": get_available_download_formats(orig),
        "stream_qualities": STREAM_QUALITIES.get(orig, ["original"]),
    }


@router.get("/{track_id}/download")
async def download_track(
    track_id: UUID,
    format: str = Query("original"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Track).options(selectinload(Track.genres), selectinload(Track.tags)).where(Track.id == track_id)
    )
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    orig_format = track.original_format or "wav"

    # "original" means download in original format
    if format == "original":
        format = orig_format

    # Validate format is allowed
    available = get_available_download_formats(orig_format)
    if format not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Format '{format}' not available. Allowed: {', '.join(available)}"
        )

    # Build metadata tags
    metadata = {}

    # Load static metadata from site settings
    settings_result = await db.execute(select(SiteSetting))
    settings = {s.key: s.value for s in settings_result.scalars().all()}
    static_meta_json = settings.get("download_metadata_static", "{}")
    try:
        static_meta = json.loads(static_meta_json)
    except (json.JSONDecodeError, TypeError):
        static_meta = {}

    # Apply static metadata first
    for key, value in static_meta.items():
        if value:
            metadata[key] = str(value)

    # Dynamic metadata (overrides static if same key)
    metadata["title"] = track.title
    metadata["artist"] = track.artist
    if track.genres:
        metadata["genre"] = ", ".join(g.name for g in track.genres)

    # Tag-based metadata
    if track.tags:
        tag_by_cat: dict[str, list[str]] = {}
        for tag in track.tags:
            cat_slug = tag.category.slug if tag.category else ""
            tag_by_cat.setdefault(cat_slug, []).append(tag.name)
        # Map category slugs to metadata keys
        TAG_META_MAP = {
            "language": "language",
            "mood": "mood",
            "vocal": "vocal",
            "energy": "energy",
            "occasion": "occasion",
            "era": "date",
        }
        for cat_slug, tag_names in tag_by_cat.items():
            meta_key = TAG_META_MAP.get(cat_slug, cat_slug)
            metadata[meta_key] = ", ".join(tag_names)

    # Add website comment from settings
    site_url = settings.get("download_metadata_url", "")
    if site_url:
        metadata["comment"] = f"Downloaded from {site_url}"
        metadata["url"] = site_url

    safe_title = "".join(c for c in track.title if c.isalnum() or c in " -_").strip()
    filename = f"{safe_title} - {track.artist}.{format}"
    mime = FORMAT_MIME.get(format, "application/octet-stream")

    # If requesting original format, still need to rewrite metadata
    # Always convert/re-encode to inject clean metadata
    tmp_dir = os.path.join(CONVERTED_DIR, "tmp")
    os.makedirs(tmp_dir, exist_ok=True)
    tmp_path = os.path.join(tmp_dir, f"{track.id}_{format}.{format}")

    success = convert_audio(track.file_path, tmp_path, format, metadata)
    if not success:
        raise HTTPException(status_code=500, detail="Conversion failed")

    # Track download
    track.download_count += 1
    db.add(TrackEvent(track_id=track.id, event_type="download"))
    await db.commit()

    # Use RFC 5987 encoding for unicode filenames
    from urllib.parse import quote
    encoded_fn = quote(filename)

    return FileResponse(
        tmp_path,
        media_type=mime,
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_fn}"},
    )
