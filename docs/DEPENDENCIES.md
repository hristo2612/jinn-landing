# Dependency maintenance

## `eslint-plugin-astro`

The project pins `eslint-plugin-astro` to `1.5.0` for reproducible linting. Its
declared Node range includes the repository's pinned Node 24 release, and the
current combination passes both `pnpm lint` and `pnpm typecheck`.

Before upgrading it, rerun those commands under the pinned Node and pnpm
versions and review any new Astro lint rules before accepting automated fixes.
