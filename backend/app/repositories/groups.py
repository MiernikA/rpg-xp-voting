from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.group import Group


class GroupRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, group_id: int) -> Group | None:
        return self.db.scalar(
            select(Group).options(selectinload(Group.members)).where(Group.id == group_id)
        )

    def by_name(self, name: str) -> Group | None:
        return self.db.scalar(select(Group).where(func.lower(Group.name) == name.lower()))

    def list(self) -> list[Group]:
        return list(
            self.db.scalars(select(Group).options(selectinload(Group.members)).order_by(Group.name))
        )

    def add(self, group: Group) -> Group:
        self.db.add(group)
        self.db.flush()
        return group
