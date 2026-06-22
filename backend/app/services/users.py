from fastapi import status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.auth.passwords import hash_password
from app.core.errors import AppError
from app.models.group import session_participants
from app.models.user import User
from app.models.vote import Vote
from app.repositories.users import UserRepository
from app.schemas.user import PasswordReset, PlayerCreate, PlayerUpdate


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def create_player(self, data: PlayerCreate) -> User:
        if self.users.by_username(data.username):
            raise AppError(status.HTTP_409_CONFLICT, "Username already exists")
        user = User(
            username=data.username,
            display_name=data.display_name,
            email=str(data.email) if data.email else None,
            password_hash=hash_password(data.password),
            avatar_url=data.avatar_url,
            profile_color=data.profile_color,
            theme_primary=data.theme_primary,
            theme_secondary=data.theme_secondary,
            theme_background=data.theme_background,
            theme_paper=data.theme_paper,
            role=data.role,
        )
        self.users.add(user)
        self.db.commit()
        return user

    def update_player(self, user_id: int, data: PlayerUpdate) -> User:
        user = self.users.get(user_id)
        if user is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Player not found")
        values = data.model_dump(exclude_unset=True)
        if "username" in values and values["username"] is not None:
            username = values["username"].strip()
            existing = self.users.by_username(username)
            if existing and existing.id != user.id:
                raise AppError(status.HTTP_409_CONFLICT, "Username already exists")
            values["username"] = username
        if "display_name" in values and values["display_name"] is not None:
            values["display_name"] = values["display_name"].strip()
        for key, value in values.items():
            setattr(user, key, value)
        self.db.commit()
        return user

    def reset_password(self, user_id: int, data: PasswordReset) -> None:
        user = self.users.get(user_id)
        if user is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Player not found")
        user.password_hash = hash_password(data.password)
        self.db.commit()

    def remove_player(self, user_id: int) -> None:
        user = self.users.get(user_id)
        if user is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Player not found")
        if user.is_active:
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Deactivate player before removing")

        vote_count = self.db.scalar(
            select(func.count())
            .select_from(Vote)
            .where(or_(Vote.voter_id == user.id, Vote.recipient_id == user.id))
        ) or 0
        participant_count = self.db.scalar(
            select(func.count()).select_from(session_participants).where(session_participants.c.user_id == user.id)
        ) or 0
        if vote_count or participant_count:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "Player has voting or session history. Keep the account deactivated instead.",
            )

        user.groups.clear()
        self.db.delete(user)
        self.db.commit()
