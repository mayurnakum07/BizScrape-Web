import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("docs/images", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto("http://localhost:3000/scrape", { waitUntil: "networkidle" });
await page.getByRole("textbox", { name: "Business category" }).fill("cafe");
// Country defaults to India in the modal; pick state + city.
await page.locator("#state").click();
await page.locator('input[type="search"]').last().fill("Gujarat");
await page.getByRole("option", { name: "Gujarat", exact: true }).click();
await page.locator("#city").click();
await page.locator('input[type="search"]').last().fill("Surat");
await page.getByRole("option", { name: "Surat", exact: true }).click();
await page.getByRole("spinbutton", { name: "Target count" }).fill("10");
await page.locator("form").first().getByRole("button", { name: "Start scrape" }).click();

try {
  await page.waitForURL(/\/scrape\?job=/, { timeout: 15_000 });
  await page.getByRole("link", { name: "Open full workspace" }).click();
  await page.waitForURL(/\/scrape\/job\//, { timeout: 15_000 });
  console.log("job url", page.url());
  await page.waitForTimeout(2200);
  await page.screenshot({ path: "docs/images/03-job.png" });

  await page.getByRole("heading", { name: "Scraping completed" }).waitFor({ timeout: 45_000 });
  await page.screenshot({ path: "docs/images/03b-job-complete.png" });

  await page.getByRole("link", { name: "View results" }).click();
  await page.waitForURL(/\/results/);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "docs/images/04-results.png" });

  // Results workspace — table is the primary viewport focus.
  console.log("captured job + results");
} catch (error) {
  console.error("capture failed:", error instanceof Error ? error.message : error);
  await page.screenshot({ path: "docs/images/03-submit-fail.png" });
  const alerts = await page.locator("[role=alert]").allTextContents();
  console.log("alerts:", alerts);
  process.exitCode = 1;
}

await browser.close();
