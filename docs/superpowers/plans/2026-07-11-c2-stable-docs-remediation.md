# C2 stable documentation remediation plan

## Objective

Retarget every documentation and machine-contract claim to the actual npm `latest` release, `jinn-cli@0.25.0`, and make runtime compatibility a required repository gate.

## Safety boundary

- Never call or bind port `7777`.
- Never read from or write to the operator's `~/.jinn` instance.
- Install the release under a temporary directory with an isolated `JINN_HOME`.
- Start `dist/src/gateway/daemon-entry.js` directly on a dynamically selected high loopback port; never invoke release lifecycle commands.
- Track and terminate the exact child process in `finally`, then remove the temporary directory.

## Work sequence

1. Add failing content-contract tests that reject `since` values newer than the single release marker, reject unreleased route names in docs/machine content, require engine discovery and composable multipart attachment guidance, and expect the stable-only information architecture.
2. Remove pages whose concepts do not exist in `0.25.0`; rename mixed pages so their titles and routes no longer imply unreleased delegation or knowledge APIs; update navigation, links, release metadata, and all remaining prose to the released surface.
3. Rewrite `/agents.md` as a compact `0.25.0` contract covering discovery, bearer/device auth, engine/employee discovery, session create/poll/message/child flows, cron, skills/org reads, connector authority, and multipart/base64 file handoff. Rewrite `/llms.txt` to the same release boundary.
4. Correct install, setup, configuration, migration, pairing, CLI, changelog, and API claims against the installed package. Add explicit Node LTS/native-toolchain prerequisites and disclose the installer-visible dependency advisory state without claiming reachability.
5. Add a release-contract smoke script to `pnpm check`. It will resolve npm `latest`, install that exact version in a disposable prefix, start the daemon directly on a non-7777 port, execute 48 stable assertions including the machine session protocol, validate response envelopes, and prove removed routes are not advertised.
6. Run focused tests red then green. Re-run all 48 checks, preserve a before/after mismatch record, run `pnpm check` and `pnpm test:e2e` twice, run the visual gate unchanged, leak-grep each staged commit, and tear down the sandbox.

## Commit boundaries

1. Stable release boundary and information architecture.
2. Stable API/CLI guides and machine routes.
3. Executable npm-release contract gate and regression tests.
4. Review evidence and any verification-only corrections.
