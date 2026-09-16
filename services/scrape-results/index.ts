import { isRemoteApiConfigured } from "@/services/scrape-api/client";
import { getMockScrapeResultsProvider } from "@/services/scrape-results/mock-provider";
import { getRemoteScrapeResultsProvider } from "@/services/scrape-results/remote-provider";
import type { BusinessRecord } from "@/types/business-record";
import type { ScrapeResultsSnapshot } from "@/types/scrape-results";

function provider() {
  if (isRemoteApiConfigured()) {
    return getRemoteScrapeResultsProvider();
  }
  return getMockScrapeResultsProvider();
}

export function getScrapeResults(jobId: string): ScrapeResultsSnapshot | null {
  return provider().getResults(jobId);
}

export function getScrapeResult(
  jobId: string,
  recordId: string,
): BusinessRecord | null {
  return provider().getResult(jobId, recordId);
}

export function startScrapeResultsCollection(
  jobId: string,
  options: { target: number; duplicatesRemoved?: number },
): void {
  provider().startCollecting(jobId, options);
}

export function markScrapeResultsReady(jobId: string): void {
  provider().markReady(jobId);
}

export function stopScrapeResultsCollection(jobId: string): void {
  provider().stopCollecting(jobId);
}

export function setScrapeResultsDuplicates(
  jobId: string,
  duplicatesRemoved: number,
): void {
  const active = provider();
  if ("setDuplicatesRemoved" in active && typeof active.setDuplicatesRemoved === "function") {
    active.setDuplicatesRemoved(jobId, duplicatesRemoved);
  }
}

export function subscribeScrapeResults(
  jobId: string,
  listener: () => void,
): () => void {
  return provider().subscribe(jobId, listener);
}
