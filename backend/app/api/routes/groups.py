from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import current_admin, current_manager
from app.database.session import get_db
from app.repositories.groups import GroupRepository
from app.schemas.group import GroupCreate, GroupRead, GroupUpdate
from app.services.groups import GroupService

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=list[GroupRead])
def list_groups(manager=Depends(current_manager), db: Session = Depends(get_db)) -> list[GroupRead]:
    game_master_id = manager.id if manager.role.value == "game_master" else None
    return [GroupRead.model_validate(group) for group in GroupRepository(db).list(game_master_id)]


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(data: GroupCreate, admin=Depends(current_admin), db: Session = Depends(get_db)) -> GroupRead:
    return GroupRead.model_validate(GroupService(db).create(data))


@router.patch("/{group_id}", response_model=GroupRead)
def update_group(group_id: int, data: GroupUpdate, admin=Depends(current_admin), db: Session = Depends(get_db)) -> GroupRead:
    return GroupRead.model_validate(GroupService(db).update(group_id, data))


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, admin=Depends(current_admin), db: Session = Depends(get_db)) -> None:
    GroupService(db).delete(group_id)
