from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.api.deps import current_user
from app.database.session import get_db
from app.models.group import Group
from app.models.user import User
from app.models.voting_session import VotingSession
from app.schemas.me import MyInfo, MySessionPoints
from app.schemas.user import MeUpdate, UserRead
from app.services.anonymity import anonymized_vote_comments

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=MyInfo)
def my_info(user: User = Depends(current_user), db: Session = Depends(get_db)) -> MyInfo:
    loaded_user = db.scalar(
        select(User)
        .options(selectinload(User.groups).selectinload(Group.members))
        .where(User.id == user.id)
    )
    user = loaded_user or user
    group_ids = [group.id for group in user.groups]
    sessions = list(
        db.scalars(
            select(VotingSession)
            .options(
                joinedload(VotingSession.group),
                selectinload(VotingSession.participants),
                selectinload(VotingSession.votes),
            )
            .where(VotingSession.results_published.is_(True))
            .where(
                or_(
                    VotingSession.group_id.in_(group_ids),
                    VotingSession.participants.any(User.id == user.id),
                )
            )
            .order_by(VotingSession.id.desc())
        )
    )

    history = []
    for voting_session in sessions:
        participated = any(participant.id == user.id for participant in voting_session.participants)
        received_votes = [vote for vote in voting_session.votes if vote.recipient_id == user.id]
        history.append(
            MySessionPoints(
                session_id=voting_session.id,
                session_title=voting_session.title,
                session_description=voting_session.description,
                group_name=voting_session.group.name if voting_session.group else None,
                participated=participated,
                points_received=sum(vote.points for vote in received_votes),
                max_points_available=voting_session.points_pool
                * max(len(voting_session.participants) - 1, 0),
                comments=anonymized_vote_comments(received_votes),
            )
        )

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
