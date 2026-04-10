from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Genre, TrackGenre

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
