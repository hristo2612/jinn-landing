import { spawn } from "node:child_process";
import { gzipSync } from "node:zlib";

import { chromium } from "@playwright/test";

const host = "127.0.0.1";
const port = Number(process.env.EAGER_JS_PORT ?? 4333);
const base = `http://${host}:${port}`;
const server = spawn(
  "pnpm",
  ["preview", "--host", host, "--port", String(port)],
  { stdio: ["ignore", "pipe", "pipe"] },
);

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {
      // The preview process has not bound its socket yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Preview did not become ready at ${base}`);
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    const bodies = new Map<string, Buffer>();
    const reads: Promise<void>[] = [];
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin !== base || !url.pathname.endsWith(".js")) return;
      reads.push(
        response.body().then((body) => {
          bodies.set(url.pathname, body);
        }),
      );
    });

    // Both product pages settle when their first independent scene owns a
    // player. No scroll scheduler or pinned controller participates.
    const pagePath = process.env.EAGER_JS_PATH ?? "/";
    await page.goto(base + pagePath, { waitUntil: "load" });
    await page
      .locator("[data-scene-window][data-scene-player-state]")
      .first()
      .waitFor({ state: "attached" });
    await Promise.all(reads);

    const manifest = Array.from(bodies, ([path, body]) => ({
      path,
      bytes: body.byteLength,
      gzipBytes: gzipSync(body, { level: 9 }).byteLength,
    })).sort((left, right) => left.path.localeCompare(right.path));
    const total = manifest.reduce((sum, entry) => sum + entry.gzipBytes, 0);

    console.log(
      JSON.stringify({ manifest, total, kib: total / 1024 }, null, 2),
    );
  } finally {
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}
