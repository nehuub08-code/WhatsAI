import os
import hmac
import hashlib
import binascii
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import Admin

security_bearer = HTTPBearer(auto_error=False)

# ----------------- Password Hashing (PBKDF2-HMAC-SHA256) -----------------

def hash_password(password: str) -> str:
    """Generate secure salted PBKDF2 hash"""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 260000)
    return f"pbkdf2:sha256:260000${binascii.hexlify(salt).decode('ascii')}${binascii.hexlify(key).decode('ascii')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored hash"""
    try:
        if not hashed_password or "$" not in hashed_password:
            return False
        algorithm, salt_hex, key_hex = hashed_password.split("$")
        salt = binascii.unhexlify(salt_hex.encode("ascii"))
        expected_key = binascii.unhexlify(key_hex.encode("ascii"))
        actual_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 260000)
        return hmac.compare_digest(expected_key, actual_key)
    except Exception:
        return False

# ----------------- JWT Authentication -----------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Encode JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT access token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None

def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Admin:
    """FastAPI dependency for protecting admin endpoints"""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject identity",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin user no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return admin

# ----------------- Meta Webhook HMAC Verification -----------------

def verify_meta_webhook_signature(payload_bytes: bytes, signature_header: Optional[str]) -> bool:
    """
    Verify X-Hub-Signature-256 header sent by Meta WhatsApp Cloud API.
    Header format: 'sha256=<hex_hash>'
    """
    if not settings.META_APP_SECRET:
        # If no secret configured in dev mode, allow incoming payloads
        return True

    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected_signature = signature_header.split("sha256=", 1)[1]
    calculated_signature = hmac.new(
        key=settings.META_APP_SECRET.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, calculated_signature)

def get_client_ip(request: Request) -> str:
    """Extract client IP handling forward headers"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"
