import secrets
import urllib.parse

import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if settings.disable_local_login:
        raise HTTPException(status_code=403, detail="Local registration is disabled. Please sign in with SSO.")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(str(user.id))
    return TokenResponse(access_token=token, user_id=str(user.id), full_name=user.full_name, email=user.email)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    if settings.disable_local_login:
        raise HTTPException(status_code=403, detail="Local login is disabled. Please sign in with SSO.")
    user = db.query(User).filter(User.email == body.email).first()
    # hashed_password is None for SSO-only users — treat as invalid credentials
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_token(str(user.id))
    return TokenResponse(access_token=token, user_id=str(user.id), full_name=user.full_name, email=user.email)


# ── Authentik OIDC ────────────────────────────────────────────────────────────

def _sso_enabled() -> bool:
    return bool(settings.authentik_url and settings.authentik_client_id and settings.authentik_client_secret)


@router.get("/oidc/available")
def oidc_available():
    """Lets the frontend know whether SSO is configured and whether local login is allowed."""
    return {"enabled": _sso_enabled(), "local_login_enabled": not settings.disable_local_login}


@router.get("/oidc/login")
def oidc_login():
    if not _sso_enabled():
        raise HTTPException(status_code=503, detail="SSO not configured")

    state = secrets.token_urlsafe(32)
    params = urllib.parse.urlencode({
        "client_id": settings.authentik_client_id,
        "redirect_uri": settings.authentik_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
    })
    auth_url = f"{settings.authentik_url}/application/o/authorize/?{params}"

    response = RedirectResponse(url=auth_url, status_code=302)
    response.set_cookie(
        key="oidc_state",
        value=state,
        httponly=True,
        samesite="lax",
        max_age=300,
        secure=settings.authentik_url.startswith("https") if settings.authentik_url else False,
    )
    return response


@router.get("/oidc/callback")
def oidc_callback(
    request: Request,
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    # CSRF validation
    stored_state = request.cookies.get("oidc_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid state — possible CSRF attempt")

    # Exchange authorization code for tokens
    token_resp = http_requests.post(
        f"{settings.authentik_url}/application/o/token/",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.authentik_redirect_uri,
            "client_id": settings.authentik_client_id,
            "client_secret": settings.authentik_client_secret,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    if not token_resp.ok:
        raise HTTPException(status_code=502, detail=f"Authentik token exchange failed: {token_resp.text}")

    access_token = token_resp.json().get("access_token")

    # Fetch user info from Authentik
    userinfo_resp = http_requests.get(
        f"{settings.authentik_url}/application/o/userinfo/",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if not userinfo_resp.ok:
        raise HTTPException(status_code=502, detail="Failed to fetch user info from Authentik")

    userinfo = userinfo_resp.json()
    email = userinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Authentik did not return an email address")

    full_name = (
        userinfo.get("name")
        or userinfo.get("preferred_username")
        or email.split("@")[0]
    )

    # Find existing user or create one (no password for SSO users)
    user = db.query(User).filter(User.email == email).first()
    is_new_user = False
    if not user:
        user = User(email=email, full_name=full_name, hashed_password=None)
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True

    # Issue CareerForge JWT and send user back to the frontend
    jwt = create_token(str(user.id))
    qs = urllib.parse.urlencode({
        "access_token": jwt,
        "user_id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        **({"is_new": "1"} if is_new_user else {}),
    })
    response = RedirectResponse(url=f"{settings.frontend_url}/auth/callback?{qs}", status_code=302)
    response.delete_cookie("oidc_state")
    return response
