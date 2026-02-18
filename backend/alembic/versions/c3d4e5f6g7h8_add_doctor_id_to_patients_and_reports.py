"""add doctor_id to patients and medical_reports

Revision ID: c3d4e5f6g7h8
Revises: a1b2c3d4e5f6
Create Date: 2026-02-18 19:42:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c3d4e5f6g7h8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Using plain ADD COLUMN (no batch) to avoid SQLite table-recreation issues
    # with non-constant default values on existing columns
    op.add_column('patients', sa.Column('doctor_id', sa.Integer(), nullable=True))
    op.add_column('medical_reports', sa.Column('doctor_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('medical_reports', 'doctor_id')
    op.drop_column('patients', 'doctor_id')
