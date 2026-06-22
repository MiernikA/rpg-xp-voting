from app.schemas.common import APIModel


class PurgeRequest(APIModel):
    confirmation: str
