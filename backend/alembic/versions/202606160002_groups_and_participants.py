"""groups and session participants

Revision ID: 202606160002
Revises: 202606160001
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa

revision = "202606160002"
down_revision = "202606160001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "groups",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("name", name="uq_groups_name"),
    )
    op.create_table(
        "user_groups",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("group_id", sa.Integer(), sa.ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
    )
    op.add_column("voting_sessions", sa.Column("group_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_voting_sessions_group_id_groups",
        "voting_sessions",
        "groups",
        ["group_id"],
        ["id"],
    )
    op.create_table(
        "session_participants",
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("voting_sessions.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True),
    )
    op.create_index("ix_voting_sessions_group_status", "voting_sessions", ["group_id", "status"])


def downgrade() -> None:
    op.drop_index("ix_voting_sessions_group_status", table_name="voting_sessions")
    op.drop_table("session_participants")
    op.drop_constraint("fk_voting_sessions_group_id_groups", "voting_sessions", type_="foreignkey")
    op.drop_column("voting_sessions", "group_id")
    op.drop_table("user_groups")
    op.drop_table("groups")
