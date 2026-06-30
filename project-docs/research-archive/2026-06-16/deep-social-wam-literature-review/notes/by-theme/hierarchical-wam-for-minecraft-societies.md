# Hierarchical WAM for Minecraft Societies (capstone synthesis)

Coordinator-owned capstone. Integrates all six lanes into one recommended
hierarchical World Action Model (WAM) formulation for this repo. Jargon defined on
first use. Primary-source facts vs interpretation are separated; "mechanically
useful" vs "research contribution" is kept distinct throughout.

Companion lane files: `wam-foundations.md`, `minecraft-world-models.md`,
`minecraft-vla-and-visual-policy.md`, `minecraft-agent-benchmarks.md`,
`minecraft-multi-agent-social.md`, `minestudio-positioning.md`,
`llm-social-simulation.md`, `benchmark-validity-and-evaluation.md`,
`project-sid-critical-review.md`, `sociology-grounding-for-social-wam.md`,
`data-and-training-feasibility.md`. Matrices: `../matrices/`.

## 1. The recommendation in one paragraph

Adopt a **hierarchical, structured-state, advisory World Action Model**:
action-conditioned prediction of typed Minecraft *social-material* state
transitions, scored against Mineflayer verifier evidence. Concretely, a WAM here
is `p(o', a | o, l)` (joint future-state + action; survey 2605.12090) instantiated
in the survey's *modality-independent / implicit-state* branch — `o` and `o'` are
typed Minecraft+social state, not pixels. It is **advisory**: it predicts deltas
before an action and is compared to verified deltas after; it never selects the
action, fills missing arguments, marks progress true, or overrides the verifier.
The hierarchy stacks Physical → Material → Social → Institutional, each layer's
predictions only meaningful once the layer beneath it verifies.

This is not the mainstream pixel/video WAM (that is robot manipulation, costly,
and fidelity-not-control; §6 of `wam-foundations.md`). It is the empty cell every
surveyed system leaves open (`../matrices/research-gap-matrix.md`).

## 2. The model object

```text
Inputs (o, l):
  - physical state: positions, inventory, blocks, containers, stations, vitals,
    tool durability, loaded-world limits, verifier/action-skill evidence refs
  - material state: possession, claims, access, weak-commons availability,
    public-affordance availability, open obligations/credits
  - social state: relationship-ledger edges (trust/obligation/dependency/
    friction/familiarity enums), recent requests/promises/refusals
  - institutional state: roles, observed routines, norm records, settlement state
  - actor frame: ActorSoul/LifeGoal, evidence-linked memory, PlanBead ready front
  - candidate action a: a typed primitive, action skill, or social action

