# Transition Row Label Codebook

Status: active label codebook for `transition-row/v1`.

Search token: `TRANSITION_ROW_LABEL_CODEBOOK`.

Recorded: 2026-06-29 (`Asia/Seoul`).

Use with:

- `Transition-Row-V1-Contract.md`
- `No-Regret-Core-Research-Protocol.md`
- `No-Regret-Core-Scenario-Catalog.md`
- `Goldilocks-Preflight-Protocol.md`
- `Society-Observable-Preflight.md`

Authority: subordinate to `AGENTS.md`, the active central plan, and
`Transition-Row-V1-Contract.md`. This file defines how row labels are assigned;
it does not define a new row schema.

## Purpose

This codebook keeps `transition-row/v1` labels from becoming subjective prose.
Labels are allowed only when runtime artifacts support them. They are not actor
feelings, moral judgments, provider rationales, or later reviewer guesses.

The first rule:

```text
If the evidence would not let a skeptical reviewer reconstruct why the label was
assigned, do not assign the label.
```

## Scope And Non-Goals

This file is a narrow companion to `transition-row/v1`.

It does not:

- choose a research headline;
- revive WAM as the active banner;
- create a large social taxonomy;
- define actor policy or provider-facing strategy;
- add hidden trust, emotion, norm, culture, role, law, religion, or civilization
  labels;
- make screenshots or prose into ground truth.

## Labeling Workflow

Labels are assigned only after the row is closed.

```text
execute action
-> close post-action observations
-> close response window if applicable
-> assign labels from evidence refs
-> lock row labels
-> only then join predictor artifacts for analysis
```

Every positive, negative, or unknown class must be traceable to evidence refs or
to an explicit scoped absence claim. Predictor outputs must not be visible during
label assignment.

## Layer Semantics

- Physical labels describe body/world/action mechanics: position, blocks, item
  entities, containers, execution failure, and scoped absence.
- Material labels describe possession, inventory, container state, access,
  public affordance, and evidence-gated claim or obligation events.
- Social-response labels describe another actor's observable response inside a
  bounded window.

Do not let a label jump layers. A pathing failure is physical unless another
actor observably responds. A friendly reply is social-response, not material
access, unless the material access also occurs or is typed as an evidence-gated
event.

## Evidence Classes

Allowed evidence:

- runtime action record;
- Mineflayer inventory, block, container, entity, position, vitals, or chat
  observation;
- helper events;
- verifier output;
- world scan with loaded-world caveat;
- actor workspace evidence refs;
- relationship or obligation event only when the event kind has explicit refs;
- response-window artifact with open/close timestamps.

Forbidden as direct label evidence:

- actor `expected_outcome`;
- provider rationale;
- CycleJudgment prose;
- memory note without linked runtime evidence;
- relationship prose without a typed event;
- screenshots without the underlying runtime event or scan refs;
- scenario text that says what should happen.

## General Label Rules

- Multi-label is allowed for physical and material classes.
- Social-response labels are multi-label, but `no_observable_response` should not
  be combined with a concrete response class for the same closed window.
- Use `unknown_*` when execution produced evidence but the effect cannot be
  classified from available artifacts.
- Use `no_*_delta` only when the relevant observation window is defined and
  evidence supports absence within that scope.
- Use an exclusion reason when the row cannot support a label because the action
  did not start, evidence is missing, post-action context leaked, or the fixture
  determined the outcome.

## Physical Labels

| Label | Required evidence | Do not use when |
| --- | --- | --- |
| `no_physical_delta` | post-action observation exists and shows no relevant position, block, entity, container, or failure-state change inside the scoped evidence | the action never produced post-observation evidence |
| `position_changed` | before/after position refs or path/helper event showing movement | only a chat claim says the actor moved |
| `block_changed` | block placement, mining, breaking, growth, damage, or scan diff ref | block was only requested or planned |
| `item_entity_changed` | item entity spawn/despawn/pickup/drop observation or helper event | inventory changed but no world item evidence exists |
| `container_opened_or_closed` | container open/close helper event or container interaction artifact | the actor merely approached a container |
| `action_blocked_or_failed` | runtime failure, verifier failure, timeout, permission/schema rejection after selected action, pathing failure, or helper error | the action succeeded but did not create the hoped-for result |
| `unknown_physical_delta` | action ran and evidence exists, but loaded-world or artifact limits prevent classification | no post-action evidence exists at all |

## Material Labels

| Label | Required evidence | Do not use when |
| --- | --- | --- |
| `no_material_delta` | relevant inventory/container/access state was observed before and after with no material change | material state was not observed |
| `inventory_gain` | before/after inventory refs show an item count increase for an actor | the item was only mentioned in chat or plan text |
| `inventory_loss` | before/after inventory refs show an item count decrease for an actor | loss is inferred only from expected crafting cost without inventory evidence |
| `container_gain` | container snapshot or helper event shows item count increase in a container | the container was not opened/scanned |
| `container_loss` | container snapshot or helper event shows item count decrease in a container | the actor merely intended to withdraw |
| `possession_or_access_granted` | item handoff, container access, station access, path access, or typed event with evidence refs shows another actor's option became available | actor says "you can use it" but no durable access or later option is visible |
| `possession_or_access_refused` | refusal chat/action plus evidence that requested/needed access did not occur within the scoped window, or typed refusal event with refs | no request/stake was recorded |
| `public_affordance_created` | placed or modified world object expands possible action options for another actor, with block/station/path evidence | object is private inventory only |
| `public_affordance_used` | another actor uses, approaches for use, or acts on the affordance with evidence refs | later use is assumed from proximity alone |
| `claim_or_obligation_event_recorded` | typed claim/obligation/request/promise/refusal/repair event with runtime refs | free-form relationship or memory prose is the only evidence |
| `unknown_material_delta` | material stake exists and action ran, but evidence is insufficient to classify gain/loss/access | no material stake was present |

