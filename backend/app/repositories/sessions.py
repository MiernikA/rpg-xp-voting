from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.voting_session import SessionStatus, VotingSession


class VotingSessionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, session_id: int) -> VotingSession | None:
        return self.db.scalar(
            select(VotingSession)
            .options(selectinload(VotingSession.participants), selectinload(VotingSession.group))
            .where(VotingSession.id == session_id)
        )

    def active(self, group_id: int | None = None) -> VotingSession | None:
        statement = (
            select(VotingSession)
            .options(selectinload(VotingSession.participants), selectinload(VotingSession.group))
            .where(VotingSession.status == SessionStatus.active)
        )
        if group_id is not None:
            statement = statement.where(VotingSession.group_id == group_id)
        return self.db.scalar(statement)

    def active_for_user(self, user_id: int) -> VotingSession | None:
        active = self.db.scalar(
            select(VotingSession)
            .options(selectinload(VotingSession.participants), selectinload(VotingSession.group))
            .where(VotingSession.status == SessionStatus.active)
            .where(VotingSession.participants.any(id=user_id))
            .order_by(VotingSession.activated_at.desc())
        )
        if active:
            return active
        return self.db.scalar(
            select(VotingSession)
            .options(selectinload(VotingSession.participants), selectinload(VotingSession.group))
            .where(VotingSession.status == SessionStatus.closed)
            .where(VotingSession.results_published.is_(True))
            .where(VotingSession.results_archived.is_(False))
            .where(VotingSession.participants.any(id=user_id))
            .order_by(VotingSession.closed_at.desc().nullslast(), VotingSession.id.desc())
        )

    def list(self, *, limit: int, offset: int, group_id: int | None = None) -> tuple[list[VotingSession], int]:
        statement = (
            select(VotingSession)
            .options(selectinload(VotingSession.participants), selectinload(VotingSession.group))
            .order_by(VotingSession.created_at.desc())
        )
        count_statement = select(func.count()).select_from(VotingSession)
        if group_id is not None:
            statement = statement.where(VotingSession.group_id == group_id)
            count_statement = count_statement.where(VotingSession.group_id == group_id)
        total = self.db.scalar(count_statement) or 0
        return list(self.db.scalars(statement.limit(limit).offset(offset))), total

    def add(self, session: VotingSession) -> VotingSession:
        self.db.add(session)
        self.db.flush()
        return session
