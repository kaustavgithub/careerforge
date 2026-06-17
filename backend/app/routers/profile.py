from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.profile import Certification, Education, Profile, Project, Skill, WorkExperience
from app.models.user import User
from app.schemas.profile import ProfileSchema, ProfileUpdateRequest, PublicProfileSchema

router = APIRouter(prefix="/profile", tags=["profile"])


def _get_or_create_profile(user: User, db: Session) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/public/{user_id}", response_model=PublicProfileSchema)
def get_public_profile(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    data = ProfileSchema.model_validate(profile).model_dump()
    data["full_name"] = user.full_name
    return data


@router.get("", response_model=ProfileSchema)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _get_or_create_profile(current_user, db)
    return profile


@router.put("", response_model=ProfileSchema)
def update_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(current_user, db)

    profile.headline = body.headline
    profile.summary = body.summary
    profile.phone = body.phone
    profile.location = body.location
    profile.linkedin_url = body.linkedin_url
    profile.github_url = body.github_url
    profile.website_url = body.website_url
    profile.photo_url = body.photo_url

    db.query(WorkExperience).filter(WorkExperience.profile_id == profile.id).delete()
    db.query(Education).filter(Education.profile_id == profile.id).delete()
    db.query(Skill).filter(Skill.profile_id == profile.id).delete()
    db.query(Certification).filter(Certification.profile_id == profile.id).delete()
    db.query(Project).filter(Project.profile_id == profile.id).delete()

    for exp in body.work_experiences:
        db.add(WorkExperience(profile_id=profile.id, **exp.model_dump(exclude={"id"})))
    for edu in body.educations:
        db.add(Education(profile_id=profile.id, **edu.model_dump(exclude={"id"})))
    for skill in body.skills:
        db.add(Skill(profile_id=profile.id, **skill.model_dump(exclude={"id"})))
    for cert in body.certifications:
        db.add(Certification(profile_id=profile.id, **cert.model_dump(exclude={"id"})))
    for proj in body.projects:
        db.add(Project(profile_id=profile.id, **proj.model_dump(exclude={"id"})))

    db.commit()
    db.refresh(profile)
    return profile
