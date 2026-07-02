import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    use_local_ai = Column(Boolean, nullable=False, default=True, server_default="true")
    active_ai_config_id = Column(UUID(as_uuid=True), ForeignKey("ai_configs.id", ondelete="SET NULL"), nullable=True)
    country = Column(String, nullable=True)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    job_listings = relationship("JobListing", back_populates="user", cascade="all, delete-orphan")
    ai_configs = relationship(
        "AiConfig", foreign_keys="AiConfig.user_id", back_populates="user", cascade="all, delete-orphan"
    )
    active_ai_config = relationship("AiConfig", foreign_keys=[active_ai_config_id])
