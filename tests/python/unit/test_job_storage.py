"""Job directory cleanup tests."""

from __future__ import annotations

import time
from pathlib import Path

from bizscrape.api.job_storage import cleanup_stale_job_dirs, ensure_job_data_dir
from bizscrape.api.settings import Settings


def _settings(job_data_dir: str, retention_hours: int = 1) -> Settings:
    return Settings(
        host="127.0.0.1",
        port=8000,
        allowed_origins="http://localhost:3000",
        max_concurrent_jobs=1,
        max_queued_jobs=0,
        min_api_target=1,
        max_api_target=500,
        job_data_dir=job_data_dir,
        log_level="WARNING",
        cancel_timeout_seconds=45,
        max_job_retries=3,
        sse_max_reconnect_attempts=8,
        rate_limit_create_per_minute=0,
        rate_limit_cancel_per_minute=0,
        max_request_body_bytes=65536,
        job_data_retention_hours=retention_hours,
        debug=False,
    )


def test_ensure_job_data_dir_creates_root(tmp_path: Path) -> None:
    root = tmp_path / "jobs"
    settings = _settings(str(root))
    ensure_job_data_dir(settings)
    assert root.is_dir()


def test_cleanup_removes_old_directories(tmp_path: Path) -> None:
    root = tmp_path / "jobs"
    root.mkdir()
    stale = root / "00000000-0000-0000-0000-000000000001"
    stale.mkdir()
    old = time.time() - 7200
    import os

    os.utime(stale, (old, old))

    settings = _settings(str(root), retention_hours=1)
    removed = cleanup_stale_job_dirs(settings)
    assert removed == 1
    assert not stale.exists()


def test_cleanup_disabled_when_retention_zero(tmp_path: Path) -> None:
    root = tmp_path / "jobs"
    root.mkdir()
    stale = root / "00000000-0000-0000-0000-000000000002"
    stale.mkdir()
    settings = _settings(str(root), retention_hours=0)
    assert cleanup_stale_job_dirs(settings) == 0
    assert stale.exists()
