@echo off
title WhatsAI Public WhatsApp Webhook Tunnel
set "PATH=C:\Users\admin\AppData\Local\Programs\nodejs;C:\Windows\system32;C:\Windows;%PATH%"
cd /d "%~dp0"

echo ======================================================================
echo                 WhatsAI - Public Webhook Tunnel
echo ======================================================================
echo.
echo Forwarding public HTTPS requests to http://127.0.0.1:8000
echo.
echo Select your tunneling provider:
echo.
echo   [1] Pinggy (Recommended - instant, zero signup, built-in Windows SSH)
echo   [2] localtunnel (via npx localtunnel)
echo   [3] ngrok (Uses downloaded ngrok.exe)
echo.
set /p choice="Enter option (1, 2, or 3, default is 1): "

if "%choice%"=="2" goto run_localtunnel
if "%choice%"=="3" goto run_ngrok

:run_pinggy
echo.
echo ======================================================================
echo Starting Pinggy Tunnel...
echo Look for the 'https://...free.pinggy.link' URL below.
echo.
echo In Meta App Dashboard, set:
echo   Callback URL: https://YOUR-PINGGY-URL/api/webhook
echo   Verify Token: whatsai_secure_verify_token_2026
echo ======================================================================
echo.
ssh -o StrictHostKeyChecking=no -p 443 -R0:127.0.0.1:8000 qr@free.pinggy.io
goto end

:run_localtunnel
echo.
echo ======================================================================
echo Starting localtunnel...
echo Once connected, copy the 'https://...loca.lt' URL.
echo.
echo In Meta App Dashboard, set:
echo   Callback URL: https://YOUR-URL.loca.lt/api/webhook
echo   Verify Token: whatsai_secure_verify_token_2026
echo ======================================================================
echo.
npx --yes localtunnel --port 8000
goto end

:run_ngrok
echo.
echo ======================================================================
echo Starting ngrok...
echo.
echo In Meta App Dashboard, set:
echo   Callback URL: https://YOUR-URL.ngrok-free.app/api/webhook
echo   Verify Token: whatsai_secure_verify_token_2026
echo ======================================================================
echo.
if exist "ngrok.exe" (
    .\ngrok.exe http 8000
) else (
    ngrok http 8000
)
goto end

:end
echo.
echo Tunnel session ended.
pause
