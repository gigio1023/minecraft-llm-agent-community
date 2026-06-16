# Project-Level Benchmark Plan

Search token: `PROJECT_LEVEL_BENCHMARK_PLAN`

Status: planning document.

Recorded: 2026-06-13 (`Asia/Seoul`).

Material-economy update, recorded 2026-06-15: target-state Minecraft goals
remain useful calibration gates, but the current social benchmark direction is
defined by personal possession, material claims, public affordances, weak
commons, obligations, and cross-actor continuity. Use
`Material-Claims-And-Social-Economy-Benchmark-Plan.md` for the active social
economy benchmark ladder.

## Purpose

This document defines a benchmark direction for evaluating the whole Minecraft
LLM agent runtime, not just one internal component.

The benchmark should answer:

- Given a Minecraft behavior goal, can this project make an actor attempt it in
  the real Mineflayer runtime?
- Did the actor actually make Minecraft-world progress, or only produce
  plausible text?
- Which provider/model performs better under the same world seed, actor context,
  action surface, budget, and evidence rules?
- When a goal fails, can the artifacts explain whether the failure came from
  the model's goal pursuit, context packet, missing runtime capability,
  Mineflayer execution, world setup, or verifier?

The benchmark is not a MineRL, MineDojo, BASALT, Voyager, VPT, STEVE-1,
JARVIS-VLA, or OpenHA clone. Those projects are useful as sources of task
families, action taxonomies, and evaluation ideas. This repo's benchmark must
run through the repo-owned Actor Turn, Mineflayer execution, action-skill
gates, transcript, evidence, and verifier contracts.

## Benchmark Philosophy

The benchmark should be project-level and evidence-first.

It should evaluate the full loop:

```text
ActorSoul + LifeGoal + current observation + memory + PlanBeads + action surface
-> provider/model Actor Turn
-> runtime action selection
-> action-skill or primitive gate
-> Mineflayer execution
-> verifier evidence
-> transcript, memory, judgment, and next-cycle context
```

For this project, a benchmark pass means:

- the actor had a goal or context that justified the attempt;
- Mineflayer or runtime evidence proves the claimed progress;
- the target state or milestone was reached within the benchmark budget;
- the report does not launder provider prose into success;
- later-cycle context preserves relevant consequences, blockers, and unfinished
  work.

This benchmark can include deterministic runs, provider-backed runs, and offline
provider/context tests, but they must be labeled separately. A deterministic
action-skill pass is not the same as live model agency. An offline provider
answer is not simulation proof.

## Provider Contract Assumption

Tool schema compliance, function-call formatting, and structured physical
argument validity are not benchmark targets.

The benchmark assumes that the provider adapter, vLLM layer, and runtime
contract boundary already enforce those requirements. If a run fails because a
provider adapter emits malformed tool calls, missing required runtime arguments,
or non-schema-conforming output, classify that as a run-validity or adapter
blocker and exclude it from model capability scoring until the infrastructure is
fixed.

Prohibited benchmark suites:

- tool-schema-following benchmarks;
- structured-argument-extraction benchmarks;
- Action Card function-call-format benchmarks;
- tests whose main score is whether a model uses the expected tool name;
- tests whose main score is whether a model fills required primitive arguments.

These failures may still appear in post-run diagnostics, because they explain
why a run was unusable. They must not be treated as the benchmarked behavior.
The benchmarked behavior is goal pursuit in Minecraft: reaching target states,
making measurable progress, recovering from blockers, and doing so with
reasonable cost and latency.

## Three Benchmark Layers

### Layer 1: Native Runtime Competence

This layer proves the runtime can do boring Minecraft tasks end-to-end.

Primary command:

```bash
cd probe
bun run probe:skills -- \
  --actor npc_b \
  --max-actions 8 \
  --init-actor-workspace baseline \
  --continue-on-failure \
  --report ../tmp/project-benchmark-native-skills.json
```

This layer checks:

- action-skill registration;
- primitive ownership;
- deterministic fixture setup;
- current-run Mineflayer execution;
- postcondition evidence;
- report shape for pass, failure, blocked, or missing evidence.

