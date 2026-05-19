# Repo Agent Notes

## Current Direction

This repository is now a reference and migration staging area for a new
Minecraft agent-loop probe. Do not revive the old Voyager-style project as the
active architecture.

The next build should be zero-based and tiny:

- headless local Minecraft Java server;
- multiple mineflayer bots as NPCs;
- no manual Minecraft client requirement;
- no Fabric/Forge mod setup for the first proof;
- no raw LLM-generated JavaScript `eval` loop;
- allow small generated TypeScript skill bundles when they are written to disk,
  transcript-visible, statically screened for blocked APIs, and executed with a
  short runtime timeout;
- a bounded tool loop where the LLM chooses the next valid tool call and
  utterance, while the runtime validates movement, chat availability, state,
  inventory, records, budget, and termination.

## Search Index

Read `docs/docs/Agent-Search-Index.md` first for routing.

Important search tokens:

- `MINECRAFT_AGENT_LOOP_MIGRATION`
- `HEADLESS_MINEFLAYER_PROBE`
- `MINECRAFT_GAMEPLAY_MODEL`
- `SKILL_VILLAGE_FAILURE`
- `NO_VOYAGER_EVAL_LOOP`
- `NO_MANUAL_CLIENT_GATE`
- `OPENAI_CODEX_PROVIDER`
- `GAME_RUNTIME_CODEX_AUTH`
- `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH`

## Required Reading Order

1. `docs/docs/Agent-Search-Index.md`
2. `docs/docs/Migration/agent-loop-migration.md`
3. `docs/docs/Migration/headless-mineflayer-setup.md`
4. `docs/docs/Migration/openai-codex-provider.md`
5. `docs/reports/2026-05-19-local-minecraft-agent-repo-analysis.md`
6. `docs/reports/2026-05-19-skill-village-failure-report.md`
7. `docs/reports/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md`
8. `docs/docs/Migration/minimal-probe-goal.md`
9. `docs/docs/Migration/handoff-gpt54-copilot.md`

## Design Rules

- Use Minecraft as an experiment accelerator, not as a premature replacement
  for Dream of One.
- The first proof is not a village simulator. It is a tiny NPC tool-loop probe.
- Keep implementation aggressively simple. Prefer small, named modules over
  large files. If a TypeScript file approaches a few hundred lines, split it by
  responsibility before adding more behavior.
- Keep functions small and single-purpose. Avoid “runner” files that contain
  config, provider calls, memory, skill execution, Docker control, and CLI
  orchestration all together.
- Use clear directory boundaries:
  - `gameplay/` for Minecraft progression, curriculum, primitives, seed skills,
    and success verification;
  - `server/` for Docker/server lifecycle;
  - `runtime/` for bot creation and loop orchestration;
  - `memory/` for per-agent and public event memory;
  - `skills/` for seed/generated skill execution;
  - `provider/` for live model requests and tracing;
  - CLI files should only parse config and call one high-level runner.
- Do not let quick probes become permanent monoliths. Temporary scripts are
  acceptable for one live check, but committed code must be simplified and
  factored into small files immediately after the behavior is proven.
- Do not add new docs under `docs/superpowers`. That hierarchy is deprecated.
  Use `docs/reports`, `docs/specs`, or `docs/plans`.
- Do not expect social simulation from persona text alone. Add Minecraft task
  pressure first: resource gathering, crafting, tool upgrades, storage,
  exploration, scarcity, and shared/private inventory.
- Mineflayer provides the game client API. For embodied experiments, prefer
  generated TypeScript skill bundles over raw eval: each skill should export one
  bounded `run(ctx)` function and use only the runtime-provided context helpers.
- Prefer Docker or mineflayer's `minecraft-wrap` pattern over manual server
  setup.
- Human visual inspection is optional. Prefer transcript, structured event log,
  and optional prismarine-viewer/screenshot evidence.
- Keep tests small and Detroit-style. Do not add broad mocks to create false
  confidence.

## Auth Rule

When this repo says "Codex auth" for gameplay, it means game-runtime provider
auth for the `openai-codex` provider. It does not mean Codex CLI login.

Use an ignored repo-local auth store such as:

```text
build/provider-auth/openai-codex-auth.json
```

Do not inspect or print raw tokens. Do not start a browser/device login flow
unless the auth store is missing, expired, rejected by a live smoke, or the user
explicitly asks to refresh provider auth.
