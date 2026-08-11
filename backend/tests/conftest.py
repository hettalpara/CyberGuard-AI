"""Pytest configuration — shared fixtures, markers, and settings."""

import pytest


def pytest_configure(config: pytest.Config) -> None:
    """Register custom markers."""
    config.addinivalue_line(
        "markers",
        "integration: marks tests that require a live database connection "
        "(deselect with '-m \"not integration\"')",
    )
