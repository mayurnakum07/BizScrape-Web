"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Root-level fallback when the root layout itself fails.
 * Must define its own html/body because it replaces the root layout.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          background: "#0b0d10",
          color: "#e8eaed",
        }}
      >
        <div style={{ maxWidth: "28rem", padding: "1.5rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#e05252",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            BizScrape
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "1.5rem" }}>
            Application error
          </h1>
          <p style={{ margin: "0.75rem 0 0", color: "#8b939e" }}>
            The application failed to load. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "0.375rem",
              background: "#4d8ef7",
              color: "#061018",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
