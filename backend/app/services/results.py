from collections import defaultdict
from io import BytesIO, StringIO
import csv

from fastapi import status
from openpyxl import Workbook
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.voting_session import VotingSession
from app.repositories.sessions import VotingSessionRepository
from app.repositories.votes import VoteRepository
from app.schemas.results import (
    CommentRead,
    GMSessionView,
    GMSessionVoteLine,
    PlayerResultDetail,
    PublishedSessionResults,
    ReceivedVote,
    ResultComment,
    ResultRow,
)


class ResultService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.sessions = VotingSessionRepository(db)
        self.votes = VoteRepository(db)

    def rankings(self, session_id: int, force_anonymous: bool = False, include_gm_notes: bool = True) -> list[ResultRow]:
        session = self._session(session_id)
        votes = self.votes.for_session(session_id)
        total_distributed = sum(vote.points for vote in votes) or 1
        by_recipient = defaultdict(list)
        for vote in votes:
            by_recipient[vote.recipient].append(vote)
        rows = []
        for recipient, received in by_recipient.items():
            voters = {vote.voter_id for vote in received}
            total = sum(vote.points for vote in received)
            rows.append(
                ResultRow(
                    player_id=recipient.id,
                    player=recipient.display_name,
                    username=recipient.username,
                    avatar_url=recipient.avatar_url,
                    profile_color=recipient.profile_color,
                    total_points=total,
                    average_points=round(total / len(voters), 2) if voters else 0,
                    number_of_voters=len(voters),
                    percentage_of_points=round((total / total_distributed) * 100, 2),
                    xp_awarded=total,
                    comments=[
                        ResultComment(
                            author=None if force_anonymous or session.anonymous_mode else vote.voter.display_name,
                            text=vote.justification,
                        )
                        for vote in received
                        if vote.justification
                    ],
                    gm_notes=[
                        ResultComment(
                            author=None if force_anonymous or session.anonymous_mode else vote.voter.display_name,
                            text=vote.gm_note,
                        )
                        for vote in received
                        if vote.gm_note
                    ]
                    if include_gm_notes
                    else [],
                )
            )
        return sorted(rows, key=lambda row: row.total_points, reverse=True)

    def published_for_user(self, user_id: int) -> list[PublishedSessionResults]:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        sessions = list(
            self.db.scalars(
                select(VotingSession)
                .options(selectinload(VotingSession.participants), selectinload(VotingSession.group))
                .where(VotingSession.results_published.is_(True))
                .where(VotingSession.results_archived.is_(False))
                .order_by(VotingSession.closed_at.desc().nullslast(), VotingSession.id.desc())
            )
        )
        visible_sessions = [
            session for session in sessions if any(participant.id == user_id for participant in session.participants)
        ]
        return [
            PublishedSessionResults(
                session_id=session.id,
                session_title=session.title,
                group_name=session.group.name if session.group else None,
                results=self.rankings(session.id, force_anonymous=True, include_gm_notes=False),
            )
            for session in visible_sessions
        ]

    def player_detail(self, session_id: int, player_id: int) -> PlayerResultDetail:
        session = self._session(session_id)
        votes = [vote for vote in self.votes.for_session(session_id) if vote.recipient_id == player_id]
        if not votes:
            raise AppError(status.HTTP_404_NOT_FOUND, "No results found for player")
        total = sum(vote.points for vote in votes)
        return PlayerResultDetail(
            player_id=player_id,
            player=votes[0].recipient.display_name,
            total_points=total,
            xp_awarded=total,
            received_votes=[
                ReceivedVote(
                    points=vote.points,
                    justification=vote.justification,
                    voter=None if session.anonymous_mode else vote.voter.display_name,
                )
                for vote in votes
            ],
        )

    def comments(self, session_id: int | None, player_id: int | None, keyword: str | None) -> list[CommentRead]:
        votes = self.votes.for_session(session_id) if session_id else self.votes_for_all_sessions()
        if player_id is not None:
            votes = [vote for vote in votes if vote.recipient_id == player_id]
        if keyword:
            normalized = keyword.lower()
            votes = [
                vote
                for vote in votes
                if normalized in vote.justification.lower() or normalized in vote.gm_note.lower()
            ]
        return [
            CommentRead(
                session_id=vote.session_id,
                session_title=vote.session.title,
                recipient_id=vote.recipient_id,
                recipient=vote.recipient.display_name,
                voter=None if vote.session.anonymous_mode else vote.voter.display_name,
                points=vote.points,
                justification=vote.justification,
                gm_note=vote.gm_note,
            )
            for vote in votes
            if vote.justification or vote.gm_note
        ]

    def gm_view(self, session_id: int) -> GMSessionView:
        session = self._session(session_id)
        votes = self.votes.for_session(session_id)
        return GMSessionView(
            session_id=session.id,
            session_title=session.title,
            group_name=session.group.name if session.group else None,
            total_points=sum(vote.points for vote in votes),
            votes=[
                GMSessionVoteLine(
                    id=vote.id,
                    voter_id=vote.voter_id,
                    voter=vote.voter.display_name,
                    recipient_id=vote.recipient_id,
                    recipient=vote.recipient.display_name,
                    points=vote.points,
                    justification=vote.justification,
                    gm_note=vote.gm_note,
                )
                for vote in votes
            ],
        )

    def export_csv(self, session_id: int) -> bytes:
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Player",
            "Total Points",
            "Average Points",
            "Number Of Voters",
            "Percentage Of Points",
            "Comments",
            "Game Master Notes",
        ])
        for row in self.rankings(session_id):
            writer.writerow([
                row.player,
                row.total_points,
                row.average_points,
                row.number_of_voters,
                row.percentage_of_points,
                " | ".join(
                    f"{comment.author or 'Anonymous'}: {comment.text}" for comment in row.comments
                ),
                " | ".join(
                    f"{note.author or 'Anonymous'}: {note.text}" for note in row.gm_notes
                ),
            ])
        return output.getvalue().encode("utf-8")

    def export_xlsx(self, session_id: int) -> bytes:
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "Results"
        sheet.append([
            "Player",
            "Total Points",
            "Average Points",
            "Number Of Voters",
            "Percentage Of Points",
            "Comments",
            "Game Master Notes",
        ])
        for row in self.rankings(session_id):
            sheet.append([
                row.player,
                row.total_points,
                row.average_points,
                row.number_of_voters,
                row.percentage_of_points,
                " | ".join(
                    f"{comment.author or 'Anonymous'}: {comment.text}" for comment in row.comments
                ),
                " | ".join(
                    f"{note.author or 'Anonymous'}: {note.text}" for note in row.gm_notes
                ),
            ])
        buffer = BytesIO()
        workbook.save(buffer)
        return buffer.getvalue()

    def votes_for_all_sessions(self):
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload

        from app.models.vote import Vote

        return list(
            self.db.scalars(
                select(Vote).options(joinedload(Vote.voter), joinedload(Vote.recipient), joinedload(Vote.session))
            )
        )

    def _session(self, session_id: int):
        session = self.sessions.get(session_id)
        if session is None:
            raise AppError(status.HTTP_404_NOT_FOUND, "Voting session not found")
        return session
