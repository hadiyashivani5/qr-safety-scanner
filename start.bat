@echo off
title QR Code Safety Scanner Server
echo ===================================================
echo   QR Code Safety Scanner - Starting Local Server
echo ===================================================
echo Opening website in your default browser...
start http://localhost:8000

echo Starting Python server on port 8000...
python -m http.server 8000 --bind 0.0.0.0
if %errorlevel% neq 0 (
    echo.
    echo Python not found! Trying Node.js http-server...
    npx http-server . -p 8000 -o
)
pause
