# Contributing

Thanks for helping improve jinn.run.

## Before you start

- Use Node.js 24 and pnpm 10.6.4.
- Keep public examples generic. Never commit credentials, personal paths, private gateway data, customer names, or session identifiers.
- Verify product claims against the Jinn source target. A route name or README sentence is not enough evidence.
- Preserve semantic HTML, keyboard behavior, reduced motion, and JavaScript-disabled content.
- Use the Ledger tokens already present in the project instead of adding replacement theme colors.

## Development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Use focused tests while iterating. Before opening a pull request, run at least:

```bash
pnpm test
pnpm build
pnpm safety:check
pnpm test:e2e
```

Changes to approved visual output also require `pnpm test:visual`. Do not update a visual baseline simply to make a failure disappear. Inspect the difference and explain why it is intentional.

## Documentation changes

Documentation frontmatter records the Jinn source files used for verification. Keep those paths accurate. Changes to CLI, API, authentication, configuration, migration, or product behavior should be checked against the exact release target in `src/data/release.json`.

The full contract gate requires a local Jinn checkout:

```bash
export JINN_SOURCE_ROOT=/absolute/path/to/jinn
export JINN_SOURCE_REPO="$JINN_SOURCE_ROOT"
pnpm check
```

The contract runner uses an isolated temporary home and gateway port. Never point it at a live Jinn instance.

`pnpm check` also verifies the Ledger token snapshot byte for byte against that checkout and executes every documentation contract against an isolated gateway. The source-independent `pnpm check:public` gate validates the static website and is what GitHub Actions runs on ordinary pushes.

## Pull requests

Keep pull requests focused and explain:

- What changed
- Why it changed
- Which product source supports public claims
- Which tests and visual checks passed
- Whether deployment behavior or public routes changed

Do not include generated reports, local screenshots, or temporary debugging files unless they are deliberate project fixtures.
