# No-Regret Core Implementation Campaign

Status: active implementation campaign contract.

Search token: `NO_REGRET_CORE_IMPLEMENTATION_CAMPAIGN`. Related:
`SHAREABLE_RESEARCH_REPORT`.

Recorded: 2026-06-29 (`Asia/Seoul`).

Authority: subordinate to `SPEC.md`, `AGENTS.md`, and
`Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`. This file turns the
current research spine into an implementation plan. It does not select a
research headline.

## 0. Purpose

This campaign exists to make the active central plan executable without letting
the project drift back into vague research slogans or premature model work.

The current verdict is still:

```text
core-first
```

The implementation target is the no-regret core:

```text
2-3 Minecraft actors
non-degenerate behavior
independent transition-row/v1 observation records
bounded other-actor response windows
free-tier cost discipline
```

The campaign ends only when the runtime can produce a no-regret pilot batch that
is truthful enough to enter the relevant branch preflight. It does not end when
the repo merely has a nice schema, a passing unit test, a vivid transcript, or a
working verifier.

## 1. Required Reading

Read these before editing code for this campaign:

- `SPEC.md`
- `AGENTS.md`
- `project-docs/research/current-spine/research-documentation-hierarchy.md`
- `project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md`
- `project-docs/research/current-spine/research-value-harness.md`
- `project-docs/research/current-spine/prior-work-proximity-current-spine-2026-06-29.md`
- `project-docs/research/current-spine/no-regret-core-research-protocol.md`
- `project-docs/research/current-spine/research-decision-current-spine-2026-06-29.md`
- `project-docs/research/current-spine/transition-row-v1-contract.md`
- `project-docs/research/current-spine/seed-reset-record-v1-contract.md`
- `project-docs/research/current-spine/transition-row-label-codebook.md`
- `project-docs/research/current-spine/no-regret-core-scenario-catalog.md`
- `project-docs/research/current-spine/goldilocks-preflight-protocol.md`
- `project-docs/research/current-spine/society-observable-preflight.md`
- `project-docs/orientation/documentation-map.md`
- `project-docs/orientation/agent-search-index.md`

For dated implementation status, read
`project-docs/research/current-spine/no-regret-core-current-status-2026-06-29.md`. That
status note is intentionally lower authority than this campaign and may become
stale.

Use `project-docs/references/` and `project-docs/archive/` for why older plans
changed. Do not treat reference or archive reports as active implementation
instructions unless a Tier 1 document explicitly promotes a section.

## 2. Campaign Shape

This is an implementation campaign, not a research-decision document.

Each workstream must state:

- the runtime behavior it changes;
- files it is allowed to touch;
- files it should avoid;
- the artifact that proves it worked;
- the minimal focused test, live-run evidence, or artifact evidence required;
- how it preserves negative results;
- what a parallel subagent can inspect or implement without overlapping edits.

Borrowed workflow mechanisms from `~/git/harness`:

- from Ouroboros: specification first, explicit acceptance criteria, evaluation
  gates, and a loop that feeds failed evaluation back into the next spec;
- from Ralph-style loops: persistent status, exit gates, rate/cost limits,
  circuit breakers, and refusal to stop on vague progress language;
- from OMC/OMX: planning, critique, execution, and verification as separate
  stages, with parallel workers used only when ownership is disjoint;
- from career-ops: a data contract separating system-owned infrastructure from
  user/project-owned results, plus batch work that keeps every output traceable.

Do not borrow promotional language, automatic "verified" claims, or a broad
agent-orchestration surface as research value. The useful transfer is operating
discipline.

## 3. Non-Goals

Do not implement these in this campaign before the Goldilocks gate:

- advisory consequence predictor loop;
- `predicted_delta` inside no-regret rows;
- `social-material-transition/v1` as the active no-regret row name;
- MaterialClaimLedger, ObligationLedger, or PublicAffordanceLedger as active
  runtime ledgers;
