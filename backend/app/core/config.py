import re

from pydantic_settings import BaseSettings
from pydantic import Field, computed_field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    APP_NAME: str = Field(
        default="AI Cyber Crime Assistance Platform",
        description="Name of the application",
    )
    APP_VERSION: str = Field(
        default="1.0.0",
        description="Current application version",
    )
    ENVIRONMENT: str = Field(
        default="development",
        description="Deployment environment (development, staging, production)",
    )
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/cybercrime_db",
        description="PostgreSQL connection string",
    )
    FRONTEND_URL: str = Field(
        default="http://localhost:3000",
        description="Frontend origin URL for CORS",
    )

    # ------------------------------------------------------------------
    # Computed helpers
    # ------------------------------------------------------------------

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlalchemy_database_url(self) -> str:
        """Return the DATABASE_URL with the ``postgresql+psycopg2://`` dialect.

        Supabase connection strings typically use ``postgresql://`` which
        SQLAlchemy accepts, but being explicit about the driver avoids
        ambiguity and ensures psycopg2 is always selected.
        """
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url_safe(self) -> str:
        """Return the DATABASE_URL with the password masked for safe logging."""
        return re.sub(
            r"(://[^:]+:)([^@]+)(@)",
            r"\1********\3",
            self.DATABASE_URL,
        )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


# Singleton settings instance used across the application
settings = Settings()
