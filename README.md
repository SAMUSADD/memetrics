# MeMetrics — Full Kit (Bottom Nav Edition) • Powered by Mitra

Everything in one place:
- **Backend (FastAPI)** Mitra DVI API with safe fallback.
- **ML training** (train_model.bat) to create a fresh model.
- **Frontend (animated, bottom navigation)** with 4 sections:
  - Feed (`index.html`)
  - Profile (`profile.html`)
  - Opportunities (`opportunities.html`)
  - Improve (`improve.html`)
- **One-click scripts**: start_all.bat, backend/run_backend.bat, frontend/run_frontend.bat

## Run (Windows, no typing)
1) Double-click **start_all.bat**.  
   - Backend health: http://localhost:8000/health  
   - Frontend (Feed): http://localhost:5500/index.html

## Retrain model (optional)
Double-click **ml/train_model.bat** (saves `backend/model.pkl`). Restart backend to load it.

## Manual (VS Code)
- Backend: create venv, `pip install -r requirements.txt`, run `python -m uvicorn app:app --reload`
- Frontend: `python -m http.server 5500` inside `frontend/`

API URL is set in `frontend/config.js` (defaults to localhost).
Enjoy 🚀
