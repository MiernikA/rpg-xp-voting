from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.api.deps import current_user
from app.database.session import get_db
from app.models.group import Group
from app.models.user import User
from app.models.vote import Vote
from app.models.voting_session import VotingSession
from app.schemas.me import MyInfo, MySessionPoints
from app.schemas.user import MeUpdate, UserRead

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=MyInfo)
def my_info(user: User = Depends(current_user), db: Session = Depends(get_db)) -> MyInfo:
    loaded_user = db.scalar(
        select(User)
        .options(selectinload(User.groups).selectinload(Group.members))
        .where(User.id == user.id)
    )
    user = loaded_user or user
    votes = list(
        db.scalars(
            select(Vote)
            .options(
                joinedload(Vote.session).joinedload(VotingSession.group),
                joinedload(Vote.session).selectinload(VotingSession.participants),
                joinedload(Vote.voter),
            )
            .join(Vote.session)
            .where(Vote.recipient_id == user.id)
            .where(VotingSession.results_published.is_(True))
        )
    )
    by_session: dict[int, list[Vote]] = defaultdict(list)
    for vote in votes:
        by_session[vote.session_id].append(vote)

    history = []
    for session_votes in by_session.values():
        session = session_votes[0].session
        history.append(
            MySessionPoints(
                session_id=session.id,
                session_title=session.title,
                group_name=session.group.name if session.group else None,
                points_received=sum(vote.points for vote in session_votes),
                max_points_available=session.points_pool * max(len(session.participants) - 1, 0),
                comments=[
                    f"{vote.voter.display_name}: {vote.justification}"
                    for vote in session_votes
                    if vote.justification
                ],
            )
        )

    history.sort(key=lambda item: item.session_id, reverse=True)
    return MyInfo(
        user=UserRead.model_validate(user),
        groups=list(user.groups),
        history=history,
    )


@router.patch("", response_model=UserRead)
def update_me(
    data: MeUpdate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    values = data.model_dump(exclude_unset=True)
    if "display_name" in values and values["display_name"] is not None:
        user.display_name = values["display_name"].strip()
    if "avatar_url" in values:
        user.avatar_url = values["avatar_url"].strip() if values["avatar_url"] else None
    if "theme_primary" in values and values["theme_primary"] is not None:
        user.theme_primary = values["theme_primary"]
    if "theme_secondary" in values and values["theme_secondary"] is not None:
        user.theme_secondary = values["theme_secondary"]
    if "theme_background" in values and values["theme_background"] is not None:
        user.theme_background = values["theme_background"]
    if "theme_paper" in values and values["theme_paper"] is not None:
        user.theme_paper = values["theme_paper"]
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)
