/**
 * Thin scrape-job helpers over the shared API client.
 * Prefer `@/services/scrape-job` from UI code.
 */

import {
  cancelRemoteJob,
  createRemoteJob,
  fetchRemoteJob,
  fetchRemoteResults,
} from "@/services/scrape-api/client";
import type { ScrapeConfig } from "@/types/scrape";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";
import type { ScrapeResultsSnapshot } from "@/types/scrape-results";

export async function createScrapeJob(
  config: ScrapeConfig,
): Promise<{ jobId: string }> {
  return createRemoteJob(config);
}

export async function getScrapeJob(jobId: string): Promise<ScrapeJobSnapshot> {
  return fetchRemoteJob(jobId);
}

export async function getScrapeJobResults(
  jobId: string,
): Promise<ScrapeResultsSnapshot> {
  return fetchRemoteResults(jobId);
}

export async function cancelScrapeJobRemote(
  jobId: string,
): Promise<ScrapeJobSnapshot> {
  return cancelRemoteJob(jobId);
}
