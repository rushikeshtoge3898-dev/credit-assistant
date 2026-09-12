from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from datetime import datetime

from database import Base



# ---------------- USER MODEL ----------------

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ---------------- CREDIT PROFILE MODEL ----------------

class CreditProfile(Base):
    __tablename__ = "credit_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    credit_score = Column(
        Integer,
        nullable=True
    )

    monthly_income = Column(
        Float,
        nullable=False
    )

    total_debt = Column(
        Float,
        nullable=False
    )

    credit_limit = Column(
        Float,
        nullable=False
    )

    credit_card_balance = Column(
        Float,
        nullable=False
    )

    active_loans = Column(
        Integer,
        default=0
    )

    missed_payments = Column(
        Integer,
        default=0
    )

    financial_goal = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


# ---------------- CREDIT SCORE HISTORY MODEL ----------------

class CreditScoreHistory(Base):
    __tablename__ = "credit_score_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    credit_score = Column(
        Integer,
        nullable=False
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ---------------- CREDIT ACCOUNT MODEL ----------------

class CreditAccount(Base):
    __tablename__ = "credit_accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    account_name = Column(
        String(150),
        nullable=False
    )

    bank_name = Column(
        String(100),
        nullable=False
    )

    account_type = Column(
        String(50),
        nullable=False  # "credit_card", "personal_loan", "home_loan", "auto_loan", etc.
    )

    account_number_masked = Column(
        String(50),
        nullable=False
    )

    current_balance = Column(
        Float,
        default=0.0
    )

    credit_limit = Column(
        Float,
        default=0.0  # Limit for credit cards, principal amount for loans
    )

    monthly_emi = Column(
        Float,
        default=0.0
    )

    payment_status = Column(
        String(50),
        default="Current"  # "Current", "Late 30d", "Late 60d", "Closed"
    )

    opened_date = Column(
        String(50),
        nullable=True
    )

    account_age_months = Column(
        Integer,
        default=12
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )



# ---------------- PAYMENT RECORD MODEL ----------------

class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    account_id = Column(
        Integer,
        ForeignKey("credit_accounts.id"),
        nullable=True
    )

    month_year = Column(
        String(20),
        nullable=False  # e.g. "Aug 2026"
    )

    amount_paid = Column(
        Float,
        default=0.0
    )

    status = Column(
        String(50),
        default="On-Time"  # "On-Time", "Delayed", "Missed"
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ---------------- CREDIT GOAL MODEL ----------------

class CreditGoal(Base):
    __tablename__ = "credit_goals"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    target_score = Column(
        Integer,
        nullable=False
    )

    target_date = Column(
        String(50),
        nullable=True
    )

    action_plan = Column(
        String(255),
        nullable=True
    )

    status = Column(
        String(50),
        default="in_progress"  # "in_progress", "completed", "cancelled"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ---------------- RECOMMENDATION MODEL ----------------

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        String(500),
        nullable=False
    )

    priority = Column(
        String(20),
        default="Medium"  # "High", "Medium", "Low"
    )

    category = Column(
        String(50),
        default="General"  # "Utilization", "Payment History", "Credit Mix", "Inquiries"
    )

    is_completed = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
