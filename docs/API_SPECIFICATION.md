# WhatsAI REST API Specification

Version: 1.0.0  
Base URL: `http://localhost:8000` (or `https://yourdomain.com`)

All administrative endpoints require a Bearer token in the `Authorization` header:
`Authorization: Bearer <access_token>`

---

## 1. Authentication Endpoints

### `POST /api/auth/login` or `/login`
Authenticate an admin and receive a JWT Bearer access token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin@12345"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "admin": {
    "id": 1,
    "username": "admin",
    "created_at": "2026-09-19T06:00:00Z",
    "last_login": "2026-09-19T06:30:00Z"
  }
}
```

### `GET /api/auth/me`
Retrieve profile of currently authenticated admin.

### `PUT /api/auth/change-password`
Update admin account password.

---

## 2. WhatsApp Webhook Endpoints

### `GET /webhook`
Meta WhatsApp Cloud API webhook challenge verification.

**Query Parameters:**
- `hub.mode`: `"subscribe"`
- `hub.verify_token`: `<META_VERIFY_TOKEN>`
- `hub.challenge`: `<integer/string challenge>`

**Response (200 OK):** Plain text `<hub.challenge>`

### `POST /webhook`
Receives incoming WhatsApp message payload from Meta Cloud API.

**Headers:**
- `X-Hub-Signature-256`: `sha256=<hmac_hash>`

**Response (200 OK):**
```json
{
  "status": "EVENT_RECEIVED"
}
```

---

## 3. Dashboard Endpoints

### `GET /api/dashboard` or `/dashboard`
Aggregated telemetry, KPI metrics, and chart series.

**Response (200 OK):**
```json
{
  "kpi": {
    "total_users": 24,
    "total_conversations": 22,
    "messages_today": 142,
    "avg_response_time_ms": 235.4,
    "auto_reply": true,
    "ai_token_usage": 18450,
    "active_users_24h": 18
  },
  "daily_messages": [...],
  "active_users_trend": [...],
  "recent_messages": [...]
}
```

---

## 4. Users Management

### `GET /api/users`
List contacts with query parameter search: `?search=+1555`

### `POST /api/users`
Register a new contact manually.

### `DELETE /api/users/{id}`
Delete a user and cascade delete conversation transcripts.

---

## 5. Messages Endpoints

### `GET /api/messages`
Retrieve message records.
- Query parameters: `?user_id=1&search=pricing&limit=50&offset=0`

### `POST /api/send-message`
Manually send an outgoing WhatsApp message to a user.

```json
{
  "user_id": 1,
  "message": "Hello from our support manager! Let us know if you need assistance."
}
```

---

## 6. AI Engine Settings

### `GET /api/settings`
Returns active AI configuration and credentials status.

### `PUT /api/settings`
Update AI parameters:
```json
{
  "auto_reply": true,
  "system_prompt": "You are WhatsAI, a helpful assistant...",
  "gemini_model": "gemini-2.5-flash",
  "context_limit": 10,
  "temperature": 0.7,
  "max_tokens": 800
}
```

---

## 7. WhatsApp Live Simulator

### `POST /api/simulator/incoming`
Simulate an incoming WhatsApp message in real-time.

```json
{
  "phone": "+1 (555) 234-5678",
  "name": "Sarah Connor",
  "message": "Hi WhatsAI! Can you describe your features?"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "incoming_message": { ... },
  "outgoing_reply": {
    "role": "assistant",
    "message": "Hello Sarah! WhatsAI is an autonomous WhatsApp assistant...",
    "latency_ms": 245.2
  },
  "latency_ms": 245.2,
  "auto_reply_enabled": true
}
```

---

## 8. Export Endpoints

### `GET /api/export/csv?user_id={id}`
Download conversation as CSV.

### `GET /api/export/pdf?user_id={id}`
Render formatted HTML transcript ready for browser printing to PDF.