- foundation-model training;
- Project Sid-style civilization scale-up;
- laws, taxes, religions, institutions, or many-actor society labels;
- a paper headline;
- a verifier paper;
- a race-to-diamond benchmark path.

Do not remove the existing Actor Turn `expected_outcome` contract. It remains a
runtime execution-quality contract. The non-negotiable rule is narrower and more
important:

```text
expected_outcome must never become the ground-truth target for transition-row/v1.
```

## 4. Working Assumptions

Current assumptions:

- the active runtime lives under `probe/src`;
- Actor Turn remains the action-selection path;
- runtime validation, permissions, retry constraints, timeouts, and verifier
  output remain authoritative;
- no provider text fills missing executable parameters;
- no model output closes obligations, declares success, or mutates actor truth
  without runtime evidence;
- transition rows are observation artifacts written after execution;
- predictor artifacts are separate and join by `row_id` only after rows close;
- deterministic and provider-free tests may prove schema/linkage, but they do
  not prove no-regret-core readiness;
- live provider batches need provider smoke checks and budget guard review first.

Dated implementation status, including pre-run declaration, passive-observation,
response-window, and batch-audit landing notes, lives in
`No-Regret-Core-Current-Status-2026-06-29.md`. Keep this campaign stable; update
status/audit docs for volatile implementation state.

Before a non-trivial code edit, write or update the local task note with:

```text
Assumption:
Change boundary:
Files touched:
Files intentionally not touched:
Evidence expected:
Verification command:
Stop/defer condition:
Parallel subagent lane:
```

## 5. Workstream A - Degeneracy Diagnosis

Goal: reproduce and root-cause the 60-cycle degeneracy before interpreting any
long run as social behavior.

Questions to answer:

- Did context compaction drop active blockers or progress?
- Did observe/wait/remember repeat without state change?
- Did retry constraints fail to block identical target/args?
- Did CycleGoal or Actor Turn collapse to one action family?
- Did PlanBeads preserve state but fail to make it action-relevant?
- Did social-response pressure never enter the action context?
- Did provider budget or model fallback produce low-action behavior?

Implementation tasks:

1. Add a degeneracy audit over existing social-cycle reports.
2. Count action family distribution by `(actor_id, action_kind, target_signature)`.
3. Count repeated exact blockers and retry-constraint activation.
4. Count rows with missing, unknown, or unclassifiable observed evidence.
5. Emit a short audit artifact that says `core-first`, `core-inconclusive`, or
   `substrate-ready-for-row-batch`, not a research headline.

Acceptance evidence:

- a deterministic fixture test or archived artifact slice for the audit
  classifier;
- one archived audit over an existing stale/degenerate report;
- no claim that repetition is social behavior.

Parallel subagent lanes:

- explorer lane: inspect old 60-cycle reports and summarize concrete repeated
  action families;
- worker lane: implement report-audit counters;
- reviewer lane: check that the audit cannot promote a research headline.

## 6. Workstream B - `transition-row/v1` Runtime Artifacts

Goal: write independent observation rows from executed actions.

The row object is:

```text
state_before + executed_action + observed_delta + evidence_refs
```

Rules:

- no `predicted_delta`;
- no actor `expected_outcome` in the row body;
- row labels come from runtime observations, tool statuses, verifier output,
  helper events, scans, chat records, relationship events, or explicitly closed
  response windows;
- provider rationale and CycleJudgment prose are evidence refs at most, not
  labels;
- a deterministic no-world row may be `partial`; it must not be counted toward
  no-regret acceptance as if it came from live Minecraft.

Implementation tasks:

1. Add a `transition-row/v1` TypeScript contract.
2. Add an actor-workspace path for transition rows.
3. Write one row per Actor Turn action attempt after execution and runtime
   classification.
4. Add `transition_row_ref` to each report action attempt.
5. Record row quality as `valid`, `partial`, or `excluded`.
6. Keep labels small: physical, material, social-response classes from
   `Transition-Row-V1-Contract.md`.
