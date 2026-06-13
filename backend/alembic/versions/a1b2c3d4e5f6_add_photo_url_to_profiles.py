"""add photo_url to profiles

Revision ID: a1b2c3d4e5f6
Revises: b2c75bad41d3
Create Date: 2026-06-13 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'b2c75bad41d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('photo_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'photo_url')
