"""Seed script: create admin user and initial genres."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from database import engine, async_session, Base
from models import User, Genre
from auth import hash_password
from sqlalchemy import select


ADMIN_USERNAME = "pedsyte"
ADMIN_PASSWORD = "Vjybnjh1991"

INITIAL_GENRES = [
    "Pop", "Rock", "Electronic", "Hip-Hop", "R&B", "Jazz", "Classical",
    "Country", "Folk", "Metal", "Punk", "Blues", "Soul", "Funk",
    "Reggae", "Latin", "Ambient", "Lo-Fi", "Indie", "Alternative",
    "Dance", "House", "Techno", "Trap", "Dubstep", "Drum & Bass",
    "Synthwave", "Chillwave", "Dream Pop", "Shoegaze",
    "Rap", "K-Pop", "J-Pop", "Disco", "Grunge",
    "Acoustic", "Cinematic", "Epic", "Ballad", "Power Pop",
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Create admin
        result = await db.execute(select(User).where(User.username == ADMIN_USERNAME))
        if not result.scalar_one_or_none():
            admin = User(
                username=ADMIN_USERNAME,
                password_hash=hash_password(ADMIN_PASSWORD),
                is_admin=True,
            )
            db.add(admin)
            print(f"[+] Admin user '{ADMIN_USERNAME}' created")
        else:
            print(f"[=] Admin user '{ADMIN_USERNAME}' already exists")

        # Create genres
        created = 0
        for name in INITIAL_GENRES:
            slug = name.strip().lower().replace(" ", "-").replace("&", "and")
            result = await db.execute(select(Genre).where(Genre.slug == slug))
            if not result.scalar_one_or_none():
                db.add(Genre(name=name, slug=slug))
                created += 1
        print(f"[+] Created {created} genres ({len(INITIAL_GENRES) - created} already existed)")

        await db.commit()
    print("[OK] Seed complete")


if __name__ == "__main__":
    asyncio.run(seed())
