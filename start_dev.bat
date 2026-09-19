@echo off
TITLE WhatsAI Full-Stack Development Launcher
echo =======================================================
echo          Starting WhatsAI Full-Stack Platform
echo =======================================================
echo.

SET "NODE_PATH=%LOCALAPPDATA%\Programs\nodejs"
SET "PATH=%NODE_PATH%;%PATH%"

echo [1/2] Starting FastAPI Backend on port 8000...
start "WhatsAI Backend (FastAPI)" cmd /k "cd /d %~dp0backend && py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Starting React + Vite Frontend on port 5173...
start "WhatsAI Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo =======================================================
echo WhatsAI is now running:
echo - Frontend:  http://localhost:5173
echo - Backend:   http://localhost:8000
echo - Swagger:   http://localhost:8000/docs
echo.
echo Login: admin / Admin@12345 (or click Demo Autofill)
echo =======================================================
pause
