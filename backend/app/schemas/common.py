from pydantic import BaseModel, ConfigDict


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page(APIModel):
    items: list
    total: int
    limit: int
    offset: int
