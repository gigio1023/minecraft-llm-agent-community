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
- no LLM-generated JavaScript `eval` loop;
- a bounded tool loop where the LLM chooses the next valid tool call and
  utterance, while the runtime validates movement, chat availability, state,
  inventory, records, budget, and termination.

## Search Index

Read `docs/docs/Agent-Search-Index.md` first for routing.

Important search tokens:

- `MINECRAFT_AGENT_LOOP_MIGRATION`
- `HEADLESS_MINEFLAYER_PROBE`
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
5. `docs/docs/Migration/minimal-probe-goal.md`
6. `docs/docs/Migration/handoff-gpt54-copilot.md`

## Design Rules

- Use Minecraft as an experiment accelerator, not as a premature replacement
  for Dream of One.
- The first proof is not a village simulator. It is a tiny NPC tool-loop probe.
- Mineflayer provides the game client API. It does not provide the social
  runtime; implement that as a small wrapper over observe, move, say, wait,
  inspect, and remember.
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
