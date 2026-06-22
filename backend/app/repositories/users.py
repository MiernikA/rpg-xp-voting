from __future__ import annotations

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def by_username(self, username: str) -> User | None:
        return self.db.scalar(select(User).where(func.lower(User.username) == username.lower()))

    def list(self, *, include_inactive: bool, limit: int, offset: int) -> tuple[list[User], int]:
        statement: Select[tuple[User]] = select(User).order_by(User.display_name)
        count_statement = select(func.count()).select_from(User)
        if not include_inactive:
            statement = statement.where(User.is_active.is_(True))
            count_statement = count_statement.where(User.is_active.is_(True))
        return list(self.db.scalars(statement.limit(limit).offset(offset))), self.db.scalar(count_statement) or 0

    def active_players(self) -> list[User]:
        return list(
            self.db.scalars(
                select(User)
                .where(User.is_active.is_(True), User.role == UserRole.player)
                .order_by(User.display_name)
            )
        )

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user
