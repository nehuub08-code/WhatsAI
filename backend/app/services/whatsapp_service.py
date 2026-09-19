import logging
from typing import Dict, Any, Optional, Tuple
import httpx
from app.config import settings

logger = logging.getLogger("whatsai.whatsapp")

async def send_whatsapp_message(
    to_phone: str,
    message_text: str,
    db: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Send text reply via Meta WhatsApp Cloud API.
    POST https://graph.facebook.com/v21.0/{phone_number_id}/messages
    """
    phone_id = settings.META_PHONE_NUMBER_ID.strip() if settings.META_PHONE_NUMBER_ID else ""
    token = settings.META_ACCESS_TOKEN.strip() if settings.META_ACCESS_TOKEN else ""

    if db:
        try:
            from app.models import Setting
            s_phone = db.query(Setting).filter(Setting.key == "meta_phone_number_id").first()
            if s_phone and s_phone.value:
                phone_id = s_phone.value.strip()
            s_token = db.query(Setting).filter(Setting.key == "meta_access_token").first()
            if s_token and s_token.value:
                token = s_token.value.strip()
        except Exception:
            pass

    # Clean phone number (strip spaces, dashes, parentheses)
    clean_phone = "".join(filter(lambda c: c.isdigit() or c == "+", to_phone))
    if clean_phone.startswith("+"):
        clean_phone = clean_phone[1:]

    if not phone_id or not token:
        logger.info(
            f"[SIMULATED WHATSAPP OUTGOING] To: {to_phone} | Message: {message_text[:60]}... "
            f"(Meta Cloud credentials not fully configured, simulation mode active)"
        )
        return {
            "status": "simulated",
            "messages": [{"id": f"wamid.simulated_{hash(message_text + to_phone)}"}]
        }

    url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message_text
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            logger.info(f"WhatsApp Cloud API message sent successfully to {to_phone}: {data}")
            return data
    except Exception as exc:
        logger.error(f"Failed to send WhatsApp message via Meta Cloud API: {exc}")
        return {
            "status": "error",
            "error": str(exc),
            "simulated_fallback": True
        }

def parse_incoming_whatsapp_webhook(payload: Dict[str, Any]) -> Optional[Tuple[str, str, str, str]]:
    """
    Parse incoming webhook payload from Meta WhatsApp Cloud API.
    Returns (phone, sender_name, message_text, message_id) or None if non-message event.
    """
    try:
        entries = payload.get("entry", [])
        if not entries:
            return None

        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                if not messages:
                    continue

                contacts = value.get("contacts", [])
                sender_name = "WhatsApp User"
                if contacts and "profile" in contacts[0]:
                    sender_name = contacts[0]["profile"].get("name", "WhatsApp User")

                msg = messages[0]
                phone = msg.get("from", "")
                msg_id = msg.get("id", "")
                msg_type = msg.get("type", "text")

                text_body = ""
                if msg_type == "text":
                    text_body = msg.get("text", {}).get("body", "")
                elif msg_type == "interactive":
                    interactive = msg.get("interactive", {})
                    button_reply = interactive.get("button_reply", {})
                    list_reply = interactive.get("list_reply", {})
                    text_body = button_reply.get("title") or list_reply.get("title") or "[Interactive Reply]"
                else:
                    text_body = f"[{msg_type.capitalize()} message received]"

                if phone and text_body:
                    return phone, sender_name, text_body, msg_id

        return None
    except Exception as exc:
        logger.error(f"Error parsing incoming WhatsApp webhook: {exc}")
        return None
