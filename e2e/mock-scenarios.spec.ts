import { expect, test } from "@playwright/test";

import {
  fillScrapeForm,
  openFullJobWorkspace,
  submitScrapeForm,
} from "./helpers";

async function startMockJob(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/scrape");
  await fillScrapeForm(page, {
    businessType: "cafe",
    city: "Surat",
    target: "20",
  });
  await submitScrapeForm(page);
  await expect(page).toHaveURL(/\/scrape\?job=/);
  await openFullJobWorkspace(page);
  await expect(page.getByRole("button", { name: "Simulate failure" })).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("mock provider error scenarios", () => {
  test("cancel running job reaches cancelled state", async ({ page }) => {
    await startMockJob(page);

    await page.getByRole("button", { name: "Stop scrape" }).first().click();
    await page.getByRole("button", { name: "Stop scrape" }).last().click();

    await expect(page.getByRole("heading", { name: "Scraping cancelled" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("simulate failure supports retry", async ({ page }) => {
    await startMockJob(page);

    await page.getByRole("button", { name: "Simulate failure" }).click();
    await expect(page.getByRole("button", { name: "Retry job" })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Retry job" }).click();
    await page.waitForURL(/\/scrape\/job\//);
    await expect(page.getByRole("heading", { name: "Scraping completed" })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("simulate disconnect shows reconnect banner then completes", async ({ page }) => {
    await startMockJob(page);

    await page.getByRole("button", { name: "Simulate disconnect" }).click();
    await expect(
      page.getByText("Live updates interrupted", { exact: true }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Reconnecting…", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("heading", { name: "Scraping completed" })).toBeVisible({
      timeout: 45_000,
    });
  });
});
