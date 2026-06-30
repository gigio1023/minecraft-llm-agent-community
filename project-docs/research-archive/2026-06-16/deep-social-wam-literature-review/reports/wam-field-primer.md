# WAM Field Primer: a newcomer's guide to World Models, VLAs, and World Action Models

Coordinator capstone, wave 2. Date 2026-06-16. Audience: a reader new to the field who
wants to understand what a World Action Model (WAM) is, where it came from, and how it
differs from its neighbors, before reading the application-focused wave-1 reports.

This primer is the on-ramp. It gives the mental model, a glossary, the lineage as a story,
and the one distinction that matters most for this project (WAM vs VLA). Each section ends
with "read next", pointing into the deep, source-backed theme files that do the heavy
lifting. Every claim in those theme files is tied to a primary source; this primer
summarizes and routes.

Scope note: this is research synthesis. No provider/API calls, no runtime edits. Claims are
backed by the cited theme files and by-paper notes. Where a sentence is interpretation
rather than a paper's claim, it says so.

---

## 0. The 60-second mental model

Three objects, three formulas. `o` = observation (current state), `l` = language
instruction, `a` = action, `o'` = the next state.

| Object | Formula | Plain meaning | Chooses an action? | Predicts the future? |
|---|---|---|---|---|
| World Model (WM) | `p(o' \| o, a)` | A learned simulator: given where we are and what we do, predict what happens next. | No | Yes |
| VLA (Vision-Language-Action) | `p(a \| o, l)` | A reactive policy: given what we see and are told, pick an action. | Yes | No |
| World Action Model (WAM) | `p(o', a \| o, l)` | Predict the future AND pick an action coupled to that prediction. | Yes | Yes |

The single bit that defines a WAM (and the thing to remember): it must (1) forecast a future
state `o'` and (2) couple the action to that forecast. A model that predicts but does not act
is a WM. A model that acts but does not predict is a VLA.

