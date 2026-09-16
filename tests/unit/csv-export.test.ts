import { describe, expect, it } from "vitest";

import {
  CSV_COLUMN_COUNT,
  CSV_COLUMNS,
} from "@/services/export/csv/schema";
import {
  escapeCsvField,
  inspectCsv,
  serializeRecordsToCsv,
} from "@/services/export/csv/serialize";
import { generateCsv } from "@/services/export/csv";
import { neutralizeCsvFormula } from "@/services/export/csv/formula";
import type { BusinessRecord } from "@/types/business-record";
import { AppError } from "@/lib/errors";

function record(partial: Partial<BusinessRecord> & Pick<BusinessRecord, "company_name">): BusinessRecord {
  return {
    id: partial.id ?? "r1",
    company_name: partial.company_name,
    website: partial.website ?? "",
    email_primary: partial.email_primary ?? "",
    emails_all: partial.emails_all ?? "",
    phone_primary: partial.phone_primary ?? "",
    phones_all: partial.phones_all ?? "",
    address: partial.address ?? "",
    area: partial.area ?? "",
    category: partial.category ?? "",
    rating: partial.rating ?? "",
    review_count: partial.review_count ?? "",
    linkedin: partial.linkedin ?? "",
    facebook: partial.facebook ?? "",
    instagram: partial.instagram ?? "",
    sources: partial.sources ?? "gmaps",
    maps_url: partial.maps_url ?? "",
    first_seen: partial.first_seen ?? "",
    last_enriched: partial.last_enriched ?? "",
  };
}

describe("CSV schema", () => {
  it("defines exactly 18 columns in documented order", () => {
    expect(CSV_COLUMN_COUNT).toBe(18);
    expect(CSV_COLUMNS).toEqual([
      "company_name",
      "website",
      "email_primary",
      "emails_all",
      "phone_primary",
      "phones_all",
      "address",
      "area",
      "category",
      "rating",
      "review_count",
      "linkedin",
      "facebook",
      "instagram",
      "sources",
      "maps_url",
      "first_seen",
      "last_enriched",
    ]);
  });
});

describe("CSV serialization", () => {
  it("exports header and two data rows with correct column order", () => {
    const csv = serializeRecordsToCsv(
      [
        record({ company_name: "Alpha Cafe", website: "https://alpha.example" }),
        record({
          id: "r2",
          company_name: "Beta Cafe",
          email_primary: "hello@beta.example",
        }),
      ],
      { withBom: true },
    );

    const inspection = inspectCsv(csv);
    expect(inspection.hasBom).toBe(true);
    expect(inspection.header).toEqual([...CSV_COLUMNS]);
    expect(inspection.rowCount).toBe(2);
    expect(inspection.rows[0]?.[0]).toBe("Alpha Cafe");
    expect(inspection.rows[0]?.[1]).toBe("https://alpha.example");
    expect(inspection.rows[1]?.[0]).toBe("Beta Cafe");
    expect(inspection.rows[1]?.[2]).toBe("hello@beta.example");
  });

  it("preserves empty optional fields as empty cells", () => {
    const csv = serializeRecordsToCsv(
      [record({ company_name: "Sparse Cafe" })],
      { withBom: false },
    );
    const inspection = inspectCsv(csv);
    expect(inspection.rows[0]).toHaveLength(18);
    expect(inspection.rows[0]?.[1]).toBe("");
    expect(inspection.rows[0]?.[2]).toBe("");
  });

  it("quotes values containing commas", () => {
    expect(escapeCsvField("Cafe, Restaurant")).toBe('"Cafe, Restaurant"');
    const csv = serializeRecordsToCsv(
      [record({ company_name: "Cafe, Restaurant" })],
      { withBom: false },
    );
    expect(csv).toContain('"Cafe, Restaurant"');
  });

  it("escapes embedded quotes", () => {
    expect(escapeCsvField('"Special Cafe"')).toBe('"""Special Cafe"""');
  });

  it("quotes values containing newlines", () => {
    const value = "Line 1\nLine 2";
    expect(escapeCsvField(value)).toBe('"Line 1\nLine 2"');
    const csv = serializeRecordsToCsv(
      [record({ company_name: "Cafe", address: value })],
      { withBom: false },
    );
    const inspection = inspectCsv(csv);
    expect(inspection.rowCount).toBe(1);
    expect(inspection.rows[0]?.[6]).toBe(value);
  });

  it("preserves Unicode business names", () => {
    const csv = serializeRecordsToCsv(
      [
        record({ company_name: "શ્રી ગણેશ કેફે" }),
        record({ id: "r2", company_name: "मुंबई टेक्नोलॉजी" }),
        record({ id: "r3", company_name: "Café" }),
      ],
      { withBom: true },
    );
    const inspection = inspectCsv(csv);
    expect(inspection.rows[0]?.[0]).toBe("શ્રી ગણેશ કેફે");
    expect(inspection.rows[1]?.[0]).toBe("मुंबई टेक्नोलॉजी");
    expect(inspection.rows[2]?.[0]).toBe("Café");
  });

  it("preserves multi-value semicolon fields as strings", () => {
    const emails = "a@example.com; b@example.com";
    const csv = serializeRecordsToCsv(
      [record({ company_name: "Multi", emails_all: emails })],
      { withBom: false },
    );
    const inspection = inspectCsv(csv);
    expect(inspection.rows[0]?.[3]).toBe(emails);
  });

  it("neutralizes spreadsheet formula prefixes", () => {
    expect(neutralizeCsvFormula("=1+2")).toBe("'=1+2");
    expect(neutralizeCsvFormula("+123")).toBe("'+123");
    expect(neutralizeCsvFormula("-total")).toBe("'-total");
    expect(neutralizeCsvFormula("@cmd")).toBe("'@cmd");
    expect(neutralizeCsvFormula("normal")).toBe("normal");
  });
});

describe("generateCsv", () => {
  it("rejects empty datasets", () => {
    expect(() =>
      generateCsv({
        records: [],
        config: { city: "Surat", businessType: "Cafe" },
      }),
    ).toThrow(AppError);

    try {
      generateCsv({
        records: [],
        config: { city: "Surat", businessType: "Cafe" },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("CSV_EMPTY_DATASET");
      expect((error as AppError).message).toBe("No data available for export.");
    }
  });

  it("returns filename and record count for a valid dataset", () => {
    const result = generateCsv({
      records: [record({ company_name: "Cafe" })],
      config: { city: "Surat", businessType: "Cafe" },
      date: new Date(2026, 8, 16),
    });
    expect(result.recordCount).toBe(1);
    expect(result.filename).toBe("surat_cafe_2026-09-16.csv");
    expect(result.csv.startsWith("\uFEFF")).toBe(true);
  });
});
