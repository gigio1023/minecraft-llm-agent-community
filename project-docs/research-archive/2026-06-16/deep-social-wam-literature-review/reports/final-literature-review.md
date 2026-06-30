# Final Literature Review: A Hierarchical World Action Model for Evidence-Grounded Minecraft Societies

Date: 2026-06-16. Coordinator synthesis of a six-lane deep literature review.
107 unique sources; 39 with LaTeX read; per-source notes in `../notes/by-paper/`,
themes in `../notes/by-theme/`, matrices in `../matrices/`, manifest in
`../source-manifest.jsonl`. Primary-source facts are separated from
interpretation; "mechanically useful" is separated from "research contribution";
evidence tooling is treated as support, not as the contribution.

---

## 1. Executive summary

- A **World Action Model (WAM)** is a model of `p(o', a | o, l)`: it jointly
  predicts the future state `o'` and an action `a`, unlike a VLA (`p(a|o,l)`,
  reactive) or a plain world model (`p(o'|o,a)`, dynamics only). The canonical
  survey (arXiv 2605.12090) defines WAM as **modality-independent** - pixels are
  "merely one possible proxy"; the future state may be an "implicit physical
  representation." (§2)
- The mainstream WAM is **robot manipulation, pixel/video, and very recent
  (2026)**. It is costly (DreamZero: 7Hz at 14B; ≥4.8× slower than π0.5), its
  inference-time pixels are often dispensable (Fast-WAM, Privileged Foresight
  Distillation), and visual fidelity does not imply control (IDM Turing test
  collapse). (§9)
- Therefore the recommended path for this repo is a **structured-state, advisory,
  hierarchical social-material WAM**, not a pixel model. `o`/`o'` are typed
  Minecraft + social state; the WAM predicts deltas before an action and is scored
  against Mineflayer verifier evidence after; it never acts, fills arguments, or
  overrides the verifier. (§3)
