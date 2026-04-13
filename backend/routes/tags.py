from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import TagCategory, Tag, TrackTag

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
                }
                for tag in cat.tags
                if tag.enabled
            ],
        }
        for cat in categories
    ]
