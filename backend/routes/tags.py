from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import TagCategory, Tag, TrackTag, Track
from auth import require_admin

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("")
async def list_tags(db: AsyncSession = Depends(get_db)):
    """Return all tag categories with their enabled tags and track counts."""
    result = await db.execute(
        select(TagCategory)
        .options(selectinload(TagCategory.tags))
        .order_by(TagCategory.sort_order)
    )
    categories = result.scalars().all()

    # Get track counts for all tags
    count_result = await db.execute(
        select(TrackTag.tag_id, func.count(TrackTag.track_id).label("cnt"))
        .group_by(TrackTag.tag_id)
    )
    counts = {row[0]: row[1] for row in count_result.all()}

    return [
        {
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "icon": cat.icon,
            "tags": [
                {
                    "id": tag.id,
                    "name": tag.name,
                    "slug": tag.slug,
                    "track_count": counts.get(tag.id, 0),
                    "translations": tag.translations or {},
                }
                for tag in cat.tags
                if tag.enabled
            ],
        }
        for cat in categories
    ]


@router.post("/tracks/{track_id}/{tag_id}")
async def add_tag_to_track(
    track_id: str,
    tag_id: int,
    user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    track = await db.get(Track, track_id)
    if not track:
        raise HTTPException(404, "Track not found")
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(404, "Tag not found")

    existing = await db.execute(
        select(TrackTag).where(TrackTag.track_id == track_id, TrackTag.tag_id == tag_id)
    )
    if existing.scalar_one_or_none():
        return {"status": "already_exists"}

    db.add(TrackTag(track_id=track_id, tag_id=tag_id))
    await db.commit()
    return {"status": "added"}


@router.delete("/tracks/{track_id}/{tag_id}")
async def remove_tag_from_track(
    track_id: str,
    tag_id: int,
    user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TrackTag).where(TrackTag.track_id == track_id, TrackTag.tag_id == tag_id)
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(404, "Tag not linked")
    await db.delete(link)
    await db.commit()
    return {"status": "removed"}
