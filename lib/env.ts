/**
 * Environment access helpers.
 *
 * Browser code must only use `NEXT_PUBLIC_*` values.
 * Server code may use `API_URL` (preferred) or fall back to the public URL.
 *
 * IMPORTANT: Next.js only inlines `process.env.NEXT_PUBLIC_*` when the key is a
 * static string literal. Dynamic `process.env[name]` is undefined in the browser.
 */

function trimEnv(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  return value.trim();
}

/** Canonical public site URL for metadata and absolute links. */
export function getSiteUrl(): string {
  return trimEnv(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000";
}

/** Public API base URL safe for client components. */
export function getPublicApiUrl(): string | undefined {
  return trimEnv(process.env.NEXT_PUBLIC_API_URL);
}

/** SSE reconnect attempt budget (mirrors backend default when unset). */
export function getSseMaxReconnectAttempts(): number {
  const raw = trimEnv(process.env.NEXT_PUBLIC_SSE_MAX_RECONNECT_ATTEMPTS);
  if (!raw) {
    return 8;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
}

/**
 * Server-preferred API base URL.
 * Falls back to the public URL when `API_URL` is unset.
 */
export function getServerApiUrl(): string | undefined {
  return trimEnv(process.env.API_URL) ?? getPublicApiUrl();
}
