---
sidebar_position: 11
---

# PlanBeads Implementation Campaign

Search token: `PLANBEADS_IMPLEMENTATION_CAMPAIGN`.

Status: implemented vertical-slice campaign spec. PB-C1 through PB-C7 are
complete for the deterministic social-cycle proof path on
`feat/persistent-actor-state-planbeads`.

Recorded: 2026-05-31 10:28:49 UTC (`Etc/UTC`).

Implementation result, 2026-05-31:

- PlanBead types, validators, actor workspace paths/store, dependency logs,
  events, and history snapshots are implemented under
  `probe/src/runtime/goals/planBeads/`.
- Social-cycle context now receives a bounded read-only `plan_bead_packet` with
  `physical_progress_claim: false`; action execution still comes only from the
  action surface and `ActionIntent`.
- Deterministic ready fronts are computed from stored graph state and written as
  actor-workspace index artifacts.
- `CycleJudgment` can propose typed PlanBead operations, but runtime-owned
  guarded appliers accept or reject every mutation and write operation-result
  artifacts.
- Social-cycle reports include graph summary, ready-front refs, selected bead
  refs, and operation result refs. The report audit CLI checks these refs and
  can emit a `plan-bead-audit/v1` artifact.
- The final proof is a deterministic two-cycle A/B context-change run: A starts
  `in_progress`, B appears as `open` with a `discovered_from` edge, B enters
  the ready front without erasing A, and guarded operations move B into
  `in_progress` with evidence-linked operation results.

The proof is intentionally not a Minecraft gameplay pass. The offline
deterministic run reports `runtime_status: "blocked"` because no live Mineflayer
world execution occurred. That is the correct truth value for this slice:
PlanBeads preserve and mutate work-state context without claiming physical
progress.

This document translates the PlanBeads architecture into an implementation
campaign that can be carried by multiple high-reasoning worker agents over a
long period without losing the repo's core loop.

The goal is not to import a generic orchestration system into this repo. The
goal is to use proven harness patterns as operating discipline while keeping the
Minecraft runtime small, evidence-backed, and Soul/LifeGoal aligned.

## Core Loop Reminder

The runtime loop being implemented remains:

```text
ActorSoul + LifeGoal
-> actor-owned PlanBeadGraph
-> ready PlanBeads
-> CycleGoal
-> ActionIntent
-> runtime execution and evidence
-> CycleJudgment
-> guarded PlanBead updates
```

The implementation campaign is only the way repo agents coordinate code work.
It is not the in-game actor model.

## Interview-Calibrated Intent

The user clarified the implementation intent on 2026-05-31:

- the main problem is that actor goals, open work, blockers, and next concerns
  are too easy to lose or blur when they live only in free-form strings;
- PlanBeads should give LLM-based actors clearer state management so they can
  act more freely, not less freely;
- the first priority is work-state continuity when circumstances change, not a
  broad verification project;
- verification still matters when it prevents silent errors, fake completion, or
  progress laundering;
- the danger signal is bead-maintenance displacing Minecraft action and social
  simulation.

The first proof should emphasize a context-change case: the actor is working on
concern A, concern B appears, and the runtime preserves A while letting B become
ready, blocked, deferred, linked, or selected without turning the actor into a
checklist executor.

## Harness Lessons Adapted

Local harness analysis produced these reusable mechanisms:

- spec-first execution: clarify the seed, acceptance criteria, and boundaries
  before workers write code;
- work-item graph: break long work into issue-like tasks with dependencies,
  owner, status, accepted artifacts, and verification;
- single loop authority: the coordinator owns campaign state, stop/resume
  decisions, and final verification;
- isolated worker lanes: each worker gets one bounded file surface and one
  task per loop;
- artifact-first merge: workers produce patch summaries, test logs, and
  machine-readable status before canonical state is updated;
- resumable state: every worker run records status, blocker, files touched,
  tests run, and next action;
- circuit breakers: repeated no-progress, repeated identical error, cost drift,
  and verification-free loops stop the campaign instead of spinning;
- fresh review gates: old reviews do not prove the current diff;
- runtime evidence over UI inspection: Minecraft truth comes from actor
  workspace artifacts, verifier output, transcript, inventory, position, block,
  container, chat, and report evidence.

Adaptation rule:

