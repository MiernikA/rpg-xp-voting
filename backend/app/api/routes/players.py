from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from fastapi import HTTPException

from app.api.deps import current_admin, current_manager
from app.database.session import get_db
from app.repositories.users import UserRepository
from app.schemas.user import PasswordReset, PlayerCreate, PlayerUpdate, UserRead
from app.services.users import UserService

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[UserRead])
def list_players(
    include_inactive: bool = True,
    limit: int = 100,
    offset: int = 0,
    manager=Depends(current_manager),
    db: Session = Depends(get_db),
) -> list[UserRead]:
    items, _ = UserRepository(db).list(include_inactive=include_inactive, limit=limit, offset=offset)
    if manager.role.value == "game_master":
        allowed_ids = {member.id for group in manager.managed_groups for member in group.members}
        items = [item for item in items if item.id in allowed_ids]
    return [UserRead.model_validate(item) for item in items]


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_player(data: PlayerCreate, admin=Depends(current_admin), db: Session = Depends(get_db)) -> UserRead:
    return UserRead.model_validate(UserService(db).create_player(data))


@router.patch("/{player_id}", response_model=UserRead)
def update_player(player_id: int, data: PlayerUpdate, manager=Depends(current_manager), db: Session = Depends(get_db)) -> UserRead:
    if manager.role.value == "game_master":
        allowed_ids = {member.id for group in manager.managed_groups for member in group.members}
        if player_id not in allowed_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Player is outside your assigned groups")
        if data.role is not None or data.is_active is not None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Game masters cannot change roles or account status")
    return UserRead.model_validate(UserService(db).update_player(player_id, data))


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_player(player_id: int, admin=Depends(current_admin), db: Session = Depends(get_db)) -> None:
    UserService(db).remove_player(player_id)


@router.post("/{player_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(player_id: int, data: PasswordReset, admin=Depends(current_admin), db: Session = Depends(get_db)) -> None:
    UserService(db).reset_password(player_id, data)
