# jinn.run — Landing Page Brief (shared)

## What Jinn is (the product truth — don't invent features)

Jinn is an **open-source platform for running your own AI company**. One
local-first gateway daemon; you hire AI **Employees** (each is an engine —
Claude Code, Codex, and more — wearing a role, with a persona, rank, and
department), and the company runs itself through four primitives:

1. **Employees** — an engine wearing a role. Hire them, give them a seat in the
   org chart, they talk to each other and delegate.
2. **Todos** — the live work ledger. The company's shared memory of what needs
   doing / in progress / blocked / needs-you.
3. **Workflows** — reusable SOPs. "Here's how we do X." A run spawns and
   advances Todos.
4. **Triggers** — how the company wakes up: cron schedules, todo status
   changes, webhooks/events from the outside world.

**MCP is the hands** — every employee operates the whole company through one
tool interface. A COO agent (default: "Jimbo") orchestrates, reviews, and
gates approvals so the human operator only sees what matters.

Other true facts you may use:

- Install: `npm install -g jinn-cli` → `jinn start`
- Local-first: runs on YOUR machine, your API keys, your data. Open source.
- Web dashboard (chat, org chart, todos, workflows, sessions) + Slack connector.
- Multi-engine: Claude Code, Codex (GPT), and more; employees can switch engines.
- Company metaphor IS the API: hire, delegate, escalate, approve.
- Positioning line to riff on: "Run your own AI company." / reads like a
  command: `jinn run`.

## What this page is

The public landing page at **https://jinn.run**. It must communicate what Jinn
is in seconds AND be a showpiece of design craft — this page itself is a demo
of what an AI org can produce.

## The bar (from the operator)

- Push boundaries: advanced visual techniques, high-quality 3D where it earns
  its place, otherworldly beautiful animations, exceptional color palettes,
  novel/interesting font choices.
- This is a MARKETING page, not the app — you are NOT bound by the app's
  Ledger design rules (hairline bans etc.). You ARE bound by taste: no
  template-looking, no "web-app default", nothing cheap.
- Use libraries where applicable (three.js, GSAP, Lenis, splitting text,
  variable fonts via Google Fonts/Fontshare CDN…). Don't reinvent wheels.
- Must still be fast, responsive (390px mobile matters), and legible.
- 100% generic/public-safe content: no personal names, keys, or absolute home
  paths in the deliverable.

## Deliverable for THIS phase (variant mock)

- A self-contained static page: `~/Projects/jinn-landing/variants/<your-slug>/index.html`
  (inline CSS/JS or local files in that dir; CDN libs allowed).
- Full landing structure: hero, "what it is" (the four blocks), how it works
  (install → hire → it runs), maybe a live-feeling demo vignette, footer with
  GitHub/npm links (placeholder hrefs ok).
- At least **three iteration passes**: after finishing, comb through for design
  problems and opportunities to complexify/refine. Screenshot, critique
  yourself against the bar, improve. Do not stop at draft one.
- Screenshots (PNG, deviceScaleFactor 2) into `variants/<slug>/shots/`:
  - desktop 1440: hero + at least one mid-scroll section
  - mobile 390 (use Playwright, NOT headless-chrome --window-size)
- A short `variants/<slug>/NOTES.md`: design intent, palette, type choices,
  motion concept, libraries used.

## Screenshot recipes

Desktop (headless Chrome ok):

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1440,900 --virtual-time-budget=8000 \
  --screenshot=shots/hero-1440.png "file://$PWD/index.html"
```

If WebGL renders black in headless, try removing `--disable-gpu` (don't pass
it), or use Playwright with `chromium.launch({ args: ['--use-angle=swiftshader'] })`.
Mobile: Playwright `newContext({ viewport: {width:390,height:844}, deviceScaleFactor: 2 })`.
Playwright browsers are cached under `~/Library/Caches/ms-playwright`; the
package is available in `~/Projects/jinn/node_modules`.

For scroll-position shots with Playwright: `page.evaluate(() => window.scrollTo(0, N))`,
wait ~1s for animations, then screenshot.

## Optional assets

Gemini (nano-banana-pro skill) and OpenAI image APIs are available via
`~/.jinn/secrets/api-keys.json` if a generated hero asset genuinely beats
code-drawn visuals — but for this mock phase, procedural/code visuals are
usually better (crisp, animatable, no asset weight).
