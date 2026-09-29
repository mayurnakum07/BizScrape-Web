"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  PAGE_SIZE_OPTIONS,
  type ResultsPageSize,
} from "@/components/results/results-columns";

type ResultsPaginationProps = {
  page: number;
  pageCount: number;
  pageSize: ResultsPageSize;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ResultsPageSize) => void;
};

export function ResultsPagination({
  page,
  pageCount,
  pageSize,
  total,
  from,
  to,
  onPageChange,
  onPageSizeChange,
}: ResultsPaginationProps) {
  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="font-mono text-[0.7rem] text-muted">
        <span className="text-foreground tabular-nums">
          {from}–{to}
        </span>{" "}
        of <span className="tabular-nums">{total}</span>
        {pageCount > 1 ? (
          <span>
            {" "}
            · page <span className="tabular-nums">{page}</span> /{" "}
            <span className="tabular-nums">{pageCount}</span>
          </span>
        ) : null}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-xs text-muted">
          Rows
          <Select
            aria-label="Rows per page"
            value={String(pageSize)}
            className="h-9 w-[4.75rem]"
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value) as ResultsPageSize)
            }
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>

        <Button
          size="sm"
          variant="outline"
          className="min-h-9"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="min-h-9"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
