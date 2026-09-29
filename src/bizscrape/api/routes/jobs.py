"""Job routes."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse

from bizscrape.api import error_codes as codes
from bizscrape.api.deps import get_job_manager, validated_job_id
from bizscrape.api.errors import ApiError
from bizscrape.api.jobs.manager import JobManager
from bizscrape.api.models import (
    CreateJobRequest,
    CreateJobResponse,
    JobResultsResponse,
    JobSnapshotResponse,
    RetryJobResponse,
    sanitize_download_name,
)
from bizscrape.api.rate_limit import enforce_rate_limit
from bizscrape.api.serializers import to_results, to_snapshot
from bizscrape.api.settings import get_settings

logger = logging.getLogger("bizscrape.api.routes.jobs")

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=CreateJobResponse, status_code=201)
async def create_job(
    request: Request,
    body: CreateJobRequest,
    manager: JobManager = Depends(get_job_manager),
) -> CreateJobResponse:
    settings = get_settings()
    enforce_rate_limit(
        request,
        route="create_job",
        limit=settings.rate_limit_create_per_minute,
    )
    job_id = manager.create_job(body)
    manager.schedule(job_id)
    return CreateJobResponse(jobId=job_id)


@router.get("/{job_id}", response_model=JobSnapshotResponse)
def get_job(
    job_id: str = Depends(validated_job_id),
    manager: JobManager = Depends(get_job_manager),
) -> JobSnapshotResponse:
    job = manager.get_job(job_id)
    if not job:
        raise ApiError(
            codes.JOB_NOT_FOUND,
            codes.user_message(codes.JOB_NOT_FOUND),
            status_code=404,
            job_id=job_id,
        )
    return to_snapshot(job)


@router.get("/{job_id}/results", response_model=JobResultsResponse)
def get_results(
    job_id: str = Depends(validated_job_id),
    manager: JobManager = Depends(get_job_manager),
) -> JobResultsResponse:
    job = manager.get_job(job_id)
    if not job:
        raise ApiError(
            codes.JOB_NOT_FOUND,
            codes.user_message(codes.JOB_NOT_FOUND),
            status_code=404,
            job_id=job_id,
        )
    return to_results(job)


@router.get("/{job_id}/result")
def get_result_file(
    job_id: str = Depends(validated_job_id),
    manager: JobManager = Depends(get_job_manager),
) -> FileResponse:
    job = manager.get_job(job_id)
    if not job:
        raise ApiError(
            codes.JOB_NOT_FOUND,
            codes.user_message(codes.JOB_NOT_FOUND),
            status_code=404,
            job_id=job_id,
        )
    if not job.get("csvReady") and not (
        job.get("partialResults") and job.get("records")
    ):
        raise ApiError(
            codes.CSV_NOT_READY,
            codes.user_message(codes.CSV_NOT_READY),
            status_code=409,
            retryable=True,
            job_id=job_id,
        )
    csv_path = job.get("csvPath") or ""
    path = Path(csv_path)
    try:
        resolved = path.resolve()
    except OSError as exc:
        raise ApiError(
            codes.CSV_UNAVAILABLE,
            codes.user_message(codes.CSV_UNAVAILABLE),
            status_code=404,
            job_id=job_id,
        ) from exc

    job_root = (Path(manager.settings.job_data_dir) / job_id).resolve()
    try:
        resolved.relative_to(job_root)
    except ValueError as exc:
        raise ApiError(
            codes.CSV_UNAVAILABLE,
            codes.user_message(codes.CSV_UNAVAILABLE),
            status_code=404,
            job_id=job_id,
        ) from exc
    if not resolved.is_file():
        # Partial results without a flushed CSV - client can still export locally.
        raise ApiError(
            codes.EXPORT_FAILED,
            codes.user_message(codes.EXPORT_FAILED),
            status_code=500,
            retryable=True,
            stage="export",
            job_id=job_id,
        )

    cfg = job["config"]
    filename = sanitize_download_name(
        f"bizscrape-{cfg.get('city', 'export')}-{cfg.get('businessType', 'data')}.csv"
    )
    logger.info("csv_download job_id=%s", job_id)
    return FileResponse(
        path=resolved,
        media_type="text/csv; charset=utf-8",
        filename=filename,
    )


@router.post("/{job_id}/cancel", response_model=JobSnapshotResponse)
def cancel_job(
    request: Request,
    job_id: str = Depends(validated_job_id),
    manager: JobManager = Depends(get_job_manager),
) -> JobSnapshotResponse:
    settings = get_settings()
    enforce_rate_limit(
        request,
        route="cancel_job",
        limit=settings.rate_limit_cancel_per_minute,
    )
    job = manager.cancel_job(job_id)
    return to_snapshot(job)


@router.post("/{job_id}/retry", response_model=RetryJobResponse, status_code=201)
async def retry_job(
    job_id: str = Depends(validated_job_id),
    manager: JobManager = Depends(get_job_manager),
) -> RetryJobResponse:
    new_id = manager.retry_job(job_id)
    manager.schedule(new_id)
    new_job = manager.get_job(new_id)
    assert new_job is not None
    return RetryJobResponse(
        jobId=new_id,
        retryOfJobId=job_id,
        retryCount=int(new_job.get("retryCount") or 1),
    )
