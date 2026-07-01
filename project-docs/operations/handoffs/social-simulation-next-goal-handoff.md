---
sidebar_position: 12
---

# Social Simulation Next Goal Handoff

Search token: `SOCIAL_SIMULATION_NEXT_GOAL_HANDOFF`.

Status: future multi-actor expansion handoff. It is subordinate to the active
central plan and should not drive current work before the no-regret core and
Goldilocks branch-triage gate.

Research-spine update, revised 2026-06-29: use this as historical context for
multi-actor expansion only. For current row-producing scenario pressure, use
`No-Regret-Core-Scenario-Catalog.md`.

Material-economy update, recorded 2026-06-15: this handoff predates the
personal-possession/material-claim/public-affordance benchmark framing. Treat
the shared-chest loop below as a legacy first exchange surface, not as the
definition of society or the required next benchmark. Use
`Material-Claims-And-Social-Economy-Benchmark-Plan.md` only as a reference case
library.

This page is not gated on the long-term diamond harness. Use it after the
single-actor Soul/LifeGoal social cycle can reliably produce current-run
Minecraft evidence, write CycleJudgment/memory, and reuse that judgment in a
later cycle. Longer dependency-chain harnesses can inform this work, but they do
not decide whether social simulation is allowed to proceed.

## Session Intent

The current repo already has enough substrate to stop doing broad speculative
architecture. This future work should prove that the system can move from a
single actor with Soul/LifeGoal continuity into a tiny social simulation loop
without losing the core discipline:

- LLMs can attempt bounded actor-owned action trials when the runtime grants the
  relevant action surface.
- Mineflayer helpers and verifiers remain the dense runtime substrate.
- Success is accepted only from current-run Minecraft evidence.
- Actor social behavior comes from role context, shared resources, relationship
  events, and memory, not persona text alone.
- Review and repair run asynchronously after actor turns.

The next target is not a rich society. It is one reliable social exchange loop.

## Target Slice

Build and prove a two-to-three actor loop around a shared early-game dependency:

```text
gatherer obtains wood
-> gatherer deposits wood into shared storage
-> crafter inspects shared storage
-> crafter crafts a useful item
-> crafter deposits or hands off the item
-> quartermaster records shared value and relationship events
```

Recommended first concrete scenario:

```text
social_craft_stone_axe_1
```

Acceptance criteria:

- `npc_b` gathers or otherwise obtains enough wood-related inputs.
- `npc_b` deposits at least one useful item into the shared chest.
- `npc_c` observes the shared chest and obtains required materials from shared
  storage or via a request.
- `npc_c` produces `stone_axe >= 1` or a smaller agreed proof item if the stone
  axe dependency chain is too large for the first pass.
- shared chest ledger or handoff evidence proves that value became socially
  visible, not only privately held.
- relationship ledger records at least one evidence-backed positive or negative
  event derived from runtime artifacts.
- provider input/output snapshots and dashboard views make the loop auditable.

If `stone_axe` is too broad on the first implementation attempt, use this
fallback ladder without changing the architecture:

1. `social_craft_sticks_from_deposited_logs_1`
2. `social_craft_crafting_table_from_deposited_logs_1`
3. `social_craft_wooden_pickaxe_from_deposited_materials_1`
4. `social_craft_stone_axe_1`

Do not skip the social visibility requirement. A private inventory success is
not enough for this slice.

## Why This Is The Right Next Work

The project's final goal is actor social simulation. The current implementation
has strong pieces, but they are still mostly evaluated as individual action
skills or single-actor objectives. The next useful proof is therefore not
another isolated primitive. It is a minimal loop where one actor's verified
world progress changes another actor's available choices.

This slice tests the real architecture:

- actor workspace as source of truth;
- direct generated action skills as the fast propagation path;
- shared storage as social state;
- memory retrieval as practical context, not a transcript dump;
- relationship events as evidence-backed context;
- dashboard as observer;
- reviewer sidecars as post-turn critics.

## Workstreams

### Workstream A: Social Objective Runner

Goal: introduce a bounded objective runner for multi-actor social tasks.

Implement:

- an objective id such as `social_craft_stone_axe_1`;
- actor assignment rules for `quartermaster`, `gatherer`, and `crafter`;
- a small turn scheduler with per-actor max action budget;
- objective-scoped terminal checks over current-run transcripts, chest ledger,
  inventory snapshots, and relationship events;
