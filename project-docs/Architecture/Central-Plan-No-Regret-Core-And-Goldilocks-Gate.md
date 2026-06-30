# Central Plan: No-Regret Core and the Goldilocks Gate

Status: ACTIVE central research and implementation plan.

Search token: `ACTIVE_CENTRAL_PLAN`. Related: `NO_REGRET_CORE`,
`GOLDILOCKS_GATE`, `TRANSITION_ROW_V1`,
`NO_REGRET_CORE_RESEARCH_PROTOCOL`, `TRANSITION_ROW_LABEL_CODEBOOK`,
`SEED_RESET_RECORD_V1`, `GOLDILOCKS_PREFLIGHT_PROTOCOL`,
`SOCIETY_OBSERVABLE_PREFLIGHT`, `RESEARCH_VALUE_HARNESS`.

Recorded: 2026-06-27 (`Asia/Seoul`). Revised: 2026-06-29 after applying the
research-value harness and the Cursor direction-reframe transcript.

Authority: subordinate to `AGENTS.md`. Where older docs conflict with this file
on research headline, benchmark order, transition-row naming, WAM terminology, or
pre-Goldilocks implementation targets, this file takes precedence unless the user
explicitly approves a new direction change.

## 0. TL;DR

Do not pick a research headline yet.

The project first needs a no-regret substrate:

```text
2-3 Minecraft actors
non-degenerate behavior
independent transition-row/v1 observation records
bounded other-actor response windows
free-tier cost discipline
```

Then it runs a Goldilocks prediction preflight:

```text
Does any consequence layer beat plain LLM prior when pre-action interaction
history is added?
```

That result can promote F-native or F-loop into the next serious experiment:

- F-native: native action-consequence modeling;
- F-loop: advisory consequence prediction plus verifier-grounded improvement.

F-society remains live only through a separate society-observable preflight. A
prediction-lift result alone must not prove or kill the society-dynamics branch.

Everything else is deferred: the loop, the three ledgers, foundation-model
training, institutions, settlement-scale claims, and Project Sid-style society
language.

## 1. Why This Plan Replaced The WAM Headline

The previous research direction headlined an advisory social-material World
Action Model (WAM): a predictor of physical/material/social consequences, scored
against runtime observations and separated from acting outcome.

The 2026-06-27 Cursor review and subagent work found a stronger and more honest
position:

- "WAM" is a risky banner name because robotics usage often treats a World Action
  Model as policy-coupled action generation, while this repo deliberately keeps
  runtime authority separate.
- "Structured", "verified", "evidence-backed", and "reproducible" are necessary
  audit surfaces, not research contributions.
- The empty-cell novelty story is too conjunction-shaped to trust by itself.
  Each axis is crowded; the interesting intersection must prove it has signal.
- The physical/material layer may be too easy because LLMs already know common
  Minecraft mechanics.
- The social layer may be interesting but too noisy, too policy-confounded, or
  too scenario-forced.
- The old predictor artifacts are not implemented: `predicted_delta`,
  `social-material-transition/v1`, `MaterialClaimLedger`, `ObligationLedger`,
  and `PublicAffordanceLedger` were verified as doc-only under `probe/src` on
  2026-06-27.
- The live runtime already has a re-badging trap:
  `evaluateExpectedOutcomeAgainstDeltas` compares an actor's self-declared
  `expected_outcome` with observed deltas. Renaming that into prediction accuracy
  would create circular evidence.
- The existing 60-cycle degeneracy blocks all downstream claims. Degenerate runs
  create degenerate rows.

The replacement is not "give up on consequence prediction." It is:

```text
Build the shared observation substrate first, then let a small preflight decide
whether consequence prediction, loop improvement, or society dynamics is the
right headline.
```

## 2. Current Research Object

Before the gate, the object of work is not a model and not the final research
claim. It is a data-producing experimental substrate:

```text
state_before + executed_action + observed_delta
```

The active no-regret data unit is `transition-row/v1`, defined in:

```text
project-docs/Architecture/Transition-Row-V1-Contract.md
```

Label decisions for those rows are governed by:

```text
project-docs/Architecture/Transition-Row-Label-Codebook.md
```

`transition-row/v1` is independent observation data. It does not contain
`predicted_delta`. Preflight predictions are separate artifacts joined by row id
after the observed row is closed.

Seed/reset provenance is a separate support artifact, defined in:

```text
project-docs/Architecture/Seed-Reset-Record-V1-Contract.md
```

Seed/reset records prevent hindsight laundering. They say whether a row batch
came from a fresh world seed, an auditable reset session, or an offline/control
path. They are audit evidence, not a research contribution by themselves.

## 3. Research Claim Candidates

These are live candidates, not accepted claims.

### Candidate A - Measurement / Methodological Claim

```text
This project can isolate action-conditioned Minecraft consequences from actor
competence and LLM prior by collecting independent transition rows and comparing
prediction arms against observed deltas.
```

