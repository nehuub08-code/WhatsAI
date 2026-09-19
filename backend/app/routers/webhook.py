import json
import logging
from datetime import datetime
from fastapi import APIRouter, Request, Response, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import User, Message, Setting
from app.security import verify_meta_webhook_signature
from app.services.whatsapp_service import parse_incoming_whatsapp_webhook, send_whatsapp_message
from app.services.gemini_service import generate_gemini_reply, get_setting_value

logger = logging.getLogger("whatsai.webhook")

router = APIRouter(tags=["WhatsApp Webhook"])

@router.get("/webhook")
@router.get("/api/webhook")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    """
    Verification endpoint called by Meta WhatsApp Cloud API when configuring webhook.
    Returns hub.challenge if hub.verify_token matches META_VERIFY_TOKEN.
    """
    logger.info(f"Webhook verification challenge received: mode={hub_mode}, token={hub_verify_token}")
    expected_token = settings.META_VERIFY_TOKEN

    if hub_mode == "subscribe" and hub_verify_token == expected_token:
        logger.info("Webhook successfully verified by Meta challenge")
        return Response(content=hub_challenge, media_type="text/plain")

    logger.warning("Webhook verification failed: token mismatch or invalid mode")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch"
    )

@router.post("/webhook")
@router.post("/api/webhook")
async def receive_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None, alias="X-Hub-Signature-256"),
    db: Session = Depends(get_db)
):
    """
    Receive incoming WhatsApp messages from Meta WhatsApp Cloud API.
    Verifies signature, processes text, calls Gemini AI, and responds in real-time.
    """
    raw_body = await request.body()

    # Signature verification
    if settings.META_APP_SECRET and not verify_meta_webhook_signature(raw_body, x_hub_signature_256):
        logger.warning("Invalid webhook signature rejected")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid signature"
        )

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        return Response(content="INVALID_JSON", status_code=400)

    # Parse message content
    parsed = parse_incoming_whatsapp_webhook(payload)
    if not parsed:
        # Status update or non-message event (e.g., read receipt)
        return {"status": "EVENT_IGNORED_OR_PROCESSED"}

    phone, sender_name, message_text, msg_id = parsed
    logger.info(f"Incoming message from {sender_name} ({phone}): {message_text}")

    # Find or create user
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(
            phone=phone,
            name=sender_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if sender_name and user.name != sender_name:
            user.name = sender_name
        user.updated_at = datetime.utcnow()
        db.commit()

    # Store incoming message
    user_msg = Message(
        user_id=user.id,
        role="user",
        message=message_text,
        timestamp=datetime.utcnow(),
        status="delivered",
        raw_metadata=json.dumps({"wamid": msg_id, "source": "meta_webhook"})
    )
    db.add(user_msg)
    db.commit()

    # Check if auto-reply is enabled
    auto_reply_enabled = get_setting_value(db, "auto_reply", True)

    if auto_reply_enabled:
        # Generate Gemini reply
        reply_text, latency_ms = await generate_gemini_reply(db, user, message_text)

        # Store AI reply
        ai_msg = Message(
            user_id=user.id,
            role="assistant",
            message=reply_text,
            timestamp=datetime.utcnow(),
            latency_ms=latency_ms,
            status="sent",
            raw_metadata=json.dumps({"model": settings.GEMINI_MODEL, "auto_reply": True})
        )
        db.add(ai_msg)
        db.commit()

        # Send reply back via WhatsApp Cloud API
        await send_whatsapp_message(phone, reply_text, db=db)

    return {"status": "EVENT_RECEIVED"}
