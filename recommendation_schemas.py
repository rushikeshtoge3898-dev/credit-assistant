from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RecommendationCreate(BaseModel):
    title: str
    description: str
    priority: str = "Medium"  # High, Medium, Low
    category: str = "General"  # Utilization, Payment History, Credit Mix, Inquiries
    is_completed: bool = False


class RecommendationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    is_completed: Optional[bool] = None


class RecommendationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    priority: str
    category: str
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
