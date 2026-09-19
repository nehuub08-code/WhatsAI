from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Admin, AuditLog
from app.schemas import LoginRequest, TokenResponse, AdminOut, ChangePasswordRequest
from app.security import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_admin,
    get_client_ip,
)
from app.config import settings

router = APIRouter(tags=["Authentication"])

def log_audit(db: Session, action: str, admin: str, request: Request, details: str = ""):
    ip = get_client_ip(request)
    audit = AuditLog(
        action=action,
        admin=admin,
        ip_address=ip,
        timestamp=datetime.utcnow(),
        details=details
    )
    db.add(audit)
    db.commit()

@router.post("/login", response_model=TokenResponse)
@router.post("/api/auth/login", response_model=TokenResponse)
def login(request: Request, form: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate Admin and return JWT access token"""
    admin = db.query(Admin).filter(Admin.username == form.username).first()
    if not admin or not verify_password(form.password, admin.password_hash):
        log_audit(db, "LOGIN_FAILED", form.username, request, "Invalid credentials entered")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    admin.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": admin.username, "admin_id": admin.id})
    log_audit(db, "LOGIN_SUCCESS", admin.username, request, "Admin successfully authenticated")

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        admin=AdminOut.model_validate(admin)
    )

@router.get("/api/auth/me", response_model=AdminOut)
def get_current_user_profile(admin: Admin = Depends(get_current_admin)):
    """Get currently authenticated Admin profile"""
    return AdminOut.model_validate(admin)

@router.put("/api/auth/change-password")
def change_admin_password(
    request: Request,
    payload: ChangePasswordRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Change current admin password"""
    if not verify_password(payload.current_password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed",
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long",
        )

    admin.password_hash = hash_password(payload.new_password)
    db.commit()

    log_audit(db, "PASSWORD_CHANGED", admin.username, request, "Admin updated account password")
    return {"message": "Password changed successfully"}
