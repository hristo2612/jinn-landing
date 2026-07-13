# C2 documentation accuracy review — 2026-07-11

## Verdict

**BLOCK**

The branch is structurally polished and both required quality gates pass, but it does not satisfy its own “latest stable release” boundary. The public npm `latest` release is `0.25.0`, while the docs and both machine routes teach unreleased `0.26.0` Todo, Workflow, delegation, trigger, and approval APIs. An agent following `/agents.md` against the product the install page actually installs reaches 404s on its core operating protocol.

Finding count: **1 Critical, 3 High, 5 Medium, 1 Low**.

## Scope and method

- Docs branch: `c2-docs` at `452d49b` before this report commit.
- Product source audited: Jinn at `dcf0bb4`; package source version `0.26.0`.
- Published release audited: `jinn-cli@latest` resolved to `0.25.0`; the latest source tag is also `v0.25.0`.
- Content audited: all 33 documentation pages, canonical `/agents.md`, canonical `/llms.txt`, route curation, frontmatter, sidebar/information architecture, generated search output, and public-safety scanning.
- Runtime audit: installed and started two disposable gateways on high loopback ports with isolated homes: one from a locally packed current-source build and one from the actual npm `latest` package. No request touched the live instance or its default port.
- Protocol audit: exercised 42 distinct documented curl/protocol checks on current source and six release-compatibility checks on npm `latest`. Diagnostic retries and polling-loop repetitions are excluded from the count. **48 checks executed; 34 matched the docs exactly.** The four-step `/agents.md` create → poll → message → poll/resume protocol matched current source exactly.

## Required gates

