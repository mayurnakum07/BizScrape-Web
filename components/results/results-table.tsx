"use client";

import { memo } from "react";

import { CopyButton } from "@/components/results/copy-button";
import {
  hasEmail,
  hasPhone,
  hasWebsite,
  normalizeExternalUrl,
  primaryEmail,
  websiteHostname,
  type BusinessRecord,
} from "@/types/business-record";
import { RESULTS_TABLE_CLASSES } from "@/lib/responsive";
import { cn } from "@/lib/cn";

type ResultsTableProps = {
  records: BusinessRecord[];
  onSelect: (record: BusinessRecord) => void;
};

export const ResultsTable = memo(function ResultsTable({
  records,
  onSelect,
}: ResultsTableProps) {
  return (
    <div className={RESULTS_TABLE_CLASSES}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <caption className="sr-only">
            Scraped business results with contact details, location, rating, and coverage.
          </caption>
          <thead className="sticky top-0 z-[1] bg-background-elevated text-left text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-medium">Company</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Website</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Email</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Phone</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Area</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Category</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Rating</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const email = primaryEmail(record);
              const host = websiteHostname(record.website);

              return (
                <tr
                  key={record.id}
                  className="border-t border-border-subtle transition-ui hover:bg-surface-hover"
                >
                  <td className="px-3 py-2.5 align-top">
                    <button
                      type="button"
                      onClick={() => onSelect(record)}
                      className="text-left font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {record.company_name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    {host ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={normalizeExternalUrl(record.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-[10rem] truncate text-primary hover:underline"
                          aria-label={`Open website for ${record.company_name} in a new tab`}
                          title={record.website}
                        >
                          {host}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                        <CopyButton value={record.website} label="Copy" />
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    {email ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={`mailto:${email}`}
                          className="max-w-[11rem] truncate hover:underline"
                          aria-label={`Email ${record.company_name} at ${email}`}
                        >
                          {email}
                        </a>
                        <CopyButton value={email} />
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top font-mono text-xs">
                    {record.phone_primary.trim() ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${record.phone_primary.replace(/\s+/g, "")}`}
                          className="hover:underline"
                          aria-label={`Call ${record.company_name} at ${record.phone_primary}`}
                        >
                          {record.phone_primary}
                        </a>
                        <CopyButton value={record.phone_primary} />
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top text-muted">
                    {record.area.trim() || "—"}
                  </td>
                  <td className="px-3 py-2.5 align-top text-muted">
                    {record.category.trim() || "—"}
                  </td>
                  <td className="px-3 py-2.5 align-top font-mono text-xs tabular-nums">
                    {record.rating.trim() ? (
                      <>
                        {record.rating}
                        <span className="text-muted">
                          {" "}
                          · {record.review_count || "0"}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <span className="font-mono text-[0.65rem] text-muted">
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
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
