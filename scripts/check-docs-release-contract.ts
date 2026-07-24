import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

import {
  assertDocumentedInlineShape,
  assertDocumentedJsonExampleShape,
} from "./lib/machine-contract";
import {
  resolveReleaseTarget,
  type ReleaseMetadata,
} from "./lib/release-target";

interface HttpResult {
  status: number;
  body: unknown;
  headers: Headers;
  text: string;
}

const release = JSON.parse(
  fs.readFileSync("src/data/release.json", "utf8"),
) as ReleaseMetadata;
const target = resolveReleaseTarget(release);
const docsRoot = path.resolve("src/content/docs/docs");
const machine = fs.readFileSync("src/content/machine/agents.md", "utf8");
const filesAndMedia = fs.readFileSync(
  path.join(docsRoot, "reference/gateway-api/files-and-media.md"),
  "utf8",
);
const enginesAndLimits = fs.readFileSync(
  path.join(docsRoot, "reference/gateway-api/engines-and-limits.md"),
  "utf8",
);
const migrationDocs = [
  "getting-started/update-and-migrate.md",
  "reference/cli/migrations.md",
]
  .map((page) => fs.readFileSync(path.join(docsRoot, page), "utf8"))
  .join("\n");
const expectedChecks = 59;
let completed = 0;

function run(
  command: string,
  args: string[],
  env = process.env,
  cwd = process.cwd(),
): string {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env,
    cwd,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${result.status})\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

