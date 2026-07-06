# Central Plan V2: Embodied Co-Actor Legibility

Status: ACTIVE central research and implementation plan.

Search token: `ACTIVE_CENTRAL_PLAN`. Also: `CO_ACTOR_LEGIBILITY`,
`EXPERIMENT_DECLARATION_V1`, `SELF_SIMULATION_GAP`, `POLICY_COPY_BASELINE`.

Recorded: 2026-07-05 (`Asia/Seoul`). Amended: 2026-07-06 (section 8.1
depth-not-scale substrate premise, user-confirmed in-session; build plan in
section 9 expanded into
`embodied-co-actor-legibility-implementation-plan.md`).

Authority: subordinate to `AGENTS.md`. This plan supersedes
`central-plan-no-regret-core-and-goldilocks-gate.md`,
`goldilocks-preflight-protocol.md`, `no-regret-core-research-protocol.md`, and
`no-regret-core-implementation-campaign.md` as active direction. The user
approved this direction change in-session on 2026-07-05 together with the
`ZERO_COST_IMPLEMENTATION_RULE` in `AGENTS.md`. Superseded docs stay in place
as audit trail with superseded status headers.

## 0. TL;DR

One preregistered experiment replaces the staged gate program:

```text
Can an observer model, given ONLY public interaction history, predict a
soul-grounded embodied Minecraft co-actor's next-turn social-response and
material-access labels better than prior, current observation, and
policy-fingerprint baselines — and does that predictability track how
consistent the co-actor's private disposition actually is?
```

The experiment has its own positive control, null condition, killer baselines,
and stop-results built in. Both outcomes are informative. Nothing else is an
active research target until this experiment produces a decision.

## 1. Why V2 Replaced The Staged Program

The 2026-06-29 spine (no-regret core -> Goldilocks preflight -> branch triage)
was epistemically careful but built for a world where implementation was
expensive. Under `ZERO_COST_IMPLEMENTATION_RULE`, staged build-gating loses its
rationale: rows, predictor arms, scorer, and diagnostics can be built together
and run as one pipeline. What must survive from the old program is scientific
discipline, not build sequencing.

Findings from the 2026-07-05 first-principles review that forced the redesign:

- The entire no-regret pipeline (~4,100 LOC) existed only in unpushed
  `stash@{0}` (commit `87591a2`), while status docs described it in present
  tense. Preserved at branch `backup/no-regret-core-stash-2026-06-30`.
- `shuffled_history_null` was missing from the Goldilocks arm list and
  promotion criterion — the single most important leak control was not gating.
- All social responses across eleven controls were `no_observable_response`
  because response windows closed on the immediate post-action observation and
  cross-actor observation was unwired in the live path
  (`probe/src/runtime/socialCycleRunner.ts:1069` creates one bot; `:1228`
  observes without `targetBot`; `visibleActors` always empty; no chat capture).
- The actor-policy circularity was named but never tested: social-response
  labels are outputs of other LLM actors, so a same-family predictor is partly
  simulating itself. V2 turns this into a measured quantity.
- "WAM" collides with the established robotics term World Action Model
  (joint `p(o',a|o,l)`); the term is retired everywhere except history.

What V2 keeps from the old program: the `transition-row/v1` row shape and
evidence rules, the label codebook, seed/reset provenance, denominator
discipline (`archived` / `non_excluded` / `scorable_by_layer`), negative-result
preservation, and provider quota gates. Those are load-bearing. The staged
acceptance thresholds become computed diagnostics (section 7), not build gates.

## 2. Research Object And Claim

The object is the predictability of embodied LLM co-actors:

```text
observer(public history H_t, state o_t, executed action a_t)
  -> predicted social_response + material_access labels of other actors
  -> scored against runtime-observed transition-row/v1 labels
```

`research-claim/v1`:

```yaml
schema_version: research-claim/v1
claim: >
  In preregistered matched Minecraft material-stake episodes, a
  held-out-family observer using only public pre-action interaction history
  predicts a stable private-ActorSoul responder's next-turn social_response
  and material_access labels with at least +0.10 macro-F1 lift and positive
  grouped-bootstrap lower-bound lift over per-condition majority/no_response,
  scripted-heuristic, policy-copy, current-observation, shuffled-history, and
  last-response-carried-forward baselines, while the same lift is present in
  the scripted positive control and absent in the soul-resampled null.
negative_form: >
  If no such lift exists even for maximally consistent responders, embodied
  LLM co-actors are illegible from public history under cheap conditions —
  a result that directly constrains multi-agent LLM system design.
```

