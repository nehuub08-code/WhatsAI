import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Message, AuditLog
from app.schemas import SimulatorIncomingRequest, SimulatorResponse, MessageOut, UserOut
from app.security import get_current_admin, get_client_ip
from app.services.gemini_service import generate_gemini_reply, get_setting_value

router = APIRouter(tags=["Simulator"])

@router.post("/api/simulator/incoming", response_model=SimulatorResponse)
async def simulate_incoming_whatsapp_message(
    request: Request,
    payload: SimulatorIncomingRequest,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """
    Direct interactive WhatsApp testing endpoint for the Admin UI simulator.
    Simulates a live WhatsApp Cloud API message event, triggers Gemini AI, and returns results in real time.
    """
    clean_phone = payload.phone.strip()
    if not clean_phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

    sender_name = (payload.name or "Test WhatsApp User").strip()
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    # 1. Lookup or create contact
    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user:
        user = User(
            phone=clean_phone,
            name=sender_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.name = sender_name
        user.updated_at = datetime.utcnow()
        db.commit()

    # 2. Store incoming user message
    user_msg = Message(
        user_id=user.id,
        role="user",
        message=text,
        timestamp=datetime.utcnow(),
        latency_ms=0.0,
        status="delivered",
        raw_metadata=json.dumps({"source": "simulator", "simulated_by": admin.username})
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 3. Check auto-reply setting
    auto_reply = get_setting_value(db, "auto_reply", True)
    outgoing_reply_msg = None
    ai_latency = 0.0

    if auto_reply:
        # Generate Gemini reply with full conversational context
        reply_text, ai_latency = await generate_gemini_reply(db, user, text)

        outgoing_msg = Message(
            user_id=user.id,
            role="assistant",
            message=reply_text,
            timestamp=datetime.utcnow(),
            latency_ms=ai_latency,
            status="delivered",
            raw_metadata=json.dumps({"source": "gemini_2_5_flash", "auto_reply": True})
        )
        db.add(outgoing_msg)
        db.commit()
        db.refresh(outgoing_msg)
        outgoing_reply_msg = MessageOut.model_validate(outgoing_msg)

    # 4. Record audit log
    ip = get_client_ip(request)
    audit = AuditLog(
        action="SIMULATOR_MESSAGE_SENT",
        admin=admin.username,
        ip_address=ip,
        timestamp=datetime.utcnow(),
        details=f"Simulated WhatsApp message from {clean_phone}: '{text[:40]}...'"
    )
    db.add(audit)
    db.commit()

    user_out = UserOut(
        id=user.id,
        phone=user.phone,
        name=user.name,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
        message_count=db.query(Message).filter(Message.user_id == user.id).count(),
        last_message=text,
        last_active=user_msg.timestamp
    )

    return SimulatorResponse(
        success=True,
        incoming_message=MessageOut.model_validate(user_msg),
        outgoing_reply=outgoing_reply_msg,
        latency_ms=ai_latency,
        auto_reply_enabled=auto_reply,
        user=user_out
    )
