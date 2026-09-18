import os
import sys
import secrets

# Ensure backend directory is in sys.path when imported from repo root (e.g. Vercel)
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import Base, engine, get_db
from models import (
    User,
    CreditProfile,
    CreditScoreHistory,
    CreditAccount,
    PaymentRecord,
    CreditGoal,
    Recommendation,
)

from schemas import UserCreate, UserLogin, UserResponse, FirebaseLoginRequest, UserUpdate
from credit_schemas import (
    CreditProfileCreate,
    CreditProfileResponse,
    CreditProfileUpdate,
)
from analytics_schemas import CreditAnalyticsResponse
from score_history_schemas import (
    ScoreHistoryCreate,
    ScoreHistoryResponse,
)
from account_schemas import (
    CreditAccountCreate,
    CreditAccountUpdate,
    CreditAccountResponse,
    PaymentRecordCreate,
    PaymentRecordResponse,
)
from goal_schemas import (
    CreditGoalCreate,
    CreditGoalUpdate,
    CreditGoalResponse,
)
from recommendation_schemas import (
    RecommendationCreate,
    RecommendationUpdate,
    RecommendationResponse,
)
from ai_schemas import (
    AIChatRequest,
    AIChatResponse,
    AIRecommendationResponse,
    AICreditAnalysisResponse,
)
from ai_service import (
    generate_ai_chat_response,
    generate_ai_recommendations,
    generate_ai_credit_analysis,
)
from analytics import (
    calculate_credit_utilization,
    calculate_dti,
    calculate_financial_health,
)
from auth import hash_password, verify_password, create_access_token
from dependencies import get_current_user


def ensure_schema_migrations():
    """Ensure newly added columns like phone_number exist in existing databases."""
    try:
        with engine.connect() as conn:
            if engine.dialect.name == "sqlite":
                result = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
                cols = [row[1] for row in result]
                if "phone_number" not in cols:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN phone_number VARCHAR(50)")
                    conn.commit()
            elif engine.dialect.name == "postgresql":
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)")
                conn.commit()
    except Exception as e:
        print(f"Database schema migration notice: {e}")


# Auto-create all database tables
try:
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations()
except Exception as e:
    # Will retry on application startup if database was connecting
    pass


# Create FastAPI application
app = FastAPI(
    title="Credit Assistant",
    description="AI-Powered Credit Health Management Platform for CIBIL / India Ecosystem",
    version="2.0.0",
)


@app.on_event("startup")
def on_startup():
    """Ensure database tables exist on application startup."""
    try:
        Base.metadata.create_all(bind=engine)
        ensure_schema_migrations()
    except Exception as e:
        print(f"Database initialization warning on startup: {e}")


# Enable CORS for frontend integration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
if allowed_origins_env:
    origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    frontend_url = os.getenv("FRONTEND_URL", "").strip()
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    if frontend_url:
        origins.append(frontend_url)
if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Standardized API Router with /api prefix
api_router = APIRouter(prefix="/api")


# ---------------- ROOT & HEALTH ----------------

@app.get("/")
@api_router.get("/")
def home():
    return {
        "message": "Credit Assistant API is running!",
        "version": "2.0.0",
        "docs_url": "/docs"
    }


@app.get("/health")
@api_router.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# 1. AUTHENTICATION ENDPOINTS
# ============================================================================

@api_router.post("/auth/register", response_model=UserResponse)
@app.post("/auth/register", response_model=UserResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        phone_number=user.phone_number
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@api_router.post("/auth/login")
@app.post("/auth/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        existing_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id)
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
            "phone_number": existing_user.phone_number
        }
    }


