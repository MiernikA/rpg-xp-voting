from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.group import Group


class GroupRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, group_id: int) -> Group | None:
        return self.db.scalar(
            select(Group).options(selectinload(Group.members), selectinload(Group.game_masters)).where(Group.id == group_id)
        )

    def by_name(self, name: str) -> Group | None:
        return self.db.scalar(select(Group).where(func.lower(Group.name) == name.lower()))

    def list(self, game_master_id: int | None = None) -> list[Group]:
        statement = select(Group).options(selectinload(Group.members), selectinload(Group.game_masters))
        if game_master_id is not None:
            statement = statement.where(Group.game_masters.any(id=game_master_id))
        return list(
            self.db.scalars(statement.order_by(Group.name))
        )

    def add(self, group: Group) -> Group:
        self.db.add(group)
        self.db.flush()
        return group