function semver(version: string): [number, number, number] {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(version);
  assert(match, `invalid stable semver: ${version}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(left: string, right: string): number {
  const a = semver(left);
  const b = semver(right);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function validateAuthoredContract(): void {
  assert.equal(release.stable, true, "release marker must be stable");
  if (target.kind === "npm") {
    const latest = JSON.parse(
      run("npm", ["view", "jinn-cli", "dist-tags.latest", "--json"]),
    ) as string;
    assert.equal(
      latest,
      target.version,
      `docs ${target.version} must equal npm latest ${latest}`,
    );
  }

  const pages = fs
    .readdirSync(docsRoot, { recursive: true })
    .filter(
      (entry): entry is string =>
        typeof entry === "string" && entry.endsWith(".md"),
    );
  for (const page of pages) {
    const markdown = fs.readFileSync(path.join(docsRoot, page), "utf8");
    const frontmatter = /^---\n([\s\S]*?)\n---/u.exec(markdown)?.[1];
    assert(frontmatter, `${page}: missing frontmatter`);
    const since = /^since:\s*["']?([^"'\n]+)["']?$/mu.exec(frontmatter)?.[1];
    assert(since, `${page}: missing since`);
    assert(
      compareSemver(since, target.version) <= 0,
      `${page}: since ${since} exceeds documented ${target.version}`,
    );
  }

  const llms = fs.readFileSync("src/content/machine/llms.md", "utf8");
  const allDocs = pages
    .map((page) => fs.readFileSync(path.join(docsRoot, page), "utf8"))
    .join("\n");
  assert(
    allDocs.includes("/api/work-items"),
    "released docs must include Todos",
  );
  assert(
    allDocs.includes("/api/workflows/events/:eventName"),
    "released docs must include Workflow events",
  );
  assert(
    machine.includes(target.version),
    "agents.md version must derive from release marker",
  );
  assert(
    llms.includes("durable Todos") && llms.includes("typed MCP tools"),
    "llms.txt summary must name the released surface",
  );
}

async function freeHighPort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert(address && typeof address === "object");
      const port = address.port;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function request(
  base: string,
  route: string,
  options: RequestInit = {},
): Promise<HttpResult> {
  const response = await fetch(`${base}${route}`, options);
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: response.status, body, headers: response.headers, text };
}

async function check(name: string, action: () => Promise<void>): Promise<void> {
  await action();
  completed += 1;
  process.stdout.write(
    `  ${String(completed).padStart(2, "0")}/${expectedChecks} ${name}\n`,
  );
}

async function waitForGateway(
  base: string,
  child: ChildProcess,
): Promise<void> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    assert.equal(
      child.exitCode,
      null,
      "release gateway exited before readiness",
    );
    try {
      const response = await fetch(`${base}/api/status`);
      if (response.ok) return;
    } catch {
      // Bind is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("release gateway did not become ready");
}

async function listMcpTools(
  entry: string,
  sessionId: string,
  home: string,
  base: string,
  env: NodeJS.ProcessEnv,
): Promise<string[]> {
  const server = spawn(
    process.execPath,
    [
      entry,
      "--jinn-session-id",
      sessionId,
      "--jinn-home",
      home,
      "--jinn-gateway-url",
      base,
    ],
    {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  const lines: string[] = [];
  let pending = "";
  server.stdout?.setEncoding("utf8");
  server.stdout?.on("data", (chunk: string) => {
    pending += chunk;
    const split = pending.split("\n");
    pending = split.pop() ?? "";
    lines.push(...split.filter(Boolean));
  });
  server.stdin?.write(
    `${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } })}\n`,
  );
  server.stdin?.write(
    `${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })}\n`,
  );
  const deadline = Date.now() + 5_000;
  while (lines.length < 2 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  server.kill("SIGTERM");
  assert(
    lines.length >= 2,
    "MCP server did not answer initialize and tools/list",
  );
  const response = lines
    .map(
      (line) =>
        JSON.parse(line) as {
          id: number;
          result?: { tools?: Array<{ name: string }> };
        },
    )
    .find((item) => item.id === 2);
  assert(response?.result?.tools, "MCP tools/list response is missing tools");
  return response.result.tools.map((tool) => tool.name);
}

async function main(): Promise<void> {
  validateAuthoredContract();

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "jinn-docs-contract-"));
  const prefix = path.join(root, "prefix");
  const home = path.join(root, "instance");
  const fixture = path.join(root, "contract-fixture.txt");
  const isolatedEnv = {
    ...process.env,
    HOME: root,
    JINN_HOME: home,
    JINN_NO_OPEN: "1",
  };
  let child: ChildProcess | undefined;

  try {
    let installSpec = `jinn-cli@${target.version}`;
    if (target.kind === "source") {
      const sourceRepo =
        process.env.JINN_SOURCE_REPO ?? path.resolve("../jinn");
      assert(
        fs.existsSync(path.join(sourceRepo, ".git")),
        `missing Jinn source repo: ${sourceRepo}`,
      );
      const checkout = path.join(root, "source");
      const archive = path.join(root, "source.tar");
      run(
        "git",
        ["archive", "--format=tar", `--output=${archive}`, target.sourcePin!],
        process.env,
        sourceRepo,
      );
      fs.mkdirSync(checkout);
      run("tar", ["-xf", archive, "-C", checkout]);
      fs.symlinkSync(
        path.join(sourceRepo, "node_modules"),
        path.join(checkout, "node_modules"),
      );
      fs.symlinkSync(
        path.join(sourceRepo, "packages/jinn/node_modules"),
        path.join(checkout, "packages/jinn/node_modules"),
      );
      const sourceVersion = JSON.parse(
        fs.readFileSync(
          path.join(checkout, "packages/jinn/package.json"),
          "utf8",
        ),
      ) as { version: string };
      assert.equal(
        sourceVersion.version,
        target.version,
        "source pin package version must match upcomingVersion",
      );
      run("pnpm", ["--filter", "jinn-cli", "build"], process.env, checkout);
      const packName = run(
        "npm",
        ["pack", "--silent", "--pack-destination", root],
        process.env,
        path.join(checkout, "packages/jinn"),
      )
        .split("\n")
        .at(-1);
      assert(packName, "npm pack did not return a tarball name");
      installSpec = path.join(root, packName);
    }
    run(
      "npm",
      [
        "install",
        "--prefix",
        prefix,
        "--no-save",
        "--ignore-scripts=false",
        "--foreground-scripts",
        installSpec,
      ],
      isolatedEnv,
    );

    const packageRoot = path.join(prefix, "node_modules", "jinn-cli");
    const installed = JSON.parse(
      fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
    ) as { version: string };
    assert.equal(installed.version, target.version);
    const cli = path.join(prefix, "node_modules", ".bin", "jinn");
    await check("documented migration commands match CLI help", async () => {
      const migrateHelp = run(cli, ["migrate", "--help"], isolatedEnv);
      const commands = migrationDocs.match(/^jinn migrate(?: [^\n]*)?$/gmu);
      assert(
        commands && commands.length > 0,
        "migration docs contain no commands",
      );
      for (const command of commands) {
        for (const option of command.match(/--[a-z-]+/gu) ?? []) {
          assert(
            migrateHelp.includes(option),
            `${command}: ${option} is missing from pinned jinn migrate --help`,
          );
        }
      }
    });
    run(cli, ["setup"], isolatedEnv);

    const port = await freeHighPort();
    assert.notEqual(
      port,
      7777,
      "contract gateway must never use the live default port",
    );
    assert(port > 1024, "contract gateway must use a high port");
    const configPath = path.join(home, "config.yaml");
    let config = fs.readFileSync(configPath, "utf8");
    config = config.replace(/port:\s*7777/u, `port: ${port}`);
    if (/^ {2}authRequired:\s*(?:true|false)\s*$/mu.test(config)) {
      config = config.replace(
        /^ {2}authRequired:\s*(?:true|false)\s*$/mu,
        "  authRequired: true",
      );
    } else {
      config = config.replace(
        /host:\s*"127\.0\.0\.1"/u,
        'host: "127.0.0.1"\n  authRequired: true',
      );
    }
    config = config.replace(/bin:\s*claude/u, "bin: /usr/bin/false");
    fs.writeFileSync(configPath, config);
    fs.writeFileSync(fixture, "stable contract fixture\n");

    const daemon = path.join(
      packageRoot,
      "dist",
      "src",
      "gateway",
      "daemon-entry.js",
    );
    child = spawn(process.execPath, [daemon], {
      env: isolatedEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.resume();
    child.stderr?.resume();
    const base = `http://127.0.0.1:${port}`;
    await waitForGateway(base, child);

    const gatewayInfo = JSON.parse(
      fs.readFileSync(path.join(home, "gateway.json"), "utf8"),
    ) as { token: string; port: number };
    assert.equal(gatewayInfo.port, port);
    const auth = { Authorization: `Bearer ${gatewayInfo.token}` };
    const jsonHeaders = { ...auth, "Content-Type": "application/json" };
    let directId = "";
    let childId = "";
    let fileId = "";
    let attachmentId = "";
    let workItemId = "";

    await check("public status envelope", async () => {
      const result = await request(base, "/api/status");
      assert.equal(result.status, 200);
      assert.equal((result.body as { status: string }).status, "ok");
      assertDocumentedInlineShape(machine, "Success is HTTP 200 ", result.body);
    });
    await check("public auth state", async () => {
      const result = await request(base, "/api/auth/state");
      assert.equal(result.status, 200);
      assert.equal(
        typeof (result.body as { authRequired: unknown }).authRequired,
        "boolean",
      );
    });
    await check("protected route rejects missing auth", async () => {
      const result = await request(base, "/api/sessions?limit=0");
      assert.equal(result.status, 401);
      assert.deepEqual(result.body, {
        error: "Missing or invalid gateway auth token",
      });
      assertDocumentedInlineShape(
        machine,
        "Missing/invalid required auth is HTTP 401 ",
        result.body,
      );
    });
    await check("pairing code rejects bearer authority", async () => {
      const result = await request(base, "/api/auth/pairing-codes", {
        method: "POST",
        headers: jsonHeaders,
        body: "{}",
      });
      assert.equal(result.status, 403);
      assert.deepEqual(result.body, {
        error:
          "Pairing codes require an authenticated browser session; bearer tokens cannot mint browser pairing material",
      });
    });
    await check("pairing exchange rejects absent code", async () => {
      const result = await request(base, "/api/auth/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(result.status, 401);
      assert.deepEqual(result.body, {
        error: "Invalid or expired pairing code",
      });
    });
    await check("bearer authenticates state", async () => {
      const result = await request(base, "/api/auth/state", {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.equal(
        (result.body as { authenticated: boolean }).authenticated,
        true,
      );
    });
    await check("paired devices envelope", async () => {
      const result = await request(base, "/api/auth/devices", {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert(Array.isArray((result.body as { devices: unknown[] }).devices));
    });
    await check("logout without browser cookie is idempotent", async () => {
      const result = await request(base, "/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, { status: "ok" });
    });
    await check("invalid pairing code error", async () => {
      const result = await request(base, "/api/auth/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "invalid-code" }),
      });
      assert.equal(result.status, 401);
      assert.deepEqual(result.body, {
        error: "Invalid or expired pairing code",
      });
    });
    await check("engine registry envelope", async () => {
      const result = await request(base, "/api/engines", { headers: auth });
      assert.equal(result.status, 200);
      const body = result.body as {
        default: string;
        engines: Record<string, unknown>;
      };
      assert.equal(typeof body.default, "string");
      assert.equal(typeof body.engines, "object");
      assertDocumentedInlineShape(machine, "`GET /api/engines` returns ", body);
      assertDocumentedInlineShape(
        enginesAndLimits,
        "`GET /api/engines` returns ",
        body,
      );
    });
    await check("engine limits envelope", async () => {
      const result = await request(base, "/api/engine-limits", {
        headers: auth,
      });
      assert.equal(result.status, 200);
      const body = result.body as {
        generatedAt: string;
        default: string;
        engines: Record<string, unknown>;
      };
      assert.equal(typeof body.generatedAt, "string");
      assert.equal(typeof body.engines, "object");
      assertDocumentedInlineShape(
        machine,
        "`GET /api/engine-limits` returns ",
        body,
      );
      assertDocumentedInlineShape(
        enginesAndLimits,
        "`GET /api/engine-limits` returns ",
        body,
      );
    });
    await check("org envelope", async () => {
      const result = await request(base, "/api/org", { headers: auth });
      assert.equal(result.status, 200);
      const body = result.body as {
        departments: unknown[];
        employees: unknown[];
        hierarchy: object;
      };
      assert(Array.isArray(body.departments));
      assert(Array.isArray(body.employees));
      assert.equal(typeof body.hierarchy, "object");
      assertDocumentedInlineShape(machine, "`GET /api/org` returns ", body);
    });
    await check("employee detail", async () => {
      const result = await request(base, "/api/org/employees/assistant", {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.equal((result.body as { name: string }).name, "assistant");
    });
    await check("skills list bare array", async () => {
      const result = await request(base, "/api/skills", { headers: auth });
      assert.equal(result.status, 200);
      assert(Array.isArray(result.body));
    });
    await check("skill detail envelope", async () => {
      const result = await request(base, "/api/skills/status", {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.equal((result.body as { name: string }).name, "status");
      assert.equal(
        typeof (result.body as { content: string }).content,
        "string",
      );
    });
    await check("connectors list bare array", async () => {
      const result = await request(base, "/api/connectors", { headers: auth });
      assert.equal(result.status, 200);
      assert(Array.isArray(result.body));
    });
    await check("cron list bare array", async () => {
      const result = await request(base, "/api/cron", { headers: auth });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, []);
    });
    await check("files list bare array", async () => {
      const result = await request(base, "/api/files", { headers: auth });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, []);
    });
    await check("Todo list documented envelope", async () => {
      const result = await request(base, "/api/work-items", { headers: auth });
      assert.equal(result.status, 200);
      assertDocumentedInlineShape(
        machine,
        "The list envelope is ",
        result.body,
      );
    });
    await check("Todo create documented envelope", async () => {
      const result = await request(base, "/api/work-items", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ title: "Verify the contract fixture" }),
      });
      assert.equal(result.status, 201);
      assertDocumentedInlineShape(machine, "Response: HTTP 201 ", result.body);
      workItemId = (result.body as { workItem: { id: string } }).workItem.id;
    });
    await check("Todo detail documented envelope", async () => {
      const result = await request(base, `/api/work-items/${workItemId}`, {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assertDocumentedInlineShape(
        machine,
        "`GET /api/work-items/:id` returns ",
        result.body,
      );
    });
    await check("Todo linked sessions list", async () => {
      const result = await request(
        base,
        `/api/work-items/${workItemId}/sessions`,
        { headers: auth },
      );
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, []);
    });
    await check("Todo archive documented envelope", async () => {
      const result = await request(
        base,
        `/api/work-items/${workItemId}/archive`,
        {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({ note: "Contract cleanup" }),
        },
      );
      assert.equal(result.status, 200);
      assertDocumentedInlineShape(machine, "Archive returns ", result.body);
      assert.equal(
        (result.body as { workItem: { status: string }; archived: boolean })
          .workItem.status,
        "cancelled",
      );
    });
    await check("Workflow definitions documented envelope", async () => {
      const result = await request(base, "/api/workflows", {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assertDocumentedInlineShape(
        machine,
        "`GET /api/workflows` → ",
        result.body,
      );
    });
    await check("unknown Workflow reports not found", async () => {
      const result = await request(base, "/api/workflows/contract-missing", {
        headers: auth,
      });
      assert.equal(result.status, 404);
      assert.deepEqual(result.body, {
        code: "not-found",
        message: "Workflow definition contract-missing was not found.",
      });
    });
    await check("Workflow event rejects missing auth", async () => {
      const result = await request(
        base,
        "/api/workflows/events/contract.probe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fireId: "contract-1", payload: {} }),
        },
      );
      assert.equal(result.status, 401);
      assert.deepEqual(result.body, {
        error: "Missing or invalid gateway auth token",
      });
    });
    await check("Workflow event reports no matching definition", async () => {
      const result = await request(
        base,
        "/api/workflows/events/contract.probe",
        {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({
            payload: {},
            fireId: "contract-1",
          }),
        },
      );
      assert.equal(result.status, 202);
      assert.deepEqual(result.body, []);
    });
    await check("sessions all bare array", async () => {
      const result = await request(base, "/api/sessions?limit=0", {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, []);
    });
    await check("sessions default wrapper", async () => {
      const result = await request(base, "/api/sessions", { headers: auth });
      assert.equal(result.status, 200);
      const body = result.body as {
        sessions: unknown[];
        counts: object;
        perGroup: number;
      };
      assert(Array.isArray(body.sessions));
      assert.equal(typeof body.counts, "object");
      assert.equal(typeof body.perGroup, "number");
      assertDocumentedInlineShape(
        machine,
        "default `GET /api/sessions` → ",
        body,
      );
    });
    await check("direct session create", async () => {
      const result = await request(base, "/api/sessions", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ prompt: "Release contract fixture." }),
      });
      assert.equal(result.status, 201);
      const body = result.body as {
        id: string;
        status: string;
        queueDepth: number;
        transportState: string;
        employee: string | null;
      };
      assert.equal(body.status, "running");
      assert.equal(body.queueDepth, 1);
      assert.equal(body.transportState, "queued");
      assert.equal(body.employee, null);
      assertDocumentedJsonExampleShape(
        machine,
        "A direct response has this stable shape (IDs/timestamps/title vary):",
        body,
      );
      directId = body.id;
    });
    await check("company MCP tools/list released surface", async () => {
      const names = await listMcpTools(
        path.join(packageRoot, "dist", "src", "mcp", "server-entry.js"),
        directId,
        home,
        base,
        isolatedEnv,
      );
      for (const name of [
        "find_employees",
        "list_work_items",
        "delegate_task",
        "start_workflow_run",
        "decide_work_item_approval",
      ]) {
        assert(names.includes(name), `company MCP tools/list missing ${name}`);
        assert(
          machine.includes(`\`${name}\``),
          `agents.md does not name ${name}`,
        );
      }
    });
    await check("session bounded-tail detail", async () => {
      const result = await request(base, `/api/sessions/${directId}?last=8`, {
        headers: auth,
      });
      assert.equal(result.status, 200);
      const body = result.body as {
        id: string;
        messages: unknown[];
        messagesPage: { hasOlder: boolean };
      };
      assert.equal(body.id, directId);
      assert(Array.isArray(body.messages));
      assert.equal(typeof body.messagesPage.hasOlder, "boolean");
      assertDocumentedInlineShape(
        machine,
        "bounded-tail reads also include ",
        body,
      );
    });
    await check("session detail without messages", async () => {
      const result = await request(
        base,
        `/api/sessions/${directId}?messages=0`,
        { headers: auth },
      );
      assert.equal(result.status, 200);
      assert(!Object.hasOwn(result.body as object, "messages"));
    });
    await check("session message page envelope", async () => {
      const result = await request(
        base,
        `/api/sessions/${directId}/messages?limit=100`,
        { headers: auth },
      );
      assert.equal(result.status, 200);
      const body = result.body as { messages: unknown[]; hasOlder: boolean };
      assert(Array.isArray(body.messages));
      assert.equal(typeof body.hasOlder, "boolean");
      assertDocumentedInlineShape(
        machine,
        "`GET /api/sessions/:id/messages?before=<messageId>&limit=100` → ",
        body,
      );
    });
    await check("session follow-up queue envelope", async () => {
      const result = await request(base, `/api/sessions/${directId}/message`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ message: "Follow-up fixture." }),
      });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, { status: "queued", sessionId: directId });
      assertDocumentedInlineShape(
        machine,
        "Success is HTTP 200 ",
        result.body,
        1,
      );
    });
    await check("session follow-up remains readable", async () => {
      const result = await request(base, `/api/sessions/${directId}?last=8`, {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.equal((result.body as { id: string }).id, directId);
      assert(Array.isArray((result.body as { messages: unknown[] }).messages));
    });
    await check("child session create", async () => {
      const result = await request(base, "/api/sessions", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          prompt: "Child fixture.",
          parentSessionId: directId,
        }),
      });
      assert.equal(result.status, 201);
      const body = result.body as { id: string; parentSessionId: string };
      assert.equal(body.parentSessionId, directId);
      childId = body.id;
    });
    await check("children list bare array", async () => {
      const result = await request(base, `/api/sessions/${directId}/children`, {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert(Array.isArray(result.body));
      assert(
        (result.body as Array<{ id: string }>).some(
          (session) => session.id === childId,
        ),
      );
    });
    await check("session list contains created records", async () => {
      const result = await request(base, "/api/sessions?limit=0", {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert(
        (result.body as Array<{ id: string }>).some(
          (session) => session.id === directId,
        ),
      );
    });
    await check("session search returns bare array", async () => {
      const result = await request(base, "/api/sessions?q=Child%20fixture", {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert(Array.isArray(result.body));
    });
    await check("invalid model selection error", async () => {
      const result = await request(base, "/api/sessions", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          prompt: "Invalid selection.",
          model: "not-a-model",
        }),
      });
      assert.equal(result.status, 400);
      assert.equal(typeof (result.body as { error: string }).error, "string");
    });
    await check("missing session prompt error", async () => {
      const result = await request(base, "/api/sessions", {
        method: "POST",
        headers: jsonHeaders,
        body: "{}",
      });
      assert.equal(result.status, 400);
      assert.deepEqual(result.body, { error: "prompt or message is required" });
    });
    await check("absent session error", async () => {
      const result = await request(base, "/api/sessions/not-a-session", {
        headers: auth,
      });
      assert.equal(result.status, 404);
      assert.deepEqual(result.body, { error: "Not found" });
    });
    await check("session stop envelope", async () => {
      const result = await request(base, `/api/sessions/${childId}/stop`, {
        method: "POST",
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, { status: "stopped", sessionId: childId });
    });
    await check("stopped child detail", async () => {
      const result = await request(
        base,
        `/api/sessions/${childId}?messages=0`,
        { headers: auth },
      );
      assert.equal(result.status, 200);
      assert.equal((result.body as { status: string }).status, "interrupted");
    });
    await check("managed multipart upload", async () => {
      const form = new FormData();
      form.set(
        "file",
        new Blob([fs.readFileSync(fixture)]),
        "contract-fixture.txt",
      );
      const result = await request(base, "/api/files", {
        method: "POST",
        headers: auth,
        body: form,
      });
      assert.equal(result.status, 201);
      fileId = (result.body as { id: string }).id;
      assert.equal(
        (result.body as { filename: string }).filename,
        "contract-fixture.txt",
      );
      assertDocumentedInlineShape(
        filesAndMedia,
        "`POST /api/files` returns HTTP 201 ",
        result.body,
      );
    });
    await check("managed file list", async () => {
      const result = await request(base, "/api/files", { headers: auth });
      assert.equal(result.status, 200);
      assert(
        (result.body as Array<{ id: string }>).some(
          (file) => file.id === fileId,
        ),
      );
    });
    await check("managed file metadata", async () => {
      const result = await request(base, `/api/files/${fileId}/meta`, {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.equal((result.body as { id: string }).id, fileId);
    });
    await check("managed file download", async () => {
      const result = await request(base, `/api/files/${fileId}`, {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.equal(result.text, "stable contract fixture\n");
    });
    await check("managed ID attaches to follow-up", async () => {
      const result = await request(base, `/api/sessions/${directId}/message`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          message: "Review attachment.",
          attachments: [fileId],
        }),
      });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, { status: "queued", sessionId: directId });
      assertDocumentedInlineShape(
        filesAndMedia,
        "The managed-ID follow-up returns ",
        result.body,
      );
    });
    await check("session multipart attachment", async () => {
      const form = new FormData();
      form.set(
        "file",
        new Blob([fs.readFileSync(fixture)]),
        "attached-fixture.txt",
      );
      form.set("text", "Verified fixture");
      const result = await request(
        base,
        `/api/sessions/${directId}/attachments`,
        {
          method: "POST",
          headers: auth,
          body: form,
        },
      );
      assert.equal(result.status, 201);
      const body = result.body as {
        id: string;
        media: object;
        message: { role: string };
      };
      assert.equal(body.message.role, "assistant");
      assertDocumentedInlineShape(
        filesAndMedia,
        "Direct session multipart returns HTTP 201 ",
        body,
      );
      attachmentId = body.id;
    });
    await check("session attachment metadata", async () => {
      const result = await request(base, `/api/files/${attachmentId}/meta`, {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.equal((result.body as { id: string }).id, attachmentId);
    });
    await check("session attachment download", async () => {
      const result = await request(base, `/api/files/${attachmentId}`, {
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.equal(result.text, "stable contract fixture\n");
    });
    await check("cron create envelope", async () => {
      const result = await request(base, "/api/cron", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          id: "docs-contract-job",
          name: "Docs contract job",
          enabled: false,
          schedule: "0 10 * * 1",
          timezone: "UTC",
          prompt: "Contract fixture.",
        }),
      });
      assert.equal(result.status, 201);
      assert.equal((result.body as { id: string }).id, "docs-contract-job");
    });
    await check("cron update envelope", async () => {
      const result = await request(base, "/api/cron/docs-contract-job", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ enabled: false, name: "Updated contract job" }),
      });
      assert.equal(result.status, 200);
      const body = result.body as {
        id: string;
        name: string;
        enabled: boolean;
      };
      assert.equal(body.id, "docs-contract-job");
      assert.equal(body.name, "Updated contract job");
      assert.equal(body.enabled, false);
    });
    await check("cron run history bare array", async () => {
      const result = await request(
        base,
        "/api/cron/docs-contract-job/runs?limit=10",
        { headers: auth },
      );
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, []);
    });
    await check("cron trigger acknowledgement", async () => {
      const result = await request(
        base,
        "/api/cron/docs-contract-job/trigger",
        {
          method: "POST",
          headers: auth,
        },
      );
      assert.equal(result.status, 200);
      const body = result.body as { triggered: boolean; jobId: string };
      assert.equal(body.triggered, true);
      assert.equal(body.jobId, "docs-contract-job");
      assertDocumentedInlineShape(
        machine,
        "`POST /api/cron/:id/trigger` → ",
        body,
      );
    });
    await check("cron delete envelope", async () => {
      const result = await request(base, "/api/cron/docs-contract-job", {
        method: "DELETE",
        headers: auth,
      });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, {
        deleted: "docs-contract-job",
        name: "Updated contract job",
      });
      assertDocumentedInlineShape(
        machine,
        "`DELETE /api/cron/:id` → ",
        result.body,
      );
    });

    assert.equal(
      completed,
      expectedChecks,
      `release contract must execute exactly ${expectedChecks} checks`,
    );
    process.stdout.write(
      `Docs release contract: ${completed}/${expectedChecks} exact against ${target.kind}:${target.version}${target.sourcePin ? `@${target.sourcePin}` : ""}\n`,
    );
  } finally {
    if (child && child.exitCode === null) {
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (child?.exitCode === null) child.kill("SIGKILL");
          resolve();
        }, 5_000);
        child?.once("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
    fs.rmSync(root, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}

await main();
