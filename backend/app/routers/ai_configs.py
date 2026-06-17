import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.ai_config import AiConfig
from app.schemas.ai_config import AiConfigCreate, AiConfigRead
from app.services.ai_providers import PROVIDER_LABELS

router = APIRouter(prefix="/ai-configs", tags=["ai-configs"])


def _get_owned_config(config_id: uuid.UUID, current_user, db: Session) -> AiConfig:
    config = (
        db.query(AiConfig)
        .filter(AiConfig.id == config_id, AiConfig.user_id == current_user.id)
        .first()
    )
    if not config:
        raise HTTPException(status_code=404, detail="AI config not found.")
    return config


@router.get("", response_model=list[AiConfigRead])
def list_configs(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(AiConfig)
        .filter(AiConfig.user_id == current_user.id)
        .order_by(AiConfig.created_at)
        .all()
    )


@router.post("", response_model=AiConfigRead, status_code=201)
def create_config(body: AiConfigCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required.")
    if body.provider not in PROVIDER_LABELS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {body.provider}")
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="API key is required.")

    exists = (
        db.query(AiConfig)
        .filter(AiConfig.user_id == current_user.id, AiConfig.name == name)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail=f'An AI config named "{name}" already exists.')

    config = AiConfig(
        user_id=current_user.id,
        name=name,
        provider=body.provider,
        api_key=body.api_key.strip(),
        model=(body.model.strip() if body.model else None),
    )
    db.add(config)
    db.commit()
    db.refresh(config)

    if current_user.active_ai_config_id is None:
        current_user.active_ai_config_id = config.id
        db.commit()

    return config


@router.delete("/{config_id}", status_code=204)
def delete_config(config_id: uuid.UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    config = _get_owned_config(config_id, current_user, db)
    if current_user.active_ai_config_id == config.id:
        current_user.active_ai_config_id = None
    db.delete(config)
    db.commit()


@router.post("/{config_id}/activate", response_model=AiConfigRead)
def activate_config(config_id: uuid.UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    config = _get_owned_config(config_id, current_user, db)
    current_user.active_ai_config_id = config.id
    db.commit()
    return config
