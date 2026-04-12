from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Genre, TrackGenre, Track
from auth import require_admin

router = APIRouter(prefix="/api/genres", tags=["genres"])


@router.get("")
async def list_genres(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Genre, func.count(TrackGenre.track_id).label("track_count"))
        .outerjoin(TrackGenre, Genre.id == TrackGenre.genre_id)
        .group_by(Genre.id)
        .having(func.count(TrackGenre.track_id) > 0)
        .order_by(Genre.name)
    )
    rows = result.all()
    return [
        {
            "id": genre.id,
            "name": genre.name,
            "slug": genre.slug,
            "track_count": count,
        }
        for genre, count in rows
    ]


@router.get("/all")
async def all_genres(db: AsyncSession = Depends(get_db)):
    """All genres including empty ones."""
    result = await db.execute(select(Genre).order_by(Genre.name))
    return [
        {"id": g.id, "name": g.name, "slug": g.slug}
        for g in result.scalars().all()
    ]


@router.post("/tracks/{track_id}/{genre_id}")
async def add_genre_to_track(
    track_id: str,
    genre_id: int,
    user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    track = await db.get(Track, track_id)
    if not track:
        raise HTTPException(404, "Track not found")
    genre = await db.get(Genre, genre_id)
    if not genre:
        raise HTTPException(404, "Genre not found")

    existing = await db.execute(
        select(TrackGenre).where(
            TrackGenre.track_id == track_id, TrackGenre.genre_id == genre_id
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "already_exists"}

    db.add(TrackGenre(track_id=track_id, genre_id=genre_id))
    await db.commit()
    return {"status": "added"}


@router.delete("/tracks/{track_id}/{genre_id}")
async def remove_genre_from_track(
    track_id: str,
    genre_id: int,
    user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    track = await db.get(Track, track_id)
    if not track:
        raise HTTPException(404, "Track not found")

    result = await db.execute(
        delete(TrackGenre).where(
            TrackGenre.track_id == track_id, TrackGenre.genre_id == genre_id
        )
    )
    await db.commit()
    if result.rowcount == 0:
        return {"status": "not_found"}
    return {"status": "removed"}
