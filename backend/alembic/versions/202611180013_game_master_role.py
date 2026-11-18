"""add game master role and group assignments

Revision ID: 202611180013
Revises: 202610060012
Create Date: 2026-11-18 00:13:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202611180013"
down_revision: str | None = "202610060012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'game_master'")
    op.create_table(
        "group_game_masters",
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("group_id", "user_id"),
    )


def downgrade() -> None:
    op.drop_table("group_game_masters")
    # PostgreSQL enum values cannot be removed safely while rows may still use them.
