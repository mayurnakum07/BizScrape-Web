/**
 * Typed BizScrape Python API client.
 * UI should use scrape-job / scrape-results facades, not this module directly.
 */

import { AppError } from "@/lib/errors";
import { getPublicApiUrl } from "@/lib/env";
import type { ScrapeConfig } from "@/types/scrape";
import type { ScrapeJobSnapshot } from "@/types/scrape-job";
import type { ScrapeResultsSnapshot } from "@/types/scrape-results";
import type { BusinessRecord } from "@/types/business-record";

export type CreateJobApiResponse = {
  jobId: string;
};

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  stage?: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
  requestId?: string;
};

const DEFAULT_TIMEOUT_MS = 30_000;

export function isRemoteApiConfigured(): boolean {
  return Boolean(getPublicApiUrl());
}

export function getApiBaseUrl(): string {
  const base = getPublicApiUrl();
  if (!base) {
    throw new AppError(
      "The scraping service could not be reached. Set NEXT_PUBLIC_API_URL.",
      { code: "API_URL_MISSING", status: 503, retryable: true },
    );
  }
  return base.replace(/\/+$/, "");
}

function joinUrl(base: string, path: string): string {
  return `${base}/${path.replace(/^\/+/, "")}`;
}

async function parseError(response: Response): Promise<AppError> {
  let payload: ApiErrorPayload | null = null;
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }
  const details = payload?.details;
  const jobId =
    details && typeof details.jobId === "string" ? details.jobId : undefined;
  const requestId =
    payload?.requestId ??
    (details && typeof details.requestId === "string"
      ? details.requestId
      : undefined) ??
    response.headers.get("X-Request-ID") ??
    undefined;
  const partial =
    details && typeof details.partial === "boolean" ? details.partial : undefined;
  const recordsCollected =
    details && typeof details.recordsCollected === "number"
      ? details.recordsCollected
      : undefined;

  const status = response.status;
  const code =
    payload?.code ??
    (status === 503
      ? "SERVICE_UNAVAILABLE"
      : status === 429
        ? "RATE_LIMITED"
        : "API_REQUEST_FAILED");

  return new AppError(
    payload?.message ??
      (status === 503
        ? "The scraping service could not be reached."
        : `API request failed (${status})`),
    {
      code,
      status,
      stage: payload?.stage,
      retryable:
        payload?.retryable ??
        (status === 429 || status === 503 || status >= 500),
      jobId,
      requestId: requestId ?? undefined,
      details: details,
      partial,
      recordsCollected,
    },
  );
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = joinUrl(base, path);
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(url, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("API request timed out.", {
        code: "API_TIMEOUT",
        status: 408,
        retryable: true,
      });
    }
    throw new AppError("The scraping service could not be reached.", {
      code: "API_NETWORK",
      status: 503,
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

export async function createRemoteJob(
  config: ScrapeConfig,
): Promise<CreateJobApiResponse> {
  return apiFetch<CreateJobApiResponse>("/jobs", {
    method: "POST",
    body: {
      businessType: config.businessType,
      country: config.country,
      state: config.state,
      city: config.city,
      area: config.area?.trim() ? config.area.trim() : null,
      target: config.target,
      sources: config.sources,
      searchAllLocalities: config.searchAllLocalities,
    },
  });
}

export async function fetchRemoteJob(jobId: string): Promise<ScrapeJobSnapshot> {
  const raw = await apiFetch<ScrapeJobSnapshot>(
    `/jobs/${encodeURIComponent(jobId)}`,
  );
  return normalizeJobSnapshot(raw);
}

export async function fetchRemoteResults(
  jobId: string,
): Promise<ScrapeResultsSnapshot> {
  const raw = await apiFetch<ScrapeResultsSnapshot>(
    `/jobs/${encodeURIComponent(jobId)}/results`,
  );
  return {
    jobId: raw.jobId,
    status: raw.status,
    records: (raw.records ?? []) as BusinessRecord[],
    summary: raw.summary,
    duplicatesRemoved: raw.duplicatesRemoved ?? 0,
    updatedAt: raw.updatedAt,
  };
}

export async function cancelRemoteJob(jobId: string): Promise<ScrapeJobSnapshot> {
  const raw = await apiFetch<ScrapeJobSnapshot>(
    `/jobs/${encodeURIComponent(jobId)}/cancel`,
    { method: "POST" },
  );
  return normalizeJobSnapshot(raw);
}

export async function retryRemoteJob(
  jobId: string,
): Promise<{ jobId: string; retryOfJobId: string; retryCount: number }> {
  return apiFetch(`/jobs/${encodeURIComponent(jobId)}/retry`, {
    method: "POST",
  });
}

function normalizeJobSnapshot(raw: ScrapeJobSnapshot): ScrapeJobSnapshot {
  const config = {
    ...raw.config,
    country: raw.config.country ?? "",
    state: raw.config.state ?? "",
  };
  return {
    ...raw,
    provider: "remote",
    config,
    request: raw.request ?? {
      niche: config.businessType,
      country: config.country,
      state: config.state,
      city: config.city,
      area: config.area,
      targetCount: config.target,
      sources: config.sources,
      searchAllLocalities: config.searchAllLocalities,
    },
  };
}
