from pydantic import BaseModel


class CreditAnalyticsResponse(BaseModel):
    credit_score: int | None
    credit_utilization: float
    debt_to_income: float
    missed_payments: int
    financial_health: str
    credit_risk: str