from datetime import UTC, datetime

from fastapi import status
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.user import UserRole
from app.models.vote import Vote
from app.models.voting_session import SessionStatus, VotingSession
from app.repositories.groups import GroupRepository
from app.repositories.sessions import VotingSessionRepository
from app.repositories.users import UserRepository
from app.repositories.votes import VoteRepository
from app.schemas.voting_session import SessionProgress, VotingSessionCreate, VotingSessionUpdate


class VotingSessionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.sessions = VotingSessionRepository(db)
        self.groups = GroupRepository(db)
        self.users = UserRepository(db)

    def create(self, data: VotingSessionCreate) -> VotingSession:
        values = data.model_dump(exclude={"participant_ids"})
        values["anonymous_mode"] = False
        values["xp_per_point"] = 1
        session = VotingSession(**values)
        group = self.groups.get(data.group_id)
        if group is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Group not found")
        participants = self._participants(data.group_id, data.participant_ids)
        if len(participants) < 2:
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "A voting session needs at least 2 participants")
        session.participants = participants
        self.sessions.add(session)
        self.db.commit()
        return session

    def update(self, session_id: int, data: VotingSessionUpdate) -> VotingSession:
        session = self._draft_session(session_id)
        values = data.model_dump(exclude_unset=True, exclude={"participant_ids"})
        values.pop("anonymous_mode", None)
        values.pop("xp_per_point", None)
        for key, value in values.items():
            setattr(session, key, value)
        if data.participant_ids is not None or data.group_id is not None:
            group_id = data.group_id or session.group_id
            if group_id is None:
                raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Group is required")
            participant_ids = data.participant_ids or [participant.id for participant in session.participants]
            session.participants = self._participants(group_id, participant_ids)
        self.db.commit()
        return session

    def activate(self, session_id: int) -> VotingSession:
        session = self.sessions.get(session_id)
        if session is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Voting session not found")
        if session.status == SessionStatus.closed:
            raise AppError(status.HTTP_409_CONFLICT, "Closed sessions are immutable")
        active = self.sessions.active(session.group_id)
        if active and active.id != session.id:
            raise AppError(status.HTTP_409_CONFLICT, "Another voting session is already active for this group")
        session.status = SessionStatus.active
        session.activated_at = datetime.now(UTC)
        self.db.commit()
        return session

    def close(self, session_id: int) -> VotingSession:
        session = self.sessions.get(session_id)
        if session is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Voting session not found")
        if session.status != SessionStatus.active:
            raise AppError(status.HTTP_409_CONFLICT, "Only active sessions can be closed")
        session.status = SessionStatus.closed
        session.closed_at = datetime.now(UTC)
        self.db.commit()
        return session

    def publish_results(self, session_id: int) -> VotingSession:
        session = self.sessions.get(session_id)
        if session is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Voting session not found")
        if session.status == SessionStatus.draft:
            raise AppError(status.HTTP_409_CONFLICT, "Only active or closed sessions can publish results")
        progress = self.progress(session_id)
        if progress.total_players == 0 or progress.submitted_votes < progress.total_players:
            raise AppError(status.HTTP_409_CONFLICT, "All participants must vote before results can be published")
        if session.status == SessionStatus.active:
            session.status = SessionStatus.closed
            session.closed_at = datetime.now(UTC)
        session.results_published = True
        session.results_archived = False
        self.db.commit()
        return session

    def archive_results(self, session_id: int) -> VotingSession:
        session = self.sessions.get(session_id)
        if session is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Voting session not found")
        if not session.results_published:
            raise AppError(status.HTTP_409_CONFLICT, "Only published results can be archived")
        session.results_archived = True
        self.db.commit()
        return session

    def delete(self, session_id: int) -> None:
        session = self.sessions.get(session_id)
        if session is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Voting session not found")
        if session.status != SessionStatus.closed:
            raise AppError(status.HTTP_409_CONFLICT, "Only closed sessions can be removed")
        self.db.query(Vote).filter(Vote.session_id == session.id).delete(synchronize_session=False)
        self.db.delete(session)
        self.db.commit()

    def progress(self, session_id: int) -> SessionProgress:
        session = self.sessions.get(session_id)
        if session is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Voting session not found")
        total_players = len(session.participants)
        submitted = VoteRepository(self.db).submitted_voter_count(session_id)
        pending = max(total_players - submitted, 0)
        completion = round((submitted / total_players) * 100, 2) if total_players else 0.0
        return SessionProgress(
            session_id=session_id,
            total_players=total_players,
            submitted_votes=submitted,
            pending_votes=pending,
            completion_percentage=completion,
        )

    def _draft_session(self, session_id: int) -> VotingSession:
        session = self.sessions.get(session_id)
        if session is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Voting session not found")
        if session.status != SessionStatus.draft:
            raise AppError(status.HTTP_409_CONFLICT, "Only draft sessions can be edited")
        return session

    def _participants(self, group_id: int, participant_ids: list[int]) -> list:
        group = self.groups.get(group_id)
        if group is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Group not found")
        allowed_ids = {member.id for member in group.members if member.is_active and member.role == UserRole.player}
        selected_ids = set(participant_ids) if participant_ids else allowed_ids
        if not selected_ids.issubset(allowed_ids):
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Participants must be active players in the group")
        participants = [self.users.get(user_id) for user_id in selected_ids]
        return [participant for participant in participants if participant is not None]
