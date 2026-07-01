# Transition Row V1 Contract

Status: active planning contract for the no-regret core. This is not yet a
runtime schema.

Search token: `TRANSITION_ROW_V1`.

Recorded: 2026-06-29 (`Asia/Seoul`).

## Purpose

`transition-row/v1` is the first research data unit this project needs before it
can choose a research headline.

The row is an independent observation record:

```text
state_before + executed_action + observed_delta + evidence_refs
```

It is not a predictor output, not a score, not an actor self-report, and not a
replacement for runtime authority. It exists so later experiments can ask whether
an LLM prior, a history-grounded prompt, or a learned model predicts observed
Minecraft consequences better than a baseline.

Use `No-Regret-Core-Scenario-Catalog.md` when selecting row-producing
conditions. A Goldilocks-facing batch should include material stake and
interaction opportunity, not only obvious single-actor Minecraft mechanics.

Use `Transition-Row-Label-Codebook.md` when assigning physical, material, and
social-response labels. This contract defines the row shape; the codebook defines
what evidence is sufficient for labels.

Use `Seed-Reset-Record-V1-Contract.md` for world/session provenance. A transition
row may carry a stable seed/reset id, but it should not decide whether a run
counts as fresh seed/reset coverage.

## Non-Negotiable Separation

`transition-row/v1` must not contain `predicted_delta`.

Prediction records used by the Goldilocks preflight are separate artifacts joined
to `transition-row/v1` by `row_id` only during analysis. This avoids the live
re-badging trap where the actor's own `expected_outcome` is renamed into a target
label.

Forbidden as ground truth:

- the actor's self-declared `expected_outcome`;
- provider rationale;
- CycleJudgment prose;
- memory notes;
- relationship prose without cited runtime evidence;
- screenshots without the underlying runtime event or scan refs.

Allowed as ground truth:

- Mineflayer/runtime observations;
- inventory, block, container, entity, position, chat, and helper-event records;
- verifier output;
- bounded world-state scans with loaded-world caveats;
- explicitly timestamped other-actor observations inside a response window;
- evidence-gated relationship or obligation events, when the event kind and
  evidence refs are both present.

## Conceptual Schema

```yaml
schema_version: transition-row/v1
row_id:
session_id:
seed:
seed_or_reset_id:
cycle_index:
actor_id:
timestamps:
  action_selected_at:
  action_started_at:
  action_finished_at:
  response_window_closed_at:

state_before:
  snapshot_ref:
  actor:
    inventory_ref:
    position_ref:
    vitals_ref:
    planbead_refs:
  world:
    scan_refs:
    loaded_world_caveat:
  other_actors:
    observed_actor_refs:
    co_presence:
      visible_actor_ids:
      interaction_range_actor_ids:
  social_context_refs:
    relationship_refs:
    open_obligation_refs:
    recent_interaction_refs:

executed_action:
  action_kind:
  action_card_id:
  runtime_action_id:
  structured_args_ref:
  validation_status:
  permission_status:
  generated_action_trial_ref:
  action_started: true

observed_delta:
  physical:
    classes: []
    evidence_refs: []
  material:
    classes: []
    evidence_refs: []
  social_response:
    response_window:
      horizon_cycles:
      horizon_seconds:
      opened_at:
      closed_at:
      observed_actor_ids:
      passive_observed_actor_ids:
      evidence_refs:
    classes: []
    evidence_refs: []
  exclusions:
    - reason:
      evidence_refs: []

row_quality:
  verdict: valid | partial | excluded
  inclusion_tags: []
  exclusion_reasons: []
  notes:

metadata:
  provider:
  model:
  scenario_family_id:
  scenario_family_ids: []
  token_cost_ref:
  artifact_refs: []
```

Concrete TypeScript names can differ when implemented, but the semantic boundary
above must survive: `state_before`, `executed_action`, and `observed_delta` are
recorded from runtime artifacts, not from the actor's claimed expectation.
Scenario family metadata is provenance for interpreting row pressure. It is not
an outcome label and must be declared before the run, not inferred after seeing
the result.

