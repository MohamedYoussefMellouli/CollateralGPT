"""
Authentication module for CollateralGPT.
Handles user registration, login, JWT token generation and verification.
"""

import os
import bcrypt as _bcrypt
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

# ── Config ────────────────────────────────────────────────────────────────────
DATABASE_URL   = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/collateralgpt")
JWT_SECRET     = os.getenv("JWT_SECRET", "collateralgpt_secret_key_2025")
JWT_ALGORITHM  = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

oauth2_scheme  = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
router         = APIRouter(prefix="/api/auth", tags=["auth"])

# ── DB helper ─────────────────────────────────────────────────────────────────
def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

# ── Pydantic models ───────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    mot_de_passe: str
    nom: str = ""
    prenom: str = ""

class LoginRequest(BaseModel):
    email: str
    mot_de_passe: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    nom: str = ""
    prenom: str = ""

class UserResponse(BaseModel):
    id: int
    email: str
    nom: str = ""
    prenom: str = ""
    created_at: datetime

# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MIN)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return {"email": email, "user_id": payload.get("user_id")}
    except JWTError:
        raise credentials_exception

# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest):
    """Create a new user account."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Check if email already exists
            cur.execute("SELECT id FROM users WHERE email = %s", (body.email,))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Email déjà utilisé")

            hashed = hash_password(body.mot_de_passe)
            cur.execute(
                "INSERT INTO users (email, mot_de_passe, nom, prenom) VALUES (%s, %s, %s, %s) RETURNING id, email, nom, prenom",
                (body.email, hashed, body.nom, body.prenom),
            )
            user = cur.fetchone()
            conn.commit()

        token = create_access_token({"sub": user["email"], "user_id": user["id"]})
        return TokenResponse(access_token=token, user_id=user["id"], email=user["email"], nom=user["nom"] or "", prenom=user["prenom"] or "")
    finally:
        conn.close()

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    """Authenticate user and return JWT token."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, email, mot_de_passe, nom, prenom FROM users WHERE email = %s",
                (body.email,),
            )
            user = cur.fetchone()

        if not user or not verify_password(body.mot_de_passe, user["mot_de_passe"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect",
            )

        token = create_access_token({"sub": user["email"], "user_id": user["id"]})
        return TokenResponse(access_token=token, user_id=user["id"], email=user["email"], nom=user["nom"] or "", prenom=user["prenom"] or "")
    finally:
        conn.close()

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Return current authenticated user info."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, email, nom, prenom, created_at FROM users WHERE email = %s",
                (current_user["email"],),
            )
            user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        return UserResponse(**user)
    finally:
        conn.close()
