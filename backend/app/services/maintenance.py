from fastapi import status
from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.domain.maintenance.backup import (
    BackupCsvCodec,
    BackupPayloads,
    group_payload,
    parse_datetime,
    session_payload,
    user_payload,
    vote_payload,
)
from app.models.group import Group, session_participants, user_groups
from app.models.user import User, UserRole
from app.models.vote import Vote
from app.models.voting_session import SessionStatus, VotingSession


CONFIRMATION_TEXT = "I want to remove"


class MaintenanceService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.codec = BackupCsvCodec()

    def export_csv(self) -> str:
        records = []
        for user in self.db.scalars(select(User).order_by(User.id)):
            records.append(("users", user_payload(user)))
        for group in self.db.scalars(select(Group).order_by(Group.id)):
            records.append(("groups", group_payload(group)))
        for row in self.db.execute(
            select(user_groups.c.user_id, user_groups.c.group_id).order_by(
                user_groups.c.user_id,
                user_groups.c.group_id,
            )
        ):
            records.append(("user_groups", {"user_id": row.user_id, "group_id": row.group_id}))
        for session in self.db.scalars(select(VotingSession).order_by(VotingSession.id)):
            records.append(("voting_sessions", session_payload(session)))
        for row in self.db.execute(
            select(session_participants.c.session_id, session_participants.c.user_id).order_by(
                session_participants.c.session_id,
                session_participants.c.user_id,
            )
        ):
            records.append(
                (
                    "session_participants",
                    {"session_id": row.session_id, "user_id": row.user_id},
                )
            )
        for vote in self.db.scalars(select(Vote).order_by(Vote.id)):
            records.append(("votes", vote_payload(vote)))

        return self.codec.encode(records)

    def purge(self, admin: User, confirmation: str) -> None:
        if confirmation != CONFIRMATION_TEXT:
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, f'Type "{CONFIRMATION_TEXT}" to remove system data')

        self._delete_all_except_admin(admin.id)
        admin.role = UserRole.admin
        admin.is_active = True
        self.db.commit()
        self._reset_sequences()

    async def import_csv(self, upload_content: bytes) -> None:
        try:
            buckets = self.codec.decode(upload_content)
            self._replace_with_backup(buckets)
            self.db.commit()
            self._reset_sequences()
        except AppError:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Backup CSV could not be imported") from exc

    def _replace_with_backup(self, buckets: BackupPayloads) -> None:
        self._delete_all()
        self.db.flush()
        self.db.expunge_all()

        for payload in buckets["users"]:
            self.db.add(
                User(
                    id=payload["id"],
                    username=payload["username"],
                    display_name=payload["display_name"],
                    email=payload["email"],
                    password_hash=payload["password_hash"],
                    avatar_url=payload["avatar_url"],
                    profile_color=payload["profile_color"],
                    theme_primary=payload["theme_primary"],
                    theme_secondary=payload["theme_secondary"],
                    theme_background=payload["theme_background"],
                    theme_paper=payload["theme_paper"],
                    role=UserRole(payload["role"]),
                    is_active=payload["is_active"],
                    created_at=parse_datetime(payload["created_at"]),
                    updated_at=parse_datetime(payload["updated_at"]),
                )
            )
        self.db.flush()

        for payload in buckets["groups"]:
            self.db.add(
                Group(
                    id=payload["id"],
                    name=payload["name"],
                    description=payload["description"],
                    image_url=payload["image_url"],
                    created_at=parse_datetime(payload["created_at"]),
                    updated_at=parse_datetime(payload["updated_at"]),
                )
            )
        self.db.flush()

        for payload in buckets["user_groups"]:
            self.db.execute(user_groups.insert().values(user_id=payload["user_id"], group_id=payload["group_id"]))

        for payload in buckets["voting_sessions"]:
            self.db.add(
                VotingSession(
                    id=payload["id"],
                    title=payload["title"],
                    description=payload["description"],
                    group_id=payload["group_id"],
                    points_pool=payload["points_pool"],
                    anonymous_mode=payload["anonymous_mode"],
                    results_published=payload["results_published"],
                    results_archived=payload["results_archived"],
                    xp_per_point=payload["xp_per_point"],
                    status=SessionStatus(payload["status"]),
                    created_at=parse_datetime(payload["created_at"]),
                    activated_at=parse_datetime(payload["activated_at"]),
                    closed_at=parse_datetime(payload["closed_at"]),
                )
            )
        self.db.flush()

        for payload in buckets["session_participants"]:
            self.db.execute(
                session_participants.insert().values(session_id=payload["session_id"], user_id=payload["user_id"])
            )

        for payload in buckets["votes"]:
            self.db.add(
                Vote(
                    id=payload["id"],
                    session_id=payload["session_id"],
                    voter_id=payload["voter_id"],
                    recipient_id=payload["recipient_id"],
                    points=payload["points"],
                    justification=payload["justification"],
                    gm_note=payload["gm_note"],
                    created_at=parse_datetime(payload["created_at"]),
                )
            )

    def _delete_all_except_admin(self, admin_id: int) -> None:
        self.db.execute(delete(Vote))
        self.db.execute(delete(session_participants))
        self.db.execute(delete(user_groups))
        self.db.execute(delete(VotingSession))
        self.db.execute(delete(Group))
        self.db.execute(delete(User).where(User.id != admin_id))

    def _delete_all(self) -> None:
        self.db.execute(delete(Vote))
        self.db.execute(delete(session_participants))
        self.db.execute(delete(user_groups))
        self.db.execute(delete(VotingSession))
        self.db.execute(delete(Group))
        self.db.execute(delete(User))

    def _reset_sequences(self) -> None:
        for table_name, column_name, model in [
            ("users", "id", User),
            ("groups", "id", Group),
            ("voting_sessions", "id", VotingSession),
            ("votes", "id", Vote),
        ]:
            max_id = self.db.scalar(select(func.max(model.id)))
            self.db.execute(
                text(
                    "SELECT setval(pg_get_serial_sequence(:table_name, :column_name), :max_id, :is_called)"
                ),
                {
                    "table_name": table_name,
                    "column_name": column_name,
                    "max_id": max_id or 1,
                    "is_called": max_id is not None,
                },
            )
        self.db.commit()
