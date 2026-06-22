from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import current_admin
from app.database.session import get_db
from app.repositories.groups import GroupRepository
from app.schemas.group import GroupCreate, GroupRead, GroupUpdate
from app.services.groups import GroupService

router = APIRouter(prefix="/groups", tags=["groups"], dependencies=[Depends(current_admin)])


@router.get("", response_model=list[GroupRead])
def list_groups(db: Session = Depends(get_db)) -> list[GroupRead]:
    return [GroupRead.model_validate(group) for group in GroupRepository(db).list()]


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(data: GroupCreate, db: Session = Depends(get_db)) -> GroupRead:
    return GroupRead.model_validate(GroupService(db).create(data))


@router.patch("/{group_id}", response_model=GroupRead)
def update_group(group_id: int, data: GroupUpdate, db: Session = Depends(get_db)) -> GroupRead:
    return GroupRead.model_validate(GroupService(db).update(group_id, data))


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, db: Session = Depends(get_db)) -> None:
    GroupService(db).delete(group_id)
