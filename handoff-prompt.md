# Successor Agent Prompt: Complete the V4 Minecraft Social Sandbox

## Working Instructions

You are the sole implementation successor for the V4
Minecraft social sandbox in this repository. You have no useful conversation
context beyond this file. Follow the instructions literally, inspect the named
files before editing, and do not replace implementation with another plan.

The user wants the complete implementation carried forward, not only
the next small step. Continue through the provider-free work and every later
step that can be truthfully verified. Do not stop after A1, A2, a schema draft,
or green unit tests while safe in-scope work remains.

Work on branch `codex/capability-gated-social-sandbox-v4`. Never commit this V4
work directly to `main`. Do not rewrite or force-push the already published
history. Preserve all unexpected worktree changes; do not reset, discard,
checkout-over, or automatically stash them.

Use repo TypeScript with Bun only:

```text
bun run <entrypoint.ts>
bun test
bun run typecheck
```

Never run repo `.ts` files with Node, `ts-node`, `tsx`, `npx tsx`, or a child
process based on `process.execPath`.

Before every non-trivial edit, state in your work log:

1. assumptions;
2. the files and behavior being changed;
3. observable success criteria.

Maintain a concise project-root `implementation-notes.md` during this long
implementation. When code reality differs from this plan, record:

```text
what the plan said
-> what the code or runtime revealed
-> the conservative choice taken
-> when to revisit it
```

Proceed without asking about routine, reversible implementation. Pause only at
the explicit approval points below. If a live run is blocked, finish any
independent provider-free work, preserve the exact blocker, and do not mark the
live step complete.

## Primary Objective

Complete the V4 implementation path from a truthful individual-capability
benchmark through goal continuity, an interdependent multi-actor Minecraft
sandbox, synchronized long-run observation, and an evidence-linked phenomenon
catalog:

```text
repaired individual capability evaluation
-> normalized capability reports
-> capability runner and basic/multi-hop suites
-> current capability evidence
-> goal-continuity evaluator and runs
-> economic/cooperative/quest scenarios with capability prerequisites
-> long-run structured evidence, metrics, and video refs
-> phenomenon catalog
```

The work exists so that social behavior is observed only after individual
Minecraft competence and long-horizon work continuity are separately visible.
The user wants capable actors pursuing their own goals in a materially
interdependent Minecraft world, with social movements that can be inspected in
metrics and recordings over long periods. The user does not care about a
30-second demo and explicitly retired the narrow V3 lived-vs-told prediction
program as the project center.

### Definition of Done

Do not call the overall implementation complete until all of the following are true:

- A1 is repaired and re-accepted only after the evidence-rule regressions in this
  handoff are covered by tests.
- A2 and A3 create one provider-free command path that writes a declaration,
  raw runtime report, normalized capability report, and suite index.
- A4 and B1 provide versioned basic and multi-hop capability cases without
  exposing hidden action plans to actors.
- At least one current declared capability batch exists. If it uses a live
  provider, its exact preflight and usage artifacts exist beside the reports.
- B2 and B3 separately report physical goal progress and goal-continuity
  behavior, including interruption/restart or durable reload evidence.
- C1 declares social scenarios with capability dependencies and no prescribed
  social response.
- C2 provides economic/resource, cooperative, and multi-activity quest scenario
  families with repeated material interaction opportunities.
- C3 writes joinable run/cycle/actor structured artifacts, metrics, provider
  usage, environment details, and synchronized visual/video segment refs.
- D1 writes and indexes candidate/retired phenomenon records with recurrence
  denominators, alternative explanations, capability/continuity refs, and
  evidence/video refs.
- Every completed live-behavior step has a fresh current-run artifact. Types,
  fixtures, unit tests, old transcripts, and prose are not substitutes.
- Focused tests, `cd probe && bun test`, `cd probe && bun run typecheck`, the
  docs build when docs change, and `git diff --check` pass after every completed
  implementation step.
- Work is split into scoped commits with detailed `Why:`, `What changed:`, and
  `Validation:` bodies. Unrelated dirty files are never swept into a commit.

`D2 — Controlled Follow-Up Package` is not part of automatic completion. It may
begin only after the user selects a phenomenon from D1. Do not revive V3 or
choose a research headline yourself.

