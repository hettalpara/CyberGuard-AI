# Backend — AI Cyber Crime Assistance Platform

> FastAPI + SQLAlchemy + Pydantic + PostgreSQL + Alembic

## Setup

```bash
python -m venv venv
venv\Scripts\activate          # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Directory Structure

```
app/
├── api/
│   └── v1/
│       ├── endpoints/         # Route handlers (controllers)
│       ├── dependencies/      # Dependency injection providers
│       └── router.py          # API v1 router aggregator
│
├── core/                      # Application configuration
│   ├── config.py              # Settings (from .env via Pydantic)
│   ├── security.py            # Password hashing, token utilities
│   └── constants.py           # Application-wide constants
│
├── models/                    # SQLAlchemy ORM models
├── schemas/                   # Pydantic request/response schemas
│
├── services/                  # Business logic layer
│   ├── ai/                    # Gemini AI integration services
│   └── cybersecurity/         # Safe Browsing, VirusTotal, WHOIS
│
├── repositories/              # Data access layer (CRUD operations)
│
├── database/                  # Database connection & migrations
│   ├── session.py             # AsyncSession factory
│   ├── base.py                # Declarative base for models
│   └── migrations/            # Alembic migration scripts
│       └── versions/          # Individual migration files
│
├── middleware/                # Custom middleware (logging, rate-limit)
├── auth/                      # JWT auth logic, guards, permissions
├── utils/                     # Shared helpers and utilities
└── main.py                    # FastAPI application entry point

tests/
├── unit/                      # Unit tests
├── integration/               # Integration tests
├── e2e/                       # End-to-end API tests
├── fixtures/                  # Shared test fixtures
└── conftest.py                # Pytest configuration
```

## Scripts

| Command | Description |
|---|---|
| `uvicorn app.main:app --reload` | Start dev server |
| `pytest tests/ -v` | Run all tests |
| `alembic upgrade head` | Apply migrations |
| `alembic revision --autogenerate -m "msg"` | Create migration |
| `ruff check .` | Lint check |
