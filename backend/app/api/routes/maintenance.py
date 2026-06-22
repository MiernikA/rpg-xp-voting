from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import current_admin
from app.database.session import get_db
from app.models.user import User
from app.schemas.maintenance import PurgeRequest
from app.services.maintenance import MaintenanceService

router = APIRouter(prefix="/maintenance", tags=["maintenance"], dependencies=[Depends(current_admin)])


@router.get("/backup.csv")
def backup_csv(db: Session = Depends(get_db)) -> Response:
    timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    return Response(
        content=MaintenanceService(db).export_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="system-backup-{timestamp}.csv"'},
    )


@router.post("/purge", status_code=status.HTTP_204_NO_CONTENT)
def purge(
    data: PurgeRequest,
    admin: User = Depends(current_admin),
    db: Session = Depends(get_db),
) -> None:
    MaintenanceService(db).purge(admin, data.confirmation)


@router.post("/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> None:
    content = await file.read()
    await MaintenanceService(db).import_csv(content)
