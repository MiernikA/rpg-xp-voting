from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.group import user_groups


class UserRole(StrEnum):
    admin = "admin"
    player = "player"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_color: Mapped[str] = mapped_column(String(20), default="#1f6f5b", nullable=False)
    theme_primary: Mapped[str] = mapped_column(String(20), default="#6f4e37", nullable=False)
    theme_secondary: Mapped[str] = mapped_column(String(20), default="#8f3f2f", nullable=False)
    theme_background: Mapped[str] = mapped_column(String(20), default="#f4ead7", nullable=False)
    theme_paper: Mapped[str] = mapped_column(String(20), default="#fff7df", nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.player, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    votes_given = relationship("Vote", foreign_keys="Vote.voter_id", back_populates="voter")
    votes_received = relationship("Vote", foreign_keys="Vote.recipient_id", back_populates="recipient")
    groups = relationship("Group", secondary=user_groups, back_populates="members")
