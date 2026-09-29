import { SESSION_JOB_KEY_PREFIX } from "@/lib/scrape/constants";
import {
  MOCK_BUSINESS_FIXTURES,
  materializeFixture,
} from "@/services/scrape-results/mock-fixtures";
import type { ScrapeResultsProvider } from "@/services/scrape-results/provider";
import type { BusinessRecord } from "@/types/business-record";
import {
  createEmptyResults,
  deriveResultSummary,
  type ScrapeResultsSnapshot,
} from "@/types/scrape-results";

const STORAGE_PREFIX = `${SESSION_JOB_KEY_PREFIX}results:`;

/**
 * Development-only incremental results driver.
 * Streams synthetic fixtures - not live scrape data.
 */
class MockScrapeResultsProvider implements ScrapeResultsProvider {
  private readonly sets = new Map<string, ScrapeResultsSnapshot>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private readonly timers = new Map<string, Array<ReturnType<typeof setTimeout>>>();
  private readonly started = new Set<string>();

  getResults(jobId: string): ScrapeResultsSnapshot | null {
    const cached = this.sets.get(jobId);
    if (cached) {
      return cached;
    }

    if (typeof window === "undefined") {
      return null;
    }

    const raw = sessionStorage.getItem(storageKey(jobId));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as ScrapeResultsSnapshot;
      if (!parsed?.jobId) {
        return null;
      }
      this.sets.set(jobId, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  getResult(jobId: string, recordId: string): BusinessRecord | null {
    const results = this.getResults(jobId);
    return results?.records.find((record) => record.id === recordId) ?? null;
  }

  startCollecting(
    jobId: string,
    options: { target: number; duplicatesRemoved?: number },
  ): void {
    if (this.started.has(jobId)) {
      return;
    }

    const existing = this.getResults(jobId);
    if (existing && (existing.status === "ready" || existing.status === "empty")) {
      return;
    }

    this.started.add(jobId);
    const base = existing ?? createEmptyResults(jobId);
    const duplicatesRemoved = options.duplicatesRemoved ?? base.duplicatesRemoved;

    this.save({
      ...base,
      status: "collecting",
      duplicatesRemoved,
      summary: deriveResultSummary(base.records, duplicatesRemoved),
    });

    const limit = Math.max(
      1,
      Math.min(options.target, MOCK_BUSINESS_FIXTURES.length),
    );
    const already = base.records.length;

    for (let i = already; i < limit; i += 1) {
      const delay = 500 + (i - already) * 550;
      const timer = setTimeout(() => {
        const current = this.getResults(jobId);
        if (!current || current.status === "ready" || current.status === "empty") {
          return;
        }
        if (!this.started.has(jobId)) {
          return;
        }

        const fixture = MOCK_BUSINESS_FIXTURES[i];
        if (!fixture) {
          return;
        }

        const record = materializeFixture(fixture, i, jobId);
        if (current.records.some((row) => row.id === record.id)) {
          return;
        }

        const records = [...current.records, record];
        this.save({
          ...current,
          status: "collecting",
          records,
          summary: deriveResultSummary(records, current.duplicatesRemoved),
        });
      }, delay);

      this.trackTimer(jobId, timer);
    }

    const finishDelay = 500 + (limit - already) * 550 + 400;
    const finishTimer = setTimeout(() => {
      this.markReady(jobId);
    }, finishDelay);
    this.trackTimer(jobId, finishTimer);
  }

  markReady(jobId: string): void {
    this.clearTimers(jobId);
    const current = this.getResults(jobId) ?? createEmptyResults(jobId);
    const status =
      current.records.length === 0 ? ("empty" as const) : ("ready" as const);

    this.save({
      ...current,
      status,
      summary: deriveResultSummary(current.records, current.duplicatesRemoved),
    });
  }

  stopCollecting(jobId: string): void {
    this.clearTimers(jobId);
    this.started.delete(jobId);
    const current = this.getResults(jobId);
    if (!current) {
      return;
    }
    const status =
      current.records.length === 0 ? ("empty" as const) : ("ready" as const);
    this.save({
      ...current,
      status,
      summary: deriveResultSummary(current.records, current.duplicatesRemoved),
    });
  }

  /** Sync duplicate count from the job pipeline when known. */
  setDuplicatesRemoved(jobId: string, duplicatesRemoved: number): void {
    const current = this.getResults(jobId);
    if (!current) {
      return;
    }
    this.save({
      ...current,
      duplicatesRemoved,
      summary: deriveResultSummary(current.records, duplicatesRemoved),
    });
  }

  subscribe(jobId: string, listener: () => void): () => void {
    const set = this.listeners.get(jobId) ?? new Set();
    set.add(listener);
    this.listeners.set(jobId, set);
    return () => {
      set.delete(listener);
    };
  }

  private save(snapshot: ScrapeResultsSnapshot): void {
    const next = { ...snapshot, updatedAt: new Date().toISOString() };
    this.sets.set(snapshot.jobId, next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey(snapshot.jobId), JSON.stringify(next));
    }
    this.emit(snapshot.jobId);
  }

  private emit(jobId: string): void {
    const set = this.listeners.get(jobId);
    if (!set) {
      return;
    }
    for (const listener of set) {
      listener();
    }
  }

  private trackTimer(jobId: string, timer: ReturnType<typeof setTimeout>): void {
    const list = this.timers.get(jobId) ?? [];
    list.push(timer);
    this.timers.set(jobId, list);
  }

  private clearTimers(jobId: string): void {
    const list = this.timers.get(jobId);
    if (!list) {
      return;
    }
    for (const timer of list) {
      clearTimeout(timer);
    }
    this.timers.delete(jobId);
  }
}

function storageKey(jobId: string): string {
  return `${STORAGE_PREFIX}${jobId}`;
}

let singleton: MockScrapeResultsProvider | null = null;

export function getMockScrapeResultsProvider(): MockScrapeResultsProvider {
  if (!singleton) {
    singleton = new MockScrapeResultsProvider();
  }
  return singleton;
}
