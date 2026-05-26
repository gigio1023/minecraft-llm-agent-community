---
sidebar_position: 6
---

# Implementation Workstreams

This document tracks the implementation slices that turned the rebuild spec into
the current runtime surface.

The goal is still not to finish every historical plan. The active goal is to keep
actor workspace, action skill lifecycle, hot-path evidence, provider snapshots,
relationship pressure, and per-actor async reviewers coherent without blocking
gameplay turns.

## Delivered Runtime Surface

The current implementation now includes:

1. actor workspace source-of-truth layout;
2. action skill recipe schema and validator;
3. active seed action skill materialization;
4. shutdown and archive path for legacy `build/generated-skills` output;
5. actor-scoped evidence files;
6. provider input snapshots for LLM-backed gameplay and dialogue paths;
7. per-actor reviewer output schema, queue, store, CLI, and provider adapter;
8. bounded recipe trial evidence, promotion, supersession, and retirement
   helpers;
9. phase-one active action-skill gate for provider gameplay proposals;
10. actor profiles, goal stacks, relationships, and relationship-derived action
    pressure;
11. guarded relationship proposal application from reviewer evidence;
12. managed local live-smoke server readiness without provider auth.
13. objective-scoped direct generated TypeScript action skill trials with
    generated source, helper events, provider snapshots, current-run objective
    evidence, dashboard visibility, and reviewer queue refs.
14. typed actor memory schema, direct objective memory capture, symbolic
    objective-scoped memory retrieval, and dashboard visibility for memory
    records.

## Current Slice Status

As of the first implementation pass:

- Worker A has landed the actor workspace path/store API, baseline
  `reviews/` and `provider-inputs/` dirs, active seed materialization, and
  active action skill reads.
- Worker B has landed recipe types, validation, proposal records, lifecycle
  transition guards, and default shutdown of legacy generated TypeScript
  execution unless explicitly opted in with
  `ALLOW_LEGACY_GENERATED_ACTION_SKILLS`.
- Worker C has landed provider input snapshot persistence and credential-key
  rejection, with live dialogue provider calls writing snapshots.
- Worker D has landed actor-scoped evidence writing for every phase-one
  turn/tool attempt plus failed verification and fake-progress rejection in the
  deterministic runtime loop.
- Worker E landed the per-actor reviewer output schema, actor-scoped review
  writer, immutable review job queue, deterministic per-actor runner, and
  `review:actors` CLI. Deterministic fake-progress/verification-failure
  reviews write draft candidate proposals; an opt-in `openai-codex` reviewer
  adapter can provide bounded findings and proposal hints.
- The lifecycle path has landed bounded recipe trial evidence recording plus
  explicit promotion/supersession/retirement writing. Reviewers and providers
  still cannot mutate active action skills directly.
- Candidate recipe trials can execute bounded primitive steps with per-step
  timeouts and then record `recipe_trial` evidence through the lifecycle path.
- The coordinator has landed the phase-one active action-skill gate: current
  `runProbe` reads active actor workspace records, passes them into
  `runAgentLoop`, includes active skill context in provider input, and blocks
  provider proposals whose primitives are not backed by actor-owned active
  records. The mutual live and deterministic dispatchers can also consume
  actor-owned active records; live mutual runs initialize/read actor workspaces
  before provider turns.
- The provider path now has a shared actor-provider-context builder and an
  opt-in `openai-codex` phase-one gameplay provider. Gameplay and live dialogue
  provider inputs include active skills, candidates, recent evidence, reviews,
  and memory.
- Legacy `build/generated-skills` files can be archived into actor workspace
  draft candidate proposals through `bun run archive:legacy-skills`.
- The social feedback slice has landed canonical actor profiles, goal stacks,
  directional relationship ledgers, reviewer relationship event proposals, a
  guarded runtime-owned proposal applier, and relationship-derived action
  pressure in provider context.
- The managed live-smoke server CLI now starts or reports a local Docker
  endpoint without provider auth and can be used by `runProbe` when `MC_PORT` is
  not set.

Future work after this slice is to broaden evidence coverage for new gameplay
paths as they are added, harden reviewer prompts/scoring with real run data, and
convert any still-needed skill-village generated-code behavior into bounded
recipes.

## Supporting Workstream: Autonomous Micro Objectives

Search token: `AUTONOMOUS_OBJECTIVE_EVALUATION`.

This is a supporting objective-level evidence track. It should reuse the
existing action-skill probe and runtime transcript surfaces instead of creating a
second Mineflayer runtime. It does not replace Soul/LifeGoal cycle authority.

Deliverables:

- objective registry with tiny, verification-friendly goals;
- objective report schema with `current_run` evidence scope;
- proposal, argument, and evidence oracle findings;
- CLI that can either run a fresh probe or audit a supplied transcript;
- first objective: `collect_current_run_oak_log_1`;
- follow-up objectives: `mine_current_run_cobblestone_1` and
  `inspect_then_deposit_oak_log_1`.