```text
harness mechanism -> campaign discipline
not
harness mechanism -> new Minecraft runtime authority
```

## Critical Separation

Do not confuse these records:

| Surface | Purpose | Must not do |
|---------|---------|-------------|
| Campaign item | repo implementation task for agents | become actor runtime state |
| Worker result | patch/test/status artifact from a subagent | mutate actor PlanBeads directly |
| Merge queue | coordinator review surface | skip verification |
| Actor PlanBead | in-game actor-owned issue-like work item under LifeGoal | track repo implementation tasks |
| PlanBead operation | runtime-proposed mutation to actor work graph | grant action permissions or infer physical success |

Campaign work items may be inspired by PlanBeads, but they are not PlanBeads.
Actor-owned PlanBeads live in the Minecraft runtime actor workspace. Campaign
items live in implementation coordination notes and agent status artifacts.

## Campaign Loop

Use this loop for long PlanBeads work:

```text
campaign seed
-> campaign backlog and dependency graph
-> worker packet
-> isolated worker implementation
-> worker result artifact
-> coordinator merge queue
-> focused verification
-> integration patch
-> report/audit evidence
-> next campaign state
```

The coordinator owns:

- campaign backlog;
- dependency graph;
- shared interface changes;
- merge order;
- final test command selection;
- live provider/Minecraft run approval;
- final docs and handoff.

Workers own:

- one assigned lane;
- one bounded task at a time;
- their own changed files;
- focused tests for their lane;
- a machine-readable handoff.

## Worker Model Policy

For the campaign described here, deep implementation and review workers may use
GPT-5.5 with xhigh reasoning when the operator explicitly selects that model.
The model choice is an execution setting, not a runtime dependency.

Do not bake model-specific CLI flags, provider auth assumptions, or hosted-agent
behavior into the repo. Every worker result must still pass the same local
verification gates before it can affect canonical code, docs, or actor state.

## Coordinator Self-Goal Prompt

Use this prompt when starting or resuming the long-running implementation goal.
It is written for a coordinator agent that may use parallel workers, but the
coordinator remains responsible for merge order, verification, and final
acceptance.

```text
Goal: implement the PlanBeads vertical slice for actor-owned, restart-safe
work-state continuity in the Minecraft social-cycle runtime.

Core intent:
- PlanBeads exist because free-form strings are too weak to preserve what an
  LLM actor is trying to do, what remains open, why work is blocked, and how
  new concerns should relate to existing work.
- PlanBeads should make the actor more free and coherent, not more scripted.
- The first proof is context-change behavior: the actor is working on concern A,
  concern B appears, A remains preserved, and B can become ready, blocked,
  deferred, linked, or selected without turning the actor into a checklist
  executor.
- Execution matters, but this slice must not become a broad verification
  project. It must prevent silent errors, fake completion, and progress
  laundering.

Read first:
- SPEC.md
- AGENTS.md
- docs/blog-doc/Architecture/Actor-Persistent-State-And-PlanBeads.md
- docs/blog-doc/Architecture/PlanBeads-Implementation-Campaign.md
- docs/blog-doc/Architecture/Soul-Life-Goal-Runtime-Architecture.md
- docs/blog-doc/Architecture/Runtime-Loop-And-Verification.md
- docs/blog-doc/Terminology.md

Active implementation loop:
1. Keep the campaign backlog separate from actor PlanBeads.
2. Complete PB-C1 through PB-C7 in dependency order.
3. Use parallel GPT-5.5 xhigh workers only for bounded, disjoint lanes.
4. Merge worker output only after inspecting the current worktree, changed
   files, focused tests, and reported risks.
5. Prefer small TypeScript modules and Detroit-style tests over broad runtime
   rewrites.
6. Update docs only when behavior or direction changes, not as a substitute for
   runtime progress.

Runtime invariants:
- Actor workspace is the source of truth for actor-owned PlanBeadGraph state.
- PlanBeads are work graph state, not ordinary memory and not executable
  authority.
- PlanBeads must not provide missing ActionIntent args, action-skill
  permissions, physical success, retry-constraint mutation, ActorSoul mutation,
  or LifeGoal mutation.
- Provider packets expose bounded read-only PlanBead context with
  physical_progress_claim: false.
- Runtime-approved operation appliers own all PlanBead mutations and must
  record accepted and rejected operations.
- Compaction may preserve PlanBead refs and summaries but must never close a
  bead or turn provider text into evidence.

First slice:
- Implement PlanBead types and validators.
- Add actor workspace paths and a restart-safe store for current beads,
  dependencies, append-only events, and history snapshots.
- Compute a deterministic ready front from stored graph state.
- Inject a bounded read-only plan_bead_packet into social-cycle context.
- Add guarded operation proposal/application after the packet is present.
- Add reports/audits only after state and operations exist.
- Finish with a deterministic two-cycle social-cycle run that demonstrates the
  context-change case.

Worker assignment rule:
- Give each worker exactly one campaign item, lane, file surface, success
  criteria, verification command set, required artifacts, and stop conditions.
- Tell workers they are not alone in the codebase and must not revert unrelated
  edits.
- Do not allow workers to edit SPEC.md, AGENTS.md, CLAUDE.md, GEMINI.md,
  provider auth, or live provider setup unless explicitly assigned.
- Close or pause workers that edit outside scope, claim success without fresh
  verification, or turn PlanBeads into a domain strategy.

Required verification ladder:
1. cd probe && bun run typecheck
2. cd probe && bun test test/planBeads*.test.ts
3. cd probe && bun test relevant existing social-cycle tests when shared
   context or report surfaces changed
4. cd probe && bun test when shared runtime behavior changed broadly
5. cd docs && npm run build after documentation changes
6. deterministic social-cycle run for final vertical proof

Do not mark the goal complete until current evidence proves:
- actor workspace initializes PlanBead directories non-destructively;
- current bead and dependency records survive restart-style reload;
- ready front excludes closed, blocked, future-deferred, irrelevant, and
  dependency-blocked beads;
- provider context receives only bounded read-only PlanBead packet data;
- invalid PlanBead operations are rejected with audit evidence;
- reports explain graph state, ready front, selected refs, operation results,
  and evidence refs;
- deterministic social-cycle artifacts demonstrate A/B context-change
  continuity without PlanBeads acting as executable authority.
```

