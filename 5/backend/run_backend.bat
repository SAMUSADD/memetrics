@echo off
REM Mitra Backend (Windows one-click)
cd /d "%~dp0"
if not exist .venv (
  echo Creating virtual environment...
  python -m venv .venv
)
call .venv\Scripts\activate.bat
echo Installing dependencies...
pip install -r requirements.txt
echo Starting API at http://localhost:8000
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
