# Real Server Simulation Test Plan

Search token: `REAL_SERVER_SIMULATION_TEST_PLAN`

This plan tests the runtime as a real Minecraft simulation: a managed server is
running, Mineflayer bots connect to that server, actions mutate world
state, and artifacts prove or reject progress.

## Goal

Prove that the current architecture can run a bounded social-life simulation
seed with real server execution.

The target behavior is one or more actors that:

- connect to a real local Minecraft server;
- choose bounded actions from `ActorSoul`, active `LifeGoal`, `WorldEvent`
  context, memory, previous `CycleJudgment`, and owned action skill records;
- execute runtime-owned Minecraft primitives through Mineflayer;
- store evidence, judgment, and memory after each cycle;
- use prior judgment or memory in a later cycle;
- fail or block truthfully when no world-state progress occurs.

This plan does not accept offline, synthetic, or contract-only runs as proof of
simulation.

## Non-Goals

- Do not prove full village behavior.
- Do not prove human-like personhood.
- Do not count persona text as social simulation.
- Do not count provider text, helper output, or status labels without Minecraft
  evidence.
- Do not let deterministic or builtin fallback masquerade as live provider
  agency.

## Required Environment

Run commands from `probe/` unless a command says otherwise.

```bash
cd probe
bun install
```

Gemini social-cycle provider for cost-sensitive live checks:

```text
# repo-root .env
GEMINI_API_KEY=...
```

OpenAI social-cycle provider is explicit opt-in only:

```text
# repo-root .env
OPENAI_API_KEY=...
```

Before long free-tier runs, encode current dashboard usage in
`PROVIDER_USAGE_BUDGETS_JSON` or
`build/provider-usage/free-tier-budgets.json`.

Docker must be usable by the current shell:

```bash
docker info
```

On macOS with Colima:

```bash
colima status || colima start
docker info
```

The test owner must stop managed resources after live runs:

```bash
bun run server:stop
```

## Test Matrix

| ID | Test | Provider | Actors | Required Proof |
|----|------|----------|--------|----------------|
| T0 | Tooling and server preflight | none | none | Docker ready, managed server ready |
| T1 | Fresh live action skill contracts | deterministic | one actor/bot | implemented action skills pass with current-run evidence |
| T2 | Live Gemini social cycle | Gemini API `gemma-4-31b-it` | one actor | real action attempt, evidence, judgment, memory, later-cycle context, provider usage summary |
| T3 | Multi-actor connection smoke | deterministic | two actors | both actors connect and produce causal transcript artifacts |
| T4 | Live Gemini social cycle under concrete world context | Gemini API `gemma-4-31b-it` | one actor | attempts evidence-backed Minecraft progress without fake pass and stays within usage guard |
| T5 | Explicit target readiness gate | selected provider | one actor | passes only with current-run primitive/action-skill evidence, otherwise blocks |
| T6 | Long-horizon social-cycle stress test | selected live provider with budget guard | one actor | context continuity, truthful blocked state, partial or complete verifier-backed evidence |

## T0: Server Preflight

Start the managed server and require Minecraft protocol readiness.

```bash
bun run server:ready
bun run server:status
```

Pass criteria:

- `status=ready`;
- endpoint is printed;
- the endpoint is reachable by Mineflayer;
- no provider auth is read or printed;
- failure is classified as environment setup, not runtime failure.

Fail criteria:

- Docker daemon unavailable;
- compose command unavailable;
- Minecraft protocol ping times out;
- server readiness is inferred from container status only.

Cleanup after the test group:

```bash
bun run server:stop
```

## T1: Fresh Live Action Skill Contracts

Run the current action skill matrix against a real server.

```bash
bun run probe:skills -- \
  --max-actions 8 \
  --init-actor-workspace baseline \
  --continue-on-failure \
  --report ../tmp/live-action-skill-matrix.json
```

Pass criteria:

- matrix report exists;
- every implemented action skill has a current-run status;
- no implemented action skill is left as `pending_live_evidence`;
- no action skill passes without its postcondition evidence;
- failures point to a primitive, verifier, fixture, or environment blocker.

