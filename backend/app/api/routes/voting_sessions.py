from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import current_manager, current_user, require_group_access
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


@router.get("", response_model=list[VotingSessionRead])
def list_sessions(
    limit: int = 100,
    offset: int = 0,
    group_id: int | None = None,
    manager=Depends(current_manager), db: Session = Depends(get_db),
) -> list[VotingSessionRead]:
    require_group_access(manager, group_id)
    items, _ = VotingSessionRepository(db).list(limit=limit, offset=offset, group_id=group_id)
    return [serialize_session(item) for item in items]


@router.get("/active", response_model=VotingSessionRead | None)
def active_session(user=Depends(current_user), db: Session = Depends(get_db)) -> VotingSessionRead | None:
    if user.role.value == "admin":
        session = VotingSessionRepository(db).active()
    elif user.role.value == "game_master":
        session = None
        for group in user.managed_groups:
            session = VotingSessionRepository(db).active(group.id)
            if session:
                break
    else:
        session = VotingSessionRepository(db).active_for_user(user.id)
    return serialize_session(session) if session else None


@router.post("", response_model=VotingSessionRead, status_code=status.HTTP_201_CREATED)
def create_session(data: VotingSessionCreate, manager=Depends(current_manager), db: Session = Depends(get_db)) -> VotingSessionRead:
    require_group_access(manager, data.group_id)
    return serialize_session(VotingSessionService(db).create(data))


@router.patch("/{session_id}", response_model=VotingSessionRead)
def update_session(session_id: int, data: VotingSessionUpdate, manager=Depends(current_manager), db: Session = Depends(get_db)) -> VotingSessionRead:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, data.group_id or (session.group_id if session else None))
    return serialize_session(VotingSessionService(db).update(session_id, data))


@router.post("/{session_id}/activate", response_model=VotingSessionRead)
def activate_session(session_id: int, manager=Depends(current_manager), db: Session = Depends(get_db)) -> VotingSessionRead:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return serialize_session(VotingSessionService(db).activate(session_id))


@router.post("/{session_id}/close", response_model=VotingSessionRead)
def close_session(session_id: int, manager=Depends(current_manager), db: Session = Depends(get_db)) -> VotingSessionRead:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return serialize_session(VotingSessionService(db).close(session_id))


@router.post("/{session_id}/publish-results", response_model=VotingSessionRead)
def publish_results(session_id: int, manager=Depends(current_manager), db: Session = Depends(get_db)) -> VotingSessionRead:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return serialize_session(VotingSessionService(db).publish_results(session_id))


@router.post("/{session_id}/archive-results", response_model=VotingSessionRead)
def archive_results(session_id: int, manager=Depends(current_manager), db: Session = Depends(get_db)) -> VotingSessionRead:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return serialize_session(VotingSessionService(db).archive_results(session_id))


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, manager=Depends(current_manager), db: Session = Depends(get_db)) -> None:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    VotingSessionService(db).delete(session_id)


@router.get("/{session_id}/progress", response_model=SessionProgress)
def progress(session_id: int, manager=Depends(current_manager), db: Session = Depends(get_db)) -> SessionProgress:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return VotingSessionService(db).progress(session_id)
