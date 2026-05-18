---
sidebar_position: 5
---

# Handoff For GPT 5.4 Copilot

Status: active handoff
Search tokens: `GPT54_COPILOT_HANDOFF`, `HEADLESS_MINEFLAYER_PROBE`,
`OPENAI_CODEX_PROVIDER`.

## One-Line Mission

Prepare and implement a zero-based headless mineflayer agent-loop probe that
proves two Minecraft bot NPCs can observe, move, talk, wait, and adapt through
validated tool results without manual Minecraft client inspection.

## Context

The old repository explored a Voyager-style Minecraft LLM agent. That is no
longer the target architecture. The old code can be used for reference only.

The new direction is closer to a constrained coding-agent loop inside
Minecraft:

```text
observe
-> choose one allowed tool call and utterance
-> validate and execute through mineflayer
-> read result
-> update short memory
-> repeat within a small budget
```

The LLM owns intent and wording. The runtime owns tool schemas, validation,
world state, safety, transcript, and termination.

## Read First

1. `AGENTS.md`
2. `docs/docs/Agent-Search-Index.md`
3. `docs/docs/Migration/agent-loop-migration.md`
4. `docs/docs/Migration/headless-mineflayer-setup.md`
5. `docs/docs/Migration/openai-codex-provider.md`
6. `docs/docs/Migration/minimal-probe-goal.md`

## Current Repo State To Respect

- Existing repo path: `/Users/naem1023/git/minecraft-llm-agent-community`
- Existing mineflayer clone for reference: `/Users/naem1023/git/mineflayer`
- Old untracked files may exist, including `.DS_Store` and old
  `voyager/env/mineflayer/`; do not delete or revert them unless explicitly
  asked.
- `.gitignore` now ignores `.DS_Store`, `build/provider-auth/`,
  `data/evidence/`, and `tmp/`.

## Implementation Plan

Keep this small. Do not build a full framework.

1. Add a Node 22-oriented probe package or scripts.
2. Add a local headless server path:
   - prefer Docker compose with `itzg/minecraft-server:java21`, or
   - use `minecraft-wrap` if Docker is not available.
3. Start local server with:
   - `ONLINE_MODE=FALSE`;
   - flat world;
   - creative mode;
   - peaceful difficulty;
   - animals/monsters off;
   - NPC spawning on.
4. Spawn two mineflayer bots:
   - `npc_a`;
   - `npc_b`;
   - `auth: "offline"`;
   - `viewDistance: "tiny"`.
5. Implement tiny tools:
   - `observe`;
   - `move_to`;
   - `say`;
   - `wait`;
   - `remember`.
6. Implement a deterministic fake provider first.
7. Run `agent_loop_probe_v0`:
   - `npc_a` observes;
   - moves near `npc_b`;
   - says a line;
   - handles busy/unavailable once;
   - waits or rephrases;
   - records memory;
   - writes transcript.
8. Only after the deterministic proof works, add an interface for
   `openai-codex` provider.

## Provider/Auth Rule

Do not start with provider auth.

When adding live provider support:

- provider id: `openai-codex`;
- auth store: `build/provider-auth/openai-codex-auth.json`;
- model: `gpt-5.4-mini`;
- reasoning: low;
- no model fallback;
- budget cap: `<= $0.01` unless user changes it.

Do not run Codex CLI login for game provider auth. Codex CLI auth is not the
same as the game runtime provider auth.

## Definition Of Done For First Slice

- `npm`/Node scripts can start or target a local headless server.
- Two bots connect without a manual Minecraft client.
- One command runs the deterministic `agent_loop_probe_v0`.
- The run writes a transcript JSON or markdown artifact.
- The transcript shows at least three observe/tool/result iterations.
- One result changes the next action.
- README and docs mention the exact run command.
- Commit and push the coherent slice.
