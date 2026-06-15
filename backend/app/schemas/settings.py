from typing import Optional

from pydantic import BaseModel


class SettingsRead(BaseModel):
    anthropic_api_key: Optional[str] = None
    use_local_ai: bool = True

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    anthropic_api_key: Optional[str] = None
    use_local_ai: bool = True
