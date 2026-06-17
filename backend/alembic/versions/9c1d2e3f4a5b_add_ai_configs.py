"""replace per-provider AI columns with a named ai_configs list

Revision ID: 9c1d2e3f4a5b
Revises: 8a9b0c1d2e3f
Create Date: 2026-06-18 00:00:00.000000

"""
import uuid
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "9c1d2e3f4a5b"
down_revision: Union[str, Sequence[str], None] = "8a9b0c1d2e3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_PROVIDER_COLUMNS = [
    ("anthropic", "anthropic_api_key", "Anthropic default"),
    ("openai", "openai_api_key", "OpenAI default"),
    ("gemini", "gemini_api_key", "Gemini default"),
    ("groq", "groq_api_key", "Groq default"),
]


def upgrade() -> None:
    op.create_table(
        "ai_configs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("api_key", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_ai_configs_user_name"),
    )
    op.add_column("users", sa.Column("active_ai_config_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_users_active_ai_config_id", "users", "ai_configs",
        ["active_ai_config_id"], ["id"], ondelete="SET NULL",
    )

    # Fold each user's existing per-provider keys into named ai_configs rows,
    # and point active_ai_config_id at whichever provider was selected before.
    conn = op.get_bind()
    users_table = sa.table(
        "users",
        sa.column("id", sa.UUID()),
        sa.column("anthropic_api_key", sa.String()),
        sa.column("openai_api_key", sa.String()),
        sa.column("gemini_api_key", sa.String()),
        sa.column("groq_api_key", sa.String()),
        sa.column("ai_provider", sa.String()),
        sa.column("ai_model", sa.String()),
        sa.column("active_ai_config_id", sa.UUID()),
    )
    ai_configs_table = sa.table(
        "ai_configs",
        sa.column("id", sa.UUID()),
        sa.column("user_id", sa.UUID()),
        sa.column("name", sa.String()),
        sa.column("provider", sa.String()),
        sa.column("api_key", sa.String()),
        sa.column("model", sa.String()),
        sa.column("created_at", sa.DateTime()),
    )

    rows = conn.execute(sa.select(
        users_table.c.id,
        users_table.c.anthropic_api_key,
        users_table.c.openai_api_key,
        users_table.c.gemini_api_key,
        users_table.c.groq_api_key,
        users_table.c.ai_provider,
        users_table.c.ai_model,
    )).fetchall()

    for user_id, anthropic_key, openai_key, gemini_key, groq_key, active_provider, active_model in rows:
        key_by_provider = {
            "anthropic": anthropic_key,
            "openai": openai_key,
            "gemini": gemini_key,
            "groq": groq_key,
        }
        active_config_id = None
        for provider, _, default_name in _PROVIDER_COLUMNS:
            key = key_by_provider[provider]
            if not key:
                continue
            config_id = uuid.uuid4()
            conn.execute(
                ai_configs_table.insert().values(
                    id=config_id,
                    user_id=user_id,
                    name=default_name,
                    provider=provider,
                    api_key=key,
                    model=active_model if provider == active_provider else None,
                    created_at=datetime.utcnow(),
                )
            )
            if provider == active_provider:
                active_config_id = config_id
        if active_config_id:
            conn.execute(
                users_table.update()
                .where(users_table.c.id == user_id)
                .values(active_ai_config_id=active_config_id)
            )

    op.drop_column("users", "anthropic_api_key")
    op.drop_column("users", "openai_api_key")
    op.drop_column("users", "gemini_api_key")
    op.drop_column("users", "groq_api_key")
    op.drop_column("users", "ai_provider")
    op.drop_column("users", "ai_model")


def downgrade() -> None:
    # Best-effort: restores the old columns empty. Per-provider keys can't be
    # losslessly reconstructed once multiple named configs exist per provider.
    op.add_column("users", sa.Column("anthropic_api_key", sa.String(), nullable=True))
    op.add_column("users", sa.Column("openai_api_key", sa.String(), nullable=True))
    op.add_column("users", sa.Column("gemini_api_key", sa.String(), nullable=True))
    op.add_column("users", sa.Column("groq_api_key", sa.String(), nullable=True))
    op.add_column("users", sa.Column("ai_provider", sa.String(), nullable=False, server_default="anthropic"))
    op.add_column("users", sa.Column("ai_model", sa.String(), nullable=True))
    op.drop_constraint("fk_users_active_ai_config_id", "users", type_="foreignkey")
    op.drop_column("users", "active_ai_config_id")
    op.drop_table("ai_configs")
