# Headless Mineflayer Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the smallest headless Minecraft probe that starts a local vanilla server without a manual client, connects two offline mineflayer bots, runs a deterministic observe/move/say/wait/remember loop, and writes a transcript artifact under `data/evidence/`.

**Architecture:** Use a Docker-first vanilla Java server via `itzg/minecraft-server:java21`. Keep the probe isolated under `probe/` as a Bun-first TypeScript package with small focused files, resolve the Docker-assigned host port at runtime, gate readiness with `mc.ping()`, and keep `busy` / `available` as runtime-owned dialogue state rather than provider fakery. Bun is the default runner for install, tests, typecheck, and the proof script; Node 22 stays the compatibility floor for Mineflayer and the fallback runtime only if Bun blocks the live probe.

**Tech Stack:** Bun 1.3.x, TypeScript, Node 22-compatible dependencies, mineflayer `^4.37.1`, minecraft-protocol `^1.66.2`, Docker Compose, vanilla Minecraft Java `1.21.11`

---

## Why this plan is split

The earlier JavaScript/Node-only plan no longer matches the requested implementation path. This index keeps the shared constraints and execution order in one place, while each subplan stays small enough to edit without dragging the whole probe into one file.

## Read order

1. [01 - Baseline and server](./2026-05-19-headless-mineflayer-probe/01-baseline-and-server.md)
2. [02 - Transcript and runtime state](./2026-05-19-headless-mineflayer-probe/02-transcript-and-runtime-state.md)
3. [03 - Proof runtime and script](./2026-05-19-headless-mineflayer-probe/03-proof-runtime-and-script.md)
4. [04 - README and acceptance](./2026-05-19-headless-mineflayer-probe/04-readme-and-acceptance.md)

Execute them in that order. Part 01 resets the package as Bun-first TypeScript. Part 02 adds the pure logic. Part 03 wires the live proof. Part 04 updates repo-facing docs and re-checks the slice.

## Research-backed constraints

- Use **mineflayer `^4.37.1`** and **Minecraft Java `1.21.11`** because `1.21.11` is the latest Mineflayer-tested GA patch in the `1.21.x` line.
- Keep the first slice **vanilla / no Fabric / no Forge / no manual Minecraft client**.
- Write the probe in **TypeScript** and keep files small and focused. If one file starts absorbing multiple responsibilities, split it before it becomes the new monolith.
- Prefer **Bun** for `install`, `test`, `typecheck`, and `run` because it is available locally and makes iteration faster.
- Keep **Node 22** as the compatibility floor for dependencies and as the fallback runtime only if Bun proves unreliable for the live Mineflayer path.
- Do **not** hard-code host port `25565`; let Docker publish an ephemeral host port and resolve it with `docker compose port`.
- Readiness must be **Docker up -> `mc.ping()` succeeds -> bots connect -> bots wait for `spawn`**.
- Keep automated tests to **three small suites only**:
  1. server config defaults
  2. transcript writer
  3. runtime dialogue/tool validation
- Treat `./scripts/run-agent-loop-probe.sh` as the **primary proof**, not a default integration test.
- Do **not** add `openai-codex`, `minecraft-wrap`, Fabric/Forge setup, or a legacy Voyager eval loop in this first slice.

## Planned file map

- `probe/package.json`
- `probe/tsconfig.json`
- `probe/compose.yaml`
- `probe/src/config.ts`
- `probe/src/server/dockerServer.ts`
- `probe/src/runtime/createBots.ts`
- `probe/src/runtime/dialogueState.ts`
- `probe/src/runtime/memory.ts`
- `probe/src/runtime/transcript.ts`
- `probe/src/provider/deterministicProvider.ts`
- `probe/src/tools/observe.ts`
- `probe/src/tools/moveTo.ts`
- `probe/src/tools/say.ts`
- `probe/src/tools/wait.ts`
- `probe/src/tools/remember.ts`
- `probe/src/tools/index.ts`
- `probe/src/runtime/agentLoop.ts`
- `probe/src/runProbe.ts`
- `probe/src/cli.ts`
- `probe/test/serverConfig.test.ts`
- `probe/test/transcript.test.ts`
- `probe/test/runtimeLogic.test.ts`
- `scripts/run-agent-loop-probe.sh`
- `README.md`

## Explicitly out of scope

- `scripts/start-headless-server.sh`
- `minecraft-wrap` fallback path
- Fabric / Forge / modpacks
- live `openai-codex` provider
- broad integration test suites that download and boot Java servers inside the default `bun test` run

## Acceptance checklist

- [ ] `probe/package.json` and `probe/tsconfig.json` define a Bun-first TypeScript package
- [ ] probe server version is `1.21.11`, not `1.21.1`
- [ ] Docker publishes an ephemeral host port instead of hard-coded `25565`
- [ ] readiness is gated by `mc.ping()` before bot connect
- [ ] `npc_b` busy/available is produced by runtime dialogue state, not provider fakery
- [ ] automated tests stay at exactly three small suites
- [ ] `bun run --cwd probe typecheck` passes
- [ ] `./scripts/run-agent-loop-probe.sh` is the primary proof path
- [ ] transcript artifact under `data/evidence/` shows `3+` observe/tool/result iterations
