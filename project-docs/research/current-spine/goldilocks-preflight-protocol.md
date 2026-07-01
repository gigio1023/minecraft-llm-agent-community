# Goldilocks Prediction Preflight Protocol

Status: active planning protocol for F-native/F-loop branch triage. Do not run a
Goldilocks prediction preflight without this protocol or a documented successor.

Search token: `GOLDILOCKS_PREFLIGHT_PROTOCOL`.

Recorded: 2026-06-29 (`Asia/Seoul`).

## Research Question

The preflight asks one question:

```text
Is there a Minecraft consequence layer where a plain LLM prior is insufficient,
but pre-action observed interaction history adds learnable signal?
```

This is not a paper claim by itself. It is a cheap uncertainty-reducing gate that
decides whether a branch deserves a larger pre-registered experiment, should be
kept as a control, or should be killed/deferred.

## Required Inputs

The input is a closed `transition-row/v1` batch from the no-regret core.

Minimum branch-triage batch:

- at least 80 rows;
- at least 3 fresh seeds or reset sessions;
- at least 30 rows with bounded other-actor response windows;
- at least 20 rows tagged `interaction_opportunity`;
- at least 15 rows tagged `material_stake`;
- at least three scenario-pressure families from
  `No-Regret-Core-Scenario-Catalog.md` attempted, or a written reason why the
  batch is deliberately narrower;
- row labels assigned from runtime observations, not actor self-report;
- all predictor inputs cut off before `action_started_at`.

Smaller batches may be used for harness smoke tests only. They cannot promote a
branch beyond `core-first`.

For every metric table, split row counts into:

- `archived_rows`: all closed rows preserved for audit;
- `non_excluded_rows`: rows not excluded by the rules below;
- `scorable_rows_by_layer`: rows with enough evidence to score a specific layer.

Branch decisions must cite the scorable denominator for the layer being judged.
Do not use a broad archived-row count to support a narrow social-response claim.

## Threshold Rationale

These thresholds are pilot gates, not statistical-power claims.

| Input | Why this minimum exists | What it does not prove |
| --- | --- | --- |
| 80 rows | enough to expose obvious prior dominance, label noise, leakage, and one-action-family collapse before building a larger experiment | paper-ready significance, broad Minecraft generalization, or stable effect size |
| 3 fresh seeds or auditable reset sessions | catches seed/setup dependence better than a single world while staying cheap | robust seed generalization |
| 30 bounded response windows | makes social-response baselines and absence labels inspectable | that social behavior is rich or society-like |
| 20 `interaction_opportunity` rows | prevents a prediction test made only of isolated single-actor mechanics | that interaction actually changed behavior |
| 15 `material_stake` rows | ensures some rows involve possession, access, resource, place, or affordance stakes | that the stake produced a social consequence |
| 3 scenario-pressure families or declared narrowing | reduces single-fixture overfitting and makes narrowing explicit | benchmark coverage or a complete social taxonomy |

If a threshold is missed, the correct decision is usually `core-first`,
`collect-more`, `revise-labels`, or `preserve-negative-result`, not headline
selection. If a threshold is changed, write the new threshold and rationale
before predictor outputs are inspected.

## Row Exclusion Rules

Exclude rows from branch-triage decisions when:

- `row_quality.verdict` is `excluded`;
- the action never started;
- the structured action args failed schema/permission validation before execution;
- the required state snapshot or evidence refs are missing;
- the response window is undefined for a social-response metric;
- post-action observations leak into predictor context;
- the row is generated entirely from a fixture or hand-authored event script.

Keep excluded rows in the archive with reasons. Exclusion is itself useful
diagnostic evidence.

## Predictor Arms

Run the same closed row set through these arms:

1. `majority_or_no_response`: majority label per layer; for social response, the
   `no_observable_response` baseline is reported explicitly.
2. `scripted_heuristic`: simple Minecraft rules or Mineflayer routine, when a
   rule is obvious enough to write down before seeing outputs.
3. `llm_prior`: `state_before` plus `executed_action`, no pre-action interaction
   history beyond the current row.
4. `current_observation`: current typed observation with no prior interaction
   history. This separates "the current world already says it" from actual
   history lift.
5. `history_grounded`: same predictor with bounded pre-action interaction history,
   relationship refs, open-obligation refs, and prior material-stake events.

Optional ablations, if enough rows exist:

- `dialogue_only`;
- `material_only`;
- `no_actor_identity`;
- `no_generated_action_rows`.

## Label Sets

Use the delta class set from
`project-docs/research/current-spine/transition-row-v1-contract.md` and the evidence rules
from `project-docs/research/current-spine/transition-row-label-codebook.md`.

Physical and material labels are multi-label sets. Social-response labels are
multi-label sets with one explicit `no_observable_response` class when nothing is
observed inside the window.

Do not score hidden trust, intention, emotion, or norm categories as ground truth
unless they are represented as evidence-gated relationship or obligation events.

## Metrics

