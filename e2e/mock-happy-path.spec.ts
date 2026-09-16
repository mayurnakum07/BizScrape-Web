import { expect, test } from "@playwright/test";

import { fillScrapeForm, submitScrapeForm } from "./helpers";

test.describe("mock provider happy path", () => {
  test("landing → form → job → results → export", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/scrape");
    await expect(
      page.getByRole("heading", { name: "Configure your scrape" }),
    ).toBeVisible();

    await fillScrapeForm(page, {
      businessType: "cafe",
      city: "Surat",
      target: "10",
    });
    await submitScrapeForm(page);

    await page.waitForURL(/\/scrape\/job\//, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Scraping completed" })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("link", { name: "View results" }).click();
    await page.waitForURL(/\/results/);
    await expect(page.getByText("Scraping results")).toBeVisible();
    await expect(page.getByRole("region", { name: "Result summary" })).toBeVisible();

    const exportButton = page.getByRole("button", { name: /download csv/i });
    await expect(exportButton).toBeEnabled({ timeout: 15_000 });
  });
});
