---
sidebar_position: 42
---

# Low-Cost Social Simulation Campaign Spec

Search token: `LOW_COST_SOCIAL_SIMULATION_CAMPAIGN`.

Status: active campaign spec and implementation plan.

Recorded: 2026-06-03 (`Asia/Seoul`).

## Purpose

This document defines how the Actor Episode and Actor Turn campaign should be
planned, evaluated, and advanced until a low-cost LLM can drive a Minecraft
actor with behavior that is plausibly useful for Soul/LifeGoal social
simulation.

It is not a file-by-file implementation script. It is a detailed plan for what
must become true, how work should be split, what evidence counts, and how live
testing should decide whether the architecture is improving.

The target behavior is not perfect Minecraft play. The target is an actor that
can:

- keep an Active Episode coherent across turns;
- choose actionful Minecraft behavior from current evidence;
- use PlanBeads as durable context without becoming checklist-bound;
- recover from blockers without hiding errors;
- create or use actor-owned action skills when existing actions are insufficient;
- produce at least one runtime-visible social consequence under a cheap model;
- leave enough artifacts for a reviewer to understand what happened.

## Harness-Derived Spec Method

The local `~/git/harness` projects suggest a documentation method, not a
runtime architecture to copy.

Reference patterns inspected:

- `~/git/harness/everything-claude-code/docs/PLAN-PRD-PATTERN.md`: stage
  intent and implementation plans as markdown files, not transient conversation
  state.
- `~/git/harness/gstack/docs/explanation-diataxis-in-gstack.md`: separate
  explanation, reference, how-to, and tutorial responsibilities so one page does
  not try to satisfy every reader.
- `~/git/harness/ralph-claude-code/SPECIFICATION_WORKSHOP.md`: express
  ambiguous behavior through acceptance criteria, tester questions, edge cases,
  and Given/When/Then scenarios.
- `~/git/harness/Codexplain/docs/explanation-ux-methodology.md`: explain by
  capability boundary first, then evidence and next action; preserve exact
  paths, commands, dates, and uncertainty.

Adapted method:

| Harness lesson | Adaptation for this repo |
|----------------|--------------------------|
| Stage requirements separately from implementation tactics | This document owns the campaign contract: problem, target behavior, gates, scenarios, lanes, and completion definition. File-level implementation details belong in `Actor-Episode-And-Actor-Turn-Implementation-Plan.md` or code review artifacts. |
| Separate run completion from acceptance evaluation | A completed 30/60-cycle run is only `run_lifecycle=completed`; each behavior gate still needs `PASS`, `PARTIAL`, `FAIL`, `UNVERIFIABLE`, `BLOCKED_ENV`, or `BLOCKED_PROVIDER`. |
| Freeze small versioned contracts before broad implementation | Treat `active-episode/v1`, `actor-turn-input/v1`, `actor-turn-output/v1`, Action Cards, Evidence Trace, Deliberation, and PlanBead operation results as compatibility anchors. |
| Keep stable spec, implementation plan, and dated run evidence separate | Dated live-run records belong in `Current-Handoff-And-Next-Work.md`, generated reviews, or reports. This spec may name the evidence classes a run must produce, but not become a run log. |
| Use specification by example for ambiguous behavior | Social simulation, context pivot, PlanBead closure, cheap-model actionfulness, and generated-action authoring must be expressed as Given/When/Then scenarios. |
| Define source-of-truth ownership for every state record | Actor workspace artifacts, not provider prose, own PlanBeads, action skill state, evidence, memory, relationship events, and provider snapshots. |
| Use candidate/playbook style for long campaigns | Each phase has goal, inputs, deliverables, gates, failure classes, and next actions; subagents get lane contracts with disjoint ownership. |
| Preserve exact evidence without overstating certainty | Review records must cite report paths, actor workspace refs, provider usage, and unresolved risk. A green command or `runtime_status=passed` is not product acceptance by itself. |

This method prevents two common failures:

- a run finishes but is reported as a social simulation success without social
  evidence;
- implementation work expands horizontally while the actor still cannot perform
  a coherent live loop.

## Spec Intake Checklist

Every substantial campaign slice should start by answering these questions
before code changes:

