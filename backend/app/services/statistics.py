from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.vote import Vote
from app.models.voting_session import VotingSession
from app.repositories.sessions import VotingSessionRepository
from app.repositories.users import UserRepository
from app.repositories.votes import VoteRepository
from app.schemas.statistics import ChartPoint, DashboardStats, StatisticsRead


class StatisticsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def dashboard(self) -> DashboardStats:
        users = UserRepository(self.db)
        sessions = VotingSessionRepository(self.db)
        active = sessions.active()
        active_players = users.active_players()
        submitted = VoteRepository(self.db).submitted_voter_count(active.id) if active else 0
        total_sessions = self.db.scalar(select(func.count()).select_from(VotingSession)) or 0
        total_votes = self.db.scalar(select(func.count()).select_from(Vote)) or 0
        return DashboardStats(
            active_session_id=active.id if active else None,
            active_session_title=active.title if active else None,
            total_players=len(active_players),
            submitted_votes=submitted,
            pending_players=max(len(active_players) - submitted, 0) if active else 0,
            total_sessions=total_sessions,
            total_votes=total_votes,
        )

    def charts(self) -> StatisticsRead:
        votes = list(self.db.scalars(select(Vote).join(VotingSession).join(User, Vote.recipient_id == User.id)))
        by_day: dict[str, int] = defaultdict(int)
        by_player: dict[int, tuple[str, int]] = {}
        by_session: dict[int, tuple[str, int, int]] = {}
        for vote in votes:
            day = vote.created_at.date().isoformat()
            by_day[day] += vote.points
            player = self.db.get(User, vote.recipient_id)
            session = self.db.get(VotingSession, vote.session_id)
            if player and player.role == UserRole.player:
                name, total = by_player.get(player.id, (player.display_name, 0))
                by_player[player.id] = (name, total + vote.points)
            if session:
                title, total, count = by_session.get(session.id, (session.title, 0, 0))
                by_session[session.id] = (title, total + vote.points, count + 1)
        return StatisticsRead(
            votes_over_time=[ChartPoint(label=day, value=value) for day, value in sorted(by_day.items())],
            participation_rate=self._participation_points(),
            player_rankings=[
                ChartPoint(label=name, value=total)
                for name, total in sorted(by_player.values(), key=lambda item: item[1], reverse=True)
            ],
            average_points_by_session=[
                ChartPoint(label=title, value=round(total / count, 2) if count else 0)
                for title, total, count in by_session.values()
            ],
        )

    def _participation_points(self) -> list[ChartPoint]:
        sessions = list(self.db.scalars(select(VotingSession).order_by(VotingSession.created_at)))
        player_count = len(UserRepository(self.db).active_players()) or 1
        vote_repo = VoteRepository(self.db)
        return [
            ChartPoint(
                label=session.title,
                value=round((vote_repo.submitted_voter_count(session.id) / player_count) * 100, 2),
            )
            for session in sessions
        ]
