from datetime import datetime
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Setting, AuditLog
from app.schemas import SettingsUpdate, SystemSettingsOut, TestGeminiRequest, TestMetaRequest
from app.security import get_current_admin, get_client_ip
from app.config import settings
from app.services.gemini_service import DEFAULT_SYSTEM_PROMPT, get_setting_value, test_gemini_connection
from app.services.whatsapp_service import send_whatsapp_message

router = APIRouter(tags=["Settings"])

def upsert_setting(db: Session, key: str, value: str, description: str = ""):
    record = db.query(Setting).filter(Setting.key == key).first()
    if not record:
        record = Setting(key=key, value=str(value), description=description, updated_at=datetime.utcnow())
        db.add(record)
    else:
        record.value = str(value)
        record.updated_at = datetime.utcnow()
    db.commit()

@router.get("/api/settings", response_model=SystemSettingsOut)
def get_system_settings(
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Retrieve full AI and WhatsApp platform configuration"""
    auto_reply = get_setting_value(db, "auto_reply", True)
    system_prompt = get_setting_value(db, "system_prompt", DEFAULT_SYSTEM_PROMPT)
    gemini_model = get_setting_value(db, "gemini_model", settings.GEMINI_MODEL or "gemini-2.5-flash")
    context_limit = get_setting_value(db, "context_limit", 10)
    temperature = get_setting_value(db, "temperature", 0.7)
    max_tokens = get_setting_value(db, "max_tokens", 800)
    phone_id = get_setting_value(db, "meta_phone_number_id", settings.META_PHONE_NUMBER_ID or "")
    verify_token = get_setting_value(db, "meta_verify_token", settings.META_VERIFY_TOKEN or "")
    
    # Check tokens from DB or environment
    gemini_key = get_setting_value(db, "gemini_api_key", settings.GEMINI_API_KEY or "")
    meta_token = get_setting_value(db, "meta_access_token", settings.META_ACCESS_TOKEN or "")

    masked_gemini = f"••••••••{gemini_key[-4:]}" if len(gemini_key) >= 8 else None
    masked_meta = f"••••••••{meta_token[-6:]}" if len(meta_token) >= 10 else None

    # Check for active tunnel URL
    tunnel_url = None
    webhook_url = None
    import os
    possible_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "tunnel_url.txt"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "tunnel_url.txt"),
        os.path.join(os.getcwd(), "tunnel_url.txt")
    ]
    for p in possible_paths:
        if os.path.exists(p):
            try:
                with open(p, "r") as f:
                    t_val = f.read().strip()
                    if t_val.startswith("http"):
                        tunnel_url = t_val
                        webhook_url = f"{t_val}/api/webhook"
                        break
            except Exception:
                pass

    return SystemSettingsOut(
        auto_reply=auto_reply,
        system_prompt=system_prompt,
        gemini_model=gemini_model,
        context_limit=context_limit,
        temperature=temperature,
        max_tokens=max_tokens,
        meta_phone_number_id=phone_id,
        meta_verify_token=verify_token,
        has_meta_token=bool(meta_token and meta_token.strip()),
        has_gemini_key=bool(gemini_key and gemini_key.strip()),
        gemini_api_key_masked=masked_gemini,
        meta_access_token_masked=masked_meta,
        tunnel_url=tunnel_url,
        webhook_url=webhook_url
    )

@router.put("/api/settings", response_model=SystemSettingsOut)
def update_system_settings(
    request: Request,
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Update AI and WhatsApp settings with audit trail"""
    changes = []

    if payload.auto_reply is not None:
        upsert_setting(db, "auto_reply", str(payload.auto_reply).lower(), "Master AI auto-reply toggle")
        changes.append(f"auto_reply={payload.auto_reply}")

    if payload.system_prompt is not None:
        upsert_setting(db, "system_prompt", payload.system_prompt, "Gemini core system instructions")
        changes.append("system_prompt updated")

    if payload.gemini_model is not None:
        upsert_setting(db, "gemini_model", payload.gemini_model, "Selected Gemini model version")
        changes.append(f"gemini_model={payload.gemini_model}")

    if payload.context_limit is not None:
        upsert_setting(db, "context_limit", str(payload.context_limit), "Max conversation messages in context")
        changes.append(f"context_limit={payload.context_limit}")

    if payload.temperature is not None:
        upsert_setting(db, "temperature", str(payload.temperature), "Gemini generation temperature")
        changes.append(f"temperature={payload.temperature}")

    if payload.max_tokens is not None:
        upsert_setting(db, "max_tokens", str(payload.max_tokens), "Max tokens generated per reply")
        changes.append(f"max_tokens={payload.max_tokens}")

    if payload.meta_phone_number_id is not None:
        upsert_setting(db, "meta_phone_number_id", payload.meta_phone_number_id, "WhatsApp Phone Number ID")
        settings.META_PHONE_NUMBER_ID = payload.meta_phone_number_id
        changes.append("meta_phone_number_id updated")

    if payload.meta_verify_token is not None:
        upsert_setting(db, "meta_verify_token", payload.meta_verify_token, "WhatsApp Webhook Verify Token")
        settings.META_VERIFY_TOKEN = payload.meta_verify_token
        changes.append("meta_verify_token updated")

    if payload.gemini_api_key is not None and payload.gemini_api_key.strip():
        upsert_setting(db, "gemini_api_key", payload.gemini_api_key.strip(), "Google Gemini API Key")
        settings.GEMINI_API_KEY = payload.gemini_api_key.strip()
        changes.append("gemini_api_key updated")

    if payload.meta_access_token is not None and payload.meta_access_token.strip():
        upsert_setting(db, "meta_access_token", payload.meta_access_token.strip(), "Meta WhatsApp Access Token")
        settings.META_ACCESS_TOKEN = payload.meta_access_token.strip()
        changes.append("meta_access_token updated")

    if payload.meta_app_secret is not None and payload.meta_app_secret.strip():
        upsert_setting(db, "meta_app_secret", payload.meta_app_secret.strip(), "Meta App Secret")
        settings.META_APP_SECRET = payload.meta_app_secret.strip()
        changes.append("meta_app_secret updated")

    # Record audit log
    ip = get_client_ip(request)
    audit = AuditLog(
        action="SETTINGS_UPDATED",
        admin=admin.username,
        ip_address=ip,
        timestamp=datetime.utcnow(),
        details=", ".join(changes) if changes else "No fields changed"
    )
    db.add(audit)
    db.commit()

    return get_system_settings(db, admin)

@router.post("/settings/test-gemini")
@router.post("/api/settings/test-gemini")
async def test_gemini_endpoint(
    payload: TestGeminiRequest,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Test live connectivity with Google Gemini API"""
    api_key = payload.api_key.strip() if (payload.api_key and payload.api_key.strip()) else get_setting_value(db, "gemini_api_key", settings.GEMINI_API_KEY or "")
    if not api_key:
        return {"success": False, "message": "No Gemini API key provided or saved in settings.", "latency_ms": 0}

    model = payload.model or get_setting_value(db, "gemini_model", settings.GEMINI_MODEL or "gemini-2.5-flash")
    success, message, latency = await test_gemini_connection(api_key, model=model)
    return {"success": success, "message": message, "latency_ms": latency}

@router.post("/settings/test-meta")
@router.post("/api/settings/test-meta")
async def test_meta_endpoint(
    payload: TestMetaRequest,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Send test WhatsApp message via Meta Cloud API"""
    phone = payload.phone_number.strip()
    if not phone:
        return {"success": False, "error": "Phone number is required."}

    # Temporarily override settings if provided in payload
    res = await send_whatsapp_message(
        to_phone=phone,
        message_text=payload.message or "Hello from WhatsAI! Your Meta WhatsApp Cloud API integration is successfully connected and active. 🚀",
        db=db
    )

    if res.get("status") == "simulated":
        return {
            "success": False,
            "simulated": True,
            "error": "Meta credentials are not set yet. Please save your Meta Access Token and Phone Number ID first."
        }
    elif res.get("status") == "error":
        return {
            "success": False,
            "error": res.get("error", "Unknown error sending WhatsApp message.")
        }
    else:
        return {
            "success": True,
            "data": res
        }