Verdict now: `core-first`.

Risk: this becomes ordinary logging unless the rows enable a comparison that
existing Minecraft-agent task benchmarks do not already answer. This candidate
needs its own later `research-claim/v1` before any paper framing.

### Candidate B - Goldilocks Knowledge Claim

```text
There exists a Minecraft social-material layer where plain LLM prior is
insufficient but pre-action observed interaction history adds learnable signal.
```

Verdict now: `core-first`.

Falsifier: LLM prior already predicts the layer, or history-grounded prediction
does not improve beyond majority/no-response and current-observation baselines.

### Candidate C - Negative-Result Claim

```text
Some attractive Minecraft society or consequence-prediction framings have no
useful signal under cheap 2-3 actor conditions.
```

Verdict now: `core-first`.

Value: prevents the project from building a larger promotional society demo
around a non-existent target.

### Candidate D - F-Society Claim

```text
Under bounded embodied constraints, unprompted social patterns can arise from
colliding individual goals, material needs, access, possession, and repair.
```

Verdict now: `defer`.

Reason: F-society needs its own observable target, baseline, and falsifier. It
uses `Society-Observable-Preflight.md`, not the prediction preflight alone. It is
not automatically proven when prediction headroom exists and not automatically
killed when prediction headroom is absent.

The current project-level decision record is therefore a spine decision, not a
single accepted paper claim. See
`Research-Decision-Current-Spine-2026-06-29.md` for the separate branch-candidate
claim sketches and the conservative `core-first` verdict.

## 4. The No-Regret Core

The no-regret core is the shared dependency for all live candidates:

```text
A non-degenerate 2-3 actor Minecraft substrate that emits independent,
layer-tagged transition-row/v1 records under free-tier cost discipline.
```

### 4.1 Fix The 60-Cycle Degeneracy

This is the first blocker. Treat the old 60-cycle loop as substrate failure, not
social behavior.

Root-cause hypotheses:

- context compaction drops progress or blockers;
- observe/wait/remember repeats without state change;
- retry constraints fail to block identical targets;
- CycleGoal or Actor Turn selection collapses to one action family;
- social response windows never create useful pressure;
- actor work state is preserved but not action-relevant.

### 4.2 Emit Transition Rows

Use `No-Regret-Core-Research-Protocol.md`,
`Transition-Row-V1-Contract.md`, and `Transition-Row-Label-Codebook.md`.

Use `No-Regret-Core-Scenario-Catalog.md` to choose small scenario-pressure
families. The catalog is not a benchmark ladder. It exists so transition rows
include material stake and interaction opportunity instead of only obvious
single-actor Minecraft mechanics.

Minimum no-regret pilot acceptance:

- at least 2 fresh seeds or reset sessions;
- 2-3 actors present for the measured window;
- at least 40 non-excluded rows from executed runtime actions;
- at least 4 action classes represented;
- no single `(actor_id, action_kind, target_signature)` above 30% of rows;
- at least 60% of rows with classifiable physical, material, or social-response
  evidence, including scoped `no_*` or `no_observable_response` labels when the
  relevant window is defined and closed;
- at least 20 rows with bounded other-actor response windows;
- at least 15 rows tagged `interaction_opportunity`;
- at least 10 rows tagged `material_stake`.
- at least three scenario-pressure families attempted or a written reason why
  the run deliberately narrowed the family set.

If these fail, the result is `core inconclusive`. Do not move to Goldilocks by
renaming the run as social behavior.

### 4.3 Preserve Cost Discipline

Use the Gemini/Gemma free-tier path first. Run provider smoke checks before any
batch. A quota block is an environment blocker, not actor behavior.

### 4.4 Definition Of Done

The core is done when one closed reproducible 2-3 actor pilot batch, spanning at
least two declared fresh seeds or auditable reset sessions, emits usable
`transition-row/v1` rows that meet the no-regret acceptance thresholds.

No predictor, loop, ledgers, model training, or society headline is required for
this definition of done.

## 5. The Goldilocks Prediction Preflight

The preflight protocol lives in:

```text
project-docs/Architecture/Goldilocks-Preflight-Protocol.md
```

The key point: the preflight is a gate, not a final paper result.

Minimum branch-triage input:

- at least 80 rows;
- at least 3 fresh seeds or reset sessions;
- at least 30 rows with bounded other-actor response windows;
- at least 20 rows tagged `interaction_opportunity`;
- at least 15 rows tagged `material_stake`.

Predictor arms:

- majority/no-response;
- scripted heuristic where applicable;
- LLM prior over current row only;
- current observation without interaction history;
- history-grounded predictor with pre-action interaction history.

The decision requires per-layer prediction quality, calibration, uncertainty,
confound checks, and a written `research-decision/v1`. A positive preflight is a
reason to design the next confirming experiment, not proof of a final paper
claim.

This preflight mainly pressures F-native and F-loop. F-society is handled by the
society-observable preflight below.

## 5.1 The Society-Observable Preflight

