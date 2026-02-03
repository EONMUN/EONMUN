import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "line",
  timeout: 60000,
  use: {
    baseURL: `http://localhost:${process.env.WEB_PORT || 3002}`,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${process.env.WEB_PORT || 3002}`,
    url: `http://localhost:${process.env.WEB_PORT || 3002}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