## Scope and Sources of Truth

### In Scope

- Repair the committed A1 manifest, evidence bag, predicate, validation,
  fixture, tests, and documentation.
- Implement A2 through D1 in the dependency order specified below.
- Add or replace repo-local TypeScript, JSON manifests, fixtures, tests, CLIs,
  runtime adapters, reports, scenario declarations, metrics, and internal docs
  required by the active V4 plan.
- Replace wrong-shaped A1 code rather than adding compatibility layers. AI
  implementation labor is treated as near-zero cost; sunk code is not a reason
  to preserve a bad design.
- Use existing Actor Turn, Mineflayer execution, world scenario, actor
  workspace, PlanBead, visual evidence, transition-row, response-window, and
  provider-usage mechanisms where V4 re-derives a need for them.
- Run provider-free deterministic tests and smokes without repeated user
  approval.
- Commit each coherent completed step or repair.

### Out of Scope

- Restoring V3 lived-vs-told, Session A/B, history delivery ladders, observer
  prediction, or L1-L8 as active requirements.
- Choosing trust, culture, society, economy, friendship, specialization, or any
  other social conclusion in advance.
- Hidden planners, recipe solvers, recommended action orders, coordinate
  suggestions, parameter candidates, or partner/deal choices in manifests.
- Using provider prose, task text, memory, PlanBeads, tool names, screenshots,
  or video as Minecraft truth.
- A gold trajectory dataset, imported MineDojo/MineStudio/MineRL runtime,
  fine-tuning, VLA replacement, or society-scale feature expansion.
- Publishing a research claim, opening a PR, changing `main`, force-pushing, or
  externally sharing artifacts without separate instruction.
- D2 until the user explicitly selects a D1 phenomenon.

### Require Confirmation

Stop and ask for confirmation before:

- any live provider-backed call, unless the user has already approved the exact
  `(provider_id, model)`, whole-run request/token estimate, and preflight result;
- changing provider/model or materially increasing a live-run budget;
- an OpenAI API run without dashboard/free-tier confirmation and explicit
  operator approval recorded by the quota preflight;
- destructive world reset, actor-workspace cleanup, deleting user artifacts, or
  overwriting unrelated worktree changes;
- changing `SPEC.md`, `AGENTS.md`, or `project-docs/specification/*` beyond the
  already approved V4 direction;
- selecting or publishing a candidate phenomenon as a research claim;
- pushing, opening a PR, or publishing reports unless the user separately asks.

Starting or stopping an isolated, disposable test Minecraft server through the
existing non-destructive repo path is routine implementation. Deleting or
resetting a user world or actor workspace is not.

## Source Priority and Required Reading

When sources conflict, use this order:

1. current user instruction;
2. current filesystem, Git state, fresh test/runtime artifacts;
3. `SPEC.md`;
4. `AGENTS.md`;
5. the active V4 central plan;
6. the active V4 implementation plan;
7. current runtime schemas/tests;
8. this handoff and older notes.

Read these files completely before implementation:

```text
SPEC.md
AGENTS.md
CONTRIBUTING.md
CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md
project-docs/orientation/documentation-map.md
project-docs/orientation/agent-search-index.md
project-docs/orientation/terminology.md
project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md
project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md
project-docs/research/benchmarks/individual-capability-manifest-a1.md
```

Use the search index to load additional runtime docs for each step. Do not
bulk-edit specifications. Historical V3 files are audit trail only.

Mandatory repo agent-skill routing later in the work:

- before any live provider call: read and use
  `.agents/skills/provider-quota-preflight/SKILL.md`;
- after a real Minecraft run or behavior failure: read and use
  `.agents/skills/minecraft-agent-runtime-review/SKILL.md`;
- before writing any run/model/visual report: read and use
  `.agents/skills/minecraft-run-report-author/SKILL.md`;
- before promoting a phenomenon or designing D2: read and use
  `.agents/skills/minecraft-research-value-harness/SKILL.md`.

## Current Verified Repository State

- Repository: `/Users/gigio/git/minecraft-llm-agent-community`
- Branch: `codex/capability-gated-social-sandbox-v4`
- Last implementation commit before this handoff:
  `26c1f93f` (`probe: add individual-capability-manifest loader and predicates`)
