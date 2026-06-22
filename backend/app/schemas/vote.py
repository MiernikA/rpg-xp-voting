from datetime import datetime

from pydantic import Field, model_validator

from app.schemas.common import APIModel


class VoteLineCreate(APIModel):
    recipient_id: int
    points: int = Field(ge=0, multiple_of=5)
    justification: str = Field(default="", max_length=2000)


class VoteSubmission(APIModel):
    votes: list[VoteLineCreate]
    gm_note: str = Field(default="", max_length=2000)

    @model_validator(mode="after")
    def unique_recipients(self) -> "VoteSubmission":
        ids = [vote.recipient_id for vote in self.votes]
        if len(ids) != len(set(ids)):
            raise ValueError("Recipients must be unique")
        return self


class VoteRead(APIModel):
    id: int
    session_id: int
    voter_id: int
    recipient_id: int
    points: int
    justification: str
    gm_note: str
    created_at: datetime
