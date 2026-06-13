"""add job_listings table

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-06-13 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'job_listings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('external_id', sa.String(), nullable=False),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('company', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('apply_url', sa.String(), nullable=True),
        sa.Column('apply_email', sa.String(), nullable=True),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('match_score', sa.Integer(), nullable=True),
        sa.Column('match_summary', sa.Text(), nullable=True),
        sa.Column('cover_letter', sa.Text(), nullable=True),
        sa.Column('cv_tweaks', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('applied_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_job_listings_user_id', 'job_listings', ['user_id'])
    op.create_index('ix_job_listings_external_id', 'job_listings', ['external_id'])


def downgrade() -> None:
    op.drop_index('ix_job_listings_external_id', table_name='job_listings')
    op.drop_index('ix_job_listings_user_id', table_name='job_listings')
    op.drop_table('job_listings')
