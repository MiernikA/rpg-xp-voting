from fastapi import status
from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.passwords import verify_password
from app.core.config import settings
from app.core.errors import AppError
from app.models.user import UserRole
from app.repositories.users import UserRepository
from app.schemas.auth import LoginRequest, PublicRegister, TokenPair
from app.schemas.user import PlayerCreate, UserRead
from app.services.users import UserService


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def login(self, data: LoginRequest) -> TokenPair:
        user = self.users.by_username(data.username)
        if user is None or not verify_password(data.password, user.password_hash):
            raise AppError(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")
        if not user.is_active:
            raise AppError(status.HTTP_403_FORBIDDEN, "User is inactive")
        return TokenPair(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
            user=UserRead.model_validate(user),
        )

    def refresh(self, refresh_token: str) -> TokenPair:
        try:
            user_id = decode_token(refresh_token, "refresh")
        except ValueError as exc:
            raise AppError(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token") from exc
        user = self.users.get(user_id)
        if user is None or not user.is_active:
            raise AppError(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
        return TokenPair(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
            user=UserRead.model_validate(user),
        )

    def register(self, data: PublicRegister) -> TokenPair:
        if not settings.allow_registration:
            raise AppError(status.HTTP_403_FORBIDDEN, "Registration is disabled")
        created = UserService(self.db).create_player(
            PlayerCreate(**data.model_dump(exclude={"role"}), role=UserRole.player)
        )
        return TokenPair(
            access_token=create_access_token(created.id),
            refresh_token=create_refresh_token(created.id),
            user=UserRead.model_validate(created),
        )
