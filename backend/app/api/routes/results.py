from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import current_admin, current_manager, current_user, require_group_access
from app.database.session import get_db
from app.models.user import User
from app.repositories.sessions import VotingSessionRepository
from app.schemas.results import CommentRead, GMSessionView, PlayerResultDetail, PublishedSessionResults, ResultRow
from app.services.results import ResultService

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/published", response_model=list[PublishedSessionResults])
def published_results(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> list[PublishedSessionResults]:
    return ResultService(db).published_for_user(user.id)


@router.get("/comments/search", response_model=list[CommentRead])
def comments(
    session_id: int | None = None,
    player_id: int | None = None,
    keyword: str | None = None,
    admin: User = Depends(current_admin),
    db: Session = Depends(get_db),
) -> list[CommentRead]:
    return ResultService(db).comments(session_id, player_id, keyword)


@router.get("/{session_id}", response_model=list[ResultRow])
def rankings(
    session_id: int,
    manager: User = Depends(current_manager),
    db: Session = Depends(get_db),
) -> list[ResultRow]:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return ResultService(db).rankings(session_id)


@router.get("/{session_id}/gm-view", response_model=GMSessionView)
def gm_view(
    session_id: int,
    manager: User = Depends(current_manager),
    db: Session = Depends(get_db),
) -> GMSessionView:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return ResultService(db).gm_view(session_id)


@router.get("/{session_id}/players/{player_id}", response_model=PlayerResultDetail)
def player_detail(
    session_id: int,
    player_id: int,
    manager: User = Depends(current_manager),
    db: Session = Depends(get_db),
) -> PlayerResultDetail:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return ResultService(db).player_detail(session_id, player_id)


@router.get("/{session_id}/export.csv")
def export_csv(
    session_id: int,
    manager: User = Depends(current_manager),
    db: Session = Depends(get_db),
) -> Response:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return Response(
        content=ResultService(db).export_csv(session_id),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="session-{session_id}-results.csv"'},
    )


@router.get("/{session_id}/export.xlsx")
def export_xlsx(
    session_id: int,
    manager: User = Depends(current_manager),
    db: Session = Depends(get_db),
) -> Response:
    session = VotingSessionRepository(db).get(session_id)
    require_group_access(manager, session.group_id if session else None)
    return Response(
        content=ResultService(db).export_xlsx(session_id),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="session-{session_id}-results.xlsx"'},
    )
