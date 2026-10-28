@echo off
title QR Code Safety Scanner Server
echo ===================================================
echo   QR Code Safety Scanner - Starting Local Server
echo ===================================================
echo.
echo Opening http://localhost:8000 in your browser...
start "" "http://localhost:8000"

echo Server is running! (Do not close this window)
echo.
python -m http.server 8000
if %errorlevel% neq 0 (
    echo.
    echo Python not found! Trying py or node...
    py -m http.server 8000
)
pause
