from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from app.database import get_db
from app.models import User, Message
from app.schemas import UserOut, UserCreate
from app.security import get_current_admin

router = APIRouter(tags=["Users"])

@router.get("/users", response_model=List[UserOut])
@router.get("/api/users", response_model=List[UserOut])
def get_users(
    search: Optional[str] = Query(None, description="Search phone or name"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """List all WhatsApp contacts with search, message counts, and last active date"""
    query = db.query(User)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.phone.ilike(term), User.name.ilike(term)))

    users = query.order_by(User.updated_at.desc()).offset(offset).limit(limit).all()

    result = []
    for u in users:
        msg_count = db.query(Message).filter(Message.user_id == u.id).count()
        last_msg = (
            db.query(Message)
            .filter(Message.user_id == u.id)
            .order_by(Message.timestamp.desc())
            .first()
        )
        result.append(UserOut(
            id=u.id,
            phone=u.phone,
            name=u.name,
            avatar_url=u.avatar_url,
            created_at=u.created_at,
            updated_at=u.updated_at,
            message_count=msg_count,
            last_message=last_msg.message if last_msg else None,
            last_active=last_msg.timestamp if last_msg else u.updated_at
        ))

    return result

@router.post("/api/users", response_model=UserOut)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Create or manually register a new WhatsApp contact"""
    clean_phone = payload.phone.strip()
    existing = db.query(User).filter(User.phone == clean_phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone number already exists"
        )

    user = User(
        phone=clean_phone,
        name=payload.name,
        avatar_url=payload.avatar_url,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserOut(
        id=user.id,
        phone=user.phone,
        name=user.name,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
        message_count=0,
        last_message=None,
        last_active=user.created_at
    )

@router.get("/api/users/{user_id}", response_model=UserOut)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Get single user profile by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    msg_count = db.query(Message).filter(Message.user_id == user.id).count()
    last_msg = (
        db.query(Message)
        .filter(Message.user_id == user.id)
        .order_by(Message.timestamp.desc())
        .first()
    )

    return UserOut(
        id=user.id,
        phone=user.phone,
        name=user.name,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
        message_count=msg_count,
        last_message=last_msg.message if last_msg else None,
        last_active=last_msg.timestamp if last_msg else user.updated_at
    )

@router.delete("/api/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Delete a user and all their conversation history"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} and associated messages deleted successfully"}
