import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app

EXPECTED_RESPONSE = {
    "status": "ok",
    "service": "AI Cyber Crime Assistance Platform",
    "version": "1.0.0",
}


@pytest.mark.anyio
async def test_root_health():
    """GET /health should return the expected health payload."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == EXPECTED_RESPONSE


@pytest.mark.anyio
async def test_versioned_health():
    """GET /api/v1/health should return the same health payload."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == EXPECTED_RESPONSE


@pytest.mark.anyio
@pytest.mark.integration
async def test_db_health():
    """GET /api/v1/health/db should confirm database connectivity."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health/db")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"

