import { AppError } from "@/lib/errors";
import { getPublicApiUrl, getServerApiUrl } from "@/lib/env";

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  /** Use server env (`API_URL`) when true; default client-safe public URL. */
  server?: boolean;
  signal?: AbortSignal;
};

/**
 * Thin HTTP helper for the future Python-backed API.
 * No scrape logic lives here — only transport.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const baseUrl = options.server ? getServerApiUrl() : getPublicApiUrl();

  if (!baseUrl) {
    throw new AppError(
      "API URL is not configured. Set NEXT_PUBLIC_API_URL or API_URL.",
      { code: "API_URL_MISSING", status: 500 },
    );
  }

  const url = joinUrl(baseUrl, path);
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    let code = "API_REQUEST_FAILED";
    let message = `API request failed (${response.status})`;
    try {
      const payload = (await response.json()) as {
        code?: string;
        message?: string;
      };
      if (payload?.code) code = payload.code;
      if (payload?.message) message = payload.message;
    } catch {
      // keep defaults
    }
    throw new AppError(message, { code, status: response.status });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}
