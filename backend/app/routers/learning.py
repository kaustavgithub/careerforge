from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.job import JobListing
from app.models.profile import Profile
from app.services.learning_service import (
    build_copy_prompt,
    extract_skill_gaps,
    generate_learning_plan,
)

router = APIRouter(prefix="/learning", tags=["learning"])


def _get_profile(user, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Complete your profile first.")
    return profile


class LearnRequest(BaseModel):
    skill: str
    jobs: List[dict]


@router.get("/skill-gaps")
def skill_gaps(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _get_profile(current_user, db)
    jobs = (
        db.query(JobListing)
        .filter(JobListing.user_id == current_user.id, JobListing.description.isnot(None))
        .order_by(JobListing.match_score.desc().nullslast(), JobListing.created_at.desc())
        .limit(30)
        .all()
    )
    if not jobs:
        return []
    use_local = current_user.use_local_ai if current_user.use_local_ai is not None else True
    try:
        return extract_skill_gaps(jobs, profile, use_local=use_local, api_key=current_user.anthropic_api_key)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Skill gap analysis failed: {e}")


@router.post("/plan")
def learning_plan(body: LearnRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _get_profile(current_user, db)
    if not current_user.anthropic_api_key:
        raise HTTPException(status_code=400, detail="Add your Anthropic API key in Settings to generate learning plans.")
    try:
        plan = generate_learning_plan(body.skill, body.jobs, profile, current_user.full_name, api_key=current_user.anthropic_api_key)
        return plan
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Learning plan generation failed: {e}")


@router.post("/copy-prompt")
def copy_prompt(body: LearnRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _get_profile(current_user, db)
    prompt = build_copy_prompt(body.skill, body.jobs, profile, current_user.full_name)
    return {"prompt": prompt}
