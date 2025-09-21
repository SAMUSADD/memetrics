import os, time, sqlite3, hashlib, secrets
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np

ROOT = os.path.dirname(__file__)
DB_PATH = os.path.join(ROOT, "db.sqlite3")
MODEL_PATH = os.path.join(ROOT, "model.pkl")

app = FastAPI(title="Mitra DVI API (Auth Edition)", version="3.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    con = get_db(); cur = con.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        pw_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
    )""")
    cur.execute("""CREATE TABLE IF NOT EXISTS sessions(
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )""")
    cur.execute("""CREATE TABLE IF NOT EXISTS posts(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        dvi INTEGER DEFAULT 0,
        grade TEXT DEFAULT '',
        created_at INTEGER NOT NULL,
        likes INTEGER DEFAULT 0,
        pledge_total REAL DEFAULT 0.0
    )""")
    cur.execute("""CREATE TABLE IF NOT EXISTS comments(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    )""")
    cur.execute("""CREATE TABLE IF NOT EXISTS pledges(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    )""")
    cur.execute("""CREATE TABLE IF NOT EXISTS history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT NOT NULL,
        dvi INTEGER NOT NULL,
        ts INTEGER NOT NULL
    )""")
    con.commit(); con.close()

init_db()

def hash_pw(password: str) -> str:
    import secrets, hashlib
    salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${h}"

def check_pw(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split("$", 1)
        import hashlib
        return hashlib.sha256((salt + password).encode()).hexdigest() == h
    except Exception:
        return False

def create_session(user_id: int, days: int = 7) -> str:
    import secrets, time
    token = secrets.token_urlsafe(32)
    now = int(time.time())
    exp = now + days*86400
    con = get_db(); cur = con.cursor()
    cur.execute("INSERT INTO sessions(token,user_id,expires_at,created_at) VALUES(?,?,?,?)", (token, user_id, exp, now))
    con.commit(); con.close()
    return token

from fastapi import Header
from typing import Optional
def get_user_by_token(token: Optional[str]):
    if not token: return None
    con = get_db(); cur = con.cursor()
    row = cur.execute("SELECT u.id,u.email,u.name,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?", (token,)).fetchone()
    con.close()
    import time
    if not row: return None
    if int(time.time()) > row["expires_at"]: return None
    return dict(row)

def require_user(authorization: Optional[str] = Header(default=None)):
    token = None
    if authorization:
        parts = authorization.split()
        token = parts[1] if len(parts)==2 and parts[0].lower()=="bearer" else authorization.strip()
    user = get_user_by_token(token)
    if not user: from fastapi import HTTPException; raise HTTPException(401, "Unauthorized")
    return user

from pydantic import BaseModel, Field
class RegisterIn(BaseModel):
    email: str
    name: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str

@app.post("/auth/register")
def register(data: RegisterIn):
    con = get_db(); cur = con.cursor()
    import time
    try:
        cur.execute("INSERT INTO users(email,name,pw_hash,created_at) VALUES(?,?,?,?)",
                    (data.email.strip().lower(), data.name.strip(), hash_pw(data.password), int(time.time())))
        con.commit()
        uid = cur.lastrowid
    except sqlite3.IntegrityError:
        con.close()
        raise HTTPException(400, "Email already registered")
    con.close()
    token = create_session(uid)
    return {"token": token, "name": data.name, "email": data.email}

@app.post("/auth/login")
def login(data: LoginIn):
    con = get_db(); cur = con.cursor()
    row = cur.execute("SELECT id,email,name,pw_hash FROM users WHERE email=?", (data.email.strip().lower(),)).fetchone()
    con.close()
    if not row or not check_pw(data.password, row["pw_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_session(row["id"])
    return {"token": token, "name": row["name"], "email": row["email"]}

@app.get("/me")
def me(user=Depends(require_user)):
    return {"name": user["name"], "email": user["email"]}

@app.post("/auth/logout")
def logout(authorization: Optional[str] = Header(default=None)):
    token = None
    if authorization:
        parts = authorization.split()
        token = parts[1] if len(parts)==2 and parts[0].lower()=="bearer" else authorization.strip()
    if not token: raise HTTPException(400, "Missing token")
    con = get_db(); cur = con.cursor()
    cur.execute("DELETE FROM sessions WHERE token=?", (token,))
    con.commit(); con.close()
    return {"ok": True}

# predict (same as before)
import numpy as np
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
def grade_from_dvi(d): return "Excellent" if d>=760 else "Good" if d>=680 else "Fair" if d>=600 else "Developing"
try:
    import joblib, os
    def load_model():
        if os.path.exists(MODEL_PATH):
            return joblib.load(MODEL_PATH)
except Exception:
    joblib=None
    def load_model(): return None
MODEL = load_model()
@app.get("/health")
def health(): return {"status":"ok","model_loaded": MODEL is not None}
@app.post("/predict", response_model=Res)
def predict(r: Req):
    x = np.array([r.skills_index, r.learning_pace, r.certifications, r.project_score, r.financial_behavior, r.resilience_score], dtype=float).reshape(1,-1)
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
        except Exception: pass
    w = np.array([0.28,0.22,0.12,0.18,0.12,0.08])
    xx = x.copy(); xx[0,2] = np.tanh(xx[0,2]/5.0)
    s01 = float(np.clip((xx*w).sum(), 0, 1))
    dvi = int(300 + 600*s01)
    w = w/w.sum()
    drivers = {f: float(round(100*i,2)) for f,i in zip(FEATURES, w)}
    return Res(dvi=dvi, grade=grade_from_dvi(dvi), drivers=drivers)
