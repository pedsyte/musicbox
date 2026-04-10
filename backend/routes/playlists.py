import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Playlist, PlaylistTrack, Track, User
from auth import require_user, get_current_user

router = APIRouter(prefix="/api/playlists", tags=["playlists"])


class PlaylistCreate(BaseModel):
    name: str
    description: str | None = None
    is_public: bool = False


class PlaylistUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None


class ReorderRequest(BaseModel):
    track_ids: list[str]


@router.get("")
async def my_playlists(
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Playlist)
        .where(Playlist.user_id == user.id)
        .order_by(Playlist.created_at.desc())
    )
    playlists = result.scalars().all()

    items = []
    for p in playlists:
        count_result = await db.execute(
            select(func.count(PlaylistTrack.track_id)).where(PlaylistTrack.playlist_id == p.id)
        )
        count = count_result.scalar() or 0

        # Get first 4 cover images for mosaic
        covers_result = await db.execute(
            select(Track.cover_path)
            .join(PlaylistTrack, Track.id == PlaylistTrack.track_id)
            .where(PlaylistTrack.playlist_id == p.id, Track.cover_path.isnot(None))
            .order_by(PlaylistTrack.position)
            .limit(4)
        )
        covers = [
            f"/uploads/covers/{row[0].split('/')[-1]}" if row[0] else None
            for row in covers_result.all()
        ]

        items.append({
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "is_public": p.is_public,
            "track_count": count,
            "covers": covers,
            "created_at": p.created_at.isoformat(),
        })
    return items


@router.get("/public")
async def public_playlists(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Playlist)
        .options(selectinload(Playlist.user))
        .where(Playlist.is_public == True)
        .order_by(Playlist.created_at.desc())
    )
    playlists = result.scalars().all()

    items = []
    for p in playlists:
        count_result = await db.execute(
            select(func.count(PlaylistTrack.track_id)).where(PlaylistTrack.playlist_id == p.id)
        )
        count = count_result.scalar() or 0

        covers_result = await db.execute(
            select(Track.cover_path)
            .join(PlaylistTrack, Track.id == PlaylistTrack.track_id)
            .where(PlaylistTrack.playlist_id == p.id, Track.cover_path.isnot(None))
            .order_by(PlaylistTrack.position)
            .limit(4)
        )
        covers = [
            f"/uploads/covers/{row[0].split('/')[-1]}" if row[0] else None
            for row in covers_result.all()
        ]

        items.append({
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "is_public": p.is_public,
            "username": p.user.username if p.user else None,
            "track_count": count,
            "covers": covers,
            "created_at": p.created_at.isoformat(),
        })
    return items


@router.post("")
async def create_playlist(
    req: PlaylistCreate,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    playlist = Playlist(
        name=req.name.strip(),
        description=req.description.strip() if req.description else None,
        is_public=req.is_public,
        user_id=user.id,
    )
    db.add(playlist)
    await db.commit()
    await db.refresh(playlist)
    return {
        "id": str(playlist.id),
        "name": playlist.name,
        "description": playlist.description,
        "is_public": playlist.is_public,
    }


@router.get("/{playlist_id}")
async def get_playlist(
    playlist_id: str,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pid = uuid.UUID(playlist_id)
    result = await db.execute(
        select(Playlist).options(selectinload(Playlist.user)).where(Playlist.id == pid)
    )
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Check access
    if not playlist.is_public:
        if not user or user.id != playlist.user_id:
            raise HTTPException(status_code=403, detail="Private playlist")

    # Get tracks
    tracks_result = await db.execute(
        select(PlaylistTrack)
        .options(selectinload(PlaylistTrack.track).selectinload(Track.genres))
        .where(PlaylistTrack.playlist_id == pid)
        .order_by(PlaylistTrack.position)
    )
    pt_list = tracks_result.scalars().all()

    from routes.tracks import track_to_dict
    tracks_data = []
    for pt in pt_list:
        t = pt.track
        if t:
            d = track_to_dict(t)
            d["position"] = pt.position
            tracks_data.append(d)

    return {
        "id": str(playlist.id),
        "name": playlist.name,
        "description": playlist.description,
        "is_public": playlist.is_public,
        "username": playlist.user.username if playlist.user else None,
        "is_owner": user is not None and user.id == playlist.user_id,
        "tracks": tracks_data,
        "created_at": playlist.created_at.isoformat(),
    }


@router.put("/{playlist_id}")
async def update_playlist(
    playlist_id: str,
    req: PlaylistUpdate,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    pid = uuid.UUID(playlist_id)
    result = await db.execute(select(Playlist).where(Playlist.id == pid, Playlist.user_id == user.id))
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found or not yours")

    if req.name is not None:
        playlist.name = req.name.strip()
    if req.description is not None:
        playlist.description = req.description.strip() if req.description else None
    if req.is_public is not None:
        playlist.is_public = req.is_public

    await db.commit()
    return {"message": "Playlist updated"}


@router.delete("/{playlist_id}")
async def delete_playlist(
    playlist_id: str,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    pid = uuid.UUID(playlist_id)
    result = await db.execute(select(Playlist).where(Playlist.id == pid, Playlist.user_id == user.id))
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found or not yours")

    await db.delete(playlist)
    await db.commit()
    return {"message": "Playlist deleted"}


@router.post("/{playlist_id}/tracks")
async def add_track_to_playlist(
    playlist_id: str,
    track_id: str,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    pid = uuid.UUID(playlist_id)
    tid = uuid.UUID(track_id)

    # Check playlist ownership
    result = await db.execute(select(Playlist).where(Playlist.id == pid, Playlist.user_id == user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Playlist not found or not yours")

    # Check track exists
    track_result = await db.execute(select(Track).where(Track.id == tid))
    if not track_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Track not found")

    # Check if already in playlist
    existing = await db.execute(
        select(PlaylistTrack).where(PlaylistTrack.playlist_id == pid, PlaylistTrack.track_id == tid)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Track already in playlist")

    # Get max position
    max_pos = await db.execute(
        select(func.max(PlaylistTrack.position)).where(PlaylistTrack.playlist_id == pid)
    )
    pos = (max_pos.scalar() or 0) + 1

    pt = PlaylistTrack(playlist_id=pid, track_id=tid, position=pos)
    db.add(pt)
    await db.commit()
    return {"message": "Track added", "position": pos}


@router.delete("/{playlist_id}/tracks/{track_id}")
async def remove_track_from_playlist(
    playlist_id: str,
    track_id: str,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    pid = uuid.UUID(playlist_id)
    tid = uuid.UUID(track_id)

    result = await db.execute(select(Playlist).where(Playlist.id == pid, Playlist.user_id == user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Playlist not found or not yours")

    await db.execute(
        delete(PlaylistTrack).where(PlaylistTrack.playlist_id == pid, PlaylistTrack.track_id == tid)
    )
    await db.commit()
    return {"message": "Track removed"}


@router.put("/{playlist_id}/reorder")
async def reorder_playlist(
    playlist_id: str,
    req: ReorderRequest,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    pid = uuid.UUID(playlist_id)
    result = await db.execute(select(Playlist).where(Playlist.id == pid, Playlist.user_id == user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Playlist not found or not yours")

    for idx, tid_str in enumerate(req.track_ids):
        tid = uuid.UUID(tid_str)
        pt_result = await db.execute(
            select(PlaylistTrack).where(PlaylistTrack.playlist_id == pid, PlaylistTrack.track_id == tid)
        )
        pt = pt_result.scalar_one_or_none()
        if pt:
            pt.position = idx

    await db.commit()
    return {"message": "Reordered"}
