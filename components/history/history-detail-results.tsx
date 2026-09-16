"use client";

import { useMemo, useState } from "react";

import { ResultDetailsDialog } from "@/components/results/result-details-dialog";
import { ResultsCards } from "@/components/results/results-cards";
import { ResultsTable } from "@/components/results/results-table";
import type { BusinessRecord } from "@/types/business-record";
import type { StoredScrape } from "@/services/scrape-history/idb";

type HistoryDetailResultsProps = {
  item: StoredScrape;
};

export function HistoryDetailResults({ item }: HistoryDetailResultsProps) {
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const records = useMemo(() => item.records, [item.records]);

  return (
    <>
      <div className="hidden md:block">
        <ResultsTable records={records} onSelect={setSelected} />
      </div>
      <div className="md:hidden">
        <ResultsCards records={records} onSelect={setSelected} />
      </div>
      <ResultDetailsDialog
        record={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
