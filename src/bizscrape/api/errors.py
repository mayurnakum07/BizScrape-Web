"""Structured API errors with correlation IDs."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from bizscrape.api import error_codes as codes


class ApiError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        *,
        status_code: int = 400,
        stage: str | None = None,
        retryable: bool = False,
        details: dict[str, Any] | None = None,
        request_id: str | None = None,
        job_id: str | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.stage = stage
        self.retryable = retryable
        self.details = details
        self.request_id = request_id
        self.job_id = job_id


def error_body(
    code: str,
    message: str,
    *,
    stage: str | None = None,
    retryable: bool = False,
    details: dict[str, Any] | None = None,
    request_id: str | None = None,
    job_id: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "code": code,
        "message": message,
        "retryable": retryable,
    }
    if stage is not None:
        body["stage"] = stage
    merged = dict(details or {})
    if job_id:
        merged.setdefault("jobId", job_id)
    if request_id:
        merged.setdefault("requestId", request_id)
    if merged:
        body["details"] = merged
    if request_id:
        body["requestId"] = request_id
    return body


def get_request_id(request: Request) -> str:
    existing = getattr(request.state, "request_id", None)
    if isinstance(existing, str) and existing:
        return existing
    header = request.headers.get("x-request-id")
    if header and header.strip():
        return header.strip()[:64]
    return str(uuid.uuid4())


class RequestIdMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        request_id = get_request_id(request)
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    request_id = exc.request_id or get_request_id(request)
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(
            exc.code,
            exc.message,
            stage=exc.stage,
            retryable=exc.retryable,
            details=exc.details,
            request_id=request_id,
            job_id=exc.job_id,
        ),
        headers={"X-Request-ID": request_id},
    )


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    request_id = get_request_id(request)
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        body = dict(detail)
        body.setdefault("requestId", request_id)
        return JSONResponse(
            status_code=exc.status_code,
            content=body,
            headers={"X-Request-ID": request_id},
        )
    message = detail if isinstance(detail, str) else "Request failed"
    code = codes.INTERNAL_ERROR if exc.status_code >= 500 else "HTTP_ERROR"
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(code, message, request_id=request_id),
        headers={"X-Request-ID": request_id},
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    request_id = get_request_id(request)
    errors = exc.errors()
    fields: dict[str, str] = {}
    for err in errors:
        loc = err.get("loc") or ()
        parts = [str(p) for p in loc if p != "body"]
        key = ".".join(parts) if parts else "request"
        fields[key] = err.get("msg", "Invalid value")
    return JSONResponse(
        status_code=422,
        content=error_body(
            codes.VALIDATION_ERROR,
            codes.user_message(codes.VALIDATION_ERROR),
            retryable=False,
            details={"fields": fields},
            request_id=request_id,
        ),
        headers={"X-Request-ID": request_id},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Log full exception server-side; never return stack traces.
    import logging

    request_id = get_request_id(request)
    logging.getLogger("bizscrape.api").exception(
        "unhandled_error request_id=%s", request_id
    )
    return JSONResponse(
        status_code=500,
        content=error_body(
            codes.INTERNAL_ERROR,
            codes.user_message(codes.INTERNAL_ERROR),
            retryable=True,
            request_id=request_id,
        ),
        headers={"X-Request-ID": request_id},
    )