This is a legibility/other-agent-modeling claim, not a world-model claim. Do
not describe V2 as "world modeling", "action-consequence world model", or
"social simulation". Physical/material Minecraft mechanics are control layers
(`probe/src/runtime/goals/actorEpisode/outcomeContract.ts` maps primitive
status to delta kinds nearly 1:1 — that layer is tool-status classification
and can never be the headline).

## 3. Experimental Design

### 3.1 Conditions (disposition dose-response)

Responder consistency is the independent variable:

| Condition | Responder | Role |
| --- | --- | --- |
| `scripted_responder` | fixed content-conditioned policy (new `scripted-social` provider) | positive control: history MUST help here, or the measurement is broken |
| `stable_soul` | live LLM actor with one private ActorSoul held fixed across episodes | the real condition |
| `resampled_soul` | live LLM actor with ActorSoul resampled every episode | null: history CANNOT help beyond generic prior |

The headline measurement is the predictability curve across these conditions,
scored with per-condition normalized metrics (3.5). Conditions must be
declared, assigned, and counterbalanced before any outcome inspection.

### 3.2 Public/private boundary

The predictor receives ONLY a curated public-history artifact:

- other actors' observed actions, chat, movement, co-presence, and material
  deltas as recorded in runtime evidence;
- never: ActorSoul text, LifeGoal, memory, PlanBeads, provider inputs/outputs,
  or relationship prose of the target actor.

Soul privacy is currently convention-only (`soul.md`, provider-input snapshots
under the actor workspace contain soul text verbatim). V2 requires an explicit
public-artifact export with an allowlist; the predictor never gets raw
workspace access. Actor-identity permutation and prompt-shape checks must
verify the condition cannot be read off superficial features.

### 3.3 Response windows

A social/material response window opens after the focal action executes and
closes only after every other active actor has completed at least one
subsequent Actor Turn slot, or a preregistered timeout fires. Windows that
close on the immediate post-action observation cannot support any
social-response label other than `unknown_social_response`. This rule fixes
the vacuity that made all prior control runs close as
`no_observable_response`.

### 3.4 Predictor arms

Baseline arms (any of these can erase the claim):

- `majority_or_no_response` — per condition, per layer;
- `scripted_heuristic` — predeclared Minecraft rules;
- `policy_copy` — per responder `r`, stratum `s`, time `t`: predict
  `argmax_y count(y | r, s, rows < t)` with Laplace smoothing, backoff to
  `argmax_y count(y | s)`, then per-condition majority when `n(r,s) < k`.
  If this is within the CI of `history_grounded`, V2 is measuring stable
  policy fingerprinting, not legibility;
- `last_response_carried_forward` — repeat the responder's previous label;
- `llm_prior` — state + action, no history;
- `current_observation` — current typed observation, no history.

Leakage arms (if any reaches >= 90% of `history_grounded` lift over
per-condition majority, the legibility claim fails):

- `actor_id_only`;
- `first_m_public_responses`;
- `action_family_by_responder`;
- `public_profile_only` (if any profile surface is public).

Treatment and ablations:

- `history_grounded` — bounded public history; predictor model family MUST
  differ from the actor model family (held-out by default);
- `same_family_predictor` — measures the self-simulation gap as a quantity;
  never the headline arm;
- `shuffled_history` — history-row mapping broken;
- `dialogue_only` and `no_generated_action_rows` when applicable.

### 3.5 Metrics (class-balance-proof)

Raw macro-F1 across conditions is invalid because disposition strength shifts
label prevalence. Required reporting per condition `c`, arm `a`, layer:

- per-condition lift: `Lift(a,c) = M(a,c) - M(majority_c, c)` on the same
  scorable rows;
- relative error reduction on proper scores:
  `RER(a,c) = (L(majority_c,c) - L(a,c)) / max(L(majority_c,c), 1e-9)` with
  `L` = Brier or log loss;