## Social-Response Labels

Every social-response label needs a closed response window. Absence can be a
valid result only when the window opened, observed scope is known, and it closed.

| Label | Required evidence | Do not use when |
| --- | --- | --- |
| `no_observable_response` | response window closed with observed actors/scope and no qualifying reply, movement, action, or typed event | the other actor was not observable and no loaded-world caveat is recorded |
| `reply_accept_or_acknowledge` | chat/action event explicitly accepts, acknowledges, or confirms a request, warning, handoff, or material change | generic nearby speech has no relation to the candidate action |
| `reply_refuse_or_disagree` | chat/action event explicitly refuses, disagrees, contests, or rejects a request/action | silence is the only evidence |
| `approach_or_follow` | position/action refs show another actor approaches, follows, or stays near after the candidate action and within the window | pathing noise or random proximity is not separated |
| `retreat_or_avoid` | position/action refs show another actor moves away, avoids site/object, or chooses an alternate route after the action | loaded-world evidence cannot see the actor |
| `reciprocate_or_help` | another actor performs a helpful action tied to the prior action/request/material stake | cooperation is inferred only from friendly text |
| `contest_or_interrupt` | another actor blocks, contests, interrupts, takes back, counters, or disputes an action/material stake with evidence | action failure is only Mineflayer/pathing failure |
| `repair_or_compensate` | another actor repairs, returns, compensates, apologizes with material follow-through, or records typed repair event | apology text has no material or typed event evidence |
| `acts_on_changed_affordance` | another actor uses, avoids, inspects, maintains, or changes an affordance created/modified by the candidate action | affordance existence is not independently observed |
| `unknown_social_response` | a response occurred but cannot be classified from the artifact | no response-window evidence exists |

## Ambiguous Cases

Use these rules before assigning a social or material label:

- If an actor pathing failure looks like refusal, label the physical failure and
  add a confound note. Do not label refusal without a refusal event.
- If chat claims a handoff happened but inventory does not change, record
  communication-action mismatch, not material transfer.
- If another actor happens to pass nearby without a clear relation to the action,
  use `unknown_social_response` or no concrete response label.
- If scenario setup forces the only possible outcome, exclude the row from branch
  decisions or mark fixture leakage.
- If generated Mineflayer code fails, keep the generated-action confound separate
  from the actor's social choice.
- If loaded-world limits prevent seeing the affected actor, do not use
  `no_observable_response` without `loaded_world_limited`.

## Adjudication

Before using labels in a preflight:

- double-check a small pilot slice against this codebook;
- adjudicate disagreements by evidence refs, not by transcript vibe;
- record codebook changes before scoring predictor outputs;
- keep old rows readable, but do not silently reinterpret labels after seeing
  model performance.

If a label rule changes, record:

```yaml
schema_version: label-codebook-change/v1
changed_at:
changed_rule:
reason:
affected_labels:
rows_to_reaudit:
pre_or_post_scoring:
```

Post-hoc sharpening after seeing predictor outputs invalidates branch-triage
claims unless the affected rows are rerun or clearly excluded.

## Exclusion Reasons

Use explicit exclusion reasons instead of silently dropping rows:

- `action_never_started`;
- `schema_or_permission_failed_before_execution`;
- `missing_state_before`;
- `missing_post_observation`;
- `response_window_undefined`;
- `post_action_leakage_in_predictor_context`;
- `fixture_determined_label`;
- `loaded_world_scope_insufficient`;
- `generated_action_confound_unseparable`;
- `manual_label_without_runtime_evidence`.

## Control And Leakage Notes

Rows should retain tags that help later preflights avoid false lift:

- `physical_control`: likely solved by Minecraft prior.
- `no_stake_control`: same action family without material or social stake.
- `same_action_different_history`: same action class after different prior
  interaction history.
- `single_actor_control`: action without another actor in the response window.
- `scenario_forcing_risk`: fixture may determine the label.
- `dialogue_only`: social consequence exists only in chat.
- `loaded_world_limited`: absence claims are scoped by loaded chunks.

Scenario family metadata can justify inclusion tags and response-window choice.
It cannot assign class labels. Scenarios create action opportunities, not forced
outcomes.

## Examples And Anti-Examples

Correct:

```text
before: npc_a has 1 wooden_pickaxe; npc_b requested it.
action: npc_a drops wooden_pickaxe near npc_b.
after: npc_a inventory -1 wooden_pickaxe; item entity observed; npc_b picks it up.
labels: inventory_loss, inventory_gain, item_entity_changed,
        possession_or_access_granted
```

Incorrect:

```text
chat: "I trust you with this pickaxe."
no inventory/container/access evidence.
labels rejected: possession_or_access_granted, trust_increased
```

Correct:

```text
action: npc_a asks npc_b for food.
response window: npc_b says "I cannot spare it" and moves away.
labels: reply_refuse_or_disagree, retreat_or_avoid
```

Incorrect:

```text
npc_b fails to path to npc_a after a request.
labels rejected: reply_refuse_or_disagree, retreat_or_avoid
physical label: action_blocked_or_failed, with pathing confound note
```

## What Not To Do

- Do not add trust, emotion, fairness, role, norm, culture, or society labels
  until evidence-gated event records exist.
- Do not treat cooperation as success or refusal as failure.
- Do not let provider rationale fill missing evidence.
- Do not label screenshots directly.
- Do not hide uncertainty by choosing the closest positive label.
