import os
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User

JWT_SECRET = os.getenv("JWT_SECRET", "musicbox-secret-change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: str, is_admin: bool = False) -> str:
    payload = {
        "sub": user_id,
        "adm": is_admin,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if creds is None:
        return None
    payload = decode_token(creds.credentials)
    user_id = payload.get("sub")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    return result.scalar_one_or_none()


async def require_user(user: Optional[User] = Depends(get_current_user)) -> User:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


async def require_admin(user: User = Depends(require_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
