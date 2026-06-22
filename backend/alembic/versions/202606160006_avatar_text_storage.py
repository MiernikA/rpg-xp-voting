"""avatar text storage

Revision ID: 202606160006
Revises: 202606160005
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = "202606160006"
down_revision = "202606160005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "avatar_url", existing_type=sa.String(length=500), type_=sa.Text())


def downgrade() -> None:
    op.alter_column("users", "avatar_url", existing_type=sa.Text(), type_=sa.String(length=500))
