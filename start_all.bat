@echo off
cd /d "%~dp0"
start "" cmd /c "cd backend && call run_backend.bat"
timeout /t 6 >nul
start "" cmd /c "cd frontend && call run_frontend.bat"