| Gate            | Result         | Evidence                                                                                                                                                                           |
| --------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`    | PASS, run once | Astro/TypeScript checks passed; lint and formatting passed; 106 unit tests passed; 39 pages built; public-safety scan passed across 286 files; 59 built URLs passed link checking. |
| `pnpm test:e2e` | PASS, run once | 162 Playwright tests passed.                                                                                                                                                       |

## Runtime execution matrix

| Area                                    | Executed |  Exact | Material mismatch                                                                                                          |
| --------------------------------------- | -------: | -----: | -------------------------------------------------------------------------------------------------------------------------- |
| Authentication and public/read surfaces |        3 |      2 | Bearer-authenticated pairing-code creation returned 403.                                                                   |
| Sessions and delegation                 |        9 |      9 | Create, poll, callback, follow-up, resume, children, linked Todo, and idempotent delegation replay matched current source. |
| Cron and connectors                     |        7 |      7 | List, create, update, runs, trigger, delete, and connector discovery matched.                                              |
| Org, skills, and knowledge              |        6 |      6 | Org, employee read/update, skills, knowledge search, and knowledge read matched.                                           |
| Files and media                         |        6 |      4 | The documented managed-read path and relative-path attachment examples failed.                                             |
| Todos                                   |        9 |      6 | List/detail envelopes differed; the archive sequence was not executable as written.                                        |
| Workflows and triggers                  |        2 |      0 | Both list response envelopes omit documented machine-significant wrapper fields.                                           |
| npm-latest compatibility probes         |        6 |      0 | All probed `0.26.0` Todo/Workflow/delegation routes returned 404 on `0.25.0`.                                              |
| **Total**                               |   **48** | **34** |                                                                                                                            |

The current-source install/first-run path itself completed: package install, setup, daemon start, status, public liveness, authenticated reads, a real engine turn, follow-up turn, tracked delegation, Todo lifecycle, cron lifecycle, and file upload/download. The npm-latest install and first run also completed, but its API surface did not match the machine documentation.

## Findings

### F-01 — Critical — “Latest stable” docs require an unpublished release

**Locations:** `src/content/docs/docs/changelog/index.md:10-12`, `src/content/machine/llms.md:7`, `src/content/machine/agents.md:167-248`, every page with `since: "0.26.0"`, generated release metadata, and `packages/jinn/package.json:3` in product source.

The site says the tree documents the latest stable release and identifies that release as `0.25.0`. The install page uses unpinned `jinn-cli`, which currently resolves to `0.25.0`. Eleven pages nevertheless declare `since: "0.26.0"`, and `/agents.md` treats those capabilities as present rather than version-gated. Against a clean npm-latest gateway, the audited work-item, delegation, Workflow-definition, Workflow-trigger, and Workflow-event endpoints returned 404.

This is a direct machine-runtime failure, not a presentation discrepancy: a newly installed agent cannot execute the Todo/Workflow operating model described by the canonical machine routes.

**Required remediation / invariant:** either publish and designate `0.26.0` before shipping this docs tree, or remove/version-gate every `0.26.0` claim from the stable docs and machine routes. The release marker, install command, page `since` values, `/llms.txt`, `/agents.md`, and generated release metadata must derive from one release source. Every route advertised by the stable machine contract must exist in `npm view jinn-cli dist-tags.latest`.

### F-02 — High — The documented pairing path and `jinn pair` contradict the auth invariant

**Locations:** `src/content/docs/docs/reference/gateway-api/authentication.md:35-48`, `src/content/docs/docs/guides/pair-a-remote-browser.md:31-35`, `src/content/machine/agents.md:44`, `packages/jinn/src/cli/pair.ts:65-80`, and `packages/jinn/src/gateway/api.ts:2319-2333`.

**Required remediation / security invariant:** define one local CLI proof that the pairing route can authenticate without granting remote bearer-only callers browser-pairing authority, implement it consistently in the CLI and server, and make the docs use that path. A copy-paste `jinn pair` and the documented local operator flow must succeed; non-local and improperly scoped callers must remain rejected.

Runtime evidence: the documented bearer curl returned 403 on current source, and `jinn pair --json` followed the same bearer path and exited non-zero. The server explicitly rejects gateway bearer authentication for pairing-code minting, while the CLI implements only bearer authentication. The guide’s recommended command therefore has no working path in the audited source build.

### F-03 — High — Both machine file handoff examples are non-composable

**Locations:** `src/content/docs/docs/reference/gateway-api/files-and-media.md:28-38`, `src/content/machine/agents.md:270-280`, and `packages/jinn/src/gateway/files.ts:1114-1152,1234-1253`.

The upload/list/meta/download examples work. The next two steps do not:

1. `--data-urlencode "path=files/notes.txt"` encodes the slash, while the server intentionally rejects encoded separators. A literal path still cannot use `files/notes.txt`: uploads are stored under an ID-bearing managed path, and the upload response does not give the example’s path.
2. `{"path":"./report.pdf"}` resolves relative to the long-running gateway process, not the curl caller or the agent session. The exact example returned “File not found” even though the caller had created the fixture in its own working directory.

An AI agent using `/agents.md` cannot reliably move a produced artifact into a session from these instructions.

**Required remediation / invariant:** make the examples a single executable chain. Return/document a canonical managed relative path or accept the file ID for reads; avoid encoded-separator rejection in the documented command; and use multipart/base64 or a clearly authorized absolute/managed path for session attachment. A file uploaded by the first command must be readable and attachable by subsequent commands without guessing daemon cwd or storage layout.

### F-04 — High — The documented global install emits unresolved high/critical dependency advisories

**Location:** `src/content/docs/docs/getting-started/install.md:13-18`; product release dependency tree.

**Required remediation / security invariant:** triage and remove, upgrade, or safely isolate the flagged production dependencies before promoting this install flow. If an optional connector is the source, the default package should not require its vulnerable tree when that connector is unused. The supported install path should not complete with known high/critical audit findings.

Both clean installs completed, but npm reported 16 dependency vulnerabilities (11 moderate, one high, four critical) and printed a specific zero-day advisory for a transitive connector dependency. This review did not attempt reachability analysis, so the finding records installer-visible release risk rather than asserting exploitability. It is still unsafe for launch documentation to present the command as an unqualified clean install while the package manager reports that state.

### F-05 — Medium — Todo list and detail response contracts are wrong for machine consumers

**Locations:** `src/content/docs/docs/reference/gateway-api/todos.md:18-19`, `src/content/machine/agents.md:172-201`, and `packages/jinn/src/gateway/api.ts:1649-1655,1755-1763,3107-3118,3162-3168`.

The docs say list returns `{items,total,limit,offset,…}` and detail returns the full Todo. Current source returns list key `workItems`, plus `totals` and `nextOffset`; detail is `{workItem,spendUsd,workflowRun,events}`. An agent written to the documented key sees no Todos, and a client treating detail as a Todo reads every field at the wrong level.

**Required remediation / invariant:** document exact JSON envelopes and stable field names in both the human reference and `/agents.md`; add response examples that machine clients can parse without inference.

### F-06 — Medium — The Todo archive example is not an executable lifecycle

**Locations:** `src/content/docs/docs/reference/gateway-api/todos.md:23,36-47`, `src/content/machine/agents.md:196-226`, `packages/jinn/src/gateway/api.ts:3354-3388`, and `packages/jinn/src/work-items/approvals.ts:159-178`.

The code block labels one sequence “Create, assign, progress, or archive intent,” archives the same Todo, then immediately requests and decides approval on that same ID. Archive is implemented as the terminal `cancelled` transition. Conversely, after an approval completes the Todo, archive attempts the illegal `done → cancelled` edge and returns 400. The tested commands are valid individually but not as the presented copy-paste flow.

**Required remediation / invariant:** split archive and approval into independent examples with separate Todo IDs, and document that archive maps to terminal cancellation and is idempotent only for already-cancelled work. Every command block presented as a sequence must run top to bottom.

### F-07 — Medium — Workflow and trigger list envelopes omit operational state

**Locations:** `src/content/docs/docs/reference/gateway-api/workflows-and-triggers.md:20,32,48,56`, and `packages/jinn/src/gateway/api.ts:3607-3616,3845-3851`.

Both list routes return wrappers, not bare lists: `{definitions,evidenceConfigured,evidenceReason?}` and `{triggers,evidenceConfigured,evidenceReason?}`. `evidenceConfigured:false` distinguishes an unavailable persistence root from an ordinary empty collection, so omitting it teaches agents to collapse an operational fault into “nothing configured.”

**Required remediation / invariant:** document the exact envelopes and the required behavior for `evidenceConfigured:false`; machine clients must not interpret it as an empty healthy state.

### F-08 — Medium — `/agents.md` cannot discover valid engine/model/effort selections

**Locations:** `src/content/machine/agents.md:66-91`; missing from the curated Gateway API reference; implemented at `packages/jinn/src/gateway/api.ts:5340-5377`.

The session-create contract permits optional engine/model/effort overrides and says they must validate, but provides no machine route for discovering registered values. `GET /api/status` reports defaults/availability, not the model registry or effort mechanisms. Current source exposes authenticated `GET /api/engines` and `GET /api/engine-limits`, yet neither is in the Gateway API curation and `/agents.md` never points to them.

**Required remediation / invariant:** curate the authenticated engine registry (and limits where operationally relevant) and tell agents to discover valid values before overriding defaults. Keep destructive/internal engine mutation routes omitted.

### F-09 — Medium — “Source-verified” examples have no runtime contract gate

**Locations:** docs content tests and branch scripts; affected claims throughout the Gateway API reference and machine routes.

The branch gates validate frontmatter presence, route output, keywords, links, formatting, and public safety. They do not install the declared stable package, compare the docs release to npm `latest`, execute curl blocks, or assert response envelopes. Consequently both mandatory gates pass with one Critical and multiple runtime-contract failures.

**Required remediation / invariant:** add a docs contract smoke gate that installs the declared release into an isolated home/port, runs the curated non-destructive examples and `/agents.md` session protocol, validates status codes/envelopes, and fails when any page’s `since` exceeds the release marker. Keep destructive examples fixture-scoped.

### F-10 — Low — Native-build fallback requirements are omitted from install prerequisites

**Location:** `src/content/docs/docs/getting-started/install.md:13-18`; product package engine/dependency metadata.

The docs state only Node 22+. In the audited environment, both global-style installs had to compile the SQLite native binding because no matching prebuilt binary was available, requiring Python and a native compiler toolchain. Installation succeeded, but a supported Node version alone was insufficient.

**Required remediation / invariant:** recommend a tested Node LTS line and document the native-build fallback prerequisites and failure signature, or ensure supported platforms receive a prebuilt binary. A user satisfying the stated prerequisites should be able to install.

## Curation audit

The current boundary is mostly sound:

- Correctly omitted from the agent protocol: session delete/reset/duplicate/queue-control/model-patch routes, auth-device deletion, control-plane mutation, raw logs, and legacy board mutation.
- Correctly retained with authority warnings: cron mutation, connector send, skill deletion, approval decisions, Workflow mutation/run/gate actions, and managed file transfer.
- Genuinely missing for operators/agents: authenticated engine/model discovery (`GET /api/engines`) is required to use the documented session override contract. Engine-limit reads are useful for retry/wait decisions. Redacted config, cost report, activity, and search routes may remain outside the core agent protocol, but deserve an operator-only discovery/reference decision rather than accidental omission.
- No destructive or internal route was found advertised without an authority warning. The highest curation risk is unavailable `0.26.0` routes being advertised as stable, not overexposure of destructive routes.

## Machine-route stress result

From `/agents.md` alone, an agent can successfully:

- obtain base URL/token from the documented operator handoff;
- create a direct or employee session;
- poll bounded tails until a completion state;
- read final messages;
- send a follow-up and resume the same session;
- track children and replay an idempotent delegation on current source.

It cannot reliably:

- know that the installed stable package lacks the Todo/Workflow protocol;
- use the recommended pairing path;
- parse the documented Todo list/detail shapes;
- distinguish unconfigured Workflow evidence from an empty healthy list;
- discover valid model/effort overrides;
- read and attach an artifact using the shown file examples;
- execute the Todo archive and approval commands as one flow.

Those are machine-contract blockers, not prose nits.

## Frontmatter, IA, search, and public safety

- All 33 pages carry `title`, `description`, `since`, `source`, `audience`, and `generated`; every cited source path exists in the product repository.
- Sidebar grouping is coherent: Getting Started → Core Concepts → Guides → Gateway API → CLI Reference → Changelog. No orphaned documentation page was found.
- The Astro build produced 39 pages and Pagefind indexed all 39 HTML files; the generated docs fragments and machine routes were present. Search-index generation completed without an error.
- The branch public-safety scan passed. A separate review of the docs diff found no real token, personal name, personal project, email, Slack ID, or absolute home path leak.
- `since` values are syntactically valid, but the eleven `0.26.0` pages are not plausible inside a tree that declares `0.25.0` as latest stable; that release-boundary failure is F-01.

## Merge-risk read

Merge risk is **high and externally observable**. The static site will build and test green, which makes the failure easy to miss, but publishing it now gives humans an install that cannot satisfy the machine contract and gives agents deterministic 404/403/400 failures on core operating paths. Merge only after F-01, F-02, and F-03 are closed and the dependency state in F-04 has an explicit release-owner disposition; F-05 through F-09 should be corrected before treating `/agents.md` as an automation contract.

---

## Final remediation re-verification — 2026-07-11

### Final verdict

**BLOCK**

The authored docs and machine-route subset is now accurately retargeted to npm-stable `jinn-cli@0.25.0`, and the repaired stable HTTP examples passed. The public build as a whole still violates that release boundary, and the new runtime-contract gate does not detect ordinary documented response-shape drift.

Final disposition: **F-01 remains open at Critical severity; F-09 remains open at Medium severity. F-02, F-03, F-05, F-06, F-07, F-08, and F-10 are closed. F-04 is closed for website scope with release-owner dependency remediation still outstanding.**

### Re-verification evidence

- Audited remediation commits `8634794`, `ca661cc`, `8c798d7`, `cc0616f`, `cbb6d5c`, and `6a481ac`.
- Confirmed 27 authored docs pages, all with `since` at or below `0.25.0`; `/agents.md`, `/llms.txt`, and the release marker all name `0.25.0`.
- Installed a fresh `jinn-cli@0.25.0` into an isolated home and high loopback port. Fifteen independently executed spot checks passed exactly, including the formerly failing bearer pairing path, engine discovery, stable session list, multipart file upload/metadata/session attachment, and all six removed Todo/delegation/Workflow routes returning exact `404 {"error":"Not found"}`.
- `pnpm check`: PASS, run once after restoring the mutation. This included 108 unit tests, a fresh production build, safety/link gates, 48/48 hardcoded stable runtime assertions, and 6/6 negative release-boundary probes.
- `pnpm test:e2e`: PASS, run once; 162/162 Playwright tests passed.
- The install guide's F-04 caution is adequate remediation-first website guidance: it states the observed severity/counts, avoids asserting reachability, directs isolated audit review, tells operators not to enable the implicated connector or expose the release in a security-sensitive deployment without assessment, and directs them to upgrade when a remediated stable package exists. It does not claim to remediate the published dependency tree.

### F-01 remains open — built public output advertises the unreleased product surface

The docs and machine routes no longer contain the removed HTTP names, but the requested fresh-build grep found `/api/workflow-events` in both `dist/features/index.html` and its shipped JavaScript bundle. This is source-backed, not stale output:

- `src/lib/scenes/features.ts:24` says the product ships a reviewed work ledger, Workflow graphs, approval gates, triggers, and MCP tools.
- `src/lib/scenes/features.ts:189,720,728` advertises Todo-triggered Workflows and `POST /api/workflow-events`.
- `src/lib/scenes/features.ts:213,217,770,783` says Jinn ships its own company MCP server and names unreleased work-item, delegation, Workflow, knowledge, and approval tools.

The freshly built Features page therefore contradicts the same build's stable docs and `/agents.md`, which correctly say `0.25.0` has no native Todo, Workflow, approval, atomic-delegation, knowledge-HTTP, or built-in company-MCP surface. The E2E suite explicitly preserves these Features strings, so its green result does not mitigate the mismatch.

**Required remediation / invariant:** either retarget all public marketing copy/scenes to the stable package or visibly and unambiguously label unreleased capability sections as such. The stable-boundary scan must cover the entire public source and built output, not only `docsRoot`, `/agents.md`, and `/llms.txt`. No public page may present an npm-absent route or capability as currently shipped.

### F-09 remains open — controlled prose drift passed the new gate

The negative test changed the `/agents.md` claim for `GET /api/engines` from its correct `{default,engines}` envelope to the false `{default,providers}` envelope, then ran `pnpm docs:contract`. The gate still reported 48/48 exact and exited zero. The mutation was immediately restored, and the clean working diff was confirmed before the mandated gates.

The reason is structural: `validateAuthoredContract()` checks release equality, frontmatter versions, a banned-route regex, and version strings. The 48 HTTP assertions are maintained separately in the same script; they do not parse or otherwise bind to the prose examples and response-shape claims. The gate catches release-marker and known-route drift, but not general documentation-contract drift.

**Required remediation / invariant:** derive both rendered machine/human contract fragments and runtime assertions from one typed contract manifest, or parse and execute annotated documentation examples with their expected status/envelope assertions. Add a permanent negative test proving a documented field-name mutation fails. The stable-boundary scan must also inspect all public build routes so the F-01 Features mismatch cannot pass.

### Final merge-risk read

Merge risk remains **high**. Stable installation and the curated docs now work, but a visitor receives mutually exclusive product truths from `/features/` and `/agents.md`, while the purported permanent drift gate demonstrably misses a false machine envelope. Do not begin the design-skin pass or merge until F-01's site-wide boundary and F-09's prose-to-runtime binding are closed.

---

## Final branch-scoped verdict — 2026-07-11

### Verdict

**SHIP**

Scoped to the `c2-docs` diff, the documentation, `/agents.md`, `/llms.txt`, retargeted `/features/` page, and npm-stable runtime-contract gates are release-true for `jinn-cli@0.25.0`. The landing mismatch below is real but predates this branch, is neither introduced nor worsened by it, and is tracked separately as a site-level release-timing decision.

Branch-scoped disposition: **no open findings in the `c2-docs` diff. F-01 is closed for this branch; F-09 is closed.** All other findings retain their preceding closed disposition, including F-04's website-scope disposition.

### Verification evidence

- `git diff main...c2-docs` confirms the branch retargets the Features implementation and adds the docs/contracts; it does not modify the landing components that carry the site-level finding.
- Re-planted the exact `GET /api/engines` mutation `{default,engines}` → `{default,providers}` in `/agents.md`. `pnpm docs:contract` failed at contract 10/48 with `documented field "providers" is missing from the live response`. The mutation was reverted, the file diff was confirmed clean, and the full gate returned green with 48/48 live contracts and all six removed-route boundary probes passing.
- Installed npm-stable `jinn-cli@0.25.0` in a fresh isolated home on a high loopback port. Five retargeted `/features/` claims were checked against the running gateway: six engine adapters plus model/effort discovery; file-backed employees in the live org; parent/child session delegation; employee-targeted cron persistence and run history; and file-backed skills in the catalog. All five matched.
- A fresh-build boundary grep of `dist/features/index.html` and its shipped JavaScript found none of the unreleased route/tool names from the original F-01. The Features remediation is release-true.
- `pnpm check`: PASS, run once after restoration; 110 unit tests passed, 33 pages built, 48/48 live contracts matched, and all six removed routes remained absent.
- `pnpm test:e2e`: PASS, run once; 159/159 Playwright tests passed.
- The isolated gateway, temporary home, and contract sandboxes were removed after verification.

## SITE-LEVEL TRACKED FINDING — landing release timing

**Scope:** pre-existing on `main`; not a `c2-docs` regression. The landing narrates capabilities implemented after the `0.25.0` npm release. Publication therefore requires an operator decision on release ordering; it does not require removing the approved narrative from this branch.

Exact stable gap by landing rail:

- **Todos — “The live work ledger.”** The landing shows a company-wide Todo entity with `assigned`/`executing`/`blocked`/`done` states, “Needs you” grouping, employee ownership, session/cost links, COO review, and Todo-status automation. `0.25.0` instead has department Kanban tickets (`backlog`/`todo`/`in-progress`/`review`/`done`, optional assignee and UI work state) persisted through department boards; it has no native company Todo resource/API, session-and-cost-linked ledger, or Todo lifecycle events.
- **Workflows — reusable SOP runs.** The landing shows named Workflow definitions, numbered runs, ordered steps, progress, retained run history/state, and a step that parks at a durable human approval gate before the queued post step continues. `0.25.0` instead has sessions/child sessions for agent-coordinated multi-step work and cron run logs; it has no Workflow definition/run/step/gate resource or Workflow execution API.
- **Triggers — cron, Todo watcher, and webhook bindings.** The landing shows a unified trigger registry where a `09:00` cron starts Workflow run `#142`, `Todo → blocked` wakes the COO, and `POST /hooks/stripe` starts a refund-review Workflow. `0.25.0` instead has scheduled and manually invoked cron jobs that launch a prompt/session and expose run history; it has no generic trigger-binding engine, Todo-status watcher, public webhook binding, or trigger-to-Workflow-run semantics.
- **Approval — “one tap, and it ships.”** The landing shows a persisted approval decision clearing a Workflow gate and advancing the run. `0.25.0` does have Talk approval cards and operator-in-the-loop instructions, but no durable approval resource/gate decision API and no `decide_approval` tool coupled to Workflow state.
- **MCP — “One tool interface. The whole company.”** The landing presents a built-in company MCP server spanning org, Todos, Workflows, sessions, delegation, and approval, and names `create_work_item`, `delegate_task`, `start_workflow_run`, and `decide_approval`. `0.25.0` instead resolves operator-configured external MCP servers and allow-lists them per employee; native company operations use the authenticated gateway HTTP/session protocol and workspace files. It ships none of those four company MCP tools.
- **Overnight composite.** The landing combines the above into autonomous overnight webhook → Todo → Workflow → approval flows. `0.25.0` can run employee cron prompts overnight and retain cron/session history, but cannot execute that native four-block state machine.

**Release invariant:** before the landing and npm package are launched together, either publish a Jinn release containing the four-block surface and named company MCP tools, or explicitly mark those landing rails as preview capabilities. The operator owns that release-timing decision.

### Final merge-risk read

Merge risk for `c2-docs` is **low**: the diff removes false stable claims, strengthens the runtime contract, and makes the site more accurate. The separate site-launch risk remains conditional on aligning the npm release with the tracked landing capabilities above.
