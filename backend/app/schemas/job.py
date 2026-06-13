from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class JobSearchRequest(BaseModel):
    query: str
    location: Optional[str] = None
    limit: int = 20


class JobManualCreate(BaseModel):
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: str
    apply_url: Optional[str] = None


class JobStatusUpdate(BaseModel):
    status: str  # new | saved | applied | rejected


class JobListingSchema(BaseModel):
    id: UUID
    external_id: str
    source: str
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    apply_url: Optional[str] = None
    apply_email: Optional[str] = None
    published_at: Optional[datetime] = None
    match_score: Optional[int] = None
    match_summary: Optional[str] = None
    cover_letter: Optional[str] = None
    cv_tweaks: Optional[str] = None   # JSON string: list[str]
    status: str
    applied_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
