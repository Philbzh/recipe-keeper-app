@echo off
REM Recipe App Launcher
REM To add an icon: Create a shortcut, right-click → Properties → Change Icon
title Recipe App - Starting...
cd /d "%~dp0"
echo.
echo ========================================
echo   Starting Recipe App...
echo ========================================
echo.
echo Opening browser in a few seconds...
echo Press Ctrl+C to stop the server
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5173
npm run dev
pause
