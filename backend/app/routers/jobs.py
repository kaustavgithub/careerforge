import json
import logging
from datetime import datetime
from typing import List
from uuid import UUID

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.job import JobListing
from app.models.profile import Profile
from app.schemas.job import JDAnalyseRequest, JobJDSave, JobListingSchema, JobManualCreate, JobSaveRequest, JobSearchRequest, JobSearchResultSchema, JobStatusUpdate, TranslateTextRequest
from app.services import ai_providers
from app.services.cv_service import build_tailored_profile, generate_docx, generate_pdf
from app.services.job_match_service import (
    batch_score_jobs,
    batch_score_jobs_with_ai,
    generate_cover_letter_and_tweaks,
    generate_tailored_cv_data,
)
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


@router.post("/analyse-jd")
def analyse_jd(body: JDAnalyseRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Score a pasted JD against the user's profile without persisting it."""
    profile = _get_profile(current_user, db)
    job_dict = {
        "external_id": "temp",
        "title": body.title or "Untitled Position",
        "company": body.company or "",
        "location": body.location or "",
        "description": body.description,
    }
    if body.use_ai:
        if not ai_providers.get_api_key(current_user):
            raise HTTPException(status_code=400, detail=ai_providers.missing_key_message(current_user, "score with AI"))
        try:
            scores = batch_score_jobs_with_ai([job_dict], profile, current_user.full_name, current_user)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"AI scoring failed: {e}")
    else:
        scores = batch_score_jobs([job_dict], profile, current_user.full_name)
    s = scores[0] if scores else {}
    return {"score": s.get("score"), "summary": s.get("summary")}


@router.post("/translate-text")
def translate_text(body: TranslateTextRequest, current_user=Depends(get_current_user)):
    """Translate arbitrary JD text to English without persisting."""
    from deep_translator import GoogleTranslator
    from langdetect import LangDetectException, detect

    text = body.text.strip()
    if not text:
        return {"translated": text, "detected_language": "unknown", "already_english": True}

    try:
        detected = detect(text)
    except LangDetectException:
        detected = "unknown"

    if detected == "en":
        return {"translated": text, "detected_language": "en", "already_english": True}

    CHUNK = 4500
    chunks = [text[i: i + CHUNK] for i in range(0, len(text), CHUNK)]
    try:
        translator = GoogleTranslator(source="auto", target="en")
        translated_chunks = [translator.translate(chunk) for chunk in chunks]
        translated = " ".join(translated_chunks)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Translation failed: {e}")

    return {"translated": translated, "detected_language": detected, "already_english": False}


