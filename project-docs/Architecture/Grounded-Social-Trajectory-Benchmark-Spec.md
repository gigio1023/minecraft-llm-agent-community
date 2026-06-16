---
sidebar_position: 44
---

# Grounded Social Trajectory Benchmark Spec

Search token: `GROUNDED_SOCIAL_TRAJECTORY_BENCHMARK`.

Status: initial provider-free smoke spec; retained as a legacy sanity check.

Recorded: 2026-06-15 (`Asia/Seoul`).

## Purpose

This benchmark asks whether the runtime can evaluate social simulation as
evidence-backed behavior, not as persona text or generic Minecraft progress.

The original smoke uses shared storage because deposit/inspect/withdraw events
are cheap to verify without a live provider. That shape is still useful as a
sanity check for event ledgers and reports, but it is not the primary social
economy model. The active benchmark direction is now:

- personal possession;
- material claims;
- public affordances;
- weak commons;
- obligation-backed exchange.

Use `Material-Claims-And-Social-Economy-Benchmark-Plan.md` for the current
benchmark ladder.

The immediate smoke does not call an LLM provider and does not require a live
Minecraft server. It verifies the scoring contract, event ledger, evidence
requirements, and report shape before expensive multi-actor live runs.

The long-term benchmark question is:

```text
Can LLM-controlled Minecraft actors sustain evidence-grounded social behavior
in natural open-world seeds, where progress is measured not only by task
completion but by durable obligations, material claims, public affordance use,
memory continuity, recovery from blockers, and observable changes to a common
world?
```

## Research Gap

The repo's primary research framing is an application and methodological gap:

- Minecraft LLM-agent benchmarks mostly evaluate bounded individual task
  completion, tech-tree progress, or task-oriented collaboration.
- LLM social simulations can model rich interaction, but they often lack a live
  physical substrate where social claims are constrained by verifiable
  movement, inventory, crafting, storage, communication, memory, and world
  consequences.
- This repo should evaluate the overlap: persistent embodied social behavior
  in Minecraft with runtime-owned evidence.

## Non-Goals

- Do not score tool schema compliance or structured-argument formatting.
- Do not count persona-flavored prose as social simulation.
- Do not make house-building, shelter, storage, or any single domain activity a
  core runtime planner.
- Do not claim a broad society from one actor or from a single successful
  exchange.
- Do not start provider-backed experiments without provider-specific quota
  preflight and operator approval.

## Legacy Minimum Social Trajectory

The first provider-free smoke used this deliberately narrow shared-storage
trajectory:

```text
request
-> promise or refusal
-> physical contribution to shared state
-> another actor observes or consumes that contribution
-> relationship or obligation state updates with evidence refs
```

Legacy smoke scenario:

```text
grounded_social_sticks_from_deposited_logs_v1
```

Actors:

- `npc_b`: gatherer, responsible for contributing useful wood.
- `npc_c`: crafter, responsible for using the legacy shared-storage input to
  craft a useful intermediate item.
- `npc_a`: quartermaster, responsible for recording shared value and social
  consequence.

Expected trajectory:

1. `npc_c` requests wood inputs for shared crafting.
2. `npc_b` promises or explicitly accepts responsibility.
3. `npc_b` deposits at least one useful wood item into shared storage.
4. `npc_c` inspects or withdraws shared value after the deposit.
5. `npc_c` crafts `stick >= 1` or a similarly scoped proof item using shared
   value.
6. `npc_a` records a relationship or settlement event that cites the deposit,
   withdrawal, or craft evidence.

Private-only success is not enough. This legacy social claim requires shared
visibility or handoff evidence before the crafter's success.

For new benchmark design, do not require central shared storage. Prefer a
material-claim or public-affordance trajectory where possession, access,
borrowing, refusal, and later use can be recorded explicitly.

## Event Schema

The provider-free smoke uses a compact event ledger:

```ts
type GroundedSocialEvent = {
  event_id: string;
  cycle: number;
  actor_id: string;
  type:
    | "request"
    | "promise"
    | "shared_deposit"
    | "shared_inspect"
    | "shared_withdraw"
    | "craft"
    | "relationship_update"
    | "memory_write"
    | "blocker";
  target_actor_id?: string;
  item_id?: string;
  count?: number;
  container_id?: string;
  evidence_refs: string[];
  notes?: string;
};
```

Rules:

- Every event must cite at least one evidence ref.
- Physical events must include item/container details where relevant.
- Relationship and memory events must cite prior physical or communication
  evidence, not only their own prose.
- Events are scored in chronological order so a craft cannot satisfy social
  consumption unless a shared deposit or handoff happened first.

## Score Dimensions

Scores are simple by design. A clever score that hides failures is worse than a
plain score that exposes missing evidence.

| Dimension | Weight | Pass signal |
| --- | ---: | --- |
| Physical contribution | 20 | Shared deposit or handoff includes item/count/container evidence. |
| Social exchange | 20 | Request/promise/refusal and later shared-state action are linked. |
| Cross-actor consumption | 20 | Another actor inspects, withdraws, or crafts from shared value after the contribution. |
| Memory or relationship continuity | 20 | Relationship, obligation, or memory update cites concrete prior evidence. |
| Auditability | 20 | Event order, evidence refs, actors, items, and report metadata are complete. |

Interpretation:

- `80-100`: social trajectory smoke passed.
- `50-79`: partial; useful social events exist but a key link is weak.
- `1-49`: physical or social evidence is present, but not enough for a social
  claim.
- `0`: no evidence-backed social trajectory.

## Required Artifacts

Provider-free smoke artifacts:

- `report.json`: machine-readable scored report.
- `index.html`: human-readable report.
- `README.md`: run intent, command, findings, and next step.

Future live artifacts:

- runtime action records;
- personal possession deltas;
- material claim and access ledgers;
- weak commons use when applicable;
- public affordance creation and use;
- block placement/crafting evidence;
- chat/request/promise/handoff events;
- actor memory writes with evidence refs;
- PlanBead lifecycle records where applicable;
- screenshots as supporting visual evidence;
- provider usage, quota preflight, cost, and latency.

## Acceptance For This Smoke

The smoke passes if:

- no live provider call is made;
- no live Minecraft server is required;
- the report records at least one request, one shared deposit, one cross-actor
  consumption or craft, and one relationship/memory update;
- every scoring claim cites event evidence;
- the HTML report makes the social chain readable without treating prose alone
  as success.

## Next Live Step

Only after the provider-free smoke passes, define a small live run under the
current material-claims benchmark plan:

```text
natural seed
two or three Mineflayer actors
no mandatory central shared chest
one public-affordance or material-claim objective
8-20 turns per actor
provider quota preflight
operator approval
first-person and third-person screenshots
same event ledger and score dimensions
```

The live run should be treated as exploratory until the runtime can prove
personal possession, material claims, public affordance use, actor identity,
social events, and memory continuity from current-run artifacts.
