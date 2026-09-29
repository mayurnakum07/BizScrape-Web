"use client";

import { useEffect, useMemo } from "react";

import { ResultDetails } from "@/components/results/result-details";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import type { BusinessRecord } from "@/types/business-record";

type ResultDetailsDrawerProps = {
  record: BusinessRecord | null;
  /** Ordered list used for previous/next without closing the drawer. */
  records?: BusinessRecord[];
  onClose: () => void;
  onSelect?: (record: BusinessRecord) => void;
};

export function ResultDetailsDrawer({
  record,
  records = [],
  onClose,
  onSelect,
}: ResultDetailsDrawerProps) {
  const index = useMemo(() => {
    if (!record) {
      return -1;
    }
    return records.findIndex((item) => item.id === record.id);
  }, [record, records]);

  const hasNav = Boolean(onSelect) && records.length > 1 && index >= 0;
  const previous = hasNav && index > 0 ? records[index - 1] : null;
  const next =
    hasNav && index >= 0 && index < records.length - 1
      ? records[index + 1]
      : null;

  useEffect(() => {
    if (!record || !onSelect || records.length < 2) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && previous) {
        event.preventDefault();
        onSelect?.(previous);
      }
      if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        onSelect?.(next);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [record, records.length, previous, next, onSelect]);

  const description = record
    ? [record.category, record.area].filter((part) => part.trim()).join(" · ") ||
      "Business contact and coverage details"
    : undefined;

  return (
    <Sheet open={Boolean(record)} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="sm:max-w-xl w-[500px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{record?.company_name.trim() || "Business details"}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        
        {record ? (
          <div key={record.id} className="result-details-enter pb-8">
            <ResultDetails record={record} />
          </div>
        ) : null}

        {hasNav && (
          <SheetFooter className="sm:justify-between items-center pt-4 border-t border-border mt-4">
            <p className="font-mono text-[0.7rem] text-muted-foreground w-full sm:w-auto text-left">
              Record{" "}
              <span className="tabular-nums text-foreground">{index + 1}</span>{" "}
              of{" "}
              <span className="tabular-nums text-foreground">
                {records.length}
              </span>
              <span className="ml-2 hidden text-muted-foreground sm:inline">
                ← → to navigate
              </span>
            </p>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none"
                disabled={!previous}
                onClick={() => previous && onSelect?.(previous)}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none"
                disabled={!next}
                onClick={() => next && onSelect?.(next)}
              >
                Next
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** @deprecated Prefer ResultDetailsDrawer - kept for existing imports/tests. */
export function ResultDetailsDialog(props: ResultDetailsDrawerProps) {
  return <ResultDetailsDrawer {...props} />;
}
