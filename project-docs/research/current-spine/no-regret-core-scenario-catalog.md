# No-Regret Core Scenario Catalog

Status: active planning catalog for row-producing scenario pressure. This is not
a benchmark ladder, not a society demo script, and not a runtime implementation
plan.

Search token: `NO_REGRET_SCENARIO_CATALOG`.

Recorded: 2026-06-29 (`Asia/Seoul`).

## Purpose

The no-regret core needs more than non-repeating actions. It needs small
Minecraft situations that can produce informative `transition-row/v1` rows
without scripting the outcome.

This catalog defines scenario pressure families for the first 2-3 actor runs.
The goal is not to prove social intelligence. The goal is to create enough
material stake, interaction opportunity, and bounded response windows for the
Goldilocks prediction preflight to test whether any layer has learnable signal
beyond an LLM prior, and enough repeated observables for the society-observable
preflight to test F-society separately.

Use with:

- `Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
- `Transition-Row-V1-Contract.md`
- `Transition-Row-Label-Codebook.md`
- `Goldilocks-Preflight-Protocol.md`
- `Society-Observable-Preflight.md`
- `Research-Value-Harness.md`

## Design Rules

Each scenario family must satisfy these constraints:

- it creates an action opportunity, not a forced label;
- actors may accept, refuse, ignore, fail, repair, or redirect;
- observed deltas come from runtime evidence, not actor self-report;
- another actor can plausibly observe or be affected inside a bounded window;
- the situation can fail without being treated as a bad run;
- the family can generate both positive and negative rows;
- the setup stays small enough for free-tier provider discipline.

Each family should also name at least one control shape when it is used for a
preflight:

- same action family without material stake;
- material stake without interaction opportunity;
- same action family after different interaction history;
- single-actor competence control;
- fixture-leakage check where scenario text cannot determine the label.

Avoid:

- scripted social outcomes;
- hidden planner fields that tell the actor what to do;
- labels such as trust, emotion, norm, role, or culture without evidence-gated
  events;
- many-actor institutions before 2-3 actor rows work;
- a single shared-chest loop as the whole social economy.

## Scenario-Pressure Family Schema

```yaml
schema_version: scenario-pressure/v1
family_id:
purpose:
actors:
  count:
  asymmetry:
material_stake:
interaction_opportunity:
allowed_outcomes:
candidate_action_classes:
expected_row_tags:
response_window:
runtime_evidence_needed:
labels_that_must_not_be_inferred:
confounds_to_report:
negative_result_value:
```

## Family A - Borrow / Refuse / Return

```yaml
family_id: borrow_refuse_return_tool_v1
purpose:
  Create rows where possession, access, request, refusal, return, or debt can
  change another actor's options.
actors:
  count: 2-3
  asymmetry:
    One actor has or can make a useful tool; another has a reason to request or
    use it.
material_stake:
  tool possession, tool access, durability, return, compensation, blocked use
interaction_opportunity:
  requester is nearby or has recent chat/request evidence before the action
allowed_outcomes:
  lend, refuse, ignore, use without returning, return, compensate, fail to find,
  repair after conflict
candidate_action_classes:
  say/request, transfer/drop, pick_up, use_tool, return_item, refuse, move_away
expected_row_tags:
  material_stake, interaction_opportunity
response_window:
  1-3 cycles or a small seconds horizon, closed explicitly
runtime_evidence_needed:
  inventory refs, item movement refs, chat refs, position/co-presence refs,
  verifier refs
labels_that_must_not_be_inferred:
  trust, generosity, selfishness, theft, obligation closure without cited event
confounds_to_report:
  tool use may be solved by Minecraft prior; actor-policy style may dominate
negative_result_value:
  If requests rarely change later behavior, the social-response target may be
  too weak under cheap 2-actor conditions.
```

## Family B - Shared Station / Public Affordance

```yaml
family_id: shared_station_public_affordance_v1
purpose:
  Test whether placing, using, moving, blocking, or maintaining a public
  affordance changes another actor's future options.
actors:
  count: 2-3
  asymmetry:
    One actor can create or move a station; another can benefit from or be
    blocked by it.
material_stake:
  crafting table, furnace, chest, light, bridge, safe path, marked hazard
interaction_opportunity:
  another actor is nearby, recently requested the station, or later encounters it
allowed_outcomes:
  create, use, ignore, move, block, contest, repair, maintain, duplicate
candidate_action_classes:
  craft, place_block, use_container_or_station, inspect, move_to, say, repair
expected_row_tags:
  physical_control, material_stake, interaction_opportunity
response_window:
  response may be immediate or next time the other actor reaches the affordance
runtime_evidence_needed:
  block placement refs, station use refs, position refs, actor action refs,
  chat refs when applicable
labels_that_must_not_be_inferred:
  public norm, ownership norm, cooperation, settlement role
confounds_to_report:
  physical placement is likely easy for LLM prior; social value depends on later
  other-actor use or avoidance.
negative_result_value:
  If public affordances do not affect another actor's behavior, early F-society
  claims should be deferred.
```

## Family C - Scarcity / Allocation

```yaml
family_id: scarce_food_or_material_allocation_v1
purpose:
  Create rows where one actor's possession of a useful resource changes another
  actor's request, approach, refusal, or later action opportunity.