- matched-stratum scoring: strata by `(scenario_family, action_kind,
  material_stake_type, current_observation_bucket, responder_visibility,
  response_window_scope)`; equal-weight macro-average over strata;
- per-label one-vs-rest AUC lift over 0.5 on the predeclared label set;
- grouped bootstrap CIs, grouped by seed/reset session;
- label-noise ceiling: a double-labeled row slice with inter-labeler
  agreement, reported next to every F1 cutoff;
- acting outcome, action diversity, and generated-action-skill quality
  reported separately from prediction quality, always.

The dose-response curve counts only if it survives per-condition lift, RER,
and matched-stratum scoring simultaneously.

### 3.6 Labels

Targets: `social_response` and `material_access` label sets from
`transition-row-v1-contract.md`, assigned from runtime evidence per
`transition-row-label-codebook.md`. Tool-name-derived labels (as in the
stashed `transitionRows.ts`) are scaffolding only and are not scorable truth.
A chat-only "no" with no material delta is a weak row; the claim needs
materially grounded responses (grant, deny, contest, repair, use, block) or it
degrades into persona-consistency evaluation (see 8. substrate rule).

## 4. Preregistration Inside The Pipeline

The staged gates are gone; their protections move into one artifact written
before any outcome inspection:

```yaml
schema_version: experiment-declaration/v1
experiment_id:
conditions:                 # assignment + counterbalancing rules
soul_generation_rules:      # stable vs resampled; generation seed
public_private_boundary:    # allowlist for the public-history export
scenario_families:          # >= 3 or declared narrowing
predictor_arms:             # full arm list incl. leakage arms
input_cutoff:               # all predictor inputs before action_started_at
metrics:                    # 3.5 set, CI level, bootstrap grouping
label_locking:              # labels locked before prediction join
leakage_tests:              # identity permutation, prompt-shape check
stop_results:               # section 6 verbatim or tightened
provider_budget:            # quota preflight ref
seed_reset_refs:
```

Non-negotiables carried over: `transition-row/v1` never contains
`predicted_delta`; the actor's `expected_outcome` is never a target label;
prediction artifacts join by `row_id` after labels are locked; post-action
evidence never enters predictor context; provider prose never becomes runtime
policy.

## 5. Decision Rules

Promotion (headline-candidate) requires ALL of:

- `history_grounded` (held-out family) beats every baseline arm in 3.4 with
  grouped-bootstrap CI lower bound > 0 on per-condition lift;
- every leakage arm stays below 90% of `history_grounded` lift;
- `scripted_responder` positive control shows the lift;
- `resampled_soul` null shows no lift;
- the curve survives all three metric guards in 3.5;
- diagnostics in section 7 do not fire.

Anything less is `collect-more`, `revise-design`, or
`preserve-negative-result`, written as `research-decision/v1` with
`what_not_to_do_next`.

## 6. Stop-Results (preregistered kill conditions)

- K1 measurement broken: `scripted_responder` history lift <= +0.05 macro-F1
  over per-condition majority/current-observation, or CI crosses 0. Fix the
  substrate or kill; do not interpret the other conditions.
- K2 no signal: `stable_soul` normalized lift <= +0.05 or CI crosses 0.
  Preserve the negative result: embodied LLM co-actors are illegible from
  public history under cheap conditions.
- K3 trivial identification: `policy_copy`, `actor_id_only`,
  `first_m_public_responses`, or `scripted_heuristic` reaches >= 90% of
  `history_grounded` lift. The phenomenon is policy fingerprinting; the
  legibility claim dies.
- K4 leak: `resampled_soul` shows lift comparable to `stable_soul`. Condition
  or identity leaked into predictor inputs; fix or kill.
- K5 class-balance artifact: the dose-response curve disappears under
  per-condition lift, RER, and matched-stratum scoring.
- K6 substrate infeasible: two focused build sessions fail to produce a
  closed preregistered batch (>= 40 non-excluded `stable_soul` rows, >= 4
  action classes, windows closing per 3.3). Defer the agenda; the runtime
  remains an engineering asset.
- K7 dialogue-only collapse: >= 80% of scorable response labels are chat-only
  with no material delta. Minecraft is not doing measurement work; switch
  substrate or admit the object is persona consistency and stop.
