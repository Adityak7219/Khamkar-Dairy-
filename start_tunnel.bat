@echo off
title Khamkar Dairy - Cloudflare Live Tunnel
echo ===================================================
echo   Starting Khamkar Dairy Cloudflare Live Tunnel...
echo ===================================================
cd /d "%~dp0"
cloudflared.exe tunnel --url http://127.0.0.1:8000
pause
