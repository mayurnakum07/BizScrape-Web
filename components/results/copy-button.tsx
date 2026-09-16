"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({
  value,
  label = "Copy",
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
        onClick={onCopy}
        className={cn(
          "rounded px-1.5 py-0.5 text-xs text-muted transition-ui hover:bg-surface hover:text-foreground",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          className,
        )}
        aria-label={copied ? "Copied" : `${label} ${value}`}
      >
        {copied ? "Copied" : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </>
  );
}
