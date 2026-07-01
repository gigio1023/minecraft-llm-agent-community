# Society Observable Preflight

Status: active planning protocol for the F-society branch. This does not select
F-society as the headline.

Search token: `SOCIETY_OBSERVABLE_PREFLIGHT`.

Recorded: 2026-06-29 (`Asia/Seoul`).

Use with:

- `Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
- `No-Regret-Core-Research-Protocol.md`
- `No-Regret-Core-Scenario-Catalog.md`
- `Transition-Row-Label-Codebook.md`
- `Goldilocks-Preflight-Protocol.md`
- `project-docs/specification/evidence-grounded-minecraft-society.md`

## Purpose

The Goldilocks prediction preflight can weaken or promote F-native/F-loop. It
cannot by itself prove or kill F-society.

F-society needs a different question:

```text
Do small embodied Minecraft actors form observable, recurring social-material
patterns when individual goals collide with possession, access, place, need,
refusal, repair, and continuation?
```

This preflight is a gate for that question. It is not a society headline, not a
Project Sid-style scale-up, and not a claim of human-like society.

## Research Object

The object is not prediction lift. It is an episode set with repeated
social-material opportunities:

```text
transition-row/v1 rows
+ response windows
+ actor memory/relationship/PlanBead refs
+ repeated object/place/resource references
+ controls where material stake is absent or changed
+ negative-result notes
```

The unit of review is a small episode, not a single transcript quote.

## Candidate Observables

F-society candidates must use observable targets such as:

- repeated access negotiation around the same item, station, container, or place;
- refusal followed by repair, compensation, avoidance, retry, or changed future
  request;
- public affordance created by one actor and later used, ignored, contested,
  maintained, or moved by another;
- co-presence persistence after a material event compared with a no-stake
  control;
- obligation-like lifecycle with typed request, promise, refusal, handoff,
  failure, repair, or closure events;
- future action changed by earlier material stake or social event;
- communication-action coherence under material constraints.

These are behavior targets. They do not require hidden labels such as trust,
friendship, culture, law, religion, or role identity.

## Required Inputs

The preflight may start only after the no-regret core has produced an auditable
batch.

Minimum smoke input:

- at least 40 non-excluded `transition-row/v1` rows;
- 2-3 actors in the measured windows;
- at least 2 seeds or reset sessions;
- at least 20 bounded response windows;
- at least 15 `interaction_opportunity` rows;
- at least 10 `material_stake` rows;
- at least 2 scenario-pressure families that can produce repeated interaction
  around an object, place, need, or affordance;
- label decisions follow `Transition-Row-Label-Codebook.md`.

Smoke input can expose obvious negative results or broken observables. It cannot
promote F-society beyond `core-first` or `defer`.

Minimum branch-triage input:

- at least 80 non-excluded rows;
- at least 3 fresh seeds or reset sessions;
- at least 30 bounded response-window rows;
- at least 20 `interaction_opportunity` rows;
- at least 15 `material_stake` rows;
- at least three scenario-pressure families attempted;
- at least one borrow/refuse/return or scarcity/allocation family;
- at least one public-affordance or blocked-access/repair family;
- at least one co-presence/divergence family;
- at least 10 rows where another actor does something other than immediate
  `no_observable_response`, or a negative result preserving that absence;
- at least one primary society observable declared before inspecting outputs;
- positive and negative/null cases for the chosen observable;
- no pattern dominated by one actor, one seed, one action family, or one fixture.

These are gate inputs, not proof of society.

## Threshold Rationale And Denominators

These numbers are cheap-review gates. They are meant to expose obvious absence,
fixture leakage, pathing noise, one-actor dominance, and one-scenario dominance
before the project scales the claim. They are not a sample-size justification and
not evidence of human-like society.

Report counts in separate denominators:

- `archived_rows`: all preserved transition rows and episode notes;
- `non_excluded_rows`: rows that survive evidence and leakage exclusions;
- `closed_response_windows`: windows with open/close timestamps and observable
  scope;
- `scorable_episode_units`: episodes that contain the declared primary
  observable and its matched/null control evidence.

Society-observable branch decisions must cite `scorable_episode_units`, not only
total rows or vivid transcript excerpts.

## Baselines And Controls

Use controls that can erase the claim:

- `single_actor_control`: the same material task without another actor.
- `no_stake_control`: nearby actors with no relevant possession, access, need, or
  place stake.
- `same_action_different_history`: same action class after different prior
  request/refusal/repair history.
- `dialogue_only_control`: chat event without material change.
- `scripted_fixture_control`: scenario text predicts the label by construction.
- `pathing_noise_control`: movement response compared with unrelated movement
  or loaded-world/pathing limits.
- `shuffled_history_control`: break the link between prior interaction history
  and later behavior; if the metric survives, it may not be measuring continuity.
- `actor_identity_permutation`: swap actor ids in analysis where possible; if the
  pattern survives unchanged, it may not depend on relationship or role context.

If the candidate observable survives only when fixture text tells the actors what
social result should occur, the result is not F-society evidence.

## Metrics

Report small, reviewable counts and timelines:

- repeated object/place/resource reference count;
- request/refusal/repair lifecycle count;
- public-affordance later-use or contest rate;
- co-presence after material stake vs no-stake control;
- communication-action mismatch rate;
- later action citing or using earlier evidence;
- response-window concrete response rate;
- post-goal continuation count after local task success/failure;
- negative-result rate by scenario family;
- cost, cycles, provider calls, and action success reported separately.

Do not collapse these into one society score.

## Falsifiers

F-society is weakened when:

- behavior is explainable by scenario script text;
- actors only produce chat with no material or future-action consequence;
- co-presence is pathing noise;
- every material interaction reduces to obvious single-actor mechanics;
- prior events do not affect later choices;
- response windows are mostly undefined or unobservable;
- the run needs many actors, institutions, laws, taxes, religions, or dramatic
  labels before any small pattern appears.

## Negative Results Worth Preserving

- Small actor runs show no repeated social-material patterns.
- Material stakes create inventory movement but no later social consequence.
- Refusals do not change future behavior.
- Public affordances are ignored.
- Actor memory records events but later action does not use them.
- Co-presence cannot be distinguished from pathing or loaded-world artifacts.
- F-society needs a different observable target than the current row labels.

These are useful results. They stop the project from scaling a weak demo.

## Decision Outputs

End the preflight with:

- `proposal-soundness-review/v1`;
- `experiment-sketch/v1`;
- `negative-result-ledger/v1` when weakened;
- `research-decision/v1` with `what_not_to_do_next`.

Valid decisions:

- `defer_f_society`;
- `revise_society_observable`;
- `collect_repeated_episode_batch`;
- `preserve_negative_result`;
- `headline_candidate_only_after_confirming_experiment`.

A society-observable candidate is allowed only if the chosen observable appears
across multiple closed windows, has evidence refs, beats its null/no-stake
control, and survives confound review.

## Decision Table

This table is a branch-triage rule, not a paper result.

```text
Substrate still weak
  no-regret core thresholds fail
  or response windows are mostly undefined
  or active actor count is below 2
  -> core-first; do not evaluate F-society from the transcript.

