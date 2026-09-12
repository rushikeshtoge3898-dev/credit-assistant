from pydantic import BaseModel
from datetime import datetime


class ScoreHistoryCreate(BaseModel):
    credit_score: int


class ScoreHistoryResponse(BaseModel):
    id: int
    user_id: int
    credit_score: int
    recorded_at: datetime

    class Config:
        from_attributes = True