- JSON report output with one row per actor and one row per social exchange.

Do not make this a large planner. It should compose existing runtime pieces and
stop when the objective is proven, failed, or blocked.

Suggested files:

- `probe/src/objectives/socialObjectiveRunner.ts`;
- `probe/src/objectives/socialObjectiveOracles.ts`;
- `probe/src/objectives/socialObjectiveReports.ts`;
- `probe/src/cli/socialObjectiveCli.ts` or an extension of the current
  objective CLI if that keeps the command simple.

Suggested command:

```bash
cd probe
bun run probe:social-objective -- --objective social_craft_stone_axe_1 --actors npc_a,npc_b,npc_c --max-actions-per-actor 12 --provider deterministic --report ../tmp/social-stone-axe-deterministic.json
```

### Workstream B: Shared Storage And Social Evidence

Goal: make shared inventory changes first-class social facts.

Implement or harden:

- chest deposit/withdraw evidence with actor id, item id, count, chest id, and
  ledger sequence;
- social exchange event projection from chest ledger and handoff evidence;
- relationship event proposals that cite exact evidence refs;
- objective oracle checks that reject private-only success.

The important behavior is not merely that an item exists. It is that another
actor can observe and use it.

### Workstream C: Generated Action Skill Context For Social Tasks

Goal: let the LLM generate small action programs while receiving the right
social context.

Implement or harden provider context fields for:

- actor role and current social responsibility;
- relevant shared chest state;
- current requests and obligations;
- relationship context signal derived from enums;
- objective-specific allowed helper surface;
- recent failed helper calls and guardrail memory.

Generated code should still prefer helpers such as:

- `ctx.ensureItem(...)`;
- `ctx.depositShared(...)`;
- `ctx.inspectSharedChest(...)`;
- `ctx.requestItemFromActor(...)`;
- `ctx.craftItem(...)`;
- `ctx.craftWithTable(...)`;
- `ctx.mineBlock(...)`.

If a helper does not exist, add the narrow helper and evidence contract rather
than asking generated code to invent unverifiable social side effects.

### Workstream D: Dashboard Social Loop View

Goal: make the tiny society readable while remaining fire-and-forget.

Add a compact dashboard view for:

- actor cards with current objective, last action, inventory summary, and status;
- shared chest panel with item icons and ledger deltas;
- social exchange timeline grouped by objective id;
- relationship edge panel showing enum categories and evidence refs;
- provider input/output panel scoped by actor and turn;
- direct generated action skill trial panel with source, helper calls, and
  verifier result.

Dashboard failures must not affect gameplay.

### Workstream E: Async Review From Real Social Runs

Goal: reviewers should explain social loop failures after the run.

Implement or harden:

- reviewer queue creation from failed social objective reports;
- per-actor reviewer jobs that read only immutable artifacts;
- findings that distinguish action skill failure, missing helper, bad provider
  context, stale memory, relationship context signal error, and environment blocker;
- candidate repair proposals that cite exact evidence.

Do not make the reviewer block actor turns.

## Test Gates

### Gate 1: Deterministic Social Proof

The deterministic provider must pass the smallest social objective.

Expected command:

```bash
cd probe
bun run probe:social-objective -- --objective social_craft_sticks_from_deposited_logs_1 --provider deterministic --actors npc_a,npc_b,npc_c --max-actions-per-actor 8 --report ../tmp/social-sticks-deterministic.json
```

Pass condition:

- current-run evidence only;
- deposit evidence exists before crafter success;
- crafter output exists after inspecting or withdrawing shared value;
- relationship event cites the deposit or handoff evidence.

### Gate 2: Direct Generated Social Proof

Run the same objective with generated TypeScript action skills.

Expected command:

```bash
cd probe
bun run probe:social-objective -- --objective social_craft_sticks_from_deposited_logs_1 --provider openai-codex --mode direct-generated --actors npc_a,npc_b,npc_c --max-actions-per-actor 8 --report ../tmp/social-sticks-generated.json
```

Pass condition:

- generated source is stored under actor workspace;
- helper calls are recorded;
- objective success comes from Minecraft/chest/relationship evidence, not return
  text;
- failed attempts create useful memory or reviewer queue refs.

