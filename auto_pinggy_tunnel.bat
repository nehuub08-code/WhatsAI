@echo off
title WhatsAI Live WhatsApp Webhook Tunnel
cd /d "%~dp0"
echo ======================================================================
echo             WhatsAI - Live Webhook Tunnel Started!
echo ======================================================================
echo.
echo Forwarding incoming Meta WhatsApp messages to http://127.0.0.1:8000
echo Keep this window open while chatting on WhatsApp!
echo.
echo Connecting...
echo.
ssh -o StrictHostKeyChecking=no -p 443 -R0:127.0.0.1:8000 qr@free.pinggy.io
pause
