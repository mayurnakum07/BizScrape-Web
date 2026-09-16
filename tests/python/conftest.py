"""Shared pytest fixtures."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from bizscrape.api.app import create_app
from bizscrape.api.deps import set_job_manager
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.rate_limit import reset_rate_limiter
from bizscrape.api.settings import reset_settings_cache
from tests.python.helpers import instant_scrape_factory, make_settings


@pytest.fixture
def fixtures_dir() -> Path:
    return Path(__file__).parent / "fixtures"


@pytest.fixture
def tmp_csv(tmp_path: Path) -> Path:
    return tmp_path / "companies.csv"


@pytest.fixture
def api_client(tmp_path) -> Iterator[TestClient]:
    """FastAPI test client with a deterministic fake scraper."""
    reset_settings_cache()
    reset_rate_limiter()
    settings = make_settings(job_data_dir=str(tmp_path / "jobs"))
    manager = JobManager(settings=settings, run_scrape_fn=instant_scrape_factory())
    set_job_manager(manager)
    with TestClient(create_app()) as client:
        yield client
    set_job_manager(None)
    reset_settings_cache()
    reset_rate_limiter()
