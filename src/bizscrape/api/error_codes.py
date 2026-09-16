"""Controlled error codes for the BizScrape API and job layer."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from bizscrape.errors import EnrichmentError, ProviderError, StorageError, UsageError

# --- Codes (only those with real conditions today) ---

INVALID_CONFIGURATION = "INVALID_CONFIGURATION"
VALIDATION_ERROR = "VALIDATION_ERROR"
INVALID_JOB_ID = "INVALID_JOB_ID"
JOB_NOT_FOUND = "JOB_NOT_FOUND"
JOB_CAPACITY = "JOB_CAPACITY"
JOB_NOT_RETRYABLE = "JOB_NOT_RETRYABLE"
JOB_RETRY_LIMIT = "JOB_RETRY_LIMIT"
JOB_ALREADY_TERMINAL = "JOB_ALREADY_TERMINAL"
JOB_CANCEL_IN_PROGRESS = "JOB_CANCEL_IN_PROGRESS"
SCRAPER_START_FAILED = "SCRAPER_START_FAILED"
BROWSER_START_FAILED = "BROWSER_START_FAILED"
SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"
SOURCE_BLOCKED = "SOURCE_BLOCKED"
RATE_LIMITED = "RATE_LIMITED"
WEBSITE_LOOKUP_FAILED = "WEBSITE_LOOKUP_FAILED"
ENRICHMENT_FAILED = "ENRICHMENT_FAILED"
EXPORT_FAILED = "EXPORT_FAILED"
CSV_NOT_READY = "CSV_NOT_READY"
CSV_UNAVAILABLE = "CSV_UNAVAILABLE"
SCRAPE_FAILED = "SCRAPE_FAILED"
INTERNAL_ERROR = "INTERNAL_ERROR"
SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"


@dataclass(frozen=True)
class ClassifiedError:
    code: str
    message: str
    status_code: int
    retryable: bool
    stage: str | None = None


_USER_MESSAGES: dict[str, str] = {
    INVALID_CONFIGURATION: "The scrape configuration is not valid.",
    VALIDATION_ERROR: "Request validation failed.",
    INVALID_JOB_ID: "Job ID is not valid.",
    JOB_NOT_FOUND: "Job not found.",
    JOB_CAPACITY: "Too many scrape jobs are already running or queued. Try again later.",
    JOB_NOT_RETRYABLE: "This job cannot be retried.",
    JOB_RETRY_LIMIT: "This job has reached the maximum number of retries.",
    JOB_ALREADY_TERMINAL: "This job has already finished.",
    JOB_CANCEL_IN_PROGRESS: "Cancellation is already in progress.",
    SCRAPER_START_FAILED: "The scraper could not start.",
    BROWSER_START_FAILED: "The browser automation environment could not be initialized.",
    SOURCE_UNAVAILABLE: "The configured source could not be accessed.",
    SOURCE_BLOCKED: "The selected source did not allow this request to continue.",
    RATE_LIMITED: "BizScrape has been rate limited while collecting data.",
    WEBSITE_LOOKUP_FAILED: "Website lookup could not be completed.",
    ENRICHMENT_FAILED: "Some enrichment could not be completed.",
    EXPORT_FAILED: "The CSV could not be generated.",
    CSV_NOT_READY: "CSV is not ready yet.",
    CSV_UNAVAILABLE: "Result file is unavailable.",
    SCRAPE_FAILED: "Scraping failed. Check the server logs for details.",
    INTERNAL_ERROR: "An unexpected server error occurred.",
    SERVICE_UNAVAILABLE: "The scraping service is temporarily unavailable.",
}


def user_message(code: str, fallback: str | None = None) -> str:
    return _USER_MESSAGES.get(code, fallback or _USER_MESSAGES[INTERNAL_ERROR])


def classify_exception(
    exc: BaseException,
    *,
    stage: str | None = None,
) -> ClassifiedError:
    """Map an exception to a safe, user-facing classified error."""
    text = str(exc).lower()
    name = type(exc).__name__

    if isinstance(exc, UsageError):
        return ClassifiedError(
            INVALID_CONFIGURATION,
            user_message(INVALID_CONFIGURATION),
            400,
            False,
            stage,
        )

    if isinstance(exc, StorageError):
        return ClassifiedError(
            EXPORT_FAILED,
            user_message(EXPORT_FAILED),
            500,
            True,
            stage or "export",
        )

    if isinstance(exc, EnrichmentError):
        return ClassifiedError(
            ENRICHMENT_FAILED,
            user_message(ENRICHMENT_FAILED),
            500,
            True,
            stage or "enrich",
        )

    if isinstance(exc, ProviderError):
        code = SOURCE_UNAVAILABLE
        if "rate" in text or "429" in text or "too many" in text:
            code = RATE_LIMITED
        elif "captcha" in text or "blocked" in text or "denied" in text:
            code = SOURCE_BLOCKED
        return ClassifiedError(
            code,
            user_message(code),
            429 if code == RATE_LIMITED else 502,
            code in {RATE_LIMITED, SOURCE_UNAVAILABLE},
            stage or "discover",
        )

    # Browser launch failures from browser.py raise RuntimeError with INSTALL_HINT.
    if "no usable browser" in text or "playwright install" in text:
        return ClassifiedError(
            BROWSER_START_FAILED,
            user_message(BROWSER_START_FAILED),
            503,
            True,
            stage or "discover",
        )

    if name in {"TimeoutError", "PlaywrightTimeout"} or "timeout" in text:
        code = SOURCE_UNAVAILABLE
        if stage == "website_lookup":
            code = WEBSITE_LOOKUP_FAILED
        elif stage == "enrich":
            code = ENRICHMENT_FAILED
        return ClassifiedError(
            code,
            user_message(code),
            504,
            True,
            stage,
        )

    if "rate" in text or "429" in text:
        return ClassifiedError(
            RATE_LIMITED,
            user_message(RATE_LIMITED),
            429,
            True,
            stage,
        )

    if "captcha" in text or "blocked" in text or "access denied" in text:
        return ClassifiedError(
            SOURCE_BLOCKED,
            user_message(SOURCE_BLOCKED),
            403,
            False,
            stage,
        )

    if stage == "website_lookup":
        return ClassifiedError(
            WEBSITE_LOOKUP_FAILED,
            user_message(WEBSITE_LOOKUP_FAILED),
            500,
            True,
            stage,
        )

    if stage == "enrich":
        return ClassifiedError(
            ENRICHMENT_FAILED,
            user_message(ENRICHMENT_FAILED),
            500,
            True,
            stage,
        )

    if stage == "export":
        return ClassifiedError(
            EXPORT_FAILED,
            user_message(EXPORT_FAILED),
            500,
            True,
            stage,
        )

    if stage is None or stage == "discover":
        # Startup vs mid-discovery: treat early failures as start/source issues.
        if "launch" in text or "browser" in text:
            return ClassifiedError(
                BROWSER_START_FAILED,
                user_message(BROWSER_START_FAILED),
                503,
                True,
                stage or "discover",
            )
        return ClassifiedError(
            SOURCE_UNAVAILABLE,
            user_message(SOURCE_UNAVAILABLE),
            502,
            True,
            stage or "discover",
        )

    return ClassifiedError(
        SCRAPE_FAILED,
        user_message(SCRAPE_FAILED),
        500,
        True,
        stage,
    )


def classified_to_dict(
    classified: ClassifiedError,
    *,
    job_id: str | None = None,
    request_id: str | None = None,
    partial: bool = False,
    records_collected: int | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "code": classified.code,
        "message": classified.message,
        "retryable": classified.retryable,
    }
    if classified.stage:
        payload["stage"] = classified.stage
    details: dict[str, Any] = {}
    if job_id:
        details["jobId"] = job_id
    if request_id:
        details["requestId"] = request_id
    if partial:
        details["partial"] = True
    if records_collected is not None:
        details["recordsCollected"] = records_collected
    if details:
        payload["details"] = details
    return payload
