import uuid
from typing import Optional

from pydantic import BaseModel


class AiConfigCreate(BaseModel):
    name: str
    provider: str
    api_key: str
    model: Optional[str] = None


class AiConfigRead(BaseModel):
    id: uuid.UUID
    name: str
    provider: str
    api_key: str
    model: Optional[str] = None

    class Config:
        from_attributes = True