- Remote branch `origin/codex/capability-gated-social-sandbox-v4` contains
  `26c1f93f` at handoff preparation time.
- `26c1f93f` already added the A1 modules, suite, fixtures, and tests and marked
  A1 accepted. Do not amend or rewrite that pushed commit. Repair it in a new
  scoped commit.
- Fresh verification performed during review:
  - focused A1 tests: 19 passed, 0 failed;
  - full probe suite: 597 passed, 0 failed;
  - `cd probe && bun run typecheck`: passed;
  - `cd docs && npm run build`: passed;
  - `git diff --check`: passed.
- Those green checks do **not** prove the A1 evidence rules. Concrete
  counterexamples below pass despite violating the plan.
- No live provider call was used for A1 or this review.

At handoff preparation time, these pre-existing documentation changes were
dirty and must be preserved:

```text
M  project-docs/orientation/agent-search-index.md
M  project-docs/orientation/documentation-map.md
M  project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md
?? project-docs/research/benchmarks/individual-capability-manifest-a1.md
```

They explain and index A1, but they were not part of `26c1f93f`. The untracked
A1 document incorrectly says it was included in that commit. Do not commit these
files unchanged. Reconcile them with the A1 repair, change the completion
language truthfully, then commit only when A1 is actually accepted.

Trust fresh `git status -sb`, `git diff`, `git log`, and file contents over this
snapshot. Never erase the dirty documentation to get a clean worktree.

## What Is Already Implemented

The following A1 files exist and should be repaired, not blindly recreated:

| Path | Current role | Known limitation |
| --- | --- | --- |
| `probe/src/benchmarks/capability/types.ts` | Manifest and predicate types | lets generic `evidence_kind_seen` decide success |
| `probe/src/benchmarks/capability/loader.ts` | JSON validation and load | not recursively strict; accepts semantic contradictions |
| `probe/src/benchmarks/capability/minecraftIds.ts` | Minecraft 1.21.11 id validation | acceptable base; suite still omits `pale_oak_log` |
| `probe/src/benchmarks/capability/evidenceBag.ts` | Offline evaluator input | observed values do not require source refs |
| `probe/src/benchmarks/capability/predicates.ts` | three-valued evaluator | prose target bypass and synthetic refs exist |
| `probe/src/benchmarks/capability/index.ts` | public exports | update coherently with repairs |
| `probe/benchmarks/capability/individual-capability-v1.json` | three minimal cases | the source of `place_table` position data is underspecified |
| `probe/benchmarks/capability/fixtures/` | negative fixtures | lacks direct regression fixtures for all evidence-rule failures |
| `probe/test/individualCapabilityManifest.test.ts` | loader validation tests | tests only named forbidden root fields |
| `probe/test/capabilityPredicates.test.ts` | predicate tests | current prose test covers only `item_count_gte` |

The active implementation plan already defines A1 through D2. Do not invent a
second competing plan. Update its completion checklists only from fresh
evidence.

## Mandatory A1 Review Findings to Fix First

Treat A1 as reopened. Add failing regression tests before changing behavior.
Do not begin A2 while any item below remains unresolved.

### Finding 1 — Arbitrary facts can decide target success (`P1`)

Current `evidence_kind_seen` accepts any `fact.kind` and arbitrary primitive
constraints. This reviewed input returns `passed`:

```json
{
  "predicate": {
    "op": "evidence_kind_seen",
    "evidence_kind": "provider_rationale",
    "constraints": { "tool": "collect_logs" }
  },
  "facts": [
    {
      "evidence_ref": "provider/output.json",
      "kind": "provider_rationale",
      "tool": "collect_logs",
      "text": "success"
    }
  ]
}
```

Required repair:

1. Recommended: remove `evidence_kind_seen` from
   `CapabilityPredicateV1`, `predicateOps`, loader validation, evaluator, and
   A1 tests. No checked-in A1 case needs it.
2. Do not replace it with another arbitrary string-key matcher.
3. If a later step truly needs event predicates, introduce a separate closed
   discriminated union of runtime-owned evidence schemas with explicit fields
   and source refs. Provider rationale, task text, memory text, PlanBead prose,
   chat wording, and tool-name presence must never decide success.
4. Add a regression proving every prose/tool/memory-shaped attempt is rejected
   by the loader or evaluates `unknown`, never `passed`.

