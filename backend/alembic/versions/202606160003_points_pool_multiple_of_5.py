"""points pool multiple of 5

Revision ID: 202606160003
Revises: 202606160002
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = "202606160003"
down_revision = "202606160002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE voting_sessions SET xp_per_point = 1")
    op.alter_column("voting_sessions", "xp_per_point", server_default="1")
    bind = op.get_bind()
    exists = bind.execute(
        sa.text(
            "SELECT 1 FROM pg_constraint WHERE conname = 'ck_voting_sessions_points_pool_multiple_of_5'"
        )
    ).scalar()
    if not exists:
        op.create_check_constraint(
            "ck_voting_sessions_points_pool_multiple_of_5",
            "voting_sessions",
            "points_pool % 5 = 0",
        )


def downgrade() -> None:
    op.drop_constraint(
        "ck_voting_sessions_points_pool_multiple_of_5",
        "voting_sessions",
        type_="check",
    )
    op.alter_column("voting_sessions", "xp_per_point", server_default="0")
