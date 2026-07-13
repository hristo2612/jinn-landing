# Operator steering notes (jinn.run)

Running log of the operator's direct feedback from preview reviews. Each note
gets routed into design/implementation by Jimbo; status tracked here.

## 2026-07-10 — first hero preview

1. **Logo = 🧞 emoji.** Use the genie emoji as the brand mark (nav, favicon —
   presentation details to design). Replaces the amber rounded square.
   → Status: routed to Fable design refinement.

2. **"Alive" interactive dashboard windows.** The dashboard window's nav
   (ribbon) should be clickable — visitors can click into Todos / Workflows /
   Chat / Org and each pane simulates a real active company working:
   - Todos: real drag-and-drop animations, statuses changing, new todos
     appearing
   - Workflows: one or two switchable workflows, firing and working
   - Chat: conversations flowing, delegation, typing
   - Org chart etc.: same spirit
     The aliveness carries to every window on the page. Operator raised the
     alternative (current storyboard): scroll-driven transitions reusing one
     window — and asked design (Fable) to decide/refine the better model.
     → Status: routed to Fable design refinement (hybrid proposal: scroll
     remains the story spine; window also clickable; ambient alive loops per
     pane — subject to Fable's verdict).

## 2026-07-11 — versioning policy (operator directive)

3. **Docs capture post-0.25.0 features.** The operator: docs must include the
   features added after v0.25.0 — MCP (company tools), workflows, todos, etc. —
   "all of which will be live soon." Policy translation (Jimbo):
   - The SITE (landing, features, docs, machine routes) targets the **upcoming
     release** — the four-block surface on jinn's main, pinned to a commit.
   - The runtime-contract gate builds jinn-cli FROM SOURCE at that pin (npm
     pack), so every documented contract still execute-verifies against a real
     sandbox gateway. At release time the gate flips to npm latest and must
     pass unchanged.
   - **Site deploy (Phase E) gates on that jinn-cli release shipping** — the
     site never goes live describing software nobody can install.
   - Supersedes the strict npm-latest retargets where they removed four-block
     content; docs pages carry honest `since:` fields for the upcoming version.
     → Status: routed to the docs writer (restore + re-pin) and features owner
     (revert stable-retarget), reviewer re-verifies against a source-built
     sandbox.
