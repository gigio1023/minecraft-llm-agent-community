# Generative & Video World Models, and the "is video a world model?" debate

Lane 8 (wave-2) theme file. Written for a reader new to the field. Source-backed; jargon
defined on first use; primary-source facts separated from interpretation. Punctuation is
ASCII only (no em-dash, middle-dot, or bullet-char).

This file does two jobs:
1. Tell the lineage of generative / video world models as a teachable story (early
   action-conditioned video prediction -> token world models -> diffusion world models ->
   neural game engines -> foundation world models with learned/latent actions).
2. Lay out, fairly and in two columns, the field's biggest live argument: does generating
   realistic video mean a model understands the world? The generative camp ("video models
   are world simulators") versus the non-generative camp (JEPA: predict latents, not pixels).

It does NOT redo two things wave 1 already covered. The Minecraft pixel world models
(Solaris, MineWorld, Oasis, Matrix-Game, WildWorld, Dreamer-in-Minecraft) are in
`minecraft-world-models.md`; this file references it. The "visual conflation" critique
survey is in `2601.15533-actionable-simulators.md`; this file cites it rather than
re-deriving it. The formal `p(o',a|o,l)` WAM definitions are in `wam-foundations.md`.

Cornerstone by-paper notes created by this lane: `2402.15391-genie.md`,
`2408.14837-gamengen.md`, `2405.12399-diamond.md`, `2209.00588-iris.md`,
`2309.17080-gaia1.md`, `2301.08243-ijepa.md`, `2506.09985-vjepa2.md`,
`sora-world-simulators.md` (docs-level).

---

## 0. Terms a newcomer needs (defined once, then used)

- World model (WM): a learned model of dynamics, `p(o' | o, a)`, that predicts the next
  observation `o'` given the current observation `o` and an action `a`. A learned
  simulator. It does not, by itself, choose actions.
- Generative (pixel) prediction: the model outputs the actual next image/video (pixels or
  pixel-tokens). You can look at its prediction.
- Non-generative (latent) prediction: the model outputs the next state in an abstract
  feature space, not pixels. You cannot look at it directly; you use it for control or
  recognition.
- Autoregressive generation: produce the next frame/token from the model's own previous
  outputs, step by step. Cheap to define, prone to drift.
- Diffusion generation: produce an image by starting from noise and denoising in several
  steps. Sharp, multi-modal, harder to mode-collapse, more compute per frame.
- Compounding (accumulating) error: when each prediction is fed from the last prediction,
  small errors snowball over a long rollout. The core enemy of long-horizon world models.
- Latent action model (LAM): infer a small discrete set of "action codes" from observed
  change between unlabeled frames, so a video model becomes controllable without action
  labels. Genie's trick.
- World simulator (a claim, not a definition): the framing that a good enough video
  generator implicitly models the physical world and can stand in for a simulator. This is
  the contested claim, associated with the Sora report.

---

## 1. The lineage, as a story (who built on whom, and what each fixed)

### 1a. Roots: action-conditioned video prediction (2015-2017)

The whole branch starts from a simple question: can a network predict the next video frame
given the current frame and an action? Three early papers (breadth, abstract-level here):

- Oh et al. 2015, "Action-Conditional Video Prediction using Deep Networks in Atari Games"
  (1507.08750): predict future Atari frames conditioned on the controller action. The first
  clear action-conditioned next-frame predictor for control. Problem it left open: real
  scenes are stochastic and high-dimensional.
- Finn, Goodfellow, Levine 2016, "Unsupervised Learning for Physical Interaction through
  Video Prediction" (1605.07157, the CDNA model): predict how a robot's actions move pixels,
  learned without object labels. Pushed video prediction toward physical interaction.
- Babaeizadeh et al. 2017, "Stochastic Variational Video Prediction" (SV2P, 1710.11252):
  add latent variables so the model can represent multiple possible futures instead of
  averaging them into a blur. Fixed the "blurry mean future" failure of deterministic
  predictors.

What the roots established: action + frame -> next frame is learnable; the future is
multi-modal; naive pixel prediction blurs. Everything later is a better answer to "how do we
predict the (multi-modal, high-dimensional) next state without it degrading?"

### 1b. Token world models: borrow the language-model recipe (2022-2023)

IRIS (2209.00588) reframed dynamics as language modeling: compress each frame into a small
set of discrete tokens (a learned visual vocabulary, VQ-VAE), then train a GPT-style
transformer to predict the next frame-tokens and action-tokens. Train the agent purely "in
imagination" inside this model. Result: superhuman on 10/26 Atari games from ~2 hours of
play. Why it mattered: a plain autoregressive transformer over discrete tokens is very
sample-efficient, and discretization was argued to limit compounding error.

GAIA-1 (2309.17080) scaled the same token-world-model idea to real driving, and added a
twist that recurs later: split the system into a token world model (carries dynamics) plus a
video-diffusion decoder (carries appearance). It showed token WMs can capture multi-agent
driving behavior and extrapolate to unsafe maneuvers, while explicitly noting that pure
generative video "may fall short in learning representations of the evolving world dynamics."

### 1c. Diffusion world models: visual details matter (2024)

DIAMOND (2405.12399) pushed back on IRIS: discretization throws away small visual details
that an agent may need (a distant pedestrian, a tiny ball). So keep the world model in image
space and predict the next frame with diffusion. Result: a new best (mean human-normalized
score 1.46) among agents trained entirely within a world model on Atari 100k, with the gains
concentrated in games where small details matter. Why it mattered: it gave empirical evidence
that what the model preserves in its predicted next state (the representation choice) changes
control performance, not just the policy.

### 1d. Neural game engines: a whole game as a network (2024)

GameNGen (2408.14837) showed a complex game (DOOM) can run as a diffusion model at ~20 FPS on
one TPU, stable over minutes, with humans barely able to tell it from real DOOM. Its key
engineering fix, noise-augmenting the conditioning frames during training, directly attacks
compounding error so autoregressive rollouts stay stable. Why it mattered: the most vivid
existence proof of "action-conditioned video model as a playable world." Why it is also the
debate's exhibit: indistinguishable short clips are a perceptual-fidelity claim, not a proof
of correct long-horizon causal state.

### 1e. Foundation world models with learned actions: control from unlabeled video (2024)

Genie (2402.15391) removed the last data requirement: it learns to make playable worlds from
internet videos with no action labels, by inventing its own latent actions (the LAM, with a
tiny 8-code vocabulary discarded at inference and replaced by user input). At 11B params,
DeepMind called it a "foundation world model." Genie also gave the field its cleanest
teaching table (Section 3 below). Why it mattered: it scaled controllable world models to the
cheapest, most abundant data (unlabeled video) and showed latent actions transfer to imitating
behavior from unseen videos.

### 1f. The strong claim, and the counter-camp (2024-2025)

Two things happened in parallel and set up the debate:
- The Sora report (`sora-world-simulators.md`, OpenAI, Feb 2024, docs-level, not arXiv)
  advanced the strong claim: scaling video generation is "a promising path towards building
  general purpose simulators of the physical world."
- The JEPA line (I-JEPA 2301.08243 -> V-JEPA -> V-JEPA 2 2506.09985, from LeCun's group)
  advanced the opposite: do not generate pixels at all; predict the future in representation
  space, because most pixel detail is unpredictable and irrelevant. V-JEPA 2 closed this loop
  to real robot control via planning, with no pixel generation.

Section 2 lays this argument out fairly, in two columns.

---

## 2. The central debate, both sides (the conceptual fault line)

The argument is about one question: what should a world model predict? Pixels, or latents?
And behind it: does generating realistic video mean a model understands the world?

### 2a. Two-column treatment

| Dimension | Generative / video camp ("video models are world simulators") | Non-generative camp (JEPA: predict latents, not pixels) |
|---|---|---|
| Core claim | Predicting realistic future video, at scale, yields a general simulator of the physical world. Sora report, verbatim: "scaling video generation models is a promising path towards building general purpose simulators of the physical world." | Predict the future in a learned representation space; spend capacity only on the predictable, decision-relevant part. I-JEPA: "abstract prediction targets for which unnecessary pixel-level details are potentially eliminated." |
| What it outputs | Pixels or pixel-tokens (you can watch the prediction). | Latent features (you cannot watch them; you use them for control or recognition). |
| Representative systems | Sora (text-to-video DiT); GameNGen (DOOM); Genie (latent-action video); GAIA-1 (driving); DIAMOND, IRIS (Atari, in-imagination control). | I-JEPA (images); V-JEPA (video); V-JEPA 2 / V-JEPA 2-AC (video + action-conditioned, robot planning). |
| Evidence offered | Visual fidelity, human-indistinguishability (GameNGen), emergent behaviors (Genie parallax, GAIA-1 give-way), playable interactivity. | Downstream usefulness: SOTA motion understanding and action anticipation; zero-shot real-robot grasp/pick-and-place via planning in latent space (V-JEPA 2-AC). |
| Main strength | Inspectable, controllable, vivid; one model can render many worlds; latent actions unlock unlabeled-video data (Genie). | Cheaper (predict features, not pixels: I-JEPA >10x more efficient than MAE); ignores un-predictable detail; demonstrably drives control without rendering. |
| Main weakness (admitted) | Sora's own report: "does not accurately model the physics of many basic interactions, like glass shattering"; food does not "yield correct changes in object state"; "may not understand specific instances of cause and effect." Planning by generating video is compute-heavy (V-JEPA 2's critique). | Not human-inspectable (you cannot eyeball a latent rollout for errors); risk of representation collapse; long-horizon planning still limited by compounding error and exponential search (V-JEPA 2's own limitations). |
| One-line position | Fidelity now, understanding will emerge with scale. | Understanding (for control) does not require pixel fidelity; pixel fidelity can mask the lack of it. |

### 2b. The critique that connects the two columns

The bridge between the columns is the "visual conflation" critique, covered in
`2601.15533-actionable-simulators.md` (cited, not redone here): the survey defines visual
conflation as "the mistaken assumption that high-fidelity video generation implies an
understanding of physical and causal dynamics," and argues "visual realism is an unreliable
proxy for world understanding." Its constructive reframe is world models as "actionable
simulators ... structured 4D interfaces, constraint-aware dynamics, and closed-loop
evaluation," where "the world state is not merely rendered, but explicitly exposed."

Crucially, the seed of this critique is inside the generative camp's own flagship: the Sora
report itself lists glass-not-shattering and food-not-changing-state as failures. So this is
not one camp attacking another from outside; it is the field noticing that near-photoreal
video and wrong physical state transitions coexist in the same model.

A balanced third voice (breadth, abstract-level): Zhang 2024, "Sora and V-JEPA Have Not
Learned The Complete Real World Model" (2407.10311), argues, via a Kantian "productive
imagination" frame, that BOTH Sora (generative) and V-JEPA (non-generative) fall short of a
complete world model, for different structural reasons. Useful precisely because it does not
hand the win to either side.

### 2c. The defensible takeaway for a newcomer (interpretation, labeled)

High visual fidelity is not, by itself, a usable world model for control. This is the single
sentence to keep. The evidence is convergent and comes from multiple independent directions:
- The generative camp's own flagship (Sora) reports correct-looking video with wrong basic
  physics and missed cause-and-effect.
- The non-generative camp (V-JEPA 2) gets real robot control without generating any pixels,
  and argues video generation "emphasizes ... faithfulness ... and visual quality instead of
  planning capabilities."
- A neighboring-field survey (2601.15533) names the fallacy ("visual conflation") and calls
  for structured, constraint-aware, closed-loop state.
- A philosophical analysis (2407.10311) finds both camps incomplete.

This does not say generative video is useless (it is inspectable, controllable, and great for
data and human-facing rendering). It says: if the goal is to predict and reason about
consequences for decision-making, the prediction target should be the structured,
decision-relevant state, and the evaluation should test causal correctness, not visual
plausibility. (For this repo's one-line relevance, that aligns with predicting typed
social-material state rather than Minecraft pixels; the full 4-layer argument is wave 1's, see
`wam-foundations.md` and `hierarchical-wam-for-minecraft-societies.md`.)

---

## 3. Genie's taxonomy: the cleanest way to place these systems

Genie (2402.15391, Table 1, primary-source) gives a three-way split that a newcomer can hold
in their head, and it lines up with the WAM survey's VLA / WM / Video-Policy taxonomy
(`wam-foundations.md`):

| Model class | Training data | Controllability |
|---|---|---|
| World Models | Video + Actions | Frame-level |
| Video Models | Video + Text | Video-level |
| Genie | Video only | Frame-level |

Reading it against the debate:
- Sora is a "Video Model" (Video + Text, video-level). Calling it a "world simulator"
  stretches "video model" toward "world model" without a frame-level, action-conditioned,
  controllable commitment to the next state. Naming that gap is the cleanest critique.
- GameNGen, GAIA-1, DIAMOND, IRIS are "World Models" (action-conditioned, frame-level).
- Genie is its own column: frame-level control learned from video-only via latent actions.
- The JEPA models are not on this table at all, because they do not generate video; they are
  the "predict latents" alternative to the entire table.

---

## 4. A small timeline (primary-source dates)

| Year | System (id) | One-line significance | Camp |
|---|---|---|---|
| 2015 | Action-Conditional Video Prediction in Atari (1507.08750) | First action-conditioned next-frame predictor for control. | generative (root) |
| 2016 | Finn et al. CDNA (1605.07157) | Unsupervised physical-interaction video prediction. | generative (root) |
| 2017 | SV2P (1710.11252) | Latent variables for multi-modal (non-blurry) futures. | generative (root) |
| 2022 | LeCun, "A Path Towards Autonomous Machine Intelligence" (OpenReview, docs) | Manifesto for predicting in representation space (JEPA). | non-generative |
| 2022/23 | IRIS (2209.00588) | Token world model: dynamics as language modeling. | generative |
| 2023 | I-JEPA (2301.08243) | First working JEPA: predict image-block features, not pixels. | non-generative |
| 2023 | GAIA-1 (2309.17080) | Token world model + diffusion decoder for real driving. | generative |
| 2024 (Feb) | Sora report (docs, no arXiv) | The strong "video models are world simulators" claim. | generative |
| 2024 (Feb) | Genie (2402.15391) | Foundation world model; latent actions from unlabeled video. | generative |
| 2024 (May) | DIAMOND (2405.12399) | Diffusion world model: visual details matter for control. | generative |
| 2024 (Aug) | GameNGen (2408.14837) | DOOM as a real-time neural game engine. | generative |
| 2025 (Jun) | V-JEPA 2 / V-JEPA 2-AC (2506.09985) | Latent world model that plans real robot control, no pixels. | non-generative |

Docs-level successors mentioned for completeness, not deep-read (mark as such): Genie 2 and
Genie 3 (DeepMind blog posts, no papers), GAIA-2 (2503.20523, a later arXiv paper),
V-JEPA 2.1 (2603.14482). The cornerstones above are sufficient to teach the lineage and the
debate; the successors do not change the conceptual picture.

---

## 5. One short bridge to the Minecraft pixel world models (do not redo)

Wave 1 already surveyed the Minecraft and game pixel world models in
`minecraft-world-models.md`: MineWorld (token), Oasis and Matrix-Game (diffusion), Solaris
(the only multiplayer one, multi-view pixels), WildWorld (pixels + explicit per-frame state),
and the Dreamer line (latent state + RL-in-imagination). Two facts from that file matter to
this lane and need no re-derivation:
- Every surveyed Minecraft/game world model predicts pixels or latent visual/physical state;
  none predicts social-material state (possession, claims, obligations, trust). The
  social-material column is empty across the board.
- WildWorld independently makes this lane's point from the generative side: it keeps video
  output but adds explicit per-frame world-state annotations and a State Alignment metric, on
  the argument that actions act through hidden state not visible in the pixels. That is the
  same "predict the structured state, not just the look" instinct as the non-generative camp,
  arrived at from within a video model.

So the generative/non-generative debate in this file is the conceptual backdrop for the
project's structured-state choice; the Minecraft-specific gap analysis stays in wave 1's file.

---

## 6. Mechanically useful vs research contribution (lane-level summary)

Mechanically useful (engineering the project can borrow, regardless of camp):
- Compounding-error fixes for any predictor rolled forward on its own outputs:
  GameNGen's noise-augmented conditioning; awareness that autoregressive latent rollouts
  degrade (V-JEPA 2). Relevant if a structured social WAM is ever rolled multiple steps.
- The "freeze a representation, train a small action-conditioned predictor, plan against a
  goal in that space" recipe (V-JEPA 2-AC) as a concrete low-data pattern, with the explicit
  caveat that here it must stay advisory, never a controller (repo rule).
- The "structured dynamics model + detachable appearance decoder" split (GAIA-1) as
  justification for keeping predictions in typed state and treating any pixel rendering as an
  optional human-review sidecar.
- The two-phase "scripted agents generate episodes, then train/evaluate the predictor on them"
  data pattern (GameNGen, Genie) as a fixture-generation template for social scenarios.

Research contribution / overclaim to avoid:
- Do not build a Minecraft video world model; that frontier is crowded, pixel-centric, and the
  repo runtime is Mineflayer with typed truth (see `minecraft-world-models.md`).
- Do not cite generative-video fidelity (Sora, GameNGen, Genie emergent physics) as evidence
  of physical or causal understanding; the sources themselves disclaim it.
- Do not adopt RL-in-imagination (DIAMOND, IRIS) or MPC latent planning (V-JEPA 2-AC) as
  runtime authority; the project's WAM stays advisory and the runtime owns physical truth.
- Do not present the JEPA wins (ImageNet, robot grasp) as proof a social WAM will work; borrow
  the principle ("predict the predictable, decision-relevant part in a structured space"), not
  the numbers.
