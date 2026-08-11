import logging

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint to verify the service is running."""
    return {
        "status": "ok",
        "service": "AI Cyber Crime Assistance Platform",
        "version": "1.0.0",
    }


@router.get("/health/db")
def health_db(db: Session = Depends(get_db)) -> dict:
    """Database health check — executes ``SELECT 1`` against Supabase PostgreSQL.

    Returns 200 on success, 503 if the database is unreachable.
    Never exposes credentials or connection strings in the response.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        # Log useful diagnostic info (no secrets)
        logger.error("Database health check failed: %s", type(exc).__name__)
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "disconnected",
                "detail": "Unable to reach the database. Please try again later.",
            },
        )
