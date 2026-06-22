from datetime import datetime

from pydantic import Field

from app.schemas.common import APIModel
from app.schemas.user import UserRead


class GroupRead(APIModel):
    id: int
    name: str
    description: str | None
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime
    members: list[UserRead] = []


class GroupCreate(APIModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    image_url: str | None = None
    member_ids: list[int] = []


class GroupUpdate(APIModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    image_url: str | None = None
    member_ids: list[int] | None = None
