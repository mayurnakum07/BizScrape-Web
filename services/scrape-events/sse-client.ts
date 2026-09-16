/**
 * EventSource client for GET /jobs/:id/events.
 * Handles connect, reconnect with bounded backoff, Last-Event-ID, and cleanup.
 */

import { getApiBaseUrl } from "@/services/scrape-api/client";
import {
  isTerminalScrapeEvent,
  parseScrapeEvent,
  type ScrapeEvent,
} from "@/types/scrape-events";

export type ScrapeEventConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "closed"
  | "exhausted";

export type ScrapeEventStreamHandlers = {
  onEvent: (event: ScrapeEvent) => void;
  onConnectionChange?: (state: ScrapeEventConnectionState) => void;
  onError?: (error: unknown) => void;
  onExhausted?: () => void;
};

export type ScrapeEventStream = {
  close: () => void;
  getLastEventId: () => string | null;
};

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 10_000;
const DEFAULT_MAX_ATTEMPTS = 8;

export function openScrapeEventStream(
  jobId: string,
  handlers: ScrapeEventStreamHandlers,
  options?: { lastEventId?: string | null; maxAttempts?: number },
): ScrapeEventStream {
  let closed = false;
  let source: EventSource | null = null;
  let lastEventId: string | null = options?.lastEventId ?? null;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reachedTerminal = false;
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const setConnection = (state: ScrapeEventConnectionState) => {
    handlers.onConnectionChange?.(state);
  };

  const clearReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const cleanupSource = () => {
    if (source) {
      source.onopen = null;
      source.onmessage = null;
      source.onerror = null;
      source.close();
      source = null;
    }
  };

  const connect = () => {
    if (closed || reachedTerminal) {
      return;
    }
    cleanupSource();
    clearReconnect();

    const base = getApiBaseUrl();
    const params = new URLSearchParams();
    if (lastEventId) {
      params.set("lastEventId", lastEventId);
    }
    const query = params.toString();
    const url = `${base}/jobs/${encodeURIComponent(jobId)}/events${
      query ? `?${query}` : ""
    }`;

    setConnection(attempt === 0 ? "connecting" : "reconnecting");
    source = new EventSource(url);

    source.onopen = () => {
      attempt = 0;
      setConnection("connected");
    };

    source.onmessage = (message) => {
      try {
        const parsed = parseScrapeEvent(JSON.parse(message.data));
        if (!parsed) {
          return;
        }
        if (message.lastEventId) {
          lastEventId = message.lastEventId;
        } else {
          lastEventId = parsed.id;
        }
        handlers.onEvent(parsed);
        if (isTerminalScrapeEvent(parsed.type)) {
          reachedTerminal = true;
          closed = true;
          cleanupSource();
          setConnection("closed");
        }
      } catch (error) {
        handlers.onError?.(error);
      }
    };

    source.onerror = () => {
      if (closed || reachedTerminal) {
        cleanupSource();
        setConnection("closed");
        return;
      }
      cleanupSource();
      attempt += 1;
      handlers.onError?.(new Error("SSE connection interrupted"));

      if (attempt > maxAttempts) {
        closed = true;
        setConnection("exhausted");
        handlers.onExhausted?.();
        return;
      }

      setConnection("reconnecting");
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** Math.min(attempt - 1, 4),
        RECONNECT_MAX_MS,
      );
      reconnectTimer = setTimeout(connect, delay);
    };
  };

  connect();

  return {
    close: () => {
      closed = true;
      clearReconnect();
      cleanupSource();
      setConnection("disconnected");
    },
    getLastEventId: () => lastEventId,
  };
}
