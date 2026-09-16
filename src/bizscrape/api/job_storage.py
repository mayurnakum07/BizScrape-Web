"""On-disk job output helpers (CSV directories under JOB_DATA_DIR)."""

from __future__ import annotations

import logging
import shutil
import time
from pathlib import Path

from bizscrape.api.settings import Settings

logger = logging.getLogger("bizscrape.api.storage")


def ensure_job_data_dir(settings: Settings) -> None:
    """Create the job data root if missing."""
    Path(settings.job_data_dir).mkdir(parents=True, exist_ok=True)


def cleanup_stale_job_dirs(settings: Settings) -> int:
    """
    Remove old per-job directories under JOB_DATA_DIR.

    Retention is controlled by JOB_DATA_RETENTION_HOURS (0 disables cleanup).
    Only directories whose names look like UUID folders are considered.
    Active in-memory jobs are never deleted even if their directory is old.
    """
    retention_hours = settings.job_data_retention_hours
    if retention_hours <= 0:
        return 0

    root = Path(settings.job_data_dir)
    if not root.is_dir():
        return 0

    cutoff = time.time() - (retention_hours * 3600)
    removed = 0
    for entry in root.iterdir():
        if not entry.is_dir():
            continue
        try:
            mtime = entry.stat().st_mtime
        except OSError:
            continue
        if mtime >= cutoff:
            continue
        try:
            shutil.rmtree(entry)
            removed += 1
            logger.info("job_dir_removed path=%s age_hours=%.1f", entry, (time.time() - mtime) / 3600)
        except OSError as exc:
            logger.warning("job_dir_remove_failed path=%s error=%s", entry, exc)
    if removed:
        logger.info("job_dir_cleanup removed=%s retention_hours=%s", removed, retention_hours)
    return removed
