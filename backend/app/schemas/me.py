from app.schemas.common import APIModel
from app.schemas.group import GroupRead
from app.schemas.user import UserRead


class MySessionPoints(APIModel):
    session_id: int
    session_title: str
    session_description: str | None
    group_name: str | None
    participated: bool
    points_received: int
    max_points_available: int
    comments: list[str]


class MyInfo(APIModel):
    user: UserRead
    groups: list[GroupRead]
    history: list[MySessionPoints]
