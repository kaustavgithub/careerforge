"""add multi-provider AI settings to users

Revision ID: 34cf26e1d8da
Revises: d7e8f9a0b1c2
Create Date: 2026-06-16 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "34cf26e1d8da"
down_revision: Union[str, Sequence[str], None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("openai_api_key", sa.String(), nullable=True))
    op.add_column("users", sa.Column("gemini_api_key", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column("ai_provider", sa.String(), nullable=False, server_default="anthropic"),
    )
    op.add_column("users", sa.Column("ai_model", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "ai_model")
    op.drop_column("users", "ai_provider")
    op.drop_column("users", "gemini_api_key")
    op.drop_column("users", "openai_api_key")