actors:
  count: 2-3
  asymmetry:
    One actor has food, fuel, tool material, or station access; another lacks it
    or has a conflicting use.
material_stake:
  food, fuel, logs, cobblestone, iron, shelter access, station access
interaction_opportunity:
  lack or request is observable before the candidate action
allowed_outcomes:
  share, ration, refuse, trade, compensate, consume privately, save for later,
  fail to collect
candidate_action_classes:
  gather, consume, transfer, store, request, refuse, trade-like handoff
expected_row_tags:
  material_stake, interaction_opportunity
response_window:
  immediate reply plus later material action if a promise or refusal occurs
runtime_evidence_needed:
  inventory/vitals refs, container refs, chat refs, movement/co-presence refs
labels_that_must_not_be_inferred:
  fairness, obligation, debt, resentment without evidence-gated event
confounds_to_report:
  resource scarcity may be scenario-forced; avoid making the label determined by
  fixture text.
negative_result_value:
  If all rows reduce to obvious inventory movement, this layer is a control, not
  the headline.
```

## Family D - Blocked Access / Repair

```yaml
family_id: blocked_access_repair_v1
purpose:
  Test whether an actor responds to a material or spatial obstruction that
  affects another actor.
actors:
  count: 2-3
  asymmetry:
    One actor creates, notices, or can repair a blocker; another actor is affected
    by the blocker.
material_stake:
  blocked chest, blocked station, unsafe route, missing bridge, dark worksite,
  misplaced block
interaction_opportunity:
  affected actor is nearby, previously used the site, or reports the blocker
allowed_outcomes:
  repair, ignore, contest, avoid, ask for help, use workaround, worsen blocker
candidate_action_classes:
  inspect, mine, place_block, move_to, say, mark_hazard, repair
expected_row_tags:
  physical_control, material_stake, interaction_opportunity
response_window:
  immediate affected-actor movement/action plus next-cycle memory or request
runtime_evidence_needed:
  block scan refs, pathing/action failure refs, position refs, chat refs,
  verifier refs
labels_that_must_not_be_inferred:
  norm violation, apology, blame, trust repair without cited evidence
confounds_to_report:
  pathing failures can look like social refusal; classify Mineflayer/pathfinder
  issues separately.
negative_result_value:
  If repair never changes another actor's action opportunity, the social target
  may need richer setup or a different observable.
```

## Family E - Co-Presence And Divergence

```yaml
family_id: co_presence_divergence_v1
purpose:
  Create rows where actors staying near, following, separating, or avoiding each
  other becomes observable after a material or conversational event.
actors:
  count: 2-3
  asymmetry:
    Actors have partially aligned or conflicting local objectives.
material_stake:
  shared worksite, useful station, hazard, requested resource, disputed cache
interaction_opportunity:
  actors begin in interaction range or converge because of a prior event
allowed_outcomes:
  stay_near, follow, approach, retreat, split_tasks, avoid, interrupt, help
candidate_action_classes:
  move_to, say, work_at_site, inspect, wait, follow-like movement
expected_row_tags:
  interaction_opportunity
response_window:
  short movement/action window with loaded-world caveats
runtime_evidence_needed:
  position refs, co-presence refs, action refs, chat refs, loaded-world caveat
labels_that_must_not_be_inferred:
  friendship, hostility, coalition, society
confounds_to_report:
  movement/pathfinding noise can dominate; no-response is a valid label.
negative_result_value:
  If co-presence is mostly random or pathing-driven, do not use it as the
  F-society target.
```

## Minimum Coverage For The First No-Regret Batch

The first no-regret batch should try to cover at least three scenario-pressure
families, not just three item/action classes.

Recommended coverage before Goldilocks branch triage:

- at least one borrow/refuse/return or scarcity/allocation family;
- at least one public-affordance or blocked-access/repair family;
- at least one co-presence/divergence family;
- at least 20 rows where another actor could plausibly observe or be affected;
- at least 10 rows where the other actor does something other than immediate
  `no_observable_response`, or the batch should preserve that as a negative
  result instead of forcing social interpretation.

These numbers are not paper claims. They are pressure checks so the row batch is
not merely a set of obvious single-actor Minecraft mechanics.

Matched controls do not need perfect balance in the first pilot, but they must be
declared or explicitly deferred. If the project cannot define a no-stake or
same-action/different-history comparison for a scenario, that limitation belongs
in the batch audit.

## F-Society Target Candidates

F-society cannot be selected by the predictor preflight alone. It needs separate
observable targets. Candidate targets include:

- repeated access negotiation around the same object, station, or place;
- refusal followed by repair, compensation, avoidance, or changed future request;
- public affordance created by one actor and later used, maintained, contested, or
  ignored by another;
- co-presence persistence after a material event, compared with a no-stake
  control;
- obligation-like event lifecycle with evidence refs, without treating prose as
  ground truth.

Before any F-society headline, write a separate `research-claim/v1` and
`experiment-sketch/v1` for one of these targets.

## What Not To Do

- Do not turn this catalog into a scripted benchmark ladder.
- Do not require every run to include all families.
- Do not encode these families as hidden provider strategy fields.
- Do not call a family successful because the transcript sounds social.
- Do not treat missing response as missing data when the response window is
  defined and closed.
