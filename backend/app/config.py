import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "WhatsAI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./whatsai.db",
        description="PostgreSQL or SQLite connection string"
    )

    # JWT Authentication
    JWT_SECRET: str = Field(
        default="whatsai-super-secret-key-change-in-production-32bytesmin",
        description="Secret key for JWT token signing"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Google Gemini API
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API key for Gemini 2.5 Flash"
    )
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Meta WhatsApp Cloud API
    META_ACCESS_TOKEN: str = Field(
        default="",
        description="System user permanent access token from Meta Developer Portal"
    )
    META_PHONE_NUMBER_ID: str = Field(
        default="",
        description="WhatsApp Business Phone Number ID"
    )
    META_VERIFY_TOKEN: str = Field(
        default="whatsai_secure_verify_token_2026",
        description="Webhook verification token specified in Meta App Dashboard"
    )
    META_APP_SECRET: str = Field(
        default="",
        description="App Secret from Meta Developer Dashboard for X-Hub-Signature-256 validation"
    )

    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]
    RATE_LIMIT_PER_MINUTE: int = 120

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
