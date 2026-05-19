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
| `MUTUAL_NPC_INTERACTION_PROBE_V1`, `mutual interaction`, `two sided npc`, `material handoff` | `../superpowers/plans/2026-05-19-mutual-npc-interaction-probe.md` | `../superpowers/reports/2026-05-19-mutual-npc-interaction-probe-review.md` |
| `LIVE_NPC_DIALOGUE_PROBE`, `live dialogue`, `live-provider dialogue`, `openai-codex NPC dialogue` | `../specs/2026-05-19-live-npc-dialogue-design.md` | root `README.md`, `Migration/openai-codex-provider.md`, `../../probe/src/mutual/runLiveDialogueProbe.ts` |
| `MINECRAFT_LLM_OBSERVATION_LOOP`, `observation-action feedback`, `mineflayer agent context` | `../reports/2026-05-19-minecraft-llm-agent-observation-loop-research.md` | `../../probe/src/mutual/skillVillageCli.ts`, `../../probe/src/mutual/skillVillage/` |
| `SKILL_VILLAGE_FAILURE`, `failed social simulation`, `dirt digging loop` | `../reports/2026-05-19-skill-village-failure-report.md` | `../reports/2026-05-19-local-minecraft-agent-repo-analysis.md` |
| `MINECRAFT_GAMEPLAY_MODEL`, `Voyager seed skills`, `Minecraft progression prompt` | `../reports/2026-05-19-local-minecraft-agent-repo-analysis.md` | `../reports/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md`, `../../probe/src/mutual/skillVillage/` |
| `NO_VOYAGER_EVAL_LOOP`, `Voyager`, `old repo`, `eval` | `Migration/agent-loop-migration.md` | `Analysis-of-Prior-Projects/voyager.md` |
| `legacy install`, `old architecture`, `old progress` | `Archived/Documents/Installation.md` | `Archived/Documents/Architecture-of-Project.md` |
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
-> small observe/move/say/wait/converse loop
-> transcript and event log
-> optional browser viewer or screenshot
```

Archived legacy setup and progress notes now live under `Archived/Documents/`.

The current live proofs are now split:

- `agent_loop_probe_v0`: one acting bot, runtime-owned busy/available turn gate
- `mutual_npc_interaction_probe_v1`: both bots act, reply, approach, and verify
  a small paper handoff in the transcript
- `live_npc_dialogue`: two bots use the `openai-codex` provider to choose one
  validated mutual tool per turn, with real dialogue before later movement

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
