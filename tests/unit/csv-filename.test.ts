import { describe, expect, it } from "vitest";

import {
  buildCsvFilename,
  formatCsvDate,
  sanitizeFilenamePart,
} from "@/services/export/csv/filename";

describe("filename sanitization", () => {
  it("slugifies spaces and punctuation", () => {
    expect(sanitizeFilenamePart("Mota Varachha")).toBe("mota-varachha");
    expect(sanitizeFilenamePart("IT & Software")).toBe("it-and-software");
  });

  it("normalizes accented latin characters", () => {
    expect(sanitizeFilenamePart("Café")).toBe("cafe");
  });

  it("falls back for empty input", () => {
    expect(sanitizeFilenamePart("   ")).toBe("unknown");
  });

  it("builds city_niche_date filenames", () => {
    expect(
      buildCsvFilename({
        city: "Surat",
        niche: "Cafe",
        date: new Date(2026, 8, 16),
      }),
    ).toBe("surat_cafe_2026-09-16.csv");
  });

  it("formats dates as YYYY-MM-DD", () => {
    expect(formatCsvDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
