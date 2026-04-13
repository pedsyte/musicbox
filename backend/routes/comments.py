from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from uuid import UUID

from database import get_db
from models import Comment, User
from auth import get_current_user

router = APIRouter(prefix="/api/comments", tags=["comments"])


class CommentCreate(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Comment text is required")
        if len(v) > 1000:
            raise ValueError("Comment too long (max 1000 chars)")
        return v


@router.get("/{track_id}")
async def list_comments(
    track_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(
        select(func.count(Comment.id)).where(Comment.track_id == track_id)
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        select(Comment)
        .where(Comment.track_id == track_id)
        .order_by(Comment.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    comments = result.scalars().all()

    return {
        "comments": [
            {
                "id": c.id,
                "text": c.text,
                "username": c.user.username,
                "user_id": str(c.user_id),
                "created_at": c.created_at.isoformat(),
            }
            for c in comments
        ],
        "total": total,
    }


@router.post("/{track_id}")
async def create_comment(
    track_id: UUID,
    body: CommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    comment = Comment(
        track_id=track_id,
        user_id=user.id,
        text=body.text,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return {
        "id": comment.id,
        "text": comment.text,
        "username": user.username,
        "user_id": str(user.id),
        "created_at": comment.created_at.isoformat(),
    }


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")

    await db.delete(comment)
    await db.commit()
    return {"message": "Comment deleted"}
