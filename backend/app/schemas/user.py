from datetime import datetime

from pydantic import EmailStr, Field

from app.models.user import UserRole
from app.schemas.common import APIModel


class UserRead(APIModel):
    id: int
    username: str
    display_name: str
    email: EmailStr | None = None
    avatar_url: str | None = None
    profile_color: str = "#1f6f5b"
    theme_primary: str = "#6f4e37"
    theme_secondary: str = "#8f3f2f"
    theme_background: str = "#f4ead7"
    theme_paper: str = "#fff7df"
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PlayerCreate(APIModel):
    username: str = Field(min_length=3, max_length=50)
    display_name: str = Field(min_length=1, max_length=120)
    email: EmailStr | None = None
    password: str = Field(max_length=128)
    avatar_url: str | None = Field(default=None, max_length=300000)
    profile_color: str = Field(default="#1f6f5b", pattern=r"^#[0-9a-fA-F]{6}$")
    theme_primary: str = Field(default="#6f4e37", pattern=r"^#[0-9a-fA-F]{6}$")
    theme_secondary: str = Field(default="#8f3f2f", pattern=r"^#[0-9a-fA-F]{6}$")
    theme_background: str = Field(default="#f4ead7", pattern=r"^#[0-9a-fA-F]{6}$")
    theme_paper: str = Field(default="#fff7df", pattern=r"^#[0-9a-fA-F]{6}$")
    role: UserRole = UserRole.player


class PlayerUpdate(APIModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    avatar_url: str | None = Field(default=None, max_length=300000)
    profile_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    theme_primary: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    theme_secondary: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    theme_background: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    theme_paper: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    role: UserRole | None = None
    is_active: bool | None = None


class MeUpdate(APIModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    avatar_url: str | None = Field(default=None, max_length=300000)
    theme_primary: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    theme_secondary: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    theme_background: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    theme_paper: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")


class PasswordReset(APIModel):
    password: str = Field(max_length=128)
