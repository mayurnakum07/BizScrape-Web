/**
 * Application-level error helpers.
 * Keep messages user-safe; log details separately.
 */

import type { ScrapeError } from "@/types/scrape-error";

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly stage?: string;
  readonly retryable: boolean;
  readonly jobId?: string;
  readonly requestId?: string;
  readonly details?: Record<string, unknown> | string;
  readonly partial?: boolean;
  readonly recordsCollected?: number;

  constructor(
    message: string,
    options?: {
      code?: string;
      status?: number;
      stage?: string;
      retryable?: boolean;
      jobId?: string;
      requestId?: string;
      details?: Record<string, unknown> | string;
      partial?: boolean;
      recordsCollected?: number;
    },
  ) {
    super(message);
    this.name = "AppError";
    this.code = options?.code ?? "APP_ERROR";
    this.status = options?.status ?? 500;
    this.stage = options?.stage;
    this.retryable = options?.retryable ?? false;
    this.jobId = options?.jobId;
    this.requestId = options?.requestId;
    this.details = options?.details;
    this.partial = options?.partial;
    this.recordsCollected = options?.recordsCollected;
  }

  toScrapeError(): ScrapeError {
    return {
      code: this.code,
      message: this.message,
      stage: this.stage,
      retryable: this.retryable,
      jobId: this.jobId,
      requestId: this.requestId,
      status: this.status,
      details: this.details,
      partial: this.partial,
      recordsCollected: this.recordsCollected,
    };
  }
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function normalizeToScrapeError(
  error: unknown,
  fallback?: Partial<ScrapeError>,
): ScrapeError {
  if (error instanceof AppError) {
    return { ...error.toScrapeError(), ...fallback };
  }
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const value = error as Record<string, unknown>;
    return {
      code: String(value.code),
      message: String(value.message),
      stage: typeof value.stage === "string" ? value.stage : undefined,
      retryable: Boolean(value.retryable),
      jobId: typeof value.jobId === "string" ? value.jobId : undefined,
      requestId:
        typeof value.requestId === "string" ? value.requestId : undefined,
      status: typeof value.status === "number" ? value.status : undefined,
      details:
        value.details && typeof value.details === "object"
          ? (value.details as Record<string, unknown>)
          : typeof value.details === "string"
            ? value.details
            : undefined,
      ...fallback,
    };
  }
  return {
    code: fallback?.code ?? "APP_ERROR",
    message:
      error instanceof Error
        ? error.message
        : (fallback?.message ?? "Something went wrong"),
    retryable: fallback?.retryable ?? false,
    ...fallback,
  };
}

export function isDevelopmentDiagnostics(): boolean {
  return process.env.NODE_ENV === "development";
}
