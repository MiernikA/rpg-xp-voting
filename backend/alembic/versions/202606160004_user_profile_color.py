"""user profile color

Revision ID: 202606160004
Revises: 202606160003
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = "202606160004"
down_revision = "202606160003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("profile_color", sa.String(length=20), nullable=False, server_default="#1f6f5b"),
    )
    op.execute("UPDATE voting_sessions SET anonymous_mode = false, xp_per_point = 1")


def downgrade() -> None:
    op.drop_column("users", "profile_color")
