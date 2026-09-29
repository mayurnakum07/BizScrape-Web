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
};

export const ResultsCards = memo(function ResultsCards({
  records,
  onSelect,
}: ResultsCardsProps) {

  return (
    <ul className={RESULTS_CARDS_CLASSES}>
      {records.map((record) => {
        const email = primaryEmail(record);
        const host = websiteHostname(record.website);

        return (
          <li key={record.id}>
            <div
              className="border border-border bg-elevated transition-ui"
            >
              <div className="flex items-start gap-2 p-3.5 pb-0">
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
                      "-"}
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
                      {host || "-"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                    <dt className="text-label text-muted">Phone</dt>
                    <dd className="truncate text-right font-mono text-xs">
                      {record.phone_primary.trim() || "-"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                    <dt className="text-label text-muted">Email</dt>
                    <dd className="truncate text-right">{email || "-"}</dd>
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