| Question | Required answer for this campaign |
|----------|-----------------------------------|
| Why now? | The cheap-model loop currently repeats satisfied work and has not proven a social consequence. |
| Current behavior | Actor Turn can perform bounded single-actor crafting, but state consumption, PlanBead lifecycle, and social proof remain weak. |
| Desired behavior | The actor consumes current state, preserves/resolves PlanBeads, and takes at least one socially consequential runtime action. |
| Observable done | Gate records cite runtime artifacts for Actor Turn cadence, actionfulness, PlanBead continuity/lifecycle, social consequence, and budget. |
| Out of scope | Broad society simulation, benchmark optimization, always-on Deliberation, PlanBeads as executor, or domain-specific strategy planner. |

## Campaign Slice Template

Every implementation slice in this campaign should be framed in this shape
before code changes. The section may live in the implementation plan, a dated
handoff, or a subagent lane artifact, but it must be answerable from current
repo evidence.

```md
## Slice: <name>

Why now:
Current behavior:
Desired behavior:
Smallest vertical proof:
Out of scope:

## Existing Surfaces To Reuse

| Surface | Path or contract | How reused |
|---------|------------------|------------|

## Work Lanes

| Lane | Modules touched | Depends on | Acceptance |
|------|-----------------|------------|------------|

## Acceptance Gates

| Gate | PASS evidence | Failure class |
|------|---------------|---------------|

## Required Artifacts

- run report:
- provider usage:
- actor workspace refs:
- provider input/output refs:
- PlanBead operation results:
- tests:

## Completion Audit

| Item | Verdict | Evidence |
|------|---------|----------|
```

Completion audit verdicts:

- `DONE`: backed by code, test, run artifact, or review artifact that directly
  covers the item.
- `CHANGED`: the original item was satisfied by a different implementation path,
  with evidence.
- `PARTIAL`: useful work landed, but the gate is not fully proven.
- `NOT DONE`: known missing work remains.
- `UNVERIFIABLE`: no current artifact can prove or disprove the item.

Do not treat `DONE` as a tone word. It is an evidence claim.

## Document Stack

Use these documents with separate responsibilities:

| Document | Responsibility |
|----------|----------------|
| `Actor-Episode-And-Actor-Turn-Architecture.md` | Stable target architecture and authority boundaries. |
| `Low-Cost-Social-Simulation-Campaign-Spec.md` | Campaign-level spec, gates, social proof scenarios, and implementation sequencing. |
| `Actor-Episode-And-Actor-Turn-Implementation-Plan.md` | Current implementation checkpoint, active workstreams, and bridge status. |
| `Current-Handoff-And-Next-Work.md` | Dated handoff: latest run evidence, blockers, commands, and next operational move. |
| Generated run reports/reviews | Raw evidence for one live or deterministic run. |

Do not move volatile run anecdotes into the architecture spec. Do not bury
campaign exit criteria inside a dated handoff.

## Artifact And Context Discipline

The low-cost path succeeds only if the provider sees the right bounded context
and the reviewer can fetch exact artifacts later. Do not solve cheap-model
weakness by stuffing full transcripts, full provider outputs, or full evidence
bodies into every turn.

Rules:

- Actor Turn input carries compact current state, bounded Evidence Trace,
  compact PlanBead hints, current Action Cards, and artifact refs.
- Full helper events, world scans, verifier details, provider outputs,
  PlanBeadGraph records, memories, relationship events, and action-skill
  lifecycle records stay in actor workspace shards.
- `decision_frame`, Minecraft Basic Guide, and compact PlanBead hints are
  additive provider-context enrichments. They cannot replace Action Card
  schemas, Runtime Action Resolver checks, verifier evidence, or guarded
  PlanBead operations.
- Versioned records are additive compatibility contracts. New fields may be
  added with documented absence semantics; required field renames or silent
  shape changes require a migration note and regression tests.
- A long-run review must preserve exact report paths, provider usage records,
  actor workspace refs, and evidence refs even when the prose summary is short.

This is the Minecraft adaptation of the harness "hot pointer plus artifact ref"
pattern: keep the hot provider packet small, keep detailed state retrievable,
and never make summarized prose the source of truth.

## Campaign Baseline

The Actor Turn direction is the target shape. The campaign should assume these
surfaces exist or are being migrated toward the target contract:

- ordinary turns use Actor Turn instead of repeatedly calling
  `goal_mind -> action_planner -> cycle_judgment`;
- current-state projection is the cheap-model lens over inventory, position,
  visible/relevant actors, known stations, settlement state, shared storage,
  retry constraints, compact PlanBead hints, recent evidence, and Minecraft
  Basic Guide;
