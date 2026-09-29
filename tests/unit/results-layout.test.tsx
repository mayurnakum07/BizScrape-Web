/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResultsCards } from "@/components/results/results-cards";
import { ResultsTable } from "@/components/results/results-table";
import type { BusinessRecord } from "@/types/business-record";

const sampleRecord: BusinessRecord = {
  id: "rec-1",
  company_name: "Sample Cafe",
  website: "https://samplecafe.example",
  email_primary: "hello@samplecafe.example",
  emails_all: "",
  phone_primary: "+1 98765 43210",
  phones_all: "",
  area: "Brooklyn",
  category: "Cafe",
  address: "Sample Street",
  rating: "4.5",
  review_count: "120",
  maps_url: "",
  linkedin: "",
  facebook: "",
  instagram: "",
  sources: "gmaps",
  first_seen: "2026-01-01T00:00:00Z",
  last_enriched: "2026-01-02T00:00:00Z",
};

describe("Results responsive presentation", () => {
  it("renders mobile cards with a details affordance", () => {
    const onSelect = vi.fn();
    render(<ResultsCards records={[sampleRecord]} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Sample Cafe/i }));
    expect(onSelect).toHaveBeenCalledWith(sampleRecord);
    expect(screen.getByText("View details →")).toBeInTheDocument();
  });

  it("renders the desktop table with column headers", () => {
    render(<ResultsTable records={[sampleRecord]} onSelect={() => {}} />);

    expect(screen.getByRole("columnheader", { name: "Company" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Sample Cafe" })).toBeInTheDocument();
  });
});