@router.post("/search", response_model=List[JobSearchResultSchema])
def search_and_rank(body: JobSearchRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch jobs from JobTech, score them, and return ranked results without saving to DB."""
    profile = _get_profile(current_user, db)

    raw_jobs = search_jobs(body.query, body.location, body.limit)
    if not raw_jobs:
        return []

    if body.use_ai:
        if not ai_providers.get_api_key(current_user):
            raise HTTPException(status_code=400, detail=ai_providers.missing_key_message(current_user, "rank jobs with AI"))
        try:
            scores_list = batch_score_jobs_with_ai(raw_jobs, profile, current_user.full_name, current_user)
        except Exception as ai_err:
            raise HTTPException(status_code=502, detail=f"AI scoring failed: {ai_err}")
    else:
        scores_list = batch_score_jobs(raw_jobs, profile, current_user.full_name)
    score_map = {s["id"]: s for s in scores_list}

    results = []
    for raw in raw_jobs:
        ext_id = raw["external_id"]
        score_data = score_map.get(ext_id, {})
        results.append({
            "external_id": ext_id,
            "source": raw.get("source", "jobtech"),
            "title": raw.get("title", ""),
            "company": raw.get("company"),
            "location": raw.get("location"),
            "description": raw.get("description"),
            "apply_url": raw.get("apply_url"),
            "apply_email": raw.get("apply_email"),
            "published_at": raw.get("published_at"),
            "match_score": score_data.get("score"),
            "match_summary": score_data.get("summary"),
        })

    results.sort(key=lambda j: j["match_score"] or 0, reverse=True)
    return results


@router.post("/save", response_model=JobListingSchema)
def save_job(body: JobSaveRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Explicitly save a search result to the user's saved jobs."""
    profile = _get_profile(current_user, db)

    existing = db.query(JobListing).filter(
        JobListing.user_id == current_user.id,
        JobListing.external_id == body.external_id,
    ).first()
    if existing:
        if existing.status == "new":
            existing.status = "saved"
            db.commit()
            db.refresh(existing)
        return existing

    listing = JobListing(
        user_id=current_user.id,
        external_id=body.external_id,
        source=body.source,
        title=body.title,
        company=body.company,
        location=body.location,
        description=body.description,
        apply_url=body.apply_url,
        apply_email=body.apply_email,
        published_at=body.published_at,
        match_score=body.match_score,
        match_summary=body.match_summary,
        status="saved",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    try:
        from app.services.learning_service import update_skill_gaps_from_jobs
        update_skill_gaps_from_jobs([listing], profile, current_user.id, db)
    except Exception as _e:
        logger.warning("Skill gap update failed (non-fatal): %s", _e)

    return listing


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

    # Score locally
    scores = batch_score_jobs([{
        "external_id": listing.external_id,
        "title": listing.title,
        "company": listing.company or "",
        "description": listing.description,
    }], profile, current_user.full_name)
    if scores:
        listing.match_score = scores[0].get("score")
        listing.match_summary = scores[0].get("summary")

    # Update stored skill gaps (best-effort)
    try:
        from app.services.learning_service import update_skill_gaps_from_jobs
        update_skill_gaps_from_jobs([listing], profile, current_user.id, db)
    except Exception as _e:
        logger.warning("Skill gap update failed (non-fatal): %s", _e)

    # Cover letter + tweaks
    if not ai_providers.get_api_key(current_user):
        raise HTTPException(status_code=400, detail=ai_providers.missing_key_message(current_user, "generate cover letters"))
    result = generate_cover_letter_and_tweaks(job_dict, profile, current_user.full_name, current_user)
    listing.cover_letter = result.get("cover_letter", "")
    listing.cv_tweaks = json.dumps(result.get("cv_tweaks", []))

    db.commit()
    db.refresh(listing)
    return listing


@router.post("/save-jd", response_model=JobListingSchema)
def save_jd_job(body: JobJDSave, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Save a JD-analysed job with a specific status. No AI key required."""
    import uuid as _uuid

    profile = _get_profile(current_user, db)

    allowed = {"saved", "applied", "rejected"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    listing = JobListing(
        user_id=current_user.id,
        external_id=f"jd-{_uuid.uuid4()}",
        source="manual",
        title=body.title,
        company=body.company,
        location=body.location,
        description=body.description,
        apply_url=body.apply_url,
        match_score=body.match_score,
        match_summary=body.match_summary,
        status=body.status,
    )
    if body.status == "applied":
        listing.applied_at = datetime.utcnow()

    db.add(listing)
    db.commit()
    db.refresh(listing)

    try:
        from app.services.learning_service import update_skill_gaps_from_jobs
        update_skill_gaps_from_jobs([listing], profile, current_user.id, db)
    except Exception as _e:
        logger.warning("Skill gap update failed (non-fatal): %s", _e)

    return listing


@router.get("", response_model=List[JobListingSchema])
def list_jobs(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Return all explicitly saved jobs (excludes old auto-saved 'new' status results)."""
    jobs = (
        db.query(JobListing)
        .filter(JobListing.user_id == current_user.id, JobListing.status != "new")
        .order_by(JobListing.created_at.desc())
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
    if not ai_providers.get_api_key(current_user):
        raise HTTPException(status_code=400, detail=ai_providers.missing_key_message(current_user, "generate cover letters"))
    result = generate_cover_letter_and_tweaks(job_dict, profile, current_user.full_name, current_user)

    job.cover_letter = result.get("cover_letter", "")
    job.cv_tweaks = json.dumps(result.get("cv_tweaks", []))
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/tailored-cv")
def tailored_cv(
    job_id: UUID,
    format: str = Query(default="pdf", pattern="^(pdf|docx)$"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an ATS-optimised CV for a specific job and return it as a file."""
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

    if not ai_providers.get_api_key(current_user):
        raise HTTPException(status_code=400, detail=ai_providers.missing_key_message(current_user, "generate a tailored CV"))
    tailored_data = generate_tailored_cv_data(job_dict, profile, current_user.full_name, current_user)
    fake_profile = build_tailored_profile(
        profile, tailored_data, current_user.full_name, current_user.email
    )

    safe = lambda s: (s or "").replace(" ", "_").replace("/", "-")[:25]
    filename = f"CV_{safe(job.title)}_{safe(job.company)}"

    if format == "docx":
        return Response(
            content=generate_docx(fake_profile),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}.docx"'},
        )
    return Response(
        content=generate_pdf(fake_profile),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )


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


@router.post("/{job_id}/translate")
def translate_job(job_id: UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Translate job description to English using Google Translate."""
    from deep_translator import GoogleTranslator
    from langdetect import LangDetectException, detect

    job = db.query(JobListing).filter(
        JobListing.id == job_id, JobListing.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    text = job.description or ""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Job has no description to translate")

    # Detect language — skip if already English
    try:
        detected = detect(text)
    except LangDetectException:
        detected = "unknown"

    if detected == "en":
        return {"translated": text, "detected_language": "en", "already_english": True}

    # Chunk to respect Google Translate's per-request limit
    CHUNK = 4500
    chunks = [text[i: i + CHUNK] for i in range(0, len(text), CHUNK)]
    try:
        translator = GoogleTranslator(source="auto", target="en")
        translated_chunks = [translator.translate(chunk) for chunk in chunks]
        translated = " ".join(translated_chunks)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Translation failed: {e}")

    return {"translated": translated, "detected_language": detected, "already_english": False}


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobListing).filter(
        JobListing.id == job_id, JobListing.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
