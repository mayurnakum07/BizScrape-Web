import type { ScrapeResultsSnapshot } from "@/types/scrape-results";

export type ScrapeResultsProvider = {
  getResults(jobId: string): ScrapeResultsSnapshot | null;
  getResult(jobId: string, recordId: string): ScrapeResultsSnapshot["records"][number] | null;
  /**
   * Begin incremental collection for a job (mock today).
   * Safe to call repeatedly - only starts once per job unless restarted.
   */
  startCollecting(jobId: string, options: { target: number; duplicatesRemoved?: number }): void;
  markReady(jobId: string): void;
  stopCollecting(jobId: string): void;
  subscribe(jobId: string, listener: () => void): () => void;
};
