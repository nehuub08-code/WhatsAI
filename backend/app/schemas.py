from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# ----------------- Auth Schemas -----------------

class LoginRequest(BaseModel):
    username: str = Field(..., example="admin")
    password: str = Field(..., example="Admin@12345")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    admin: "AdminOut"

class AdminOut(BaseModel):
    id: int
    username: str
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ----------------- User Schemas -----------------

class UserBase(BaseModel):
    phone: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0
    last_message: Optional[str] = None
    last_active: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Message Schemas -----------------

class MessageBase(BaseModel):
    message: str

class MessageCreate(MessageBase):
    user_id: int
    role: str = "user"  # "user" or "assistant"
    latency_ms: Optional[float] = 0.0
    status: Optional[str] = "delivered"

class MessageOut(BaseModel):
    id: int
    user_id: int
    role: str
    message: str
    timestamp: datetime
    latency_ms: float
    status: str
    raw_metadata: Optional[str] = None

    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    user_id: int
    message: str

# ----------------- Settings Schemas -----------------

class SettingItem(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SettingsUpdate(BaseModel):
    auto_reply: Optional[bool] = None
    system_prompt: Optional[str] = None
    gemini_model: Optional[str] = None
    context_limit: Optional[int] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    meta_phone_number_id: Optional[str] = None
    meta_verify_token: Optional[str] = None
    gemini_api_key: Optional[str] = None
    meta_access_token: Optional[str] = None
    meta_app_secret: Optional[str] = None

class TestGeminiRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = "gemini-2.5-flash"

class TestMetaRequest(BaseModel):
    phone_number: str
    access_token: Optional[str] = None
    phone_number_id: Optional[str] = None
    message: Optional[str] = "Hello from WhatsAI! Your Meta WhatsApp Cloud API integration is successfully connected and active. 🚀"

class SystemSettingsOut(BaseModel):
    auto_reply: bool
    system_prompt: str
    gemini_model: str
    context_limit: int
    temperature: float
    max_tokens: int
    meta_phone_number_id: str
    meta_verify_token: str
    has_meta_token: bool
    has_gemini_key: bool
    gemini_api_key_masked: Optional[str] = None
    meta_access_token_masked: Optional[str] = None
    tunnel_url: Optional[str] = None
    webhook_url: Optional[str] = None

# ----------------- Audit Log Schemas -----------------

class AuditLogOut(BaseModel):
    id: int
    action: str
    admin: str
    ip_address: Optional[str] = None
    timestamp: datetime
    details: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- Dashboard & Analytics Schemas -----------------

class DashboardKPI(BaseModel):
    total_users: int
    total_conversations: int
    messages_today: int
    avg_response_time_ms: float
    auto_reply: bool
    ai_token_usage: int
    active_users_24h: int

class DailyTrendItem(BaseModel):
    date: str
    user_messages: int
    ai_replies: int
    total: int

class ActiveUserTrendItem(BaseModel):
    date: str
    active_users: int

class DashboardResponse(BaseModel):
    kpi: DashboardKPI
    daily_messages: List[DailyTrendItem]
    active_users_trend: List[ActiveUserTrendItem]
    recent_messages: List[MessageOut]

class HourlyActivityItem(BaseModel):
    hour: str
    messages: int

class LatencyTrendItem(BaseModel):
    date: str
    avg_latency_ms: float
    target_sla_ms: float = 500.0

class RetentionMetricItem(BaseModel):
    category: str
    count: int
    percentage: float

class AnalyticsResponse(BaseModel):
    kpis: Dict[str, Any]
    daily_messages: List[DailyTrendItem]
    new_users_trend: List[ActiveUserTrendItem]
    peak_hours: List[HourlyActivityItem]
    latency_trend: List[LatencyTrendItem]
    retention: List[RetentionMetricItem]

# ----------------- WhatsApp Simulator Schemas -----------------

class SimulatorIncomingRequest(BaseModel):
    phone: str = Field(..., example="+1 (555) 234-5678")
    name: Optional[str] = Field("Alex Johnson", example="Alex Johnson")
    message: str = Field(..., example="Hi! Can you tell me your pricing plans?")

class SimulatorResponse(BaseModel):
    success: bool
    incoming_message: MessageOut
    outgoing_reply: Optional[MessageOut] = None
    latency_ms: float
    auto_reply_enabled: bool
    user: UserOut
