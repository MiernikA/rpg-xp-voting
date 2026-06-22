from fastapi import status
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.group import Group
from app.models.user import UserRole
from app.repositories.groups import GroupRepository
from app.repositories.users import UserRepository
from app.schemas.group import GroupCreate, GroupUpdate


class GroupService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.groups = GroupRepository(db)
        self.users = UserRepository(db)

    def create(self, data: GroupCreate) -> Group:
        if self.groups.by_name(data.name):
            raise AppError(status.HTTP_409_CONFLICT, "Group name already exists")
        group = Group(name=data.name.strip(), description=data.description, image_url=data.image_url)
        self.groups.add(group)
        group.members = self._members(data.member_ids)
        self.db.commit()
        return group

    def update(self, group_id: int, data: GroupUpdate) -> Group:
        group = self.groups.get(group_id)
        if group is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Group not found")
        values = data.model_dump(exclude_unset=True)
        if "name" in values and values["name"] is not None:
            existing = self.groups.by_name(values["name"])
            if existing and existing.id != group.id:
                raise AppError(status.HTTP_409_CONFLICT, "Group name already exists")
            group.name = values["name"].strip()
        if "description" in values:
            group.description = values["description"]
        if "image_url" in values:
            group.image_url = values["image_url"]
        if data.member_ids is not None:
            group.members = self._members(data.member_ids)
        self.db.commit()
        return group

    def delete(self, group_id: int) -> None:
        group = self.groups.get(group_id)
        if group is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Group not found")
        if group.sessions:
            raise AppError(status.HTTP_409_CONFLICT, "Groups with sessions cannot be removed")
        self.db.delete(group)
        self.db.commit()

    def _members(self, member_ids: list[int]) -> list:
        members = []
        for user_id in set(member_ids):
            user = self.users.get(user_id)
            if user is None or user.role != UserRole.player or not user.is_active:
                raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Group members must be active players")
            members.append(user)
        return members
