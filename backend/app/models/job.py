import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class JobListing(Base):
    __tablename__ = "job_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Source data
    external_id = Column(String, nullable=False)
    source = Column(String, default="jobtech")
    title = Column(String, nullable=False)
    company = Column(String)
    location = Column(String)
    description = Column(Text)
    apply_url = Column(String)
    apply_email = Column(String)
    published_at = Column(DateTime)

    # AI analysis
    match_score = Column(Integer)          # 0–100
    match_summary = Column(Text)          # one-sentence reason
    cover_letter = Column(Text)           # generated cover letter
    cv_tweaks = Column(Text)              # JSON array of tweak strings

    # Tracking
    status = Column(String, default="new")  # new | saved | applied | rejected
    applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="job_listings")