- The hierarchy is **Physical -> Material -> Social -> Institutional** (§4-7). A social
  claim ("Bob can now mine") is only meaningful once a physical fact ("Bob holds a
  pickaxe, durability>0") verifies - so the layers stack.
- This sits in an **empty cell** no surveyed system fills: no game/world model, no
  Minecraft multi-agent benchmark, and no LLM social simulation **predicts and
  verifies** social-material transitions (possession, claims, obligations, trust,
  affordances) as durable state. (§14-15)
- The contribution is modest and defensible: **action-conditioned, hierarchical,
  structured social-material transition modeling in embodied Minecraft, scored
  against deterministic verifier evidence, with prediction and action as separate
  axes** - small-N, falsifiable, not civilization-scale. (§17-18)
- Feasibility is unusually good because the repo's **verifier auto-labels
  `(o,a,o')` triplets for ~$0** in a modality no public dataset covers. First build:
  a provider-free zero-shot delta-predictor harness + a transition-row logger over
  existing artifacts; first evaluation: predict relationship-ledger transitions
  (the verifier that already exists). (§12-13, §20)

## 2. WAM from first principles

Notation (survey 2605.12090): `o` observation, `l` instruction, `a` action, `o'`
next state.

| Paradigm | Objective | Role |
|---|---|---|
| VLA | `p(a \| o, l)` | reactive observation->action; no dynamics |
| World Model (WM) | `p(o' \| o, a)` | predicts next state; a learned simulator; does not select actions |
| **WAM** | `p(o', a \| o, l)` | jointly predicts future state **and** action |

A WAM must satisfy two criteria: **forward predictive modeling** (forecast `o'`,
explicitly as pixels *or* implicitly as a physics-grounded latent) and **coupled
action generation** (actions aligned to the anticipated `o'`). Two architectures:
**Cascaded** `p(o',a|o,l)=p(a|o',o,l)-p(o'|o,l)` (imagine-then-execute) and
**Joint** (co-optimized shared representation).

Disambiguation (primary-source): WAM ≠ **Video Action Model** (video is one proxy;
WAM is a modality-independent superset); ≠ **Video Policy** (those lack an explicit
predictive commitment to `o'`); ≠ **simulator/WM** (no action selection);
≠ **VLA** (no dynamics). Versus **model-based RL / Dreamer**: Dreamer learns a
latent WM and trains an actor-critic *in imagination* - the WM is a simulator and
the policy is trained inside it, rather than a per-step joint `p(o',a)`. Versus an
**LLM tool-use agent + Mineflayer runtime** (this repo): the actor selects a typed
action under strict schemas and the runtime owns physical truth - there is no
learned forward model at all, so it is neither VLA nor WAM today. Full table:
`../matrices/wam-vs-vla-vs-policy-vs-runtime.md`.

What a WAM can predict spans **pixels** (MineWorld, Oasis, Matrix-Game, Solaris,
Genie), **latent state** (Dreamer, JEPA), **explicit/symbolic state** (WildWorld's
per-frame annotations), **reward**, and **trajectories** - the definition is
deliberately modality-independent.

Is the WAM the actuator, planner, evaluator, transition model, or counterfactual
simulator? **All of these at different layers in the literature.** As actuator:
DreamZero ("WAMs are zero-shot policies"). As learned simulator: MineWorld/Solaris.
As counterfactual planner: V-JEPA2-AC, model-predictive control. As **evaluator**:
FFDC (2605.06222) uses the predicted future as an expectation and a separate
verifier compares predicted-vs-observed to decide trust/replan. For this repo's
hard rule (WAM stays advisory), only the **evaluator + counterfactual-transition**
framings are admissible; the actuator framing is out of scope.

## 3. Recommended hierarchical WAM formulation for this repo

A **hierarchical, structured-state, advisory WAM**: action-conditioned prediction
of typed Minecraft social-material state transitions, scored against verifier
evidence. Realize the **Cascaded** form conceptually but build only the `p(o'|o,l)`
half (the predictor); the Actor Turn still chooses `a`, the runtime still owns
truth. This is S3AP's "Foresee and Act" (2509.00559) made verifiable and FFDC's
verifier loop made the interface. Full object + per-layer I/O:
`../notes/by-theme/hierarchical-wam-for-minecraft-societies.md`.

Inputs: physical + material + social + institutional state + actor frame
(ActorSoul/LifeGoal, evidence-linked memory, PlanBead ready front) + a candidate
typed action. Outputs (advisory): physical/material/social/institutional deltas +
future constraints + expected evidence + uncertainty.

## 4. Physical WAM layer

Predicts inventory/block/container/position/vitals/durability deltas, time cost,
failure modes, newly available/blocked affordances. Actions: `move_to`,
`mine_block`, `place_block`, `craft_item`, `inspect_chest`, `deposit_shared`,
`consume_item`, action skills. Verifier exists today (`verifyTask`,
`last_tool_result` before/after, `runtime_hooks[post]`,
`social-cycle-review-summary/v1`). This layer is **calibration**: it must be
reliable before any social claim is scored, and passing it is never social
progress. The latent-WM line (DreamerV3/4: diamonds, real-time, single GPU, with
inventory state as input) proves structured/latent physical modeling is the cheap,
capable path in Minecraft.

## 5. Material / Economic WAM layer (highest leverage)

Predicts who-has-what after a transfer; control of tool/station/container/place;
scarcity; claim/access state change (`personal -> claimed -> disputed`); weak-commons
consumption; public-affordance creation; cost imposed on another actor. Uses the
repo's fixed vocabulary (personal possession, material claim, public affordance,
weak commons, unclaimed world resource, obligation/credit). Verifier: inventory/
container snapshots exist; **the material-claim/obligation/public-affordance ledgers
are designed but unbuilt (0 code matches, 2026-06-16) - this is the main new
typed-state work.** Closest literature: MineCollab `givePlayer` (handoff, no
obligation tracking) and GLEE (verifiable economic terminal); the durable-claim
layer is unoccupied. Demote heavy commons (Ostrom full-CPR) to lightweight
weak-commons/public-affordance.

## 6. Social WAM layer (verifier already exists)

Predicts obligation created/fulfilled/violated, trust/friction update, relationship
transition, accept/refuse likelihood, memory commitment, future social cost.
Actions: request/promise/refuse/accept/warn/handoff/return/repair/blame/thank
(chat + social action skills). **The `relationshipLedger` is already a real
evidence-gated enum state machine**, so the Social WAM can be evaluated *now* by
predicting the next enum transition and scoring against the actual one - the
cheapest first prediction experiment, before material ledgers exist. Governing
principle (Lane 4): behavioral proxy ≠ internal state - trust is a ledger enum
moved by evidence, not a feeling; an obligation is a credit-slip, not felt
indebtedness; never assign social meaning to a lone delta without interaction
context (Mead/Blumer). S3AP proves structured social-state prediction helps and is
**separable** from acting skill ("stronger agent ≠ better world model");
belief-behavior inconsistency (2507.02197) is why we verify the enacted transfer,
not the utterance.

## 7. Institutional / Settlement WAM layer (weakest; most cautious)

