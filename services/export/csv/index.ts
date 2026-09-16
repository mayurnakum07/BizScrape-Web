import { AppError } from "@/lib/errors";
import { buildCsvFilename } from "@/services/export/csv/filename";
import { serializeRecordsToCsv } from "@/services/export/csv/serialize";
import type { BusinessRecord } from "@/types/business-record";
import type { ScrapeConfig } from "@/types/scrape";

export type CsvExportRequest = {
  records: BusinessRecord[];
  config: Pick<ScrapeConfig, "city" | "businessType">;
  /** Optional fixed date for deterministic filenames in tests. */
  date?: Date;
};

export type CsvExportResult = {
  filename: string;
  csv: string;
  recordCount: number;
  mimeType: "text/csv;charset=utf-8";
};

/**
 * Generate CSV text + filename for the complete result set.
 * Does not apply UI search/filter — callers must pass the full job records.
 */
export function generateCsv(request: CsvExportRequest): CsvExportResult {
  if (request.records.length === 0) {
    throw new AppError("No data available for export.", {
      code: "CSV_EMPTY_DATASET",
      status: 400,
    });
  }

  try {
    const csv = serializeRecordsToCsv(request.records, { withBom: true });
    const filename = buildCsvFilename({
      city: request.config.city,
      niche: request.config.businessType,
      date: request.date,
    });

    return {
      filename,
      csv,
      recordCount: request.records.length,
      mimeType: "text/csv;charset=utf-8",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("CSV export failed.", {
      code: "CSV_EXPORT_FAILED",
      status: 500,
    });
  }
}

/**
 * Trigger a browser download for a generated CSV.
 * Transport-agnostic: later can swap Blob for a backend URL/stream.
 */
export function downloadCsv(exportResult: CsvExportResult): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new AppError("CSV download is only available in the browser.", {
      code: "CSV_DOWNLOAD_UNAVAILABLE",
      status: 500,
    });
  }

  const blob = new Blob([exportResult.csv], { type: exportResult.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exportResult.filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Convenience: generate + download the complete result set.
 */
export function exportAndDownloadCsv(request: CsvExportRequest): CsvExportResult {
  const result = generateCsv(request);
  downloadCsv(result);
  return result;
}
