import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from routes.auth import router as auth_router
from routes.tracks import router as tracks_router
from routes.admin import router as admin_router
from routes.genres import router as genres_router
from routes.playlists import router as playlists_router
from routes.favorites import router as favorites_router
from routes.tags import router as tags_router
from routes.comments import router as comments_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="MusicBox API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth_router)
app.include_router(tracks_router)
app.include_router(admin_router)
app.include_router(genres_router)
app.include_router(playlists_router)
app.include_router(favorites_router)
app.include_router(tags_router)
app.include_router(comments_router)

# Serve uploaded files
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/opt/musicbox/uploads")
if os.path.exists(UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
