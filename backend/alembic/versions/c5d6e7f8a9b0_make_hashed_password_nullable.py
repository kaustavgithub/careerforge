"""make hashed_password nullable for SSO users

Revision ID: c5d6e7f8a9b0
Revises: b3c4d5e6f7a8
Create Date: 2026-06-13 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, Sequence[str], None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('users', 'hashed_password', nullable=True)


def downgrade() -> None:
    op.alter_column('users', 'hashed_password', nullable=False)
