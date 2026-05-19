# Headless Mineflayer Probe Implementation Plan

Goal: build the smallest headless Minecraft probe that starts a local vanilla
server without a manual client, connects two offline Mineflayer bots, runs a
deterministic observe/move/say/wait/remember loop, and writes a transcript
artifact under `data/evidence/`.

## Architecture

Use a Docker-first vanilla Java server via `itzg/minecraft-server:java21`. Keep
the probe isolated under `probe/` as a Bun-first TypeScript package with small
focused files. Resolve Docker-assigned host ports at runtime, gate readiness
with `mc.ping()`, and keep dialogue state runtime-owned rather than provider
fakery.

## Tech Stack

- Bun 1.3.x
- TypeScript
- Node 22-compatible dependencies
- Mineflayer `^4.37.1`
- `minecraft-protocol` `^1.66.2`
- Docker Compose
- Vanilla Minecraft Java `1.21.11`

## Constraints

- Keep the first slice vanilla: no Fabric, Forge, or manual Minecraft client.
- Write the probe in TypeScript and keep files small and focused.
- Prefer Bun for install, tests, typecheck, and run.
- Do not hard-code host port `25565`; resolve it with Docker Compose.
- Readiness must be Docker up, `mc.ping()` succeeds, bots connect, bots wait for
  `spawn`.
- Keep automated tests small: server config defaults, transcript writer, and
  runtime dialogue/tool validation.
- Treat `./scripts/run-agent-loop-probe.sh` as the primary proof, not a default
  integration test.

## Planned File Map

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

## Acceptance Checklist

- [ ] `probe/package.json` and `probe/tsconfig.json` define a Bun-first
  TypeScript package.
- [ ] Probe server version is `1.21.11`, not `1.21.1`.
- [ ] Docker publishes an ephemeral host port instead of hard-coded `25565`.
- [ ] Readiness is gated by `mc.ping()` before bot connect.
- [ ] `npc_b` busy/available is produced by runtime dialogue state, not provider
  fakery.
- [ ] Automated tests stay small and contract-focused.
- [ ] `bun run --cwd probe typecheck` passes.
- [ ] `./scripts/run-agent-loop-probe.sh` is the primary proof path.
- [ ] Transcript artifact under `data/evidence/` shows `3+`
  observe/tool/result iterations.
