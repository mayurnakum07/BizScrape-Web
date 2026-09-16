import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.PLAYWRIGHT_PORT ?? "3001";
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

/**
 * E2E suite uses the mock job provider (NEXT_PUBLIC_API_URL unset).
 * Runs against a production Next.js build — no live Python API or Maps required.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: e2eBaseUrl,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "true",
    timeout: 180_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: "",
      NEXT_PUBLIC_SITE_URL: e2eBaseUrl,
    },
  },
});
