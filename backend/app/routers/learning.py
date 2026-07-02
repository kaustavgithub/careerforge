from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.profile import Profile
from app.models.skill_gap import UserSkillGap
from app.services import ai_providers
from app.services.learning_service import (
    build_copy_prompt,
    generate_learning_plan,
    update_skill_gaps_from_jobs,
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


@router.post("/refresh-skill-gaps")
def refresh_skill_gaps(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Recompute skill gaps from all the user's saved and applied jobs."""
    from app.models.job import JobListing
    profile = _get_profile(current_user, db)
    jobs = (
        db.query(JobListing)
        .filter(
            JobListing.user_id == current_user.id,
            JobListing.status.in_(["saved", "applied"]),
        )
        .all()
    )
    if not jobs:
        return {"updated": 0}
    update_skill_gaps_from_jobs(jobs, profile, current_user.id, db)
    count = db.query(UserSkillGap).filter(UserSkillGap.user_id == current_user.id).count()
    return {"updated": count}


@router.get("/skill-gaps")
def skill_gaps(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    gaps = (
        db.query(UserSkillGap)
        .filter(UserSkillGap.user_id == current_user.id)
        .order_by(UserSkillGap.gap_score.desc())
        .all()
    )
    return [
        {
            "skill": g.skill,
            "category": g.category,
            "frequency": g.frequency,
            "avg_job_score": g.avg_job_score,
            "gap_score": g.gap_score,
            "jobs": g.jobs or [],
        }
        for g in gaps
    ]


@router.post("/plan")
def learning_plan(body: LearnRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _get_profile(current_user, db)
    if not ai_providers.get_api_key(current_user):
        raise HTTPException(status_code=400, detail=ai_providers.missing_key_message(current_user, "generate learning plans"))
    try:
        plan = generate_learning_plan(body.skill, body.jobs, profile, current_user.full_name, current_user)
        return plan
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Learning plan generation failed: {e}")


@router.post("/copy-prompt")
def copy_prompt(body: LearnRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _get_profile(current_user, db)
    prompt = build_copy_prompt(body.skill, body.jobs, profile, current_user.full_name)
    return {"prompt": prompt}
