# Research Gap Matrix

Coordinator-owned capstone matrix. Synthesizes all six lanes into "what the
literature already covers" vs "what is genuinely open" vs "the repo's opportunity",
organized by (A) the four WAM layers and (B) the core investigation questions.
Every row is backed by a lane theme file / by-paper note.

## A. By WAM layer

| Layer | Covered by literature | Genuinely open | Repo opportunity (defensible) |
|---|---|---|---|
| **Physical WAM** (movement, mining, crafting, inventory/block/container deltas, vitals, durability, failure modes) | Heavily. Pixel WMs (MineWorld, Oasis, Matrix-Game, Solaris) predict next frames; latent WMs (DreamerV3/4) predict latent physical state and act; robotics WAMs predict video+action. Minecraft physical dynamics are well-modeled. | Cheap, *structured* (non-pixel) physical-transition prediction tied to a deterministic verifier is under-instantiated (everyone predicts pixels or latents for control, not typed state deltas). | Predict typed physical deltas (inventory/block/container/position/durability) and auto-score against the Mineflayer verifier — the calibration layer beneath everything. Reliable here is a *precondition*, not the contribution. |
| **Material / Economic WAM** (possession, control of tool/station/container/place, scarcity, claims, borrow/lend, weak commons, public affordances, cost to others) | Thinly. MineCollab has typed `givePlayer` handoff; GLEE has verifiable economic terminal states; MineLand has needs/scarcity; Concordia tracks grounded "possessions/money". | **No system tracks possession + material claims as durable state over time, nor scores obligation/credit from a transfer.** Game WMs: empty. Multi-agent Minecraft: resolves to task completion. | The repo's `personal possession / material claim / public affordance / weak commons / obligation-credit` vocabulary is net-new as a *predicted-and-verified* layer. Highest-leverage open cell. |
| **Social WAM** (request, promise, refuse, accept, warn, handoff, return, repair, blame, gratitude, trust, reputation, obligation, memory commitment) | Vocabulary is rich (SOTOPIA's 7 dims, Generative Agents memory/reflection) and **S3AP formalizes a structured social world model** `p(A⁻ⁱ|S),p(S'|S,A,aⁱ)`. | All of it is **scored as dialogue plausibility / LLM-judged**, not as verified world consequence. S3AP's "state" is an LLM parse of narrative; SOTOPIA's material dim is judge-scored, not ledger-enforced. | Re-ground every social delta to a Mineflayer-verified material/claim/obligation/memory change; score *prediction accuracy* (advisory social WAM) separately from acting outcome. The S3AP idea, made verifiable. |
| **Institutional / Settlement WAM** (routines, roles, division of labor, norms, ownership practice, weak-commons maintenance, settlement persistence, post-goal continuation) | GovSim (Ostrom CPR + LLMs), public-sanction norm model, Project Sid's specialization/constitution/taxation, sociology (North/Ostrom/Bicchieri/Nelson-Winter). | **Weakest, least-proven everywhere.** Norms/routines/micro→macro emergence need multi-actor, multi-episode evidence; train-test contamination makes "emergent institution" claims fragile; Sid's are LM-inferred. | Treat as long-horizon `future_constraints` prediction + post-goal continuation; claim *routines as repeated verified behavior*, not LM labels; the hardest, most cautious layer. |

## B. By investigation question

| Question | What literature settles | What stays open / the repo's answer |
|---|---|---|
| What exactly is a WAM? | `p(o',a|o,l)` = joint future-state + action; two criteria (forward predictive modeling + coupled action generation); Cascaded vs Joint (2605.12090). | Settled. The repo adopts the *modality-independent* reading: a structured-state social-material WAM is inside the definition. |
| WAM vs simulator / planner / VLA / visual policy / model-based RL / LLM tool-use / Mineflayer runtime | Survey + DreamZero disambiguate WAM/WM/VAM/Video-Policy/AWM; Dreamer = latent WM + actor-critic in imagination; simulator = `p(o'|o,a)` without action selection. | The repo's actor is an **LLM tool-use agent + Mineflayer runtime** (no learned forward model today). A WAM, if added, is an *advisory predictor/evaluator*, never the actuator. (matrix: `wam-vs-vla-vs-policy-vs-runtime.md`) |
| What does "using WAM to perform actions" mean here? | Mainstream: the WAM *is* the policy (DreamZero). FFDC: the WAM is a *verifier* of an executing policy. | For this repo: **not** acting via the WAM. The WAM predicts deltas before an action and is scored against verifier evidence after; the Actor Turn still selects, the runtime still owns truth. |
| Is WAM the actuator / planner / evaluator / transition model / counterfactual simulator? | All of these at different layers in the literature. | For this repo: **evaluator + counterfactual transition model only** (advisory). Actuator/policy framing is explicitly out of scope (SPEC). |
| What physical predictions are required before social predictions are meaningful? | Layer dependency is implicit in robotics WAMs (contact before outcome). | Made explicit: a social claim ("Bob can now mine") depends on a verified physical fact ("Bob holds a pickaxe, durability>0"). Physical WAM must be calibrated first. |
| Predict pixels / latent / symbolic / social-material deltas / future affordances / hybrid? | Pixels (most), latent (Dreamer/JEPA), explicit state (WildWorld), reward, trajectories. | The repo predicts **typed social-material state deltas + future affordances** (the structured/implicit branch), not pixels. Evidence: cost, dispensable inference-pixels, fidelity≠control, hidden-state-not-in-pixels. |
| Can existing weights be an initial consequence predictor? | Yes for pixel WAMs (AVID adapter; oasis-500m, Matrix-Game, Solaris, MineWorld). | But all output pixels → at most a **visual sidecar for human review**, never the structured social predictor or runtime authority. No off-the-shelf structured social WAM exists. |
| What data is needed to train/evaluate a WAM? | Canonical: robot teleop + human video + sim + ego video (huge, pixel). | The repo auto-labels `(o,a,o')` triplets from the **verifier for ~$0** in a modality no public dataset covers. Volume is bounded by run throughput, not annotation. (theme: `data-and-training-feasibility.md`) |
| Can Mineflayer runtime logs become a transition dataset? | n/a (novel). | **Yes** — the repo already emits `social-cycle-review-summary/v1`, `settlement-state/v1`, `grounded-social-trajectory-report/v1` that materialize most of a transition row; the missing field is an explicit `predicted_delta`. (ROW schema in Lane 5 theme.) |
| What is feasible in 2 weeks / 2 months / 6 months? | n/a (planning). | 2wk: freeze ROW schema + post-run logger + provider-free zero-shot delta-predictor harness + ~50–100 hand-labeled eval transitions. 2mo: social-event emitter + K≈hundreds–low-thousands rows + prediction-vs-evidence scorecard + small learned head. 6mo: dyadic + settlement benchmark families + model comparison (all advisory). |
| What makes this different from MineStudio/MineDojo/Voyager/Sid/SOTOPIA/Concordia? | Each occupies a different cell (visual policy / task suite / skill agent / civilization claim / dialogue social eval / LLM-GM social sim). | **None predicts-and-verifies social-material transitions in an embodied world.** That empty cell — structured, advisory, verifier-grounded, small-N, modest — is the contribution. |

## C. The three sharpest gaps (ranked)

1. **The empty social-material cell.** Across game/world models (Lane 1), Minecraft
   multi-agent (Lane 2), and social sim (Lane 3), *no system predicts and verifies*
   who-has-what / who-owes-whom / who-can-now-do-what as durable state. Solaris (the
   only multiplayer Minecraft WM) models pixels with zero social-material state;
   MineCollab has handoff with no obligation ledger; S3AP has structured social state
   but scores it on dialogue. **This is the primary, defensible gap.**

2. **The evaluation-decoupling gap, solvable by construction here.** The WAM survey
   names the missing piece: "joint metrics quantifying causal consistency between
   imagined futures and generated actions" (Counterfactual Consistency,
   Foresight-Conditioned Success). Robotics can't cheaply ground physical
   correctness; a deterministic Mineflayer verifier *can*. The repo can offer the
   joint, world-verified prediction-vs-outcome metric the field lacks.

3. **The hierarchical-WAM gap, named in the survey.** "A principled framework for
   hierarchical world-action modeling — connecting high-level semantic decomposition
   to low-level physical prediction — remains a critical open challenge." The repo's
   Physical→Material→Social→Institutional stack is a concrete, domain-grounded
   instantiation (with the honest caveat that the Institutional layer is least
   proven and needs multi-actor, multi-episode evidence).