Evidence inspection:

```bash
jq '.summary, .statusRows[] | {skillId, status, evidenceScope, reason}' \
  ../tmp/live-action-skill-matrix.json
```

## T2: Live Gemini Social Cycle

Run one actor against the managed server with Gemini API planning.

```bash
bun run probe:social-cycle -- \
  --actor npc_b \
  --provider gemini-api \
  --model gemma-4-31b-it \
  --cycles 3 \
  --max-actions-per-cycle 3 \
  --isolate-workspace \
  --world-event "The settlement needs real Minecraft progress chosen from current observation and action_surface evidence. Do not claim success without inventory, block, position, container, chat, transcript, or verifier evidence." \
  --report ../tmp/live-social-cycle-gemini-api.json \
  --no-dashboard
```

Audit the report:

```bash
bun run src/runtime/goals/socialCycleReportAuditCli.ts \
  ../tmp/live-social-cycle-gemini-api.json
```

Pass criteria:

- `runtime_status` is `passed` only if `gameplay_progress_verified` is true;
- `agency_status.fixture_dependency` is false;
- `agency_status.builtin_goal_authority` is false;
- at least one action attempt executes a meaningful primitive such as
  `collect_logs`, `mine_block`, `craft_item`, or `craft_with_table`;
- meaningful primitive status matches the primitive verifier contract;
- every cycle has provider input/output, selected Actor Turn action or explicit
  archived planner action ref, evidence, and judgment refs;
- cycle 2 or later uses previous judgment or memory.

Evidence inspection:

```bash
jq '{
  runtime_status,
  agency_status,
  cycles: [.cycles[] | {
    cycle_id,
    verifier_status,
    attempts: [.action_attempts[] | {
      attempt_id,
      runtime_status,
      executed_tools,
      tool_statuses,
      verifier_status,
      evidence_refs
    }]
  }]
}' ../tmp/live-social-cycle-gemini-api.json
```

Inspect concrete action evidence:

```bash
ACTOR_ROOT=$(jq -r '.actor_workspace_root_dir' ../tmp/live-social-cycle-gemini-api.json)
find "$ACTOR_ROOT/npc_b/evidence" -name '*collect_logs*.json' -o -name '*mine_block*.json'
```

For each meaningful evidence file, inspect the `tool_attempt.result`:

```bash
jq '{evidence_id, turn_id, tool_attempt}' \
  "$ACTOR_ROOT/npc_b/evidence/<evidence-file>.json"
```

## T3: Multi-Actor Connection Smoke

Run a deterministic mutual probe that starts a real Docker-backed Minecraft
server, connects two actors, and writes a transcript.

```bash
bun run probe:v1
```

Pass criteria:

- two actors connect to the server;
- transcript path is printed;
- transcript contains both actor ids;
- transcript shows causal tool/world steps, not only provider text;
- final status explains success, failure, or cleanup errors.

This test does not prove live-provider social agency. It proves multi-actor server
connection and causal transcript shape.

## T4: Concrete-Context Social Cycle

Run the same live Gemini social cycle with explicit but query-neutral world
context.

```bash
bun run probe:social-cycle -- \
  --actor npc_b \
  --provider gemini-api \
  --model gemma-4-31b-it \
  --cycles 4 \
  --max-actions-per-cycle 3 \
  --isolate-workspace \
  --world-event "The actor should make one useful Minecraft change selected from current evidence and available action_surface affordances. Treat this as context, not a guaranteed goal. Record blockers honestly." \
  --report ../tmp/live-social-cycle-resource-context.json \
  --no-dashboard
```

Pass criteria:

- run audits cleanly;
- no pass without real gameplay progress;
- if only one narrow action succeeds, the report names only that verified action
  and does not claim broader goal completion;
- if a target block or item action is attempted, evidence includes before/after
  inventory, position, block, container, or failure facts as applicable;
- later cycles cite previous judgment or memory.

