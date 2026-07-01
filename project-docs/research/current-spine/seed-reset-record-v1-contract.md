# Seed Reset Record V1 Contract

Status: active planning contract for no-regret-core seed/reset provenance. This
is not a runtime schema yet and not a research contribution by itself.

Search token: `SEED_RESET_RECORD_V1`.

Recorded: 2026-06-29 (`Asia/Seoul`).

Use with:

- `Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
- `No-Regret-Core-Research-Protocol.md`
- `Transition-Row-V1-Contract.md`
- `No-Regret-Core-Implementation-Campaign.md`
- `Goldilocks-Preflight-Protocol.md`
- `Society-Observable-Preflight.md`

## Purpose

`seed-reset-record/v1` records what world/setup instance a measured row batch
came from. Its job is narrow:

```text
prevent hindsight laundering of fresh seeds, reset sessions, and offline controls
```

A seed/reset record does not prove the no-regret core, Goldilocks readiness,
F-native, F-loop, or F-society. It only makes later row batches auditable by
world/setup provenance and counting status.

## Why It Exists

The no-regret core requires evidence across fresh seeds or auditable reset
sessions. Without a separate record, these cases can be confused:

- a newly generated Minecraft world seed;
- a restored/reset session from a known setup;
- a reused live world session;
- a deterministic provider-free run;
- a no-world fixture/control run.

Only the first two may count toward fresh seed/reset thresholds, and only when
they were declared before outcome inspection and have enough setup evidence to
audit.

## Conceptual Schema

```yaml
schema_version: seed-reset-record/v1
record_id:
run_id:
recorded_at:
seed_or_reset_id:

session_kind: fresh_seed | reset_session | reused_live_session | deterministic_no_world | offline_control
counts_toward_no_regret_seed_requirement: true | false
counting_rationale:

world:
  world_setup_id:
  minecraft_seed:
  world_instance_id:
  dimension:
  generated_at:
  reset_from_record_id:
  reset_method:
  setup_artifact_refs: []
  loaded_world_caveats: []

runtime:
  platform:
  server_mode:
  minecraft_version:
  mineflayer_version:
  provider:
  model:
  offline: true | false
  deterministic_mode: none | deterministic_provider | deterministic_fixture | no_world
  provider_budget_guard:

scope:
  active_actor_ids: []
  passive_observed_actor_ids: []
  scenario_family_ids_declared: []
  world_setup_lane_ids: []

evidence_refs:
  pre_run_declaration_ref:
  transition_row_batch_ref:
  batch_audit_ref:
  provider_usage_ref:
  environment_log_refs: []

negative_result_notes: []
```

Concrete implementation fields may differ, but the semantic boundary must
survive: counting status is declared from setup/runtime provenance, not inferred
from whether the run later looked useful.

## Session Kinds

`fresh_seed`:

- a newly generated Minecraft world instance for the measured run;
- has a declared Minecraft seed or equivalent world-instance id;
- has setup artifacts and loaded-world caveats;
- may count toward no-regret seed/reset thresholds if declared before outcome
  inspection and the measured window has 2-3 active actors.

`reset_session`:

- a measured session produced by restoring or resetting a known world/setup
  state;
- records `reset_from_record_id`, reset method, and setup artifact refs;
- may count only if the reset creates an auditable independent attempt and was
  declared before outcome inspection.

`reused_live_session`:

- a live Minecraft world/session reused without a fresh seed or auditable reset;
- useful for debugging or exploratory runs;
- does not count toward seed/reset thresholds by default.

`deterministic_no_world`:

- schema/linkage/control evidence without live Minecraft world state;
- useful for tests and artifact wiring;
- never counts toward live no-regret seed/reset thresholds.

`offline_control`:

- provider-free or offline competence/control execution;
- can prove mechanics, report linkage, and failure modes;
- does not count toward no-regret pilot thresholds unless a future authority doc
  explicitly narrows and justifies that rule before outcomes are inspected.

## Counting Rules

A seed/reset record can count toward the no-regret seed/reset requirement only
when all are true:

- `session_kind` is `fresh_seed` or `reset_session`;
- counting status was declared before outcome inspection;
- setup artifacts are sufficient for a skeptical reviewer to identify the world
  or reset source;
- the measured run has 2-3 active actors, not only passive observed bodies;
- deterministic/offline/no-world shortcuts did not supply the measured evidence;
- provider/cost guard status is recorded, or the missing provider path is a
  declared environment blocker.

If any item is false, keep the record but set
`counts_toward_no_regret_seed_requirement: false` and write the reason.

## Relationship To Other Artifacts

`no-regret-run-declaration/v1` should link planned seed/reset records before
outcome inspection. The declaration prevents a narrow run from being relabeled
as broad coverage later.

`transition-row/v1` rows should carry a stable `seed_or_reset_id` or equivalent
metadata so batch audits can group rows by provenance. The row still owns
state/action/observed-delta evidence; the seed/reset record owns world/session
provenance.

`transition-row-batch-audit/v1` should report row counts by seed/reset and should
not count deterministic/no-world/offline records as live seed coverage.

## Must Not Claim

- Do not claim no-regret-core completion from seed/reset records alone.
- Do not claim Goldilocks readiness from deterministic or offline rows.
- Do not treat a world scenario id such as `natural-safe-spawn-v1` as a
  scenario-pressure family id.
- Do not treat a reused live world as a fresh seed without a declared reset
  record.
- Do not count passive observed actors as active actors for seed/reset coverage.
- Do not infer social-response absence from seed/reset provenance.

## What Not To Do

- Do not merge this artifact into `transition-row/v1`.
- Do not put predictor outputs or `predicted_delta` here.
- Do not let seed/reset counting depend on whether the later run looked
  successful.
- Do not let fixture setup text determine social/material labels.
