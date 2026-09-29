/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { CancellationDialog } from "@/components/errors/cancellation-dialog";
import { ResultDetailsDrawer } from "@/components/results/result-details-drawer";
import { ResultsExportActions } from "@/components/results/results-export-actions";
import { SourceSelector } from "@/components/scrape/source-selector";
import type { BusinessRecord } from "@/types/business-record";

const sampleRecord: BusinessRecord = {
  id: "rec-1",
  company_name: "Sample Cafe",
  website: "https://samplecafe.example",
  email_primary: "hello@samplecafe.example",
  emails_all: "",
  phone_primary: "+91 98765 43210",
  phones_all: "",
  address: "Sample Street",
  area: "Vesu",
  category: "Cafe",
  rating: "4.5",
  review_count: "120",
  linkedin: "",
  facebook: "",
  instagram: "",
  sources: "gmaps",
  maps_url: "",
  first_seen: "2026-01-01T00:00:00Z",
  last_enriched: "2026-01-02T00:00:00Z",
};

describe("accessibility regressions", () => {
  it("moves focus into detail drawers when they open", async () => {
    render(<ResultDetailsDrawer record={sampleRecord} onClose={() => {}} />);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  it("announces accessible source selection and has no axe violations", async () => {
    const { container } = render(
      <SourceSelector value={["gmaps"]} onChange={() => {}} />,
    );

    expect(screen.getByText("Discovery source")).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("renders export controls without accessibility violations", async () => {
    const { container } = render(
      <ResultsExportActions
        records={[sampleRecord]}
        config={{ city: "Surat", businessType: "Cafe", area: "Vesu" }}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Download CSV for 1 businesses/i }),
    ).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("keeps the cancellation dialog keyboard accessible", async () => {
    const onKeepRunning = vi.fn();
    const onConfirmStop = vi.fn();
    const { container } = render(
      <CancellationDialog
        open
        collectedCount={12}
        onKeepRunning={onKeepRunning}
        onConfirmStop={onConfirmStop}
      />,
    );

    const stop = screen.getByRole("button", { name: "Stop scrape" });
    const keepRunning = screen.getByRole("button", { name: "Keep running" });

    expect(stop).toBeInTheDocument();
    fireEvent.click(keepRunning);
    expect(onKeepRunning).toHaveBeenCalled();
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
