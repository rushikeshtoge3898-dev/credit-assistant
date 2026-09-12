from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CreditAccountCreate(BaseModel):
    account_name: str
    bank_name: str
    account_type: str  # credit_card, personal_loan, home_loan, auto_loan
    account_number_masked: str
    current_balance: float = Field(default=0.0, ge=0)
    credit_limit: float = Field(default=0.0, ge=0)
    monthly_emi: float = Field(default=0.0, ge=0)
    payment_status: Optional[str] = "Current"
    opened_date: Optional[str] = None
    account_age_months: Optional[int] = Field(default=12, ge=0)


class CreditAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_type: Optional[str] = None
    account_number_masked: Optional[str] = None
    current_balance: Optional[float] = Field(default=None, ge=0)
    credit_limit: Optional[float] = Field(default=None, ge=0)
    monthly_emi: Optional[float] = Field(default=None, ge=0)
    payment_status: Optional[str] = None
    opened_date: Optional[str] = None
    account_age_months: Optional[int] = Field(default=None, ge=0)


class CreditAccountResponse(BaseModel):
    id: int
    user_id: int
    account_name: str
    bank_name: str
    account_type: str
    account_number_masked: str
    current_balance: float
    credit_limit: float
    monthly_emi: float
    payment_status: str
    opened_date: Optional[str] = None
    account_age_months: Optional[int] = 12
    created_at: datetime

    class Config:
        from_attributes = True



class PaymentRecordCreate(BaseModel):
    account_id: Optional[int] = None
    month_year: str
    amount_paid: float = Field(default=0.0, ge=0)
    status: str = "On-Time"  # On-Time, Delayed, Missed


class PaymentRecordResponse(BaseModel):
    id: int
    user_id: int
    account_id: Optional[int]
    month_year: str
    amount_paid: float
    status: str
    recorded_at: datetime

    class Config:
        from_attributes = True
