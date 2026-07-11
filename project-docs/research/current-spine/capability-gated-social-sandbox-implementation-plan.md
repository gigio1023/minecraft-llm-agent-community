# Capability-First Minecraft Social Sandbox: Implementation Plan

Status: **ACTIVE implementation plan** for
`central-plan-capability-gated-social-sandbox.md` (V4).

Search token: `CAPABILITY_GATED_SOCIAL_SANDBOX_IMPLEMENTATION_PLAN`. Also:
`CAPABILITY_MANIFEST_V1`, `CAPABILITY_REPORT_V1`,
`GOAL_CONTINUITY_BENCHMARK_V1`, `INTERDEPENDENT_SCENARIO_V1`,
`PHENOMENON_RECORD_V1`.

Recorded: 2026-07-11 (`Asia/Seoul`).

Implementation branch: `codex/capability-gated-social-sandbox-v4`, created
from commit `d5d29cec`. Continue V4 implementation and its plan-status updates
on this branch unless the user explicitly changes the delivery branch. Do not
resume this plan by committing directly to `main`.

Authority: subordinate to `SPEC.md`, `AGENTS.md`, and the V4 central plan. If
this implementation plan and the central plan disagree, the central plan wins
and this file must be reconciled in the same change that implements the new
decision.

## 0. Delivery Outcome

Build one continuous, evidence-grounded path:

```text
checked-in individual capability manifest
-> typed target and milestone evaluation
-> existing Actor Turn + Mineflayer execution
-> normalized capability report
-> long-horizon goal-continuity cases
-> capability-controlled interdependent social scenario
-> synchronized long-run artifacts, metrics, and video
-> phenomenon record
-> optional controlled follow-up study
```

The work is complete only when each arrow is exercised by a current-run artifact.
Types, unit tests, plans, and green docs are not substitutes for runtime evidence.

## 1. Implementation Boundary

### In Scope

- dataset-free individual capability manifests;
- strict, runtime-evaluable target and milestone predicates;
- normalized per-case and suite reports;
- deterministic calibration and provider-backed capability runs;
- multi-hop objectives and blocker-recovery cases;
- goal-continuity benchmarks using existing memory and PlanBead state;
- capability requirements on social scenarios;
- initial economic, cooperative, and multi-activity quest scenarios;
- long-run structured observation, descriptive metrics, screenshots/video, and
  phenomenon records;
- controlled follow-up scaffolding only after the user selects a phenomenon.

### Out Of Scope

- implementing or reviving V3 Session A/B;
- a fixed lived-vs-told, prediction, or observer-legibility treatment arm;
- importing MineDojo, MineStudio, MineRL, or another benchmark runtime;
- building a large gold-trajectory dataset before state predicates are
  insufficient;
- model training, fine-tuning, VLA integration, or visual-policy replacement;
- hidden Minecraft planners, recipe solvers, action candidates, or parameter
  suggestions in benchmark manifests;
- pre-scripted trust, friendship, conflict, economy, institutions, or social
  outcomes;
- provider-backed runs before the mandatory quota preflight;
- presenting benchmark success, clean logs, or compelling video as a scientific
  contribution.

### Confirmation Required

- a new provider/model or material live-run budget;
- destructive world or actor-workspace cleanup;
- a spec change outside the V4 direction already approved by the user;
- publishing artifacts or opening a PR;
- choosing a candidate phenomenon as a public research claim.

Routine reversible implementation, fixtures, tests, and provider-free smokes
inside this plan do not require repeated confirmation.

### Ponytail Implementation Discipline

Apply the default-strength principles from `DietrichGebert/ponytail` (reviewed
at upstream commit `14a0d79`) to implementation work in this plan:

1. First decide whether new code is necessary.
2. Reuse a current repo helper or pattern before writing another one.
3. Prefer the Node/Bun standard library and existing platform behavior.
4. Reuse an installed dependency before adding a new dependency.
5. Add the smallest root-cause fix after tracing every caller of the shared
   function being changed.

Do not create an interface with one implementation, a factory for one product,
a generic validator for one data format, or configuration for a value that does
not vary. Prefer deletion and direct code over speculative flexibility.

These principles reduce implementation size; they do not reduce correctness.
Never remove input validation at file/provider/runtime entry points, error
handling that prevents data loss, runtime-owned Minecraft truth, provider usage
limits, saved evidence, or the smallest test that fails when non-trivial logic
breaks. Repo authority and the requirements in `SPEC.md` and `AGENTS.md` remain
stronger than this implementation discipline.

