# Central Plan V3: Lived Vs Told — Enacted Social History And Observer Legibility

Status: **SUPERSEDED 2026-07-11** by
`central-plan-capability-gated-social-sandbox.md` (V4). Preserved as audit
trail. Do not build or run from this plan.

Historical search token: `SUPERSEDED_LIVED_VS_TOLD`. Also: `LIVED_VS_TOLD`,
`HISTORY_DELIVERY_LADDER`, `MATERIAL_FOLLOW_THROUGH`, `SAME_MODEL_RULE`,
`EXPERIMENT_DECLARATION_V1`, `DEPTH_NOT_SCALE`.

Recorded: 2026-07-10 (`Asia/Seoul`).

Historical authority: this plan superseded
`central-plan-embodied-co-actor-legibility.md` (V2) and demotes
`embodied-co-actor-legibility-implementation-plan.md` and
`legibility-cycle-2-live-substrate-work-plan.md` to superseded work orders.
The user approved this direction change in-session on 2026-07-10 after a
verified first-principles review (section 1). Superseded docs stay in place
as audit trail with superseded status headers. On 2026-07-11 the user retired
V3 because prediction and legibility were too narrow to remain the project
center. V4 retains useful runtime and evidence mechanisms only where its staged
capability, continuity, sandbox, and phenomenon-discovery program needs them.

## 0. TL;DR

One preregistered experiment with two coupled questions:

```text
Holding the current Minecraft decision state equivalent, does changing ONLY
a co-actor's social interaction history with a partner change its actual
material behavior toward that partner — and does the answer depend on
whether the history was LIVED (enacted episodes written into the actor's
own memory) or TOLD (an information-equivalent narrated summary)?

And: can an external observer, reading ONLY raw public events (never prior
labels), predict that material behavior better than state-only, actor-id,
policy-copy, and shuffled-history baselines?
```

The actor-side history effect in text games is established prior work; here
it is the manipulation check, not the headline. The two headline candidates
are (1) the enacted-vs-narrated delivery contrast and (2) observer
legibility of history-caused material behavior. Both have preregistered
negative forms that are publishable. Nothing else is an active research
target until this experiment produces a decision.

## 1. Why V3 Replaced V2

V2 asked whether an observer could predict a soul-grounded responder's
social/material labels from public history, with disposition consistency
(`scripted_responder` / `stable_soul` / `resampled_soul`) as the
independent variable. A 2026-07-10 first-principles review killed that
framing on verified evidence:

Repo-verified defects (all confirmed by direct code/artifact inspection):

- The V2 positive control was self-contradictory. The plan declared
  "history MUST help" for `scripted_responder`, but the implemented
  scripted responder is memoryless — it reads only currently visible
  actors and current inventory (`probe/src/provider/socialActorTurnProvider.ts`,
  `scriptedSocialActorTurn`). No predictor can extract history lift from a
  memoryless policy except by fingerprinting it, which is exactly what the
  K3 kill condition forbids. The C2-G gate failure (`max_lift: -0.15`,
  `project-docs/experiments/raw/2026-07-06/c2-g-live-provider-free-smoke/`)
  is the expected consequence of this design contradiction, not a
  measurement of social signal.
- The implemented predictor arms — including the `history_grounded`
  treatment arm — consume previously locked public labels
  (`probe/src/legibility/predictors.ts`, `publicLabelObservations`), not
  raw public events. The treatment arm is a weighted label-count heuristic,
  structurally the same object as the policy-copy and actor-id killer
  baselines it must beat, and structurally the same design as Shapira et
  al.'s labeled K-shot adaptation (arXiv 2605.12411) — the exact prior work
  V2 needed to differ from.
- The only materially grounded rows in C2-G are the focal actor's own
  `collect_logs -> inventory_gain`. The target mixed "co-actor social
  response" with "physical outcome of the actor's own action".

Literature-verified defects (fresh source checks 2026-07-10, two
independent sweeps; anchors in section 11):

- Free-form persona/soul text is a weak independent variable: persona
  prompting aligns self-reports, not behavior (arXiv 2606.12730). The
  `stable_soul` vs `resampled_soul` contrast manipulated the wrong thing.
- Behavioral traces identify the underlying model at up to 96% F1 (arXiv
  2605.14786), so cross-condition observer lift under V2 risked being
  model/policy fingerprinting rather than social legibility.
