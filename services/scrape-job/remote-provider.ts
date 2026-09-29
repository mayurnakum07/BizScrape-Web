/**
 * Remote scrape-job provider - SSE primary, GET hydrate on reconnect.
 */

import {
  cancelRemoteJob,
  createRemoteJob,
  fetchRemoteJob,
  fetchRemoteResults,
  retryRemoteJob,
} from "@/services/scrape-api/client";
import {
  applyScrapeEvent,
  createEmptyResultsForJob,
} from "@/services/scrape-events/reducer";
import {
  openScrapeEventStream,
  type ScrapeEventConnectionState,
  type ScrapeEventStream,
} from "@/services/scrape-events/sse-client";
import { getSseMaxReconnectAttempts } from "@/lib/env";
import type { ScrapeJobProvider } from "@/services/scrape-job/provider";
import { getRemoteScrapeResultsProvider } from "@/services/scrape-results/remote-provider";
import { toScrapeJobRequest, type ScrapeConfig } from "@/types/scrape";
import type { ScrapeEvent } from "@/types/scrape-events";
import {
  isTerminalJobStatus,
  type JobConnectionState,
  type ScrapeJobSnapshot,
} from "@/types/scrape-job";

class RemoteScrapeJobProvider implements ScrapeJobProvider {
  readonly kind = "remote" as const;

  private readonly jobs = new Map<string, ScrapeJobSnapshot>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private readonly streams = new Map<string, ScrapeEventStream>();
  private readonly appliedIds = new Map<string, Set<string>>();
  private readonly lastEventIds = new Map<string, string>();
  private readonly hydrating = new Set<string>();

  getJob(jobId: string): ScrapeJobSnapshot | null {
    return this.jobs.get(jobId) ?? null;
  }

  saveJob(snapshot: ScrapeJobSnapshot): void {
    this.jobs.set(snapshot.id, snapshot);
    this.emit(snapshot.id);
  }

  startJob(jobId: string): void {
    if (!this.getJob(jobId)) {
      void this.hydrate(jobId, { includeResults: true }).then(() => {
        this.ensureStream(jobId);
      });
      return;
    }
    this.ensureStream(jobId);
  }

  async cancelJob(jobId: string): Promise<void> {
    try {
      const snapshot = await cancelRemoteJob(jobId);
      this.saveJob({
        ...snapshot,
        connection: this.jobs.get(jobId)?.connection ?? snapshot.connection,
      });
    } catch {
      const current = this.getJob(jobId);
      if (current && !isTerminalJobStatus(current.status)) {
        this.saveJob({
          ...current,
          status: "cancelling",
          operationMessage: "Stopping scrape…",
          updatedAt: new Date().toISOString(),
        });
      }
    }
    this.ensureStream(jobId);
  }

