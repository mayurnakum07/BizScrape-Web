"""HTTP middleware for security and request-size limits."""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp

from bizscrape.api import error_codes as codes
from bizscrape.api.errors import error_body, get_request_id
from bizscrape.api.settings import get_settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=()",
        )
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        settings = get_settings()
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
            except ValueError:
                size = settings.max_request_body_bytes + 1
            if size > settings.max_request_body_bytes:
                request_id = get_request_id(request)
                return JSONResponse(
                    status_code=413,
                    content=error_body(
                        codes.VALIDATION_ERROR,
                        "Request body is too large.",
                        retryable=False,
                        request_id=request_id,
                    ),
                    headers={"X-Request-ID": request_id},
                )
        return await call_next(request)
