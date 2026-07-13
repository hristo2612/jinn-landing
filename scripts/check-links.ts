import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { LinkChecker } from "linkinator";

interface LinkResultLike {
  url: string;
  status?: number;
  state: string;
}

const HOST = "127.0.0.1";
const PORT = 4322;
const ORIGIN = `http://${HOST}:${PORT}`;
const REQUIRED_URLS = [
  `${ORIGIN}/`,
  `${ORIGIN}/docs/`,
  `${ORIGIN}/agents.md`,
  `${ORIGIN}/llms.txt`,
];

export function previewProcessSpec(
  host: string,
  port: number,
  cwd = process.cwd(),
): { args: string[]; command: string } {
  return {
    command: process.execPath,
    args: [
      "--import",
      "tsx",
      resolve(cwd, "scripts/preview.ts"),
      "--host",
      host,
      "--port",
      String(port),
    ],
  };
}

function normalizeUrl(url: string): string {
  return new URL(url).href;
}

export function assertValidLinkScan(
  results: LinkResultLike[],
  requiredUrls: string[],
): void {
  const internalResults = results.filter(
    (result) => new URL(result.url).origin === ORIGIN,
  );

  if (internalResults.length === 0) {
    throw new Error("Link gate discovered zero internal URLs.");
  }

  for (const requiredUrl of requiredUrls.map(normalizeUrl)) {
    const result = internalResults.find(
      ({ url }) => normalizeUrl(url) === requiredUrl,
    );
    if (!result)
      throw new Error(`Required internal URL was not scanned: ${requiredUrl}`);
    if (result.state !== "OK" || (result.status ?? 500) >= 400) {
      throw new Error(
        `Required internal URL is broken: ${requiredUrl} (${result.status ?? "no status"})`,
      );
    }
  }

  const broken = internalResults.filter(
    ({ state, status }) =>
      state === "BROKEN" || (status !== undefined && status >= 400),
  );
  if (broken.length > 0) {
    throw new Error(
      `Link gate found broken internal URLs: ${broken.map(({ url }) => url).join(", ")}`,
    );
  }
}

async function waitForPreview(
  process: ChildProcess,
  logs: () => string,
): Promise<void> {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      throw new Error(`Preview exited before becoming ready.\n${logs()}`);
    }

    try {
      const response = await fetch(`${ORIGIN}/`);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Preview did not become ready within 10 seconds.\n${logs()}`);
}

async function stopPreview(process: ChildProcess): Promise<void> {
  if (process.exitCode !== null) return;

  const exited = new Promise<void>((resolve) =>
    process.once("exit", () => resolve()),
  );
  process.kill("SIGTERM");
  await Promise.race([
    exited,
    new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
  ]);
  if (process.exitCode === null) process.kill("SIGKILL");
}

async function main(): Promise<void> {
  const spec = previewProcessSpec(HOST, PORT);
  const preview = spawn(spec.command, spec.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  preview.stdout?.on("data", (chunk) => (output += chunk.toString()));
  preview.stderr?.on("data", (chunk) => (output += chunk.toString()));

  try {
    await waitForPreview(preview, () => output);

    const checker = new LinkChecker();
    const results = await checker.check({
      path: REQUIRED_URLS,
      recurse: true,
      checkCss: true,
      timeout: 10_000,
      linksToSkip: async (link) => new URL(link).origin !== ORIGIN,
    });

    assertValidLinkScan(results.links, REQUIRED_URLS);
    if (!results.passed) throw new Error("Linkinator reported a failed crawl.");

    const internalCount = results.links.filter(
      ({ url }) => new URL(url).origin === ORIGIN,
    ).length;
    console.log(
      `Link gate passed: ${internalCount} internal URLs scanned; all required routes are healthy.`,
    );
  } finally {
    await stopPreview(preview);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
