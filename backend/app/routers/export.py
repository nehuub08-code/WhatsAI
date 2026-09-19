import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Message, User
from app.security import get_current_admin

router = APIRouter(tags=["Export"])

@router.get("/api/export/csv")
def export_conversations_csv(
    user_id: Optional[int] = Query(None, description="Export single user or all"),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Export conversation messages as a CSV spreadsheet"""
    query = db.query(Message, User).join(User, Message.user_id == User.id)
    if user_id:
        query = query.filter(Message.user_id == user_id)

    records = query.order_by(Message.timestamp.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Message ID",
        "User Phone",
        "User Name",
        "Role",
        "Message Content",
        "Timestamp (UTC)",
        "Latency (ms)",
        "Status"
    ])

    for msg, user in records:
        writer.writerow([
            msg.id,
            user.phone,
            user.name or "",
            msg.role,
            msg.message,
            msg.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            msg.latency_ms,
            msg.status
        ])

    csv_content = output.getvalue()
    filename = f"whatsai_conversations_user_{user_id}.csv" if user_id else "whatsai_all_conversations.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/api/export/pdf")
def export_conversations_pdf_view(
    user_id: int = Query(..., description="User ID for PDF transcript"),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Generate print-ready HTML transcript that prints directly to PDF"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    messages = (
        db.query(Message)
        .filter(Message.user_id == user.id)
        .order_by(Message.timestamp.asc())
        .all()
    )

    rows_html = ""
    for m in messages:
        badge = '<span style="background:#2563EB;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">AI Assistant</span>' if m.role == 'assistant' else '<span style="background:#475569;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">WhatsApp User</span>'
        latency = f'<span style="color:#0ea5e9;font-size:11px;margin-left:8px;">⚡ {m.latency_ms}ms</span>' if m.latency_ms > 0 else ''
        time_str = m.timestamp.strftime("%b %d, %Y %I:%M %p")

        rows_html += f"""
        <div style="margin-bottom:16px;padding:12px 16px;border-radius:8px;background:{'#0f172a' if m.role == 'assistant' else '#1e293b'};border:1px solid {'#1e3a8a' if m.role == 'assistant' else '#334155'};">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <div>{badge} {latency}</div>
                <div style="color:#94a3b8;font-size:12px;">{time_str}</div>
            </div>
            <div style="color:#e2e8f0;font-size:14px;white-space:pre-wrap;line-height:1.5;">{m.message}</div>
        </div>
        """

    html = f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>WhatsAI Transcript - {user.name or user.phone}</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; padding: 32px; max-width: 800px; margin: 0 auto; }}
            h1 {{ color: #60a5fa; margin-bottom: 4px; }}
            .meta {{ color: #94a3b8; font-size: 14px; margin-bottom: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 12px; }}
            @media print {{
                body {{ background: #fff !important; color: #000 !important; }}
                div[style*="background"] {{ background: #f8fafc !important; border-color: #cbd5e1 !important; color: #000 !important; }}
                div[style*="color:#e2e8f0"] {{ color: #1e293b !important; }}
            }}
        </style>
    </head>
    <body>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h1>WhatsAI Conversation Transcript</h1>
            <button onclick="window.print()" style="background:#2563EB;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Print / Save PDF</button>
        </div>
        <div class="meta">
            <strong>User:</strong> {user.name or 'Unknown'} &bull; 
            <strong>Phone:</strong> {user.phone} &bull; 
            <strong>Total Messages:</strong> {len(messages)} &bull; 
            <strong>Exported:</strong> {messages[-1].timestamp.strftime("%Y-%m-%d") if messages else "N/A"}
        </div>
        <div>
            {rows_html if rows_html else '<p style="color:#94a3b8;">No messages recorded yet.</p>'}
        </div>
    </body>
    </html>
    """

    return Response(content=html, media_type="text/html")