- K8 self-simulation only: lift exists for `same_family_predictor` but
  vanishes held-out. Publish as a self-simulation-gap observation; the
  legibility headline dies.

## 7. Diagnostics (absorbed from the old thresholds)

Computed per condition on every batch; any firing diagnostic blocks headline
claims but never blocks building:

- dominant `(actor_id, action_kind, target_signature)` > 30% of rows;
- < 4 action classes represented;
- window closure rate, `no_observable_response` share, and window scope;
- `material_stake` and `interaction_opportunity` density;
- < 3 scenario families without declared narrowing;
- row exclusion audit with reasons;
- `scorable_rows_by_layer` denominators cited for every decision;
- provider/cost summary and environment blockers.

## 8. Substrate Rule

Live Minecraft/Mineflayer stays the substrate while the labels are material
acts (possession, access, container, affordance, repair, contest, later use)
verified by the runtime. If K7 fires, a purpose-built gridworld/text
environment is the honest home for what remains, and the Minecraft claim is
dropped rather than decorated. A gridworld replica MAY be built as a cheap
falsification control at any time; it never substitutes for the final claim.

### 8.1 Depth-Not-Scale Premise (amendment 2026-07-06)

Search token: `DEPTH_NOT_SCALE`.

The experiment presupposes exactly three substrate facts, and none of them
is simulation scale:

1. a working small-N multi-actor substrate: 2-3 concurrent actors with
   cross-actor observation and chat capture wired into runtime evidence
   (public history has no raw material without it);
2. interaction density: rows carrying `material_stake` and
   `interaction_opportunity` at the K6 floor, not observe/wait filler;
3. longitudinal responder depth: accumulated public history about the same
   responder across repeated episodes — rows per responder per condition is
   the quantity that must grow, because that is the only channel through
   which a fixed private ActorSoul can become legible.

Actor-count scale is explicitly not a premise, and not a remedy:

- power comes from rows per responder x conditions; more actors at fixed
  budget dilutes rows per responder;
- more actors blurs response-window attribution and inflates label noise
  and pathing confounds;
- dose-response condition control requires precise responder composition,
  which only 1-2 responders allow.

Binding rule (carried from the superseded 2026-06-29 protocol into active
authority): do not scale actor count to hide a weak small-run result. Scale
re-enters only as the deferred social-pattern branch (gated by
`society-observable-preflight.md`) or as a post-positive-result
generalization axis. If 2-3 actor interaction cannot carry disposition
information, that is a K6/K7-shaped substrate failure: fix scenario
pressure and window design inside the small-N design, or preserve the
negative result and stop.

## 9. Build Plan (zero-cost, two sessions)

The full work breakdown — seams, implementation decisions, vertical slices,
acceptance criteria, testing rules, and the K6 clock — lives in
`embodied-co-actor-legibility-implementation-plan.md`
(`LEGIBILITY_IMPLEMENTATION_PLAN`). This section stays as the summary; if
they disagree, this plan wins and the implementation plan must be updated.

Salvage from `backup/no-regret-core-stash-2026-06-30` strictly by design fit:

| Component | Verdict | Reason |
| --- | --- | --- |
| `seedResetRecords.ts` | reuse as-is | provenance logic unchanged |
| `transitionRows.ts` | row shape only | labels are tool-name-derived; relabeling must be evidence-based |
| `transitionResponseWindows.ts` | redesign | closes immediately; 3.3 rule required |
| `transitionRowBatchAudit.ts` | rework | gate verdicts become section-7 diagnostics |
| `noRegretRunDeclaration.ts` | redesign | becomes `experiment-declaration/v1` |
| shared-session smoke CLIs | reference | scheduler pattern + `visibleActorsForBot` scan |

Session 1 — integrated pipeline, provider-free (gate: deterministic
end-to-end smoke produces rows with non-vacuous windows, joined predictions,
and a per-condition lift table; `bun test` and `bun run typecheck` green):

1. per-actor provider routing map in a v2 shared-session scheduler
   (provider functions already accept `providerId` per call);
2. N-actor observation + chat capture (`bot.entities` scan pattern; add chat
   to `ObserveResult`) — public history does not exist without this;