This is not the main user-facing benchmark, but it is the calibration gate. If
the project cannot pass the native action-skill matrix, provider comparisons are
mostly noise because the actor body is not trustworthy.

### Layer 2: Project-Level Goal Suites

This is the main benchmark the project should grow toward.

A goal suite is a set of Minecraft behavior goals executed through
`probe:social-cycle` or a future `probe:benchmark` runner. The goal may come
from a repo-native scenario, an external benchmark task family, or a custom
project-defined target.

The benchmark runner should control:

- provider/model;
- actor id and ActorSoul/LifeGoal fixture;
- world seed and world scenario;
- cycle count and max actions per cycle;
- action-skill availability;
- provider budget;
- retry and blocker constraints;
- report output path.

Each goal case should output:

- `goal_case_id`;
- `goal_source`;
- `world_setup_refs`;
- `actor_context_refs`;
- `provider_model`;
- `runtime_status`: `passed`, `partial`, `failed`, `blocked`,
  `environment_blocked`, or `unverifiable`;
- `evidence_status`: `current_run`, `historical`, `missing`, or `offline_only`;
- `score`;
- `failure_class`;
- `evidence_refs`;
- `provider_usage_refs`;
- `next_debug_action`.

This layer evaluates the whole project: model choice, context projection,
action selection, runtime execution, evidence quality, memory continuity, and
truthful reporting.

### Layer 3: Offline Diagnostic Benchmarks

This layer does not prove Minecraft simulation, but it can cheaply compare
models and catch regressions.

Examples:

- Minecraft knowledge multiple-choice questions;
- goal interpretation from dialogue or scenario context;
- prediction of plausible next progress milestone;
- hallucination detection;
- outcome classification from saved artifacts;
- Soul/LifeGoal consistency judgment from transcript snippets.

Offline diagnostics are useful for model screening before expensive live runs.
They should never be reported as gameplay success.

## Dataset Strategy

The benchmark should support both dataset-backed and dataset-free evaluation.
They answer different questions.

| Benchmark type | Needs a gold dataset? | What it measures | Example |
|---|---|---|---|
| Live target-state benchmark | No | Whether the actor reaches a measurable Minecraft state within a budget | collect logs, place crafting table, deposit items |
| Live milestone benchmark | No | How much progress was made toward a larger target | partial shelter footprint, staged crafting chain |
| Scenario stress benchmark | No | Robustness under controlled environment pressure | blocked path, scarce resource, new concern appears |
| Offline knowledge benchmark | Yes | Minecraft factual or procedural knowledge | MCQ recipe/station questions |
| Offline social/spatial benchmark | Usually yes | Whether the model understands a dialogue or spatial instruction | BAP or Minecraft dialogue data |
| Reference trajectory benchmark | Yes | Distance from a human or expert trace | MineRL/BASALT/BEDD-style demos |

The main project benchmark should start with live target-state and milestone
benchmarks because they do not require a gold dataset and directly measure this
runtime. Dataset-backed checks are useful as cheap model screens, but they
should remain secondary unless the target behavior is explicitly offline.

## Dataset-Free Custom Benchmarks

The project needs its own benchmarks even without external datasets.

External datasets are optional. A benchmark can be defined by a world fixture,
goal text, actor context, measurable target state, progress milestones, budget,
and verifier contract.

Dataset-free benchmark examples:

| Goal case | What it tests | Pass evidence |
|---|---|---|
| `native.collect_logs.v0` | Can the actor gather basic wood? | log inventory increase and `collect_logs` verifier pass |
| `native.craft_table.v0` | Can the actor craft a basic station? | crafting table inventory increase |
| `native.place_table.v0` | Can the actor change the world with a placed block? | before/after block evidence |
| `native.mine_cobblestone.v0` | Can the actor use a tool to mine stone? | stone removed and cobblestone inventory increase |
| `native.shared_storage.v0` | Can the actor contribute to shared resources? | chest before/after container snapshot |
| `native.blocker_recovery.v0` | Can the actor avoid fake completion after a blocked action? | blocked evidence plus valid pivot or truthful stop |
| `native.memory_continuity.v0` | Does prior evidence affect a later cycle? | later provider input cites prior judgment or memory refs |
| `native.planbead_context_change.v0` | Does open work survive a new concern? | PlanBead state preserves A while B is added/deferred/linked |
| `native.social_request.v0` | Can the actor perform a social action with runtime evidence? | ordered chat/action evidence and relationship/checklist artifact |

