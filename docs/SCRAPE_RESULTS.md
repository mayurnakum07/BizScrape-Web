# Scrape results architecture

## Separation

| Concern | Location |
|---------|----------|
| Job runtime | `ScrapeJobSnapshot` / `services/scrape-job` |
| Result records | `ScrapeResultsSnapshot` / `services/scrape-results` |

Jobs and results are linked by `jobId` but stored and updated independently so records can arrive while a job is still running.

## Provider contract

```text
getResults(jobId)
getResult(jobId, recordId)
startCollecting(jobId, { target })
markReady(jobId)
subscribe(jobId, listener)
```

Mock fixtures stream incrementally. A remote provider can later replace the mock without rewriting the results UI.

## UI

- Route: `/scrape/job/[jobId]/results`
- Desktop table + detail dialog
- Mobile cards + same detail dialog
- Client-side search / filters / sort / pagination
