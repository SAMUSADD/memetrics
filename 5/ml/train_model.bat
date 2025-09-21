@echo off
cd /d "%~dp0"
if exist ..\backend\.venv\Scripts\activate.bat (
  call ..\backend\.venv\Scripts\activate.bat
) else (
  cd ..\backend
  python -m venv .venv
  call .venv\Scripts\activate.bat
  pip install -r requirements.txt
  cd ..\ml
)
python train.py
echo.
echo Model trained. Restart backend to load it.
pause
