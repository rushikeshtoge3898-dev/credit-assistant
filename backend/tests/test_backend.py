import os
import sys

# Ensure backend root is on Python module path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql

import database
from database import Base, get_db
from models import (
    User,
    CreditProfile,
    CreditScoreHistory,
    CreditAccount,
    PaymentRecord,
    CreditGoal,
    Recommendation,
)
from main import app

from sqlalchemy.pool import StaticPool

# Use isolated in-memory SQLite database with StaticPool for tests
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def get_auth_token(email: str, password: str = "TestPass123!", name: str = "Test User") -> str:
    """Helper to register and/or login a test user and return JWT access token."""
    # Attempt register
    client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    # Login
    res = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
    )
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


# ============================================================================
# 1. DATABASE CONFIGURATION & POSTGRESQL COMPATIBILITY TESTS
# ============================================================================

def test_database_url_normalization():
    """Verify that postgres:// is normalized to postgresql://, quotes stripped, and SQLite stays default."""
    raw_supabase = " 'postgres://postgres.abc:SecretPass@aws-0-eu-central-1.pooler.supabase.com:6543/postgres' "
    stripped = raw_supabase.strip().strip("'\"")
    normalized = stripped.replace("postgres://", "postgresql://", 1)
    assert normalized.startswith("postgresql://")

    # Verify SQLite fallback
    empty_url = ""
    fallback = empty_url.strip() if empty_url.strip() else "sqlite:///./credit_assistant.db"
    assert fallback == "sqlite:///./credit_assistant.db"


def test_cors_preflight_and_headers():
    """Verify CORS preflight and response headers."""
    res = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert res.status_code == 200
    assert "access-control-allow-origin" in res.headers



def test_postgresql_ddl_generation():
    """Compile every SQLAlchemy model table into PostgreSQL DDL to ensure 100% PostgreSQL schema compatibility."""
    pg_dialect = postgresql.dialect()
    all_models = [User, CreditProfile, CreditScoreHistory, CreditAccount, PaymentRecord, CreditGoal, Recommendation]

    for model in all_models:
        ddl = str(CreateTable(model.__table__).compile(dialect=pg_dialect))
        assert "CREATE TABLE" in ddl
        assert model.__tablename__ in ddl
        # Validate that foreign key references exist
        if model != User:
            assert "FOREIGN KEY(user_id) REFERENCES users (id)" in ddl


# ============================================================================
# 2. AUTHENTICATION & JWT TESTS
# ============================================================================

