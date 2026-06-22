from fastapi import status
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.user import User
from app.models.vote import Vote
from app.models.voting_session import SessionStatus
from app.repositories.sessions import VotingSessionRepository
from app.repositories.votes import VoteRepository
from app.schemas.vote import VoteSubmission


class VoteService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.sessions = VotingSessionRepository(db)
        self.votes = VoteRepository(db)

    def submit(self, session_id: int, voter: User, data: VoteSubmission) -> None:
        session = self.sessions.get(session_id)
        if session is None or session.status != SessionStatus.active:
            raise AppError(status.HTTP_404_NOT_FOUND, "Active voting session not found")
        participant_ids = {participant.id for participant in session.participants}
        if voter.id not in participant_ids:
            raise AppError(status.HTTP_403_FORBIDDEN, "You are not a participant in this voting session")
        if self.votes.voter_has_submitted(session_id, voter.id):
            raise AppError(status.HTTP_409_CONFLICT, "Votes have already been submitted")
        active_recipient_ids = {participant.id for participant in session.participants if participant.id != voter.id}
        submitted = [line for line in data.votes if line.points > 0 or line.justification.strip()]
        total = sum(line.points for line in submitted)
        if total != session.points_pool:
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Distributed points must equal the session pool")
        if any(line.recipient_id == voter.id for line in submitted):
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Players cannot vote for themselves")
        if any(line.recipient_id not in active_recipient_ids for line in submitted):
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Recipient must be a session participant")
        gm_note = data.gm_note.strip()
        self.votes.add_many(
            [
                Vote(
                    session_id=session_id,
                    voter_id=voter.id,
                    recipient_id=line.recipient_id,
                    points=line.points,
                    justification=line.justification.strip(),
                    gm_note=gm_note if index == 0 else "",
                )
                for index, line in enumerate(submitted)
            ]
        )
        self.db.commit()
