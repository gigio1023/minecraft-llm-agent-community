---
sidebar_position: 1
---

# Advisory Social-Material World Action Model

Search token: `ADVISORY_SOCIAL_MATERIAL_WAM`.

Status: active research-direction spec.

Recorded: 2026-06-18 (`Asia/Seoul`).

## Purpose

This is the current research spine for the repository.

The project studies whether an advisory World Action Model can predict the
physical, material, and social consequences of embodied Minecraft actions in
wild, reproducible Minecraft worlds, and whether a coding-agent autoresearch
loop can improve that predictor without letting the actor or the proposer score
itself.

This direction replaces broader "Minecraft social simulation" or
"evidence-first benchmark" framing as the main research claim. Social
simulation remains the motivating domain, but the concrete research object is a
predictor of action-conditioned social-material transitions.

## Thesis

```text
Given a typed Minecraft/social state o, an instruction or actor frame l, and a
candidate embodied action a, can an advisory model predict the next physical,
material, and social delta o' well enough to support measurable social-material
reasoning in wild Minecraft?
```

The predictor is advisory. It does not select the executed action, fill missing
runtime arguments, declare success, close obligations, mutate memory, or override
runtime checks.

## Verification Boundary

Runtime verification is mandatory hygiene, not the research contribution.

The project must not present "verified action", "verifier-backed evidence",
seed/reset records, screenshots, transcripts, ledgers, or scoring scripts as a
novel or important differentiator by themselves. Those mechanisms are expected
engineering discipline for any non-toy embodied-agent experiment.

Verification matters because it gives the predictor a checkable target and keeps
claims reviewable. It is not a model-based verifier contribution, not a social
theory contribution, and not the headline.

Use this framing in new docs:

- Good: "prediction accuracy is measured against runtime-observed deltas";
- Good: "the verifier supplies the target labels for transition rows";
- Avoid as a headline: "we verify actions";
- Avoid as a contribution claim: "our benchmark is evidence-first";
- Avoid implying that screenshots or ledgers are the research result.

## Model Object

The active object is an advisory social-material WAM:

```text
input:
  state_before o
  actor frame l
  candidate action a

output:
  predicted_delta o'
  expected evidence refs/classes
  uncertainty and blockers
```

The state is typed Minecraft/social state, not pixel video:

- physical: position, inventory, blocks, containers, stations, vitals,
  durability, loaded-world limits;
- material: personal possession, material claims, access, weak commons, public
  affordances, open obligations or credits;
- social: relationship edges, requests, promises, refusals, repairs, trust or
  friction categories, remembered commitments;
- institutional/settlement: repeated routines, role pressure, public-affordance
  upkeep, norm records, post-goal continuation signals.

The action is a Mineflayer-backed embodied action at this repo's runtime
altitude. It may be a typed primitive, an Action Card, a promoted action skill,
or an Actor Turn-originated `author_mineflayer_action` candidate. It is not
keyboard/mouse imitation unless a future study explicitly introduces that lower
action space as a contrast condition.

## WAM, VLA, Actor, And Runtime

The current Actor Turn without prediction is VLA-shaped:

```text
p(a | o, l)
```

It reads state and chooses a tool/action. That is a reactive policy surface.

The WAM addition is the explicit predicted consequence:

```text
p(o' | o, l, a)
```

or, conceptually, the World Action Model form:

```text
p(o', a | o, l)
```

This repo realizes only the advisory prediction half first. Actor Turn still
selects the candidate action and the runtime still executes it. Prediction and
acting must be reported as separate axes.

## Layered Prediction Targets

### Layer 1: Physical

Predict inventory, block, container, position, vitals, durability, time, and
failure-mode deltas. This is a calibration layer. Passing it is not social
progress.

### Layer 2: Material / Economic

Predict who has or controls what after the action; whether access, claims,
weak-commons availability, public affordances, or costs to another actor change.
This is the highest-leverage layer because Minecraft social life becomes
measurable when possession and access change.

### Layer 3: Social

Predict obligation creation/fulfillment/violation, trust or friction category
change, relationship transition, request acceptance/refusal, memory commitment,
and future social cost. Social state must remain tied to observed events and
material consequences; it is not a hidden feeling score.

### Layer 4: Institutional / Settlement

Predict repeated routine reinforcement, norm conformance or violation,
public-affordance upkeep, and post-goal continuation. This layer is weakest and
must be treated as a hypothesis surface until multi-actor, multi-episode
evidence exists.

## Transition Row Dataset

Every meaningful Actor Turn should eventually be exportable as a
`social-material-transition/v1` row:

```text
state_before
candidate_action
predicted_delta
observed_delta
evidence_refs
actor/model/provider/partner/seed
cost/latency/token/action-count metadata
post_action_constraints
```

The row is the dataset unit. The predictor is scored on predicted-vs-observed
deltas. Acting success is recorded separately.

## Autoresearch Loop

The coding-agent autoresearch loop is method, not headline.

One admissible loop iteration is:

```text
seeded scenario/reset
-> actor rollout
-> transition rows + runtime observations
-> coding-agent proposal to improve one named artifact
-> fixed-budget rerun
-> score predicted-vs-observed delta with locked scoring code
-> keep/discard/archive
```

The loop may improve prompts, context projection, action surfaces, candidate
action skills, predictor code, scenario candidates, report templates, and
review probes.

The loop must not decide Minecraft truth, social truth, action success,
obligation closure, benchmark promotion, or scoring semantics. Any verifier or
scoring-code change is an explicit reviewed implementation change outside the
trial being scored.

## Benchmarks And Reports

Benchmarks are measurement instruments. They are not the research claim.

Good benchmark figures should show:

- predicted-vs-observed transition accuracy by layer;
- calibration and uncertainty, when available;
- acting outcome separately from prediction outcome;
- material flow and obligation lifecycle;
- cost, latency, tokens, action counts, and cycles;
- partner/seed/model sensitivity;
- failures and negative results.

Avoid making `no_progress`, `verified_progress`, screenshots, or report
completeness the central figure. Those are audit and diagnosis aids.

## Immediate Build Order

1. Keep the single-actor physical/material competence gate healthy enough to
   generate non-degenerate transition rows.
2. Add the `PredictedTransition`/`social-material-transition/v1` artifact path.
3. Start with a prompt-based zero-shot delta predictor and deterministic scoring
   over existing physical/material deltas.
4. Build the first dyadic material-social scenario around borrowing, lending,
   returning, refusal, or repair.
5. Add material-claim, obligation/credit, and public-affordance ledgers only as
   needed for transition labels.
6. Wire the coding-agent loop after the scoring target is stable.

## Non-Claims

Do not claim:

- a pixel/video world model;
- human-society fidelity;
- civilization-scale emergence;
- benchmark-maximization as the top-level goal;
- verified actions as a novel contribution;
- LLM-judge social truth;
- runtime logs, screenshots, or scoring scripts as the research result.

The contribution is the formulation and measurement of advisory
social-material consequence prediction in embodied Minecraft, and the bounded
autoresearch loop that attempts to improve that predictor.