These cases can be hand-authored. The important part is not dataset size; it is
stable setup, repeatable execution, strict evidence, and comparable reports.

## External Benchmark Sources

External references should supply task inspiration, not runtime authority.

| Source | Best use in this repo | What not to copy |
|---|---|---|
| MCU / MineStudio | Task families, simple/hard variants, goal taxonomy, small HF task manifests | Visual-policy runner or VLM evaluator as the first benchmark authority |
| MineDojo | Programmatic task prompts, task taxonomy, verifier inspiration | Replacing the Mineflayer runtime with MineDojo Gym as the active path |
| MineRL / BASALT | Fuzzy goal families and human-judged task ideas | Pixel/action loop or human-video evaluation as required first milestone |
| Minecraft Structured Dialogue Corpus / BAP | Offline social/spatial instruction tests | Treating offline action prediction as live Minecraft proof |
| VPT / STEVE-1 / JARVIS-VLA / OpenHA | Future visual-policy baselines, goal families, model comparison references | Treating keyboard/mouse visual policy success as equivalent to this runtime's Mineflayer evidence |
| MinePlanner / MineBench | Optional offline planning or spatial/build diagnostics | Hidden PDDL planner authority in Actor Turn |

The first external-derived suite should use MCU/MineStudio and MineDojo task
families because they are easy to translate into concrete item, crafting,
mining, storage, movement, and build goals.

## Model Comparison Plan

The benchmark should make model comparison explicit.

For each model/provider, run the same benchmark suite with:

- same world seed;
- same world scenario setup;
- same actor id and ActorSoul/LifeGoal fixture;
- same cycle and action budget;
- same action surface;
- same provider input projection version;
- same verifier version;
- same scoring rubric.

Models should be compared on multiple dimensions, not only final pass rate.

## Goal Tracking Model

Every project-level benchmark case should define what reaching the goal means
before the run starts.

Case definition:

- `initial_state_probe`: what to record before the actor acts;
- `target_state_predicate`: the world, inventory, container, position, chat, or
  social artifact condition that completes the goal;
- `progress_milestones`: ordered or unordered intermediate states that count as
  partial progress;
- `budget`: max cycles, max runtime actions, wall-clock limit, and provider
  request/token/cost limits;
- `sampling_points`: before run, after setup, before each action, after each
  action, end of cycle, and end of run;
- `evidence_requirements`: artifact types that can prove the target or each
  milestone.

The runner should produce progress events whenever a predicate changes from
false to true:

```ts
type BenchmarkProgressEvent = {
  event_id: string;
  goal_case_id: string;
  kind: "milestone_reached" | "target_reached" | "regressed" | "blocked";
  milestone_id?: string;
  cycle_index: number;
  action_index: number;
  wall_time_ms: number;
  evidence_refs: string[];
};
```

This makes model comparison less subjective:

- `time_to_first_progress_ms` comes from the first `milestone_reached` or
  `target_reached` event.
- `time_to_goal_ms` comes from the first `target_reached` event.
- `milestone_coverage` comes from reached milestone ids divided by declared
  milestone ids.
- `stall_rate` comes from cycles with no new progress event.
- `cost_per_milestone` and `cost_per_goal_pass` come from provider usage
  records joined to the same case.

Provider/tool contract incidents can be attached as diagnostic notes, but they
do not create progress events and do not define benchmark cases.

Recommended metrics:

