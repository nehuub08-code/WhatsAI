# WhatsAI PowerShell Launcher
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "         Starting WhatsAI Full-Stack Platform          " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodePath = "$env:LOCALAPPDATA\Programs\nodejs"
$env:Path = "$nodePath;$env:Path"

Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

Write-Host "[2/2] Starting React Frontend on http://127.0.0.1:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = '$nodePath;' + `$env:Path; cd '$baseDir\frontend'; npm run dev -- --host 127.0.0.1 --port 5173"

Write-Host "`n=======================================================" -ForegroundColor Yellow
Write-Host "WhatsAI is running:" -ForegroundColor Yellow
Write-Host "  ➜ Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  ➜ Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  ➜ API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nDefault Admin: admin / Admin@12345" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Yellow
