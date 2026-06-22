"""published results

Revision ID: 202606160009
Revises: 202606160008
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = "202606160009"
down_revision = "202606160008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "voting_sessions",
        sa.Column("results_published", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("voting_sessions", "results_published")