For A3, first reuse existing cancellation, provider-usage, and report-writing
paths; do not add a separate hierarchy of budget-manager classes. For B2, reuse
the current root-safe ref resolver and nearby strict loader patterns; do not
introduce a general schema library solely for continuity files. If a deliberate
simplification has a known limit, add a `ponytail:` comment that names the limit
and the exact condition for replacing it.

## 2. Current Implementation Inventory

The repository already has useful mechanisms, but not the V4 program as one
integrated path.

| Existing component | Evidence | V4 use | Gap |
| --- | --- | --- | --- |
| Free-form benchmark task injection | `probe/src/socialCycleCli.ts`, `--benchmark-task`; `probe/src/runtime/socialCycleRunner.ts` | send a top-level objective through normal Actor Turn | no case identity, typed target, milestone declaration, budget hash, or manifest provenance |
| Generic benchmark evidence prose | `benchmarkTaskEvidenceRequirements()` in `socialCycleRunner.ts` | preserves runtime-truth boundary | describes evidence but cannot evaluate a declared target |
| Furnace observation metrics | `probe/src/runtime/goals/socialCycleBenchmarkMetrics.ts` | useful artifact-reading and usage aggregation | `BenchmarkMilestoneId` and observations are hard-coded to one early-game chain |
| Furnace scorer and HTML | `probe/src/runtime/goals/socialCycleBenchmarkScore.ts` | reference for curves, efficiency, and review | weights, icons, order, and scoring plan are fixture-specific |
| Action-skill probe matrix | `probe/src/actionSkillProbeMatrixCli.ts` | deterministic primitive/action-skill calibration | proves bounded action behavior, not Actor Turn goal pursuit |
| World scenarios | `probe/src/server/worldScenarios.ts` | declared natural and fixture setup with truthfulness artifacts | no benchmark case manifest or social dependency declaration above the world setup |
| Social-cycle reports | `probe/src/runtime/goals/types.ts`, `socialCycleRunner.ts` | provider, action, verifier, evidence, memory, and usage source | no normalized capability-case result or suite aggregation |
| PlanBeads | `probe/src/runtime/goals/planBeads/**` | durable intermediate work, dependency, blocker, and resume evidence | no benchmark protocol that scores continuity behavior |
| Active Episode and branch Deliberation | `probe/src/runtime/goals/actorEpisode/**` | bounded focus and replanning evidence | no long-horizon benchmark joining episode transitions to a case |
| Visual evidence | `probe/src/runtime/visualEvidence.ts` | first/third-person review images | screenshots are periodic; no V4 long-run segment index or phenomenon linkage |
| Multi-actor/legibility substrate | `probe/src/legibility/**`, shared-session runtime artifacts | scheduling, observation, chat, export, response-window mechanisms | V3-specific orchestration and labels must not become V4 authority |
| Provider usage ledger | `probe/src/provider/providerUsageTracker.ts` | cost, request, token, and latency evidence | needs normalized joins by capability case and social scenario |

### Current-State Conclusion

Do not start by adding more social scenarios. First replace the free-form
benchmark gap with manifest-owned, typed, reportable capability cases. The
existing furnace path should become one case or legacy adapter, not the generic
schema.

## 3. Target Module Layout

Use a bounded V4 benchmark namespace rather than adding more hard-coded branches
to `socialCycleRunner.ts`:

```text
probe/
  benchmarks/
    capability/
      individual-capability-v1.json
    continuity/
      goal-continuity-v1.json
    social/
      interdependent-social-v1.json
  src/
    benchmarks/
      capability/
        types.ts
        loader.ts
        predicates.ts
        milestones.ts
        report.ts
        runner.ts
        cli.ts
      continuity/
        types.ts
        evaluator.ts
        report.ts
        runner.ts
      socialSandbox/
        types.ts
        declaration.ts
        metrics.ts
        phenomenon.ts
        runner.ts
```

The exact split may change if nearby code makes a smaller boundary clearer.
Preserve these ownership rules:

- manifests declare evaluation, not strategy;
- the social-cycle runtime executes actors and emits evidence;
- benchmark evaluators read artifacts and never decide Minecraft truth on their
  own;
- scenario setup remains separate from actor progress;
- V4 report schemas do not silently reinterpret V3 report schemas;
- legacy report import, if needed, is an explicit adapter.

## 4. Data Formats And Evaluation Rules

### 4.1 `individual-capability-manifest/v1`

The checked-in manifest is a small evaluation program, not a dataset of correct
trajectories.