The objective evaluator must fail closed when success depends on memory,
provider explanation, terminal `remember`, or historical actor workspace
evidence. It may use historical transcripts only in an explicit audit mode, and
that mode must not be labeled fresh current-run proof.

## Supporting Workstream: Direct Generated Action Skills

Search token: `DIRECT_GENERATED_ACTION_SKILLS`.

Direct generated TypeScript is an accepted supporting propagation path for
objective work. The implementation should separate it from legacy
`build/generated-skills` dumping:

- generated code is tied to an objective and actor;
- execution uses a light guard and timeout;
- helper calls are logged;
- source, return value, error/timeout, and pre/post evidence are persisted;
- success is decided by objective verifier output, not by generated code text;
- background reviewers improve or recipe-ize the code after the run.

The first target objective is `craft_current_run_stone_axe_1`, because it forces
the runtime to combine gathering, crafting prerequisites, table-bound crafting,
and inventory verification without hand-registering every intermediate action
skill first.

Implemented status:

- `probe:objective -- --objective craft_current_run_stone_axe_1 --mode direct-generated`
  runs the direct generated path by default for the stone axe objective;
- generated source is stored under
  `data/actors/<actor_id>/action-skills/direct-trials/<run_id>/`;
- helper calls record `started`, `completed`, and `failed` events, including
  nested prerequisite work inside `ensureItem`;
- direct `craftItem(...)` calls for supported early-game items are routed
  through the same prerequisite-aware substrate, so the LLM does not need to
  exactly reproduce a hidden hand-authored crafting walkthrough before the
  runtime can make progress;
- `collectLogs` and `mineBlock` keep the Mineflayer dig call atomic, then bound
  pickup/pathfinder fallback work after the block break so a transient dropped
  item or unreachable pickup point cannot consume the whole generated-action
  timeout;
- timeout abort clears Mineflayer digging, pathfinder, and movement state so the
  process does not hang after a timed-out generated action;
- the objective report is always written as the actor-workspace canonical
  `report.json`, with optional CLI report copies as secondary refs;
- the deterministic live proof currently reaches `stone_axe` inventory delta
  `1` and marks the objective `passed`;
- dashboard state exposes recent direct trials at
  `actors[].action_skills.direct_trials`;
- direct trials enqueue per-actor reviewer jobs as immutable
  `action_skill_direct_trial` refs for later cleanup into bounded candidates.

## Supporting Workstream: Typed Minecraft Memory Substrate

Search token: `MINECRAFT_MEMORY_CURRENT_LLM_RESEARCH`.

This workstream supports bounded actor-owned direct trials, not a more scripted
planner and not unconstrained autonomy. The runtime gives the model a dense
Mineflayer helper surface when a direct-trial path is selected. The memory layer
then records what actually happened in a shape that can be retrieved, reviewed,
and promoted later.

Implemented status:

- actor workspaces now create typed memory folders:
  `working`, `episodic`, `semantic`, `procedural`, `social`, `beliefs`,
  `guardrails`, and `index`;
- `ActorMemoryRecord` persists schema, layer, status, confidence, evidence
  refs, tags, symbolic index fields, and open `content`;
- direct generated objective reports write `episodic` memory plus either a
  `procedural` candidate for verified success or a `guardrail` candidate for
  failed execution/verification;
- provider context includes a bounded `typed_memory` packet retrieved by
  objective id/category, target item, active action-skill ids, layer, and
  status;
- stale, superseded, and rejected memory is hidden from default retrieval;
- dashboard memory panels recursively read typed memory subdirectories.

Next implementation after this slice:

- extend per-actor reviewer outputs with semantic, procedural, social,
  guardrail, and belief memory candidates;
- add guarded appliers for reviewer memory candidates;
- add no-memory versus memory-assisted objective runs to measure repeated
  failure reduction rather than memory recall quality.

## Coordinator

The coordinator owns shared integration points:

- `probe/src/runProbe.ts`;
- `probe/src/runtime/agentLoop.ts`;
- `probe/src/runtime/transcript.ts`;
- final docs/index cleanup.

Coordinator duties:

- lock narrow interfaces before workers touch shared code;
- keep hot path synchronous only for gameplay work;
- prevent reviewer or provider snapshot work from blocking actor turns;
- integrate workers in the merge order below;
- run final validation.

## Worker A: Actor Workspace Source Of Truth

Exclusive ownership:

- `probe/src/runtime/actorWorkspace.ts`;
- new `probe/src/runtime/actorWorkspacePaths.ts`;
- new `probe/src/runtime/actorWorkspaceStore.ts`;
- `probe/test/actorWorkspace.test.ts`.

Deliverables:

- add `reviews/` and `provider-inputs/` baseline dirs;
- preserve non-destructive initialization;
- materialize active seed action skills;
- make active action skills readable from actor workspace;
- expose a narrow path/store API for candidates, retired records, rejected
  records, evidence, reviews, and provider inputs;
