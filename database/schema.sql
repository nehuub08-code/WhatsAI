-- WhatsAI PostgreSQL and SQLite Production Schema DDL
-- Version: 1.0.0

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- 2. Users (WhatsApp Contacts) Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(120),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    latency_ms DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'delivered', -- 'sent', 'delivered', 'read'
    raw_metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- 4. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. AuditLogs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(120) NOT NULL,
    admin VARCHAR(100) NOT NULL,
    ip_address VARCHAR(64),
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin);

-- Seed Baseline Settings
INSERT INTO settings (key, value, description)
VALUES 
    ('auto_reply', 'true', 'Master AI auto-reply toggle'),
    ('system_prompt', 'You are WhatsAI, an intelligent, helpful WhatsApp customer assistant.', 'Gemini AI system prompt'),
    ('gemini_model', 'gemini-2.5-flash', 'Gemini model version'),
    ('context_limit', '10', 'Number of conversation messages in memory context'),
    ('temperature', '0.7', 'Sampling temperature'),
    ('max_tokens', '800', 'Maximum response token limit'),
    ('meta_phone_number_id', '105928374829103', 'Meta WhatsApp Phone Number ID'),
    ('meta_verify_token', 'whatsai_secure_verify_token_2026', 'Meta Webhook Verify Token')
ON CONFLICT (key) DO NOTHING;
