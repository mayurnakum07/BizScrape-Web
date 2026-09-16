# Scrape job architecture

## Separation

| Concern | Location |
|---------|----------|
| User request (`ScrapeConfig`) | Form → job snapshot `config` / `request` |
| Runtime state | Job snapshot `status`, `stages`, `stats`, `activity` |
| UI | `components/scrape-job/*` |
| Transport | `services/scrape-job/*` |

The UI never talks to Python directly. It consumes `ScrapeJobSnapshot` via `services/scrape-job`.

## Providers

- **mock** (`mock-provider.ts`) — finite development script for UI states. Labeled in the UI. Not production data.
- **remote** (future) — SSE/WebSocket + REST against the Python engine.

Swap providers in `getActiveProvider()` without rewriting the job screen.

## Future HTTP contract (not implemented)

```text
POST   /jobs
GET    /jobs/:id
GET    /jobs/:id/events
POST   /jobs/:id/cancel
GET    /jobs/:id/result
```

## Refresh / tabs

Job ID is authoritative. Snapshots persist in `sessionStorage` for the mock provider so refresh can reload state. Leaving the page does **not** cancel the job; only **Stop scraping** does (architecture note for the future backend).
