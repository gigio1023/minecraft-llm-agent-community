# Research Decision: Current Spine After WAM Reframe

Status: active research decision record.

Search token: `CURRENT_RESEARCH_DECISION_2026_06_29`.

Recorded: 2026-06-29 (`Asia/Seoul`).

This record applies `minecraft-research-value-harness` to the current project
direction. It is intentionally conservative: the verdict is not that the final
research claim is ready, but that the only justified next state is the no-regret
core followed by the relevant prediction or society-observable branch preflight.

## Current Spine Decision, Not A Paper Claim

The current artifact is a `research-decision/v1` for work ordering. It is not a
single accepted `research-claim/v1`.

The decision is:

```text
Build the no-regret core first, then let the relevant branch preflight decide
which smaller research claim is worth a confirming experiment.
```

This distinction matters. The whole spine is an operating plan. A paper claim
must be narrower: it must name one object, one observable target, baselines that
could erase it, and a falsifier.

## Candidate `research-claim/v1` Sketches

These sketches are live candidates only. None is selected before the no-regret
core and the relevant branch preflight.

### Candidate A - Measurement / Methodological Claim

```yaml
schema_version: research-claim/v1
claim_id: measurement-independent-minecraft-transition-rows
research_object:
  Closed transition-row/v1 batches from 2-3 actor Minecraft runs.
conditions:
  - Mineflayer-backed runtime actions.
  - Runtime/verifier owns Minecraft truth.
  - Row labels are assigned after action and response windows close.
  - Predictor artifacts are separate and joined by row_id only during analysis.
observable_target:
  Whether independent state_before + executed_action + observed_delta rows can
  separate action consequence evidence from acting competence and actor
  self-report.
baseline_that_could_erase_it:
  - actor expected_outcome rebadged as target
  - actor task success without prediction
  - ordinary runtime verification/logging with no separable prediction target
research_gap_type:
  - methodological
  - measurement
value_type:
  - measurement
  - systems
prior_work_gap:
  Existing Minecraft-agent systems often report task progress, skill acquisition,
  or verified execution. This candidate is only meaningful if the rows enable a
  later comparison those systems do not already answer.
falsifier:
  - Rows are mostly missing, circular, or actor-self-reported.
  - Labels cannot be reconstructed from evidence refs.
  - The dataset supports only ordinary execution debugging.
non_goals:
  - claiming logging or verification as novelty
  - proving F-native, F-loop, or F-society
evidence_refs:
  - project-docs/research/current-spine/transition-row-v1-contract.md
  - project-docs/research/current-spine/transition-row-label-codebook.md
  - project-docs/research/current-spine/no-regret-core-research-protocol.md
unknowns:
  - Whether the rows will expose a non-trivial prediction or society target.
```

### Candidate B - Goldilocks Knowledge Claim

```yaml
schema_version: research-claim/v1
claim_id: history-lift-for-minecraft-social-material-consequences
research_object:
  A closed no-regret transition-row/v1 batch evaluated by pre-registered
  predictor arms.
conditions:
  - At least the Goldilocks branch-triage input thresholds are met.
  - Predictor inputs are cut off before action_started_at.
  - Acting outcome is reported separately from prediction quality.
observable_target:
  Per-layer prediction quality over observed physical, material, and
  social-response labels.
baseline_that_could_erase_it:
  - majority_or_no_response
  - scripted_heuristic
  - LLM-prior from state_before + action with no interaction history
  - current_observation without prior interaction history
research_gap_type:
  - knowledge
  - methodological
value_type:
  - scientific
  - negative-result
prior_work_gap:
  The remaining question is whether pre-action interaction history adds signal
  for material-grounded Minecraft consequences beyond LLM prior, not whether
  Minecraft agents can complete tasks.
falsifier:
  - LLM prior already predicts the target layer.
  - History-grounded prediction does not improve over baselines.
  - Lift is explained by one action family, fixture leakage, or actor-policy
    style.
non_goals:
  - final paper claim from the pilot preflight
  - society evidence from prediction lift alone
evidence_refs:
  - project-docs/research/current-spine/goldilocks-preflight-protocol.md
  - project-docs/research/current-spine/prior-work-proximity-current-spine-2026-06-29.md
unknowns:
  - Whether social-response labels are learnable, noisy, or prior-solved.
```

