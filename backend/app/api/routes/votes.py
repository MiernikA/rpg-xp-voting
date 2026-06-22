from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.database.session import get_db
from app.models.user import User
from app.core.errors import AppError
from app.models.voting_session import SessionStatus
from app.repositories.sessions import VotingSessionRepository
from app.repositories.votes import VoteRepository
from app.schemas.user import UserRead
from app.schemas.vote import VoteSubmission
from app.services.votes import VoteService

router = APIRouter(prefix="/votes", tags=["votes"])


@router.get("/{session_id}/status")
def vote_status(
    session_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    session = VotingSessionRepository(db).get(session_id)
    if session is None or session.status != SessionStatus.active:
        raise AppError(status.HTTP_404_NOT_FOUND, "Active voting session not found")
    participant_ids = {participant.id for participant in session.participants}
    if user.id not in participant_ids:
        raise AppError(status.HTTP_403_FORBIDDEN, "You are not a participant in this voting session")
    return {"submitted": VoteRepository(db).voter_has_submitted(session_id, user.id)}


@router.get("/recipients", response_model=list[UserRead])
def vote_recipients(
    session_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> list[UserRead]:
    session = VotingSessionRepository(db).get(session_id)
    if session is None or session.status != SessionStatus.active:
        raise AppError(status.HTTP_404_NOT_FOUND, "Active voting session not found")
    participant_ids = {participant.id for participant in session.participants}
    if user.id not in participant_ids:
        raise AppError(status.HTTP_403_FORBIDDEN, "You are not a participant in this voting session")
    players = [player for player in session.participants if player.id != user.id and player.is_active]
    return [UserRead.model_validate(player) for player in players]


@router.post("/{session_id}/submit", status_code=status.HTTP_204_NO_CONTENT)
def submit_votes(
    session_id: int,
    data: VoteSubmission,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> None:
    VoteService(db).submit(session_id, user, data)
