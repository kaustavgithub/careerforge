from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.settings import SettingsRead, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsRead)
def get_settings(current_user=Depends(get_current_user)):
    return SettingsRead(
        anthropic_api_key=current_user.anthropic_api_key,
        openai_api_key=current_user.openai_api_key,
        gemini_api_key=current_user.gemini_api_key,
        ai_provider=current_user.ai_provider or "anthropic",
        ai_model=current_user.ai_model,
        use_local_ai=current_user.use_local_ai if current_user.use_local_ai is not None else True,
    )


@router.put("")
def update_settings(
    body: SettingsUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.anthropic_api_key = body.anthropic_api_key
    current_user.openai_api_key = body.openai_api_key
    current_user.gemini_api_key = body.gemini_api_key
    current_user.ai_provider = body.ai_provider
    current_user.ai_model = body.ai_model
    current_user.use_local_ai = body.use_local_ai
    db.commit()
    return {"ok": True}
