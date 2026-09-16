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
            <button
              type="button"
              onClick={() => onSelect(record)}
              aria-label={`View details for ${record.company_name}`}
              className="w-full rounded-lg border border-border bg-surface p-4 text-left transition-ui hover:bg-surface-hover active:bg-surface-hover"
            >
              <p className="font-medium text-foreground break-anywhere">
                {record.company_name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {[record.area, record.category].filter(Boolean).join(" · ") ||
                  "—"}
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
                  <dt className="text-muted">Website</dt>
                  <dd className="truncate text-right">{host || "—"}</dd>
                </div>
                <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
                  <dt className="text-muted">Phone</dt>
                  <dd className="truncate text-right font-mono text-xs">
                    {record.phone_primary.trim() || "—"}
                  </dd>
                </div>
                <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
                  <dt className="text-muted">Email</dt>
                  <dd className="truncate text-right">{email || "—"}</dd>
                </div>
              </dl>
              <p className="mt-3 font-mono text-[0.65rem] text-muted">
                {hasWebsite(record) ? "Website ✓" : "Website —"}
                {" · "}
                {hasEmail(record) ? "Email ✓" : "Email —"}
                {" · "}
                {hasPhone(record) ? "Phone ✓" : "Phone —"}
              </p>
              <p className="mt-3 text-sm font-medium text-primary">
                View details →
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
});