- no recipe validation;
- no reviewer logic;
- no provider logic.

## Worker B: Action Skill Recipe Lifecycle

Exclusive ownership:

- `probe/src/skills/ownership.ts`;
- new `probe/src/skills/recipes/*`;
- new `probe/src/skills/proposals/*`;
- new `probe/src/skills/lifecycle/*`;
- recipe and ownership tests.

Shared touch through coordinator:

- legacy generated action skill entry points that currently write to
  `build/generated-skills`.

Deliverables:

- `ActionSkillRecipe` schema;
- validator rejecting unknown primitives, planned primitives, missing verifiers,
  missing timeouts, role-incompatible primitives, and success-by-text;
- adapter from current seed ownership records into actor workspace action skill
  records;
- proposal records;
- lifecycle statuses: `draft`, `candidate`, `active`, `superseded`, `retired`,
  `rejected`;
- candidate action skill proposals written to actor workspace, not
  `build/generated-skills`;
- no reviewer-driven direct active mutation.

## Worker C: Provider Input Snapshots

Exclusive ownership:

- new `probe/src/provider/inputSnapshot.ts`;
- new `probe/src/provider/providerInputStore.ts`;
- provider snapshot tests.

Shared touch only through coordinator:

- provider call sites in `agentLoop.ts` or live dialogue runners.

Deliverables:

- persist exact provider input packet per actor turn for provider-backed runs;
- store under `data/actors/<actor_id>/provider-inputs/`;
- never store raw auth tokens;
- deterministic mode remains zero-network and does not claim live provider
  traces.

## Worker D: Hot-Path Evidence

Exclusive ownership:

- new `probe/src/runtime/evidence/*`;
- `probe/src/gameplay/verification/verifyTask.ts`;
- `probe/src/tools/collectLogs.ts`;
- `probe/src/tools/moveTo.ts`;
- evidence and verification tests.

Deliverables:

- actor-scoped evidence files for attempts, pre/post observation, verifier
  decision, timeout, stall, and failure reason;
- strong evidence for the known failure class: "pretends to chop, walks away,
  repeats";
- fake-progress rejection for started-swinging, pathing-started, optimistic
  provider text, or generated return objects without runtime evidence;
- no reviewer calls from hot path;
- immutable evidence refs that Worker E can consume later.

## Worker E: Per-Actor Async Reviewers

Exclusive ownership:

- new `probe/src/reviewer/*`;
- new `probe/src/skills/review/*`;
- reviewer tests.

Read-only dependencies:

- actor workspace path API from Worker A;
- lifecycle types from Worker B;
- provider snapshot refs from Worker C;
- evidence refs from Worker D;
- transcript/canonical transcript refs.

Deliverables:

- actor-scoped review job input schema;
- evidence queue over immutable artifact references;
- reviewer output schema;
- guardrails preventing active action skill mutation;
- optional deterministic reviewer stub;
- no network calls in deterministic tests.

## Optional Worker F: Cross-Actor Summarizer

Do this only after Worker E exists.

Exclusive ownership:

- new `probe/src/reviewer/crossActorSummarizer.ts`;
- summarizer tests.

Deliverables:

- read per-actor review outputs;
- identify shared failure patterns;
- recommend shared seed fixes without mutating actor workspaces;
- no direct active action skill changes.

## Merge Order

1. Worker A first: path and source-of-truth API.
2. Worker B next: recipe/lifecycle types use workspace paths.
3. Worker C and Worker D can merge in parallel after A stabilizes.
4. Worker E last: it consumes A/B/C/D artifacts and must stay sidecar-only.
5. Optional Worker F after E.
6. Coordinator final pass: minimal `runProbe.ts` and `agentLoop.ts` wiring.

## Dependency Graph

```text
Worker A -> Worker B
Worker A -> Worker C
Worker A -> Worker D
Worker A -> Worker E
Worker B -> Worker E
Worker C -> Worker E
Worker D -> Worker E
Worker E -> Worker F
Coordinator -> final integration
```

## Deferred Work

Do not implement these in this slice unless the user re-approves:

- full arbitrary checkpoint resume;
- long-term memory compaction workers;
- global critic ownership;
- broad multi-actor society mechanics;
- deep reconnect refactor unless required by hot-path evidence work.

Loose legacy `build/generated-skills` execution is still deferred. Direct
generated action skills must be actor-owned objective artifacts, not anonymous
files read from a legacy output directory.

## Validation Gate

Run at minimum:

- `bun run typecheck`;
- targeted actor workspace tests;
- recipe validation tests;
- provider snapshot tests;
- reviewer guardrail tests;
- hot-path evidence tests;
- deterministic no-network test path.

The broad test suite may still contain legacy failures. If so, report them
separately and do not confuse them with the new slice's targeted validation.