Outputs (o', advisory):
  - physical delta: inventory/block/container/position/durability/vitals changes
  - material delta: possession move, claim/access change, affordance created/used,
    cost imposed on another actor
  - social delta: obligation created/fulfilled/violated, trust/friction update,
    relationship transition, memory commitment
  - institutional delta: role/routine reinforcement, norm conformance/violation,
    settlement persistence signal
  - future constraints: what becomes easier / harder / blocked / socially required
  - expected evidence: which verifier/inventory/container/chat/memory artifact
    should exist if the transition happened
  - uncertainty/blockers: loaded-world limits, missing tool, absent actor, etc.
```

Architecture choice (from the survey's two options): use the **Cascaded** form
`p(o',a|o,l) = p(a|o',o,l)·p(o'|o,l)` *conceptually* — predict the consequence,
then reason about the action — but realize only the `p(o'|o,l)` half as an
advisory predictor. The action `a` is still chosen by the existing Actor Turn, not
by the WAM. This is exactly S3AP's "Foresee and Act" pattern (2509.00559) made
verifiable, and FFDC's verifier framing (2605.06222) made the control interface.

## 3. The four layers, specified

Each layer below gives: what it predicts, the candidate actions, the verification
source (already in the repo or to be added), and the honesty boundary. The
material-economy vocabulary is the repo's fixed set (`Evidence-Grounded-Minecraft-
Society.md`): personal possession, material claim, public affordance, weak commons,
unclaimed world resource, obligation/credit.

### Layer 1 — Physical WAM (calibration; mostly exists)

- Predicts: inventory/block/container/position/vitals/durability deltas, time cost,
  failure mode, newly available/blocked affordances.
- Actions: `move_to`, `mine_block`, `place_block`, `craft_item`, `craft_with_table`,
  `inspect_chest`, `deposit_shared`, `consume_item`, action skills.
- Verifier (exists today): `verifyTask` before/after; `last_tool_result`
  before/after position; `runtime_hooks[post].progress_classification`;
  `social-cycle-review-summary/v1` judgment outcome.
- Honesty boundary: physical prediction must be reliable before any social claim is
  scored; passing physical gates is **never** social progress.
- Literature: every Minecraft/game WM models this (pixels or latents); DreamerV3/4
  prove latent+structured physical modeling is the capable, cheap path.

### Layer 2 — Material / Economic WAM (designed, mostly unbuilt — highest leverage)

- Predicts: who-has-what after a transfer; control of a tool/station/container/
  place; scarcity pressure; claim/access state change (`personal → claimed →
  disputed`); weak-commons consumption; public-affordance creation; cost imposed on
  another actor.
- Actions: `request_item`, `lend_item`, `return_item`, `deposit_shared`,
  `withdraw_shared`, `place_block` (affordance), `consume_item` (scarce).
- Verifier: inventory/container snapshots before/after (exist); **material-claim +
  obligation + public-affordance ledgers (designed in `Material-Claims-...:336-365`,
  code grep = 0 matches as of 2026-06-16 — must be built).**
- Honesty boundary: personal possession is the default ownership baseline; demote
  heavy shared-commons (Ostrom full-CPR) to lightweight weak-commons/public
  affordance; a transfer is only real if items + durability verify.
- Literature: closest is MineCollab `givePlayer` (handoff, no obligation) and GLEE
  (verifiable economic terminal); the durable-claim layer is the empty cell.

### Layer 3 — Social WAM (verifier exists, prediction layer to add)

- Predicts: obligation created/fulfilled/violated; trust/friction update;
  relationship transition; whether a request will be accepted/refused; memory
  commitment; future social cost.
- Actions: request, promise, refuse, accept, warn, handoff, return, repair, blame,
  thank (chat events + the social action skills `approachAndRequestItem`,
  `handoffItemAtChest`, `waitForBusyCrafter`).
- Verifier (exists today): the `relationshipLedger` is a real evidence-gated enum
  state machine (trust/obligation/dependency/friction/familiarity) whose transitions
  fire *after* observed events. So the Social WAM can be evaluated **now** by
  predicting the next enum transition and scoring against the actual one — before
  the material ledgers exist. This is the cheapest first prediction experiment.
- Honesty boundary (the governing principle, Lane 4): a behavioral proxy is not an
  internal state. Trust is a ledger enum moved by evidence, not a feeling, not a
  float. An obligation is a credit-slip record, not felt indebtedness. Never assign
  social meaning to a lone delta without interaction context (Mead/Blumer).
- Literature: S3AP proves structured social-state prediction helps and is separable
  from acting skill ("stronger agent ≠ better world model"); SOTOPIA gives the
  dimension names; belief-behavior inconsistency (2507.02197) is exactly why we
  verify the enacted transfer, not the utterance.

### Layer 4 — Institutional / Settlement WAM (weakest; most cautious)

- Predicts: role/routine reinforcement, norm conformance/violation, weak-commons
  maintenance, settlement persistence, **post-goal continuation** (does social life
  continue after a local task succeeds?).
- Actions: repeated cross-actor sequences over cycles; sanction events; public-
  affordance upkeep.
- Verifier: recurring evidence-backed sequences across cycles (a routine =
  *repeated verified behavior*, not an LM label); `SanctionEvent` schema (from the
  public-sanctions norm model 2106.09012); settlement state diff over episodes.
- Honesty boundary: this layer is the least empirically supported anywhere. A single
  coordinated episode is not a routine or an institution; norms need observed
  history + sanction evidence; the micro→macro transition (Coleman's boat) needs
  multi-actor, multi-episode evidence the repo does not yet have. Beware train-test
  contamination (Concordia): "constitution/taxation/religion" are tropey priors, so
  study micro material interactions, not headline institutions.
- Literature: GovSim (Ostrom CPR + LLMs; belief-of-others ↔ survival r=0.83 — a
  Social-WAM capability *is* the bottleneck); Nelson-Winter routines; North formal
  (runtime gates) vs informal (observed) rules; Project Sid's only verified signal
  (taxation compliance) is the template, not the religion keyword proxy.

## 4. Where it attaches in the repo (advisory seam)

The repo already has the seam (Lane 6, with code refs):
`ActorTurnExpectedOutcome` (a single-channel pre-action physical forecast,
`types.ts:40-50`) and `evaluateExpectedOutcomeAgainstDeltas` (post-action
comparison to `observed_deltas`, `outcomeContract.ts:238-298`). The WAM extends the
*expected* side to typed multi-layer (P/M/S/I) deltas and is scored against the
*observed* side. The resolver (`resolver.ts:110`) and verifier (`verifyTask.ts:39`)
stay in control. No new authority is introduced — this is mandatory (SPEC; the
observe-only policy).

Minimum new infrastructure (support, not contribution): (1) a `PredictedTransition`
artifact attached pre-action; (2) material-claim/obligation/public-affordance
ledgers; (3) a paired transition row joining predicted+observed+evidence refs; (4)
a two-actor live scenario; (5) generic before/after state snapshots. The transition
ROW schema (`social-material-transition/v1`) and the auto-label split are in
`data-and-training-feasibility.md`.

## 5. How it is evaluated

- **Transition prediction accuracy** (the one metric unique to adding a WAM):
  predicted delta vector vs verified delta vector, per layer (P/M/S/I). This is the
  embodied, verified version of the joint causal-consistency metric the WAM survey
  says the field lacks (Counterfactual Consistency / Foresight-Conditioned Success,
  070-oppo.tex), and of WildWorld's State Alignment.
- Separate **prediction** from **acting outcome** (S3AP: they are different
  capabilities; do not let a good predictor + weak actor be scored as one number).
- Borrow obligation-lifecycle, material-flow correctness, cross-actor dependency,
  communication-action coherence, memory continuity, post-goal continuation,
  efficiency, robustness (the repo's existing benchmark metrics).
- Validity discipline (Lane 3): anchor every social score to a verified world
  delta; never an LLM judge as the primary social score (it over-rates at long
  context); always name the partner/seed (partner-dependence is lane-wide); report
  cost + failure traces as first-class; watch variance collapse, not just mean.

## 6. What is novel vs the literature (the defensible contribution)

- Pixel/game WMs (MineWorld, Oasis, Matrix-Game, Solaris, Genie): predict pixels;
  **social-material column empty**. Solaris is the only multiplayer Minecraft WM and
  it models visual co-presence, not possession/obligation.
- Minecraft multi-agent (MineCollab, TeamCraft, VillagerBench, MineLand, CausalMACE):
  rich coordination, honest comms bottleneck, but **resolve to task completion**; no
  durable claim/obligation bookkeeping; no post-goal continuation.
- LLM social sim (Generative Agents, SOTOPIA, Concordia, S3AP): rich constructs and
  even a structured social world model, but scored as **dialogue plausibility /
  LLM-judged**, not verified world consequence; Concordia's "game master" is itself
  an LLM.
- Project Sid: embodied many-agent, but **claim-only** and LM-judged; only taxation
  compliance is a verified material transition.

The empty cell, and therefore the contribution, is: **action-conditioned,
hierarchical, structured social-material transition modeling in an embodied
Minecraft world, scored against deterministic verifier evidence, with prediction
and action as separate axes** — small-N, modest, falsifiable.

## 7. Overclaim boundaries (carry these into any paper)

- Do **not** claim a pixel/video world model, a civilization, or human-society
  fidelity (no real-human ground truth; Don't-Trust 2506.21974; SimBench 40.8/100).
- Do **not** let the WAM act, gate serving, or override the verifier (advisory only).
- Do **not** call evidence tooling the contribution (it is support).
- Do **not** score social behavior by LLM judge as primary truth.
- Do **not** present competence-gate or task-completion success as social progress.
- Institutional-layer claims are the weakest — state them as predicted deltas a WAM
  *would* forecast and as hypotheses needing multi-actor multi-episode evidence, not
  as demonstrated behavior.
- Always name model + partner + seed; report cost and failures; re-measure before
  generalizing across seeds/partners/worlds.
