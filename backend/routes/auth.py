from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import re, os, uuid as _uuid
from PIL import Image
import io

from database import get_db
from models import User
from auth import hash_password, verify_password, create_token, require_user

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/opt/musicbox/uploads")
AVATAR_DIR = os.path.join(UPLOAD_DIR, "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be 3-50 characters")
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, _ and -")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 4:
            raise ValueError("Password must be at least 4 characters")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class SettingsRequest(BaseModel):
    theme: str | None = None
    show_waveform: bool | None = None
    old_password: str | None = None
    new_password: str | None = None


class UserResponse(BaseModel):
    id: str
    username: str
    is_admin: bool
    theme: str
    show_waveform: bool

    class Config:
        from_attributes = True


def _user_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "username": user.username,
        "is_admin": user.is_admin,
        "theme": user.theme,
        "show_waveform": user.show_waveform,
        "avatar": f"/uploads/avatars/{user.avatar}" if user.avatar else None,
    }


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.username == req.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(str(user.id), user.is_admin)
    return {"token": token, "user": _user_dict(user)}


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(str(user.id), user.is_admin)
    return {"token": token, "user": _user_dict(user)}


@router.get("/me")
async def get_me(user: User = Depends(require_user)):
    return _user_dict(user)


@router.put("/settings")
async def update_settings(
    req: SettingsRequest,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    if req.theme and req.theme in ("dark", "light"):
        user.theme = req.theme
    if req.show_waveform is not None:
        user.show_waveform = req.show_waveform
    if req.old_password and req.new_password:
        if not verify_password(req.old_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Wrong current password")
        if len(req.new_password) < 4:
            raise HTTPException(status_code=400, detail="New password must be at least 4 characters")
        user.password_hash = hash_password(req.new_password)

    await db.commit()
    return {"message": "Settings updated"}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Crop to square and resize
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    img = img.resize((256, 256), Image.LANCZOS)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    filename = f"{_uuid.uuid4().hex}.webp"
    filepath = os.path.join(AVATAR_DIR, filename)
    img.save(filepath, "WEBP", quality=85)

    # Remove old avatar file
    if user.avatar:
        old_path = os.path.join(AVATAR_DIR, user.avatar)
        if os.path.exists(old_path):
            os.remove(old_path)

    user.avatar = filename
    await db.commit()

    return {"avatar": f"/uploads/avatars/{filename}"}


@router.delete("/avatar")
async def delete_avatar(
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    if user.avatar:
        old_path = os.path.join(AVATAR_DIR, user.avatar)
        if os.path.exists(old_path):
            os.remove(old_path)
        user.avatar = None
        await db.commit()
    return {"avatar": None}
