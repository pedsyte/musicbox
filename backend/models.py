import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, Text, DateTime, ForeignKey, Float, JSON,
    UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    theme = Column(String(10), default="dark", nullable=False)
    show_waveform = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    playlists = relationship("Playlist", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")


class Track(Base):
    __tablename__ = "tracks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False, index=True)
    artist = Column(String(200), default="Suno AI", nullable=False)
    duration_seconds = Column(Float, default=0, nullable=False)
    file_path = Column(String(500), nullable=False)
    mp3_path = Column(String(500), nullable=False)
    cover_path = Column(String(500), nullable=True)
    lyrics = Column(Text, nullable=True)
    waveform_peaks = Column(JSON, nullable=True)
    play_count = Column(Integer, default=0, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    genres = relationship("Genre", secondary="track_genres", back_populates="tracks", lazy="selectin")


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(50), unique=True, nullable=False, index=True)

    tracks = relationship("Track", secondary="track_genres", back_populates="genres", lazy="selectin")


class TrackGenre(Base):
    __tablename__ = "track_genres"

    track_id = Column(UUID(as_uuid=True), ForeignKey("tracks.id", ondelete="CASCADE"), primary_key=True)
    genre_id = Column(Integer, ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True)


class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="playlists")
    playlist_tracks = relationship(
        "PlaylistTrack", back_populates="playlist", cascade="all, delete-orphan",
        order_by="PlaylistTrack.position"
    )


class PlaylistTrack(Base):
    __tablename__ = "playlist_tracks"

    playlist_id = Column(UUID(as_uuid=True), ForeignKey("playlists.id", ondelete="CASCADE"), primary_key=True)
    track_id = Column(UUID(as_uuid=True), ForeignKey("tracks.id", ondelete="CASCADE"), primary_key=True)
    position = Column(Integer, nullable=False, default=0)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    playlist = relationship("Playlist", back_populates="playlist_tracks")
    track = relationship("Track", lazy="selectin")


class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    track_id = Column(UUID(as_uuid=True), ForeignKey("tracks.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="favorites")
    track = relationship("Track", lazy="selectin")