### Candidate C - Negative-Result Claim

```yaml
schema_version: research-claim/v1
claim_id: cheap-minecraft-social-material-target-negative-result
research_object:
  Failed or inconclusive no-regret/Goldilocks/society-observable preflight
  results preserved with row, label, control, and confound evidence.
conditions:
  - The failure is produced by a closed, auditable batch.
  - Missing evidence, provider quota, pathing noise, and fixture leakage are
    reported separately.
observable_target:
  Which attractive Minecraft consequence-prediction or society framings fail
  under cheap 2-3 actor conditions.
baseline_that_could_erase_it:
  - better label set
  - better scenario pressure
  - larger but still controlled confirming batch
  - a prior work artifact that already reports the same negative finding
research_gap_type:
  - evidence
  - contradictory
value_type:
  - negative-result
prior_work_gap:
  Public demos often make society or long-horizon claims without raw runs and
  scoring artifacts. A careful negative result can prevent this repo from
  scaling a weak target.
falsifier:
  - The run was too broken to test the claim.
  - The negative result is actually an environment/provider blocker.
  - A close reproducible prior already answers the same failure mode.
non_goals:
  - treating failure as proof that Minecraft sociality is impossible
  - hiding weak evidence behind scale-up
evidence_refs:
  - project-docs/research/current-spine/no-regret-core-research-protocol.md
  - project-docs/research/current-spine/goldilocks-preflight-protocol.md
  - project-docs/research/current-spine/society-observable-preflight.md
unknowns:
  - Which branch, if any, will produce the first meaningful negative result.
```

### Candidate D - F-Society Observable Claim

```yaml
schema_version: research-claim/v1
claim_id: repeated-small-minecraft-social-material-patterns
research_object:
  Repeated small episodes around item, station, place, access, need, refusal,
  repair, or continuation in 2-3 actor Minecraft runs.
conditions:
  - No-regret core is auditable.
  - A primary society observable is declared before output inspection.
  - Positive and null/control cases are both present.
observable_target:
  Recurring evidence-gated social-material patterns such as access negotiation,
  refusal followed by repair, public-affordance use/contest, or co-presence
  change after material stake.
baseline_that_could_erase_it:
  - no_stake_control
  - single_actor_control
  - shuffled_history_control
  - dialogue_only_control
  - pathing_noise_control
  - scripted_fixture_control
research_gap_type:
  - knowledge
  - population/application
  - evidence
value_type:
  - scientific
  - negative-result
prior_work_gap:
  Dialogue social simulations and sensational Minecraft society reports do not
  settle whether small embodied Minecraft actors form recurring patterns through
  material constraints and future action.
falsifier:
  - Pattern appears only in dialogue.
  - Pattern is explained by pathing, script text, or fixture setup.
  - Prior events do not change later behavior relative to controls.
  - The claim needs many actors or institutions before any small observable
    appears.
non_goals:
  - human-like society
  - Project Sid-style civilization language
  - hidden trust, culture, norm, law, or religion labels
evidence_refs:
  - project-docs/research/current-spine/society-observable-preflight.md
  - project-docs/research/current-spine/no-regret-core-scenario-catalog.md
unknowns:
  - Whether any chosen observable repeats across actors, seeds, and controls.
```

## `proposal-soundness-review/v1` For The Spine Decision

This review scores the current work-ordering spine, not a bundled final paper
claim. Each candidate claim above still needs its own later soundness review
before it can become a headline candidate.

```yaml
schema_version: proposal-soundness-review/v1
verdict: core-first
scores:
  object_clarity: 4
  gap_quality: 4
  significance: 4
  falsifiability: 5
  baseline_pressure: 5
  observability: 3
  confound_control: 3
  feasibility: 4
  negative_result_value: 5
strongest_objection:
  The most rigorous layers may be too easy for LLM prior, while the interesting
  social layers may be too noisy, policy-confounded, or scenario-forced.
revision_needed:
  Implement no-regret transition rows and run the relevant branch preflight before
  accepting any headline. F-native/F-loop use the Goldilocks prediction
  preflight; F-society uses the society-observable preflight.
cheap_disambiguating_test:
  Collect the minimum no-regret pilot batch, then run the prediction arms over
  social-response and material-stake rows for F-native/F-loop and the separate
  society-observable gate for F-society, both as branch triage rather than paper
  proof.
why_not_implementation_yet:
  Documentation needed to prevent old WAM-era plans from reintroducing
  predicted_delta, ledgers, or borrowed-tool phase order before the gate.
```

