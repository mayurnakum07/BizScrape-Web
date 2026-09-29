# Job reliability - errors, retry, and cancellation

This document describes Milestone 10 behavior for developers.

## Job lifecycle

```text
queued → starting → running → completed
                           ↘ failed
                           ↘ cancelling → cancelled
```

SSE transport problems (`reconnecting` / `offline`) are **not** job failures.

## Error model

API and job errors use:

```json
{
  "code": "RATE_LIMITED",
  "message": "BizScrape has been rate limited while collecting data.",
  "stage": "discover",
  "retryable": true,
  "requestId": "...",
  "details": { "jobId": "...", "partial": true, "recordsCollected": 12 }
}
```

Stack traces are never returned to the browser. Full exceptions are logged server-side with `job_id` / `request_id` only (not scraped datasets).

### Common codes

| Code | Typical meaning | Retryable |
|------|-----------------|-----------|
| `INVALID_CONFIGURATION` | Bad request / config | no |
| `JOB_NOT_FOUND` | Unknown job id | no |
| `JOB_CAPACITY` | Too many concurrent jobs | yes |
| `RATE_LIMITED` | Source rate limit | yes |
| `SOURCE_BLOCKED` | Challenge / block | no |
| `BROWSER_START_FAILED` | Playwright/browser missing | yes |
| `SOURCE_UNAVAILABLE` | Discovery source unreachable | yes |
| `WEBSITE_LOOKUP_FAILED` | Website stage failure | yes |
| `ENRICHMENT_FAILED` | Enrich stage failure | yes |
| `EXPORT_FAILED` | CSV generation failure | yes |
| `JOB_NOT_RETRYABLE` | Retry refused | no |
| `JOB_RETRY_LIMIT` | Max retries exceeded | no |
| `JOB_CANCEL_IN_PROGRESS` | Duplicate cancel | no |

## Retry policy

- Retries create a **new job ID** (`POST /jobs/{id}/retry`).
- Only `failed` (with `retryable: true`) or `cancelled` jobs can be retried.
- `MAX_JOB_RETRIES` (default `3`) limits lineage retries.
- A retry always starts fresh - it does not merge with the previous job’s records.

## Cancellation

1. UI confirms stop.
2. `POST /jobs/{id}/cancel` → status `cancelling` (or immediate `cancelled` if queued).
3. Cooperative cancel flag reaches the engine; browsers clean up via existing shutdown paths.
4. `CANCEL_TIMEOUT_SECONDS` (default `45`) forces a terminal `cancelled` if still stuck.
5. Repeated cancel while `cancelling` returns `409 JOB_CANCEL_IN_PROGRESS`.

## Partial results

If discovery (or earlier stages) produced records and a later stage fails/cancels:

- `partialResults: true`
- results remain available via `GET /jobs/{id}/results`
- UI offers **View results** / **Export available data**
- CSV download uses client-side export of collected rows (does not re-scrape)

## SSE vs scraper failure

| Situation | UI |
|-----------|----|
| SSE drop | Reconnecting… / offline + refresh |
| `job_failed` event | Failure card with code/stage |
| Browser offline | Preserve local snapshot; reconnect |

`SSE_MAX_RECONNECT_ATTEMPTS` bounds automatic reconnects on the client.

## Environment

```text
CANCEL_TIMEOUT_SECONDS=45
MAX_JOB_RETRIES=3
SSE_MAX_RECONNECT_ATTEMPTS=8
```