### Finding 2 — Predicates fabricate evidence refs (`P1`)

`item_count_gte`, `held_item_is`, and `position_within` can pass without a real
source artifact and return strings such as:

```text
settlement:inventory_counts
settlement:held_item
settlement:actor_position
```

These strings are not guaranteed to resolve to any file or saved runtime
record. A pass over `{ inventory_counts: { oak_log: 1 } }` currently returns:

```json
{
  "status": "passed",
  "evidence_refs": ["settlement:inventory_counts"]
}
```

Required repair:

1. Redesign `CapabilityEvidenceBagV1` so every observed value used for scoring carries
   one or more explicit source artifact refs. A separate ref map for each value category or
   evidence-bearing observed-value objects are both acceptable; choose the smaller
   coherent design.
2. A predicate may return `passed` only when the required observed value and a
   non-empty real source ref are present.
3. Prefer requiring evidence refs for evidence-backed `failed` results too.
   Missing source refs must produce `unknown`/`unverifiable`, not actor failure.
4. Remove every hard-coded fallback evidence-ref string.
5. Do not let an arbitrary item-matching fact supply a ref. For example, a
   `provider_rationale` fact mentioning `oak_log` must not become the inventory
   source ref.
6. Composite `all`/`any` results must preserve and deduplicate only the refs of
   the authoritative child results used by the truth decision.
7. Add tests for missing refs, incorrect fact kinds, unresolved refs, and real
   ref propagation.

### Finding 3 — The loader is not strict (`P2`)

The current loader rejects only five exact case-root keys. The following
manifest shape was reviewed and returned `{ ok: true }`:

```json
{
  "budgets": {
    "max_cycles": 0.5,
    "max_runtime_actions": 0.5,
    "max_wall_time_ms": 1
  },
  "target": {
    "op": "item_count_gte",
    "item": "oak_log",
    "count": 1,
    "owner": "actor",
    "actor_coordinates": { "x": 1, "y": 2, "z": 3 }
  },
  "allowed_evidence_kinds": ["provider_rationale"],
  "seed_policy": {
    "kind": "fresh",
    "seeds": ["hidden-seed"],
    "repeats": 1
  },
  "strategy": { "action_order": ["mine", "craft"] }
}
```

Required repair:

1. Validate allowed keys recursively for the manifest, every case, budgets,
   target predicate variant, milestone, seed policy, and completion policy.
   Reject all unknown keys rather than maintaining a blacklist of planner names.
2. Require `max_cycles`, `max_runtime_actions`, optional provider requests, and
   token counts to be positive integers. Keep wall time and cost semantics
   explicit and finite.
3. Enforce seed-policy invariants: `fresh` must not carry a hidden seed list;
   fixed/declared-set policies require a non-empty declared set; repeats must be
   coherent with the policy.
4. Validate non-empty and unique suite/case/milestone identifiers. Reject
   duplicate case ids and duplicate milestone ids within a case.
5. Validate `required_capabilities` references or explicitly classify external
   capability refs. Reject self-dependencies and cycles within the suite.
6. Replace arbitrary `allowed_evidence_kinds: string[]` with a closed enum that
   describes runtime-recorded evidence categories, or remove the field until A2 can
   enforce it. Never accept `provider_rationale`, task, memory, PlanBead prose,
   video, or screenshot decide a physical target.
7. Add negative fixtures for nested unknown keys, coordinates, fractional
   budgets, invalid evidence kinds, inconsistent seeds, duplicate ids, and
   dependency cycles.

### Finding 4 — Suite and documentation corrections (`P2/P3`)

Required repair:

1. The `collect_logs` goal says any log, but Minecraft data for 1.21.11 includes
   `pale_oak_log` and the manifest omits it. At minimum add it. Prefer a future
   typed/tag-based predicate only if backed by Minecraft data rather than a
   custom synonym/family list.
2. Define the source of `place_table`'s
   `position_ref: "placed_crafting_table"`. A2 must derive it from a
   runtime-observed, current-run placed-block artifact and explicit named-position
   ref, not from provider text, requested coordinates, tool name, or a fixture
   block. If this cannot be proven, return `unknown`.