- Action Cards describe what the actor can try without requiring the provider to
  care whether the runtime maps the card to a primitive, seed action skill,
  actor-owned action skill, or generated candidate;
- `decision_frame` is the per-turn priority view over current truth. It may
  recommend or suppress choices, but it is not executable authority;
- PlanBeads remain the durable work graph behind the hot path. They provide
  ready-front and lifecycle context, not primitive args, action permissions, or
  physical proof;
- generated Mineflayer source may originate only from Actor Turn
  `author_mineflayer_action`, then trial as actor-owned candidate action skill
  state.

Open risks that keep the campaign active:

- a low-cost model can still become timid or repetitive when Action Cards do not
  make the next useful physical/social move obvious;
- a completed 30-cycle run can still fail product acceptance if it lacks social
  consequence, PlanBead lifecycle pressure, or action diversity;
- fixture-backed shared-storage proof is useful but not the same as durable
  multi-actor social behavior;
- PlanBead lifecycle reconciliation must match evidence to the bead concern,
  not merely accept any strong-looking evidence ref;
- generated action candidates need better quality and recovery without loosening
  source guards or helper authority.

## Completion Definition

The campaign is complete only when current evidence proves all of the following:

1. A 60-turn low-cost live run completes or stops with a truthful blocker.
2. Ordinary non-branch turns use Actor Turn as the hot path.
3. The actor performs actionful Minecraft behavior instead of observe/wait/move
   loops.
4. Every claimed success cites runtime evidence refs.
5. Current-state gates stop repeated already-satisfied work.
6. PlanBeads preserve and reconcile durable concerns across a context change.
7. At least one actor action becomes socially visible or socially consequential.
8. Provider usage remains within the declared budget guard.
9. Review artifacts distinguish run lifecycle from behavior gate verdicts.

This is not achieved by a green typecheck, a completed cycle count, or provider
text that says the actor made progress.

## Gate Status Model

Use two separate statuses in every run record:

| Field | Meaning |
|-------|---------|
| `run_lifecycle` | Whether the run mechanically completed, stopped early, hit provider quota, or hit an environment blocker. |
| `gate_verdict` | Whether a specific acceptance gate was proven by evidence. |

Allowed `run_lifecycle` values:

- `completed`
- `early_stop`
- `blocked_env`
- `blocked_provider`
- `blocked_budget`
- `runtime_error`

Allowed gate verdicts:

- `PASS`
- `PARTIAL`
- `FAIL`
- `UNVERIFIABLE`
- `BLOCKED_ENV`
- `BLOCKED_PROVIDER`

A completed run with no visible social event is:

```text
run_lifecycle=completed
social-plausibility-gate=FAIL
```

Gate reviews may also use the implementation-audit verdicts `DONE`, `CHANGED`,
`PARTIAL`, `NOT DONE`, and `UNVERIFIABLE` when reviewing work items. Do not mix
them with run lifecycle: a code slice can be `DONE` while the corresponding
live behavior gate remains `PARTIAL`.

## Acceptance Gates

| Gate | Pass condition | Common failure class |
|------|----------------|----------------------|
| `actor-turn-cadence-gate` | Ordinary turns use Actor Turn; Deliberation runs only on branch conditions. | `archived-hot-path-regression` |
| `actionfulness-gate` | The actor attempts meaningful world, inventory, container, chat, relationship, or shared-storage mutations. | `action-timidness` |
| `current-state-consumption-gate` | Current state hides or rejects already-satisfied station/action choices and points the actor toward the next useful action. | `state-consolidation-gap` |
| `recipe-contract-gate` | Inventory-grid and table-bound recipes expose and enforce exact item counts before execution. | `minecraft-mechanics-gap` |
| `social-target-gate` | Chat or social actions require a runtime-visible target or equivalent deliverable social context. | `social-target-gap` |
| `planbead-continuity-gate` | Existing open/in-progress/blocked/deferred concerns survive new observations or blockers. | `episode-continuity-loss` |
| `planbead-lifecycle-gate` | Evidence that satisfies a concern updates, closes, links, or explicitly keeps the PlanBead open with reason. | `planbead-lifecycle-gap` |
| `generated-action-gate` | New Mineflayer behavior can be authored only through Actor Turn `author_mineflayer_action` and trialed as actor-owned candidate state. | `generated-authority-gap` |
| `social-plausibility-gate` | At least one runtime-visible social consequence occurs: chat, request handling, obligation, shared storage, relationship event, conflict, or another actor's later context. | `social-surface-gap` |
| `budget-gate` | Provider ledger and projected day usage show the run stayed inside the selected free/low-cost budget. | `provider-budget-blocker` |