## Delta Class Set

The first implementation should use a small observable label set. Do not add
relationship psychology labels until they are backed by evidence-gated event
records.

Operational label rules live in `Transition-Row-Label-Codebook.md`. The lists
below define allowed class names, not enough evidence by themselves.

Physical classes:

- `no_physical_delta`
- `position_changed`
- `block_changed`
- `item_entity_changed`
- `container_opened_or_closed`
- `action_blocked_or_failed`
- `unknown_physical_delta`

Material classes:

- `no_material_delta`
- `inventory_gain`
- `inventory_loss`
- `container_gain`
- `container_loss`
- `possession_or_access_granted`
- `possession_or_access_refused`
- `public_affordance_created`
- `public_affordance_used`
- `claim_or_obligation_event_recorded`
- `unknown_material_delta`

Social-response classes:

- `no_observable_response`
- `reply_accept_or_acknowledge`
- `reply_refuse_or_disagree`
- `approach_or_follow`
- `retreat_or_avoid`
- `reciprocate_or_help`
- `contest_or_interrupt`
- `repair_or_compensate`
- `acts_on_changed_affordance`
- `unknown_social_response`

These are observation labels, not moral judgments. For example, refusal can be a
valid social response; cooperation is not automatically a better label.

## Inclusion Tags

Rows should carry inclusion tags so later experiments can avoid pretending that
all actions are equally informative.

Recommended tags:

- `physical_control`: straightforward Minecraft mechanic, useful as a control;
- `material_stake`: possession, access, place, station, tool, food, cache,
  public affordance, or obligation can matter to another actor;
- `interaction_opportunity`: another actor could observe or be affected inside a
  bounded response window;
- `generated_action_confounded`: action result depends on generated Mineflayer
  code quality;
- `dialogue_only`: consequence is visible only in chat;
- `no_response_observed`: response window closed with no observed response;
- `loaded_world_limited`: absence claims are limited by what Mineflayer loaded.

## No-Regret Core Acceptance

A no-regret core batch is not ready for the Goldilocks preflight unless it has:

- at least 2 fresh seeds or reset sessions;
- 2-3 actors present for the measured window;
- at least 40 non-excluded rows from executed runtime actions;
- at least 4 action classes represented;
- no single `(actor_id, action_kind, target_signature)` above 30% of rows;
- at least 60% of rows with classifiable physical, material, or social-response
  evidence, including scoped absence labels such as `no_physical_delta`,
  `no_material_delta`, or `no_observable_response` when the relevant observation
  or response window is defined and closed;
- at least 20 rows with a bounded other-actor response window;
- at least 15 rows tagged `interaction_opportunity`;
- at least 10 rows tagged `material_stake`.
- at least three scenario-pressure families attempted, or a written reason why
  the run deliberately narrowed the family set.

These thresholds prove only that the substrate is not obviously degenerate. They
do not prove the research claim.

## Preflight Prediction Join

The Goldilocks preflight may create separate prediction artifacts:

```yaml
schema_version: preflight-prediction/v1
prediction_id:
row_id:
predictor_arm: majority | scripted_heuristic | llm_prior | current_observation | history_grounded
input_cutoff_timestamp:
predicted_delta:
  physical:
  material:
  social_response:
confidence:
model:
prompt_ref:
```

`preflight-prediction/v1` records are evaluated against `transition-row/v1`
labels after the row is closed. They must never feed post-action label evidence
back into predictor context.

## What Not To Do

- Do not build `social-material-transition/v1` as the active no-regret row name.
  That older name referred to a predicted+observed scoring row in WAM-era docs.
- Do not use the actor's `expected_outcome` as `predicted_delta`.
- Do not turn label classes into hidden provider strategy.
- Do not treat `no_observable_response` as missing data. It is a valid observed
  response class when the response window is defined and closed.
- Do not score actor task success as prediction accuracy.
