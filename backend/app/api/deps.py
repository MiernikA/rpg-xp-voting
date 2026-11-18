from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth.jwt import decode_token
from app.database.session import get_db
from app.models.user import User, UserRole
from app.repositories.users import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        user_id = decode_token(token, "access")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    user = UserRepository(db).get(user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user


def require_role(*roles: UserRole) -> Callable[[User], User]:
    def dependency(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def current_admin(user: User = Depends(require_role(UserRole.admin))) -> User:
    return user


def current_manager(user: User = Depends(require_role(UserRole.admin, UserRole.game_master))) -> User:
    return user


def require_group_access(user: User, group_id: int | None) -> None:
    if user.role == UserRole.admin:
        return
    if group_id is None or not any(group.id == group_id for group in user.managed_groups):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This group is not assigned to you")