Required suite fields:

```ts
type IndividualCapabilityManifestV1 = {
  schema: "individual-capability-manifest/v1";
  suite_id: string;
  version: string;
  description: string;
  cases: IndividualCapabilityCaseV1[];
};
```

Required case fields:

```ts
type IndividualCapabilityCaseV1 = {
  case_id: string;
  title: string;
  top_level_goal: string;
  world_scenario_id: WorldScenarioId;
  fixture_class: "natural_world" | "command_fixture" | "mixed";
  required_capabilities: string[];
  budgets: {
    max_cycles: number;
    max_runtime_actions: number;
    max_wall_time_ms: number;
    max_provider_requests?: number;
    max_total_tokens?: number;
    max_estimated_cost?: number;
  };
  target: CapabilityPredicateV1;
  milestones: CapabilityMilestoneV1[];
  allowed_evidence_kinds: string[];
  seed_policy: {
    kind: "fixed" | "declared_set" | "fresh";
    seeds?: string[];
    repeats: number;
  };
  completion_policy: {
    require_target: boolean;
    partial_credit: "milestones" | "none";
  };
};
```

The manifest must not contain:

- recommended actions;
- action order;
- coordinates for the actor to use, unless the goal itself is explicitly a
  coordinate/position task;
- recipe steps;
- hidden target-item candidates;
- provider rationale;
- prose parsed into executable or scoring authority.

### 4.2 `capability-predicate/v1`

Start with the smallest typed predicate algebra supported by current artifacts:

```ts
type CapabilityPredicateV1 =
  | { op: "item_count_gte"; item: string; count: number; owner: "actor" }
  | { op: "held_item_is"; item: string }
  | { op: "block_observed_at"; block: string; position_ref: string }
  | { op: "position_within"; center_ref: string; radius: number }
  | { op: "container_item_count_gte"; container_ref: string; item: string; count: number }
  | { op: "evidence_kind_seen"; evidence_kind: string; constraints: Record<string, string | number | boolean> }
  | { op: "all"; children: CapabilityPredicateV1[] }
  | { op: "any"; children: CapabilityPredicateV1[] };
```

Implementation requirements:

- evaluation returns `passed | failed | unknown`, not a boolean that launders
  missing evidence into failure or success;
- every `passed` result lists evidence refs;
- every `unknown` result lists missing evidence or unsupported predicate kinds;
- item/block names normalize through Minecraft data, not a hand-written synonym
  list;
- predicate evaluation is offline and deterministic over the saved run artifacts;
- no regex or keyword parsing of provider prose, memory, task text, or rationale.

### 4.3 `capability-milestone/v1`

```ts
type CapabilityMilestoneV1 = {
  milestone_id: string;
  title: string;
  predicate: CapabilityPredicateV1;
  order: number | null;
  weight: number;
};
```

Weights support descriptive progress only. A suite comparison must also expose
the unweighted target and milestone results so weights cannot hide failure.

### 4.4 `individual-capability-report/v1`

Required top-level fields:

- schema, suite id/version, case id, manifest hash, run id, commit;
- provider/model/reasoning configuration and usage refs;
- platform, Minecraft version, scenario manifest, seed/reset refs;
- declared budgets and observed consumption;
- target result with evidence refs and missing-evidence reasons;
- per-milestone first-pass cycle/action/time and evidence refs;
- runtime status and benchmark interpretation status separately;
- failure class and next diagnostic action;
- unsupported-success-claim count;
- stalls, repeated actions, blocker recognition, and recovery;
- visual evidence refs as review-only context;
- raw report, actor workspace, provider IO, verifier, and transcript refs.

Use these interpretation statuses:

```text
passed | partial | failed | blocked | environment_blocked | unverifiable
```

Do not report `passed` if the runtime exited cleanly but the declared target
predicate did not pass.

### 4.5 `goal-continuity-manifest/v1`

A continuity case declares pressure, not a correct plan:

- top-level goal;
- world/scenario setup;
- initial open-work expectation;
- scheduled interruption or evidence change;
- optional process-restart checkpoint;
- lifecycle events the evaluator must be able to observe;
- physical target/milestones inherited from capability predicates;
- cycle/action/time/provider budgets.

The manifest must never specify which PlanBead to create, what it should be
called, or which exact intermediate goals are correct.

### 4.6 `goal-continuity-report/v1`

Report separately:

