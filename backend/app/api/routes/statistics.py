from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import current_admin
from app.database.session import get_db
from app.schemas.statistics import DashboardStats, StatisticsRead
from app.services.statistics import StatisticsService

router = APIRouter(prefix="/statistics", tags=["statistics"], dependencies=[Depends(current_admin)])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db)) -> DashboardStats:
    return StatisticsService(db).dashboard()


@router.get("", response_model=StatisticsRead)
def statistics(db: Session = Depends(get_db)) -> StatisticsRead:
    return StatisticsService(db).charts()
