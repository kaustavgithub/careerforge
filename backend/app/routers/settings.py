from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.settings import SettingsRead

router = APIRouter(prefix="/settings", tags=["settings"])


class UseLocalAiUpdate(BaseModel):
    use_local_ai: bool


@router.get("", response_model=SettingsRead)
def get_settings(current_user=Depends(get_current_user)):
    return SettingsRead(
        use_local_ai=current_user.use_local_ai if current_user.use_local_ai is not None else True,
        active_ai_config_id=current_user.active_ai_config_id,
    )


@router.patch("/use-local-ai")
def update_use_local_ai(
    body: UseLocalAiUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.use_local_ai = body.use_local_ai
    db.commit()
    return {"use_local_ai": current_user.use_local_ai}