7. Keep response-window status explicit even when the first implementation only
   records `no_observable_response`.

Acceptance evidence:

- deterministic social-cycle check or managed-run artifact shows every action
  attempt has a `transition_row_ref`;
- row file exists under the actor workspace;
- row has `schema_version: transition-row/v1`;
- row includes `state_before`, `executed_action`, `observed_delta`,
  `evidence_refs` through nested fields;
- row JSON does not contain `predicted_delta`;
- row JSON does not contain `expected_outcome`;
- typecheck passes.

Parallel subagent lanes:

- worker lane 1: row writer and type contract;
- worker lane 2: report linkage and tests;
- explorer lane: review row artifacts against the planning contract.

## 7. Workstream C - Bounded Other-Actor Response Windows

Goal: close an observable response window after a candidate action so social
labels are not inferred from vibes or later hindsight.

Dated response-window landing status lives in
`No-Regret-Core-Current-Status-2026-06-29.md`. The stable requirement remains:
social-response labels need bounded windows and evidence refs, not transcript
vibes or later hindsight.

Minimum response-window object:

```yaml
response_window:
  horizon_cycles:
  horizon_seconds:
  opened_at:
  closed_at:
  observed_actor_ids:
  evidence_refs:
```

Implementation tasks:

1. Define when a window opens: after action start for rows tagged
   `interaction_opportunity`.
2. Define when it closes: after a bounded cycle count or seconds horizon.
3. Record visible actors, chat events, movement/approach/retreat, item/container
   actions, and relevant relationship-event applications inside the window.
4. Distinguish `no_observable_response` from missing data.
5. Carry loaded-world caveats.

Acceptance evidence:

- rows with window metadata can close as `no_observable_response`;
- rows with another actor reply or movement classify a social-response class;
- no hidden trust/emotion/norm label is emitted without an evidence-gated event.

Parallel subagent lanes:

- explorer lane: locate best runtime hook for post-action other-actor scans;
- worker lane: response-window artifact and test;
- reviewer lane: confound review for pathing noise and loaded-world limits.

## 8. Workstream D - Scenario Pressure

Goal: produce non-degenerate rows with material stake and interaction
opportunity without scripting labels.

Use at least three scenario-pressure families from:

- `borrow_refuse_return_tool_v1`
- `shared_station_public_affordance_v1`
- `scarce_food_or_material_allocation_v1`
- `blocked_access_repair_v1`
- `co_presence_divergence_v1`

Implementation tasks:

1. Select the smallest setup that gives actors real options.
2. Keep setup artifacts separate from actor progress.
3. Make every scenario able to fail without being called a bad run.
4. Tag rows with `physical_control`, `material_stake`,
   `interaction_opportunity`, `dialogue_only`, `generated_action_confounded`,
   `no_response_observed`, or `loaded_world_limited`.

Acceptance evidence:

- first no-regret pilot attempts at least three families, or writes a narrowing
  reason before inspecting outcomes;
- no single family becomes the whole social economy;
- labels are not determined by fixture text.

Parallel subagent lanes:

- explorer lane: map existing world-scenario support to catalog families;
- worker lane: add one bounded scenario setup;
- reviewer lane: check for scenario-forcing and hidden planner fields.

## 9. Workstream E - No-Regret Pilot Batch

Goal: collect a usable pilot batch that proves the substrate is not obviously
degenerate.

Dated batch-audit landing status lives in
`No-Regret-Core-Current-Status-2026-06-29.md`. The stable campaign target is a
closed pilot batch whose artifacts make no-regret acceptance or failure
auditable.

Minimum acceptance:

- at least 2 fresh seeds or reset sessions;
- 2-3 actors present for the measured window;
- at least 40 non-excluded rows from executed runtime actions;
- at least 4 action classes represented;
- no single `(actor_id, action_kind, target_signature)` above 30% of rows;
- at least 60% of non-excluded rows with classifiable physical, material, or
  social-response evidence, including scoped absence labels when the relevant
  window is defined and closed;