- physical goal and milestone progress;
- intermediate goal/PlanBead creation;
- dependency and ready-front changes;
- survival across cycles, compaction, and restart;
- evidence-triggered revision, defer, block, supersede, reopen, and close;
- stale goal repetition;
- unsupported physical closure;
- useful resume after interruption;
- provider, runtime, memory, PlanBead, and evidence failure classes.

### 4.7 `interdependent-social-scenario/v1`

The declaration must include:

- scenario id/version and world setup ref;
- actor count and actor profile refs;
- provider/model assignment and whether capability is comparable;
- role assignment mode: `assigned | negotiable | unassigned`;
- visible resource/access/information asymmetries;
- economic, cooperative, or quest activity graph;
- required individual capabilities with benchmark evidence refs;
- interaction opportunities and material stakes the setup creates;
- explicit statement that no social response is prescribed;
- observation, response-window, metric, visual, and budget settings;
- scenario provenance and reset refs.

The activity graph is an environment declaration. It must not choose actions,
partners, deals, promises, division of labor, or relationship outcomes.

### 4.8 `phenomenon-record/v1`

Required fields:

- phenomenon id, title, status (`candidate | selected_for_followup | retired`);
- concise observed pattern;
- scenario versions, runs, seeds, actors, and model configurations;
- recurrence count and denominator;
- material stakes and social opportunity refs;
- structured evidence refs and synchronized video/image segments;
- individual capability and continuity evidence refs;
- plausible competence, prompt, role, fixture, and evaluator explanations;
- proposed distinguishing change or control;
- user decision and rationale when selected for follow-up.

This record is not a scientific claim or locked label.

## 5. Failure Classification

Every V4 runner and report must distinguish:

| Failure class | Meaning | Owner |
| --- | --- | --- |
| `manifest_invalid` | schema, predicate, budget, or reference invalid | manifest validation |
| `world_setup_failed` | required scenario setup or validation failed | environment/scenario |
| `provider_blocked` | auth, quota, budget, or provider failure | provider setup |
| `model_goal_misread` | evidence shows the actor pursued the wrong objective | provider/Actor Turn |
| `missing_action_capability` | no available primitive/action skill can perform required work | action surface |
| `runtime_execution_failed` | selected valid action failed in Mineflayer/runtime | runtime/action skill |
| `verifier_failed` | evidence production or target evaluation is broken | verifier/evaluator |
| `no_measurable_progress` | actions occurred but no declared milestone changed | actor behavior |
| `stalled_after_progress` | progress stopped and did not recover | behavior/continuity |
| `context_continuity_failed` | relevant work/evidence disappeared or stayed stale | memory/PlanBeads/context |
| `claim_without_evidence` | provider or work state claimed unsupported completion | actor/report audit |
| `unverifiable` | saved evidence cannot decide the declared target | evidence requirements |

Provider response-format errors and environment blockers never become actor
competence scores.

## 6. Implementation Steps And Completion Conditions

Each step must produce its stated saved output before the next step becomes
the default build target.

### Step A0 — Direction And Document Routing

Deliver:

- V4 implementation plan and active pointer alignment;
- schema names, file ownership, and failure taxonomy;
- successor handoff targeting Step A1.

Acceptance:

- all active docs route to V4 and this implementation plan;
- V3 remains superseded audit trail;
- no runtime code change is claimed;
- docs build and stale-pointer checks pass.

### Step A1 — Manifest Loader And Typed Predicates

Status: **accepted after A1R** (2026-07-11). Provider-free; no live server or
provider call. Initial landing `26c1f93f` was reopened after evidence-rule
counterexamples; A1R repaired the evidence rules in a follow-up commit.

Deliver:

- `individual-capability-manifest/v1` TypeScript types and strict recursive
  allowlist loader;
- typed predicate evaluator with `passed | failed | unknown`;
- evidenced bag values with non-empty source refs and `origin: setup | run`;
- one checked-in suite containing three minimal cases:
  `collect_logs` (including `pale_oak_log`), `craft_table`, and `place_table`;
- negative fixtures for unknown keys, fractional budgets, invalid evidence
  kinds, inconsistent seeds, duplicate ids, dependency cycles, removed
  `evidence_kind_seen`, invalid Minecraft id, missing budget, and strategy
  fields.

Acceptance:

- [x] invalid manifests fail before server/provider work;
- [x] valid cases round-trip without defaulting missing evaluation authority;
- [x] predicates evaluate only saved structured evidence with resolvable refs;
- [x] every pass cites supplied artifact refs only (no fabricated `settlement:*`);
- [x] provider prose, task text, tool names, and setup/fixture origin cannot
  flip a physical target;
