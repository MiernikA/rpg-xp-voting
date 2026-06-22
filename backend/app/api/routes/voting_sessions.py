from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import current_admin, current_user
from app.database.session import get_db
from app.repositories.sessions import VotingSessionRepository
from app.schemas.voting_session import (
    SessionProgress,
    VotingSessionCreate,
    VotingSessionRead,
    VotingSessionUpdate,
)
from app.services.sessions import VotingSessionService

router = APIRouter(prefix="/sessions", tags=["voting sessions"])


def serialize_session(session) -> VotingSessionRead:
    return VotingSessionRead(
        id=session.id,
        title=session.title,
        description=session.description,
        group_id=session.group_id,
        group_name=session.group.name if session.group else None,
        participant_ids=[participant.id for participant in session.participants],
        points_pool=session.points_pool,
        anonymous_mode=session.anonymous_mode,
        results_published=session.results_published,
        results_archived=session.results_archived,
        xp_per_point=session.xp_per_point,
        status=session.status,
        created_at=session.created_at,
        activated_at=session.activated_at,
        closed_at=session.closed_at,
    )


@router.get("", response_model=list[VotingSessionRead], dependencies=[Depends(current_admin)])
def list_sessions(
    limit: int = 100,
    offset: int = 0,
    group_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[VotingSessionRead]:
    items, _ = VotingSessionRepository(db).list(limit=limit, offset=offset, group_id=group_id)
    return [serialize_session(item) for item in items]


@router.get("/active", response_model=VotingSessionRead | None)
def active_session(user=Depends(current_user), db: Session = Depends(get_db)) -> VotingSessionRead | None:
    if user.role.value == "admin":
        session = VotingSessionRepository(db).active()
    else:
        session = VotingSessionRepository(db).active_for_user(user.id)
    return serialize_session(session) if session else None


@router.post("", response_model=VotingSessionRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(current_admin)])
def create_session(data: VotingSessionCreate, db: Session = Depends(get_db)) -> VotingSessionRead:
    return serialize_session(VotingSessionService(db).create(data))


@router.patch("/{session_id}", response_model=VotingSessionRead, dependencies=[Depends(current_admin)])
def update_session(session_id: int, data: VotingSessionUpdate, db: Session = Depends(get_db)) -> VotingSessionRead:
    return serialize_session(VotingSessionService(db).update(session_id, data))


@router.post("/{session_id}/activate", response_model=VotingSessionRead, dependencies=[Depends(current_admin)])
def activate_session(session_id: int, db: Session = Depends(get_db)) -> VotingSessionRead:
    return serialize_session(VotingSessionService(db).activate(session_id))


@router.post("/{session_id}/close", response_model=VotingSessionRead, dependencies=[Depends(current_admin)])
def close_session(session_id: int, db: Session = Depends(get_db)) -> VotingSessionRead:
    return serialize_session(VotingSessionService(db).close(session_id))


@router.post("/{session_id}/publish-results", response_model=VotingSessionRead, dependencies=[Depends(current_admin)])
def publish_results(session_id: int, db: Session = Depends(get_db)) -> VotingSessionRead:
    return serialize_session(VotingSessionService(db).publish_results(session_id))


@router.post("/{session_id}/archive-results", response_model=VotingSessionRead, dependencies=[Depends(current_admin)])
def archive_results(session_id: int, db: Session = Depends(get_db)) -> VotingSessionRead:
    return serialize_session(VotingSessionService(db).archive_results(session_id))


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(current_admin)])
def delete_session(session_id: int, db: Session = Depends(get_db)) -> None:
    VotingSessionService(db).delete(session_id)


@router.get("/{session_id}/progress", response_model=SessionProgress, dependencies=[Depends(current_admin)])
def progress(session_id: int, db: Session = Depends(get_db)) -> SessionProgress:
    return VotingSessionService(db).progress(session_id)