- Actor-side "history changes LLM behavior" is already established in text
  games (Akata et al. NHB 2025; arXiv 2312.15198; 2402.04559; 2604.15267;
  2606.14923), including matched-context history substitution (The Memory
  Curse, arXiv 2605.08060). A bare "history moved behavior, in Minecraft"
  headline is a confirmatory replication.

What remains genuinely open (verified unoccupied 2026-07-10):

- No published work compares an agent that LIVED a social history (real
  episodes, agent-written memory) against one TOLD an
  information-equivalent narration, with downstream material behavior as
  the outcome. Nearest neighbor: description-vs-experience for lottery
  prospects (arXiv 2602.15173) — not social, not agentic memory.
- No published work measures whether an external observer can recover
  history-caused material behavior from raw public events in an embodied
  setting; a FAccT 2026 position paper (arXiv 2605.30169) argues this
  should fail in principle, making it a live, contested, falsifiable
  hypothesis with a named opponent.
- Only an embodied persistent world can separate lived from told history —
  in text games, history IS narration. This is the substrate justification
  V2 lacked.

What V3 keeps from V2: the runtime substrate (shared 2-3 bot session,
cross-actor observation, structured chat capture, response windows,
allowlisted public-history export with leakage checks, transition-row/v1
evidence rules, seed/reset provenance, label locking, offline scorer), the
depth-not-scale premise, denominator discipline, negative-result
preservation, provider quota gates, and the zero-cost implementation rule.
Typecheck and the 19-test legibility suite pass as of 2026-07-10; the
substrate is an asset, and the science on top is what changes.

## 2. Research Object And Claim

The object is the causal social memory of embodied LLM co-actors and its
public legibility:

```text
manipulate: partner-directed social history h (family x valence), delivered
            at rung d (no_history | narrated_summary | narrated_verbatim |
            enacted)
hold:       current decision state s (blocks, inventory, chest, positions,
            vitals, current request) equivalent across the matched pair
measure:    responder's material_follow_through toward the partner
            (typed runtime evidence), intent and execution separated
observe:    a held-out-family observer reading ONLY raw public events
            predicts material_follow_through; never receives prior labels
```

`research-claim/v1`:

```yaml
schema_version: research-claim/v1
claim: >
  In preregistered matched-pair Minecraft episodes with equivalent decision
  state, (a) manipulated partner-directed social history shifts a co-actor
  LLM's materially verified follow-through toward the partner
  [manipulation check, expected from text-game priors]; (b) the effect of
  ENACTED history (lived episodes, agent-written memory) differs measurably
  from an information-equivalent NARRATED history [headline 1: the
  lived-vs-told gap]; and (c) a held-out-family observer reading only raw
  public events predicts follow-through with positive grouped-bootstrap
  lower-bound lift over state-only, actor-id-only, policy-copy, and
  shuffled-history baselines [headline 2: observer legibility].
negative_form: >
  (b-null) If enacted and narrated deliveries are behaviorally equivalent
  within the preregistered margin, agent memory pipelines neither amplify
  nor destroy social signal relative to narration — a design simplification
  result for multi-agent systems. (c-null) If no observer lift exists while
  the actor-side effect is real, history-caused behavior is illegible from
  public events under cheap conditions — empirical support for the
  reputation-grounding skepticism of arXiv 2605.30169. All four cells of
  (actor effect x observer lift) are informative and preserved.
```

This is a causal-social-memory and legibility claim. Do not describe V3 as
world modeling, persona evaluation, social simulation at scale, or a
Minecraft benchmark. Physical Minecraft mechanics remain control layers.

## 3. Experimental Design

### 3.1 Independent variables

IV1 — history family, each a matched pair (positive vs negative valence)
of partner behavior toward the responder:

| Family | Positive arm | Negative arm |
| --- | --- | --- |
| `prior_help` | partner shared a needed item when the responder was blocked | partner visibly declined to share while able |
| `permission` | partner granted the responder access to its claimed chest | partner refused access to the same chest |
| `promise` | partner stated a material commitment and kept it (verified deposit) | partner stated the same commitment and broke it |

IV2 — delivery rung (`HISTORY_DELIVERY_LADDER`):

| Rung | What the responder receives |
| --- | --- |
| `no_history` | nothing about the partner beyond the current episode |
| `narrated_summary` | a fixed-template textual summary of the history episode |
| `narrated_verbatim` | the raw public event log of the history episode, injected as context |
| `enacted` | the responder actually played the history episode earlier in the same session; only its own accumulated memory artifacts carry the history |

