import { expect, test } from "@playwright/test";

import { fillScrapeForm, submitScrapeForm } from "./helpers";

test.describe("mock provider happy path", () => {
  test("landing → form → job → results → export", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/scrape");
    await expect(
      page.getByRole("heading", { name: "Start scrape" }),
    ).toBeVisible();

    await fillScrapeForm(page, {
      businessType: "cafe",
      city: "New York",
      target: "10",
    });
    await submitScrapeForm(page);

    await expect(page).toHaveURL(/\/scrape\?job=/);
    await expect(
      page.getByRole("heading", { name: "Scraping completed" }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("link", { name: "View results" }).click();
    await page.waitForURL(/\/results/);
    await expect(page.getByText("Results workspace")).toBeVisible();
    await expect(page.getByRole("region", { name: "Result summary" })).toBeVisible();

    const exportButton = page.getByRole("button", { name: /download csv/i });
    await expect(exportButton).toBeEnabled({ timeout: 15_000 });
  });
});