| Metric | Meaning |
|---|---|
| `goal_pass_rate` | Fraction of goal cases with verifier-backed success |
| `goal_completion_score` | Weighted target-state and milestone completion score |
| `partial_progress_rate` | Fraction with meaningful current-run progress but incomplete goal |
| `milestone_coverage` | Fraction of declared progress milestones reached |
| `time_to_first_progress_ms` | Wall-clock time before first verifier-backed progress |
| `time_to_goal_ms` | Wall-clock time before target completion |
| `cycles_to_first_progress` | Cycles before first verifier-backed progress |
| `cycles_to_goal` | Cycles before target completion |
| `actions_to_first_progress` | Runtime attempts before first useful progress |
| `actions_to_goal` | Runtime attempts before target completion |
| `provider_latency_ms_p50` | Median provider-call latency during the run |
| `provider_latency_ms_p95` | Tail provider-call latency during the run |
| `runtime_execution_latency_ms` | Time spent in Mineflayer/runtime execution per action |
| `total_wall_time_ms` | End-to-end benchmark case duration |
| `request_count` | Provider requests consumed |
| `input_tokens` | Input tokens consumed |
| `output_tokens` | Output tokens consumed |
| `thinking_tokens` | Thinking/reasoning tokens when reported |
| `estimated_or_reported_cost` | Provider cost when pricing data is available |
| `cost_per_goal_pass` | Provider spend per completed goal |
| `cost_per_milestone` | Provider spend per reached progress milestone |
| `stall_rate` | Fraction of cycles with no new measurable progress |
| `blocker_recovery_rate` | Fraction of blocker cases that later reach progress or a correct smaller target |
| `evidence_density` | Useful evidence refs per action attempt |
| `world_state_delta_count` | Count of verified inventory, block, container, position, or chat deltas |
| `seed_consistency` | Success stability across repeated seeds or repeated runs |
| `context_continuity_score` | Later turns use prior judgment, memory, blockers, or PlanBeads correctly |
| `soul_alignment_score` | Action choices remain coherent with ActorSoul/LifeGoal and social obligations |
| `social_consequence_score` | Relationship, shared storage, chat, obligation, or settlement state changes are evidence-backed |

Each run should also preserve raw provider input/output refs so later reviewers
can explain why one model did better than another.

## Scoring Rubric

Start with simple scoring. A benchmark that is too clever will hide failures.

Per goal case:

| Score | Label | Meaning |
|---:|---|---|
| 1.0 | pass | Verifier-backed goal completion in current run |
| 0.7 | strong partial | Most declared milestones reached, goal incomplete |
| 0.4 | weak partial | At least one declared milestone reached |
| 0.2 | attempted no progress | Relevant attempt occurred, but no target-state progress |
| 0.0 | fail | No relevant progress, timeout, or unverifiable claim |

Outcome modifiers:

- record `claim_without_evidence=true` when model/report text claims completion
  without matching evidence;
- record `stall_cycles` when cycles produce no new measurable progress;
- record `recovered_from_blocker=true` when the actor reaches progress after a
  world or capability blocker;
- record `context_continuity_failed=true` when prior evidence, memory, or open
  PlanBead state should have shaped the later attempt but did not.

Do not subtract score for tool schema, function-call formatting, or structured
argument failures. Those are provider/runtime contract incidents. Mark the run
invalid or infrastructure-blocked and inspect them separately.

Hard fail:

- provider prose is the only success evidence;
- runtime marked pass without verifier-backed world, inventory, position,
  container, chat, or transcript evidence;
- benchmark harness injects hidden domain strategy or pre-completed target state.

## Initial Benchmark Suites

### Suite A: Boring Competence

Purpose: prove the actor can perform basic survival and settlement-maintenance
actions.

Cases:

- collect logs;
- craft planks and sticks;
- craft crafting table;
- place crafting table;
- craft wooden pickaxe;
- mine cobblestone;
- deposit logs or cobblestone into shared chest.

Expected runner:

- native action-skill matrix for calibration;
- provider-backed project-level run for model comparison.

### Suite B: Goal Recovery Under Blockers