## Specification By Example

### Scenario 1: Already-Satisfied Station Is Consumed

Given:

- the actor has already placed or confirmed a reachable crafting table;
- settlement state records `crafting_table=placed` or `crafting_table=nearby`;
- the checklist item for crafting-table availability is satisfied;
- the actor still has another crafting table item in inventory.

When:

- Actor Turn input is built for the next turn.

Then:

- `Place Crafting Table` is hidden, rejected, or clearly marked unavailable as
  already satisfied;
- table-bound crafting, mining, storage, social, movement, or generated-action
  alternatives remain available when their own contracts are satisfied;
- the run records this as current-state consumption, not as PlanBead authority.

### Scenario 2: PlanBead Survives A Context Change

Given:

- the actor is working on concern A, such as preparing basic tools;
- A has an open PlanBead with next steps and evidence requirements.

When:

- concern B appears through a blocker, visible actor request, relationship
  pressure, or runtime evidence.

Then:

- A is not erased;
- B is created, linked, deferred, or prioritized by guarded PlanBead operation
  results;
- Active Episode either continues A with B recorded as pressure, or branches to
  B with A preserved as open, blocked, deferred, or related.

### Scenario 3: PlanBead Lifecycle Reconciles Evidence

Given:

- a PlanBead says the actor must resolve a missing prerequisite;
- later runtime evidence proves the prerequisite was crafted, placed, observed,
  deposited, or otherwise satisfied.

When:

- Runtime Classifier or branch-time Deliberation reviews the evidence.

Then:

- a guarded operation updates or closes the PlanBead with exact evidence refs;
- the ready front no longer promotes a satisfied generic concern;
- if the bead remains open, the result explains what evidence is still missing.

### Scenario 4: Cheap Model Chooses Action Over Re-Observation

Given:

- the current state includes a bounded world scan and inventory counts;
- the previous observe produced no new progress;
- at least one Action Card has satisfied current-state requirements.

When:

- the actor chooses the next turn.

Then:

- observe is suppressed or deprioritized;
- the actor chooses an executable action, a justified move toward a target, or a
  branch with evidence-linked reason;
- repeated observe without new evidence becomes a failure of the gate.

### Scenario 5: Social Smoke Is Real But Small

Given:

- a visible second actor, a shared chest obligation, a chat request, or a
  relationship event exists in current state;
- the Active Episode includes that social pressure.
- for the first shared-storage handoff smoke, Actor Turn current state includes
  `shared_storage` and inventory counts, while `source_evidence_bundle` carries
  the original world-event card and observation inventory items.

When:

- the actor acts for the episode.

Then:

- one action becomes socially visible or consequential through chat,
  shared-storage mutation, handoff, relationship event, conflict, or another
  actor's later context;
- if the chosen action is `Deposit Shared`, provider output fills structured
  `parameters.itemName` and `parameters.count`; prose never supplies missing
  transfer args;
- the review can cite runtime artifacts for both the action and the consequence;
- crafting or mining alone does not satisfy the social gate unless it is tied to
  the recorded social pressure.

### Scenario 6: Generated Action Origin Is Gated

Given:

- the current Action Cards do not cover a useful Minecraft move;
- the actor has enough current evidence to describe a bounded helper-limited
  behavior candidate;
- the Active Episode or compact PlanBead hints justify why the candidate is
  useful now.

When:

- the actor chooses to create new Mineflayer behavior.

Then:

- the choice is `author_mineflayer_action` from Actor Turn, not Deliberation,
  PlanBeads, memory, reviewer text, or a background importer;
- provider output includes schema-bound parameters, source, helper API version,
  verifier, timeout, failure modes, and promotion policy;
- trial evidence and source-guard failures are stored under actor-owned
  candidate action skill state;
- no generated candidate becomes active authority until lifecycle promotion
  succeeds.

### Scenario 7: Long Context Uses Refs, Not Transcript Stuffing

Given:

- the actor has run long enough to produce many observations, evidence records,
  provider snapshots, memories, PlanBeads, and retry constraints.