- at least 20 rows with bounded other-actor response windows;
- at least 15 rows tagged `interaction_opportunity`;
- at least 10 rows tagged `material_stake`;
- at least three scenario-pressure families attempted, or a written reason why
  the run deliberately narrowed the family set.

If these fail, write `core inconclusive`. Do not move to Goldilocks by renaming
the result.

Implementation tasks:

1. Add batch summary/audit over transition rows.
2. Add per-seed and per-family coverage tables.
3. Add or link `seed-reset-record/v1` artifacts so seed/reset coverage is
   auditable and deterministic/offline controls cannot count as live coverage.
4. Add degeneracy counters.
5. Add negative-result notes for no response, prior-easy layers, pathing noise,
   generated-action confounds, or cost blockers.

Acceptance evidence:

- batch audit artifact;
- provider usage summary;
- seed/reset records;
- rows and evidence refs resolvable from the report.

Parallel subagent lanes:

- worker lane: batch audit metrics;
- explorer lane: provider/cost and setup readiness;
- reviewer lane: no-regret acceptance checklist.

## 10. Workstream F - Branch Preflight Preparation

Goal: prepare branch gates without running them before the row batch exists.

Do not start this workstream until Workstream E has a closed batch. Use the
Goldilocks prediction preflight for F-native/F-loop and the society-observable
preflight for F-society.

Preflight input threshold:

- at least 80 rows;
- at least 3 fresh seeds or reset sessions;
- at least 30 rows with bounded other-actor response windows;
- at least 20 rows tagged `interaction_opportunity`;
- at least 15 rows tagged `material_stake`;
- labels assigned from runtime observations, not actor self-report;
- predictor inputs cut off before `action_started_at`.

Predictor arms:

- `majority_or_no_response`;
- `scripted_heuristic`;
- `llm_prior`;
- `current_observation`;
- `history_grounded`.

Decision artifacts:

- `proposal-soundness-review/v1`;
- `experiment-sketch/v1`;
- `negative-result-ledger/v1` when weakened;
- `research-decision/v1` with `what_not_to_do_next`.

Acceptance evidence:

- prediction records are separate from `transition-row/v1`;
- no post-action observation leaks into predictor context;
- task success and prediction quality remain separate.

## 11. Verification Commands

## 11. Workstream G - Shareable HTML Research Report

Goal: after the no-regret core has empirical artifacts, produce a static HTML
report that an external reader can understand without knowing the repo's older
WAM-era terms.

Do not use this report to declare a research headline. The report should explain
the current branch-gated state:

- what the no-regret core was trying to prove or disprove;
- which artifacts exist: `transition-row/v1`, `seed-reset-record/v1`, response
  windows, batch audit, provider/cost notes, and managed/live run evidence;
- whether the result is `core inconclusive`, `preflight-ready`, or a preserved
  negative result;
- what must happen before Goldilocks prediction preflight or
  society-observable preflight can start;
- which branches remain deferred.

Design requirements:

- use the `frontend-design` agent skill before report implementation;
- treat the surface as a static HTML report, not a marketing landing page;
- lead with one plain-language research question, then evidence, then decision;
- use diagrams, tables, labels, and artifact-link panels as the visual
  substance;
- avoid generic gradient/orb/card-heavy presentation;
- verify desktop and mobile rendering before calling the report shareable.

Korean copy requirements:

- use the `humanize-korean` agent skill for final Korean prose polish when the
  report is Korean or bilingual;
- preserve exact schema names, file paths, dates, counts, model names, and
  verdict labels;
- avoid AI-slop phrasing such as broad slogans, repeated "structured" /
  "validated" claims, and inflated novelty language.

Acceptance evidence:

- static HTML file under `project-docs/exports/static/architecture/` or the
  docs site, with source artifact links;