- [x] `cd probe && bun test` and `bun run typecheck` pass.

Evidence:

- explanation of implementation and rationale:
  `project-docs/research/benchmarks/individual-capability-manifest-a1.md`
  (`CAPABILITY_MANIFEST_V1_A1`)
- modules: `probe/src/benchmarks/capability/{types,loader,predicates,minecraftIds,evidenceBag,index}.ts`
- suite: `probe/benchmarks/capability/individual-capability-v1.json`
- fixtures: `probe/benchmarks/capability/fixtures/`
- tests: `probe/test/individualCapabilityManifest.test.ts`,
  `probe/test/capabilityPredicates.test.ts`
- validation: focused A1R tests 29/29; full probe suite 607/607;
  `bun run typecheck`; docs build; `git diff --check`
- A2 note: report adapter must map real social-cycle artifacts into
  `CapabilityEvidenceBagV1` with per-value refs and correct origin; do not
  import furnace milestone scoring as generic authority. Missing refs stay
  `unverifiable`. `block_observed_at` requires positioned run-origin block
  facts and a run-bound `placed_crafting_table` named position.

### Step A2 — Normalized Report Adapter

Status: **accepted** (2026-07-11). Provider-free; offline adapter over saved
`social-cycle-run-report/v1` artifacts. No live server or provider call.

Deliver:

- `individual-capability-report/v1` builder;
- adapter from current `social-cycle-run-report/v1` and actor workspace refs;
- target, milestone, budget, provider-usage, stall, blocker, and failure results;
- root-safe artifact ref resolution;
- explicit import of the current furnace observation path as a case-specific
  adapter, not generic schema authority (furnace metrics remain unused by the
  generic builder).

Acceptance:

- [x] clean runtime exit without target evidence reports `failed` or
  `unverifiable`, never `passed`;
- [x] partial milestones never imply target completion;
- [x] fixture setup evidence is not credited as actor progress;
- [x] report refs resolve inside the declared artifact roots;
- [x] repeated normalization of the same artifacts is deterministic.

Evidence:

- modules: `probe/src/benchmarks/capability/{reportTypes,artifactRefs,evidenceBagAdapter,report}.ts`
- tests: `probe/test/individualCapabilityReport.test.ts`
- validation: focused A2 tests 10/10; A1R+A2 39/39; `bun run typecheck`

### Step A3 — Capability Runner Wrapper

Status: **accepted** (provider-free, 2026-07-11; repaired labeling in
`c4266841`). Manifest-specific cycle, action, wall-time, provider-request,
token, and estimated-cost ceilings stop execution through AbortSignal + await
(no early Promise.race return). Cost ceilings without normalized USD mark
`cost_unverifiable` instead of inventing prices. Budget stops label
`runtime_status: "timeout"` and `failure_class: "budget_exhausted"` (or
`unverifiable` for cost). A5 remains blocked on provider approval only.

Deliver:

- one Bun CLI accepting `--manifest`, `--case`, provider/model, repeat/seed, and
  output directory;
- wrapper around existing social-cycle and world-scenario seams;
- case declaration artifact written before execution;
- per-run report plus suite index;
- `--benchmark-task` rejected on this path.

Acceptance:

- [x] the CLI does not translate the manifest into action suggestions;
- [x] `--benchmark-task` cannot emit a V4 capability report without a manifest;
- [x] budget exhaustion produces an explicit status and artifact;
- [x] deterministic/provider-free calibration makes zero live provider calls;
- [x] a one-command smoke emits declaration, raw report, normalized report, and
  suite index;
- [x] wall-time, provider-request, token, and cost ceilings stop before the next
  provider/runtime action and leave truthful declaration/raw/normalized/budget
  artifacts.

Evidence:

- modules: `probe/src/benchmarks/capability/{cli,runner}.ts`;
  `probe/src/runtime/socialCycleRunner.ts` case-budget path
- script: `probe:capability`
- tests: `probe/test/capabilityRunnerSmoke.test.ts`,
  `probe/test/capabilityBudgetStopping.test.ts`
- commits: `75a68ec9`, `c4266841`

### Step A4 — Basic Capability Suite

Status: **accepted** (2026-07-11). Suite version `1.1.0` with 8 cases;
provider-free loader validation only.

Deliver 5-8 cases covering:

- collect logs;
- craft planks/sticks;
- craft a crafting table;
- place a crafting table;
- craft a wooden pickaxe;
- mine cobblestone;
- use or contribute to a container as a non-social physical operation;
- one honest infeasibility/blocker-recovery case.

