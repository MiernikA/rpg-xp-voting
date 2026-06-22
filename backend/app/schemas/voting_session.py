from datetime import datetime

from pydantic import Field

from app.models.voting_session import SessionStatus
from app.schemas.common import APIModel


class VotingSessionRead(APIModel):
    id: int
    title: str
    description: str | None
    group_id: int | None
    group_name: str | None = None
    participant_ids: list[int] = []
    points_pool: int
    anonymous_mode: bool
    results_published: bool
    results_archived: bool
    xp_per_point: int
    status: SessionStatus
    created_at: datetime
    activated_at: datetime | None
    closed_at: datetime | None


class VotingSessionCreate(APIModel):
    title: str = Field(min_length=1, max_length=180)
    description: str | None = None
    group_id: int = Field(gt=0)
    participant_ids: list[int] = []
    points_pool: int = Field(gt=0, le=1000, multiple_of=5)
    anonymous_mode: bool = False
    xp_per_point: int = Field(default=1, ge=1)


class VotingSessionUpdate(APIModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = None
    group_id: int | None = Field(default=None, gt=0)
    participant_ids: list[int] | None = None
    points_pool: int | None = Field(default=None, gt=0, le=1000, multiple_of=5)
    anonymous_mode: bool | None = None
    xp_per_point: int | None = Field(default=None, ge=1)


class SessionProgress(APIModel):
    session_id: int
    total_players: int
    submitted_votes: int
    pending_votes: int
    completion_percentage: float