## T5: Explicit Target Readiness Gate

This is the next simulation gate, not yet a free pass.

Target readiness requires:

- an owned action skill or primitive path that can execute the selected target;
- structured Actor Turn tool parameters for physical targets, items, positions,
  or containers;
- evidence showing the target, before/after state, and failure reason when the
  action cannot complete;
- no provider claim of target success without current-run target evidence.

Until the selected verifier passes, target tests must end as blocked or partial
progress. A run that performs adjacent work and claims the whole target is
complete fails this plan.

## T6: Long-Horizon Social-Cycle Stress Test

This is a manual, budget-sensitive live test. It is useful after T0 and T1 are
clean. It should run one actor only and must have a provider usage budget
encoded before execution.

```bash
bun run probe:social-cycle -- \
  --actor npc_b \
  --provider gemini-api \
  --model gemma-4-31b-it \
  --cycles 100 \
  --max-actions-per-cycle 3 \
  --isolate-workspace \
  --fresh-world \
  --prepare-spawn-access \
  --world-seed social-context-100cycle-20260524 \
  --world-event "Long-horizon settlement context: help npc_b make useful Minecraft progress selected from current observation, memory, prior judgment, and action_surface affordances. Progress should be incremental and evidence-first. Do not claim the broader goal is complete without verifier evidence. If blocked, record the exact blocker and pivot to a smaller useful Minecraft action." \
  --report ../tmp/live-social-cycle-gemini-social-context-100.json \
  --no-dashboard
```

Pass criteria:

- Live provider is used; builtin and deterministic authority remain false.
- `fixture_dependency` is false after fresh-world setup.
- Previous judgment or memory is used in later cycles.
- The actor makes at least one meaningful current-run Minecraft change backed by
  inventory, position, block, container, chat, transcript, or verifier evidence.
- The report does not mark the broader goal complete unless the matching
  verifier passes.
- Repeated blockers are visible in evidence and can be grouped by reason.

Known current result:

- latest run recorded 54 cycles before cleanup hit a host file-permission
  blocker;
- the report audit passed;
- concrete current-run inventory and block-placement evidence was recorded;
- the broader goal was not completed and the runtime did not claim completion.

Follow-up items from this test live in
`project-docs/Architecture/Future-Works.md`.

## Report Review Checklist

For every live report:

- `fixture_dependency` must be false.
- `provider_error` must be absent when `runtime_status` is `passed`.
- `runtime_status: "passed"` requires `gameplay_progress_verified: true`.
- Meaningful progress requires a meaningful primitive with a successful status.
- All artifact refs must resolve under the producing actor workspace.
- Later cycles must include previous judgment or memory when previous cycles
  exist.
- Builtin or deterministic source must be labeled as such.
- OpenAI API and Gemini API runs must not read `openai-codex` auth.

## Failure Triage

Use these labels in the run notes:

| Label | Meaning |
|-------|---------|
| `environment_blocked` | Docker, Colima, compose, port, or Minecraft readiness failed |
| `provider_blocked` | provider API key, model access, quota, schema, usage budget, or provider response failed |
| `action_blocked` | Runtime refused an unsupported primitive or action skill |
| `verification_failed` | Tool ran but verifier rejected progress |
| `no_progress_truthful` | Actor observed, waited, or remembered without gameplay progress |
| `concept_proven` | Live server, connected actor, provider planning, runtime action, evidence, judgment, and memory all worked |

## Minimum Acceptance Bar

The simulation is accepted only when all of these are true in one live run:

1. Managed Minecraft server is ready.
2. At least one Mineflayer actor connects.
3. A live social-cycle provider is used explicitly with a known budget.
4. At least two cycles complete.
5. At least one meaningful Minecraft action succeeds with current-run evidence.
6. `CycleJudgment` writes memory from evidence.
7. A later cycle uses prior judgment or memory.
8. The audit passes.
9. Cleanup stops the managed server.

The concept is not accepted for any specific target until that target has its
own live evidence and verifier.