3. `scripted-social` content-conditioned responder provider (pattern:
   `probe/src/mutual/provider.ts` state machine, wired into the ActorSoul
   pipeline);
4. response-window closure per 3.3;
5. public-history export with private-field allowlist audit;
6. `experiment-declaration/v1` writer; prediction join + scorer with 3.5
   metrics.

Session 2 — preregistered live pilot (gate: closed batch meeting K6 minimums
plus scored arms and a written `research-decision/v1`):

- provider quota preflight first; focal/live actors on
  `modelscope-api` Qwen (monthly headroom verified 2026-06-29: 259/10000
  requests); predictor arms offline on a DIFFERENT model family;
- targets: `stable_soul` >= 40 non-excluded rows, `scripted_responder` >= 30,
  `resampled_soul` >= 30; estimated 200-300 provider calls total;
- preregister, run, lock labels, join predictions, score, decide.

What not to build next: Qwen-AgentWorld/JarvisVLA/VLA arms, model training or
fine-tuning, F-society episodes, ledgers, HTML reports before data, any new
protocol document beyond `experiment-declaration/v1` instances.

## 10. Deferred Branches And Name Crosswalk

| Old name | V2 name | Status |
| --- | --- | --- |
| F-native | trained-predictor branch | deferred; requires a trained-vs-prompted baseline to even be distinct from prompting |
| F-loop / advisory WAM | advisory-use branch | deferred until a positive legibility result exists |
| F-society | social-pattern branch | deferred; `society-observable-preflight.md` remains its gate |
| F1-F5 (2026-06-17 lineage) | historical taxonomy | superseded; no crosswalk debt beyond this table |
| WAM | retired term | historical only; collides with robotics World Action Model |

## 11. Prior-Work Anchors

Fresh source checks 2026-07-05. The composition (public-history-only observer
x materially grounded runtime-verified targets x consistency-as-IV x crossed
same/held-out predictor) was verified unoccupied; every ingredient exists in a
disjoint literature:

- Shapira et al., Predicting Decisions of AI Agents —
  `https://arxiv.org/abs/2605.12411` — closest overall: cross-model observer
  prediction from public history; negotiation dialogue, no embodiment, no
  consistency IV. Must cite and differentiate.
- Hypothetical Minds — `https://arxiv.org/abs/2407.07086` — embodied
  next-action prediction as an internal winning module, not a measured
  observer benchmark.
- Binder et al., Looking Inward — `https://arxiv.org/abs/2410.13787` —
  self-vs-other prediction gap via privileged fine-tuning; contested; the
  public-history self-simulation gap is unmeasured and unnamed.
- PillagerBench — `https://arxiv.org/abs/2509.06235` — Minecraft opponent
  inference from public chat/actions; no prediction-accuracy metric; the only
  Minecraft-native consequence-prediction adjacency (inventory-level).
- The Personality Illusion — `https://arxiv.org/abs/2509.03730` — persona
  steers self-reports, barely steers behavior; motivates runtime-verified
  action targets over prose.
- Mental Modeling of RL Agents — `https://arxiv.org/abs/2406.18505` —
  history-conditioned other-agent modeling on toy RL tasks; LLMs fail.
- Text-world simulators — `https://arxiv.org/abs/2406.06485` — the generic
  "LLMs are imperfect world models" claim is settled; do not reclaim it.
- MineWorld — `https://arxiv.org/abs/2504.08388` — pixel next-frame Minecraft
  world model; no language, no typed state, no social layer.
- Qwen-AgentWorld — `https://arxiv.org/abs/2606.24597` — action+history ->
  next-observation prediction validated in software-agent domains; method
  template, not a domain competitor.
- Project Sid — `https://arxiv.org/abs/2411.00114` — Minecraft society
  emergence at scale; zero prediction metrics; 2-3 actor scale unstudied.

## 12. Direction-Change Artifacts

`prior-work-proximity/v1`:

