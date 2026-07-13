import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { lighthouseBudgets } from "../../scripts/qa-gates";

describe("Lighthouse release gate", () => {
  test("keeps TECH-PLAN section 6 thresholds exact", () => {
    expect(lighthouseBudgets).toEqual({
      performance: 0.9,
      accessibility: 0.95,
      bestPractices: 0.95,
      seo: 1,
      largestContentfulPaintMs: 2500,
      cumulativeLayoutShift: 0.05,
      totalBlockingTimeMs: 200,
    });
  });

  test("runs three cold mobile audits against the production preview", () => {
    const config = JSON.parse(readFileSync("lighthouserc.json", "utf8"));

    expect(config.ci.collect).toMatchObject({
      numberOfRuns: 3,
      settings: { formFactor: "mobile" },
      startServerCommand: "pnpm preview --host 127.0.0.1 --port 4343",
      url: ["http://127.0.0.1:4343/", "http://127.0.0.1:4343/features/"],
    });
  });
});
