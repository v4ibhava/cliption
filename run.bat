@echo off
title Cliption - Smart Video Cropper & Offline AI Captions
echo ========================================================
echo   Cliption - Smart Video Cropper & Dynamic Captions
echo   100%% Offline AI Studio (NVIDIA GPU + CPU)
echo ========================================================
echo.
echo Starting Cliption Backend and Web Studio...
cd /d "%~dp0backend"
start http://127.0.0.1:8000
uv run python run.py
pause