The society-observable protocol lives in:

```text
project-docs/Architecture/Society-Observable-Preflight.md
```

It asks a different question:

```text
Do small embodied Minecraft actors form observable, recurring social-material
patterns when individual goals collide with possession, access, place, need,
refusal, repair, and continuation?
```

It uses repeated episodes, matched controls, response windows, and evidence-gated
social-material observables. It must not use Project Sid-style scale,
civilization language, or hidden trust/norm/culture labels as proof.

## 6. Branch Decision

### If The Core Is Still Degenerate

Verdict: `core-first`.

Do not write a paper framing. Fix the substrate.

### If Physical/Material Is Easy

Verdict: physical/material is a control layer.

Use it for calibration and sanity, not as the headline.

### If Social/Material Prior Is Already Strong

Verdict: F-native and F-loop are not justified for that layer.

F-society may remain alive only through `Society-Observable-Preflight.md`, with a
separate observable target and falsifier.

### If History Lift Is Real

Verdict: F-native/F-loop become candidates for a larger pre-registered
experiment.

Build order should remain smallest-first:

```text
compare-only preflight -> small learned transition model or distilled predictor
-> only then consider larger model training
```

### If Social Response Is Noise

Verdict: preserve a negative result.

Revise labels, change the target, or defer the branch. Do not build a larger
society demo to hide the result.

## 7. What Is Locked Now

- Retire "WAM" as the active banner name in new direction docs.
- Use concrete terms: action-consequence model, social-material transition model,
  advisory consequence predictor, and `transition-row/v1`.
- Keep runtime authority unchanged: verifier owns truth; schemas, permissions,
  helper bounds, and runtime checks remain binding.
- Keep prediction quality separate from acting outcome.
- Do not use `expected_outcome` as a target label.
- Treat verification, structured logs, screenshots, and reproducibility as
  hygiene unless the project explicitly studies verifier models.
- Preserve negative results.

## 8. What Is Deferred

Deferred until after the Goldilocks gate:

- advisory predictor loop as an active build target;
- `predicted_delta` in no-regret rows;
- `social-material-transition/v1` as an active row name;
- MaterialClaimLedger, ObligationLedger, and PublicAffordanceLedger;
- borrowed-tool/social-economy benchmark phase order;
- institutional or settlement-scale labels;
- foundation-model training;
- Project Sid-style civilization language;
- large multi-actor scaling.

## 9. Current Document Stack

Research spine:

- `project-docs/Architecture/Research-Documentation-Hierarchy.md`
- `project-docs/Architecture/Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
- `project-docs/Architecture/Research-Value-Harness.md`
- `project-docs/Architecture/Prior-Work-Proximity-Current-Spine-2026-06-29.md`
- `project-docs/Architecture/No-Regret-Core-Research-Protocol.md`
- `project-docs/Architecture/Transition-Row-V1-Contract.md`
- `project-docs/Architecture/Seed-Reset-Record-V1-Contract.md`
- `project-docs/Architecture/Transition-Row-Label-Codebook.md`
- `project-docs/Architecture/No-Regret-Core-Scenario-Catalog.md`
- `project-docs/Architecture/Goldilocks-Preflight-Protocol.md`
- `project-docs/Architecture/Society-Observable-Preflight.md`
- `project-docs/Architecture/Research-Decision-Current-Spine-2026-06-29.md`

Reference/archive:

- `project-docs/research-archive/2026-06-27/wam-direction-stress-test-and-reframe/`
- `project-docs/research-archive/2026-06-29/research-plan-realignment/`
- WAM-era benchmark and synthesis docs listed as reference in
  `Research-Documentation-Hierarchy.md`.

## 10. Next Actions

Research/documentation actions before runtime implementation:

1. Align Tier 0 and Tier 1 docs so none calls advisory WAM the active headline.
2. Mark WAM-era benchmark documents as reference/case-library material.
3. Ensure `Documentation-Map.md` and `Agent-Search-Index.md` route to the current
   spine.

Runtime actions after documentation alignment:

1. Reproduce and root-cause the 60-cycle degeneracy.
2. Implement `transition-row/v1` logging.
3. Collect the no-regret pilot batch within provider budget, following
   `No-Regret-Core-Research-Protocol.md`.
4. Run the Goldilocks prediction preflight when a prediction branch is being
   tested.
5. Run the society-observable preflight when F-society is being tested.
6. Re-plan the headline from `research-decision/v1`.

## 11. What Not To Do Next

- Do not start implementing ledgers or the loop before the preflight.
- Do not write a headline paper framing before transition rows and a branch-triage
  decision exist.
- Do not treat Goldilocks prediction lift as sufficient evidence for F-society.
- Do not turn a working verifier into the research contribution.
- Do not use Project Sid as a baseline unless reproducible code, logs, scoring, or
  independent replication exists.
- Do not judge the project from a single vivid transcript.
- Do not treat `80 rows` as proof. It is only a gate input.
