/**
 * Remote results provider — updated by SSE events via the job provider.
 * Retains a one-shot hydrate fetch; no interval polling.
 */

import { fetchRemoteResults } from "@/services/scrape-api/client";
import type { ScrapeResultsProvider } from "@/services/scrape-results/provider";
import type { BusinessRecord } from "@/types/business-record";
import {
  createEmptyResults,
  type ScrapeResultsSnapshot,
} from "@/types/scrape-results";

class RemoteScrapeResultsProvider implements ScrapeResultsProvider {
  private readonly results = new Map<string, ScrapeResultsSnapshot>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private readonly hydrated = new Set<string>();

  getResults(jobId: string): ScrapeResultsSnapshot | null {
    return this.results.get(jobId) ?? null;
  }

  getResult(jobId: string, recordId: string): BusinessRecord | null {
    const snap = this.getResults(jobId);
    return snap?.records.find((row) => row.id === recordId) ?? null;
  }

  seed(jobId: string, snapshot: ScrapeResultsSnapshot): void {
    this.results.set(jobId, snapshot);
    this.emit(jobId);
  }

  applySnapshot(jobId: string, snapshot: ScrapeResultsSnapshot): void {
    this.results.set(jobId, snapshot);
    this.emit(jobId);
  }

  startCollecting(
    jobId: string,
    options: { target: number; duplicatesRemoved?: number },
  ): void {
    let current = this.results.get(jobId);
    if (!current) {
      const empty = createEmptyResults(jobId);
      if (options.duplicatesRemoved) {
        empty.duplicatesRemoved = options.duplicatesRemoved;
        empty.summary = {
          ...empty.summary,
          duplicates: options.duplicatesRemoved,
        };
      }
      current = empty;
      this.results.set(jobId, empty);
      this.emit(jobId);
    }
    // One-shot hydrate only — live updates come from SSE via job provider.
    if (!this.hydrated.has(jobId) && current.status === "idle" && current.records.length === 0) {
      this.hydrated.add(jobId);
      void this.hydrateOnce(jobId);
    }
  }

  markReady(jobId: string): void {
    const current = this.getResults(jobId);
    if (!current) {
      return;
    }
    this.results.set(jobId, {
      ...current,
      status: current.records.length ? "ready" : "empty",
      updatedAt: new Date().toISOString(),
    });
    this.emit(jobId);
  }

  stopCollecting(jobId: string): void {
    void jobId;
    // No pollers to stop; keep last snapshot.
  }

  setDuplicatesRemoved(jobId: string, duplicatesRemoved: number): void {
    const current = this.getResults(jobId);
    if (!current) {
      return;
    }
    this.results.set(jobId, {
      ...current,
      duplicatesRemoved,
      summary: { ...current.summary, duplicates: duplicatesRemoved },
      updatedAt: new Date().toISOString(),
    });
    this.emit(jobId);
  }

  subscribe(jobId: string, listener: () => void): () => void {
    let set = this.listeners.get(jobId);
    if (!set) {
      set = new Set();
      this.listeners.set(jobId, set);
    }
    set.add(listener);

    return () => {
      const current = this.listeners.get(jobId);
      current?.delete(listener);
      if (!current || current.size === 0) {
        this.listeners.delete(jobId);
      }
    };
  }

  private async hydrateOnce(jobId: string): Promise<void> {
    try {
      const snapshot = await fetchRemoteResults(jobId);
      // Do not clobber a richer SSE-driven snapshot with an empty hydrate.
      const current = this.getResults(jobId);
      if (
        current &&
        current.records.length > snapshot.records.length &&
        snapshot.status === "idle"
      ) {
        return;
      }
      this.results.set(jobId, snapshot);
      this.emit(jobId);
    } catch {
      // Keep last good snapshot.
    }
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
}

let singleton: RemoteScrapeResultsProvider | null = null;

export function getRemoteScrapeResultsProvider(): RemoteScrapeResultsProvider {
  if (!singleton) {
    singleton = new RemoteScrapeResultsProvider();
  }
  return singleton;
}