Narration content at both narrated rungs is generated deterministically
from the enacted episode's public event log by a fixed template. No
hand-written vignettes. This makes rungs information-comparable by
construction and auditable (3.7).

### 3.2 Same-model rule (`SAME_MODEL_RULE`)

All conditions run the same base model, same prompt scaffold, and the same
fixed neutral ActorSoul. Soul text is a controlled constant, never an
independent variable (V2's `stable_soul`/`resampled_soul` conditions are
retired). Because only history varies within a matched pair, model-identity
fingerprinting (arXiv 2605.14786) cannot produce a spurious
cross-condition effect. Model family becomes a generalization axis only
after a within-model result exists.

### 3.3 Matched-state discipline

- Narrated rungs and `no_history`: the decision episode starts from a
  byte-identical fixture (same seed/reset, same inventory, same chest
  contents, same positions, same vitals, same partner request text).
  Equivalence is verified by artifact hash before any outcome is
  interpreted.
- Enacted rung: the history episode must end state-convergent with the
  fixture. Scenario designs must consume or return manipulated resources
  (help item consumed by a scripted task; chest restored by the partner's
  scripted final act). Equivalence is verified by a decision-relevant
  state hash over declared fields (inventory counts, chest contents,
  position buckets, vitals, request text); any deviation outside the
  declared equivalence class excludes the pair and is reported in the
  exclusion audit. State convergence for enacted pairs is the single
  hardest engineering problem in this plan and gets its own slice and
  stop-result (L3).

### 3.4 Positive control and nulls

- Positive control: a genuinely history-dependent scripted responder —
  reciprocates (shares/grants) if and only if its public history with the
  partner contains the positive-arm event. This replaces V2's memoryless
  scripted responder and is what makes L1 meaningful: the pipeline must
  detect a flip that is guaranteed to exist, and a trivial raw-event
  observer must recover it, before any live provider spend.
- Nulls: `no_history` rung (baseline rate); `partner_swapped` history (the
  same events but attributed to a third actor — tests partner-specificity
  vs generic mood priming); `shuffled_history` for the observer stage.

### 3.5 Targets

Primary target: `material_follow_through: yes | no` — did the responder,
within its next N declared turn slots, perform the requested material act
toward the partner (deposit to shared/partner chest, permit withdrawal,
hand over the item), as read from typed runtime tool results
(`material-access-evidence/v1`)? Never from chat, tool names, or prose.

Recorded separately, never merged into the target:

- structured action choice (intent) vs Mineflayer execution success
  (competence) — a chosen-but-failed deposit scores as intent yes,
  execution no, and enters the headline only under the preregistered
  intent-vs-execution reporting split;
- chat responses (acknowledgment, refusal text) — diagnostics only; a
  chat-only "yes" with no material act is `material_follow_through: no`;
- V2's 10-class social_response taxonomy — retained as diagnostics, not a
  target.

### 3.6 Observer stage

Runs only on rows where the actor-side stage produced interpretable pairs.

Observer input: the allowlisted public-history export restricted to RAW
events (actor turns, chat, movement/co-presence, material deltas), strictly
before the responder's decision slot. Observers NEVER receive locked
labels, prior predictions, or condition identifiers. This inverts the V2
implementation, whose arms consumed prior labels.

Arms:

- `llm_raw_history` (treatment): held-out-family LLM reads the raw event
  stream and predicts `material_follow_through`;
- `llm_state_only`: same LLM, current decision state only, no history;
- `llm_shuffled_history`: history events shuffled across pairs;
- `llm_partner_swapped`: history attributed to the wrong actor;
- `actor_id_only`, `policy_copy`, `majority`: the V2 deterministic
  label-count arms, demoted to baselines and run on the same split;
- `same_family_observer`: measured self-simulation gap; never a headline.

Kill logic: if `llm_state_only` or any deterministic baseline reaches >=
90% of `llm_raw_history` lift, the legibility claim fails (L5/L6).

### 3.7 Information-equivalence audit

Preregistration must preempt the prompt-intervention confound (arXiv
2605.20767): both narrated rungs are generated from the enacted episode's
public event log by fixed template; an audit artifact verifies (i) no fact
appears in a narration that is absent from the source event log, (ii) both
valence arms of a family have symmetric narration templates, (iii) token
counts are matched within a declared tolerance across valence arms. L8
fires on audit failure.