Observable absent
  chosen primary observable appears in fewer than 3 closed episodes
  or appears only in one actor/seed/action family
  -> preserve_negative_result or collect_repeated_episode_batch.

Null/control explains it
  no-stake, single-actor, shuffled-history, dialogue-only, or pathing-noise
  control shows the same pattern
  -> revise_society_observable or preserve_negative_result.

Fixture/script explains it
  scenario text, setup asymmetry, or hidden provider context determines the
  social label by construction
  -> fixture leakage; exclude the pattern from branch promotion.

Concrete repeated pattern exists
  primary observable appears across multiple closed windows
  has runtime evidence refs
  beats the declared null/no-stake control
  survives pathing, dialogue-only, actor-policy, and fixture-leakage checks
  -> collect a larger pre-registered repeated-episode batch.

Confirming experiment also passes
  the larger batch repeats the result under declared controls
  and the decision record names what F-society still does not claim
  -> headline_candidate_only_after_confirming_experiment.
```

The first positive society-observable preflight should still produce a next
experiment, not a society headline. The claim becomes stronger only when the
observable repeats under controls that could have erased it.

## Relationship To Goldilocks Prediction Preflight

The two gates answer different questions.

| Gate | Main question | Can select |
| --- | --- | --- |
| Goldilocks prediction preflight | Does history improve consequence prediction beyond LLM prior? | F-native/F-loop candidate |
| Society observable preflight | Do recurring social-material patterns appear under small embodied constraints? | F-society candidate |

One gate can be positive while the other is negative. A strong prediction result
does not prove society. A weak prediction result does not kill F-society unless
the society observable also fails.

Decision interaction:

| Prediction gate | Society gate | Result |
| --- | --- | --- |
| positive | positive | both branches may deserve separate confirming experiments |
| positive | negative | pursue predictor branch, defer F-society |
| negative | positive | F-society remains alive under its own target |
| negative | negative | preserve negative result, revise labels/scenarios, or defer |

## What Not To Do

- Do not call any 2-3 actor transcript a society result by itself.
- Do not scale to many actors to compensate for missing small-pattern evidence.
- Do not import Project Sid civilization language as a target.
- Do not use hidden trust, emotion, norm, or culture labels as ground truth.
- Do not treat automatic cooperation as better than grounded refusal.
- Do not use the preflight as a paper claim.
