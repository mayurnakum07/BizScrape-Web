"""API settings loaded from environment."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _env(name: str, default: str) -> str:
    value = os.environ.get(name)
    if value is None or not str(value).strip():
        return default
    return str(value).strip()


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or not str(raw).strip():
        return default
    try:
        return int(str(raw).strip())
    except ValueError:
        return default


def _env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None or not str(raw).strip():
        return default
    return str(raw).strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    host: str
    port: int
    allowed_origins: str
    max_concurrent_jobs: int
    max_queued_jobs: int
    min_api_target: int
    max_api_target: int
    job_data_dir: str
    log_level: str
    cancel_timeout_seconds: int
    max_job_retries: int
    sse_max_reconnect_attempts: int
    rate_limit_create_per_minute: int
    rate_limit_cancel_per_minute: int
    max_request_body_bytes: int
    job_data_retention_hours: int
    debug: bool

    @property
    def allowed_origins_list(self) -> list[str]:
        parts = [p.strip() for p in self.allowed_origins.split(",")]
        cleaned = [p for p in parts if p]
        if "*" in cleaned:
            raise ValueError(
                "ALLOWED_ORIGINS must not contain '*'. "
                "List explicit frontend origins instead."
            )
        return cleaned


@lru_cache
def get_settings() -> Settings:
    settings = Settings(
        host=_env("HOST", "127.0.0.1"),
        port=_env_int("PORT", 8000),
        allowed_origins=_env(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ),
        max_concurrent_jobs=max(1, _env_int("MAX_CONCURRENT_JOBS", 1)),
        max_queued_jobs=max(0, _env_int("MAX_QUEUED_JOBS", 5)),
        min_api_target=max(1, _env_int("MIN_API_TARGET", 1)),
        max_api_target=max(1, _env_int("MAX_API_TARGET", 500)),
        job_data_dir=_env("JOB_DATA_DIR", "data/jobs"),
        log_level=_env("LOG_LEVEL", "INFO").upper(),
        cancel_timeout_seconds=max(5, _env_int("CANCEL_TIMEOUT_SECONDS", 45)),
        max_job_retries=max(0, _env_int("MAX_JOB_RETRIES", 3)),
        sse_max_reconnect_attempts=max(1, _env_int("SSE_MAX_RECONNECT_ATTEMPTS", 8)),
        rate_limit_create_per_minute=max(0, _env_int("RATE_LIMIT_CREATE_PER_MINUTE", 10)),
        rate_limit_cancel_per_minute=max(0, _env_int("RATE_LIMIT_CANCEL_PER_MINUTE", 30)),
        max_request_body_bytes=max(1024, _env_int("MAX_REQUEST_BODY_BYTES", 65536)),
        job_data_retention_hours=max(0, _env_int("JOB_DATA_RETENTION_HOURS", 168)),
        debug=_env_bool("DEBUG", False),
    )
    if settings.min_api_target > settings.max_api_target:
        raise ValueError("MIN_API_TARGET must not exceed MAX_API_TARGET")
    # Validate CORS allow-list eagerly.
    _ = settings.allowed_origins_list
    return settings


def reset_settings_cache() -> None:
    get_settings.cache_clear()