### 3.8 Statistics

Deliberately simpler than V2's stratified metric stack — matched pairs
carry the inferential load:

- actor stage: per family x rung, follow-through rate difference between
  valence arms on fixture-paired episodes; McNemar exact test on
  discordant pairs; grouped bootstrap CIs grouped by seed/reset session;
- headline 1: the (enacted minus narrated_verbatim) difference of those
  paired differences, with grouped-bootstrap CI; equivalence margin for
  the L4 negative form preregistered in the declaration;
- headline 2: observer accuracy and Brier score per arm on identical row
  splits; lift over each baseline arm with grouped-bootstrap CI; per-label
  AUC as a secondary check;
- intent vs execution reported as separate columns in every table;
- denominators (`archived` / `non_excluded` / `scorable`) cited for every
  decision; exclusion audit with reasons; label-noise slice retained via
  double-labeled material evidence.

## 4. Preregistration Inside The Pipeline

`experiment-declaration/v1` gains required fields; the writer refuses
scoring without them:

```yaml
schema_version: experiment-declaration/v1
experiment_id:
history_families:            # prior_help | permission | promise, arm scripts
delivery_rungs:              # subset of the ladder, with rung assignment rules
pairing:                     # fixture ids, pair ids, counterbalancing
state_equivalence:           # hash fields, declared equivalence classes
narration_templates:         # template ids + audit tolerance
same_model_rule:             # base model, prompt scaffold, fixed soul ref
targets:                     # material_follow_through window N, evidence kinds
observer_arms:               # full arm list incl. baselines and nulls
observer_input_cutoff:       # all observer inputs before decision slot
metrics:                     # 3.8 set, CI level, bootstrap grouping, L4 margin
label_locking:               # labels locked before observer join
stop_results:                # section 6 verbatim or tightened
scoop_check_ref:             # section 11 pre-run literature gate artifact
provider_budget:             # quota preflight ref
seed_reset_refs:
```

Non-negotiables carried from V2: rows never contain `predicted_delta`; the
actor's `expected_outcome` is never a target label; observer artifacts join
by `row_id` after labels are locked; post-decision evidence never enters
observer context; provider prose never becomes runtime policy.

## 5. Decision Rules

Headline 1 (lived-vs-told) promotion requires ALL of:

- L1 positive control passes;
- manipulation check: narrated_verbatim shows a paired effect with grouped
  CI excluding 0 in at least 2 of 3 history families;
- the enacted-vs-narrated difference-of-differences CI excludes 0 (either
  sign — direction is the finding);
- L8 information-equivalence audit clean; L3 state-equivalence exclusions
  below the declared ceiling.

Headline 2 (observer legibility) promotion requires ALL of:

- an actor-side effect exists at the rung being observed;
- `llm_raw_history` beats every baseline arm in 3.6 with grouped-bootstrap
  CI lower bound > 0;
- every leakage/baseline arm stays below 90% of treatment lift;
- `llm_partner_swapped` and `llm_shuffled_history` show degraded lift
  (partner-specific signal, not mood priming or format artifacts).

The L2 and L4 negative forms are first-class publishable outcomes and are
written as `research-decision/v1` with `what_not_to_do_next`. Anything
less is `collect-more` or `revise-design`.

## 6. Stop-Results (preregistered kill conditions, L-set)

- L1 measurement broken: the history-dependent scripted responder does not
  flip `material_follow_through` across matched histories in the
  provider-free smoke, or a trivial raw-event observer cannot recover the
  flip. Fix the substrate or kill; do not interpret anything else.
- L2 no actor effect: narrated_verbatim shows no paired effect in any
  history family (CIs cross 0 everywhere). Embodied LLM co-actors ignore
  partner-directed social history under cheap conditions; preserve the
  negative result; both headlines die.
- L3 enacted infeasible: two focused build sessions cannot produce
  state-convergent enacted pairs at the declared exclusion ceiling. Defer
  the enacted rung; narrated-only results are reported but are NOT a
  headline (they sit too close to arXiv 2605.08060); the direction returns
  to the harness for re-decision.
- L4 ladder equivalence: enacted and narrated_verbatim effects are
  equivalent within the preregistered margin. Publish as the negative form
  of headline 1 (memory-pipeline transparency), not as failure.
