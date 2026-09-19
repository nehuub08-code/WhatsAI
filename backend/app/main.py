import time
import logging
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import Admin, Setting, User, Message, AuditLog
from app.security import hash_password
from app.services.gemini_service import DEFAULT_SYSTEM_PROMPT

# Import routers
from app.routers.auth import router as auth_router
from app.routers.webhook import router as webhook_router
from app.routers.dashboard import router as dashboard_router
from app.routers.users import router as users_router
from app.routers.messages import router as messages_router
from app.routers.settings import router as settings_router
from app.routers.analytics import router as analytics_router
from app.routers.audit_logs import router as audit_logs_router
from app.routers.export import router as export_router
from app.routers.simulator import router as simulator_router

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("whatsai.main")

# FastAPI App
app = FastAPI(
    title="WhatsAI - AI WhatsApp Assistant Platform",
    description="Meta WhatsApp Cloud API + Google Gemini 2.5 Flash Autonomous Assistant Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiter & Request Timing Middleware
request_timestamps = {}

@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()

    # Simple in-memory sliding window rate limiter
    history = request_timestamps.get(client_ip, [])
    # Keep requests from the last 60 seconds
    history = [t for t in history if now - t < 60]
    if len(history) >= settings.RATE_LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded. Please slow down."}
        )
    history.append(now)
    request_timestamps[client_ip] = history

    # Process request and add security headers
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Register Routers
app.include_router(auth_router)
app.include_router(webhook_router)
app.include_router(dashboard_router)
app.include_router(users_router)
app.include_router(messages_router)
app.include_router(settings_router)
app.include_router(analytics_router)
app.include_router(audit_logs_router)
app.include_router(export_router)
app.include_router(simulator_router)

@app.get("/api/health")
def health_check():
    """Health check endpoint for container and uptime monitoring"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat()
    }

def seed_initial_data(db: Session):
    """Seed initial admin, default settings, and sample conversations if empty"""
    # 1. Seed Default Admin
    admin = db.query(Admin).first()
    if not admin:
        logger.info("Seeding default admin user: 'admin'")
        admin = Admin(
            username="admin",
            password_hash=hash_password("Admin@12345"),
            created_at=datetime.utcnow()
        )
        db.add(admin)
        db.commit()

    # 2. Seed Default Settings
    default_settings = [
        ("auto_reply", "true", "Master auto-reply switch"),
        ("system_prompt", DEFAULT_SYSTEM_PROMPT, "Core Gemini system instructions"),
        ("gemini_model", "gemini-2.5-flash", "Gemini model version"),
        ("context_limit", "10", "Max messages kept in conversational memory"),
        ("temperature", "0.7", "Gemini sampling temperature"),
        ("max_tokens", "800", "Maximum output token ceiling"),
        ("meta_phone_number_id", settings.META_PHONE_NUMBER_ID or "105928374829103", "WhatsApp Cloud Phone Number ID"),
        ("meta_verify_token", settings.META_VERIFY_TOKEN or "whatsai_secure_verify_token_2026", "Meta Webhook Verification Token")
    ]
    for key, val, desc in default_settings:
        existing = db.query(Setting).filter(Setting.key == key).first()
        if not existing:
            db.add(Setting(key=key, value=val, description=desc, updated_at=datetime.utcnow()))
    db.commit()

    # 3. Seed Realistic WhatsApp Contacts and Conversations if 0 users
    user_count = db.query(User).count()
    if user_count == 0:
        logger.info("Seeding initial demonstration WhatsApp users and multi-turn conversations...")
        now = datetime.utcnow()

        demo_users_data = [
            {
                "name": "Marcus Vance",
                "phone": "+1 (555) 234-8901",
                "messages": [
                    ("Hi! Does WhatsAI support integration with our existing CRM?", "user", 180, now - timedelta(hours=3, minutes=20)),
                    ("Hello Marcus! 👋 Yes, WhatsAI offers standard webhooks and REST endpoints to integrate with Salesforce, HubSpot, or custom CRMs. We also provide automated customer data sync.", "assistant", 240.2, now - timedelta(hours=3, minutes=19)),
                    ("That sounds fantastic. What is the pricing for 5 WhatsApp numbers?", "user", 0, now - timedelta(hours=3, minutes=15)),
                    ("For 5 dedicated WhatsApp numbers, our Growth Tier with multi-agent routing starts at $199/month, including 50,000 monthly AI replies with Gemini 2.5 Flash. Would you like a demo call?", "assistant", 285.4, now - timedelta(hours=3, minutes=14)),
                ]
            },
            {
                "name": "Elena Rostova",
                "phone": "+44 7700 900123",
                "messages": [
                    ("Hello, I need help resetting my account password.", "user", 0, now - timedelta(hours=1, minutes=45)),
                    ("Hi Elena! I can guide you through that. Please visit https://whatsai.ai/forgot-password and enter your registered email. You'll receive a secure reset link within 60 seconds.", "assistant", 215.8, now - timedelta(hours=1, minutes=44)),
                    ("Got the email and it worked. Thank you so much for the fast help!", "user", 0, now - timedelta(hours=1, minutes=30)),
                    ("You're very welcome, Elena! Let me know if you need anything else. Have a wonderful day! 😊", "assistant", 195.1, now - timedelta(hours=1, minutes=29)),
                ]
            },
            {
                "name": "Devon Miller",
                "phone": "+1 (555) 891-3412",
                "messages": [
                    ("Can I customize the system prompt so the assistant speaks like a luxury brand?", "user", 0, now - timedelta(minutes=45)),
                    ("Absolutely Devon! In your WhatsAI dashboard under 'AI Settings', you can customize the complete System Prompt, adjust the tone, set specific brand guidelines, and choose the Gemini temperature.", "assistant", 310.5, now - timedelta(minutes=44)),
                    ("Can you give me an example prompt?", "user", 0, now - timedelta(minutes=15)),
                    ("Certainly! Here is an example: 'You are an exclusive concierge for Maison Luxury. Speak with refined elegance, anticipate client requests, and recommend bespoke offerings.'", "assistant", 260.0, now - timedelta(minutes=14)),
                ]
            },
            {
                "name": "Amina Patel",
                "phone": "+91 98201 12345",
                "messages": [
                    ("What is the average response time for Gemini 2.5 Flash on WhatsApp?", "user", 0, now - timedelta(minutes=10)),
                    ("Hello Amina! Google's Gemini 2.5 Flash averages between 180ms to 350ms for message completion, delivering near instantaneous WhatsApp replies to your customers ⚡", "assistant", 220.4, now - timedelta(minutes=9)),
                ]
            }
        ]

        for u_data in demo_users_data:
            user = User(
                name=u_data["name"],
                phone=u_data["phone"],
                created_at=now - timedelta(days=2),
                updated_at=now
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            for text, role, lat, ts in u_data["messages"]:
                msg = Message(
                    user_id=user.id,
                    role=role,
                    message=text,
                    timestamp=ts,
                    latency_ms=lat,
                    status="delivered"
                )
                db.add(msg)
            db.commit()

        # Add initial audit log
        audit = AuditLog(
            action="SYSTEM_INITIALIZED",
            admin="system",
            ip_address="127.0.0.1",
            timestamp=now,
            details="Database created, default admin seeded, and demonstration datasets loaded"
        )
        db.add(audit)
        db.commit()

@app.on_event("startup")
def on_startup():
    """Create database tables and seed baseline data"""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    logger.info("WhatsAI Backend initialized successfully.")