Predicts role/routine reinforcement, norm conformance/violation, weak-commons
maintenance, settlement persistence, and **post-goal continuation**. A routine is
*repeated verified behavior across cycles*, not an LM label; a norm needs observed
history + sanction evidence (`SanctionEvent`, from the public-sanctions model
2106.09012). This layer is the least empirically supported anywhere: a single
coordinated episode is not an institution; the micro->macro transition (Coleman's
boat) needs multi-actor, multi-episode evidence the repo lacks; train-test
contamination (Concordia) makes "emergent constitution/religion" claims fragile, so
study micro material interactions. GovSim's finding anchors the whole project:
the ability to form beliefs about others correlates **r=0.83** with survival - i.e.
a Social-WAM capability *is* the bottleneck, not dialogue fluency.

## 8. (reserved - layer detail lives in the capstone theme file)

See `../notes/by-theme/hierarchical-wam-for-minecraft-societies.md` §3 for the
full per-layer input/predicted-delta/verification/honesty specification.

## 9. Why pixel/video WAM is probably NOT the immediate path

Evidence, not preference (`../notes/by-theme/wam-foundations.md` §7):

- **Cost/latency**: DreamZero 7Hz at 14B after a 38× speedup (vs 50Hz for
  non-generative VLAs); a WAM step ≥4.8× slower than π0.5; MineWorld emits
  40k-160k tokens per 16 frames.
- **Inference-time pixels are dispensable**: the survey's open challenges note
  removing the future-prediction head at test time "does not necessarily degrade
  downstream control"; Fast-WAM/GigaWorld skip future video at inference; Privileged
  Foresight Distillation shows the future signal is "a compressible correction to be
  distilled."
- **Fidelity ≠ control**: the IDM Turing test shows visually convincing models
  "collapse to nearly zero" executable success; "improvements in visual fidelity do
  not necessarily translate to better planning"; the actionable-simulators survey
  names this "visual conflation."
- **Hidden state is not in the pixels**: WildWorld shows actions act through hidden
  state ("shoot"->ammo) invisible in frames; `lend_item`->possession+obligation is the
  exact social analogue.

## 10. Why structured physical-material-social transition modeling is more feasible

- A typed delta (possession move, obligation created, trust update) is orders of
  magnitude smaller than a frame, runs at the LLM Actor Turn's multi-second cadence
  with no pixel-decoding cost, and is **directly checkable** against the repo's
  existing structured evidence (inventory, container, transcript, verifier).
- The repo's deterministic Mineflayer world + verifier yields simulation-grade
  `(o,a,o')` triplets - the unit the WAM survey prizes - **auto-labeled for ~$0**.
- DreamerV3/4 are the existence proof that structured/latent (not pixel-primary)
  world modeling does the hard long-horizon Minecraft work on a single GPU.
- The survey's own frontier is moving this way ("latent-predictive (JEPA-style)").

## 11. How existing model weights may be used

