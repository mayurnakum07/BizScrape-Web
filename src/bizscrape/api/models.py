"""Pydantic request/response models for the BizScrape API."""

from __future__ import annotations

import re
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from bizscrape.api.settings import get_settings
from bizscrape.api.validation import normalize_user_text

SourceId = Literal["gmaps"]
JobStatus = Literal[
    "queued",
    "starting",
    "running",
    "cancelling",
    "cancelled",
    "completed",
    "failed",
]
PipelineStage = Literal[
    "discover",
    "website_lookup",
    "enrich",
    "deduplicate",
    "export",
]
StageStatus = Literal["pending", "active", "completed", "failed", "skipped"]


class CreateJobRequest(BaseModel):
    businessType: str = Field(..., min_length=1, max_length=120)
    country: str = Field(default="", max_length=80)
    state: str = Field(default="", max_length=80)
    city: str = Field(..., min_length=1, max_length=80)
    area: str | None = Field(default=None, max_length=120)
    target: int
    sources: list[SourceId] = Field(default_factory=lambda: ["gmaps"])
    searchAllLocalities: bool = False

    @field_validator("businessType", "city", "country", "state", mode="before")
    @classmethod
    def strip_required(cls, value: Any) -> Any:
        if isinstance(value, str):
            return normalize_user_text(value)
        return value

    @field_validator("area", mode="before")
    @classmethod
    def normalize_area(cls, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return None
            return normalize_user_text(stripped)
        return value

    @field_validator("sources", mode="before")
    @classmethod
    def normalize_sources(cls, value: Any) -> Any:
        if value is None:
            return ["gmaps"]
        if isinstance(value, str):
            value = [value]
        if not isinstance(value, list):
            return value
        cleaned: list[str] = []
        for item in value:
            if isinstance(item, str):
                part = item.strip().lower()
                if part:
                    cleaned.append(part)
            else:
                cleaned.append(item)
        return cleaned

    @field_validator("target")
    @classmethod
    def validate_target(cls, value: int) -> int:
        settings = get_settings()
        if value < settings.min_api_target:
            raise ValueError(f"target must be at least {settings.min_api_target}")
        if value > settings.max_api_target:
            raise ValueError(f"target must be at most {settings.max_api_target}")
        return value

    @model_validator(mode="after")
    def require_sources(self) -> CreateJobRequest:
        if not self.sources:
            raise ValueError("at least one source is required")
        if any(source != "gmaps" for source in self.sources):
            raise ValueError("only source 'gmaps' (Google Maps) is supported")
        # Normalize duplicates - discovery is Google Maps only.
        self.sources = ["gmaps"]
        return self


class CreateJobResponse(BaseModel):
    jobId: str


class JobErrorModel(BaseModel):
    code: str
    message: str
    stage: PipelineStage | None = None
    retryable: bool = False
    details: dict[str, Any] | None = None


class JobStatsModel(BaseModel):
    businessesFound: int = 0
    localMatches: int = 0
    websitesResolved: int = 0
    emailsFound: int = 0
    phonesFound: int = 0
    duplicatesRemoved: int = 0


class JobProgressModel(BaseModel):
    mode: Literal["percent", "indeterminate", "stage"] = "stage"
    percent: float | None = None
    stageIndex: int = 0
    stageCount: int = 5


class JobActivityEntry(BaseModel):
    id: str
    timestamp: str
    stage: PipelineStage | None = None
    message: str


class JobConfigModel(BaseModel):
    businessType: str
    country: str = ""
    state: str = ""
    city: str
    area: str | None = None
    target: int
    sources: list[str]
    searchAllLocalities: bool = False


class JobSnapshotResponse(BaseModel):
    """Mirrors the frontend ScrapeJobSnapshot shape (camelCase)."""

    id: str
    provider: Literal["remote"] = "remote"
    config: JobConfigModel
    status: JobStatus
    connection: Literal[
        "connected", "interrupted", "reconnecting", "offline"
    ] = "connected"
    currentStage: PipelineStage | None = None
    stages: dict[str, StageStatus]
    progress: JobProgressModel
    targetProgress: dict[str, int]
    stats: JobStatsModel
    activity: list[JobActivityEntry]
    operationMessage: str
    csvReady: bool = False
    partialResults: bool = False
    retryCount: int = 0
    retryOfJobId: str | None = None
    error: JobErrorModel | None = None
    createdAt: str
    updatedAt: str


class BusinessRecordModel(BaseModel):
    id: str
    company_name: str = ""
    website: str = ""
    email_primary: str = ""
    emails_all: str = ""
    phone_primary: str = ""
    phones_all: str = ""
    address: str = ""
    area: str = ""
    category: str = ""
    rating: str = ""
    review_count: str = ""
    linkedin: str = ""
    facebook: str = ""
    instagram: str = ""
    sources: str = ""
    maps_url: str = ""
    first_seen: str = ""
    last_enriched: str = ""


class ResultSummaryModel(BaseModel):
    businesses: int = 0
    websites: int = 0
    emails: int = 0
    phones: int = 0
    duplicates: int = 0


class JobResultsResponse(BaseModel):
    jobId: str
    status: Literal["idle", "collecting", "ready", "empty"]
    records: list[BusinessRecordModel]
    summary: ResultSummaryModel
    duplicatesRemoved: int = 0
    updatedAt: str
    csvAvailable: bool = False


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


class ReadinessResponse(BaseModel):
    status: Literal["ok", "degraded"] = "ok"
    checks: dict[str, str]


class ApiErrorBody(BaseModel):
    code: str
    message: str
    stage: PipelineStage | None = None
    retryable: bool = False
    details: dict[str, Any] | None = None
    requestId: str | None = None


class RetryJobResponse(BaseModel):
    jobId: str
    retryOfJobId: str
    retryCount: int


_SAFE_FILENAME = re.compile(r"[^a-zA-Z0-9._-]+")


def sanitize_download_name(name: str) -> str:
    cleaned = _SAFE_FILENAME.sub("_", name.strip())[:80]
    return cleaned or "bizscrape-export.csv"
