from typing import Optional
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_user: str = "postgres"
    db_password: str
    db_host: str = "db"
    db_port: int = 5432
    db_name: str = "careerportal"
    jwt_secret: str
    jwt_expire_minutes: int = 10080
    frontend_url: str = "http://localhost:5173"

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{quote_plus(self.db_password)}@{self.db_host}:{self.db_port}/{self.db_name}"

    # Authentik OIDC (optional — leave unset to disable SSO)
    authentik_url: Optional[str] = None          # e.g. https://auth.example.com
    authentik_client_id: Optional[str] = None
    authentik_client_secret: Optional[str] = None
    authentik_redirect_uri: str = "http://localhost:8000/auth/oidc/callback"

    # Set true to hide/disable email+password login and registration, forcing SSO-only access
    disable_local_login: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
