---
sidebar_position: 2
---

# Agent Search Index

Status: active migration index
Last updated: 2026-05-19

Use this file first. It exists so the next agent does not rediscover the same
server, client, provider, and architecture decisions from chat history.

## Fast Route Table

| Search phrase or task | Read first | Then inspect |
| --- | --- | --- |
| `MINECRAFT_AGENT_LOOP_MIGRATION`, `migration`, `zero based build` | `Migration/agent-loop-migration.md` | `Migration/minimal-probe-goal.md` |
| `HEADLESS_MINEFLAYER_PROBE`, `headless`, `server setup`, `no manual client` | `Migration/headless-mineflayer-setup.md` | `Migration/minimal-probe-goal.md` |
| `NO_VOYAGER_EVAL_LOOP`, `Voyager`, `old repo`, `eval` | `Migration/agent-loop-migration.md` | `Analysis-of-Prior-Projects/voyager.md` |
| `OPENAI_CODEX_PROVIDER`, `openai-codex`, `Codex provider` | `Migration/openai-codex-provider.md` | `Migration/minimal-probe-goal.md` |
| `GAME_RUNTIME_CODEX_AUTH`, `codex auth`, `provider auth` | `Migration/openai-codex-provider.md` | root `AGENTS.md` |
| `handoff`, `GPT 5.4 Copilot`, `next session` | `Migration/handoff-gpt54-copilot.md` | all files above |

## Canonical Decision

This repository should not continue by expanding the previous Voyager baseline.
Use it as historical context only.

The next useful work is a small headless mineflayer spike:

```text
local headless server
-> two mineflayer bots
-> small observe/move/say/wait loop
-> transcript and event log
-> optional browser viewer or screenshot
```

## Anti-Drift Rules

- Do not make Minecraft client login or human-in-world inspection a gate.
- Do not add Fabric/Forge mods to the first proof.
- Do not let an LLM write arbitrary JS and `eval` it as the core loop.
- Do not start with a full village, economy, or multi-agent society.
- Do not confuse Codex CLI auth with game-runtime `openai-codex` provider auth.

## Useful Local Repos

- Current repo: `/Users/naem1023/git/minecraft-llm-agent-community`
- Current mineflayer clone: `/Users/naem1023/git/mineflayer`
- Dream of One direction source: `/Users/naem1023/git/dream-of-one`
- Game Studio source: `/Users/naem1023/git/game-studio`