Reusable Minecraft/game weights are all **pixel** models: `Etched/oasis-500m`,
`Skywork/Matrix-Game(-2.0)`, `nyu-visionx/solaris`, MineWorld (Microsoft, weight
location unconfirmed via `hf` search), plus VPT/STEVE-1/GROOT/ROCKET/JARVIS-VLA
re-hosted by CraftJarvis. AVID shows even a frozen/API-only video model can be
adapted via an adapter. **But all output pixels** -> at most a *visual sidecar* (e.g.
render a scene for human review), never the structured social predictor or runtime
authority (which the SPEC forbids anyway). There is **no off-the-shelf structured
social WAM**; the LLM-as-zero-shot-delta-predictor (the project's first step) reuses
the LLM's existing world knowledge instead of weights.

## 12. What dataset this repo should collect

A **structured social-material transition dataset** auto-labeled by the verifier
(`../notes/by-theme/data-and-training-feasibility.md`). One row = one Actor Turn
action attempt: `state_before` (typed) + `candidate_action` (typed tool call) +
`predicted_delta` (the only new field; from the zero-shot harness or a weak
baseline) + `verified_delta` (auto-labeled) + `social_delta` (from the event
ledger) + `evidence_refs` + `future_constraints`. The repo already emits
`social-cycle-review-summary/v1`, `settlement-state/v1`, and
`grounded-social-trajectory-report/v1` that materialize most of a row; the missing
pieces are the explicit `predicted_delta` and an at-scale social-event emitter.
Volume is bounded by run throughput + provider budget (hundreds-low-thousands of
rows in 2 months), not by annotation. Latent-action discovery (LAPA) is explicitly
**not** needed - the repo already has a typed action vocabulary.

## 13. What benchmark should be built first

Build order from the repo ladder + Lane 6's families
(`../notes/subagent-briefs/lane-6-repo-adaptation.md`,
`../matrices/repo-adaptation-matrix.md`):

1. `competence_gate` (Physical only) - calibration; already mostly exists.
2. **`borrowed_tool_v1`** (Material + Social, dyadic) - request -> lend/refuse ->
   physical use -> return/debt/repair. **This is the first social benchmark to
   build.** Replace the current decision-only, keyword-scored seed
   (`borrowedTool.ts`, `textIncludesAny` substring matching) with typed-delta +
   relationship-ledger scoring, and add the live inventory/container handoff
   evidence that is missing today.
3. then `claimed_chest_v1`, `asymmetric_knowledge_v1`, `public_furnace_v1`,
   `scarce_food_v1`, `failed_promise_v1` (a strong negative control against
   progress-laundering), and a post-goal-continuation overlay.

Cheapest first prediction experiment (before material ledgers exist): predict the
**relationship-ledger enum transition** for a social action and score it against the
actual transition.

## 14. What the literature already covers

- Physical/visual world modeling in Minecraft: thoroughly (MineWorld, Oasis,
  Matrix-Game, Solaris pixels; DreamerV3/4 latents).
- Minecraft task competence + multi-agent coordination: thoroughly (MineDojo,
  Voyager, JARVIS, Optimus, MCU, MineExplorer; MineCollab, TeamCraft, VillagerBench,
  MineLand, CausalMACE) - with an honest comms-bottleneck finding.
- Social constructs + evaluation vocabulary: thoroughly (Generative Agents memory/
  reflection; SOTOPIA's 7 dims; GLEE efficiency/fairness; S3AP structured social
  world model; Concordia grounded variables).
- Validity boundaries: thoroughly (SimBench 40.8/100 ceiling; belief-behavior
  inconsistency; empirical-realism requirement; LLM-judge unreliability).
- Sociology of the relevant constructs: well-established (Weber, Mead/Blumer,
  Goffman, Homans/Blau, Coleman, Granovetter, North, Ostrom, Bicchieri/Elster,
  routines), with GovSim + public-sanctions showing partial computational instances.

## 15. What remains genuinely open

1. **The empty social-material cell**: no system predicts-and-verifies who-has-what
   / who-owes-whom / who-can-now-do-what as durable state. (Primary gap.)
2. **Joint, world-verified prediction-vs-outcome evaluation**: the WAM survey names
   this missing (Counterfactual Consistency / Foresight-Conditioned Success); a
   deterministic Mineflayer verifier can supply the physical ground truth robotics
   cannot cheaply get.
3. **Hierarchical world-action modeling**: named an open challenge in the survey;
   the Physical->Material->Social->Institutional stack is a concrete instantiation
   (with the Institutional layer least proven).
Full table: `../matrices/research-gap-matrix.md`.

## 16. How this differs from MineStudio, MineDojo, Voyager, Project Sid, SOTOPIA, Concordia

- **MineStudio**: a visual-policy/MineRL toolkit (sim, callbacks, VPT/STEVE/GROOT/
  ROCKET, datasets, VLM review). Offline reference for manifest/reset/record
  discipline and competence gates; **not** a runtime replacement; its layer is
  pixels, this repo's is Mineflayer + evidence + social state.
  (`../notes/by-theme/minestudio-positioning.md`)
- **MineDojo**: open-ended task suite + knowledge base; competence-gate and
  task-pressure inspiration; task diversity is not the social target.
- **Voyager**: LLM skill-library agent; the repo adapts skill accumulation as
  actor-owned, evidence-gated action skills; not race-to-tech-tree.
- **Project Sid**: nearest embodied many-agent north-star, but **claim-only** (no
  code/data/logs) and its social/civilization metrics are LM-judged plausibility;
  only taxation compliance is a verified material transition. The repo keeps the
  embodiment, drops the civilization framing and LM-judged signals, and verifies.
  (`../notes/by-theme/project-sid-critical-review.md`)
- **SOTOPIA**: dialogue-only social evaluation; gives the dimension names; six of
  seven dims are LLM-judged plausibility, and the judge is weak on diffuse
  constructs and over-rates at long context.
- **Concordia**: grounded-variable social simulation, but its Game Master is an LLM
  that narrates outcomes; the repo's GM is Mineflayer + validators (non-generative),
  which is exactly the provider-authority the SPEC forbids handing to an LLM.

## 17. Proposed research question

> Can a hierarchical, action-conditioned world model predict and evaluate how
> Minecraft actions transform physical state, material economy, social relations,
> memory, and future action opportunities for LLM-controlled embodied actors -
> where every predicted transition is checked against deterministic Mineflayer
> verifier evidence, and prediction accuracy is scored separately from acting
> outcome?

## 18. Proposed contribution claims (modest, defensible)

1. A **formulation**: hierarchical structured social-material WAM
   (Physical->Material->Social->Institutional) as an *advisory* predictor in an
   evidence-grounded runtime, distinct from pixel WAMs and from dialogue-only social
   simulation.
2. A **representation + dataset**: a verifier-auto-labeled social-material
   transition record, occupying a quadrant the canonical (pixel, robotics) WAM data
   landscape leaves empty.
3. An **evaluation protocol**: world-verified transition-prediction accuracy per
   layer, with prediction and action as separate axes, partner/seed named, cost and
   failures reported - the joint causal-consistency metric the WAM survey says the
   field lacks.
4. A **benchmark ladder** (competence gate -> dyadic material claim -> asymmetric
   knowledge -> weak public affordance -> mixed-motive -> post-goal continuation).

Not claimed: a pixel world model, a civilization, human-society fidelity, or that
evidence tooling is the contribution.

## 19. Proposed evaluation metrics

Primary (unique to the WAM): **transition-prediction accuracy** per layer (P/M/S/I)
- predicted delta vs verified delta. Shared with the existing benchmark plan:
obligation-lifecycle completion; material-flow correctness; cross-actor dependency;
communication-action coherence; memory/relationship continuity; post-goal
continuation; efficiency (provider calls, tokens, cost, latency, action count);
robustness (seed/partner/model matrix). Validity discipline: anchor every social
score to a verified delta; never an LLM judge as primary truth; always name
partner/seed; watch variance collapse. (`../matrices/benchmark-metrics-matrix.md`)

## 20. Implementation implications

- Attach an advisory WAM at the existing seam: extend `ActorTurnExpectedOutcome`
  (pre-action) to typed P/M/S/I deltas; score via `evaluateExpectedOutcomeAgainstDeltas`
  (post-action) against observed deltas. The resolver/verifier stay in control; no
  new authority (observe-only policy).
- New support infrastructure (not the contribution): a `PredictedTransition`
  artifact; material-claim/obligation/public-affordance ledgers; a paired
  transition-row logger (`social-material-transition/v1`); a two-actor live
  scenario; generic before/after state snapshots; an at-scale social-event emitter.
- 2 weeks: ROW schema + post-run logger + provider-free zero-shot delta-predictor
  harness + ~50-100 hand-labeled eval transitions.
- 2 months: social-event emitter + K≈hundreds-low-thousands rows + prediction-vs-
  evidence scorecard + small learned head (rules/GBDT physical + small adapter
  social).
- 6 months: dyadic + settlement benchmark families + model comparison (all advisory).
- Cost realism: predict-then-act doubles provider calls; budget against the existing
  quota policies.

## 21. Risks and overclaim boundaries

- Do not claim a pixel/video world model, a civilization, or human-society fidelity
  (no real-human ground truth; SimBench 40.8/100; Don't-Trust impossibility).
- Keep the WAM advisory: never act, gate serving, fill args, or override the
  verifier.
- Do not present evidence tooling, competence-gate success, or task completion as
  the social contribution.
- Do not use an LLM judge as primary social truth (over-rates at long context).
- Institutional-layer claims are weakest - frame as predicted deltas / hypotheses
  needing multi-actor multi-episode evidence.
- Beware train-test contamination (cooperative Minecraft tropes are in pretraining);
  measure behavior against the world, do not assume organic cooperation.
- Always name model + partner + seed; report cost and failures; re-measure before
  generalizing.
- Verify the unconfirmed MineWorld weight location and primary-source sociology
  quotes before any external publication (flagged gaps).
```
```
```text
Top 10 references (coordinator ranking, by leverage on the decision):
1. 2605.12090  WAM survey - the definition + modality-independence + open challenges
2. 2509.00559  S3AP / Social World Models - structured social WAM, the bridge
3. 2605.06222  FFDC When-to-Trust-Imagination - WAM-as-verifier (advisory framing)
4. 2602.22208  Solaris - only multiplayer Minecraft WM; social-material column empty
5. 2509.24527  Dreamer 4 (+2301.04104 DreamerV3) - structured/latent feasibility proof
6. 2603.23497  WildWorld - hidden-state-not-in-pixels; State Alignment metric template
7. 2404.16698  GovSim - belief-of-others ↔ survival r=0.83 (Social-WAM is the bottleneck)
8. 2510.17516  SimBench - validity ceiling 40.8/100; overclaim boundary
9. 2411.00114  Project Sid - nearest north-star + cautionary claim-only tale
10. 2504.17950 MineCollab/MINDcraft - typed handoff exists, obligation ledger does not
```
