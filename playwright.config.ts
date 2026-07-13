import { defineConfig, devices } from "@playwright/test";

const port = 4331;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: ".playwright/results",
  reporter: [
    ["list"],
    ["html", { outputFolder: ".playwright/report", open: "never" }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: "**/scene-cross-browser.spec.ts",
    },
    {
      name: "firefox-scenes",
      testMatch: "**/scene-cross-browser.spec.ts",
      grep: /Firefox/u,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit-scenes",
      testMatch: "**/scene-cross-browser.spec.ts",
      grep: /WebKit/u,
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: `pnpm preview --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