## Worker Packet Contract

Every worker prompt must include:

- `campaign_item_id`;
- `lane`;
- `objective`;
- `sources_of_truth`;
- `allowed_files`;
- `forbidden_files`;
- `non_goals`;
- `dependencies`;
- `success_criteria`;
- `required_artifacts`;
- `verification_commands`;
- `handoff_format`;
- `stop_conditions`.

Template:

```text
You are one worker in a parallel PlanBeads implementation campaign.

Task: <one bounded objective>
Lane: <types/store/ready-front/provider-packet/ops/reports>

Read first:
- SPEC.md
- AGENTS.md
- docs/blog-doc/Architecture/Actor-Persistent-State-And-PlanBeads.md
- docs/blog-doc/Architecture/PlanBeads-Implementation-Campaign.md
- lane-specific files listed below

Allowed write files:
- <exact file or directory set>

Forbidden:
- no SPEC.md / AGENTS.md edits
- no broad refactors
- no provider auth changes
- no live provider calls unless explicitly assigned
- no Minecraft domain strategy planner
- no PlanBead executable args or action permission mutation

Success:
- <specific behavior>
- <specific tests>
- <specific artifacts>

Final handoff:
- files changed
- commands run and results
- accepted behavior
- remaining risk
- EXIT_SIGNAL: true only when all assigned acceptance criteria pass
```

## Campaign Item Schema

Use a separate schema for campaign items. Do not reuse
`actor-plan-bead/v1`.

```ts
type CampaignItemStatus =
  | "pending"
  | "ready"
  | "in_progress"
  | "blocked"
  | "review"
  | "verified"
  | "merged"
  | "abandoned";

type PlanBeadsCampaignItem = {
  schema: "planbeads-implementation-campaign-item/v1";
  campaign_item_id: string;
  lane: string;
  status: CampaignItemStatus;
  title: string;
  objective: string;
  owner: "coordinator" | "worker";
  dependencies: string[];
  allowed_files: string[];
  forbidden_files: string[];
  success_criteria: string[];
  verification_commands: string[];
  required_artifacts: string[];
  human_review_required: boolean;
  provider_budget: {
    live_game_provider_calls_allowed: boolean;
    reason: string;
  };
  checkpoint: {
    created_at: string;
    updated_at: string;
    worker_session_id?: string;
    branch?: string;
    worktree_path?: string;
  };
};
```

