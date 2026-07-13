import { defineConfig } from "@playwright/test";

import { visualGatePort } from "./scripts/qa-gates";

export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "/tmp/jinn-landing-visual-results",
  reporter: [
    ["list"],
    [
      "html",
      { outputFolder: "/tmp/jinn-landing-visual-report", open: "never" },
    ],
  ],
  snapshotPathTemplate:
    "{testDir}/baselines/{projectName}/{testFilePath}/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.001,
      scale: "device",
      threshold: 0.2,
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${visualGatePort}`,
    browserName: "chromium",
    colorScheme: "dark",
    deviceScaleFactor: 2,
    locale: "en-US",
    timezoneId: "Europe/Sofia",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-dpr2",
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-dpr2",
      use: {
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
