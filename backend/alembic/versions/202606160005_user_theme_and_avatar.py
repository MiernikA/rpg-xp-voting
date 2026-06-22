"""user theme and avatar

Revision ID: 202606160005
Revises: 202606160004
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = "202606160005"
down_revision = "202606160004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))
    op.add_column(
        "users",
        sa.Column("theme_primary", sa.String(length=20), nullable=False, server_default="#6f4e37"),
    )
    op.add_column(
        "users",
        sa.Column("theme_secondary", sa.String(length=20), nullable=False, server_default="#8f3f2f"),
    )
    op.add_column(
        "users",
        sa.Column("theme_background", sa.String(length=20), nullable=False, server_default="#f4ead7"),
    )


def downgrade() -> None:
    op.drop_column("users", "theme_background")
    op.drop_column("users", "theme_secondary")
    op.drop_column("users", "theme_primary")
    op.drop_column("users", "avatar_url")