When:

- Actor Turn input is built for the next low-cost provider call.

Then:

- the provider receives compact current state, bounded Evidence Trace, compact
  PlanBead hints, and artifact refs;
- the input does not include unbounded transcript bodies or full historical
  evidence payloads;
- omitted details remain fetchable from actor workspace refs for review;
- compaction does not turn weak evidence, provider prose, wait, remember, or
  repeated observation into physical or social progress.

## Implementation Plan

### Phase A - Spec And Evidence Discipline

Goal: make the campaign reviewable before more code is added.

Deliverables:

- this campaign spec;
- documentation routing through the search index, documentation map, and
  sidebar;
- a dated run-gate record template for future live runs;
- clear separation between architecture contract, implementation checkpoint,
  and live-run evidence.

Acceptance:

- docs build passes;
- `LOW_COST_SOCIAL_SIMULATION_CAMPAIGN` routes to this document;
- future reviews can record `run_lifecycle` separately from gate verdicts.

### Phase B - Current-State Consumption

Goal: stop cheap models from repeating work that the runtime already knows is
satisfied.

Initial implementation status, 2026-06-03:

- crafting-table station state is covered first. Actor Turn input and Runtime
  Action Resolver both reject `placeCraftingTable` when current state already
  proves a usable crafting table.
- this is intentionally station-specific. It does not remove general
  `place_block` authority or turn current state into a settlement strategy
  planner.

Deliverables:

- Action Card eligibility consumes settlement state, known positions, recent
  evidence, and checklist satisfaction;
- resolver hardening rejects stale already-satisfied station/action cards before
  Mineflayer execution;
- review output distinguishes first confirmation from repeated duplicate
  confirmation.

Acceptance:

- the actor can still place blocks when useful;
- only already-satisfied station-specific loops are hidden or rejected;
- repeated `already_present` for the same target no longer looks like fresh
  episode progress.

### Phase C - PlanBead Lifecycle Reconciliation

Goal: keep PlanBeads useful as durable work state without letting them become an
action planner.

Initial implementation status, 2026-06-03:

- ordinary Actor Turn runtime evidence can now derive conservative
  PlanBeadOperation candidates for shared-storage deposit, chest inspection, and
  item crafting evidence.
- the guarded PlanBead applier remains the only writer. Lifecycle derivation
  never emits executable args, primitive ids, action skill ids, helper
  allowlists, retry-constraint mutation, or physical-progress claims.
- movement, observe, wait, remember, and provider prose cannot close PlanBeads.

Deliverables:

- evidence-linked update/close candidates for PlanBeads whose acceptance
  criteria are satisfied by later runtime artifacts;
- duplicate and generic create rejection stays guarded and artifact-visible;
- ready front emphasizes specific, still-open concerns.

Acceptance:

- a concern can be created after a blocker, later satisfied by runtime evidence,
  and removed from ready front as closed or completed;
- malformed or overbroad PlanBead operations do not fail the whole cycle;
- PlanBeads never supply missing executable args or physical proof.

### Phase D - Social Smoke Scenario

Goal: prove one small social consequence under low-cost provider constraints.

Preferred first scenario:

- shared-storage handoff. `npc_a` exists as a quartermaster/social target in
  actor workspace context, while `npc_b` is the active Mineflayer bot. A world
  event records that `npc_a` needs useful materials in shared storage before
  trusting `npc_b`'s next claim. `npc_b` starts with a small depositable item
  stack and a nearby chest. The model should choose a deposit action from Actor
  Turn context; the harness must not force the exact primitive as a script.

Initial implementation status, 2026-06-03:

- the evidence evaluation layer can already prove the shared-storage handoff
  shape from `deposit_shared:deposited` evidence, `handoffItemAtChest`
  postcondition output, settlement state, and checklist refs.
- `--shared-storage-social-smoke` now writes a run-scoped, context-only world
  event where `npc_a` asks the active actor to deposit one `oak_log` into shared
  storage. In live runs it also reuses spawn-access setup and seeds a small
  `oak_log` inventory stack for the active bot.
- Actor Turn input now projects `shared_storage` details and
  source evidence beside inventory counts. Action Card hints tell the provider to
  fill `deposit_shared` `itemName`/`count` itself from the visible evidence, not
  from a precomputed social-request candidate.