WAM is modality-independent. The forecast `o'` can be pixels, a compact latent vector, or a
typed structured state. "World" means internalized dynamics, not a commitment to video. (This
is why a structured social-material predictor can be a legitimate WAM, not a misuse of the
term. The full argument is wave-1's `notes/by-theme/wam-foundations.md`.)

---

## 1. Glossary (read this once, then the rest is easy)

| Term | Plain definition |
|---|---|
| Reinforcement learning (RL) | Learn to act by trial and error to maximize a reward over time. |
| Model-free RL | Learn a policy or value directly from experience, with no model of how the world changes. |
| Model-based RL | Also learn a model of the environment and use it to plan or to imagine experience (more sample-efficient when the model is good). |
| Latent / latent state | A compact learned representation of the world, not raw pixels. "Latent dynamics" = predict forward in this compact space. |
| Imagination / rollout / dreaming | Run a world model forward over many steps, feeding its own predictions back in. Training a policy on these is "learning in imagination." |
| Policy | The action-choosing function. Value function = expected long-run reward. Actor-critic = a policy + a value, improving each other. |
| Planning / MPC | Search over imagined action sequences to pick a good one. Model-predictive control: plan a short sequence, execute the first action, replan. |
| Compounding error | Chaining many one-step predictions lets small errors snowball, so long rollouts drift from reality. The central enemy of long-horizon prediction. |
| Model exploitation | A policy optimized against an imperfect model finds actions that look great in the model but fail in reality. |
| Reconstruction | Decoding a latent back into pixels. "Explicit" models reconstruct; "implicit" (decoder-free) models never do. |
| Value equivalence | A model is value-equivalent if planning in it yields correct returns, even if its internal state looks nothing like the real world. It predicts only what matters for acting. |
| Behavior cloning (BC) | Train a policy to copy expert (observation, action) demonstrations by supervised learning. The substrate of VLAs. |
| Inverse-dynamics model (IDM) | A model that looks at two consecutive states and infers the action between them, `p(a \| o, o')`. The trick for turning action-free video into labeled data. |
| Action tokenization / chunk | How a continuous action becomes discrete symbols a model can emit; a "chunk" is a short sequence of future actions predicted at once. |
| Cross-embodiment | Train one policy on data pooled from many robot bodies so it transfers across them. |
| Teacher forcing vs autoregressive rollout | In training, feed the model ground-truth history (teacher forcing); at inference it must consume its own predictions (autoregressive), causing exposure bias. |
| Diffusion vs autoregressive | Two ways to generate: denoise from noise in several steps (diffusion), or predict the next token/frame from previous outputs (autoregressive). |
| Latent action model (LAM) | Infer a small set of "action codes" from change between unlabeled frames, so a video model becomes controllable without action labels (Genie's trick). |
| Representation collapse | The failure where a latent predictor maps every input to the same constant (loss zero, representation useless). Held off by stop-gradient + EMA targets (JEPA). |
| World simulator | The (contested) claim that a good enough video generator implicitly models the physical world. |
| Advisory vs actuator | An actuator emits the executed action. An advisory predictor only forecasts/evaluates; something else acts. (The distinction that decides what this repo can use.) |

---

## 2. Where world models came from (the "predict-the-world" lineage)

The problem: a model-free agent learns only by trial and error, which is data-hungry. If an
agent can predict the consequences of actions, it can plan or generate cheap imagined
experience instead. The payoff is sample efficiency (PlaNet reported ~200x less environment
interaction than a model-free baseline). The catch, stated from the start: the policy is only
as good as the model, and an imperfect model can be exploited and accumulates multi-step
error.

The spine of the story (each step fixes the previous one's limit):

1. World Models (Ha and Schmidhuber, 2018, `1803.10122`): VAE encoder + recurrent dynamics +
   a tiny controller; famously trained the controller entirely inside the model's hallucinated
   "dream." Introduced the modern "encoder + latent dynamics + controller" decomposition, and
   named the model-exploitation failure first.
2. PlaNet (2018, `1811.04551`): the Recurrent State-Space Model (RSSM, a deterministic memory
   path plus a stochastic uncertainty path); plans in latent space (pixels decoded only as a
   training signal). RSSM becomes the backbone every Dreamer reuses.
3. Dreamer v1/v2/v3 (`1912.01603`, `2010.02193`, `2301.04104`): learn an actor-critic inside
   imagined latent rollouts; v2 added discrete latents and reached human-level Atari purely in
   a world model; v3 used one fixed config across 150+ tasks and was the first to collect
   Minecraft diamonds from scratch (Nature 2025), crucially using structured inventory state
   alongside pixels (not pixel-reconstruction-primary).
4. The value-equivalent branch: MuZero (`1911.08265`) predicts only reward/value/policy, never
   reconstructs the observation, and plans with tree search; it matched AlphaZero without being
   told the rules. TD-MPC2 (`2310.16828`) made this scalable, open, and decoder-free.
5. Boundary case: Decision Transformer (`2106.01345`) casts RL as return-conditioned sequence
   modeling with no explicit forward model, the clean counter-example to "to act well you must
   forecast the world."

The newcomer takeaway: the field has two converging branches, reconstruction-based latent
imagination (Dreamer) and value-equivalent decoder-free planning (MuZero, TD-MPC2). And the
agents that did hard Minecraft control are latent / structured-state, not pixel-primary
generators. Predicting pixels is an expensive and partly unnecessary objective for control.

Read next: `notes/by-theme/wam-lineage-rl-and-latent-dynamics.md` (full genealogy, term
definitions, timeline table) and the unified `matrices/wam-lineage-timeline.md`.

---

## 3. The generative / video branch, and the field's biggest debate

A second, very visible branch generates the world as pixels. Its lineage:

- Roots (2015-2017): action-conditioned video prediction (Atari next-frame prediction, robot
  physical-interaction prediction, then latent variables for multi-modal non-blurry futures).
- IRIS (`2209.00588`): a token world model, dynamics as language modeling over discrete visual
  tokens. DIAMOND (`2405.12399`) pushed back: keep image space and predict frames with diffusion,
  because discretization throws away small details an agent needs.
- GameNGen (`2408.14837`): DOOM running as a real-time diffusion neural game engine, humans
  barely able to tell it from real DOOM.
- Genie (`2402.15391`): a "foundation world model" that learns playable worlds from unlabeled
  internet video by inventing its own latent actions.
- GAIA-1 (`2309.17080`): the same token-world-model idea scaled to real driving, split into a
  dynamics model plus a video-diffusion decoder.

The big debate (the conceptual fault line of the whole field): does generating realistic video
mean a model understands the world?

- The generative camp ("video models are world simulators"): the Sora report claims scaling
  video generation is "a promising path towards building general purpose simulators of the
  physical world."
- The non-generative camp (JEPA, from LeCun's group; I-JEPA `2301.08243`, V-JEPA 2 `2506.09985`):
  do not generate pixels; predict the future in a representation space, because most pixel detail
  is unpredictable and irrelevant. V-JEPA 2 plans real robot control with no pixel generation.

The decisive evidence is that the two coexist: Sora's own report admits correct-looking video
with wrong basic physics (glass that does not shatter, food that does not change state), and
Physics-IQ found physical understanding "severely limited, and unrelated to visual realism."

The newcomer takeaway (the one sentence to keep): high visual fidelity is not, by itself, a
usable world model for control. If the goal is to reason about consequences for a decision, the
prediction target should be the structured, decision-relevant state, not the look.

Read next: `notes/by-theme/wam-generative-video-and-the-world-model-debate.md` (the two-column
debate, Genie's taxonomy table, the timeline). Minecraft pixel world models specifically
(MineWorld, Oasis, Matrix-Game, Solaris) are in wave-1's `minecraft-world-models.md`.

---

## 4. The "act" half, and how it fuses into a WAM

The other lineage produces the action:

- Behavior cloning (BC): copy expert (observation, action) demonstrations. Its weakness is
  compounding error (covariate shift): once the policy drifts off the expert's states, its
  errors snowball.
- VPT (`2206.11795`): BC at internet scale for Minecraft. Pay for a small labeled set, train an
  inverse-dynamics model (IDM) on it, use the IDM to auto-label ~70k hours of unlabeled web
  video, then behavior-clone a foundation policy. The IDM is the load-bearing idea.
- The VLA canon (general robotics): RT-1 (`2212.06817`, action tokenization under BC) -> RT-2
  (`2307.15818`, co-fine-tune a web VLM so semantics transfer to actions; coined "VLA") ->
  OpenVLA (`2406.09246`, open 7B reproducible baseline) -> Octo (`2405.12213`, diffusion action
  head + modular interface) -> pi-0 (`2410.24164`, flow-matching action expert, 50 Hz dexterous
  control) -> FAST (`2501.09747`, frequency-space action tokenization). The progress is less
  about the objective (still BC) and more about which pretrained knowledge the backbone imports
  and how actions are represented. Every canon member is reactive `p(a|o,l)`: none predicts `o'`.

The WAM synthesis (from the WAM survey, `2605.12090`): a WAM must satisfy two criteria, (1)
forward predictive modeling (forecast `o'`, as pixels OR latents) and (2) coupled action
generation (the action is aligned to that forecast). Two architectures:

- Cascaded WAM: `p(o',a|o,l) = p(a|o',o,l) . p(o'|o,l)`. Imagine the future, then read the action
  out of it (often with an IDM). DreamZero (`2602.15922`) realizes this inside one model and is
  the canonical "WAM as a zero-shot policy."
- Joint WAM: predict future state and action together in one shared computation.

When is the prediction load-bearing rather than decorative? The honest answer is "sometimes
decorative": the survey notes you can often remove the future-prediction head at inference
without hurting control. The prediction does the most real work when used as an explicit,
checkable expectation, the verifier framing (FFDC, `2605.06222`): predict the expected next
state, compare predicted-vs-observed, decide whether to trust or replan.

Read next: `notes/by-theme/wam-action-models-vla-and-synthesis.md` (the canon table, the two
worked architecture examples, the load-bearing-vs-decorative analysis).

---

## 5. WAM vs VLA: the distinction to internalize (the project's central question)

This is the section to read twice. It answers "why frame this project as a WAM, not a VLA."

1. Formal. VLA = `p(a|o,l)` (action only). WAM = `p(o',a|o,l)` (joint future + action). WAM adds
   the predicted future `o'` and couples the action to it. VLA has neither.
2. Conceptual. VLA = "perceive, then react." WAM = "imagine the consequence, then act
   consistently with it." One predicts nothing about the world; the other predicts in order to
   decide.
3. Roles / authority (the decisive row for this repo). A VLA can only be an actuator: its only
   output is the executed action. A WAM can be an actuator (DreamZero) OR an advisory
   predictor/evaluator (FFDC: it predicts the expected state and emits a trust signal while
   something else executes). The advisory mode has no VLA analogue, because a VLA's forward pass
   commits to the action.
4. Evidence on the trade (balanced). WAMs buy foresight and robustness to perturbation but cost
   compute (a WAM step is at least 4.8x slower than a VLA; DreamZero's pixel WAM reaches only
   ~7 Hz). VLAs are faster and simpler and strong when demonstrations cover the distribution.
   Neither dominates. For a loop that runs at multi-second deliberation cadence and wants
   advisory foresight (not 50 Hz motor control), the WAM latency objection mostly dissolves.
5. Why this project is WAM-shaped, not VLA-shaped (interpretation, kept modest). An LLM that
   reads typed state and selects one tool is already a reactive policy in the VLA mold:
   `p(a|o,l)` with an LLM instead of a visuomotor net. By default the actor is VLA-shaped:
   perceive, react, predict nothing. "Going WAM" means adding exactly the piece a VLA lacks: an
   explicit prediction of the candidate action's consequences (a social-material state delta:
   who will have which item, who will owe whom, who can now do what) that is then checked against
   the runtime's verifier evidence and used advisorily. A VLA has no admissible role here because
   its only role is to be the actuator, which the repo forbids ("the LLM proposes; the runtime
   owns physical truth"). A WAM has an admissible role: the advisory predictor the VLA paradigm
   does not contain.

The sharpest one-liner: an LLM tool-selector is a VLA-shaped reactor by default; adding a
verified, advisory prediction of consequences is what turns the framing into a (structured-state,
advisory) WAM.

Read next: `notes/by-theme/vla-and-the-wam-vs-vla-distinction.md` (VLA paradigm depth + the
5-point distinction) and `matrices/wam-vs-vla-distinction.md` (the head-to-head table plus the
actuator-vs-advisory split, and a "where the line blurs" table so the distinction stays honest).

---

## 6. How these models are trained and judged, and what is still unsolved

Training physics (one dominant problem): a model fit by teacher forcing on clean ground truth
must, at inference, consume its own imperfect predictions, so error compounds over the horizon.
The canonical reference, DAgger (`1011.0686`), proves the error can grow as `T^2 * epsilon` over
`T` steps. Latent methods add a second hazard, representation collapse, held off by stop-gradient
and EMA targets (JEPA). And the native data unit `(o, a, o')` is scarce because cheap internet
video is action-free.

Evaluation (one dominant warning): visual fidelity is not physical correctness and is not
control value. Fidelity metrics (PSNR, SSIM, LPIPS, FVD) reward sharp-but-wrong futures.
Physics-commonsense benchmarks (VideoPhy: best model 39.6%; Physics-IQ: "unrelated to visual
realism") test whether the world behaves plausibly. The IDM Turing Test (run a reality-trained
inverse-dynamics model on generated video, execute the inferred actions) is the sharpest test:
human-fooling video models collapse to near-0% real-robot success. The real test is downstream
task success, and the field's own admitted gap is that no standard metric measures whether a
chosen action is causally grounded in the imagined future (the survey proposes Counterfactual
Consistency and Foresight-Conditioned Success as directions).

The six open problems a newcomer should carry:

1. Compounding error / long-horizon drift.
2. Hidden state not present in observations (lending an item changes possession and creates an
   obligation, neither visible in a screenshot).
3. Fidelity does not equal control.
4. Real-time inference cost of generative WAMs.
5. Hierarchical world-action modeling (connecting high-level semantic decomposition to low-level
   physical prediction) is a named open challenge.
6. Evaluation decoupling / the missing joint metric.

Read next: `notes/by-theme/wam-training-evaluation-and-open-problems.md` (the metric ->
what-it-measures -> what-it-misses table, and the open-problem -> why-hard -> who-flags-it table).

---

## 7. Placement and a guided reading order

Where each system sits (the compact map; the full 8-paradigm grid is in
`matrices/wam-vs-vla-vs-policy-vs-runtime.md`):

| Class | Predicts `o'`? | Chooses `a`? | One-line identity |
|---|---|---|---|
| World Model | Yes | No | A learned simulator; bolt a planner on to act. |
| VLA / policy | No | Yes | Reactive observation+instruction to action; no sense of consequence. |
| Video Policy | No (uses video features) | Yes | A policy that inherits a video backbone but makes no explicit forecast. |
| Model-based RL (Dreamer) | Yes (latent) | Yes (policy trained in imagination) | Learn a WM, then train a policy inside it by RL. |
| WAM | Yes | Yes, coupled to the prediction | Predict-and-act fused. Actuator (DreamZero) or advisory (FFDC). |

A reading order for someone new to the field (beginner to frontier):

1. Ha and Schmidhuber, World Models (`1803.10122`) for the intuitive "dream" idea.
2. The WAM survey definition section (`2605.12090`) and wave-1's `wam-foundations.md` for the
   vocabulary.
3. This primer's Section 5 plus `vla-and-the-wam-vs-vla-distinction.md` for WAM vs VLA.
4. DreamerV3 (`2301.04104`) for the latent WM that did Minecraft.
5. Genie (`2402.15391`) for a foundation world model and its clean taxonomy table.
6. The Sora-vs-JEPA debate (`wam-generative-video-and-the-world-model-debate.md`) for the field's
   fault line.
7. VPT (`2206.11795`) and RT-2 (`2307.15818`) for the action half.
8. DreamZero (`2602.15922`) and FFDC (`2605.06222`) for WAM-as-policy vs WAM-as-advisory.
9. `wam-training-evaluation-and-open-problems.md` for training, evaluation, and the frontier.
10. The repo capstone (`notes/by-theme/hierarchical-wam-for-minecraft-societies.md` and
    `reports/short-human-brief.md`) for how all of this lands on this project.

---

## 8. How this connects to the repo (brief; the deep version is wave 1)

This primer is about the field. The application analysis is wave-1's and is not re-derived here.
In one paragraph: the repo's Actor Turn (an LLM that reads typed state and selects one tool) is
VLA-shaped by default. The defensible move is a structured-state, advisory WAM: predict the
social-material consequences of a candidate action before it runs, then score that prediction
against the Mineflayer verifier's evidence after, never letting the predictor act, fill
arguments, or override the verifier. This sits in the WAM definition's modality-independent
"implicit state" branch, occupies a niche no surveyed system fills, and is the subject of
`reports/final-literature-review.md`, `reports/short-human-brief.md`, and
`notes/by-theme/hierarchical-wam-for-minecraft-societies.md`.

---

## Where to go deeper (wave-2 deliverables this primer routes into)

- `notes/by-theme/wam-lineage-rl-and-latent-dynamics.md` (world-model genealogy)
- `notes/by-theme/wam-generative-video-and-the-world-model-debate.md` (video WMs + the debate)
- `notes/by-theme/wam-action-models-vla-and-synthesis.md` (action half + WAM synthesis)
- `notes/by-theme/vla-and-the-wam-vs-vla-distinction.md` (VLA depth + the distinction)
- `notes/by-theme/wam-training-evaluation-and-open-problems.md` (training, eval, open problems)
- `matrices/wam-lineage-timeline.md` (one chronological spine across all branches)
- `matrices/wam-vs-vla-distinction.md` (the focused VLA-vs-WAM table)
- by-paper notes for every cornerstone above, in `notes/by-paper/`.

Wave-2 added 29 by-paper notes and ~49 unique sources; the canonical merged list is
`source-manifest.jsonl` (156 sources total: 67 LaTeX deep-read, 1 PDF, 88 abstract/repo/docs).
