"use client";

import { memo } from "react";

import {
  hasEmail,
  hasPhone,
  hasWebsite,
  primaryEmail,
  websiteHostname,
  type BusinessRecord,
} from "@/types/business-record";
import { RESULTS_CARDS_CLASSES } from "@/lib/responsive";
import { cn } from "@/lib/cn";

type ResultsCardsProps = {
  records: BusinessRecord[];
  onSelect: (record: BusinessRecord) => void;
  selectedIds?: ReadonlySet<string>;
  onToggleSelect?: (id: string) => void;
};

export const ResultsCards = memo(function ResultsCards({
  records,
  onSelect,
  selectedIds,
  onToggleSelect,
}: ResultsCardsProps) {
  const selectionEnabled = Boolean(onToggleSelect && selectedIds);

  return (
    <ul className={RESULTS_CARDS_CLASSES}>
      {records.map((record) => {
        const email = primaryEmail(record);
        const host = websiteHostname(record.website);
        const selected = selectedIds?.has(record.id) ?? false;

        return (
          <li key={record.id}>
            <div
              data-selected={selected ? "true" : undefined}
              className={cn(
                "border border-border bg-elevated transition-ui",
                selected && "border-primary/40 bg-primary-muted",
              )}
            >
              <div className="flex items-start gap-2 p-3.5 pb-0">
                {selectionEnabled ? (
                  <label className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={selected}
                      onChange={() => onToggleSelect?.(record.id)}
                      aria-label={`Select ${record.company_name}`}
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(record)}
                  aria-label={`View details for ${record.company_name}`}
                  className={cn(
                    "min-w-0 flex-1 rounded-sm text-left transition-ui",
                    "hover:bg-surface-hover active:bg-surface-hover",
                    "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
                  )}
                >
                  <p className="font-medium text-foreground break-anywhere">
                    {record.company_name.trim() || "Untitled"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {[record.area, record.category].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSelect(record)}
                className={cn(
                  "w-full px-3.5 pt-3 pb-3.5 text-left transition-ui",
                  "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
                )}
              >
                <dl className="space-y-1.5 text-sm">
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                    <dt className="text-label text-muted">Web</dt>
                    <dd className="truncate text-right text-primary">
                      {host || "—"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                    <dt className="text-label text-muted">Phone</dt>
                    <dd className="truncate text-right font-mono text-xs">
                      {record.phone_primary.trim() || "—"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                    <dt className="text-label text-muted">Email</dt>
                    <dd className="truncate text-right">{email || "—"}</dd>
                  </div>
                </dl>
                <p className="mt-3 font-mono text-xs text-muted">
                  <span className={cn(hasWebsite(record) && "text-success")}>
                    W
                  </span>
                  <span className="mx-1 text-border">·</span>
                  <span className={cn(hasEmail(record) && "text-success")}>
                    E
                  </span>
                  <span className="mx-1 text-border">·</span>
                  <span className={cn(hasPhone(record) && "text-success")}>
                    P
                  </span>
                </p>
                <p className="mt-2.5 text-sm font-medium text-primary">
                  View details →
                </p>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
});