- desktop and mobile screenshot or browser verification notes;
- clear verdict section saying what the evidence permits and forbids;
- explicit statement that no headline has been selected unless a later
  `research-decision/v1` actually selects one.

## 12. Verification Commands

Run focused checks after small changes. Keep tests minimal; when behavior matters,
prefer the smallest useful managed/live run or artifact audit that proves the
runtime behavior.

```bash
cd probe && bun test test/socialCycleRunner.test.ts
cd probe && bun test test/socialCycleExecution.test.ts
cd probe && bun run typecheck
git diff --check
```

Run docs checks after routing changes:

```bash
cd docs && npm run build
```

Run provider or live-server checks only after provider preflight and platform
checks. A quota block or server startup failure is an environment blocker, not
actor behavior.

## 13. Subagent Operating Protocol

Use parallel subagents whenever work can be split cleanly.

Good subagent tasks:

- read-only codebase exploration of one subsystem;
- implementation in a disjoint file set;
- independent test or artifact review;
- literature/prior-work update with exact citations;
- negative-result/confound review.

Bad subagent tasks:

- several workers editing the same file without ownership boundaries;
- asking a worker to choose the research headline;
- asking a worker to validate its own idea as sound;
- using subagent consensus as evidence that a research claim is true.

Every spawned subagent prompt should include:

```text
Objective:
Authority docs:
Allowed write set:
Forbidden write set:
Evidence to return:
What not to decide:
```

Coordinator duties:

- inspect the returned file list;
- run the relevant tests;
- resolve conflicts explicitly;
- preserve negative or skeptical findings;
- write the final status in project docs or experiment/audit docs, not in
  `SPEC.md` unless direction changed with user approval.

## 14. Completion Gates

### Gate 1 - Implementation Plan Exists

Complete when:

- this campaign is routed from `project-docs/orientation/documentation-map.md` and
  `project-docs/orientation/agent-search-index.md`;
- the plan names workstreams, acceptance evidence, and subagent lanes;
- the plan does not claim a research headline.

### Gate 2 - Row Artifacts Exist

Complete when:

- social-cycle action attempts write `transition-row/v1` artifacts;
- attempts link `transition_row_ref`;
- rows carry a stable `seed_or_reset_id` linked to `seed-reset-record/v1`
  provenance;
- deterministic tests prove linkage and schema boundary;
- row bodies contain neither `predicted_delta` nor `expected_outcome`.

### Gate 3 - Response Windows Exist

Complete when:

- candidate rows can open and close bounded response windows;
- `no_observable_response` is a valid closed label;
- other-actor actions inside the window can be cited.

### Gate 4 - Pilot Batch Is Auditable

Complete when:

- no-regret acceptance thresholds can be computed from artifacts;
- the first pilot either passes thresholds or writes `core inconclusive`;
- negative results are preserved.

### Gate 5 - Goldilocks Preflight Is Ready

Complete when:

- closed row batch meets input thresholds;
- predictor arms are separate artifacts;
- cutoff and confound checks are implemented before outputs are inspected.

### Gate 6 - External Report Is Shareable

Complete when:

- the empirical state from Gates 2-5 is summarized in a static HTML report;
- the report links to the actual artifacts instead of replacing them with prose;
- Korean prose, if present, is humanized without changing exact schema names,
  counts, dates, verdicts, or file paths;
- desktop and mobile visual checks pass;
- the report states the current branch decision and what not to build next.

## 15. What Not To Do Next

- Do not treat the first row writer as no-regret-core completion.
- Do not count deterministic no-world rows toward live pilot thresholds.
- Do not promote WAM/F-native/F-loop/F-society before the gate.
- Do not add `predicted_delta` to `transition-row/v1`.
- Do not use `expected_outcome` as the target.
- Do not present schema cleanliness, screenshots, or verifier status as the
  research contribution.
- Do not scale actors or society labels to hide a noisy target.
- Do not publish a report that reads like a final paper claim before the branch
  decision actually selects a headline.
