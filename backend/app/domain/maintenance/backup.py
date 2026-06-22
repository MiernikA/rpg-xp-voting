import csv
import io
import json
from datetime import datetime
from typing import Any

from fastapi import status

from app.core.errors import AppError
from app.models.group import Group
from app.models.user import User
from app.models.vote import Vote
from app.models.voting_session import VotingSession

BACKUP_VERSION = "1"
BACKUP_ENTITIES = (
    "users",
    "groups",
    "user_groups",
    "voting_sessions",
    "session_participants",
    "votes",
)

BackupPayloads = dict[str, list[dict[str, Any]]]


class BackupCsvCodec:
    fieldnames = ["backup_version", "entity", "payload"]

    def encode(self, records: list[tuple[str, dict[str, Any]]]) -> str:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=self.fieldnames)
        writer.writeheader()
        for entity, payload in records:
            writer.writerow(
                {
                    "backup_version": BACKUP_VERSION,
                    "entity": entity,
                    "payload": json.dumps(
                        payload,
                        ensure_ascii=False,
                        separators=(",", ":"),
                        default=str,
                    ),
                }
            )
        return output.getvalue()

    def decode(self, upload_content: bytes) -> BackupPayloads:
        try:
            content = upload_content.decode("utf-8-sig")
            rows = list(csv.DictReader(io.StringIO(content)))
        except UnicodeDecodeError as exc:
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Backup CSV must be UTF-8") from exc

        buckets: BackupPayloads = {entity: [] for entity in BACKUP_ENTITIES}
        for row in rows:
            if row.get("backup_version") != BACKUP_VERSION:
                raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unsupported backup CSV version")
            entity = row.get("entity")
            if entity not in buckets:
                raise AppError(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    "Backup CSV contains an unknown entity",
                )
            buckets[entity].append(json.loads(row.get("payload") or "{}"))
        if not buckets["users"]:
            raise AppError(status.HTTP_422_UNPROCESSABLE_ENTITY, "Backup CSV does not contain any users")
        return buckets


def user_payload(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "email": user.email,
        "password_hash": user.password_hash,
        "avatar_url": user.avatar_url,
        "profile_color": user.profile_color,
        "theme_primary": user.theme_primary,
        "theme_secondary": user.theme_secondary,
        "theme_background": user.theme_background,
        "theme_paper": user.theme_paper,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


def group_payload(group: Group) -> dict[str, Any]:
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "image_url": group.image_url,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
    }


def session_payload(session: VotingSession) -> dict[str, Any]:
    return {
        "id": session.id,
        "title": session.title,
        "description": session.description,
        "group_id": session.group_id,
        "points_pool": session.points_pool,
        "anonymous_mode": session.anonymous_mode,
        "results_published": session.results_published,
        "results_archived": session.results_archived,
        "xp_per_point": session.xp_per_point,
        "status": session.status.value,
        "created_at": session.created_at,
        "activated_at": session.activated_at,
        "closed_at": session.closed_at,
    }


def vote_payload(vote: Vote) -> dict[str, Any]:
    return {
        "id": vote.id,
        "session_id": vote.session_id,
        "voter_id": vote.voter_id,
        "recipient_id": vote.recipient_id,
        "points": vote.points,
        "justification": vote.justification,
        "gm_note": vote.gm_note,
        "created_at": vote.created_at,
    }


def parse_datetime(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value)
