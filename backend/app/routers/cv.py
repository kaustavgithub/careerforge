import json
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.profile import Certification, Education, Profile, Skill, WorkExperience
from app.models.user import User
from app.schemas.profile import ProfileSchema
from app.services.claude_service import parse_cv_text
from app.services.cv_service import (
    extract_text_from_docx,
    extract_text_from_pdf,
    generate_docx,
    generate_pdf,
)

router = APIRouter(prefix="/cv", tags=["cv"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except (ValueError, TypeError):
        return None


@router.post("/parse", response_model=ProfileSchema)
async def parse_cv(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content_type = file.content_type or ""
    filename = file.filename or ""

    is_pdf = content_type == "application/pdf" or filename.lower().endswith(".pdf")
    is_docx = content_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ) or filename.lower().endswith((".docx", ".doc"))

    if not (is_pdf or is_docx):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only PDF and DOCX files are supported")

    file_bytes = await file.read()

    if is_pdf:
        text = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_docx(file_bytes)

    if not text.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not extract text from file")

    try:
        parsed = parse_cv_text(text)
    except (json.JSONDecodeError, Exception) as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Claude parsing failed: {str(e)}")

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    profile.headline = parsed.get("headline")
    profile.summary = parsed.get("summary")
    profile.phone = parsed.get("phone")
    profile.location = parsed.get("location")
    profile.linkedin_url = parsed.get("linkedin_url")
    profile.github_url = parsed.get("github_url")
    profile.website_url = parsed.get("website_url")

    db.query(WorkExperience).filter(WorkExperience.profile_id == profile.id).delete()
    db.query(Education).filter(Education.profile_id == profile.id).delete()
    db.query(Skill).filter(Skill.profile_id == profile.id).delete()
    db.query(Certification).filter(Certification.profile_id == profile.id).delete()

    for exp in parsed.get("work_experiences", []):
        db.add(WorkExperience(
            profile_id=profile.id,
            company=exp.get("company") or "",
            title=exp.get("title") or "",
            location=exp.get("location"),
            start_date=_parse_date(exp.get("start_date")),
            end_date=_parse_date(exp.get("end_date")),
            is_current=exp.get("is_current") or False,
            description=exp.get("description"),
        ))

    for edu in parsed.get("educations", []):
        db.add(Education(
            profile_id=profile.id,
            institution=edu.get("institution") or "",
            degree=edu.get("degree"),
            field_of_study=edu.get("field_of_study"),
            start_date=_parse_date(edu.get("start_date")),
            end_date=_parse_date(edu.get("end_date")),
            grade=edu.get("grade"),
            description=edu.get("description"),
        ))

    for skill in parsed.get("skills", []):
        db.add(Skill(
            profile_id=profile.id,
            name=skill.get("name") or "",
            category=skill.get("category") or "Technical",
        ))

    for cert in parsed.get("certifications", []):
        db.add(Certification(
            profile_id=profile.id,
            name=cert.get("name") or "",
            issuer=cert.get("issuer"),
            issue_date=_parse_date(cert.get("issue_date")),
            expiry_date=_parse_date(cert.get("expiry_date")),
            url=cert.get("url"),
        ))

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/generate")
def generate_cv(
    format: str = Query("pdf", pattern="^(pdf|docx)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    safe_name = current_user.full_name.replace(" ", "_")

    if format == "pdf":
        content = generate_pdf(profile)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}_CV.pdf"'},
        )
    else:
        content = generate_docx(profile)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}_CV.docx"'},
        )