  subscribe(jobId: string, listener: () => void): () => void {
    // Subscribe must stay side-effect free aside from registering the listener.
    // Hydrate / SSE attach belong in startJob / refreshJob - otherwise an
    // unstable useSyncExternalStore subscribe restarts the stream every render.
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
        this.stopStream(jobId);
      }
    };
  }

  async createJob(config: ScrapeConfig): Promise<ScrapeJobSnapshot> {
    const { jobId } = await createRemoteJob(config);
    const now = new Date().toISOString();
    const placeholder: ScrapeJobSnapshot = {
      id: jobId,
      provider: "remote",
      config,
      request: toScrapeJobRequest(config),
      status: "queued",
      connection: "reconnecting",
      currentStage: null,
      stages: {
        discover: "pending",
        website_lookup: "pending",
        enrich: "pending",
        deduplicate: "pending",
        export: "pending",
      },
      progress: {
        mode: "stage",
        percent: 0,
        stageIndex: 0,
        stageCount: 5,
      },
      targetProgress: { collected: 0, target: config.target },
      stats: {
        businessesFound: 0,
        localMatches: 0,
        websitesResolved: 0,
        emailsFound: 0,
        phonesFound: 0,
        duplicatesRemoved: 0,
      },
      activity: [
        {
          id: `${jobId}-local`,
          timestamp: now,
          message: "Job accepted by BizScrape API",
        },
      ],
      operationMessage: "Connecting to live updates…",
      csvReady: false,
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    this.saveJob(placeholder);
    getRemoteScrapeResultsProvider().seed(jobId, createEmptyResultsForJob(jobId));
    await this.hydrate(jobId, { includeResults: true });
    this.ensureStream(jobId);
    return this.getJob(jobId) ?? placeholder;
  }

  async retryJob(jobId: string): Promise<ScrapeJobSnapshot> {
    const { jobId: newId } = await retryRemoteJob(jobId);
    // Fetch authoritative snapshot for the new job, then attach SSE.
    const snapshot = await fetchRemoteJob(newId);
    this.saveJob(snapshot);
    getRemoteScrapeResultsProvider().seed(
      newId,
      createEmptyResultsForJob(newId),
    );
    this.ensureStream(newId);
    return snapshot;
  }

  async refreshJob(jobId: string): Promise<void> {
    await this.hydrate(jobId, { includeResults: true });
    const job = this.getJob(jobId);
    if (job && !isTerminalJobStatus(job.status) && job.connection === "offline") {
      // Allow another SSE attempt after manual refresh.
      this.stopStream(jobId);
      this.ensureStream(jobId);
    }
  }

  private ensureStream(jobId: string): void {
    const job = this.getJob(jobId);
    if (job && isTerminalJobStatus(job.status)) {
      return;
    }
    if (this.streams.has(jobId)) {
      return;
    }

    const applied = this.appliedIds.get(jobId) ?? new Set<string>();
    this.appliedIds.set(jobId, applied);

    const lastId = this.lastEventIds.get(jobId) ?? null;

    const stream = openScrapeEventStream(
      jobId,
      {
        onEvent: (event) => this.handleEvent(event),
        onConnectionChange: (state) => this.handleConnection(jobId, state),
        onExhausted: () => {
          const current = this.getJob(jobId);
          if (!current || isTerminalJobStatus(current.status)) {
            return;
          }
          this.saveJob({
            ...current,
            connection: "offline",
            operationMessage:
              "Unable to reconnect to live updates. The scraper may still be running.",
            updatedAt: new Date().toISOString(),
          });
        },
        onError: () => {
          // Connection banner is driven by onConnectionChange / onExhausted.
        },
      },
      { lastEventId: lastId, maxAttempts: getSseMaxReconnectAttempts() },
    );
    this.streams.set(jobId, stream);
  }

  private stopStream(jobId: string): void {
    const stream = this.streams.get(jobId);
    if (stream) {
      const lastEventId = stream.getLastEventId();
      if (lastEventId) {
        this.lastEventIds.set(jobId, lastEventId);
      }
      stream.close();
      this.streams.delete(jobId);
    }
  }

  private handleConnection(
    jobId: string,
    state: ScrapeEventConnectionState,
  ): void {
    const job = this.getJob(jobId);
    if (!job || isTerminalJobStatus(job.status)) {
      if (state === "closed") {
        this.stopStream(jobId);
      }
      return;
    }

    let connection: JobConnectionState = "connected";
    let operationMessage = job.operationMessage;
    if (state === "connecting") {
      connection = "reconnecting";
      operationMessage = "Connecting to live updates…";
    } else if (state === "reconnecting") {
      connection = "reconnecting";
      operationMessage =
        "Connection to live updates interrupted. The scraping job may still be running.";
    } else if (state === "connected") {
      connection = "connected";
    } else if (state === "exhausted") {
      connection = "offline";
      operationMessage =
        "Unable to reconnect to live updates. The scraper may still be running.";
      void this.hydrate(jobId, { includeResults: true });
    } else if (state === "disconnected" || state === "closed") {
      connection = isTerminalJobStatus(job.status) ? "connected" : "interrupted";
    }

    // Skip no-op connection updates - they still emit and can loop React.
    if (
      job.connection === connection &&
      job.operationMessage === operationMessage
    ) {
      return;
    }

    this.saveJob({
      ...job,
      connection,
      operationMessage,
      updatedAt: new Date().toISOString(),
    });
  }

  private handleEvent(event: ScrapeEvent): void {
    const job = this.getJob(event.jobId);
    if (!job) {
      // Late SSE packet before hydrate finished - pull authoritative state.
      void this.hydrate(event.jobId, { includeResults: true });
      return;
    }
    const applied = this.appliedIds.get(event.jobId) ?? new Set<string>();
    const resultsProvider = getRemoteScrapeResultsProvider();
    const results =
      resultsProvider.getResults(event.jobId) ??
      createEmptyResultsForJob(event.jobId);

    const next = applyScrapeEvent(
      { job, results, appliedEventIds: applied },
      event,
    );
    if (!next.changed) {
      return;
    }

    this.appliedIds.set(event.jobId, next.appliedEventIds);
    this.lastEventIds.set(event.jobId, event.id);
    this.saveJob({
      ...next.job,
      connection: "connected",
    });
    resultsProvider.applySnapshot(event.jobId, next.results);

    if (isTerminalJobStatus(next.job.status)) {
      this.stopStream(event.jobId);
    }
  }

  private async hydrate(
    jobId: string,
    options: { includeResults?: boolean } = {},
  ): Promise<void> {
    if (this.hydrating.has(jobId)) {
      return;
    }
    this.hydrating.add(jobId);
    try {
      const snapshot = await fetchRemoteJob(jobId);
      const current = this.getJob(jobId);
      this.saveJob({
        ...snapshot,
        // Preserve local connection indicator during reconnect hydrate.
        connection: current?.connection ?? snapshot.connection,
        activity:
          snapshot.activity.length >= (current?.activity.length ?? 0)
            ? snapshot.activity
            : (current?.activity ?? snapshot.activity),
      });
      if (options.includeResults) {
        const results = await fetchRemoteResults(jobId);
        getRemoteScrapeResultsProvider().applySnapshot(jobId, results);
      }
      if (isTerminalJobStatus(snapshot.status)) {
        this.stopStream(jobId);
      }
    } catch {
      // Keep last good local state; SSE reconnect will retry.
    } finally {
      this.hydrating.delete(jobId);
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

let singleton: RemoteScrapeJobProvider | null = null;

export function getRemoteScrapeJobProvider(): RemoteScrapeJobProvider {
  if (!singleton) {
    singleton = new RemoteScrapeJobProvider();
  }
  return singleton;
}
