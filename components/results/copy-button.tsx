"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

type CopyButtonProps = {
  value: string;
  label?: string;
  /** Compact control for dense tables — shows a short glyph. */
  compact?: boolean;
  className?: string;
};

export function CopyButton({
  value,
  label = "Copy",
  compact = false,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [announce, setAnnounce] = useState("");

  if (!value.trim()) {
    return null;
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value.trim());
      setCopied(true);
      setAnnounce("Copied to clipboard.");
      window.setTimeout(() => {
        setCopied(false);
        setAnnounce("");
      }, 1200);
    } catch {
      setCopied(false);
      setAnnounce("Copy failed.");
      window.setTimeout(() => setAnnounce(""), 1200);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void onCopy();
        }}
        className={cn(
          "shrink-0 rounded-sm text-muted transition-ui hover:bg-elevated hover:text-foreground",
          "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
          compact
            ? "inline-flex min-h-9 min-w-9 items-center justify-center px-1 font-mono text-xs leading-none max-md:min-h-10 max-md:min-w-10"
            : "px-1.5 py-0.5 text-xs min-h-8",
          className,
        )}
        aria-label={copied ? "Copied" : `${label} ${value}`}
        title={copied ? "Copied" : label}
      >
        {copied ? "✓" : compact ? "⎘" : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </>
  );
}