Acceptance:

- [x] each case declares natural/fixture status and required capabilities;
- [x] target and milestone evidence are case-specific and machine-checkable;
- [x] deterministic action-skill calibration is reported separately from Actor Turn
  goal pursuit;
- [x] the suite can compare pass/partial/failure shape without a gold trajectory;
- [x] no provider-backed claim is made until quota preflight passes.

Evidence:

- suite: `probe/benchmarks/capability/individual-capability-v1.json` (`1.1.0`)
- tests: `probe/test/individualCapabilityManifest.test.ts`

### Step A5 — First Provider-Backed Capability Batch

Status: **blocked** pending exact `(provider_id, model)`, whole-run estimate,
quota preflight, and explicit user approval.

Before execution:

- run `provider-quota-preflight` for exact provider/model candidates and the
  whole suite/repeat estimate;
- record model, reasoning, request/token/cost ceilings, seeds, scenario
  versions, and report directory;
- obtain dashboard or explicit approval where the provider policy requires it.

Deliver:

- at least one complete declared batch;
- normalized per-case and suite reports;
- failure analysis that separates provider, action surface, runtime, verifier,
  and actor behavior;
- no model ranking unless runs are comparable and denominators are explicit.

Acceptance is artifact completeness and truthful classification, not a required
pass rate. A weak model result updates required capabilities or model choice; it
does not invalidate the benchmark path.

### Step B1 — Multi-Hop Capability Case

Status: **accepted** (2026-07-11). Provider-free; case `reach_placed_furnace` in
suite `1.2.0`. Furnace observation adapter is case-specific only.

Deliver:

- convert the current furnace chain into a manifest-owned case;
- remove generic schema dependence on `FURNACE_BLOCK_SCORING_PLAN` and the
  closed `BenchmarkMilestoneId` union;
- add one longer natural-world candidate, with diamond acquisition as the
  preferred aspirational case after prerequisites work.

Acceptance:

- [x] milestone order comes from the manifest;
- [x] the actor is not shown the dependency chain;
- [x] partial credit is evidence-backed;
- [x] failure locates the missing prerequisite or continuity break;
- [x] the long case can time out honestly without fake success.

### Step B2 — Goal-Continuity Formats And Offline Evaluator

Status: **accepted** (provider-free offline, 2026-07-11; bag assert at evaluate
entry in `83b26f85`). Strict recursive loader validates
`goal-continuity-artifact-bag/v1` from a declared root; `evaluateGoalContinuity`
asserts bags before scoring. Restart-observation writer records typed offline
observations only — live process-restart survival is still unproven until B3
live evidence exists. Restart-required cases remain `unverifiable` without
distinct before/after durable reload refs and overlapping open work ids.

Deliver:

- continuity manifest/report schemas;
- evaluator joining Active Episode, PlanBead operations, ready fronts, memory,
  judgments, action evidence, and physical predicates;
- deterministic fixture cases for create, update, block, defer, resume,
  supersede, close, and unsupported closure.

Acceptance:

- [x] the evaluator does not prescribe PlanBead titles or intermediate goals;
- [x] memory or PlanBead prose cannot prove physical progress;
- [x] checkpoint/version conflicts remain visible;
- [x] each scored lifecycle change cites its source artifacts;
- [x] missing refs produce `unknown`/`unverifiable`, not zero or success;
- [x] saved artifact bags are root-safe, recursively allowlisted, and validated
  before evaluation;
- [x] a typed restart-observation writer exists for offline bags (not live
  restart proof).

Evidence:

- modules: `probe/src/benchmarks/continuity/{types,loader,evaluator,writer}.ts`
- tests: `probe/test/goalContinuityArtifactBag.test.ts`,
  `probe/test/goalContinuityEvaluator.test.ts`
- commits: `76db6cc0`, `83b26f85`

### Step B3 — Live Goal-Continuity Cases

Status: **declarations accepted; live execution blocked** pending provider
approval. Offline cases in `goal-continuity-v1` `1.1.0`.

Deliver at least three versioned cases:

1. long dependency chain with delayed milestones;
2. new concern interrupts open work, then the actor resumes or revises;
3. process restart/context compaction preserves useful work state.

Acceptance:

- [x] offline case declarations exist and load;
- [ ] current-run artifacts show what remained open and why;
- [ ] the actor changes work only from available evidence/context;
- [ ] stale repetition and unsupported closure are separately reported;
- [ ] physical target progress and continuity quality stay separate;
- [ ] at least one case exercises restart or equivalent durable reload.