@api_router.post("/auth/firebase-login")
@app.post("/auth/firebase-login")
def firebase_login(
    payload: FirebaseLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate/synchronize a user verified via Firebase (Google or Phone OTP).
    Issues standard JWT token and creates/updates local DB profile seamlessly.
    """
    identifier_email = payload.email
    if not identifier_email or identifier_email.strip() == "":
        if payload.phone_number:
            clean_phone = payload.phone_number.replace("+", "").replace(" ", "").replace("-", "")
            identifier_email = f"{clean_phone}@phone.auth"
        else:
            identifier_email = f"{payload.firebase_uid}@firebase.auth"

    user = db.query(User).filter(User.email == identifier_email).first()
    if not user:
        user_name = payload.name or "Credit Member"
        random_pwd = f"fb_{payload.firebase_uid}_{secrets.token_hex(8)}"
        hashed_pwd = hash_password(random_pwd)
        user = User(
            name=user_name,
            email=identifier_email,
            password_hash=hashed_pwd,
            phone_number=payload.phone_number
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif payload.phone_number and not user.phone_number:
        user.phone_number = payload.phone_number
        db.commit()
        db.refresh(user)

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Firebase login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone_number": user.phone_number
        }
    }


@api_router.get("/auth/me", response_model=UserResponse)
@app.get("/auth/me", response_model=UserResponse)
@api_router.get("/users/me", response_model=UserResponse)
@app.get("/users/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@api_router.put("/auth/profile", response_model=UserResponse)
@app.put("/auth/profile", response_model=UserResponse)
@api_router.put("/auth/me", response_model=UserResponse)
@app.put("/auth/me", response_model=UserResponse)
@api_router.put("/users/me", response_model=UserResponse)
@app.put("/users/me", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update registered user's basic profile (Name, Email, Phone Number).
    Protected by JWT. Rejects duplicate emails.
    """
    if user_update.email and user_update.email.lower() != current_user.email.lower():
        existing_user = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        current_user.email = user_update.email

    if user_update.name is not None:
        current_user.name = user_update.name

    new_phone = user_update.phone_number or user_update.mobile
    if new_phone is not None:
        current_user.phone_number = new_phone
    elif user_update.phone_number == "" or user_update.mobile == "":
        current_user.phone_number = None

    db.commit()
    db.refresh(current_user)

    return current_user


# ============================================================================
# 2. CREDIT PROFILE & SCORE HISTORY ENDPOINTS
# ============================================================================

@api_router.post("/credit/profile", response_model=CreditProfileResponse)
@app.post("/credit/profile", response_model=CreditProfileResponse)
def create_credit_profile(
    profile: CreditProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_profile = db.query(CreditProfile).filter(
        CreditProfile.user_id == current_user.id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Credit profile already exists"
        )

    new_profile = CreditProfile(
        user_id=current_user.id,
        credit_score=profile.credit_score,
        monthly_income=profile.monthly_income,
        total_debt=profile.total_debt,
        credit_limit=profile.credit_limit,
        credit_card_balance=profile.credit_card_balance,
        active_loans=profile.active_loans,
        missed_payments=profile.missed_payments,
        financial_goal=profile.financial_goal
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@api_router.get("/credit/profile", response_model=CreditProfileResponse)
@app.get("/credit/profile", response_model=CreditProfileResponse)
def get_credit_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CreditProfile).filter(
        CreditProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Credit profile not found"
        )

    return profile


@api_router.put("/credit/profile", response_model=CreditProfileResponse)
@app.put("/credit/profile", response_model=CreditProfileResponse)
def update_credit_profile(
    profile_update: CreditProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CreditProfile).filter(
        CreditProfile.user_id == current_user.id
    ).first()

    if not profile:
        profile = CreditProfile(
            user_id=current_user.id,
            credit_score=profile_update.credit_score,
            monthly_income=profile_update.monthly_income if profile_update.monthly_income is not None else 0.0,
            total_debt=profile_update.total_debt if profile_update.total_debt is not None else 0.0,
            credit_limit=profile_update.credit_limit if profile_update.credit_limit is not None else 0.0,
            credit_card_balance=profile_update.credit_card_balance if profile_update.credit_card_balance is not None else 0.0,
            active_loans=profile_update.active_loans if profile_update.active_loans is not None else 0,
            missed_payments=profile_update.missed_payments if profile_update.missed_payments is not None else 0,
            financial_goal=profile_update.financial_goal if profile_update.financial_goal is not None else "Improve CIBIL Score"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    if profile_update.credit_score is not None:
        profile.credit_score = profile_update.credit_score
    if profile_update.monthly_income is not None:
        profile.monthly_income = profile_update.monthly_income
    if profile_update.total_debt is not None:
        profile.total_debt = profile_update.total_debt
    if profile_update.credit_limit is not None:
        profile.credit_limit = profile_update.credit_limit
    if profile_update.credit_card_balance is not None:
        profile.credit_card_balance = profile_update.credit_card_balance
    if profile_update.active_loans is not None:
        profile.active_loans = profile_update.active_loans
    if profile_update.missed_payments is not None:
        profile.missed_payments = profile_update.missed_payments
    if profile_update.financial_goal is not None:
        profile.financial_goal = profile_update.financial_goal

    db.commit()
    db.refresh(profile)

    return profile


@api_router.get("/credit/analytics", response_model=CreditAnalyticsResponse)
@app.get("/credit/analytics", response_model=CreditAnalyticsResponse)
def get_credit_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CreditProfile).filter(
        CreditProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Credit profile not found"
        )

    utilization = calculate_credit_utilization(
        profile.credit_card_balance,
        profile.credit_limit
    )

    dti = calculate_dti(
        profile.total_debt,
        profile.monthly_income
    )

    financial_health = calculate_financial_health(
        profile.credit_score,
        utilization,
        dti,
        profile.missed_payments
    )

    if (
        utilization > 50
        or dti > 50
        or profile.missed_payments >= 3
    ):
        credit_risk = "High"
    elif (
        utilization > 30
        or dti > 30
        or profile.missed_payments > 0
    ):
        credit_risk = "Medium"
    else:
        credit_risk = "Low"

    return {
        "credit_score": profile.credit_score,
        "credit_utilization": utilization,
        "debt_to_income": dti,
        "missed_payments": profile.missed_payments,
        "financial_health": financial_health,
        "credit_risk": credit_risk
    }


@api_router.post("/credit/score-history", response_model=ScoreHistoryResponse)
@app.post("/credit/score-history", response_model=ScoreHistoryResponse)
def add_score_history(
    history: ScoreHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_history = CreditScoreHistory(
        user_id=current_user.id,
        credit_score=history.credit_score
    )

    db.add(new_history)
    db.commit()
    db.refresh(new_history)

    return new_history


@api_router.get("/credit/score-history", response_model=list[ScoreHistoryResponse])
@app.get("/credit/score-history", response_model=list[ScoreHistoryResponse])
def get_score_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(CreditScoreHistory).filter(
        CreditScoreHistory.user_id == current_user.id
    ).order_by(
        CreditScoreHistory.recorded_at.asc()
    ).all()

    return history


# ============================================================================
# 3. CREDIT ACCOUNTS ENDPOINTS
# ============================================================================

@api_router.get("/accounts", response_model=list[CreditAccountResponse])
@app.get("/credit/accounts", response_model=list[CreditAccountResponse])
def get_credit_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    accounts = db.query(CreditAccount).filter(
        CreditAccount.user_id == current_user.id
    ).order_by(CreditAccount.created_at.desc()).all()
    return accounts


@api_router.post("/accounts", response_model=CreditAccountResponse)
@app.post("/credit/accounts", response_model=CreditAccountResponse)
def create_credit_account(
    account_in: CreditAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_account = CreditAccount(
        user_id=current_user.id,
        account_name=account_in.account_name,
        bank_name=account_in.bank_name,
        account_type=account_in.account_type,
        account_number_masked=account_in.account_number_masked,
        current_balance=account_in.current_balance,
        credit_limit=account_in.credit_limit,
        monthly_emi=account_in.monthly_emi,
        payment_status=account_in.payment_status or "Current",
        opened_date=account_in.opened_date or datetime.utcnow().strftime("%b %Y"),
        account_age_months=account_in.account_age_months or 12
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account


@api_router.put("/accounts/{account_id}", response_model=CreditAccountResponse)
@app.put("/credit/accounts/{account_id}", response_model=CreditAccountResponse)
def update_credit_account(
    account_id: int,
    account_update: CreditAccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(CreditAccount).filter(
        CreditAccount.id == account_id,
        CreditAccount.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if account_update.account_name is not None:
        account.account_name = account_update.account_name
    if account_update.bank_name is not None:
        account.bank_name = account_update.bank_name
    if account_update.account_type is not None:
        account.account_type = account_update.account_type
    if account_update.account_number_masked is not None:
        account.account_number_masked = account_update.account_number_masked
    if account_update.current_balance is not None:
        account.current_balance = account_update.current_balance
    if account_update.credit_limit is not None:
        account.credit_limit = account_update.credit_limit
    if account_update.monthly_emi is not None:
        account.monthly_emi = account_update.monthly_emi
    if account_update.payment_status is not None:
        account.payment_status = account_update.payment_status
    if account_update.opened_date is not None:
        account.opened_date = account_update.opened_date
    if account_update.account_age_months is not None:
        account.account_age_months = account_update.account_age_months

    db.commit()
    db.refresh(account)
    return account


@api_router.delete("/accounts/{account_id}")
@app.delete("/credit/accounts/{account_id}")
def delete_credit_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(CreditAccount).filter(
        CreditAccount.id == account_id,
        CreditAccount.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()
    return {"message": "Account deleted successfully"}


# ============================================================================
# 4. PAYMENTS ENDPOINTS
# ============================================================================

@api_router.get("/payments", response_model=list[PaymentRecordResponse])
@app.get("/credit/payments", response_model=list[PaymentRecordResponse])
def get_payment_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(PaymentRecord).filter(
        PaymentRecord.user_id == current_user.id
    ).order_by(PaymentRecord.recorded_at.desc()).all()
    return records


@api_router.post("/payments", response_model=PaymentRecordResponse)
@app.post("/credit/payments", response_model=PaymentRecordResponse)
def create_payment_record(
    record_in: PaymentRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_record = PaymentRecord(
        user_id=current_user.id,
        account_id=record_in.account_id,
        month_year=record_in.month_year,
        amount_paid=record_in.amount_paid,
        status=record_in.status
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


# ============================================================================
# 5. GOALS ENDPOINTS
# ============================================================================

@api_router.get("/goals", response_model=list[CreditGoalResponse])
@app.get("/credit/goals", response_model=list[CreditGoalResponse])
def get_credit_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = db.query(CreditGoal).filter(
        CreditGoal.user_id == current_user.id
    ).order_by(CreditGoal.created_at.desc()).all()
    return goals


@api_router.post("/goals", response_model=CreditGoalResponse)
@app.post("/credit/goals", response_model=CreditGoalResponse)
def create_credit_goal(
    goal_in: CreditGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_goal = CreditGoal(
        user_id=current_user.id,
        target_score=goal_in.target_score,
        target_date=goal_in.target_date,
        action_plan=goal_in.action_plan,
        status="in_progress"
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal


@api_router.put("/goals/{goal_id}", response_model=CreditGoalResponse)
@app.put("/credit/goals/{goal_id}", response_model=CreditGoalResponse)
def update_credit_goal(
    goal_id: int,
    goal_update: CreditGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(CreditGoal).filter(
        CreditGoal.id == goal_id,
        CreditGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal_update.target_score is not None:
        goal.target_score = goal_update.target_score
    if goal_update.target_date is not None:
        goal.target_date = goal_update.target_date
    if goal_update.action_plan is not None:
        goal.action_plan = goal_update.action_plan
    if goal_update.status is not None:
        goal.status = goal_update.status

    db.commit()
    db.refresh(goal)
    return goal


@api_router.delete("/goals/{goal_id}")
@app.delete("/credit/goals/{goal_id}")
def delete_credit_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(CreditGoal).filter(
        CreditGoal.id == goal_id,
        CreditGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}


# ============================================================================
# 6. RECOMMENDATIONS ENDPOINTS (Database Backed)
# ============================================================================

@api_router.get("/recommendations", response_model=list[RecommendationResponse])
@app.get("/recommendations", response_model=list[RecommendationResponse])
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_recs = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.id
    ).order_by(Recommendation.created_at.desc()).all()

    # If user has no recommendations saved in DB yet, auto-generate initial prioritized ones
    if not user_recs:
        profile = db.query(CreditProfile).filter(
            CreditProfile.user_id == current_user.id
        ).first()

        utilization = 0.0
        if profile and profile.credit_limit > 0:
            utilization = (profile.credit_card_balance / profile.credit_limit) * 100

        initial_recommendations = []

        if utilization > 30:
            initial_recommendations.append(
                Recommendation(
                    user_id=current_user.id,
                    title="Lower Revolving Card Utilization Below 30%",
                    description=f"Your current card utilization is {utilization:.1f}%. Pay down card balance before statement closing to instantly boost CIBIL points.",
                    priority="High",
                    category="Utilization",
                    is_completed=False
                )
            )
        else:
            initial_recommendations.append(
                Recommendation(
                    user_id=current_user.id,
                    title="Maintain Optimal Utilization Under 30%",
                    description=f"Your utilization is healthy at {utilization:.1f}%. Keep card balances well below 30% of your total limit.",
                    priority="Low",
                    category="Utilization",
                    is_completed=False
                )
            )

        if profile and profile.missed_payments > 0:
            initial_recommendations.append(
                Recommendation(
                    user_id=current_user.id,
                    title="Clear Overdue Balances to Stop Negative Reporting",
                    description=f"You have {profile.missed_payments} reported overdue payment(s). Settle overdue dues immediately to avoid 30+ DPD mark.",
                    priority="High",
                    category="Payment History",
                    is_completed=False
                )
            )
        else:
            initial_recommendations.append(
                Recommendation(
                    user_id=current_user.id,
                    title="Enable Auto-Debit for 100% On-Time Record",
                    description="Set bank auto-debit on total bill amount due so you never miss an EMI or credit card deadline (35% factor).",
                    priority="Medium",
                    category="Payment History",
                    is_completed=False
                )
            )

        initial_recommendations.append(
            Recommendation(
                user_id=current_user.id,
                title="Preserve Oldest Credit Tradelines",
                description="Avoid closing your oldest active credit card to maintain established credit age and low utilization capacity.",
                priority="Medium",
                category="Credit Mix",
                is_completed=False
            )
        )

        db.add_all(initial_recommendations)
        db.commit()

        user_recs = db.query(Recommendation).filter(
            Recommendation.user_id == current_user.id
        ).order_by(Recommendation.created_at.desc()).all()

    return user_recs


@api_router.post("/recommendations", response_model=RecommendationResponse)
@app.post("/recommendations", response_model=RecommendationResponse)
def create_recommendation(
    rec_in: RecommendationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_rec = Recommendation(
        user_id=current_user.id,
        title=rec_in.title,
        description=rec_in.description,
        priority=rec_in.priority,
        category=rec_in.category,
        is_completed=rec_in.is_completed
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return new_rec


@api_router.put("/recommendations/{rec_id}", response_model=RecommendationResponse)
@app.put("/recommendations/{rec_id}", response_model=RecommendationResponse)
def update_recommendation(
    rec_id: int,
    rec_update: RecommendationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(
        Recommendation.id == rec_id,
        Recommendation.user_id == current_user.id
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    if rec_update.title is not None:
        rec.title = rec_update.title
    if rec_update.description is not None:
        rec.description = rec_update.description
    if rec_update.priority is not None:
        rec.priority = rec_update.priority
    if rec_update.category is not None:
        rec.category = rec_update.category
    if rec_update.is_completed is not None:
        rec.is_completed = rec_update.is_completed

    db.commit()
    db.refresh(rec)
    return rec


# ============================================================================
# 7. AI ADVISOR ENDPOINTS
# ============================================================================

@api_router.post("/ai/analyze-credit", response_model=AICreditAnalysisResponse)
@app.post("/ai/analyze-credit", response_model=AICreditAnalysisResponse)
def ai_analyze_credit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CreditProfile).filter(
        CreditProfile.user_id == current_user.id
    ).first()

    accounts = db.query(CreditAccount).filter(
        CreditAccount.user_id == current_user.id
    ).all()

    payments = db.query(PaymentRecord).filter(
        PaymentRecord.user_id == current_user.id
    ).all()

    result = generate_ai_credit_analysis(
        profile=profile,
        accounts=accounts,
        payments=payments
    )
    return result


@api_router.post("/ai/chat", response_model=AIChatResponse)
@app.post("/ai/chat", response_model=AIChatResponse)
def ai_chat(
    req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CreditProfile).filter(
        CreditProfile.user_id == current_user.id
    ).first()
    accounts = db.query(CreditAccount).filter(
        CreditAccount.user_id == current_user.id
    ).all()

    result = generate_ai_chat_response(
        user_message=req.message,
        profile=profile,
        accounts=accounts,
        chat_history=req.history,
        language=req.language or "en"
    )
    return result


@api_router.get("/ai/recommendations", response_model=AIRecommendationResponse)
@app.get("/ai/recommendations", response_model=AIRecommendationResponse)
def ai_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CreditProfile).filter(
        CreditProfile.user_id == current_user.id
    ).first()
    accounts = db.query(CreditAccount).filter(
        CreditAccount.user_id == current_user.id
    ).all()

    result = generate_ai_recommendations(
        profile=profile,
        accounts=accounts
    )
    return result


# ============================================================================
# 8. DEMO DATA SEEDING ENDPOINT
# ============================================================================

@api_router.post("/credit/seed-sample-data")
@app.post("/credit/seed-sample-data")
def seed_sample_cibil_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()

    # Ensure profile exists
    profile = db.query(CreditProfile).filter(
        CreditProfile.user_id == current_user.id
    ).first()

    if not profile:
        profile = CreditProfile(
            user_id=current_user.id,
            credit_score=720,
            monthly_income=65000.0,
            total_debt=180000.0,
            credit_limit=120000.0,
            credit_card_balance=32000.0,
            active_loans=2,
            missed_payments=0,
            financial_goal="Reach 780+ CIBIL score for Home Loan eligibility"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Add sample accounts if none
    existing_accs = db.query(CreditAccount).filter(
        CreditAccount.user_id == current_user.id
    ).count()

    if existing_accs == 0:
        sample_accounts = [
            CreditAccount(
                user_id=current_user.id,
                account_name="HDFC Millennia Credit Card",
                bank_name="HDFC Bank",
                account_type="credit_card",
                account_number_masked="XXXX-4819",
                current_balance=22000.0,
                credit_limit=80000.0,
                monthly_emi=0.0,
                payment_status="Current",
                opened_date="Aug 2023",
                account_age_months=36
            ),
            CreditAccount(
                user_id=current_user.id,
                account_name="ICICI Amazon Pay Card",
                bank_name="ICICI Bank",
                account_type="credit_card",
                account_number_masked="XXXX-9281",
                current_balance=10000.0,
                credit_limit=40000.0,
                monthly_emi=0.0,
                payment_status="Current",
                opened_date="Jan 2024",
                account_age_months=32
            ),
            CreditAccount(
                user_id=current_user.id,
                account_name="SBI Express Personal Loan",
                bank_name="State Bank of India",
                account_type="personal_loan",
                account_number_masked="XXXX-7310",
                current_balance=148000.0,
                credit_limit=200000.0,
                monthly_emi=6450.0,
                payment_status="Current",
                opened_date="Jul 2025",
                account_age_months=14
            )
        ]
        db.add_all(sample_accounts)
        db.commit()

    # Add sample score history if none exist (idempotent seeding)
    existing_history = db.query(CreditScoreHistory).filter(
        CreditScoreHistory.user_id == current_user.id
    ).count()

    if existing_history == 0:
        sample_history = [
            CreditScoreHistory(user_id=current_user.id, credit_score=685, recorded_at=now - timedelta(days=90)),
            CreditScoreHistory(user_id=current_user.id, credit_score=705, recorded_at=now - timedelta(days=60)),
            CreditScoreHistory(user_id=current_user.id, credit_score=715, recorded_at=now - timedelta(days=30)),
            CreditScoreHistory(user_id=current_user.id, credit_score=720, recorded_at=now),
        ]
        db.add_all(sample_history)
        db.commit()

    # Add sample payment records if none
    existing_payments = db.query(PaymentRecord).filter(
        PaymentRecord.user_id == current_user.id
    ).count()

    if existing_payments == 0:
        sample_payments = [
            PaymentRecord(user_id=current_user.id, month_year="May 2026", amount_paid=14200.0, status="On-Time"),
            PaymentRecord(user_id=current_user.id, month_year="Jun 2026", amount_paid=15800.0, status="On-Time"),
            PaymentRecord(user_id=current_user.id, month_year="Jul 2026", amount_paid=13500.0, status="On-Time"),
            PaymentRecord(user_id=current_user.id, month_year="Aug 2026", amount_paid=16100.0, status="On-Time"),
        ]
        db.add_all(sample_payments)
        db.commit()

    return {"message": "Sample CIBIL accounts, history, and payment records successfully seeded"}


# Mount the API router onto the main application
app.include_router(api_router)