## Worker Status Schema

Long-running work needs compact status, not full transcript replay.

```ts
type PlanBeadsCampaignWorkerStatus = {
  schema: "planbeads-campaign-worker-status/v1";
  campaign_item_id: string;
  lane: string;
  worker_session_id: string;
  status:
    | "started"
    | "working"
    | "blocked"
    | "ready_for_review"
    | "verified"
    | "failed";
  branch?: string;
  worktree_path?: string;
  files_touched: string[];
  tests_run: Array<{
    command: string;
    status: "passed" | "failed" | "blocked" | "not_run";
    evidence_ref?: string;
  }>;
  blocker?: {
    reason: string;
    repeated_count: number;
    needs_user_input: boolean;
  };
  artifact_refs: string[];
  next_action: string;
  exit_signal: boolean;
  updated_at: string;
};
```

## Parallel Lane Matrix

The first implementation campaign should use these lanes.

| Lane | Ownership | Depends on | Main output | Primary tests |
|------|-----------|------------|-------------|---------------|
| 0. Coordinator contracts | shared schemas, lane boundaries, merge order | none | locked interfaces and campaign state | docs build, typecheck after later lanes |
| 1. Types and validators | `probe/src/runtime/goals` or a small PlanBeads module | lane 0 | PlanBead, dependency, packet, operation types and validators | schema validator tests |
| 2. Actor workspace store | actor workspace paths/store PlanBead files | lane 1 | non-destructive dirs, atomic writes, append-only events, history | restart/store tests |
| 3. Ready front | pure graph/readiness computation | lane 1, minimal lane 2 types | `computeReadyPlanBeads` and blocker explanations | Detroit-style ready-front tests |
| 4. Provider packet and compaction | social-cycle context assembly and compaction | lanes 1, 3 | bounded read-only `plan_bead_packet` | context/compaction tests |
| 5. Guarded operations | CycleJudgment bead op proposals and runtime applier | lanes 1, 2, 3 | accepted/rejected op artifacts and state transitions | invalid op rejection tests |
| 6. Reports and audits | social-cycle reports, review summary, audit CLI | lanes 2, 3, 4, 5 | graph summary, ready front, op results in reports | report/audit tests |
| 7. Deterministic vertical run | integration wiring only | lanes 1-6 | deterministic social-cycle artifact proof | targeted social-cycle run/report audit |

Parallelization rule:

- Lane 0 and lane 1 happen first.
- Lanes 2 and 3 may proceed in parallel after lane 1.
- Lane 4 depends on lane 3's packet shape.
- Lane 5 depends on lane 2's store and lane 1's operation type.
- Lane 6 waits for lane 4 and lane 5 artifacts.
- Lane 7 is coordinator-owned final integration.

## File Ownership Guidance

Prefer small new modules over expanding shared runtime files.

Expected new or changed surfaces:

- `probe/src/runtime/goals/types.ts` only for cross-social-cycle schema fields
  that truly belong beside CycleGoal and CycleJudgment;
- `probe/src/runtime/goals/planBeadTypes.ts` or equivalent for PlanBead-specific
  records and validators;
- `probe/src/runtime/goals/planBeadStore.ts` for actor workspace reads/writes;
- `probe/src/runtime/goals/planBeadReadyFront.ts` for pure readiness logic;
- `probe/src/runtime/goals/planBeadOperations.ts` for guarded mutation;
- `probe/src/runtime/goals/cycleContextAssembler.ts` only for bounded packet
  insertion;
- `probe/src/runtime/goals/socialCycleContextCompaction.ts` only for bounded
  checkpoint summaries;
- `probe/src/runtime/goals/socialCycleReviewSummary.ts` and audit CLI surfaces
  only after reports exist;
- focused tests under `probe/test/planBeads*.test.ts` or nearby existing social
  cycle tests.

Coordinator-owned shared files:

- `probe/src/runtime/socialCycleRunner.ts`;
- `probe/src/runtime/socialCycleExecution.ts`;
- `probe/src/provider/socialGoalMindProvider.ts`;
- `probe/src/provider/socialCycleJudgmentProvider.ts`;
- Docusaurus architecture/spec docs.