3. Fixture/setup evidence must never count as actor progress. Preserve initial
   state and source information so an initially present item/block cannot satisfy
   a current-run acquisition or placement target.
4. Replace the untracked A1 explanation's incorrect claim that the document was
   included in `26c1f93f`. It may say the initial implementation was committed there and was
   repaired by the new commit after that commit exists.
5. Remove A1's accepted status while the repair is in progress. Restore it
   only after focused regressions, full tests, typecheck, docs build,
   and diff check pass.
6. Keep `project-docs/orientation/documentation-map.md` focused: the A1 page is
   an implementation/reference page, not the document that defines research direction. It
   may be routed by `agent-search-index.md`; do not let it compete with the
   central plan.

## Implementation Order

Use the active plan's dependency graph. Work sequentially on shared schemas.
Do not ask separate agents to invent competing types.

### Step A1R — Repair and Re-Accept A1

Deliver:

- all four reviewed findings above fixed;
- closed, strict manifest validation;
- evidence-bearing observed values with resolvable refs;
- three-valued predicates that ignore prose, tool names, and memory text;
- corrected initial suite and negative fixtures;
- updated A1 explanation, implementation-plan status, and routing docs.

Completion checks:

- every reviewed counterexample fails closed;
- passes cite actual supplied artifact refs only;
- missing values or refs produce `unknown`;
- fixture/setup facts cannot produce actor progress;
- all focused and full validation passes.

Commit A1R separately. Do not squash it into `26c1f93f`.

### Step A2 — Normalized Report Adapter

Inspect first:

```text
probe/src/runtime/goals/types.ts
probe/src/runtime/goals/socialCycleBenchmarkMetrics.ts
probe/src/runtime/goals/socialCycleBenchmarkScore.ts
probe/src/runtime/socialCycleRunner.ts
probe/src/runtime/goals/goalJsonStore.ts
probe/test/socialCycleReportAudit.test.ts
```

Deliver:

- `individual-capability-report/v1` types and deterministic builder;
- adapter from `social-cycle-run-report/v1` plus actor-workspace artifacts into
  the repaired evidence bag;
- target and milestone results, declared budgets, actual usage, time/cycle/action
  counts, stalls, blockers, unsupported claims, and failure classes;
- artifact-root-safe ref resolution;
- a furnace-specific compatibility reader only as a case adapter, never a
  general source of scoring truth.

Required result statuses:

```text
passed | partial | failed | blocked | environment_blocked | unverifiable
```

Completion checks:

- clean runtime exit without target evidence is never `passed`;
- partial milestones never imply target completion;
- fixture setup is excluded from progress;
- all report refs resolve within declared roots;
- normalization is deterministic except explicitly documented generation time;
- malformed/missing artifacts yield `unverifiable`, not zero or success.

### Step A3 — Capability Runner and Provider-Free Smoke

Deliver one Bun CLI accepting at least:

```text
--manifest
--case
--provider
--model
--repeat
--seed
--out
```

Wrap existing world-scenario and social-cycle seams. Write the case declaration
before starting Minecraft or provider work. Do not translate manifests into
action suggestions.

Completion checks:

- `--benchmark-task` remains ad hoc and cannot emit a V4 report without a
  manifest;
- budget exhaustion has an explicit result and artifact;
- a deterministic/provider-free smoke makes zero provider calls;
- one command emits declaration, raw report, normalized report, and suite index;
- input manifest hash, scenario version, seed, and implementation revision are
  recorded.

### Step A4 — Basic Capability Suite

Expand to 5–8 versioned cases covering:

- collect logs;
- craft planks/sticks;
- craft a crafting table;
- place a crafting table;
- craft a wooden pickaxe;
- mine cobblestone;
- container use/contribution as a non-social physical operation;
- one honest infeasibility or blocker-recovery case.

Each case must declare natural/fixture status, required capabilities, typed
target/milestones, budgets, seed policy, and accepted evidence categories. Do not expose
the action sequence. Report deterministic action-skill calibration separately
from Actor Turn goal pursuit.

### Step A5 — First Provider-Backed Capability Batch

User approval is required before this step makes any provider request.

Before any provider request:

1. identify the exact provider and model string;
2. estimate the whole batch's requests, input/output/thinking/total tokens, and
   peak requests per minute;
