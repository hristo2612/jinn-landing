import { spawnSync } from "node:child_process";

import { visualGatePort } from "./qa-gates";

const args = process.argv.slice(2);
const requestsUpdate = args.some(
  (arg) =>
    arg === "--update-snapshots" || arg.startsWith("--update-snapshots="),
);

if (requestsUpdate && process.env.UPDATE_VISUAL_BASELINES !== "1") {
  console.error(
    "Refusing to update approved visual baselines. Re-run with UPDATE_VISUAL_BASELINES=1 and obtain design review before committing changes.",
  );
  process.exit(1);
}

const server = spawnSync(
  "pnpm",
  [
    "exec",
    "astro",
    "dev",
    "--background",
    "--host",
    "127.0.0.1",
    "--port",
    String(visualGatePort),
  ],
  { stdio: "inherit" },
);

if (server.status !== 0) process.exit(server.status ?? 1);

const deadline = Date.now() + 20_000;
while (true) {
  try {
    const response = await fetch(`http://127.0.0.1:${visualGatePort}/`);
    if (response.ok) break;
  } catch {
    // The background server has not bound its port yet.
  }
  if (Date.now() >= deadline) {
    spawnSync("pnpm", ["exec", "astro", "dev", "logs"], {
      stdio: "inherit",
    });
    spawnSync("pnpm", ["exec", "astro", "dev", "stop"], {
      stdio: "inherit",
    });
    console.error("Timed out waiting for the visual-gate dev server.");
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "--config",
    "playwright.visual.config.ts",
    ...(requestsUpdate && !args.some((arg) => arg.startsWith("--workers"))
      ? ["--workers=1"]
      : []),
    ...args,
  ],
  { stdio: "inherit" },
);

spawnSync("pnpm", ["exec", "astro", "dev", "stop"], { stdio: "inherit" });

process.exit(result.status ?? 1);
