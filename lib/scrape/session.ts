import { SESSION_JOB_KEY_PREFIX } from "@/lib/scrape/constants";
import { toScrapeJobRequest } from "@/types/scrape";
import type { ScrapeConfig, ScrapeJob } from "@/types/scrape";

/**
 * Local-only job persistence for Milestone 04 → 05 handoff.
 * Not a backend. Not a mock scrape. Stores configuration until a real API exists.
 */

export type LocalScrapeJob = ScrapeJob & {
  /** Marks that this job was created in the browser without a Python run. */
  transport: "local-draft";
};

const jobCache = new Map<string, LocalScrapeJob | null>();

function storageKey(jobId: string): string {
  return `${SESSION_JOB_KEY_PREFIX}${jobId}`;
}

export function createLocalScrapeJob(config: ScrapeConfig): LocalScrapeJob {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}`;

  return {
    id,
    status: "draft",
    request: toScrapeJobRequest(config),
    createdAt: now,
    updatedAt: now,
    transport: "local-draft",
  };
}

export function saveLocalScrapeJob(job: LocalScrapeJob): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(storageKey(job.id), JSON.stringify(job));
  jobCache.set(job.id, job);
}

export function loadLocalScrapeJob(jobId: string): LocalScrapeJob | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (jobCache.has(jobId)) {
    return jobCache.get(jobId) ?? null;
  }

  const raw = sessionStorage.getItem(storageKey(jobId));
  if (!raw) {
    jobCache.set(jobId, null);
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as LocalScrapeJob;
    if (!parsed?.id || !parsed?.request) {
      jobCache.set(jobId, null);
      return null;
    }
    jobCache.set(jobId, parsed);
    return parsed;
  } catch {
    jobCache.set(jobId, null);
    return null;
  }
}

/** No-op subscribe - session drafts do not emit live updates yet. */
export function subscribeLocalScrapeJobs(
  onStoreChange: () => void,
): () => void {
  void onStoreChange;
  return () => {};
}

/**
 * Future real backend entrypoint - intentionally not called from the form yet.
 */
export function createRemoteScrapeJob(config: ScrapeConfig): Promise<never> {
  void config;
  return Promise.reject(
    new Error(
      "Remote scrape jobs are not wired yet. Use createLocalScrapeJob for development navigation.",
    ),
  );
}
