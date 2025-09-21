import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np

try:
    import joblib
except Exception:
    joblib = None

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

app = FastAPI(title="Mitra DVI API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FEATURES = ["skills_index","learning_pace","certifications","project_score","financial_behavior","resilience_score"]

class Req(BaseModel):
    skills_index: float = Field(0.6, ge=0, le=1)
    learning_pace: float = Field(0.6, ge=0, le=1)
    certifications: int = Field(1, ge=0)
    project_score: float = Field(0.5, ge=0, le=1)
    financial_behavior: float = Field(0.5, ge=0, le=1)
    resilience_score: float = Field(0.6, ge=0, le=1)

class Res(BaseModel):
    dvi: int
    grade: str
    drivers: dict

def grade_from_dvi(d):
    return "Excellent" if d>=760 else "Good" if d>=680 else "Fair" if d>=600 else "Developing"

def load_model():
    if joblib is None:
        return None
    try:
        if os.path.exists(MODEL_PATH):
            return joblib.load(MODEL_PATH)
    except Exception:
        return None
    return None

MODEL = load_model()

@app.get("/health")
def health():
    return {"status":"ok","model_loaded": MODEL is not None}

@app.post("/predict", response_model=Res)
def predict(r: Req):
    x = np.array([
        r.skills_index, r.learning_pace, r.certifications,
        r.project_score, r.financial_behavior, r.resilience_score
    ], dtype=float).reshape(1,-1)

    if MODEL is not None:
        try:
            raw = float(MODEL["model"].predict(x)[0]) if isinstance(MODEL, dict) and "model" in MODEL else float(MODEL.predict(x)[0])
            dvi = int(max(300, min(900, round(300 + raw*600))))
            if isinstance(MODEL, dict) and "model" in MODEL and hasattr(MODEL["model"], "feature_importances_"):
                imps = MODEL["model"].feature_importances_
            elif hasattr(MODEL, "feature_importances_"):
                imps = MODEL.feature_importances_
            elif hasattr(MODEL, "coef_"):
                imps = np.abs(MODEL.coef_).ravel()
            else:
                imps = np.ones(len(FEATURES))
            imps = np.maximum(imps, 1e-8); imps = imps/imps.sum()
            drivers = {f: float(round(100*i,2)) for f,i in zip(FEATURES, imps)}
            return Res(dvi=dvi, grade=grade_from_dvi(dvi), drivers=drivers)
        except Exception:
            pass

    # Fallback transparent weights
    w = np.array([0.28, 0.22, 0.12, 0.18, 0.12, 0.08])
    xx = x.copy(); xx[0,2] = np.tanh(xx[0,2]/5.0)
    s01 = float(np.clip((xx*w).sum(), 0, 1))
    dvi = int(300 + 600*s01)
    w = w/w.sum()
    drivers = {f: float(round(100*i,2)) for f,i in zip(FEATURES, w)}
    return Res(dvi=dvi, grade=grade_from_dvi(dvi), drivers=drivers)
