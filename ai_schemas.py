from pydantic import BaseModel
from typing import Optional, List


class AIChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[AIChatMessage]] = None
    language: Optional[str] = "en"


class AIChatResponse(BaseModel):
    response: str
    suggested_actions: Optional[List[str]] = None


class AIRecommendationResponse(BaseModel):
    summary: str
    cibil_health_status: str
    strengths: List[str]
    risk_factors: List[str]
    actionable_steps: List[str]
    target_score_projection: str


class AICreditAnalysisResponse(BaseModel):
    cibil_health_score: Optional[int] = None
    health_grade: str
    summary: str
    key_positive_factors: List[str]
    critical_risk_factors: List[str]
    immediate_action_items: List[str]
    long_term_strategy: List[str]
    educational_disclaimer: str