- L5 state leakage: `llm_state_only` reaches >= 90% of `llm_raw_history`
  lift — state or condition leaked; fix or kill the observer claim.
- L6 fingerprinting: `policy_copy` or `actor_id_only` reaches >= 90% of
  treatment lift — the observer is fingerprinting a stable policy, not
  reading social history; headline 2 dies.
- L7 chat-only collapse: >= 80% of scorable outcomes are chat-only with no
  material act. Minecraft is not doing measurement work; fix scenario
  material pressure within 2-3 actors or switch substrate honestly.
- L8 equivalence-audit failure: narration audit finds asymmetric or
  leaking templates. Fix the generator before interpreting any ladder
  contrast.

## 7. Diagnostics

Computed per batch; any firing diagnostic blocks headline claims but never
blocks building:

- dominant `(actor_id, action_kind, target_signature)` > 30% of rows;
- state-hash exclusion rate per rung and family;
- follow-through base rate per family (floor/ceiling check: if the
  no_history rate is < 0.1 or > 0.9, the scenario has no headroom and the
  family must be re-pressured);
- intent-execution divergence rate (Mineflayer competence confound);
- narration token-count deltas across valence arms;
- window closure and response-latency distributions (retained from V2 as
  substrate hygiene);
- row exclusion audit with reasons; scorable denominators cited;
- provider/cost summary and environment blockers.

## 8. Substrate Rule

Live Minecraft/Mineflayer stays the substrate while the target is material
acts verified by the runtime and while the enacted rung is in play — the
lived-vs-told contrast is the reason an embodied persistent world is used
at all. If L3 and L7 both fire, what remains is a text-game question that
arXiv 2605.08060 already owns, and the honest move is to stop rather than
decorate.

### 8.1 Depth-Not-Scale Premise (carried, binding)

Search token: `DEPTH_NOT_SCALE`. Unchanged from V2 and still binding:

1. 2-3 concurrent actors with cross-actor observation and chat capture;
2. interaction density: episodes carry material stake, not observe/wait
   filler;
3. longitudinal depth: matched pairs per responder per family is the
   quantity that must grow.

Do not scale actor count to rescue weak signal. The matched-pair design
strengthens this premise: power comes from pairs, and pairs require
precise composition control that only 2-3 actors allow. Scale re-enters
only as the deferred social-pattern branch
(`society-observable-preflight.md`) or as a post-positive-result
generalization axis.

## 9. Build Plan (summary)

The full work breakdown lives in `lived-vs-told-implementation-plan.md`
(`LIVED_VS_TOLD_IMPLEMENTATION_PLAN`). If they disagree, this plan wins and
the implementation plan must be updated in the same change.

Substrate carried over as-is: shared-session scheduler with per-actor
provider routing, cross-actor observation and chat capture, response
windows (demoted to diagnostics), public-history export with allowlist and
leakage checks, transition-row/v1 assembly and evidence-grounded labeling,
seed/reset provenance, declaration writer, offline scorer skeleton,
`inspect_chest` / `deposit_shared` / `withdraw_shared` primitives.

New slices (Session A, provider-free): history-dependent scripted
responder; paired fixture builder + decision-relevant state hash +
equivalence audit; history-delivery machinery (narration generator,
context injection, enacted-episode runner with state normalization);
`material_follow_through` target and paired scorer; raw-event observer
seam with deterministic baselines; declaration extension; end-to-end
deterministic smoke gating on L1.

Session B (preregistered live pilot): quota preflight; scoop-check
artifact (section 11 gate); narrated rungs first (byte-identical fixtures,
cheapest); enacted rung; label lock, held-out-family observer runs,
scoring, `research-decision/v1`.

Estimated scale: provider-free 12 pairs; single-model pilot 24 pairs;
confirmation 3 families x 4 rungs x ~20 pairs. Focal/live actors on
`modelscope-api` Qwen per quota preflight; observer arms offline on a
different model family.

What not to build next: decay/interference curves as a headline (arXiv
2605.08060 owns them; at most one salience ablation), soul/persona
conditions, VLA/training arms, actor-count scaling, HTML reports before
data, new protocol docs beyond `experiment-declaration/v1` instances.

## 10. Crosswalk From V2

