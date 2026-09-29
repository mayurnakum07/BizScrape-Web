"use client";

import { memo, type ReactNode } from "react";

import { CopyButton } from "@/components/results/copy-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RESULTS_COLUMNS,
  type ResultsColumnId,
  type ResultsDensity,
} from "@/components/results/results-columns";
import type { ResultsSortKey } from "@/components/results/results-toolbar";
import { IconExternalLink } from "@/components/icons";
import { cn } from "@/lib/cn";
import { RESULTS_TABLE_CLASSES } from "@/lib/responsive";
import {
  hasEmail,
  hasPhone,
  hasWebsite,
  normalizeExternalUrl,
  primaryEmail,
  websiteHostname,
  type BusinessRecord,
} from "@/types/business-record";
import { type } from "os";

type ResultsTableProps = {
  records: BusinessRecord[];
  onSelect: (record: BusinessRecord) => void;
  density?: ResultsDensity;
  visibleColumns?: ResultsColumnId[];
  sort?: ResultsSortKey;
  onSortChange?: (sort: ResultsSortKey) => void;
  activeRecordId?: string | null;
};

function Missing() {
  return (
    <span className="text-muted" aria-label="Missing">
      -
    </span>
  );
}

function CellActions({ children }: { children: ReactNode }) {
  return (
    <div className="results-cell-actions flex min-w-0 items-center gap-1">
      {children}
    </div>
  );
}

function SortHeader({
  label,
  active,
  sortDirection,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  sortDirection?: "ascending" | "descending";
  onClick?: () => void;
  align?: "left" | "right";
}) {
  if (!onClick) {
    return <span>{label}</span>;
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-9 items-center gap-1 transition-ui hover:text-foreground",
        "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
        align === "right" && "ml-auto",
        active ? "text-foreground" : "text-muted",
      )}
      onClick={onClick}
      aria-pressed={active}
      aria-label={
        active && sortDirection
          ? `${label}, sorted ${sortDirection}`
          : `Sort by ${label}`
      }
    >
      {label}
      <span className="font-mono text-xs" aria-hidden="true">
        {active ? "▾" : "·"}
      </span>
    </button>
  );
}

function columnSortKey(id: ResultsColumnId): ResultsSortKey | null {
  if (id === "company") return "company_name";
  if (id === "rating") return "rating";
  return null;
}

