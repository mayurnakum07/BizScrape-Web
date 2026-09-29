import type { Page } from "@playwright/test";

/** Scope interactions to the scrape configuration form (not the site header). */
export function scrapeForm(page: Page) {
  return page.locator("form").first();
}

async function pickSearchable(
  page: Page,
  form: ReturnType<typeof scrapeForm>,
  fieldId: string,
  value: string,
): Promise<void> {
  await form.locator(`#${fieldId}`).click();
  const searchInput = page.locator('input[type="search"]').last();
  await searchInput.fill(value);
  await page.getByRole("option", { name: value, exact: true }).click();
}

export async function fillScrapeForm(
  page: Page,
  input: {
    businessType: string;
    country?: string;
    state?: string;
    city: string;
    target?: string;
  },
): Promise<void> {
  const form = scrapeForm(page);
  await form.getByRole("textbox", { name: "Business category" }).fill(input.businessType);

  await pickSearchable(page, form, "country", input.country ?? "India");
  await pickSearchable(page, form, "state", input.state ?? "Gujarat");
  await pickSearchable(page, form, "city", input.city);

  if (input.target !== undefined) {
    await form
      .getByRole("spinbutton", { name: "Target count" })
      .fill(input.target);
  }
}

export async function submitScrapeForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Start scrape" }).click();
}

/** After modal submit, open the full job workspace (dev tools / deep job UI). */
export async function openFullJobWorkspace(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Open full workspace" }).click();
  await page.waitForURL(/\/scrape\/job\//);
}