### Step C1 — Social Scenario Declaration

Status: **accepted for declarations** (reviewed 2026-07-11). Provider-free
schema/loader/fixtures only. Checked-in scenarios declare capability gaps; a
manifest case declaration no longer counts as resolved capability evidence.

Deliver:

- `interdependent-social-scenario/v1` schema and loader;
- capability dependency refs;
- activity/resource dependency graph;
- scenario-version hash and declaration artifact;
- negative tests rejecting prescribed social outcomes or hidden action plans.

Acceptance:

- [x] a scenario may create a reason to interact but never a required relationship
  label or response;
- [x] assigned, negotiable, and unassigned roles are distinct;
- [x] command fixtures are identified and never credited as actor progress;
- [x] every required capability points to compatible benchmark evidence or a
  declared evidence gap.

### Step C2 — Minimal Interdependent Sandbox

Status: **accepted** (2026-07-11) for declarations. Live multi-actor runs not
executed in this wave.

Implement three small scenario families:

- **economic/resource dependency:** asymmetric resource, tool, station, or
  access conditions make exchange or specialization useful;
- **cooperative activity:** a shared construction, exploration, transport,
  defense, or recovery objective benefits from contribution by more than one
  actor;
- **multi-activity quest:** several useful activities compete for actors,
  materials, and time without centrally assigning the division of labor.

Acceptance:

- [x] scenario families declare pressure without prescribed response;
- [ ] capable actors receive the same runtime authority and normal Actor Turn path
  (live);
- [ ] cross-actor observation and chat are captured (live);
- [ ] response windows allow other actors a real subsequent turn (live);
- [x] each scenario produces repeated interaction opportunities with material stakes
  (declared);
- [x] the report distinguishes opportunity absence, refusal, execution failure,
  and no observable response (offline enum).

### Step C3 — Long-Run Observation Bundle

Status: **accepted** (2026-07-11) for offline schemas/writer/index/fixtures.
Live capture not run in this wave.

Deliver:

- scenario/run declaration;
- multi-actor report index;
- goal/action/resource/interaction time series;
- synchronized first/third-person visual refs and, when implemented, video
  segment refs;
- provider usage and environment provenance;
- per-actor capability and continuity dependency refs.

Acceptance:

- [x] structured evidence and visual time remain joinable by run/cycle/actor;
- [x] missing visual capture does not change Minecraft truth;
- [x] private actor state is not leaked into public analysis exports;
- [x] long-run reports cite raw artifacts rather than copying provider stories;
- [x] run duration, dropped captures, reconnects, and missing evidence are explicit
  (schema + fixture).

### Step D1 — Phenomenon Catalog

Status: **accepted** (2026-07-11). Fixture record only; no research claim.

Deliver:

- `phenomenon-record/v1` schema, writer, and index;
- reviewer workflow for selecting evidence and video segments;
- recurring-pattern denominator and alternative-explanation fields;
- status changes that only the user or an explicitly delegated reviewer can
  promote to `selected_for_followup`.

Acceptance:

- [x] a single transcript quote cannot satisfy recurrence;
- [x] the record cites capability and continuity controls;
- [x] scenario changes remain version-visible;
- [x] observation language does not silently become trust/culture/economy truth;
- [x] negative and retired candidates remain searchable.

### Step D2 — Controlled Follow-Up Package

Only after the user selects a phenomenon:

- use `minecraft-research-value-harness`;
- perform fresh close-prior-work review;
- write claim, baseline, falsifier, comparison/manipulation, competence controls,
  budget, and evidence plan;
- use provider quota preflight before any live batch;
- write a separate implementation/experiment declaration.

V3 mechanisms may be reused only if the new phenomenon needs them. Never
restore V3 by default.

## 7. Dependency Graph

```text
A1 manifest/predicates
  -> A2 normalized report
  -> A3 runner
  -> A4 basic suite
  -> A5 provider-backed batch
  -> B1 multi-hop case
  -> B2 continuity evaluator
  -> B3 live continuity
  -> C1 social declaration
  -> C2 minimal sandbox
  -> C3 long-run bundle
  -> D1 phenomenon catalog
  -> D2 selected controlled study
```

Parallel work is safe only after the shared schema it depends on is stable:

- case authoring may parallelize after A1/A2;
- report presentation may parallelize after A2;
- continuity fixture authoring may parallelize after B2 types land;
- three social scenario families may parallelize after C1;
- visual/video indexing may parallelize with C2 after run/cycle/actor join keys
  are fixed.

