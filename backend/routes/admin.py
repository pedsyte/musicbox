import os
import uuid
import json
import shutil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Track, Genre, TrackGenre, User, Playlist, SiteSetting
from auth import require_admin
from audio import (
    get_duration, convert_to_mp3, generate_waveform_peaks,
    detect_format, ALLOWED_UPLOAD_EXTENSIONS,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


class GenreBody(BaseModel):
    name: str

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/opt/musicbox/uploads")
CONVERTED_DIR = os.getenv("CONVERTED_DIR", "/opt/musicbox/converted")


@router.post("/tracks")
async def upload_track(
    title: str = Form(...),
    artist: str = Form("Suno AI"),
    lyrics: Optional[str] = Form(None),
    genres: str = Form(""),  # comma-separated genre names (auto-created)
    audio: UploadFile = File(...),
    cover: Optional[UploadFile] = File(None),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    track_id = uuid.uuid4()

    # Detect original format
    orig_ext = os.path.splitext(audio.filename or "file.wav")[1].lower().lstrip(".")
    if orig_ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {orig_ext}. Allowed: {', '.join(ALLOWED_UPLOAD_EXTENSIONS)}")
    original_format = detect_format(audio.filename or "file.wav")

    # Save original file with correct extension
    orig_filename = f"{track_id}.{orig_ext}"
    orig_path = os.path.join(UPLOAD_DIR, "tracks", orig_filename)
    with open(orig_path, "wb") as f:
        content = await audio.read()
        f.write(content)

    # Get duration
    duration = get_duration(orig_path)

    # Generate waveform peaks from original
    peaks = generate_waveform_peaks(orig_path)

    # Save cover
    cover_path = None
    if cover:
        ext = os.path.splitext(cover.filename)[1] if cover.filename else ".jpg"
        cover_filename = f"{track_id}{ext}"
        cover_full_path = os.path.join(UPLOAD_DIR, "covers", cover_filename)
        with open(cover_full_path, "wb") as f:
            cover_content = await cover.read()
            f.write(cover_content)
        cover_path = cover_full_path

    # Create track — no auto-convert, stream original
    track = Track(
        id=track_id,
        title=title.strip(),
        artist=artist.strip(),
        duration_seconds=duration,
        file_path=orig_path,
        mp3_path="",
        original_format=original_format,
        cover_path=cover_path,
        lyrics=lyrics.strip() if lyrics else None,
        waveform_peaks=peaks,
    )
    db.add(track)
    await db.flush()

    # Handle genres — auto-create if not exists
    if genres:
        genre_names = [s.strip() for s in genres.split(",") if s.strip()]
        for name in genre_names:
            slug = name.lower().replace(" ", "-").replace("&", "and")
            result = await db.execute(select(Genre).where(Genre.slug == slug))
            genre = result.scalar_one_or_none()
            if not genre:
                genre = Genre(name=name, slug=slug)
                db.add(genre)
                await db.flush()
            db.add(TrackGenre(track_id=track_id, genre_id=genre.id))

    await db.commit()
    await db.refresh(track)

    # Reload with genres
    result = await db.execute(
        select(Track).options(selectinload(Track.genres)).where(Track.id == track_id)
    )
    track = result.scalar_one()

    return {
        "id": str(track.id),
        "title": track.title,
        "artist": track.artist,
        "duration_seconds": track.duration_seconds,
        "genres": [{"id": g.id, "name": g.name, "slug": g.slug} for g in track.genres],
        "has_cover": cover_path is not None,
        "has_lyrics": bool(track.lyrics),
        "has_waveform": bool(track.waveform_peaks),
    }


@router.put("/tracks/{track_id}")
async def update_track(
    track_id: str,
    title: Optional[str] = Form(None),
    artist: Optional[str] = Form(None),
    lyrics: Optional[str] = Form(None),
    genres: Optional[str] = Form(None),
    cover: Optional[UploadFile] = File(None),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Track).options(selectinload(Track.genres)).where(Track.id == uuid.UUID(track_id))
    )
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    if title is not None:
        track.title = title.strip()
    if artist is not None:
        track.artist = artist.strip()
    if lyrics is not None:
        track.lyrics = lyrics.strip() if lyrics else None

    if cover:
        # Remove old cover
        if track.cover_path and os.path.exists(track.cover_path):
            os.remove(track.cover_path)
        ext = os.path.splitext(cover.filename)[1] if cover.filename else ".jpg"
        cover_filename = f"{track.id}{ext}"
        cover_full_path = os.path.join(UPLOAD_DIR, "covers", cover_filename)
        with open(cover_full_path, "wb") as f:
            f.write(await cover.read())
        track.cover_path = cover_full_path

    if genres is not None:
        # Clear existing genres
        await db.execute(
            delete(TrackGenre).where(TrackGenre.track_id == track.id)
        )
        # Add new genres — auto-create if not exists
        if genres:
            genre_names = [s.strip() for s in genres.split(",") if s.strip()]
            for name in genre_names:
                slug = name.lower().replace(" ", "-").replace("&", "and")
                result = await db.execute(select(Genre).where(Genre.slug == slug))
                genre = result.scalar_one_or_none()
                if not genre:
                    genre = Genre(name=name, slug=slug)
                    db.add(genre)
                    await db.flush()
                db.add(TrackGenre(track_id=track.id, genre_id=genre.id))

    await db.commit()
    return {"message": "Track updated"}


@router.delete("/tracks/{track_id}")
async def delete_track(
    track_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Track).where(Track.id == uuid.UUID(track_id)))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    # Remove files
    for path in [track.file_path, track.mp3_path, track.cover_path]:
        if path and os.path.exists(path):
            os.remove(path)

    await db.delete(track)
    await db.commit()
    return {"message": "Track deleted"}


