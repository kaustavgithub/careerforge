import uuid

from sqlalchemy import Boolean, Column, Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    headline = Column(String)
    summary = Column(Text)
    phone = Column(String)
    location = Column(String)
    linkedin_url = Column(String)
    github_url = Column(String)
    website_url = Column(String)
    photo_url = Column(String)

    user = relationship("User", back_populates="profile")
    work_experiences = relationship("WorkExperience", back_populates="profile", cascade="all, delete-orphan", order_by="WorkExperience.start_date.desc()")
    educations = relationship("Education", back_populates="profile", cascade="all, delete-orphan", order_by="Education.start_date.desc()")
    skills = relationship("Skill", back_populates="profile", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="profile", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="profile", cascade="all, delete-orphan", order_by="Project.start_date.desc()")


class WorkExperience(Base):
    __tablename__ = "work_experiences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    company = Column(String, nullable=False)
    title = Column(String, nullable=False)
    location = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    is_current = Column(Boolean, default=False)
    description = Column(Text)

    profile = relationship("Profile", back_populates="work_experiences")


class Education(Base):
    __tablename__ = "educations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    institution = Column(String, nullable=False)
    degree = Column(String)
    field_of_study = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    grade = Column(String)
    description = Column(Text)

    profile = relationship("Profile", back_populates="educations")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, default="Technical")

    profile = relationship("Profile", back_populates="skills")


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    issuer = Column(String)
    issue_date = Column(Date)
    expiry_date = Column(Date)
    url = Column(String)

    profile = relationship("Profile", back_populates="certifications")


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    technologies = Column(String)
    url = Column(String)
    repo_url = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)

    profile = relationship("Profile", back_populates="projects")
