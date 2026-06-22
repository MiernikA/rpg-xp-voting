"""initial schema

Revision ID: 202606160001
Revises:
Create Date: 2026-06-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "202606160001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role = postgresql.ENUM("admin", "player", name="userrole", create_type=False)
    session_status = postgresql.ENUM("draft", "active", "closed", name="sessionstatus", create_type=False)
    user_role.create(op.get_bind(), checkfirst=True)
    session_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="player"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("username", name="uq_users_username"),
    )
    op.create_index("ix_users_role_active", "users", ["role", "is_active"])

    op.create_table(
        "voting_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("points_pool", sa.Integer(), nullable=False),
        sa.Column("anonymous_mode", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("xp_per_point", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", session_status, nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("points_pool > 0", name="ck_voting_sessions_points_pool_positive"),
        sa.CheckConstraint("xp_per_point >= 1", name="ck_voting_sessions_xp_nonnegative"),
        sa.CheckConstraint("points_pool % 5 = 0", name="ck_voting_sessions_points_pool_multiple_of_5"),
    )
    op.create_index("ix_voting_sessions_status", "voting_sessions", ["status"])

    op.create_table(
        "votes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("voting_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("voter_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("recipient_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("points >= 0", name="ck_votes_points_nonnegative"),
        sa.CheckConstraint("voter_id <> recipient_id", name="ck_votes_no_self_vote"),
        sa.UniqueConstraint("session_id", "voter_id", "recipient_id", name="uq_vote_recipient_once"),
    )
    op.create_index("ix_votes_session_voter", "votes", ["session_id", "voter_id"])
    op.create_index("ix_votes_session_recipient", "votes", ["session_id", "recipient_id"])
    op.create_index("ix_votes_created_at", "votes", ["created_at"])


def downgrade() -> None:
    op.drop_table("votes")
    op.drop_table("voting_sessions")
    op.drop_table("users")
    sa.Enum(name="sessionstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)
