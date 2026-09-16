import type { ScrapeJobSnapshot } from "@/types/scrape-job";

/**
 * Provider contract for job transport.
 * Mock implements this today; a remote/SSE provider will later.
 */
export type ScrapeJobProvider = {
  readonly kind: ScrapeJobSnapshot["provider"];
  getJob(jobId: string): ScrapeJobSnapshot | null;
  saveJob(snapshot: ScrapeJobSnapshot): void;
  startJob(jobId: string): void;
  cancelJob(jobId: string): Promise<void>;
  /**
   * Simulate transport loss without failing the job.
   * Mock-only convenience; remote provider may no-op.
   */
  simulateConnectionInterrupt?(jobId: string): void;
  /**
   * Force a structured failure for UI development.
   * Mock-only convenience.
   */
  simulateFailure?(jobId: string): void;
  subscribe(jobId: string, listener: () => void): () => void;
};