Purpose: prove the actor can still pursue the goal when the world creates
ordinary blockers.

Cases:

- missing target block;
- obstructed movement;
- missing station;
- scarce resource near spawn;
- first attempt fails but a smaller useful milestone remains reachable.

Expected pass behavior:

- reach the original target after recovery, or reach a declared fallback
  milestone;
- preserve blocker evidence;
- avoid claiming the original target was completed without verifier evidence.

### Suite C: Context Continuity

Purpose: prove multi-cycle state is preserved.

Cases:

- actor starts work A;
- new concern B appears;
- A remains open/in-progress/blocked/deferred;
- B is added, linked, prioritized, or deferred;
- next action is chosen from current observation and ready work, not from a
  stale checklist.

Expected evidence:

- PlanBead operation artifacts;
- provider input refs;
- CycleJudgment or Actor Turn evidence;
- next-cycle action choice tied to current evidence.

### Suite D: Social Seed

Purpose: prove social simulation is more than solo gameplay.

Cases:

- request an item from another actor;
- announce resource discovery;
- deposit shared resources after a settlement need;
- hand off an item at a chest;
- wait for busy crafter without stealing task authority.

Expected evidence:

- chat or social action evidence;
- ordered runtime events;
- relationship or settlement artifact update;
- no claim of broader social success without supporting evidence.

### Suite E: External-Derived Task Smoke

Purpose: translate external task sources into repo-native goals.

Initial sources:

- MCU/MineStudio simple task manifests;
- MineDojo programmatic task prompts;
- BASALT-inspired fuzzy goals only when local verifiers exist.

Expected output:

- external task id;
- local goal case id;
- implementation status: `implemented`, `partial`, `not_implemented`,
  `blocked_by_missing_action_skill`, or `blocked_by_verifier_gap`.

## Report Shape

A project-level benchmark report should be machine-auditable.

Minimal schema:

```ts
type ProjectBenchmarkReport = {
  schema: "project-level-benchmark-report/v1";
  run_id: string;
  created_at: string;
  benchmark_suite_id: string;
  repo_commit?: string;
  provider: {
    id: string;
    model: string;
    usage_refs: string[];
  };
  environment: {
    platform: string;
    world_seed?: string;
    world_scenario_id?: string;
    managed_server: boolean;
  };
  cases: ProjectBenchmarkCaseResult[];
  summary: {
    total: number;
    passed: number;
    partial: number;
    failed: number;
    blocked: number;
    environment_blocked: number;
    average_score: number;
    goal_completion_score: number;
    milestone_coverage: number;
    claim_without_evidence_rate: number;
    stall_rate: number;
    time_to_first_progress_ms?: number;
    time_to_goal_ms?: number;
    provider_latency_ms_p50?: number;
    provider_latency_ms_p95?: number;
    runtime_execution_latency_ms_p50?: number;
    runtime_execution_latency_ms_p95?: number;
    cost_per_verified_progress?: number;
    cost_per_goal_pass?: number;
  };
};
```

Case result:

```ts
type ProjectBenchmarkCaseResult = {
  goal_case_id: string;
  goal_source: "repo_native" | "mcu" | "minedojo" | "basalt_inspired" | "offline_custom";
  provider_model: string;
  runtime_status: "passed" | "partial" | "failed" | "blocked" | "environment_blocked" | "unverifiable";
  score: number;
  target_state_reached: boolean;
  milestones_reached: string[];
  milestones_total: number;
  timings: {
    total_wall_time_ms?: number;
    time_to_first_progress_ms?: number;
    time_to_goal_ms?: number;
    provider_latency_ms?: number[];
    runtime_execution_latency_ms?: number[];
  };
  usage: {
    request_count?: number;
    input_tokens?: number;
    output_tokens?: number;
    thinking_tokens?: number;
    estimated_or_reported_cost?: number;
  };
  failure_class?: BenchmarkFailureClass;
  diagnostic_notes?: string[];
  evidence_refs: string[];
  transcript_refs: string[];
  provider_input_refs: string[];
  provider_output_refs: string[];
  verifier_refs: string[];
  next_debug_action?: string;
};
```

