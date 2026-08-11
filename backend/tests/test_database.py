"""Database connection tests.

These are **integration tests** that require a live Supabase PostgreSQL
connection.  They are marked with ``@pytest.mark.integration`` so you
can exclude them during fast local iteration::

    # Run only unit tests (skip integration)
    python -m pytest tests/ -v -m "not integration"

    # Run only integration tests (requires real DB)
    python -m pytest tests/ -v -m "integration"
"""

import pytest
from sqlalchemy import text

from app.core.database import get_db


@pytest.mark.integration
def test_database_connection():
    """Verify that SQLAlchemy can connect to Supabase PostgreSQL and execute SELECT 1."""
    db = next(get_db())
    try:
        result = db.execute(text("SELECT 1"))
        value = result.scalar()
        assert value == 1, f"Expected 1, got {value}"
    finally:
        db.close()


@pytest.mark.integration
def test_database_version():
    """Verify that the connected database is PostgreSQL by checking version()."""
    db = next(get_db())
    try:
        result = db.execute(text("SELECT version()"))
        version_string = result.scalar()
        assert "PostgreSQL" in version_string, (
            f"Expected PostgreSQL, got: {version_string}"
        )
    finally:
        db.close()