Report by layer and predictor arm:

- macro-F1 over class labels;
- micro-F1 when class imbalance is severe;
- exact-set match rate for physical/material controls;
- Brier score over confidence;
- ECE or another pre-registered calibration measure;
- bootstrap confidence intervals grouped by seed/session when possible;
- per-action-family breakdown;
- acting outcome and action success separately from prediction quality.

Never fold task success, verifier pass rate, or action-skill execution success
into prediction accuracy.

Multi-label scoring must be declared before predictor outputs are inspected.
Default scoring is per-label one-vs-rest for each layer, with exact-set match as
a secondary diagnostic. Excluded rows are not scored. `unknown_*` labels should
be reported separately unless the experiment sketch explicitly says they are a
target class. Confidence records used for Brier/ECE must name the label or set
being scored; do not report calibration from unstructured prose confidence.

## Confound Checks

Run these checks before accepting any branch decision:

- LLM Minecraft prior pressure: if physical/material labels are solved by common
  Minecraft knowledge, mark them controls, not research headroom.
- Scenario-forcing pressure: if a scenario determines the label by construction,
  report it as fixture leakage and do not use it as headline evidence.
- Actor-policy confound: the same model that chose the action may make the
  outcome predictable from its policy style, not from world history.
- Generated-action confound: generated Mineflayer code failures can erase or
  fabricate consequence signals; report these rows separately.
- Dialogue-only collapse: if the social label is only chat text with no material
  or behavioral consequence, do not claim embodied social-material prediction.
- Row repetition: if one action family dominates the lift, report the branch as
  inconclusive unless the project deliberately studies that family.

## Decision Table

These thresholds are pilot defaults for branch triage, not final statistical
claims. If changed, write the new thresholds before seeing predictor outputs.

```text
Physical/material LLM-prior high
  physical or material macro-F1 >= 0.85
  -> control layer only; not a headline.

Social/material prior already high
  social_response macro-F1 >= 0.75 and Brier <= 0.20
  -> F-native and F-loop are not justified for that layer.
     F-society remains possible only under a separate claim.

History lift exists
  social_response LLM-prior macro-F1 <= 0.55
  history_grounded lift >= +0.10 macro-F1
  history_grounded beats majority/no_response, current_observation, and any
    declared scripted heuristic on the same scorable rows
  bootstrap CI lower bound over lift > 0
  and lift is not explained by one action family
  -> F-native/F-loop become candidates for a larger pre-registered experiment.

Noise or no learnable lift
  social_response poor and history lift < +0.05
  or CI crosses 0
  -> do not force a predictor; revise labels, collect a better substrate, or
     preserve this as a negative result.

In-between
  -> collect more rows, sharpen labels, or reduce confounds.
```

The numerical score cutoffs are conservative pilot defaults. They are meant to
avoid building a predictor branch when the prior already solves the target or
when the observed target is mostly noise. They should not be reported as final
effect-size thresholds without a later pre-registered confirming experiment.

Pilot confidence intervals are descriptive uncertainty notes, not confirmatory
inference. The preflight must predeclare CI level and resampling unit. Prefer
grouping by seed/reset session when enough sessions exist. If the grouped
bootstrap is unstable at pilot size, the result must be `in-between`,
`collect-more`, or `preserve-negative-result`, not branch promotion.

## Branch Outputs

Every run must end with:

- `proposal-soundness-review/v1`;
- `experiment-sketch/v1`;
- `negative-result-ledger/v1` when a branch is weakened;
- `research-decision/v1` with `what_not_to_do_next`.

The decision is not valid without `what_not_to_do_next`.

Valid preflight decisions are:

- keep as a control layer;
- collect a larger pre-registered batch;
- revise labels or scenario families;
- preserve a negative result;
- promote one branch to `headline-candidate` only when the result survives the
  confound checks and the decision explicitly names the next confirming
  experiment.

This protocol can promote only prediction branches such as F-native or F-loop.
F-society uses `Society-Observable-Preflight.md`; prediction lift alone is not
society evidence.

## Negative Results Worth Preserving

Meaningful negative results include:

- physical/material labels are too easy for LLM prior;
- social response is mostly `no_observable_response`;
- history does not improve prediction;
- history improves only because scenarios are over-scripted;
- generated action quality dominates consequence labels;
- multi-actor runs remain degenerate under 2-3 actors;
- F-society needs a different observable target than the preflight labels.

These results are not failures. They prevent the project from building a larger
demo around an uninteresting target.

## What Not To Do

- Do not claim the preflight proves a final paper result.
- Do not use 80 rows as a magic number. It is a cheap gate input, not statistical
  certainty or a paper-ready sample size.
- Do not pick F-native, F-loop, or F-society from intuition after seeing a few
  vivid transcripts.
- Do not treat prediction lift as sufficient evidence for F-society.
- Do not add loop, ledgers, institutions, laws, taxes, religions, or many-actor
  claims before the branch decision supports them.