| V2 concept | V3 status |
| --- | --- |
| observer legibility question | retained, re-posed over history-caused behavior with raw-event observers |
| `stable_soul` / `resampled_soul` conditions | retired as IV; soul becomes a controlled constant (`SAME_MODEL_RULE`) |
| `scripted_responder` positive control | replaced by a genuinely history-dependent scripted responder |
| `history_grounded` label-count arm | demoted to baseline; treatment is `llm_raw_history` |
| social_response 10-class labels | diagnostics only; primary target is binary `material_follow_through` |
| response windows | substrate hygiene + diagnostics; no longer the label authority for the headline |
| K1-K8 stop-results | replaced by L1-L8 (section 6) |
| stratified metric stack (V2 3.5) | replaced by matched-pair statistics (3.8) |
| depth-not-scale, quota gates, evidence rules, label locking | carried unchanged |
| trained-predictor / advisory-use / social-pattern branches | still deferred, unchanged gates |

## 11. Prior-Work Anchors

Fresh source checks 2026-07-10 (two independent sweeps: cited-paper
verification and adversarial novelty scan). The V3 composition — enacted
vs narrated partner-directed history x matched embodied decision state x
materially verified follow-through x raw-event observer legibility — was
verified unoccupied. Every ingredient exists in a disjoint literature:

- The Memory Curse — arXiv 2605.08060 — closest overall: matched-length
  history-content substitution shifts cooperation in text social dilemmas.
  Must cite and differentiate on embodiment, material outcomes, enacted
  delivery, and the observer stage. Its existence is why the bare
  actor-side effect is a manipulation check here, not a headline.
- Trust Between AI Agents — arXiv 2606.14923 — history-conditioned trust
  formation/breakage/recovery, text-based; motivates the `promise` family.
- Mind the (DH) Gap — arXiv 2602.15173 — description-vs-experience for
  lottery prospects in LLMs; nearest neighbor to lived-vs-told; not
  social, not agent-owned memory. The door V3 walks through, and the
  reason to move before it closes.
- Dissociative Identity — arXiv 2605.30169 (FAccT 2026) — position paper
  arguing LM-agent pasts cannot ground reputation/prediction; the named
  opponent for headline 2; either observer outcome answers it.
- Shapira et al. — arXiv 2605.12411 — labeled K-shot observer adaptation
  in text negotiation; the occupied region V2's implementation drifted
  into; V3's no-labels observer rule exists to stay out of it.
- ROTE — arXiv 2510.01272 — behavior-program induction over raw histories
  of FIXED policies (gridworld, PARTNR); observer-side only; no history
  manipulation of the target.
- Known By Their Actions — arXiv 2605.14786 — model fingerprinting from
  behavioral traces at up to 96% F1; motivates `SAME_MODEL_RULE` and L6.
- Rethinking Psychometric Evaluation — arXiv 2606.12730 — persona prompting
  aligns self-reports, not behavior; why soul-as-IV was retired.
- CoopEval — arXiv 2604.15267 — cooperation mechanisms (incl. contracts) in
  matrix games; why contracts/commitments enter only as the `promise`
  history family, never as a separate headline.
- Cheap Talk, Empty Promise — arXiv 2604.04782 — promise-breaking rates in
  one-shot text scenarios; does not vary kept/broken history as treatment.
- Akata et al. (NHB 2025), Leng & Yuan (arXiv 2312.15198), Xie et al.
  (arXiv 2402.04559) — actor-side history sensitivity in repeated/trust
  games; the established base V3 builds on.
- The Illusion of Intervention — arXiv 2605.20767 — prompt-level
  "interventions" leak confounds; motivates 3.7 and the enacted rung as a
  stronger-than-prompt intervention.
- Retained V2 anchors: Hypothetical Minds (2407.07086), PillagerBench
  (2509.06235), Project Sid (2411.00114), ToMnet (1802.07740), Generative
  Agents (2304.03442) — adjacent, none occupy the composition.

Pre-run literature gate (binding): before any live provider spend, read
the FULL TEXT of arXiv 2605.08060 and arXiv 2602.15173 (the two
scoop-risk papers; only abstracts were verified on 2026-07-10) and record
a dated scoop-check artifact referenced by the declaration
(`scoop_check_ref`). Non-arXiv 2026 venues (CHI/AAMAS/HRI/CSCW) were not
exhaustively swept; the scoop check must include them.

## 12. Direction-Change Artifacts

`prior-work-proximity/v1`:

