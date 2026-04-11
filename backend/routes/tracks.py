from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc, asc, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta
import os

from fastapi.responses import FileResponse

from database import get_db
from models import Track, Genre, TrackGenre, TrackEvent, PlaylistTrack
from auth import get_current_user, require_user
from models import User, Favorite

router = APIRouter(prefix="/api/tracks", tags=["tracks"])


def track_to_dict(track: Track, is_favorite: bool = False) -> dict:
    return {
        "id": str(track.id),
        "title": track.title,
        "artist": track.artist,
        "duration_seconds": track.duration_seconds,
        "cover_path": f"/uploads/covers/{os.path.basename(track.cover_path)}" if track.cover_path else None,
        "has_lyrics": bool(track.lyrics),
        "play_count": track.play_count,
        "download_count": track.download_count,
        "uploaded_at": track.uploaded_at.isoformat(),
        "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in track.genres],
        "is_favorite": is_favorite,
    }


@router.get("")
async def list_tracks(
    genre_ids: Optional[str] = Query(None, description="Comma-separated genre IDs to include"),
    exclude_genre_ids: Optional[str] = Query(None, description="Comma-separated genre IDs to exclude"),
    genres: Optional[str] = Query(None, description="Comma-separated genre slugs to include"),
    exclude: Optional[str] = Query(None, description="Comma-separated genre slugs to exclude"),
    artist: Optional[str] = Query(None, description="Exact artist name filter"),
    search: Optional[str] = Query(None),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Track).options(selectinload(Track.genres))

    # Include filter by IDs
    if genre_ids:
        ids = [int(x) for x in genre_ids.split(",") if x.strip().isdigit()]
        if ids:
            track_ids_q = select(TrackGenre.track_id).where(TrackGenre.genre_id.in_(ids)).distinct()
            query = query.where(Track.id.in_(track_ids_q))

    # Include filter by slugs (backward compat)
    if genres:
        include_slugs = [s.strip() for s in genres.split(",") if s.strip()]
        if include_slugs:
            genre_ids_q = select(Genre.id).where(Genre.slug.in_(include_slugs))
            track_ids_q = select(TrackGenre.track_id).where(TrackGenre.genre_id.in_(genre_ids_q)).distinct()
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
            .options(selectinload(Track.genres))
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
            .options(selectinload(Track.genres))
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
        select(Track).options(selectinload(Track.genres)).where(Track.id == track_id)
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
    data["lyrics"] = track.lyrics
    data["waveform_peaks"] = track.waveform_peaks
    return data


@router.get("/{track_id}/stream")
async def stream_track(track_id: UUID, db: AsyncSession = Depends(get_db)):
    from fastapi import Request
    from starlette.requests import Request as StarletteRequest

    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    file_path = track.mp3_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")

    # Increment play count + log event
    track.play_count += 1
    db.add(TrackEvent(track_id=track.id, event_type="play"))
    await db.commit()

    return FileResponse(
        file_path,
        media_type="audio/mpeg",
        headers={"Accept-Ranges": "bytes"},
    )


@router.get("/{track_id}/waveform")
async def get_waveform(track_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return {"peaks": track.waveform_peaks or []}


@router.get("/{track_id}/download")
async def download_track(
    track_id: UUID,
    format: str = Query("mp3", regex="^(wav|mp3)$"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    if format == "wav":
        file_path = track.file_path
        media_type = "audio/wav"
        ext = "wav"
    else:
        file_path = track.mp3_path
        media_type = "audio/mpeg"
        ext = "mp3"

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Track download
    track.download_count += 1
    db.add(TrackEvent(track_id=track.id, event_type="download"))
    await db.commit()

    safe_title = "".join(c for c in track.title if c.isalnum() or c in " -_").strip()
    filename = f"{safe_title} - {track.artist}.{ext}"

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