Failure classes:

- `model_goal_misread`;
- `missing_action_skill`;
- `no_measurable_progress`;
- `timeout_before_goal`;
- `stalled_after_progress`;
- `mineflayer_execution_failed`;
- `verifier_failed`;
- `world_setup_failed`;
- `provider_auth_or_budget_blocked`;
- `context_continuity_failed`;
- `claim_without_evidence`;
- `unverifiable_evidence`.

## Implementation Roadmap

### Step 1: Benchmark Manifest

Create a checked-in benchmark manifest for repo-native goals.

The manifest should be declarative:

- goal id;
- human-readable goal;
- world scenario;
- actor fixture;
- target-state predicate;
- progress milestones;
- cycle, action, wall-time, and provider-budget limits;
- expected evidence;
- metrics to collect;
- scoring rubric;
- external source mapping if any.

Do not put hidden action parameters or recommended next actions in the provider
input. The manifest configures the harness and verifier, not the actor's
decision.

### Step 2: Runner Wrapper

Add a project-level runner that can execute:

- deterministic calibration mode;
- provider-backed social-cycle mode;
- offline diagnostic mode.

The first version can wrap existing CLIs instead of introducing a large new
framework.

### Step 3: Report Normalization

Normalize outputs from:

- action-skill matrix reports;
- social-cycle reports;
- provider usage records;
- actor workspace evidence;
- offline diagnostic results.

The normalized report should let a reviewer compare models without opening
every raw artifact first.

### Step 4: Model Comparison Matrix

Run the same suite across a small set of providers/models.

Example matrix:

| Provider | Model | Purpose |
|---|---|---|
| deterministic-social | built-in | harness sanity only |
| Gemini API | explicit model id | low-cost live baseline |
| OpenAI API | selected small/medium model | stronger reasoning baseline |
| local/open model if available | selected model | cost/control comparison |

Every model row must use the same benchmark suite and world setup.

### Step 5: External-Derived Expansion

Map MCU/MineStudio and MineDojo tasks into the manifest.

Only mark a task `implemented` when this repo has:

- world setup;
- target-state predicate or milestone predicates;
- verifier;
- current-run evidence path.

Otherwise mark it `not_implemented` or `blocked_by_missing_action_skill`.

## Non-Goals

- Do not optimize for diamond acquisition as a top-level metric.
- Do not rank models by provider prose quality.
- Do not treat screenshots or videos as success without a matching verifier,
  unless a future benchmark case explicitly defines a human/VLM judgment path.
- Do not import external benchmark runners as the active runtime.
- Do not add hidden Minecraft strategy, parameter candidates, or task planners
  to provider input.
- Do not create tool-schema, function-call-format, structured-argument, or
  Action Card selection benchmarks. Those are provider/runtime contract tests,
  not project-level behavior benchmarks.
- Do not make building, mining, storage, or conversation mandatory universal
  phases. They are benchmark task families, not core runtime strategy.

## Acceptance Criteria For The First Version

The first useful version is small.

It should produce:

- one benchmark manifest with 5-8 repo-native goal cases;
- one runner command or wrapper script;
- one normalized report with per-case score, target-state status, milestone
  coverage, cost, latency, and failure class;
- one deterministic calibration run;
- one provider-backed run;
- artifact refs for every pass, partial, blocked, or failed case;
- a short comparison table for at least two provider/model settings.

The first version does not need external datasets. It should prove that the
project can evaluate itself before importing more benchmark material.

## Why This Plan Fits The Repo

This plan keeps the benchmark aligned with the current product direction:

- it evaluates the whole actor runtime, not only a helper function;
- it allows model comparison without requiring external datasets;
- it uses external Minecraft benchmarks as task sources, not as product specs;
- it keeps Mineflayer runtime evidence as the source of truth;
- it rewards truthful blocker handling and context continuity, not just raw task
  completion;
- it leaves room for Soul/LifeGoal social simulation metrics once boring
  competence is trustworthy.
