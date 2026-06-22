from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.vote import Vote


class VoteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def voter_has_submitted(self, session_id: int, voter_id: int) -> bool:
        return (
            self.db.scalar(
                select(func.count())
                .select_from(Vote)
                .where(Vote.session_id == session_id, Vote.voter_id == voter_id)
            )
            or 0
        ) > 0

    def submitted_voter_count(self, session_id: int) -> int:
        return self.db.scalar(select(func.count(distinct(Vote.voter_id))).where(Vote.session_id == session_id)) or 0

    def add_many(self, votes: list[Vote]) -> None:
        self.db.add_all(votes)
        self.db.flush()

    def for_session(self, session_id: int) -> list[Vote]:
        return list(
            self.db.scalars(
                select(Vote)
                .options(joinedload(Vote.voter), joinedload(Vote.recipient), joinedload(Vote.session))
                .where(Vote.session_id == session_id)
            )
        )