```yaml
schema_version: prior-work-proximity/v1
query_log:
  - query: cited-paper verification (Shapira, ROTE, psychometrics,
      fingerprinting, CoopEval, ABC, GPT-5.6 Sol access/capability)
    tool: web search + arXiv primary sources
    date: 2026-07-10
  - query: adversarial novelty scan across six areas (LLM reciprocity,
      matched-context history manipulation, Minecraft multi-agent LLM,
      counterfactual matched-pair designs, enacted-vs-narrated,
      observer-side prediction/legibility)
    tool: web search + arXiv primary sources
    date: 2026-07-10
novelty_delta: >
  Actor-side history sensitivity is occupied (text games, incl.
  matched-context substitution). The unoccupied composition is: enacted vs
  information-equivalent narrated partner-directed history, matched
  embodied decision state, materially verified follow-through, and a
  raw-event observer-legibility stage with a published in-principle
  skeptic (arXiv 2605.30169).
weakening_evidence:
  - arXiv 2605.08060 and 2602.15173 were verified at abstract level only;
    full-text scoop check is a preregistration gate.
  - If enacted state convergence fails (L3), the remainder is
    text-game-adjacent and thin.
  - arXiv 2602-2607 is fast-moving; re-run source checks before any public
    claim.
```

`proposal-soundness-review/v1`:

```yaml
schema_version: proposal-soundness-review/v1
verdict: headline-candidate-pending-data
scores:
  object_clarity: 5
  gap_quality: 5
  significance: 4
  falsifiability: 5
  baseline_pressure: 5
  observability: 4
  confound_control: 4
  feasibility: 3
  negative_result_value: 5
strongest_objection: >
  Enacted-rung state convergence may be infeasible or leak through
  side-channels (memory artifacts referencing excluded state), and the
  lived-vs-told contrast could reduce to a context-formatting effect if
  the information-equivalence audit is weaker than believed. L3 and L8
  exist because of this objection.
revision_needed: >
  None before build; L1-L8 are the revision mechanism. The L1 smoke is the
  cheap disambiguating test and precedes all provider spend.
cheap_disambiguating_test: >
  Provider-free Session A smoke: the history-dependent scripted responder
  must flip material_follow_through across matched histories, the paired
  scorer must detect it, and a trivial raw-event observer must recover it.
```

`research-decision/v1`:

```yaml
schema_version: research-decision/v1
decision: >
  Adopt the lived-vs-told causal-social-memory and observer-legibility
  experiment as the single active research target, superseding the V2
  embodied co-actor legibility plan.
verdict: redesigned-active-plan
evidence_used:
  - 2026-07-10 repo verification: memoryless scripted responder
    contradicting the V2 positive-control declaration; label-consuming
    predictor arms including the treatment arm; C2-G material rows being
    focal-actor physical outcomes; failed C2-G gate (max_lift -0.15)
  - 2026-07-10 literature lanes: cited-paper verification and adversarial
    novelty scan (section 11)
  - ZERO_COST_IMPLEMENTATION_RULE (AGENTS.md)
alternatives_considered:
  - continue V2 Phase B after fixing the scripted responder (rejected:
    soul-as-IV is unsupported as a behavior driver; the implemented
    observer design collapses into labeled K-shot adaptation, occupied by
    arXiv 2605.12411)
  - adopt "Same World, Different History" with the actor-side causal
    effect as headline (rejected: occupied by text-game literature incl.
    arXiv 2605.08060; embodiment alone is "known effect, new skin")
  - decay/interference of social memory under long logs (rejected: arXiv
    2605.08060 owns the core finding)
  - kill/defer the program (rejected: the lived-vs-told x legibility
    composition is verified unoccupied, cheap to falsify, and the
    substrate already exists)
strongest_objection: >
  Enacted state convergence feasibility (L3) and information-equivalence
  of narration (L8).
accepted_risk: >
  The likely outcomes include L2/L4-shaped negative results. Both are
  publishable design constraints for multi-agent LLM systems and are
  cheaper than continuing to build toward an unmeasurable V2 claim.
next_action: >
  Session A build per lived-vs-told-implementation-plan.md; no live
  provider calls before the L1 smoke, the quota preflight, and the
  scoop-check artifact.
what_not_to_do_next: >
  Do not run persona/soul conditions, decay-curve headlines, VLA or
  training arms, actor-count scaling, or label-consuming observer arms as
  treatment. Do not make GPT-5.6 Sol (or any provider) a scientific
  dependency of the experiment; implementation-agent roles only. Do not
  interpret C2-G as research data.
```
