from app.schemas.common import APIModel


class DashboardStats(APIModel):
    active_session_id: int | None
    active_session_title: str | None
    total_players: int
    submitted_votes: int
    pending_players: int
    total_sessions: int
    total_votes: int


class ChartPoint(APIModel):
    label: str
    value: float


class StatisticsRead(APIModel):
    votes_over_time: list[ChartPoint]
    participation_rate: list[ChartPoint]
    player_rankings: list[ChartPoint]
    average_points_by_session: list[ChartPoint]