3. run `.agents/skills/provider-quota-preflight` and persist its JSON next to
   the planned run artifacts;
4. treat `blocked`, `unbudgeted`, and `needs_dashboard_approval` as not runnable;
5. ask the user for the exact approval still required.

Never silently choose Grok, OpenAI, Gemini, ModelScope, or another provider just
because this handoff is being executed by that model.

After approval, run at least one complete declared batch and use the runtime
review/report-author skills. Completion requires truthful artifact coverage and
failure separation, not a required pass rate.

### Step B1 — Multi-Hop Capability

Convert the current furnace chain into a manifest-owned case. Remove generic
dependence on `FURNACE_BLOCK_SCORING_PLAN` and the closed
`BenchmarkMilestoneId` union. Add one longer natural-world candidate; diamond
acquisition is aspirational only after prerequisites work.

Completion checks:

- milestone order comes from the manifest;
- actor context does not reveal the dependency chain;
- partial credit is evidence-backed;
- failure locates the missing prerequisite, unavailable action, execution
  failure, or continuity break;
- timeout cannot become fake success.

### Step B2 — Goal-Continuity Data Formats and Offline Evaluator

Inspect Active Episode, PlanBead, memory, CycleJudgment, ready-front, checkpoint,
and operation-result artifacts before defining types.

Deliver:

- `goal-continuity-manifest/v1` and `goal-continuity-report/v1`;
- evaluator joining physical predicates with Active Episode and PlanBead
  lifecycle artifacts;
- deterministic fixtures for create, update, block, defer, resume, supersede,
  reopen, close, unsupported closure, stale checkpoint, and missing ref.

Rules:

- the manifest declares pressure/interruption, not correct PlanBead titles or
  intermediate goals;
- memory and PlanBead prose can prove continuity state but never physical
  progress;
- lifecycle changes cite source artifacts;
- checkpoint conflicts remain visible;
- missing refs yield `unknown`/`unverifiable`.

### Step B3 — Live Goal-Continuity Cases

Add at least three versioned cases:

1. delayed progress across a long dependency chain;
2. a new concern interrupts open work and the actor later resumes or revises;
3. restart/context compaction preserves useful work state.

At least one case must exercise an actual process restart or equivalent durable
reload. Use provider quota preflight if the cases call a live provider.
Physical outcome and continuity quality remain separate in every report.

### Step C1 — Social Scenario Declaration

Deliver `interdependent-social-scenario/v1`, strict loader, stable hash, and
negative fixtures.

The declaration must include actor count/profiles, model comparability, role
assignment mode, resource/access/information asymmetry, activity graph,
required capability evidence refs or explicit gaps, interaction opportunities,
material stakes, response-window/metric/visual/budget settings, and scenario
   source information.

Reject:

- prescribed trust, cooperation, refusal, specialization, partner choice,
  promises, relationship labels, or social outcome;
- hidden action plans or parameter suggestions;
- fixture progress credited to actors;
- capability refs that do not resolve or explicitly declare a gap.

### Step C2 — Three Minimal Interdependent Scenario Families

Implement:

1. economic/resource dependency through asymmetric resource, tool, station,
   location, access, or information;
2. cooperative activity such as construction, exploration, transport, defense,
   or recovery that benefits from more than one contribution;
3. multi-activity quest where useful activities compete for actors, material,
   and time without centrally assigning division of labor.

Start with a small attributable actor count. Scenario design may create reasons
to interact but may not require the response. Reports must distinguish:

```text
opportunity absent
opportunity present but ignored
refused
attempted
runtime execution failed
material handoff/contribution verified
no observable subsequent response
```

Cross-actor observation and chat must be captured. A response window closes
only after each relevant other active actor receives at least one subsequent
Actor Turn slot or the declared timeout occurs.

### Step C3 — Long-Run Observation Bundle

Deliver:

- scenario/run declaration and multi-actor report index;
- goal, action, resource, interaction, spatial/co-presence, role concentration,
  commitment, stall, continuity, robustness, efficiency, and cost time series;
- synchronized first/third-person visual refs and video segment refs when video
  exists;
- provider usage and server/scenario/seed/reset/reconnect source information;
- per-actor capability and continuity dependency refs;
- explicit dropped capture and missing evidence records.

