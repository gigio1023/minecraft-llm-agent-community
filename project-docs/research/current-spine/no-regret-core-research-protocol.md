# No-Regret Core Research Protocol

Status: active research protocol for the no-regret core. This is not an
implementation campaign and not a paper claim.

Search token: `NO_REGRET_CORE_RESEARCH_PROTOCOL`.

Recorded: 2026-06-29 (`Asia/Seoul`).

Use with:

- `Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
- `Transition-Row-V1-Contract.md`
- `Seed-Reset-Record-V1-Contract.md`
- `Transition-Row-Label-Codebook.md`
- `No-Regret-Core-Scenario-Catalog.md`
- `Goldilocks-Preflight-Protocol.md`
- `Society-Observable-Preflight.md`
- `Research-Decision-Current-Spine-2026-06-29.md`

## Purpose

The no-regret core is a substrate test. It asks whether this repo can produce
small, truthful, non-degenerate Minecraft interaction data before choosing a
research headline.

The protocol reduces three uncertainties:

1. Can 2-3 embodied actors run without collapsing into a repeated action loop?
2. Can the runtime emit independent `transition-row/v1` records from executed
   actions and observed deltas?
3. Can small scenarios create enough material stake and interaction opportunity
   to support later prediction or society-observable preflights?

Passing this protocol does not prove F-native, F-loop, or F-society. It only
allows a branch-triage preflight to start.

## Research Object

The object is a closed row batch:

```text
2-3 actors
+ fresh seed/reset records
+ scenario-pressure family metadata
+ transition-row/v1 rows
+ bounded response-window evidence
+ batch audit
```

The object is not:

- a model;
- a WAM;
- a verifier paper;
- a single vivid transcript;
- a society demo;
- a benchmark-maximization result.

## Required Run Shape

Each no-regret pilot attempt must record:

- `run_id`;
- seed or reset-session id;
- `seed-reset-record/v1` refs and counting status;
- actor ids and ActorSoul/LifeGoal refs;
- scenario-pressure family ids attempted before outcome inspection;
- provider/model path and cost guard status;
- world setup artifacts and loaded-world caveats;
- transition-row batch path;
- batch audit path;
- negative-result notes.

The measured window must include 2-3 active actors. Single-actor work may still
be used as a competence control, but it cannot satisfy the no-regret core.
Passive observed actors may define visibility or response-window scope, but they
do not count as active actors unless their own Actor Turn/action-selection loop
participates in the measured window.

## Pre-Run Declaration

Before a pilot starts, write a small declaration:

```yaml
schema_version: no-regret-run-declaration/v1
run_id:
seed_or_reset_ids:
seed_reset_record_refs:
actor_ids:
scenario_families_planned:
scenario_narrowing_reason:
competence_controls_planned:
no_stake_controls_planned:
provider_budget_guard:
row_thresholds:
known_risks:
stop_conditions:
counts_toward_no_regret_pilot:
not_no_regret_pilot_evidence:
```

The declaration prevents hindsight from turning a narrow or scripted run into a
general substrate result.

Seed/reset ids must be backed by `seed-reset-record/v1` artifacts before they
count toward pilot seed/reset thresholds. Deterministic no-world, offline
control, and reused live sessions may remain in the archive, but they do not
count as fresh seed/reset coverage unless a future authority doc changes that
rule before outcomes are inspected.

World setup ids are not scenario-pressure family ids. A world scenario such as
`natural-safe-spawn-v1`, `roofless-hut-flat-survival-v1`, or
`wooden-pickaxe-flat-benchmark-v1` may describe terrain, fixture, seed, or setup
lane, but it must not be counted as `borrow_refuse_return_tool_v1`,
`shared_station_public_affordance_v1`, or another no-regret scenario family
unless the family was explicitly declared before outcome inspection.

## Scenario And Control Requirements

Use at least three scenario-pressure families unless the declaration explains a
narrower run before outcome inspection.

Every family should have at least one control idea:

- `no_stake_control`: same physical action opportunity without a meaningful
  possession, access, need, or place stake.
- `same_action_different_history`: same action class after different pre-action
  interaction history.
- `single_actor_control`: action family without another actor in the response
  window.
- `fixture_leakage_check`: verify the setup text or scenario metadata did not
  determine the target label by construction.

Controls do not need to be balanced for the first pilot. They must be recorded
so the project does not mistake scenario pressure for learned signal.

## Acceptance Thresholds

These are pilot thresholds, not statistical claims.

The numbers are cheap-review defaults. They exist to expose degeneracy,
evidence gaps, fixture leakage, and one-action-family collapse under free-tier
constraints. They are not a sample-size justification and do not imply paper
readiness.

Report row counts in three denominators:

- `archived_rows`: all closed rows preserved for audit, including excluded rows;
- `non_excluded_rows`: valid or partial rows that survive exclusion rules;
- `scorable_rows_by_layer`: rows with enough evidence to score a specific
  physical, material, or social-response layer.

No-regret substrate acceptance uses `non_excluded_rows` unless a requirement
explicitly names a layer. Later prediction or society decisions must cite
`scorable_rows_by_layer`.

| Requirement | Default | Why it exists |
| --- | --- | --- |
| fresh seeds or reset sessions | at least 2 | catches seed/setup dependence without pretending to be broad generalization |
| active actors | 2-3 | creates interaction opportunity while avoiding society-scale theater |
| executed rows | at least 40 non-excluded rows | enough to audit degeneracy, row quality, and label coverage before a preflight |
| action classes | at least 4 | prevents one tool/action family from masquerading as a substrate |
| dominant target cap | no `(actor_id, action_kind, target_signature)` above 30% | catches repeated-loop collapse |
| classifiable observed evidence | at least 60% of non-excluded rows | ensures rows are not mostly missing or unknown evidence; scoped `no_*` and `no_observable_response` labels count only when their windows are defined and closed |
| bounded response windows | at least 20 rows | makes social-response absence or response measurable |
| `interaction_opportunity` rows | at least 15 | ensures another actor could plausibly observe or be affected |
| `material_stake` rows | at least 10 | keeps rows from being only obvious physical Minecraft mechanics |
| scenario families | at least 3 attempted or declared narrowing reason | reduces single-fixture overfitting |

Failure is allowed. A failed threshold produces `core inconclusive` or a more
specific negative result, not a forced research headline.

## Batch Audit Outputs

The batch audit must report:

- row count by quality verdict;
- row count by actor;
- row count by seed/reset, with deterministic/offline/no-world records separated
  from fresh seed/reset coverage;
- row count by scenario-pressure family;
- action-family distribution;
- dominant target signatures;
- physical/material/social-response label distribution;
- response-window closure status;
- partial/excluded row reasons;
- generated-action-confounded rows;
- provider/cost summary;
- environment blockers;
- negative-result notes.

The audit verdict is one of:

- `substrate-ready-for-preflight`;
- `core-inconclusive`;
- `degenerate-action-loop`;
- `row-contract-failure`;
- `scenario-forced-labels`;
- `cost-or-environment-blocked`.

## What Counts As A Negative Result

Preserve these instead of hiding them:

- 2-3 actors still repeat the same action family.
- Most response windows close as `no_observable_response`.
- Material stake rarely changes another actor's options.
- Scenario text determines labels.
- Pathing or loaded-world limits dominate social-response labels.
- Generated action quality dominates the observed delta.
- Provider budget forces fallback behavior that cannot answer the protocol.

## Advancement Rule

Move to the Goldilocks prediction preflight only when the closed batch is
auditable and meets its input thresholds.

Move to the society-observable preflight only when the batch contains repeated
material-stake or interaction-opportunity episodes that can be compared with
controls.

Do not advance because the transcript sounds social, the verifier passed, the
schema is clean, or the implementation feels ready.

## What Not To Do

- Do not treat single-actor competence as no-regret-core completion.
- Do not count deterministic no-world rows toward live pilot thresholds.
- Do not use `expected_outcome` as a row target.
- Do not put prediction outputs inside `transition-row/v1`.
- Do not choose F-native, F-loop, or F-society from a pilot transcript.
- Do not scale actor count to hide a weak small-run result.