Workers should not edit coordinator-owned files unless explicitly assigned.

## PlanBead Operation Gate

The runtime applier must reject and record artifacts for:

- stale `expected_checkpoint_version`;
- missing `evidence_refs` for status changes that require evidence;
- `closed` with `satisfied` without verifier-backed or guarded social evidence;
- dependency cycles;
- unknown dependency target;
- executable primitive args in PlanBeads;
- action-skill permission mutation;
- ActorSoul or LifeGoal mutation;
- runtime retry constraint creation, clearing, or override;
- provider text, memory notes, or compaction summaries used as physical proof.

Rejected operations are useful evidence. Do not discard them.

## Provider Packet Rules

The provider receives a compact, read-only packet:

- one to three ready PlanBeads by default;
- small in-progress and blocked summaries only when they explain the choice;
- evidence refs, dependency refs, and acceptance evidence requirements;
- `physical_progress_claim: false` for PlanBead summary facts;
- rules stating that action surface controls execution and runtime verifies
  physical progress.

Do not inject:

- full graph history;
- unbounded event streams;
- executable primitive args;
- action-skill permission grants;
- fixed domain strategy categories;
- generic "complete this plan" pressure.

## Report And Audit Artifacts

Add or expose these report shapes:

```text
plan-bead-graph-summary/v1
plan-bead-ready-front/v1
plan-bead-operation-result/v1
plan-bead-audit/v1
```

Run reports should include:

- PlanBeadGraph summary at run start and end;
- ready front at each cycle when available;
- selected PlanBead refs in CycleGoal context;
- accepted and rejected bead operations;
- dependency edges created or cleared;
- bead status transitions;
- evidence refs for every accepted transition;
- cycles that repeated blockers without a bead-aware pivot.

Audit output should mark each claimed transition:

- `DONE`: evidence is current and sufficient;
- `PARTIAL`: some evidence exists but acceptance is not fully met;
- `NOT_DONE`: evidence contradicts or does not support the claim;
- `UNVERIFIABLE`: artifact refs are missing or stale.

## Circuit Breakers

Stop or pause the campaign when any of these happen:

- three consecutive no-progress loops on the same campaign item;
- five repeated identical command or test failures;
- a worker edits outside its allowed file surface;
- a worker attempts to change product direction docs without assignment;
- a worker claims success without fresh verification;
- context compaction, memory, or provider text is used as physical progress;
- a lane needs provider or live Minecraft budget not approved for that item;
- platform setup blocks a run and the blocker has not been recorded with
  platform, command, artifact path, and failure mode.

These are campaign blockers, not actor behavior failures.

## Human Review Gates

Require explicit coordinator or user review for:

- changes to `SPEC.md`, `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md`;
- live provider or budgeted game-runtime runs;
- actor persistent-state migration that could affect existing workspace data;
- any PlanBead applier rule that changes mutation authority;
- any provider prompt that could turn PlanBeads into domain strategy;
- final acceptance of deterministic or live social-cycle evidence.

## Verification Ladder

Use the cheapest truthful verification first.

1. Static and schema checks:

   ```bash
   cd probe && bun run typecheck
   ```

2. Focused unit tests:

   ```bash
   cd probe && bun test test/planBeads*.test.ts
   ```

3. Existing social-cycle contract tests touched by the lane:

   ```bash
   cd probe && bun test test/socialCycleContext.test.ts test/socialCycleContextCompaction.test.ts test/socialCycleExecution.test.ts
   ```

4. Full probe test suite when the shared runtime surface changed:

   ```bash
   cd probe && bun test
   ```

5. Documentation build after docs changes:

   ```bash
   cd docs && npm run build
   ```

6. Deterministic social-cycle proof after lanes 1-6:

   ```bash
   cd probe && bun run probe:social-cycle -- \
     --actor npc_b \
     --provider deterministic-social \
     --cycles 2 \
     --max-actions-per-cycle 3 \
     --report ../tmp/planbeads-deterministic-social-cycle.json \
     --no-dashboard
   ```

7. Live provider proof only after provider budget and setup are explicit.

Do not treat smoke tests as proof of runtime value. The proof is artifact-backed
continuity and truthful report/audit evidence.

## First Campaign Backlog

All items in this backlog are complete for the deterministic vertical slice.
They remain here as the implementation spec and as a reference for future
extension work.

