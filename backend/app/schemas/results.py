from pydantic import Field

from app.schemas.common import APIModel


class ResultComment(APIModel):
    author: str | None
    text: str


class ResultRow(APIModel):
    player_id: int
    player: str
    username: str
    avatar_url: str | None = None
    profile_color: str = "#1f6f5b"
    total_points: int
    average_points: float
    number_of_voters: int
    percentage_of_points: float
    xp_awarded: int
    comments: list[ResultComment]
    gm_notes: list[ResultComment] = Field(default_factory=list)


class PublishedSessionResults(APIModel):
    session_id: int
    session_title: str
    group_name: str | None
    results: list[ResultRow]


class ReceivedVote(APIModel):
    points: int
    justification: str
    voter: str | None


class PlayerResultDetail(APIModel):
    player_id: int
    player: str
    total_points: int
    xp_awarded: int
    received_votes: list[ReceivedVote]


class CommentRead(APIModel):
    session_id: int
    session_title: str
    recipient_id: int
    recipient: str
    voter: str | None
    points: int
    justification: str
    gm_note: str = ""


class GMSessionVoteLine(APIModel):
    id: int
    voter_id: int
    voter: str
    recipient_id: int
    recipient: str
    points: int
    justification: str
    gm_note: str = ""


class GMSessionView(APIModel):
    session_id: int
    session_title: str
    group_name: str | None
    total_points: int
    votes: list[GMSessionVoteLine]