- the remaining live-smoke work is provider-driven selection and real Mineflayer
  deposit execution, not proof that deposit evidence can be evaluated or that
  the request reaches provider input.

Acceptable scenarios:

- two actors are visible and one chat action is delivered and recorded;
- a shared chest obligation exists and one deposit or retrieval is verified;
- a request or relationship pressure appears and the actor responds with a
  runtime-visible action;
- another actor later observes or consumes the first actor's contribution.

Acceptance:

- the scenario is not a scripted checklist;
- the social pressure is present in current state or Active Episode;
- current state includes structured deposit candidates when the actor has
  depositable inventory;
- the actor chooses a relevant action through Actor Turn;
- the consequence is artifact-visible;
- for the first shared-storage smoke, minimum proof is `deposit_shared` evidence
  with moved count greater than zero, settlement state showing shared-storage
  contribution, and provider usage under budget. A relationship event is
  stronger evidence, but not required for the first smoke if the shared-storage
  consequence is clear.

### Phase E - Generated Action Use

Goal: let the actor become more capable when existing cards are insufficient,
without raw generated-code authority.

Deliverables:

- Actor Turn can choose `author_mineflayer_action`;
- generated source includes schema-bound parameters, helper API version,
  timeout, verifier, failure modes, and promotion policy;
- trial output is stored as actor-owned candidate action skill state.

Acceptance:

- no generated code executes outside the trial boundary;
- source guard or helper violation returns as repairable evidence;
- passed trials do not become active authority until lifecycle promotion.

### Phase F - Low-Cost Live Evaluation

Goal: verify that the architecture works with cheap models, real Mineflayer
constraints, and truthful budget reporting.

Run order:

1. deterministic contract tests;
2. 3-turn provider smoke;
3. 8-turn behavior smoke;
4. 30-turn low-cost gate;
5. 60-turn low-cost gate;
6. manual stratified review of evidence refs and social plausibility.

Acceptance:

- provider usage ledger is present;
- budget guard is checked before long runs;
- live report contains gate verdicts and failure classes;
- 60-turn gate satisfies the completion definition.

## 30-Turn Gate

Hard requirements:

- all required provider input/output, action attempt, evidence, and episode refs
  resolve;
- no provider prose is counted as physical or social success;
- Actor Turn provider input remains bounded and ref-backed rather than carrying
  unbounded raw transcript or evidence bodies;
- current-state contract blocks missing args, missing items, missing social
  targets, and already-satisfied station loops;
- one repair attempt is visible when a cheap model chooses an invalid card;
- provider usage summary is present.

Behavior thresholds:

- at least 60 percent of turns are not observe/wait/remember;
- at least 30 percent of turns produce verified mutation or meaningful
  social/container/block/inventory evidence;
- top single action family is at most 45 percent of turns;
- at least five action families appear;
- at least one context pivot is evidence-linked;
- if social context exists, one social response or preserved social-pressure
  branch appears.

## 60-Turn Gate

Hard requirements:

- all 30-turn hard requirements still pass;
- context compaction preserves evidence refs without laundering weak progress;
- PlanBead continuity and lifecycle gates are both evaluated;
- budget guard does not silently overrun;
- episode final verdict cites exact turn and evidence refs.

Behavior thresholds:

- at least 65 percent of turns are not observe/wait/remember;
- at least 35 percent of turns produce verified mutation or meaningful
  social/container/block/inventory evidence;
- top single action family is at most 35 percent of turns;
- top three action families are at most 70 percent of turns;
- at least seven action families appear;
- at least four meaningful pivots occur;
- one multi-step continuity chain survives three or more turns;
- one action becomes socially visible or socially consequential.

## Run-Gate Record Template

Use this compact structure in handoff/audit docs after each meaningful live run:

```md
## Low-Cost Social Simulation Gate - YYYY-MM-DD

Run lifecycle: completed | early_stop | blocked_env | blocked_provider | blocked_budget | runtime_error
Overall gate verdict: PASS | PARTIAL | FAIL | UNVERIFIABLE | BLOCKED_ENV | BLOCKED_PROVIDER
Provider/model:
Budget result:
Scenario social context: none | visible_actor | chat_request | shared_storage_obligation | relationship_event

Primary artifacts:
- report:
- transcript:
- actor workspace:
- provider usage ledger:
- review summary:

| Gate | Verdict | Observed | Evidence refs | Failure class | Next action |
|------|---------|----------|---------------|---------------|-------------|
| actor-turn-cadence-gate |  |  |  |  |  |
| actionfulness-gate |  |  |  |  |  |
| current-state-consumption-gate |  |  |  |  |  |
| planbead-continuity-gate |  |  |  |  |  |
| planbead-lifecycle-gate |  |  |  |  |  |
| social-plausibility-gate |  |  |  |  |  |
| budget-gate |  |  |  |  |  |
```