### PB-C0: Lock Campaign Contracts

Owner: coordinator.

Deliverables:

- this campaign document;
- search-index routing;
- a final lane matrix;
- no runtime code yet.

Success:

- docs build passes;
- PlanBeads architecture doc points to this campaign spec;
- no change to canonical product direction docs unless explicitly approved.

### PB-C1: PlanBead Types And Validators

Owner: worker after coordinator assignment.

Deliverables:

- `ActorPlanBead`, `PlanBeadDependency`, `PlanBeadPacket`,
  `PlanBeadOperation` runtime types;
- validators for required fields and status categories;
- tests rejecting missing evidence fields and ambiguous status values.

Success:

- types make it hard to confuse PlanBeads with ordinary memory;
- validators reject executable args and permission-looking fields where
  appropriate.

### PB-C2: Actor Workspace Store

Owner: worker after PB-C1.

Deliverables:

- PlanBead directories in actor workspace initialization;
- current bead read/write/list helpers;
- dependency JSONL helpers;
- append-only event writer;
- history snapshot writer;
- ready-cache rebuild placeholder.

Success:

- process restart reconstructs bead and dependency records from files;
- existing actor workspace initialization remains non-destructive.

### PB-C3: Ready Front Computation

Owner: worker after PB-C1.

Deliverables:

- pure `computeReadyPlanBeads` logic;
- dependency-blocker explanation records;
- tests for parallel readiness, open blocker suppression, closed blocker
  unblock, deferred exclusion, and relevance/action-surface checks.

Success:

- ready front is computed without provider help;
- blocked beads explain exactly which dependencies suppress readiness.

### PB-C4: Provider Packet And Compaction

Owner: worker after PB-C3.

Deliverables:

- bounded `plan_bead_packet` in social-cycle context;
- manifest/checkpoint entries with `physical_progress_claim: false`;
- compaction summaries preserving refs without closing beads.

Success:

- provider sees context, not command authority;
- compaction does not launder weak evidence into progress.

### PB-C5: Guarded Bead Operations

Owner: worker after PB-C1 and PB-C2.

Deliverables:

- `CycleJudgment` bead op proposal field or sidecar record;
- runtime applier with version/evidence/status/dependency guards;
- accepted and rejected operation artifacts.

Success:

- provider can suggest work-graph updates;
- runtime owns all mutation;
- invalid operations leave audit evidence.

### PB-C6: Reports And Audits

Owner: worker after PB-C4 and PB-C5.

Deliverables:

- social-cycle report graph summary;
- ready-front and op-result report fields;
- review summary/audit checks for PlanBead continuity and invalid-op rejection.

Success:

- failures are explainable from report and actor workspace artifacts;
- audits can distinguish verified, partial, missing, and unverifiable
  transitions.

### PB-C7: Deterministic Vertical Proof

Owner: coordinator.

Deliverables:

- deterministic two-cycle run using PlanBead packet and guarded operations;
- report audit output;
- handoff note with command, report path, and remaining risks.

Success:

- run reconstructs or initializes PlanBead state;
- ready front appears when beads exist;
- any bead transition cites evidence or is rejected;
- no physical progress claim is made from PlanBead text alone.

## Non-Goals

- Do not build a general task runner inside the Minecraft repo.
- Do not import a harness project's runtime, daemon, hook framework, or
  dashboard as a dependency.
- Do not turn PlanBeads into a domain planner for shelter, mining, farming, or
  storage.
- Do not give PlanBeads action permission authority.
- Do not treat campaign work items as actor PlanBeads.
- Do not require live provider calls for every implementation step.
- Do not claim success from memory notes, provider prose, or compaction text.

## Final Acceptance

The campaign is successful when:

- actor workspace has restart-safe PlanBead records, dependencies, events, and
  history;
- ready fronts are computed deterministically from stored graph state;
- provider packets expose bounded, read-only PlanBead context;
- `CycleJudgment` or a runtime-approved sidecar can propose typed bead
  operations;
- the runtime applier accepts valid operations and rejects invalid ones with
  artifacts;
- reports and audits explain graph state, ready front, operation results, and
  evidence refs;
- a deterministic social-cycle run proves the vertical slice without hidden
  provider authority;
- live provider proof remains explicit, budgeted, and separately auditable.
