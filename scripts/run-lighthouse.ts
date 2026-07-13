import { readdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

interface LighthouseReport {
  audits: Record<string, { numericValue?: number }>;
  categories: Record<string, { score: number | null }>;
}

const reportsDirectory = ".lighthouseci";
rmSync(reportsDirectory, { force: true, recursive: true });
rmSync("/tmp/jinn-landing-lighthouse", { force: true, recursive: true });

const result = spawnSync(
  "pnpm",
  ["exec", "lhci", "autorun", "--config=lighthouserc.json"],
  { stdio: "inherit" },
);

const reports = readdirSync(reportsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => {
    const value = JSON.parse(
      readFileSync(`${reportsDirectory}/${entry.name}`, "utf8"),
    ) as Partial<LighthouseReport>;
    return value.categories?.performance ? (value as LighthouseReport) : null;
  })
  .filter((report): report is LighthouseReport => report !== null)
  .sort(
    (left, right) =>
      (left.categories.performance.score ?? 0) -
      (right.categories.performance.score ?? 0),
  );

if (reports.length > 0) {
  const report = reports[Math.floor(reports.length / 2)];
  const category = (id: string): number =>
    Math.round((report.categories[id]?.score ?? 0) * 100);
  const audit = (id: string): number =>
    report.audits[id]?.numericValue ?? Number.NaN;

  console.log(`\nLighthouse mobile median (${reports.length} cold runs)`);
  console.log(`Performance: ${category("performance")}`);
  console.log(`Accessibility: ${category("accessibility")}`);
  console.log(`Best Practices: ${category("best-practices")}`);
  console.log(`SEO: ${category("seo")}`);
  console.log(`LCP: ${Math.round(audit("largest-contentful-paint"))} ms`);
  console.log(`CLS: ${audit("cumulative-layout-shift").toFixed(3)}`);
  console.log(`TBT: ${Math.round(audit("total-blocking-time"))} ms`);
}

process.exit(result.status ?? 1);
