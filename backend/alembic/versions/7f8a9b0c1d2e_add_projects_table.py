"""add projects table

Revision ID: 7f8a9b0c1d2e
Revises: 34cf26e1d8da
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "7f8a9b0c1d2e"
down_revision: Union[str, Sequence[str], None] = "34cf26e1d8da"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("profile_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("technologies", sa.String(), nullable=True),
        sa.Column("url", sa.String(), nullable=True),
        sa.Column("repo_url", sa.String(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("projects")
