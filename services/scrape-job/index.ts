import type { ScrapeJobProvider } from "@/services/scrape-job/provider";
import { getMockScrapeJobProvider } from "@/services/scrape-job/mock-provider";
import { getRemoteScrapeJobProvider } from "@/services/scrape-job/remote-provider";
import { createJobSnapshotFromConfig } from "@/services/scrape-job/snapshot";
import { isRemoteApiConfigured } from "@/services/scrape-api/client";
import type { ScrapeConfig } from "@/types/scrape";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";

/**
 * Job service facade.
 *
 * When `NEXT_PUBLIC_API_URL` is set, uses the Python API (poll-based).
 * Otherwise falls back to the local mock provider.
 */

function getActiveProvider(): ScrapeJobProvider {
  if (isRemoteApiConfigured()) {
    return getRemoteScrapeJobProvider();
  }
  return getMockScrapeJobProvider();
}

export function createScrapeJobDraft(config: ScrapeConfig): ScrapeJobSnapshot {
  const provider = getActiveProvider();
  const snapshot = createJobSnapshotFromConfig(config, {
    provider: provider.kind,
  });
  provider.saveJob(snapshot);
  return snapshot;
}

/**
 * Create a job and start execution.
 * Remote mode POSTs to the Python API and returns a real job ID.
 */
export async function createScrapeJob(
  config: ScrapeConfig,
): Promise<ScrapeJobSnapshot> {
  if (isRemoteApiConfigured()) {
    return getRemoteScrapeJobProvider().createJob(config);
  }
  const snapshot = createScrapeJobDraft(config);
  startScrapeJob(snapshot.id);
  return snapshot;
}

export function getScrapeJob(jobId: string): ScrapeJobSnapshot | null {
  return getActiveProvider().getJob(jobId);
}

export function startScrapeJob(jobId: string): void {
  const provider = getActiveProvider();
  const job = provider.getJob(jobId);
  provider.startJob(jobId);
  if (job && provider.kind === "mock") {
    void import("@/services/scrape-results").then((results) => {
      results.startScrapeResultsCollection(jobId, {
        target: job.config.target,
        duplicatesRemoved: job.stats.duplicatesRemoved,
      });
    });
  }
  if (job && provider.kind === "remote") {
    void import("@/services/scrape-results").then((results) => {
      results.startScrapeResultsCollection(jobId, {
        target: job.config.target,
        duplicatesRemoved: job.stats.duplicatesRemoved,
      });
    });
  }
}

export async function cancelScrapeJob(jobId: string): Promise<void> {
  await getActiveProvider().cancelJob(jobId);
  void import("@/services/scrape-results").then((results) => {
    results.stopScrapeResultsCollection(jobId);
  });
}

/**
 * Retry a failed/cancelled job as a fresh execution (new job ID when remote).
 */
export async function retryScrapeJob(
  jobId: string,
): Promise<ScrapeJobSnapshot> {
  if (isRemoteApiConfigured()) {
    return getRemoteScrapeJobProvider().retryJob(jobId);
  }
  const existing = getScrapeJob(jobId);
  if (!existing) {
    throw new Error("Job not found");
  }
  return createScrapeJob(existing.config);
}

/** One-shot hydrate from the API (reconnect exhaustion / manual refresh). */
export async function refreshScrapeJob(jobId: string): Promise<void> {
  if (isRemoteApiConfigured()) {
    await getRemoteScrapeJobProvider().refreshJob(jobId);
    return;
  }
  // Mock: no-op - snapshot already local.
}

export function subscribeScrapeJob(
  jobId: string,
  listener: () => void,
): () => void {
  return getActiveProvider().subscribe(jobId, listener);
}

/** Development helpers - only available on the mock provider. */
export function simulateJobConnectionInterrupt(jobId: string): void {
  getActiveProvider().simulateConnectionInterrupt?.(jobId);
}

export function simulateJobFailure(jobId: string): void {
  getActiveProvider().simulateFailure?.(jobId);
}