# --- Genres ---

@router.post("/genres")
async def create_genre(
    body: GenreBody,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    name = body.name
    slug = name.strip().lower().replace(" ", "-")
    existing = await db.execute(select(Genre).where(Genre.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Genre already exists")

    genre = Genre(name=name.strip(), slug=slug)
    db.add(genre)
    await db.commit()
    await db.refresh(genre)
    return {"id": genre.id, "name": genre.name, "slug": genre.slug}


@router.put("/genres/{genre_id}")
async def update_genre(
    genre_id: int,
    body: GenreBody,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    name = body.name
    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")

    new_slug = name.strip().lower().replace(" ", "-")
    dupe = await db.execute(select(Genre).where(Genre.slug == new_slug, Genre.id != genre_id))
    if dupe.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Genre name already taken")

    genre.name = name.strip()
    genre.slug = new_slug
    await db.commit()
    return {"id": genre.id, "name": genre.name, "slug": genre.slug}


@router.delete("/genres/{genre_id}")
async def delete_genre(
    genre_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()
    if not genre:
        raise HTTPException(status_code=404, detail="Genre not found")

    await db.execute(delete(TrackGenre).where(TrackGenre.genre_id == genre_id))
    await db.delete(genre)
    await db.commit()
    return {"message": "Genre deleted"}


# --- Stats ---

@router.get("/stats")
async def get_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    tracks_count = (await db.execute(select(func.count(Track.id)))).scalar() or 0
    users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    genres_count = (await db.execute(select(func.count(Genre.id)))).scalar() or 0
    total_plays = (await db.execute(select(func.sum(Track.play_count)))).scalar() or 0
    playlists_count = (await db.execute(select(func.count(Playlist.id)))).scalar() or 0

    return {
        "total_tracks": tracks_count,
        "total_users": users_count,
        "total_genres": genres_count,
        "total_plays": total_plays,
        "total_playlists": playlists_count,
    }


# --- Site Settings (metadata tags etc.) ---

@router.get("/settings")
async def get_settings(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SiteSetting))
    settings = {s.key: s.value for s in result.scalars().all()}
    return settings


@router.put("/settings")
async def update_settings(
    settings: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    for key, value in settings.items():
        key = str(key).strip()[:100]
        value = str(value).strip()
        existing = await db.execute(select(SiteSetting).where(SiteSetting.key == key))
        s = existing.scalar_one_or_none()
        if s:
            s.value = value
        else:
            db.add(SiteSetting(key=key, value=value))
    await db.commit()
    return {"message": "Settings updated"}
