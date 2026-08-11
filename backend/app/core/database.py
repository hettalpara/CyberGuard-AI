from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from typing import Generator

from app.core.config import settings

# ---------------------------------------------------------------------------
# Engine — single connection pool shared across the application
# ---------------------------------------------------------------------------
engine = create_engine(
    settings.sqlalchemy_database_url,
    pool_pre_ping=True,       # verify connections before checkout (handles stale connections)
    pool_size=5,              # default pool size
    max_overflow=10,          # additional connections beyond pool_size when needed
    echo=False,               # set True to log SQL statements during development
)

# ---------------------------------------------------------------------------
# Session factory — produces new Session instances per-request
# ---------------------------------------------------------------------------
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# ---------------------------------------------------------------------------
# Declarative Base — all ORM models will inherit from this
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models.

    Future models should subclass this, e.g.:
        class User(Base):
            __tablename__ = "users"
            ...
    """
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency — yields a DB session per request, ensures cleanup
# ---------------------------------------------------------------------------
def get_db() -> Generator:
    """Provide a transactional database session to a request.

    Usage in a route:
        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
