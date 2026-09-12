from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CreditGoalCreate(BaseModel):
    target_score: int = Field(ge=300, le=900)
    target_date: Optional[str] = None
    action_plan: Optional[str] = None


class CreditGoalUpdate(BaseModel):
    target_score: Optional[int] = Field(default=None, ge=300, le=900)
    target_date: Optional[str] = None
    action_plan: Optional[str] = None
    status: Optional[str] = None


class CreditGoalResponse(BaseModel):
    id: int
    user_id: int
    target_score: int
    target_date: Optional[str]
    action_plan: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