```yaml
schema_version: prior-work-proximity/v1
query_log:
  - query: five parallel review lanes (repo audit, spine inventory, Qwen/VLA
      fresh check, erasure-pressure sweep, adversarial review) plus a second
      wave (runtime knobs, adversarial v2 attack, legibility novelty check)
    tool: web + HF + arXiv primary sources, repo rg/git inspection
    date: 2026-07-05
novelty_delta: >
  No published work combines materially grounded runtime-verified action
  targets, strictly public-history predictor access, consistency as a
  manipulated independent variable, and a crossed same/held-out predictor
  design. Closest: arXiv 2605.12411 (no embodiment, no consistency IV).
weakening_evidence:
  - If policy_copy or leakage arms match history lift, the claim collapses
    into policy fingerprinting.
  - If labels are mostly chat-only, the claim collapses into persona
    consistency and Minecraft adds nothing.
  - arXiv 2604-2606 range is fast-moving; re-run source checks before any
    public claim.
```

`proposal-soundness-review/v1`:

```yaml
schema_version: proposal-soundness-review/v1
verdict: headline-candidate-pending-data
scores:
  object_clarity: 5
  gap_quality: 4
  significance: 4
  falsifiability: 5
  baseline_pressure: 5
  observability: 3
  confound_control: 4
  feasibility: 4
  negative_result_value: 5
strongest_objection: >
  stable_soul may collapse into scripted_responder (soul-as-script): if
  responses are a stable function of disposition plus action family, the
  policy_copy baseline erases legibility, and the observability of
  social-material responses is still unproven (cross-actor observation is
  unwired in the current live path).
revision_needed: >
  None before build; K1-K8 and the leakage arms are the revision mechanism.
cheap_disambiguating_test: >
  Session-1 deterministic smoke: scripted_responder condition with a
  content-conditioned policy and fixed windows must show history lift for a
  trivial offline predictor before any live provider spend.
```

`experiment-sketch/v1`:

```yaml
schema_version: experiment-sketch/v1
uncertainty_to_reduce: >
  Whether embodied LLM co-actors are predictable from public interaction
  history at all, and whether predictability tracks disposition consistency.
hypothesis: >
  History lift exists in scripted_responder, is present but smaller in
  stable_soul, and vanishes in resampled_soul; held-out-family lift is
  smaller than same-family lift (a measurable self-simulation gap).
independent_variable: responder consistency condition x predictor arm
observed_target: locked transition-row/v1 social_response + material_access labels
baseline: full arm set in section 3.4
run_protocol: preregister experiment-declaration/v1; cut inputs before
  action_started_at; lock labels; join by row_id; score per section 3.5
minimum_data: K6 minimums
evaluator: deterministic scorer + double-labeled slice audit
stop_condition: K1-K8
cost_bound: provider quota preflight before any live call
```

`research-decision/v1`:

```yaml
schema_version: research-decision/v1
decision: >
  Adopt the embodied co-actor legibility experiment as the single active
  research target, superseding the staged no-regret/Goldilocks program.
verdict: redesigned-active-plan
evidence_used:
  - 2026-07-05 five-lane first-principles review (stash-only pipeline,
    gate omissions, window vacuity, WAM collision, actor-policy circularity)
  - second-wave lanes: runtime-knob feasibility map, adversarial v2 attack,
    external novelty verification (all 2026-07-05)
  - ZERO_COST_IMPLEMENTATION_RULE (user-approved, AGENTS.md)
alternatives_considered:
  - keep staged core-first program (rejected: build gating is a cost-era
    artifact; scientific guardrails preserved inside the pipeline instead)
  - measurement-methodology-only pivot (rejected: erased by existing
    LLM-as-world-model methodology)
  - policy/behavior-evaluation pivot (rejected: crowded, off-identity)
  - kill/defer (rejected: claim verified unoccupied with cheap falsification)
strongest_objection: >
  Soul-as-script plus policy-copy erasure; observability of social-material
  responses unproven until the session-1 smoke passes.
accepted_risk: >
  The likely outcome may be K2/K3-shaped negative results. They are
  publishable design constraints for multi-agent LLM systems and are cheaper
  than continuing to build gates around an unmeasured phenomenon.
next_action: >
  Session 1 build per section 9; no live provider calls before the
  deterministic smoke and quota preflight.
what_not_to_do_next: >
  Do not run Qwen-AgentWorld/JarvisVLA/VLA arms, train models, start
  social-pattern episodes, write new protocol docs, produce HTML reports, or
  use the same_family_predictor arm as a headline. Do not describe V2 as
  world modeling or social simulation.
```
