# Headless Probe Implementation and Execution Review

Date: 2026-05-19  
Repo: [minecraft-llm-agent-community](https://github.com/naem1023/minecraft-llm-agent-community)  
Committed state: `6deb6a9ea1d98492e37a717e9796b1e2025dfe61`  
Primary proof command: `./scripts/run-agent-loop-probe.sh`

## Bottom line

The first headless probe slice is implemented and has been executed against a real
local Docker-backed Minecraft server.

The result is not just a mocked test pass. Two Mineflayer bots connected to a
live server, a bounded tool loop ran, and a transcript artifact was written
under `data/evidence/`.

At the same time, this is still a small proof, not a full NPC-to-NPC autonomous
social runtime. The strongest claim the current code supports is:

1. `npc_a` and `npc_b` join a real local world.
2. `npc_a` runs a deterministic `observe -> move_to -> say -> wait -> say -> remember` loop.
3. The runtime, not the provider, owns the `busy -> available` transition.
4. The transcript captures the live run.

The code does **not** yet prove a fully autonomous two-sided NPC conversation or
good movement quality.

## What was implemented

### Probe package

The new runtime lives under `probe/` as a Bun-first TypeScript package.

Key files:

| File | Role |
| --- | --- |
| `probe/package.json` | Bun scripts and dependencies |
| `probe/tsconfig.json` | TypeScript config |
| `probe/compose.yaml` | Local vanilla Docker server |
| `probe/src/config.ts` | Probe defaults and server env |
| `probe/src/server/dockerServer.ts` | Docker lifecycle, published-port lookup, ping readiness, cleanup |
| `probe/src/runtime/createBots.ts` | Create and close two Mineflayer bots |
| `probe/src/runtime/dialogueState.ts` | Runtime-owned `busy` / `available` state |
| `probe/src/runtime/memory.ts` | Small bounded memory store |
| `probe/src/runtime/transcript.ts` | Transcript writer |
| `probe/src/provider/deterministicProvider.ts` | Deterministic proposal sequence |
| `probe/src/tools/*.ts` | `observe`, `moveTo`, `say`, `wait`, `remember`, and proposal validation |
| `probe/src/runtime/agentLoop.ts` | Bounded six-step tool loop |
| `probe/src/runProbe.ts` | End-to-end orchestration |
| `probe/src/cli.ts` | CLI entrypoint |
| `scripts/run-agent-loop-probe.sh` | Main proof command |

### Docs updates

The repo docs were also updated to match the new direction.

1. `README.md` now points to the headless probe as the active path.
2. Legacy Voyager/Fabric/manual-server docs were moved under `docs/blog-doc/Archived/Documents/`.
3. The Docusaurus landing content was rewritten so the docs site points readers
   to the migration docs first, not the older setup.

## What was verified

These commands were run successfully against the current code:

```sh
cd probe && bun test
cd probe && bun run typecheck
./scripts/run-agent-loop-probe.sh
npm run build --prefix docs
```

Observed results:

1. `bun test` passed with **10 tests across 3 suites**.
2. `bun run typecheck` passed.
3. `./scripts/run-agent-loop-probe.sh` exited `0` and wrote a transcript.
4. `npm run build --prefix docs` succeeded after the archive move.

The latest verified live artifact from the real run is:

```text
data/evidence/agent_loop_probe_v0-1779155056588.json
```

## What happened in the live run

### Transcript summary

From `data/evidence/agent_loop_probe_v0-1779155056588.json`:

- bots: `npc_a`, `npc_b`
- step count: `6`
- tool sequence:
  - `observe`
  - `move_to`
  - `say`
  - `wait`
  - `say`
  - `remember`
- first `busy` result happened at step index `2`
- the next tool after `busy` was `wait`
- final result:
  - `status: "success"`
  - `why: "runtime-owned busy result changed the next action"`

### Step-by-step evidence

| Step | Tool | Key evidence | Result |
| --- | --- | --- | --- |
| 1 | `observe` | `npc_a` sees `npc_b` at distance `1.41`, `busy: true` | `ok` |
| 2 | `move_to` | movement command executed toward `npc_b` | `moved`, post-move distance `3.51` |
| 3 | `say` | text: `"hi npc_b, are you free?"` | `busy` |
| 4 | `wait` | waited `20` ticks because `npc_b` was busy | `waited` |
| 5 | `say` | text: `"checking again when you are ready"` | `delivered` |
| 6 | `remember` | note recorded: `"npc_b responded after one busy turn"` | `remembered` |

## What this proves

This run proves several concrete things.

### 1. The probe is not only unit-tested

The live proof ran through the real entrypoint and produced a transcript from a
real local server session.

### 2. Two real bots were present

The transcript lists both `npc_a` and `npc_b`, and the runtime observed one bot
from the other inside the world state.

### 3. The bounded tool loop executed end to end

The loop did not stop at setup. It reached `remember`, wrote the final success
record, and persisted the artifact.

### 4. `busy` is runtime-owned, not provider-invented

The deterministic provider only chooses the next proposed tool. The runtime
dialogue state decides when `npc_b` is busy and when it becomes available. The
artifact shows the expected `busy -> wait -> delivered` transition.

## What this does **not** prove yet

This is the part another AI reviewer should look at carefully.

### 1. It is not yet a two-sided autonomous NPC conversation

`npc_b` does not run its own agent loop. The current proof is still centered on
`npc_a` acting against runtime-owned state associated with `npc_b`.

### 2. Movement quality is not good yet

The latest run is especially important here:

- first observed distance: `1.41`
- `move_to` result distance: `3.51`

So the movement tool clearly executed, but it did **not** reliably move the bot
closer to the target in that run. The current `moveTo` implementation is a very
small `lookAt + forward` probe, not pathfinding.

That means the correct conclusion is:

- **movement happened**
- **movement quality is still weak**

### 3. There is no live LLM provider yet

The provider is deterministic by design. That was intentional for this slice.
`openai-codex` is still out of scope until the bounded runtime path is solid.

### 4. This is not the village/social-simulation phase

There is no economy, village, society model, or multi-agent drama layer yet.
This slice only proves the smallest runtime path.

## Review points for the next AI

If another AI is reviewing this state, these are the highest-value questions.

### Runtime correctness

1. Is `busy -> available` still fully owned by `dialogueState`, with no leakage
   from the provider layer?
2. Is `runProbe.ts` handling partial initialization and cleanup in the right
   order?
3. Is `dockerServer.ts` now bounded and safe enough for repeated local runs?

### Live-behavior quality

1. Should `moveTo` stay this simple for one more slice, or is the next task
   clearly to introduce pathfinding or a stronger approach-to-target behavior?
2. Is the current `say` tool boundary right, or should there be a separate
   world-response layer for dialogue outcomes?
3. Is the transcript shape good enough for future review, or does it need more
   event detail before the next feature slice?

### Product direction

1. Should the next step be better movement and encounter quality?
2. Or should the next step be a second bot loop so `npc_b` can act rather than
   only be observed and gated by runtime state?
3. Are there any remaining legacy docs or README paths that still over-emphasize
   Voyager-era material?

## Suggested next tasks

These are the most reasonable next steps from the current state:

1. Improve `moveTo` so it reliably closes distance instead of only pressing
   forward briefly.
2. Decide whether `npc_b` should remain runtime-gated for one more slice or get
   its own bounded loop.
3. Add better live-run evidence if needed, such as screenshots or structured
   event logs in addition to the transcript JSON.
4. If another provider is introduced later, keep the current runtime validation
   boundary intact and do not reintroduce arbitrary code execution.

## Reviewer shortcut

If another AI only has time for a quick check, read these in order:

1. `probe/src/runProbe.ts`
2. `probe/src/runtime/agentLoop.ts`
3. `probe/src/server/dockerServer.ts`
4. `probe/src/tools/moveTo.ts`
5. `probe/src/runtime/dialogueState.ts`
6. `data/evidence/agent_loop_probe_v0-1779155056588.json`

That is enough to understand what was built, what ran, and where the current
limits are.
