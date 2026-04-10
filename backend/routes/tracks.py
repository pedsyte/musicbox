from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
import os
import mimetypes

from fastapi.responses import FileResponse, StreamingResponse

from database import get_db
from models import Track, Genre, TrackGenre
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
        "uploaded_at": track.uploaded_at.isoformat(),
        "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in track.genres],
        "is_favorite": is_favorite,
    }


@router.get("")
async def list_tracks(
    genres: Optional[str] = Query(None, description="Comma-separated genre slugs to include"),
    exclude: Optional[str] = Query(None, description="Comma-separated genre slugs to exclude"),
    search: Optional[str] = Query(None),
    sort: str = Query("newest", regex="^(newest|oldest|popular|title)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Track).options(selectinload(Track.genres))

    # Include filter: tracks that have ANY of the specified genres
    if genres:
        include_slugs = [s.strip() for s in genres.split(",") if s.strip()]
        if include_slugs:
            genre_ids_q = select(Genre.id).where(Genre.slug.in_(include_slugs))
            track_ids_q = select(TrackGenre.track_id).where(
                TrackGenre.genre_id.in_(genre_ids_q)
            ).distinct()
            query = query.where(Track.id.in_(track_ids_q))

    # Exclude filter: exclude tracks that have ANY of the specified genres
    if exclude:
        exclude_slugs = [s.strip() for s in exclude.split(",") if s.strip()]
        if exclude_slugs:
            excl_genre_ids = select(Genre.id).where(Genre.slug.in_(exclude_slugs))
            excl_track_ids = select(TrackGenre.track_id).where(
                TrackGenre.genre_id.in_(excl_genre_ids)
            ).distinct()
            query = query.where(Track.id.notin_(excl_track_ids))

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

    # Increment play count
    track.play_count += 1
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

    safe_title = "".join(c for c in track.title if c.isalnum() or c in " -_").strip()
    filename = f"{safe_title} - {track.artist}.{ext}"

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
