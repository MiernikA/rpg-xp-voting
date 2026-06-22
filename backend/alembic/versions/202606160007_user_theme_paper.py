"""user theme paper

Revision ID: 202606160007
Revises: 202606160006
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = "202606160007"
down_revision = "202606160006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("theme_paper", sa.String(length=20), nullable=False, server_default="#fff7df"),
    )


def downgrade() -> None:
    op.drop_column("users", "theme_paper")
