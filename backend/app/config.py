from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 10080
    frontend_url: str = "http://localhost:5173"

    # Authentik OIDC (optional — leave unset to disable SSO)
    authentik_url: Optional[str] = None          # e.g. https://auth.example.com
    authentik_client_id: Optional[str] = None
    authentik_client_secret: Optional[str] = None
    authentik_redirect_uri: str = "http://localhost:8000/auth/oidc/callback"

    class Config:
        env_file = ".env"


settings = Settings()
