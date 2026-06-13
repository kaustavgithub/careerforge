import json
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.job import JobListing
from app.models.profile import Profile
from app.schemas.job import JobListingSchema, JobManualCreate, JobSearchRequest, JobStatusUpdate
from app.services.job_match_service import batch_score_jobs, generate_cover_letter_and_tweaks
from app.services.jobtech_service import search_jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _get_profile(user, db: Session):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete your profile before searching for jobs.",
        )
    return profile


@router.post("/search", response_model=List[JobListingSchema])
def search_and_rank(body: JobSearchRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch jobs from JobTech, AI-score them, persist & return ranked."""
    profile = _get_profile(current_user, db)

    # 1. Fetch from JobTech
    raw_jobs = search_jobs(body.query, body.location, body.limit)
    if not raw_jobs:
        return []

    # 2. Batch-score with Claude (Haiku — fast + cheap)
    scores_list = batch_score_jobs(raw_jobs, profile, current_user.full_name)
    score_map = {s["id"]: s for s in scores_list}

    # 3. Upsert into DB
    results: List[JobListing] = []
    for raw in raw_jobs:
        ext_id = raw["external_id"]
        score_data = score_map.get(ext_id, {})

        existing = (
            db.query(JobListing)
            .filter(JobListing.user_id == current_user.id, JobListing.external_id == ext_id)
            .first()
        )
        if existing:
            # Refresh score/summary but preserve user's status
            existing.match_score = score_data.get("score")
            existing.match_summary = score_data.get("summary")
            db.commit()
            db.refresh(existing)
            results.append(existing)
        else:
            listing = JobListing(
                user_id=current_user.id,
                external_id=ext_id,
                source=raw.get("source", "jobtech"),
                title=raw.get("title", ""),
                company=raw.get("company"),
                location=raw.get("location"),
                description=raw.get("description"),
                apply_url=raw.get("apply_url"),
                apply_email=raw.get("apply_email"),
                published_at=raw.get("published_at"),
                match_score=score_data.get("score"),
                match_summary=score_data.get("summary"),
                status="new",
            )
            db.add(listing)
            db.commit()
            db.refresh(listing)
            results.append(listing)

    # Sort by score descending
    results.sort(key=lambda j: j.match_score or 0, reverse=True)
    return results


@router.post("/manual", response_model=JobListingSchema)
def create_manual_job(body: JobManualCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Save a job pasted/captured manually and immediately generate cover letter."""
    import uuid as _uuid
    profile = _get_profile(current_user, db)

    listing = JobListing(
        user_id=current_user.id,
        external_id=f"manual-{_uuid.uuid4()}",
        source="manual",
        title=body.title,
        company=body.company,
        location=body.location,
        description=body.description,
        apply_url=body.apply_url,
        status="new",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    job_dict = {"title": listing.title, "company": listing.company,
                "location": listing.location, "description": listing.description}

    # Score
    scores = batch_score_jobs([{
        "external_id": listing.external_id,
        "title": listing.title,
        "company": listing.company or "",
        "description": listing.description,
    }], profile, current_user.full_name)
    if scores:
        listing.match_score = scores[0].get("score")
        listing.match_summary = scores[0].get("summary")

    # Cover letter + tweaks
    result = generate_cover_letter_and_tweaks(job_dict, profile, current_user.full_name)
    listing.cover_letter = result.get("cover_letter", "")
    listing.cv_tweaks = json.dumps(result.get("cv_tweaks", []))

    db.commit()
    db.refresh(listing)
    return listing


@router.get("", response_model=List[JobListingSchema])
def list_jobs(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """All saved/tracked jobs for the current user."""
    jobs = (
        db.query(JobListing)
        .filter(JobListing.user_id == current_user.id)
        .order_by(JobListing.match_score.desc().nullslast(), JobListing.created_at.desc())
        .all()
    )
    return jobs


@router.post("/{job_id}/generate", response_model=JobListingSchema)
def generate_for_job(job_id: UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate a cover letter + CV tweaks for a specific job."""
    job = db.query(JobListing).filter(
        JobListing.id == job_id, JobListing.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    profile = _get_profile(current_user, db)

    job_dict = {
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "description": job.description,
    }
    result = generate_cover_letter_and_tweaks(job_dict, profile, current_user.full_name)

    job.cover_letter = result.get("cover_letter", "")
    job.cv_tweaks = json.dumps(result.get("cv_tweaks", []))
    db.commit()
    db.refresh(job)
    return job


@router.patch("/{job_id}/status", response_model=JobListingSchema)
def update_status(job_id: UUID, body: JobStatusUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    allowed = {"new", "saved", "applied", "rejected"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    job = db.query(JobListing).filter(
        JobListing.id == job_id, JobListing.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = body.status
    if body.status == "applied" and not job.applied_at:
        job.applied_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobListing).filter(
        JobListing.id == job_id, JobListing.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