Use run/cycle/actor/timestamp join keys fixed in code and tests. Pixels are
review-only. Never infer block identity, possession, contribution, goal
completion, or social consequence from video alone. Public analysis exports
must not leak private actor state.

### Step D1 — Phenomenon Catalog

Deliver `phenomenon-record/v1`, strict writer/loader, searchable index, and a
review workflow that links structured evidence and synchronized segments.

Each record must contain:

- id, title, and `candidate | selected_for_followup | retired` status;
- concise recurring pattern;
- scenario versions, runs, seeds, actors, and model configurations;
- recurrence numerator and denominator;
- material stakes and social-opportunity refs;
- structured evidence refs and visual/video segments;
- individual capability and continuity refs;
- competence, prompt, role, fixture, and evaluator alternative explanations;
- proposed distinguishing change/control;
- user decision and rationale for any promotion.

Only the user or an explicitly delegated reviewer may set
`selected_for_followup`. A single quote or attractive video cannot satisfy
recurrence. Preserve negative, boring, and retired candidates.

Create one fixture phenomenon record to verify writer and index behavior, but
label it clearly as a fixture and not a research result.

### D2 Approval Point — Do Not Start Automatically

When D1 yields a real candidate the user wants to pursue, stop and present the
candidate, evidence, alternatives, and estimated next cost. Begin D2 only after
explicit selection. Then use the research-value harness, fresh close-prior-work
review, baseline, falsifier, competence controls, quota preflight, and a separate
experiment declaration.

## Runtime and Evidence Invariants

These rules apply to every step:

- Runtime code owns Minecraft truth.
- `(state_before, executed_action, observed_delta)` is independent of the
  actor's declared `expected_outcome`.
- Provider proposal, action selection, runtime execution, verifier result,
  physical competence, social consequence, continuity, robustness, efficiency,
  and provider cost are separate fields and report sections.
- Physical actions require structured executable parameters before execution.
  Missing args are validation errors, not permission to derive values from
  rationale text.
- Benchmark evaluators read saved artifacts. They do not create Minecraft truth
  or mutate actor state.
- Fixture/setup commands and command-given items are setup evidence only.
- PlanBeads are actor-owned continuity state, not permission to execute actions or
  physical proof.
- New generated Mineflayer action skills originate only from Actor Turn
  `author_mineflayer_action` and require schema, helper, timeout, verifier,
  evidence, trial, and promotion checks.
- Screenshots/video support review but never establish material truth alone.
- Use real relative artifact refs with root-safe resolution. Reject absolute or
  escaping refs.
- Do not parse LLM-facing prose with regex, keyword lists, or `includes` to
  decide eligibility, parameters, permission, retry clearance, or success.
- Do not add a hidden Minecraft domain planner, action shortlist, recipe plan,
  social policy, or actor strategy.

## Failure Taxonomy to Preserve

Every runner and normalized report must keep these distinct:

```text
manifest_invalid
world_setup_failed
provider_blocked
model_goal_misread
missing_action_capability
runtime_execution_failed
verifier_failed
no_measurable_progress
stalled_after_progress
context_continuity_failed
claim_without_evidence
unverifiable
environment_blocked
```

Provider or environment failures are not actor incompetence. A clean process
exit is not benchmark success. A passed primitive is not a completed goal. A
completed task is not social insight.

## Required Testing Strategy

Use Detroit-style tests that would fail if the real scoring or source-of-truth logic broke.

For each schema/loader:

- valid minimum and full records;
- every required field missing;
- every unknown key rejected recursively;
- invalid enum/id/ref/budget/version;
- duplicates and dependency cycles;
- path traversal and absolute-ref rejection;
- deterministic round-trip/hash behavior.

For each predicate/report evaluator:

- `passed`, `failed`, and missing-evidence `unknown`;
- real evidence refs required;
- provider/task/tool/memory/PlanBead prose cannot change truth;
- setup evidence cannot become actor progress;
- initial state cannot masquerade as current-run acquisition;
- nested `all`/`any` Kleene logic and ref propagation;
- clean exit cannot pass;
- repeated normalization is deterministic.

For continuity and social layers:

- guarded PlanBead lifecycle and checkpoint conflicts;
- restart/compaction survival;
- response window waits for real subsequent turns;
- capability dependency resolution;
- no prescribed social-response fields;
- private/public export rejection;
- opportunity, action, execution, and response stay separate.

