from pydantic import Field

from app.schemas.common import APIModel
from app.schemas.user import PlayerCreate, UserRead


class LoginRequest(APIModel):
    username: str
    password: str


class RefreshRequest(APIModel):
    refresh_token: str


class TokenPair(APIModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class PublicRegister(PlayerCreate):
    role: str = Field(default="player", exclude=True)
