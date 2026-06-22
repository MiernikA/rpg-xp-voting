from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.group import session_participants


class SessionStatus(StrEnum):
    draft = "draft"
    active = "active"
    closed = "closed"


class VotingSession(Base):
    __tablename__ = "voting_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("groups.id"), nullable=True)
    points_pool: Mapped[int] = mapped_column(Integer, nullable=False)
    anonymous_mode: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    results_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    results_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    xp_per_point: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus), default=SessionStatus.draft, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    votes = relationship("Vote", back_populates="session", cascade="all, delete-orphan")
    group = relationship("Group", back_populates="sessions")
    participants = relationship("User", secondary=session_participants)
