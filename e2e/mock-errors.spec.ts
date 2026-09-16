import { expect, test } from "@playwright/test";

import { submitScrapeForm } from "./helpers";

test.describe("error and edge UI states", () => {
  test("form validation shows accessible errors", async ({ page }) => {
    await page.goto("/scrape");
    await submitScrapeForm(page);

    await expect(page.getByText("Enter a business type.")).toBeVisible();
    await expect(page.getByText("Enter a city.")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Business type" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByRole("combobox", { name: "City" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("unknown job page renders safe not-found state", async ({ page }) => {
    await page.goto("/scrape/job/00000000-0000-0000-0000-000000000099");
    await expect(page.getByRole("heading", { name: "Job not found" })).toBeVisible({
      timeout: 15_000,
    });
  });
});
