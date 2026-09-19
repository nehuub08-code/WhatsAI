# WhatsAI — Industry-Ready AI WhatsApp Assistant

WhatsAI is a commercial full-stack SaaS platform that connects the **Meta WhatsApp Cloud API** with **Google's Gemini 2.5 Flash API** to automatically understand customer intent, maintain multi-turn conversational memory, store message transcripts, and deliver intelligent replies in real time.

---

## 🌟 Key Features

- **Google Gemini 2.5 Flash Engine**: Generates contextual, helpful WhatsApp replies with conversational memory and dynamic token insertion.
- **Meta WhatsApp Cloud API Integration**: Signature-verified webhook handler (`X-Hub-Signature-256`), deduplication, and automated message dispatch.
- **Interactive WhatsApp Simulator**: Built-in visual WhatsApp phone simulator allowing you to test customer messages, conversational memory, and Gemini AI responses directly inside the UI without needing an active Meta webhook tunnel.
- **WhatsApp Web Live Inbox**: Two-column interactive chat interface to inspect conversations, send manual agent replies, and toggle auto-reply per customer.
- **Telemetry & Recharts Visualizations**: Daily traffic trends, 24-hour peak hourly distributions, Gemini latency tracking against SLA targets, and customer retention depth.
- **Export Capabilities**: One-click export to CSV spreadsheet or print-ready PDF transcript.
- **Enterprise Security**: JWT authentication, salted PBKDF2/bcrypt password hashing, rate limiting, and immutable audit logs.
- **Dual Database Flexibility**: Runs out-of-the-box with SQLite WAL mode for local zero-config testing, with native PostgreSQL support for Docker and production.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (Dark glassmorphic aesthetic)
- **Visualizations**: Recharts
- **Icons & Motion**: Lucide React + Framer Motion
- **API Client**: Axios with JWT interceptors

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Database ORM**: SQLAlchemy (PostgreSQL / SQLite)
- **Validation**: Pydantic v2
- **Auth**: JWT (HMAC-SHA256) + PBKDF2 password hashing
- **Server**: Uvicorn ASGI

### AI & Messaging
- **AI Model**: Google Gemini 2.5 Flash (`gemini-2.5-flash`)
- **Messaging**: Meta WhatsApp Cloud API (Graph API v21.0)

---

## 📂 Project Structure

```
whatsai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, middleware & seed data
│   │   ├── config.py            # Environment configuration
│   │   ├── database.py          # SQLAlchemy session & engine
│   │   ├── models.py            # Database tables schema
│   │   ├── schemas.py           # Pydantic request & response models
│   │   ├── security.py          # JWT, passwords & HMAC signature checks
│   │   ├── routers/             # API route handlers
│   │   └── services/            # Gemini AI & WhatsApp Cloud API services
│   ├── requirements.txt         # Backend Python dependencies
│   └── test_api.py              # Automated API verification test suite
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client with JWT interceptor
│   │   ├── context/             # AuthContext & global auto-reply state
│   │   ├── components/          # Layout, cards, and WhatsApp simulator
│   │   └── pages/               # Dashboard, Conversations, Analytics, etc.
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Dark glassmorphism theme tokens
│   └── vite.config.js           # Vite dev server & API proxy
├── database/
│   ├── schema.sql               # PostgreSQL / SQLite DDL migration
│   └── seed.py                  # Standalone data seeder
├── docker/
│   ├── Dockerfile.backend       # FastAPI container
│   ├── Dockerfile.frontend      # React + Nginx container
│   └── nginx.conf               # Nginx reverse proxy configuration
├── docs/
│   ├── API_SPECIFICATION.md     # OpenAPI REST documentation
│   └── ARCHITECTURE.md          # Architectural and memory design
├── docker-compose.yml           # Complete PostgreSQL + Backend + Frontend stack
├── .env.example                 # Environment configuration template
└── README.md                    # Project documentation
```

---

## 🚀 Quickstart Guide

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `Admin@12345`

---

### Method 1: Local Development (Fastest)

#### 1. Start FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Swagger Documentation: `http://localhost:8000/docs`

#### 2. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend Web Console will be accessible at: `http://localhost:5173`

---

### Method 2: Docker Compose (Production Stack)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Start PostgreSQL, FastAPI, and React
docker-compose up --build -d
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## ⚙️ Meta WhatsApp Cloud API Setup Guide

1. Log into **[Meta for Developers](https://developers.facebook.com/)** and create a Business App.
2. Add the **WhatsApp** product to your app.
3. Under **WhatsApp > API Setup**:
   - Note your **Phone number ID**.
   - Generate a **Temporary Access Token** (or create a permanent System User Token in Business Manager).
4. Under **WhatsApp > Configuration**:
   - Set **Callback URL** to: `https://your-domain.com/webhook` (or use your ngrok HTTPS URL for local development).
   - Set **Verify Token** to: `whatsai_secure_verify_token_2026` (matching your `.env`).
   - Subscribe to the **`messages`** webhook field.
5. In your WhatsAI `.env`:
   ```env
   META_ACCESS_TOKEN=your_meta_system_user_token
   META_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
   META_VERIFY_TOKEN=whatsai_secure_verify_token_2026
   META_APP_SECRET=your_app_secret
   ```

---

## 🤖 Google Gemini 2.5 Flash Setup Guide

1. Obtain an API key from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2. Add your key to `.env`:
   ```env
   GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. Customize your assistant's system instructions, temperature, and context window directly from the **AI Settings** page in the WhatsAI dashboard!

---

## 🧪 Testing & Verification

Run the automated backend test suite:
```bash
cd backend
python test_api.py
```
This tests authentication, webhook verification, WhatsApp simulator, database aggregations, and settings persistence.