## Failure Classes

- `archived-hot-path-regression`: the run reintroduced ordinary goal/action/judgment provider cadence.
- `action-timidness`: observe, wait, remember, or movement-only actions dominate.
- `state-consolidation-gap`: verified state is not consumed by the next Actor Turn.
- `minecraft-mechanics-gap`: basic Minecraft prerequisite or station rules are missing from contracts.
- `planbead-lifecycle-gap`: evidence satisfies a bead but it remains open without reason.
- `episode-continuity-loss`: old concern disappears when new concern appears.
- `social-target-gap`: a social action is exposed without a deliverable social target.
- `social-surface-gap`: no visible social signal exists despite social-simulation claims.
- `generated-authority-gap`: generated source bypasses Actor Turn authoring or lifecycle trial gates.
- `provider-budget-blocker`: quota, budget, or usage ledger prevents or invalidates the run.
- `environment-blocked`: server, Java, Docker, auth, port, platform, or sleep/resume state blocks execution.

## Parallel Work Rules

Parallel subagents may be used aggressively, but each lane must have a bounded
artifact and disjoint ownership.

| Lane | Owns | Must return |
|------|------|-------------|
| Spec lane | campaign language, gates, Given/When/Then scenarios | proposed doc patch or findings |
| Runtime lane | current-state consumption and resolver hardening | changed files, focused tests |
| PlanBead lane | lifecycle reconciliation and ready-front quality | operation examples, tests, risks |
| Social-smoke lane | smallest live scenario that creates social evidence | scenario setup, required artifacts |
| Evaluation lane | review rubric and gate record | review output shape and failure classes |
| Budget lane | provider limits and run headroom | provider/model recommendation and guard result |

Preferred module-boundary lanes for the remaining campaign:

| Lane | Reuses | Primary risk |
|------|--------|--------------|
| Contract/schema lane | versioned artifacts, validators, provider parsers | low-cost provider output gets accepted too loosely or rejected too late |
| Current-state lane | Action Cards, `decision_frame`, resolver requirements | satisfied or impossible work remains attractive to the model |
| PlanBead lifecycle lane | guarded applier, ready front, evidence matcher | unrelated strong refs close the wrong bead |
| Social-surface lane | world events, relationship context, shared storage, chat | fixture-backed handoff is mistaken for durable social simulation |
| Generated-action lane | author-and-trial, source guard, actor workspace candidate store | generated code bypasses helper limits or never improves capability |
| Live-evidence lane | report audit, runtime-review script, provider usage ledger | completed runs are overclaimed as product acceptance |

Coordinator duties:

- inspect the current worktree before integration;
- never assume subagent output is authoritative without current evidence;
- keep PlanBeads out of executable authority;
- keep Action Cards out of domain-specific strategy checklists;
- verify the smallest relevant test set before broader checks;
- record blocked live runs as evidence, not as behavior success.

## Next Work Order

1. Keep this campaign spec stable and move dated run records to
   `Current-Handoff-And-Next-Work.md` or generated review artifacts.
2. Reduce redundant material-crafting loops when inventory and episode evidence
   already satisfy the current need.
3. Add clearer inspect/open-container affordances so chest or station blockers
   do not become generated probe drift.
4. Reconcile repeated generated-action and shelter blockers into PlanBead
   blocker updates without closing unrelated beads.
5. Strengthen social-surface scenarios beyond one actor plus fixture-backed
   shared storage: visible actor, chat target, relationship event, or later actor
   consumption.
6. Improve generated Mineflayer candidate quality while keeping source guards
   and actor-owned lifecycle promotion intact.
7. Run a fresh 30-turn low-cost gate only after the targeted behavior-quality
   fixes land.
8. Run a 60-turn gate only after the 30-turn review shows no structural blocker
   in Actor Turn cadence, current-state consumption, PlanBead lifecycle,
   social consequence, or budget.

Stopping after documentation is not completion. Documentation is the control
surface for the next implementation and live-evaluation campaign.
