"""HTTP route helpers."""

from __future__ import annotations

from typing import Any

from bizscrape.api.models import (
    BusinessRecordModel,
    JobActivityEntry,
    JobConfigModel,
    JobErrorModel,
    JobProgressModel,
    JobResultsResponse,
    JobSnapshotResponse,
    JobStatsModel,
    ResultSummaryModel,
)


def to_snapshot(job: dict[str, Any]) -> JobSnapshotResponse:
    error = job.get("error")
    # JobErrorModel.details may be a dict from classification.
    error_model = None
    if error:
        details = error.get("details")
        if details is not None and not isinstance(details, dict):
            details = {"info": str(details)}
        error_model = JobErrorModel(
            code=error.get("code", "SCRAPE_FAILED"),
            message=error.get("message", "Scraping failed."),
            stage=error.get("stage"),
            retryable=bool(error.get("retryable", False)),
            details=details,
        )
    return JobSnapshotResponse(
        id=job["id"],
        provider="remote",
        config=JobConfigModel(**job["config"]),
        status=job["status"],
        connection=job.get("connection") or "connected",
        currentStage=job.get("currentStage"),
        stages=job.get("stages") or {},
        progress=JobProgressModel(**(job.get("progress") or {})),
        targetProgress=job.get("targetProgress")
        or {"collected": 0, "target": job["config"]["target"]},
        stats=JobStatsModel(**(job.get("stats") or {})),
        activity=[JobActivityEntry(**entry) for entry in job.get("activity") or []],
        operationMessage=job.get("operationMessage") or "",
        csvReady=bool(job.get("csvReady")),
        partialResults=bool(job.get("partialResults")),
        retryCount=int(job.get("retryCount") or 0),
        retryOfJobId=job.get("retryOfJobId"),
        error=error_model,
        createdAt=job["createdAt"],
        updatedAt=job["updatedAt"],
    )


def to_results(job: dict[str, Any]) -> JobResultsResponse:
    records_raw = job.get("records") or []
    records = [BusinessRecordModel(**row) for row in records_raw]
    status = job.get("status")
    stats = job.get("stats") or {}
    duplicates = int((job.get("stats") or {}).get("duplicatesRemoved") or 0)

    if status == "completed":
        collection = "ready" if records else "empty"
    elif status in ("failed", "cancelled"):
        collection = "ready" if records else "empty"
    elif status in ("queued", "starting"):
        collection = "idle"
    else:
        collection = "collecting"

    # During running jobs, prefer live engine counters when records are empty.
    if collection == "collecting" and not records:
        businesses = int(stats.get("businessesFound") or 0)
        websites = int(stats.get("websitesResolved") or 0)
        emails = int(stats.get("emailsFound") or 0)
        phones = int(stats.get("phonesFound") or 0)
    else:
        businesses = len(records)
        websites = int(stats.get("websitesResolved") or 0)
        emails = int(stats.get("emailsFound") or 0)
        phones = int(stats.get("phonesFound") or 0)
        if not websites and records:
            websites = sum(1 for r in records if (r.website or "").strip())
        if not emails and records:
            emails = sum(
                1
                for r in records
                if (r.email_primary or "").strip() or (r.emails_all or "").strip()
            )
        if not phones and records:
            phones = sum(
                1
                for r in records
                if (r.phone_primary or "").strip() or (r.phones_all or "").strip()
            )

    return JobResultsResponse(
        jobId=job["id"],
        status=collection,  # type: ignore[arg-type]
        records=records,
        summary=ResultSummaryModel(
            businesses=businesses,
            websites=websites,
            emails=emails,
            phones=phones,
            duplicates=duplicates,
        ),
        duplicatesRemoved=duplicates,
        updatedAt=job["updatedAt"],
        csvAvailable=bool(job.get("csvReady")),
    )