### Gate 3: Stone Axe Ladder

After the smaller proof works, move up the ladder:

```bash
cd probe
bun run probe:social-objective -- --objective social_craft_crafting_table_from_deposited_logs_1 --provider openai-codex --mode direct-generated --actors npc_a,npc_b,npc_c --max-actions-per-actor 10 --report ../tmp/social-crafting-table-generated.json
```

```bash
cd probe
bun run probe:social-objective -- --objective social_craft_wooden_pickaxe_from_deposited_materials_1 --provider openai-codex --mode direct-generated --actors npc_a,npc_b,npc_c --max-actions-per-actor 12 --report ../tmp/social-wooden-pickaxe-generated.json
```

```bash
cd probe
bun run probe:social-objective -- --objective social_craft_stone_axe_1 --provider openai-codex --mode direct-generated --actors npc_a,npc_b,npc_c --max-actions-per-actor 16 --report ../tmp/social-stone-axe-generated.json
```

Do not tune the final objective before the smaller objectives are proven.

### Gate 4: Regression Checks

Before declaring the slice done:

```bash
cd probe
bun test
bun run typecheck
bun run probe:skills -- --max-actions 8 --init-actor-workspace baseline --continue-on-failure --report ../tmp/action-skill-live-matrix-after-social.json
```

```bash
cd docs
npm run build
```

If Docker or provider auth blocks a live run, record the blocker separately from
runtime failure.

## Non-Goals For The Next Session

- no large village simulation;
- no new persona-writing pass as the main deliverable;
- no global critic that mutates actor state directly;
- no success from historical transcripts;
- no dashboard control plane;
- no raw generated code success without current-run verifier evidence;
- no broad Minecraft tech-tree automation beyond the stone-axe ladder.

## Cursor Composer Handoff Prompt

Use this prompt as the next implementation request:

```text
You are working in <repo>.

Read AGENTS.md, SPEC.md, project-docs/orientation/agent-search-index.md, and especially
project-docs/operations/handoffs/social-simulation-next-goal-handoff.md.

Goal: implement the next bounded social simulation slice, not a broad society.
Build a small multi-actor social objective runner where one actor's verified
Minecraft progress becomes another actor's usable social context through shared
storage, relationship events, actor workspace memory, and provider snapshots.

Primary objective ladder:
1. social_craft_sticks_from_deposited_logs_1
2. social_craft_crafting_table_from_deposited_logs_1
3. social_craft_wooden_pickaxe_from_deposited_materials_1
4. social_craft_stone_axe_1

Start with the smallest objective that proves social visibility:
gatherer deposits logs into shared storage, crafter observes or withdraws that
shared value, crafter produces a verified item, and a relationship event cites
the evidence. Private inventory success is not enough.

Keep the implementation simple:
- compose the existing runAgentLoop, actor workspace, provider context,
  direct-generated action skill, shared chest, transcript, and reviewer pieces;
- add narrow modules only where needed;
- keep dashboard fire-and-forget;
- keep all success checks current-run and runtime-owned;
- do not revive Voyager-style open-ended eval loops.

Expected deliverables:
- social objective runner CLI;
- objective oracle/report schema;
- current-run social evidence checks for shared chest and relationship events;
- provider context additions only if needed for the social objective;
- dashboard social-loop view if the data plumbing is available without making
  dashboard a dependency;
- docs updated to reflect the implemented slice.

Verification:
- bun test
- bun run typecheck
- deterministic social objective report for the smallest objective
- openai-codex direct-generated social objective report if auth exists
- action-skill matrix after changes if Docker/OrbStack is available
- docs npm run build

Treat provider auth or Docker availability as environment blockers, not runtime
failures. Do not commit ignored data/evidence or tmp reports unless explicitly
requested.
```

## Review Questions For The Next Agent

Answer these before implementation is considered complete:

- Did one actor's checked action outcome change another actor's available choices?
- Can the final success be proven without reading provider prose?
- Which exact evidence refs caused the relationship event?
- Did generated code use runtime helpers, and were helper calls recorded?
- Can the dashboard fail without affecting gameplay?
- If the run failed, is the failure classified as environment, primitive,
  provider context, memory, verifier, relationship, or scheduling?

If these questions cannot be answered from artifacts, the slice is not done.
