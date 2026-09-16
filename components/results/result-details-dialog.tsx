"use client";

import { ResultDetails } from "@/components/results/result-details";
import { Dialog } from "@/components/ui/dialog";
import type { BusinessRecord } from "@/types/business-record";

type ResultDetailsDialogProps = {
  record: BusinessRecord | null;
  onClose: () => void;
};

export function ResultDetailsDialog({
  record,
  onClose,
}: ResultDetailsDialogProps) {
  return (
    <Dialog
      open={Boolean(record)}
      onClose={onClose}
      title={record?.company_name ?? "Business details"}
      description="Review the selected business details, contact information, and coverage."
      className="w-[min(100%-2rem,36rem)] sm:max-w-lg"
    >
      {record ? <ResultDetails record={record} /> : null}
    </Dialog>
  );
}
