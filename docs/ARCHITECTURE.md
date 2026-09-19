# WhatsAI Architecture & Technical Design

## 1. System Overview

WhatsAI bridges Meta's WhatsApp Cloud API with Google's Gemini 2.5 Flash model to provide an autonomous, context-aware AI assistant platform for enterprises.

```
WhatsApp Mobile App
       │
       ▼
Meta WhatsApp Cloud API (Graph API v21.0)
       │
       ├─► (POST /webhook with HMAC-SHA256 signature)
       ▼
WhatsAI FastAPI Backend
       │
       ├─► 1. Signature & Rate Limit Verifier
       ├─► 2. Contact Resolver (PostgreSQL / SQLite)
       ├─► 3. Conversational Context Builder (N past messages)
       ├─► 4. Google Gemini 2.5 Flash API (Streaming / Async REST)
       ├─► 5. Latency Benchmark Timer (milliseconds)
       ├─► 6. DB Persistence (User message + AI reply)
       ├─► 7. Meta Cloud API Sender (POST /messages)
       │
       ▼
WhatsAI Admin Portal (React + Vite + Tailwind CSS)
       ├─ Telemetry & Recharts Visualizations
       ├─ WhatsApp Web Style Multi-Thread Inbox
       ├─ AI Hyperparameter & Prompt Studio
       ├─ Interactive WhatsApp Simulator
       └─ Immutable Security Audit Trail
```

## 2. Conversational Memory Strategy

1. When an incoming message is received, WhatsAI checks the user's conversation thread in the database.
2. It fetches the last `context_limit` messages (configured via Admin Settings, default 10).
3. It converts past messages into Gemini's multi-turn `contents` array:
   - User messages map to `role: "user"`
   - AI replies map to `role: "model"`
4. It sets Gemini's `systemInstruction` with dynamic token replacement (`{user_name}`, `{phone}`).
5. Gemini 2.5 Flash responds within 180ms - 350ms, maintaining continuity across complex customer inquiries.

## 3. Security Hardening

- **Meta Signature Validation**: Validates `X-Hub-Signature-256` using HMAC-SHA256 and the Meta App Secret.
- **JWT Protection**: 24-hour expiration tokens signed with HMAC-SHA256.
- **Password Protection**: Salted PBKDF2 HMAC-SHA256 with 260,000 rounds.
- **Rate Limiting**: Sliding window rate limiting prevents API abuse and DoS.
- **Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`.
- **Audit Logging**: All administrative actions (logins, setting changes, simulated messages) are stored with IP and timestamps.
