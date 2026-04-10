from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from uuid import UUID

from database import get_db
from models import Favorite, Track, User
from auth import require_user
from routes.tracks import track_to_dict

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("")
async def my_favorites(
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Favorite)
        .options(selectinload(Favorite.track).selectinload(Track.genres))
        .where(Favorite.user_id == user.id)
        .order_by(Favorite.added_at.desc())
    )
    favs = result.scalars().all()
    return [track_to_dict(f.track, is_favorite=True) for f in favs if f.track]


@router.post("/{track_id}")
async def add_favorite(
    track_id: UUID,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    # Check track exists
    track_result = await db.execute(select(Track).where(Track.id == track_id))
    if not track_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Track not found")

    # Check if already favorite
    existing = await db.execute(
        select(Favorite).where(Favorite.user_id == user.id, Favorite.track_id == track_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already in favorites")

    fav = Favorite(user_id=user.id, track_id=track_id)
    db.add(fav)
    await db.commit()
    return {"message": "Added to favorites"}


@router.delete("/{track_id}")
async def remove_favorite(
    track_id: UUID,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == user.id, Favorite.track_id == track_id)
    )
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(status_code=404, detail="Not in favorites")

    await db.delete(fav)
    await db.commit()
    return {"message": "Removed from favorites"}