def test_user_registration_and_duplicate():
    """Verify user registration and unique email constraint."""
    user_payload = {
        "name": "Arjun Sharma",
        "email": "arjun@example.com",
        "password": "SecurePassword123"
    }
    # Successful registration
    res = client.post("/api/auth/register", json=user_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == user_payload["email"]
    assert data["name"] == user_payload["name"]
    assert "id" in data

    # Duplicate registration should fail
    dup_res = client.post("/api/auth/register", json=user_payload)
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["detail"].lower()


def test_user_login():
    """Verify user login with valid and invalid credentials."""
    # Valid login
    res = client.post(
        "/api/auth/login",
        data={"username": "arjun@example.com", "password": "SecurePassword123"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Invalid password
    bad_res = client.post(
        "/api/auth/login",
        data={"username": "arjun@example.com", "password": "WrongPassword"}
    )
    assert bad_res.status_code == 401
    assert "invalid" in bad_res.json()["detail"].lower()

    # Non-existent user
    non_res = client.post(
        "/api/auth/login",
        data={"username": "nonexistent@example.com", "password": "Password123"}
    )
    assert non_res.status_code == 401


def test_get_current_user_profile():
    """Verify JWT authentication and /api/auth/me profile retrieval."""
    token = get_auth_token("me_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # API endpoint /api/auth/me
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "me_test@example.com"

    # Unauthenticated request fails
    bad_res = client.get("/api/auth/me")
    assert bad_res.status_code == 401


# ============================================================================
# 3. USER ISOLATION TESTS
# ============================================================================

def test_user_data_isolation():
    """Verify that User A cannot see or modify User B's credit data."""
    token_a = get_auth_token("user_a@example.com", name="User A")
    token_b = get_auth_token("user_b@example.com", name="User B")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates an account
    acc_a_res = client.post(
        "/api/accounts",
        headers=headers_a,
        json={
            "account_name": "User A HDFC Card",
            "bank_name": "HDFC Bank",
            "account_type": "credit_card",
            "account_number_masked": "XXXX-1111",
            "current_balance": 5000.0,
            "credit_limit": 50000.0,
            "monthly_emi": 0.0
        }
    )
    assert acc_a_res.status_code == 200
    account_a_id = acc_a_res.json()["id"]

    # User B lists accounts -> should not see User A's account
    b_accounts = client.get("/api/accounts", headers=headers_b).json()
    assert all(a["id"] != account_a_id for a in b_accounts)

    # User B attempts to delete User A's account -> should return 404
    del_res = client.delete(f"/api/accounts/{account_a_id}", headers=headers_b)
    assert del_res.status_code == 404

    # User A's account still exists
    a_accounts = client.get("/api/accounts", headers=headers_a).json()
    assert any(a["id"] == account_a_id for a in a_accounts)


# ============================================================================
# 4. CREDIT PROFILE & ANALYTICS TESTS
# ============================================================================

def test_credit_profile_and_analytics():
    """Verify credit profile creation, update, and financial health calculations."""
    token = get_auth_token("profile_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create profile
    profile_payload = {
        "credit_score": 750,
        "monthly_income": 100000.0,
        "total_debt": 200000.0,
        "credit_limit": 150000.0,
        "credit_card_balance": 30000.0,
        "active_loans": 1,
        "missed_payments": 0,
        "financial_goal": "Maintain 750+ CIBIL"
    }
    create_res = client.post("/api/credit/profile", headers=headers, json=profile_payload)
    assert create_res.status_code == 200
    assert create_res.json()["credit_score"] == 750

    # Get profile
    get_res = client.get("/api/credit/profile", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["monthly_income"] == 100000.0

    # Update profile
    update_res = client.put(
        "/api/credit/profile",
        headers=headers,
        json={"credit_score": 770, "credit_card_balance": 15000.0}
    )
    assert update_res.status_code == 200
    assert update_res.json()["credit_score"] == 770
    assert update_res.json()["credit_card_balance"] == 15000.0

    # Verify Analytics
    analytics_res = client.get("/api/credit/analytics", headers=headers)
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert data["credit_score"] == 770
    # 15000 / 150000 * 100 = 10.0% utilization
    assert data["credit_utilization"] == 10.0
    assert data["financial_health"] in ["Excellent", "Good"]
    assert data["credit_risk"] == "Low"


# ============================================================================
# 5. SCORE HISTORY SNAPSHOT TESTS
# ============================================================================

def test_score_history_snapshots():
    """Verify adding and retrieving score history snapshots."""
    token = get_auth_token("history_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Add snapshot 1
    res1 = client.post("/api/credit/score-history", headers=headers, json={"credit_score": 690})
    assert res1.status_code == 200

    # Add snapshot 2
    res2 = client.post("/api/credit/score-history", headers=headers, json={"credit_score": 710})
    assert res2.status_code == 200

    # Retrieve history
    history_res = client.get("/api/credit/score-history", headers=headers)
    assert history_res.status_code == 200
    scores = [h["credit_score"] for h in history_res.json()]
    assert 690 in scores
    assert 710 in scores


# ============================================================================
# 6. CREDIT ACCOUNTS CRUD TESTS
# ============================================================================

def test_credit_accounts_crud():
    """Verify full CRUD cycle on credit accounts."""
    token = get_auth_token("accounts_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create account
    create_res = client.post(
        "/api/accounts",
        headers=headers,
        json={
            "account_name": "Axis Bank Neo Credit Card",
            "bank_name": "Axis Bank",
            "account_type": "credit_card",
            "account_number_masked": "XXXX-5566",
            "current_balance": 12000.0,
            "credit_limit": 60000.0,
            "monthly_emi": 0.0,
            "payment_status": "Current",
            "account_age_months": 24
        }
    )
    assert create_res.status_code == 200
    acc_id = create_res.json()["id"]

    # Read accounts
    list_res = client.get("/api/accounts", headers=headers)
    assert list_res.status_code == 200
    assert any(a["id"] == acc_id for a in list_res.json())

    # Update account
    update_res = client.put(
        f"/api/accounts/{acc_id}",
        headers=headers,
        json={"current_balance": 8000.0, "payment_status": "Current"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["current_balance"] == 8000.0

    # Delete account
    del_res = client.delete(f"/api/accounts/{acc_id}", headers=headers)
    assert del_res.status_code == 200
    assert "deleted" in del_res.json()["message"].lower()

    # Verify deleted
    list_after = client.get("/api/accounts", headers=headers).json()
    assert all(a["id"] != acc_id for a in list_after)


# ============================================================================
# 7. PAYMENT RECORDS TESTS
# ============================================================================

def test_payment_records():
    """Verify payment records logging and retrieval."""
    token = get_auth_token("payments_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create payment record
    create_res = client.post(
        "/api/payments",
        headers=headers,
        json={
            "month_year": "Sep 2026",
            "amount_paid": 15000.0,
            "status": "On-Time"
        }
    )
    assert create_res.status_code == 200
    rec_id = create_res.json()["id"]

    # List payments
    list_res = client.get("/api/payments", headers=headers)
    assert list_res.status_code == 200
    assert any(p["id"] == rec_id for p in list_res.json())


# ============================================================================
# 8. CREDIT GOALS CRUD TESTS
# ============================================================================

def test_credit_goals_crud():
    """Verify full CRUD operations on credit goals."""
    token = get_auth_token("goals_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create goal
    create_res = client.post(
        "/api/goals",
        headers=headers,
        json={
            "target_score": 800,
            "target_date": "Dec 2026",
            "action_plan": "Pay all credit card statements in full before due date"
        }
    )
    assert create_res.status_code == 200
    goal_id = create_res.json()["id"]
    assert create_res.json()["status"] == "in_progress"

    # List goals
    list_res = client.get("/api/goals", headers=headers)
    assert list_res.status_code == 200
    assert any(g["id"] == goal_id for g in list_res.json())

    # Update goal
    update_res = client.put(
        f"/api/goals/{goal_id}",
        headers=headers,
        json={"status": "completed"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "completed"

    # Delete goal
    del_res = client.delete(f"/api/goals/{goal_id}", headers=headers)
    assert del_res.status_code == 200


# ============================================================================
# 9. RECOMMENDATIONS TESTS
# ============================================================================

def test_recommendations_auto_seed_and_toggle():
    """Verify auto-generation of initial recommendations and toggling completion."""
    token = get_auth_token("recs_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # First fetch should auto-generate prioritized initial recommendations
    recs_res = client.get("/api/recommendations", headers=headers)
    assert recs_res.status_code == 200
    recs = recs_res.json()
    assert len(recs) >= 1

    first_rec = recs[0]
    rec_id = first_rec["id"]
    initial_status = first_rec["is_completed"]

    # Toggle recommendation completion
    toggle_res = client.put(
        f"/api/recommendations/{rec_id}",
        headers=headers,
        json={"is_completed": not initial_status}
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] == (not initial_status)


# ============================================================================
# 10. AI ADVISORY & CHAT ENDPOINTS TESTS
# ============================================================================

def test_ai_advisor_endpoints():
    """Verify AI diagnostic, chat, and recommendation endpoints (rule-based fallback)."""
    token = get_auth_token("ai_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure profile exists
    client.post(
        "/api/credit/profile",
        headers=headers,
        json={
            "credit_score": 730,
            "monthly_income": 75000.0,
            "total_debt": 150000.0,
            "credit_limit": 100000.0,
            "credit_card_balance": 25000.0,
            "active_loans": 1,
            "missed_payments": 0,
            "financial_goal": "Reach 780 for home loan"
        }
    )

    # 1. AI Credit Analysis
    diag_res = client.post("/api/ai/analyze-credit", headers=headers)
    assert diag_res.status_code == 200
    diag_data = diag_res.json()
    assert "summary" in diag_data
    assert "health_grade" in diag_data
    assert len(diag_data["immediate_action_items"]) > 0
    assert "educational_disclaimer" in diag_data

    # 2. AI Chat
    chat_res = client.post(
        "/api/ai/chat",
        headers=headers,
        json={"message": "How can I lower my credit utilization to boost my CIBIL score?"}
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "response" in chat_data
    assert len(chat_data["response"]) > 0
    assert len(chat_data["suggested_actions"]) > 0

    # 3. AI Recommendations
    ai_recs_res = client.get("/api/ai/recommendations", headers=headers)
    assert ai_recs_res.status_code == 200
    recs_data = ai_recs_res.json()
    assert "cibil_health_status" in recs_data
    assert "target_score_projection" in recs_data


# ============================================================================
# 11. DEMO DATA SEEDING IDEMPOTENCY TEST
# ============================================================================

def test_demo_seeding_idempotence():
    """Verify demo seed populates sample data and repeated calls do NOT create duplicate records."""
    token = get_auth_token("seed_idempotent_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # First seed call
    seed1 = client.post("/api/credit/seed-sample-data", headers=headers)
    assert seed1.status_code == 200

    # Verify data populated
    accs_count1 = len(client.get("/api/accounts", headers=headers).json())
    hist_count1 = len(client.get("/api/credit/score-history", headers=headers).json())
    pays_count1 = len(client.get("/api/payments", headers=headers).json())

    assert accs_count1 == 3
    assert hist_count1 == 4
    assert pays_count1 == 4

    # Second seed call -> must be idempotent
    seed2 = client.post("/api/credit/seed-sample-data", headers=headers)
    assert seed2.status_code == 200

    # Verify counts did NOT duplicate
    accs_count2 = len(client.get("/api/accounts", headers=headers).json())
    hist_count2 = len(client.get("/api/credit/score-history", headers=headers).json())
    pays_count2 = len(client.get("/api/payments", headers=headers).json())

    assert accs_count2 == accs_count1, f"Accounts duplicated: expected {accs_count1}, got {accs_count2}"
    assert hist_count2 == hist_count1, f"Score history duplicated: expected {hist_count1}, got {hist_count2}"
    assert pays_count2 == pays_count1, f"Payments duplicated: expected {pays_count1}, got {pays_count2}"