At every TypeScript implementation step run targeted tests first, then:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community/probe
bun test
bun run typecheck
cd /Users/gigio/git/minecraft-llm-agent-community
git diff --check
```

When internal/public docs change, also run:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community/docs
npm run build
```

For live Minecraft behavior, include a fresh command, artifact paths, runtime
review result, and report-readiness result. Unit tests alone are insufficient.

## Commit Discipline

Use one or more scoped commits per completed step. Never stage with `git add .`
while unrelated files exist. Inspect staged diff before every commit.

Commit body format:

```text
Why:
- exact problem or requirement

What changed:
- concrete modules, data formats, and files

Validation:
- exact commands and results

Notes:
- live blocker or intentionally deferred work, when applicable
```

Do not mark a step complete in documentation until its verification evidence
exists. Do not commit generated secrets, auth stores, provider payload secrets,
temporary server state, or ignored runtime noise. Commit required safe fixture
artifacts only when the plan calls for them.

Do not push or open a PR unless the user separately requests it.

## First Three Executable Actions

1. Establish and preserve the live state:

   ```bash
   cd /Users/gigio/git/minecraft-llm-agent-community
   git status -sb
   git branch --show-current
   git log -6 --oneline --decorate
   git diff -- project-docs/orientation/agent-search-index.md \
     project-docs/orientation/documentation-map.md \
     project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md
   ```

   Confirm the branch is `codex/capability-gated-social-sandbox-v4`. Preserve
   the dirty A1 docs. If the branch differs, do not switch until you understand
   and preserve all changes.

2. Read the required source-of-truth files and inspect all A1 source/tests listed in
   “What Is Already Implemented.” Then create `implementation-notes.md` with the
   initial scope: A1 evidence-rule repair only.

3. Add regression tests for the three reviewed executable counterexamples:

   - `provider_rationale` through `evidence_kind_seen` must not pass;
   - an inventory/held/position value without a real source ref must be
     `unknown`;
   - nested strategy/coordinates, fractional budgets, invalid evidence kinds,
     and inconsistent seed policy must make manifest validation fail.

   Run the new tests to confirm they fail for the expected reasons, then repair
   the implementation with `apply_patch`. Do not start A2 until A1R passes and its
   docs are truthful.

## Blockers, Unknowns, and Resolution Rules

- Current blocker: A1 is falsely accepted despite evidence-rule counterexamples.
  Resolve with A1R before building A2.
- Current dirty-state risk: four A1 documentation files are uncommitted. Preserve
  and reconcile them; do not reset or commit unchanged.
- Provider unknown: no exact provider/model/budget is approved for A5/B3/C2/C3.
  Resolve before the first live-provider run with exact quota preflight and
  user confirmation.
- Runtime unknown: existing report artifacts may lack the source refs A1R
  requires for each observed value. A2 must classify missing source information as `unverifiable`; do not weaken
  A1R to make old artifacts pass.
- Scenario unknown: actual capable actor behavior may expose missing action
  skills or weak interaction pressure. Version and repair the relevant
  capability/scenario layer; do not reinterpret capability failure as social
  behavior.
- Research unknown: no phenomenon is selected. This is expected. D1 catalogs
  observations; only the user can authorize D2.
- Visual risk: Minecraft 1.21.11 may exceed exact prismarine-viewer texture
  support. Record renderer/version caveats and pair pixels with runtime block
  evidence.

## Final Delivery Expectations

When handing work back, lead with the highest fully accepted milestone, not the
amount of code written. Include:

- commits in order and the implementation step each one satisfies;
- exact focused/full test, typecheck, docs build, and diff-check results;
- provider preflight and actual usage for every provider-backed run;
- live commands and exact report/artifact directories;
- what the runtime actually proved;
- what remains unproven, blocked, or awaiting user approval;
- whether D1 has real recurring candidates or only fixture records;
- the next smallest action if the whole implementation is not yet complete.

Do not say “V4 complete” if a required live step lacks current-run evidence,
if artifact refs do not resolve, if provider use was not explicitly approved,
or if only schemas/tests exist. Replace this handoff rather than appending a
second conflicting handoff if another transfer becomes necessary.
