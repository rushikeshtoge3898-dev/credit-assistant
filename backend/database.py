import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

raw_db_url = (os.getenv("DATABASE_URL") or "").strip().strip("'\"")

if not raw_db_url:
    DATABASE_URL = "sqlite:///./credit_assistant.db"
elif raw_db_url.startswith("postgres://"):
    # SQLAlchemy requires postgresql:// instead of postgres://
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = raw_db_url

# Configure database engine based on dialect
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    # Required for SQLite in multi-threaded environments like FastAPI
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production settings for PostgreSQL (e.g. Supabase, AWS RDS, Neon)
    # pool_pre_ping automatically tests connections before checkout to recycle dead connections
    # pool_recycle handles connection timeouts from transaction poolers / Supavisor
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """Dependency for obtaining database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()