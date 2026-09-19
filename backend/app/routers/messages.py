import json
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database import get_db
from app.models import Message, User
from app.schemas import MessageOut, SendMessageRequest
from app.security import get_current_admin
from app.services.whatsapp_service import send_whatsapp_message

router = APIRouter(tags=["Messages"])

@router.get("/messages", response_model=List[MessageOut])
@router.get("/api/messages", response_model=List[MessageOut])
def get_messages(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    search: Optional[str] = Query(None, description="Search across messages or user details"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Retrieve message history with filtering, searching, and pagination"""
    query = db.query(Message).join(User, Message.user_id == User.id)

    if user_id:
        query = query.filter(Message.user_id == user_id)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Message.message.ilike(term),
                User.phone.ilike(term),
                User.name.ilike(term)
            )
        )

    # Order chronologically if filtering for single user, else newest first
    if user_id:
        messages = query.order_by(Message.timestamp.asc()).offset(offset).limit(limit).all()
    else:
        messages = query.order_by(Message.timestamp.desc()).offset(offset).limit(limit).all()

    return [MessageOut.model_validate(m) for m in messages]

@router.post("/send-message", response_model=MessageOut)
@router.post("/api/send-message", response_model=MessageOut)
async def send_manual_message(
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Send an outgoing WhatsApp reply message manually from the Admin dashboard"""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User recipient not found")

    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message text cannot be empty")

    # Send through WhatsApp Cloud API
    api_response = await send_whatsapp_message(user.phone, text, db=db)

    # Record message in database
    msg = Message(
        user_id=user.id,
        role="assistant",
        message=text,
        timestamp=datetime.utcnow(),
        latency_ms=0.0,
        status="sent",
        raw_metadata=json.dumps({"sent_by_admin": admin.username, "meta_response": api_response})
    )
    db.add(msg)
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)

    return MessageOut.model_validate(msg)
