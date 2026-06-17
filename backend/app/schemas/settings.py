import uuid
from typing import Optional

from pydantic import BaseModel


class SettingsRead(BaseModel):
    use_local_ai: bool = True
    active_ai_config_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True
