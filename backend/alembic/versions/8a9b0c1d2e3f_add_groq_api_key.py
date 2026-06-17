"""add groq_api_key to users

Revision ID: 8a9b0c1d2e3f
Revises: 7f8a9b0c1d2e
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "8a9b0c1d2e3f"
down_revision: Union[str, Sequence[str], None] = "7f8a9b0c1d2e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("groq_api_key", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "groq_api_key")
