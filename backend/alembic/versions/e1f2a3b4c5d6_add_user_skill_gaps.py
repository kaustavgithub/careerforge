"""add user_skill_gaps table

Revision ID: e1f2a3b4c5d6
Revises: 9c1d2e3f4a5b
Create Date: 2026-06-27 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "9c1d2e3f4a5b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_skill_gaps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill", sa.String, nullable=False),
        sa.Column("category", sa.String, nullable=False, server_default="Other"),
        sa.Column("frequency", sa.Integer, server_default="1"),
        sa.Column("avg_job_score", sa.Integer, server_default="50"),
        sa.Column("gap_score", sa.Integer, server_default="50"),
        sa.Column("jobs", postgresql.JSON),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "skill", name="uq_user_skill_gap"),
    )
    op.create_index("ix_user_skill_gaps_user_id", "user_skill_gaps", ["user_id"])
    op.create_index("ix_user_skill_gaps_gap_score", "user_skill_gaps", ["gap_score"])


def downgrade() -> None:
    op.drop_index("ix_user_skill_gaps_gap_score", table_name="user_skill_gaps")
    op.drop_index("ix_user_skill_gaps_user_id", table_name="user_skill_gaps")
    op.drop_table("user_skill_gaps")
