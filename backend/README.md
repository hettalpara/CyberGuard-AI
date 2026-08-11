# AI Cyber Crime Assistance Platform — Backend

FastAPI backend for the AI Cyber Crime Assistance Platform.

## Tech Stack

- **Python 3.11+**
- **FastAPI** — async web framework
- **Uvicorn** — ASGI server
- **Pydantic v2** — data validation & settings
- **SQLAlchemy 2.0** — ORM (configured in future phases)
- **PostgreSQL** — relational database
- **Alembic** — database migrations
- **HTTPX** — async HTTP client

## Quick Start

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment variables
copy .env.example .env       # Windows
# cp .env.example .env       # macOS / Linux

# 5. Start the development server
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

| Method | Path              | Description          |
| ------ | ----------------- | -------------------- |
| GET    | `/health`         | Health check (root)  |
| GET    | `/api/v1/health`  | Health check (v1)    |
| GET    | `/docs`           | Swagger UI           |
| GET    | `/redoc`          | ReDoc documentation  |

## Running Tests

```bash
pytest -v
```

## Project Structure

```
backend/
├── app/
│   ├── api/           # Route handlers
│   ├── core/          # Configuration & shared setup
│   ├── models/        # SQLAlchemy database models
│   ├── schemas/       # Pydantic request/response schemas
│   ├── services/      # Business logic & external integrations
│   ├── utils/         # Shared utility functions
│   └── main.py        # FastAPI application entry point
├── tests/             # Pytest test suite
├── .env.example       # Environment variable template
├── requirements.txt   # Python dependencies
└── README.md
```

## Environment Variables

| Variable        | Description                        | Default                                                |
| --------------- | ---------------------------------- | ------------------------------------------------------ |
| `APP_NAME`      | Application display name           | AI Cyber Crime Assistance Platform                     |
| `APP_VERSION`   | Semantic version                   | 1.0.0                                                  |
| `ENVIRONMENT`   | Deployment environment             | development                                            |
| `DATABASE_URL`  | PostgreSQL connection string       | postgresql://postgres:postgres@localhost:5432/cybercrime_db |
| `FRONTEND_URL`  | Frontend origin for CORS           | http://localhost:3000                                   |
