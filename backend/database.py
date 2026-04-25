import logging
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://pedsyte:Vjybnjh1991@localhost/musicbox")
logger = logging.getLogger(__name__)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_tracks_public_search_trgm
                ON tracks USING gin (
                    (coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' ||
                     coalesce(description, '') || ' ' || coalesce(lyrics, '')) gin_trgm_ops
                )
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_genres_name_trgm
                ON genres USING gin (name gin_trgm_ops)
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_tags_name_trgm
                ON tags USING gin (name gin_trgm_ops)
            """))
    except Exception as exc:
        logger.warning("Could not ensure pg_trgm search indexes: %s", exc)

    async with engine.begin() as conn:
        await conn.execute(text("""
            UPDATE tracks
            SET artist = 'MusicBox'
            WHERE lower(trim(artist)) IN ('suno ai', 'suno')
        """))
        await conn.execute(text("""
            UPDATE tracks
            SET description = regexp_replace(description, '(?i)suno\\s+ai|suno', 'MusicBox', 'g')
            WHERE description ~* 'suno\\s+ai|suno'
        """))
        await conn.execute(text("""
            UPDATE tracks AS t
            SET slug = regexp_replace(t.slug, '(?i)suno', 'musicbox', 'g')
            WHERE t.slug ~* 'suno'
              AND NOT EXISTS (
                SELECT 1
                FROM tracks AS other
                WHERE other.id <> t.id
                  AND other.slug = regexp_replace(t.slug, '(?i)suno', 'musicbox', 'g')
              )
        """))
