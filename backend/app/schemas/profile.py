from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class WorkExperienceSchema(BaseModel):
    id: Optional[UUID] = None
    company: str
    title: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    description: Optional[str] = None

    class Config:
        from_attributes = True


class EducationSchema(BaseModel):
    id: Optional[UUID] = None
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    grade: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SkillSchema(BaseModel):
    id: Optional[UUID] = None
    name: str
    category: str = "Technical"

    class Config:
        from_attributes = True


class CertificationSchema(BaseModel):
    id: Optional[UUID] = None
    name: str
    issuer: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    url: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectSchema(BaseModel):
    id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    technologies: Optional[str] = None
    url: Optional[str] = None
    repo_url: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    class Config:
        from_attributes = True


class ProfileSchema(BaseModel):
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    photo_url: Optional[str] = None
    work_experiences: List[WorkExperienceSchema] = []
    educations: List[EducationSchema] = []
    skills: List[SkillSchema] = []
    certifications: List[CertificationSchema] = []
    projects: List[ProjectSchema] = []

    class Config:
        from_attributes = True


class PublicProfileSchema(ProfileSchema):
    full_name: str = ""


class ProfileUpdateRequest(BaseModel):
    headline: Optional[str] = None
    summary: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    photo_url: Optional[str] = None
    work_experiences: List[WorkExperienceSchema] = []
    educations: List[EducationSchema] = []
    skills: List[SkillSchema] = []
    certifications: List[CertificationSchema] = []
    projects: List[ProjectSchema] = []
