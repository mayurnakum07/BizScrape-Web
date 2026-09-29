"""FastAPI application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from bizscrape.api.deps import get_job_manager
from bizscrape.api.job_storage import cleanup_stale_job_dirs, ensure_job_data_dir
from bizscrape.api.errors import (
    ApiError,
    RequestIdMiddleware,
    api_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from bizscrape.api.middleware import RequestSizeLimitMiddleware, SecurityHeadersMiddleware
from bizscrape.api.routes import events, health, jobs
from bizscrape.api.settings import get_settings


def configure_logging() -> None:
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.log_level, logging.INFO),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    settings = get_settings()
    ensure_job_data_dir(settings)
    removed = cleanup_stale_job_dirs(settings)
    logging.getLogger("bizscrape.api").info(
        "api_started host=%s port=%s debug=%s stale_dirs_removed=%s",
        settings.host,
        settings.port,
        settings.debug,
        removed,
    )
    yield
    await get_job_manager().shutdown()
    logging.getLogger("bizscrape.api").info("api_stopped")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="BizScrape API",
        description=(
            "HTTP API for BizScrape scrape jobs. "
            "Uses the same Python engine as the CLI - not a shell wrapper. "
            "Live progress is delivered via SSE at GET /jobs/{id}/events."
        ),
        version="0.1.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestSizeLimitMiddleware)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=[
            "Content-Type",
            "Accept",
            "Last-Event-ID",
            "X-Request-ID",
        ],
        expose_headers=["X-Request-ID"],
    )

    app.add_exception_handler(ApiError, api_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, object]:
        """Browser-friendly landing for the API process (not the Next.js UI)."""
        return {
            "service": "BizScrape API",
            "status": "ok",
            "message": "This is the scrape API, not the web UI.",
            "ui": "http://localhost:3000",
            "health": "/health",
            "ready": "/health/ready",
            "jobs": "/jobs",
            "docs": "/docs" if settings.debug else None,
        }

    app.include_router(health.router)
    app.include_router(jobs.router)
    app.include_router(events.router)
    return app


app = create_app()