export const ResultsTable = memo(function ResultsTable({
  records,
  onSelect,
  density = "compact",
  visibleColumns,
  sort = "company_name",
  onSortChange,
  activeRecordId = null,
}: ResultsTableProps) {
  const columns = RESULTS_COLUMNS.filter((column) =>
    visibleColumns
      ? visibleColumns.includes(column.id)
      : column.defaultVisible,
  );

  return (
    <div className={RESULTS_TABLE_CLASSES}>
      <div className="results-table-scroll">
        <Table
          className={cn(
            "results-data-table w-full min-w-[44rem] text-left",
            density === "compact"
              ? "results-data-table-compact"
              : "results-data-table-comfortable",
          )}
        >
          <caption className="sr-only">
            Scraped business results with contact details, location, rating, and
            coverage.
          </caption>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const sortKey = column.sortable ? columnSortKey(column.id) : null;
                const isActive = Boolean(sortKey && sort === sortKey);
                const sortDirection =
                  sortKey === "company_name"
                    ? ("ascending" as const)
                    : ("descending" as const);
                const hideClass =
                  column.hideBelow === "lg"
                    ? "hidden lg:table-cell"
                    : column.hideBelow === "xl"
                      ? "hidden xl:table-cell"
                      : undefined;

                return (
                  <TableHead
                    key={column.id}
                    scope="col"
                    aria-sort={
                      sortKey
                        ? isActive
                          ? sortDirection
                          : "none"
                        : undefined
                    }
                    className={cn(
                      "results-th",
                      column.id === "company" && "results-th-sticky",
                      column.widthClass,
                      column.align === "right" && "text-right",
                      hideClass,
                    )}
                  >
                    <SortHeader
                      label={column.label}
                      active={isActive}
                      sortDirection={isActive ? sortDirection : undefined}
                      align={column.align}
                      onClick={
                        sortKey && onSortChange
                          ? () => {
                              if (sortKey === "rating" && sort === "rating") {
                                onSortChange("review_count");
                                return;
                              }
                              onSortChange(sortKey);
                            }
                          : undefined
                      }
                    />
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const email = primaryEmail(record);
              const host = websiteHostname(record.website);

              return (
                <TableRow
                  key={record.id}
                  className="results-tr hover:bg-muted/50 cursor-pointer"
                >
                  {columns.map((column) => {
                    const hideClass =
                      column.hideBelow === "lg"
                        ? "hidden lg:table-cell"
                        : column.hideBelow === "xl"
                          ? "hidden xl:table-cell"
                          : undefined;

                    return (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "results-td",
                          column.id === "company" && "results-td-sticky",
                          column.align === "right" && "text-right",
                          hideClass,
                        )}
                      >
                        {column.id === "company" ? (
                          <button
                            type="button"
                            onClick={() => onSelect(record)}
                            className={cn(
                              "max-w-full text-left font-medium text-foreground break-anywhere hover:text-primary hover:underline",
                              "focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-primary",
                            )}
                          >
                            {record.company_name.trim() || "Untitled"}
                          </button>
                        ) : null}

                        {column.id === "website" ? (
                          host ? (
                            <CellActions>
                              <a
                                href={normalizeExternalUrl(record.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="results-link inline-flex min-w-0 max-w-[9rem] items-center gap-1 truncate text-primary"
                                aria-label={`Open website for ${record.company_name} in a new tab`}
                                title={record.website}
                              >
                                <span className="truncate">{host}</span>
                                <IconExternalLink size={12} className="opacity-70" />
                                <span className="sr-only"> (opens in a new tab)</span>
                              </a>
                              <CopyButton value={record.website} compact />
                            </CellActions>
                          ) : (
                            <Missing />
                          )
                        ) : null}

                        {column.id === "email" ? (
                          email ? (
                            <CellActions>
                              <a
                                href={`mailto:${email}`}
                                className="results-link max-w-[11rem] truncate"
                                aria-label={`Email ${record.company_name} at ${email}`}
                                title={email}
                              >
                                {email}
                              </a>
                              <CopyButton value={email} compact />
                            </CellActions>
                          ) : (
                            <Missing />
                          )
                        ) : null}

                        {column.id === "phone" ? (
                          record.phone_primary.trim() ? (
                            <CellActions>
                              <a
                                href={`tel:${record.phone_primary.replace(/\s+/g, "")}`}
                                className="results-link font-mono text-xs tabular-nums"
                                aria-label={`Call ${record.company_name} at ${record.phone_primary}`}
                              >
                                {record.phone_primary}
                              </a>
                              <CopyButton value={record.phone_primary} compact />
                            </CellActions>
                          ) : (
                            <Missing />
                          )
                        ) : null}

                        {column.id === "area" ? (
                          record.area.trim() ? (
                            <span
                              className="block truncate text-muted"
                              title={record.area}
                            >
                              {record.area}
                            </span>
                          ) : (
                            <Missing />
                          )
                        ) : null}

                        {column.id === "category" ? (
                          record.category.trim() ? (
                            <span
                              className="block truncate text-muted"
                              title={record.category}
                            >
                              {record.category}
                            </span>
                          ) : (
                            <Missing />
                          )
                        ) : null}

                        {column.id === "rating" ? (
                          record.rating.trim() ? (
                            <span className="font-mono text-xs tabular-nums">
                              {record.rating}
                              <span className="text-muted">
                                {" "}
                                · {record.review_count || "0"}
                              </span>
                            </span>
                          ) : (
                            <Missing />
                          )
                        ) : null}

                        {column.id === "coverage" ? (
                          <span
                            className="font-mono text-[0.65rem] tracking-wide text-muted"
                            aria-label={[
                              hasWebsite(record) ? "Has website" : "No website",
                              hasEmail(record) ? "Has email" : "No email",
                              hasPhone(record) ? "Has phone" : "No phone",
                            ].join(", ")}
                          >
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
                        ) : null}

                        {column.id === "address" ? (
                          record.address.trim() ? (
                            <span
                              className="block truncate text-muted"
                              title={record.address}
                            >
                              {record.address}
                            </span>
                          ) : (
                            <Missing />
                          )
                        ) : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
