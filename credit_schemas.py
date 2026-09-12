from pydantic import BaseModel, Field
from typing import Optional


class CreditProfileCreate(BaseModel):
    credit_score: Optional[int] = Field(
        default=None,
        ge=300,
        le=900
    )

    monthly_income: float = Field(
        gt=0
    )

    total_debt: float = Field(
        ge=0
    )

    credit_limit: float = Field(
        ge=0
    )

    credit_card_balance: float = Field(
        ge=0
    )

    active_loans: int = Field(
        default=0,
        ge=0
    )

    missed_payments: int = Field(
        default=0,
        ge=0
    )

    financial_goal: Optional[str] = None


class CreditProfileResponse(BaseModel):
    id: int
    user_id: int
    credit_score: Optional[int]
    monthly_income: float
    total_debt: float
    credit_limit: float
    credit_card_balance: float
    active_loans: int
    missed_payments: int
    financial_goal: Optional[str]

    class Config:
        from_attributes = True


class CreditProfileUpdate(BaseModel):
    credit_score: Optional[int] = Field(default=None, ge=300, le=900)
    monthly_income: Optional[float] = Field(default=None, gt=0)
    total_debt: Optional[float] = Field(default=None, ge=0)
    credit_limit: Optional[float] = Field(default=None, ge=0)
    credit_card_balance: Optional[float] = Field(default=None, ge=0)
    active_loans: Optional[int] = Field(default=None, ge=0)
    missed_payments: Optional[int] = Field(default=None, ge=0)
    financial_goal: Optional[str] = None