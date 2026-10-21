import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 1,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://signalaf.com",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // owner 2026-10-21: phone specs run only in the mobile projects below
      testIgnore: /e2e\/mobile\//,
    },
    // Mobile projects (owner 2026-10-21 mobile foundation): real phone emulation,
    // 390x844 iPhone on WebKit and a 412x915 Pixel on Chromium.
    {
      name: "mobile-webkit",
      use: { ...devices["iPhone 13"] },
      testMatch: /e2e\/mobile\/.*\.spec\.ts/,
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      testMatch: /e2e\/mobile\/.*\.spec\.ts/,
    },
  ],
});