Do not parallelize competing schema definitions.

## 8. Testing Strategy

Keep tests small and Detroit-style.

### Schema And Loader Tests

- manifest required fields and enum/predicate validation;
- rejection of unknown predicate kinds and invalid Minecraft ids;
- no implicit budgets, target predicates, or evidence authority;
- stable manifest hashing and versioned output schemas.

### Predicate And Report Tests

- positive, negative, and missing-evidence cases for every predicate;
- nested `all`/`any` truth with `unknown` propagation;
- fixture evidence cannot count as actor progress;
- provider prose and tool names cannot flip targets;
- clean runtime exit cannot produce benchmark pass;
- deterministic normalization and stable evidence refs.

### Continuity Tests

- guarded PlanBead operation acceptance/rejection;
- restart/compaction state survival;
- evidence-triggered status changes;
- unsupported close and stale-ready-front detection;
- physical progress remains verifier-owned.

### Social Scenario Tests

- capability dependency checks;
- no prescribed social response fields;
- scenario version and fixture provenance;
- real subsequent-turn response-window closure;
- public/private export rejection;
- opportunity, action, execution, and response statuses remain separate.

### Integration Evidence

- one provider-free capability smoke;
- one declared provider-backed capability batch after preflight;
- one live continuity case;
- one minimal social scenario per family;
- one long-run bundle with visual refs;
- one fixture phenomenon record before any public claim.

## 9. Validation Commands

For every TypeScript step:

```bash
cd probe && bun test <targeted-test-files>
cd probe && bun run typecheck
git diff --check
```

Before merging a completed step:

```bash
cd probe && bun test
cd docs && npm run build
git diff --check
```

Repo `.ts` files must run with Bun. Do not use Node, ts-node, tsx, or npx tsx.

For live provider work, run the exact provider quota preflight first and include
its artifact or result in the final report. For Minecraft behavior, include the
fresh runtime command and artifact paths; unit tests alone are insufficient.

## 10. Documentation And Artifact Maintenance

When a step lands:

- update its acceptance checklist in this plan;
- update the active benchmark manifest or scenario declaration version;
- update `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md` only when the actual
  implementation map changes;
- add run reports under the established experiment/report hierarchy;
- preserve raw artifacts and link them rather than copying large blobs into docs;
- update public docs only after a behavior is genuinely available;
- keep historical V3 names out of new active schemas.

Schema changes require producer, validator, tests, reader, report, and docs to
change coherently. Do not add compatibility aliases to active schemas solely
because an older plan used a name.

## 11. Milestone Exit Criteria

### Milestone 1 — Capability Infrastructure Ready

- A1-A3 complete;
- one command emits declaration, raw report, normalized report, and suite index;
- predicate/report negative tests pass;
- no live provider dependency.

### Milestone 2 — Individual Capability Characterized

- A4-A5 and B1 complete;
- basic and multi-hop cases have current-run evidence;
- provider/runtime/action/verifier failures are separable;
- social scenarios can cite required capability evidence.

### Milestone 3 — Goal Continuity Characterized

- B2-B3 complete;
- long-running work survives interruption/restart where the model succeeds;
- failure reports identify stale, lost, unsupported, or blocked work;
- physical and continuity outcomes remain separate.

### Milestone 4 — Social Sandbox Observable

- C1-C3 complete;
- economic, cooperative, and quest families create repeated material
  interaction opportunities;
- actors retain social-goal freedom;
- structured artifacts and visual evidence are synchronized and auditable.

### Milestone 5 — Discovery Program Operating

- D1 complete;
- candidate phenomena can be recorded without being promoted to claims;
- the user can select, retire, or iterate based on evidence and video;
- D2 begins only for a selected candidate.

## 12. Immediate Next Work

Provider-free A3 budget stopping and B2 saved-evidence loading are accepted.
Remaining gates are live-run decisions:

1. A5 needs exact `(provider_id, model)`, whole-run estimate, quota preflight,
   and explicit user approval.
2. B3 live continuity (including real process restart / durable reload) needs
   the same provider gate; offline declarations and bag loading are not live
   proof.
3. Every checked-in C1/C2 capability dependency remains a declared gap until A5
   produces current-run normalized reports.
4. D2 remains unavailable until the user selects a real recurring D1
   observation (fixture records are permanently ineligible).

Do not start A5 from this plan alone — run the repo quota preflight and wait
for user approval with the exact command and budget.
