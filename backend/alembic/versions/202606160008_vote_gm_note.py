"""vote gm note

Revision ID: 202606160008
Revises: 202606160007
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = "202606160008"
down_revision = "202606160007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("votes", sa.Column("gm_note", sa.Text(), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("votes", "gm_note")