## `experiment-sketch/v1`

```yaml
schema_version: experiment-sketch/v1
uncertainty_to_reduce:
  Whether any layer has useful prediction headroom beyond LLM prior and whether
  pre-action history adds signal.
hypothesis:
  Interaction history will not help obvious physical Minecraft mechanics, but it
  may help material-stake/social-response rows where another actor can observe
  or be affected by an action.
candidate_layer:
  social_response and material_stake rows, with physical/material mechanics as
  controls.
independent_variable:
  Predictor context arm: majority/no_response, scripted heuristic, LLM-prior,
  current_observation, history_grounded.
observed_target:
  transition-row/v1 observed_delta labels assigned from runtime evidence after
  the action and response window close.
baseline:
  majority_or_no_response and LLM-prior.
run_protocol:
  Build no-regret core, collect at least 80 qualifying rows across at least 3
  seeds/reset sessions, then evaluate pre-registered predictor arms as a
  phase-0 F-native/F-loop branch-triage gate. Use
  Society-Observable-Preflight.md for F-society branch triage.
minimum_data:
  - 80 non-excluded rows
  - 30 rows with other-actor response windows
  - 20 interaction_opportunity rows
  - 15 material_stake rows
  - scorable_rows_by_layer reported for every branch decision
  - at least three attempted scenario-pressure families, unless the decision
    record says why the batch was deliberately narrower
artifacts_needed:
  - transition-row/v1 batch
  - label-codebook audit notes
  - preflight-prediction/v1 records
  - society-observable episode/control records when F-society is under review
  - per-layer metric table
  - calibration table
  - descriptive bootstrap confidence intervals with declared resampling unit,
    when stable enough for pilot reporting
  - confound-check notes
evaluator:
  Deterministic scoring over closed transition rows, with manual review only for
  label/schema audit and not as hidden ground truth.
stop_condition:
  A research-decision/v1 chooses one official verdict and a concrete next_action,
  such as collect-larger-confirming-batch, revise-labels, preserve-negative-result,
  or stop-this-branch.
negative_result_interpretation:
  No lift, prior dominance, or label noise is a valid result that narrows or kills
  F-native/F-loop for the tested layer.
cost_bound:
  Free-tier provider discipline; quota block is an environment blocker.
```

## `negative-result-ledger/v1`

```yaml
schema_version: negative-result-ledger/v1
result: preserved-potential-negative-results
what_failed:
  Not yet known. The current plan explicitly preserves failures instead of
  hiding them behind bigger demos.
what_it_rules_out:
  Future entries may rule out trivial physical prediction, noisy social-response
  labels, or scenario-forced society claims.
what_it_does_not_rule_out:
  A different label set, a different Minecraft layer, F-society with a separate
  observable target, or later model work after stronger evidence.
next_decision: collect-more
archive_tag: goldilocks-negative-result
evidence_refs:
  - project-docs/research/current-spine/goldilocks-preflight-protocol.md
```

## `research-decision/v1`

```yaml
schema_version: research-decision/v1
decision: use_no_regret_core_then_goldilocks_gate_as_the_current_spine
verdict: core-first
evidence_used:
  - Cursor direction-reframe transcript and subagent summaries.
  - 2026-06-27 stress-test archive.
  - Current docs showing old predictor/ledger artifacts were doc-only.
  - Research-value harness pressure tests.
alternatives_considered:
  - Advisory WAM headline now.
  - Autoresearch loop as the headline now.
  - Borrowed-tool/social-economy benchmark ladder now.
  - Project Sid-style society scale-up.
strongest_objection:
  The project may discover that small Minecraft actor runs do not produce a
  learnable, non-trivial social-material target.
accepted_risk:
  The no-regret core may still mostly produce engineering value. That is why the
  branch preflights can kill or defer branches.
next_action:
  Finish documentation alignment, then implement the no-regret core using the
  no-regret research protocol and label codebook.
what_not_to_do_next:
  Do not build the predictor loop, three ledgers, foundation-model training,
  borrowed-tool phase ladder, or society-scale demo before transition rows and
  the relevant branch-preflight evidence exist.
```
