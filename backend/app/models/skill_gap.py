import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy import ForeignKey

from app.database import Base


class UserSkillGap(Base):
    __tablename__ = "user_skill_gaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill = Column(String, nullable=False)
    category = Column(String, nullable=False, default="Other")
    frequency = Column(Integer, default=1)
    avg_job_score = Column(Integer, default=50)
    gap_score = Column(Integer, default=50)
    jobs = Column(JSON, default=list)
    updated_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "skill", name="uq_user_skill_gap"),
    )
