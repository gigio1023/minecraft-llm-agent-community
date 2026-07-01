# Action Models and the WAM Synthesis: from behavior cloning to World Action Models (taught for a newcomer)

Lane 9 (wave 2) owned theme file. Audience: a reader new to the World Action Model
(WAM) / world-model field. Every term is defined on first use. Source-backed; primary-
source facts are separated from interpretation. Punctuation is ASCII only.

This file has two parts:

- **Part 1**: the **action-generation lineage** - how learned systems went from
  "copy the demonstrator" to "generalist policies that map pixels + an instruction to
  motor actions." This is the "act" half of a WAM.
- **Part 2**: the **WAM synthesis** - what, precisely, fuses a world model (the
  "predict the world" half, covered by lanes 7-8) with a policy (the "act" half) into a
  *World Action Model*, taught from the WAM survey (arXiv 2605.12090).

It complements, and does not duplicate, two existing wave-1 artifacts: the formal
definitions and the application-first cost argument live in
`notes/by-theme/wam-foundations.md`; the paradigm-by-paradigm comparison table lives in
`matrices/wam-vs-vla-vs-policy-vs-runtime.md`. This file is the *teaching* version: the
genealogy and the "why each step mattered." The Minecraft visual-policy lineage (VPT,
STEVE-1, GROOT, ROCKET, JARVIS-VLA, Optimus) is covered in
`notes/by-theme/minecraft-vla-and-visual-policy.md`; here the canon is the *general
robotics* VLA line (RT-1, RT-2, OpenVLA, Octo, pi-0, FAST), whose by-paper notes were
missing and are added alongside this file.

---

# Part 1: The action-generation lineage (the "act" half)

## 1.1 Behavior cloning: copy the demonstrator

**Behavior cloning (BC)** is the simplest way to get a policy: collect demonstrations
(observation, action) pairs from an expert, then train a model with supervised learning
to output the expert's action given the observation. Formally it minimizes the negative
log-likelihood of the demonstrated action `a` given observation `o` (and, when present,
a language instruction `l`): it learns `p(a | o, l)`.

Why it matters: BC needs no reward function and no environment interaction during
training, just data. Its weakness, named early in the field, is **compounding error**
(also called covariate shift): a BC policy is only trained on states the expert visited;
once it makes a small mistake it drifts into states it never saw, where its errors
compound. (The classic fix, DAgger, is treated in lane 10's training/eval theme; here
the point is just that BC is the substrate every system below uses.)

## 1.2 VPT: behavior cloning at internet scale via inverse-dynamics labeling

The obstacle to BC at scale is that demonstrations need **action labels**, and the
internet is full of *videos* with no labels (you see the pixels, not which button was
pressed). **VPT (Video PreTraining, arXiv 2206.11795)** solved this for Minecraft with a
two-stage trick (primary-source; see the existing `notes/by-paper/2206.11795-vpt.md`,
which this file cites and does not rewrite):

1. Pay contractors to record a *small* labeled set (video + the action taken each game
   tick). Train an **inverse-dynamics model (IDM)** on it. An **IDM** answers "what
   action happened between these frames?" - it learns `p(a_t | o_t, o_{t+1})` (or, for
   VPT, a window of frames including the future), i.e. it infers the action from the
   observed before-and-after. Because it can look at the *future* frame, an IDM is far
   more data-efficient than BC (which must predict the action from the past only).
2. Run the IDM as a cheap **auto-labeler** over ~70k hours of unlabeled web video, then
   behavior-clone a foundation policy on those pseudo-labels.

Why it mattered: VPT showed you can get a strong action prior from unlabeled video by
*manufacturing* the missing action labels with a small learned labeler. The IDM is the
load-bearing idea. (The latent-action extreme - learn an action vocabulary with *no*
labels at all - is LAPA, arXiv 2410.11758; see its existing note. LAPA's VQ-VAE discovers
discrete "latent actions" between frames, then maps them to real actions with a little
labeled data, and its decoder can double as a world model - a bridge from VPT toward the
WAM idea.)

Relevance to this repo (one line): the repo's Mineflayer runtime already emits the
`(o_t, a_t, o_{t+1})` triplet for free (validated tool call + verifier delta), so it gets
the IDM's *output* without training one. Detail in the VPT note.

## 1.3 The VLA canon: map pixels + instruction directly to motor actions

A **Vision-Language-Action model (VLA)** is a policy that takes an observation (pixels,
sometimes plus proprioception) and a language instruction and outputs motor actions:
`p(a | o, l)`. It is BC, but with two upgrades that define the modern canon: (a) reuse a
**vision-language model (VLM)** backbone pretrained on web image-text data (so the policy
inherits semantic knowledge it could never learn from robot data alone), and (b) train
across many robots and tasks to get a **generalist policy** (one model that transfers to
new tasks/embodiments with little or no extra data, rather than one model per task).

A note on terms used throughout: **action tokenization** = the choice of how continuous
motor commands become the discrete symbols a sequence model predicts (or, in the diffusion
line, how they are represented as continuous targets). **Action chunk** = predicting a
short *sequence* of future actions at once (e.g. 50) instead of one step, which improves
temporal consistency and reduces compounding error. **Cross-embodiment data** = pooling
demonstrations from many different robot bodies into one training set.

The canon, in genealogical order (each by-paper note has the full detail):

- **RT-1 (2212.06817)** established **action tokenization under BC**: discretize each
  action dimension into 256 uniform bins and predict the bins with an efficient
  Transformer (35M params, FiLM-EfficientNet + TokenLearner), language-conditioned,
  trained on 130k demos / 700+ tasks, running at 3 Hz. Pure reactive `p(a|o,l)`. It is
  the root of "treat actions like tokens."
- **RT-2 (2307.15818)** coined "VLA" and made the canon's central bet: take a
  *web-pretrained* VLM (PaLI-X / PaLM-E, up to 55B), express **robot actions as text
  tokens**, and **co-fine-tune** on robot data *mixed with the original web data*. The
  web pretraining (not the robot data) is what produces generalization and **emergent
  semantic reasoning** (e.g. "pick the object that could be a hammer" -> a rock). Still
  reactive `p(a|o,l)`; 1-3 Hz at 55B.
- **OpenVLA (2406.09246)** made RT-2 **open and reproducible**: a 7B VLA (DINOv2+SigLIP
  fused vision encoder, Llama 2 backbone), 970k Open X-Embodiment demos, **quantile**
  256-bin tokenization, **LoRA**-fine-tunable on consumer GPUs, 6 Hz. Beat RT-2-X (55B)
  by +16.5% with 7x fewer parameters. The standard open baseline.
- **Octo (2405.12213)** introduced two things: a **diffusion action head** (model the
  continuous action distribution by denoising, one backbone pass per chunk; beats
  discrete-token heads) and **modular tokenizers + readout heads** so you can **add a
  sensor or swap the action space at fine-tune time without retraining the core**.
  800k OXE trajectories; fully open. A "generalist" by virtue of its reconfigurable
  interface.
- **pi-0 / π_0 (2410.24164)** replaced discrete action tokens with a **flow-matching
  action expert** (300M action-specific weights grafted onto a 3B PaliGemma VLM). **Flow
  matching** is a diffusion variant: train a network to predict a vector field that
  transports noise to the data, then integrate it (10 steps) to sample. This models
  continuous action *chunks* (H=50) and reaches **50 Hz** dexterous control that token
  VLAs cannot. Trained on ~10k hours across 7 robots + OXE, with an explicit
  **pre-train/post-train recipe** (broad lower-quality data for recovery behaviors, then
  curated high-quality data for dexterity).
- **FAST (2501.09747)** is not a policy but the **action-tokenization** capstone. It
  diagnoses why RT-1/RT-2/OpenVLA's per-timestep binning fails on high-frequency data:
  the per-token **marginal information** (how much a token tells you beyond the previous
  ones) approaches zero as control frequency rises, so the model just copies the last
  action (OpenVLA notably struggled on the high-frequency DROID data). FAST compresses
  actions in **frequency space** (Discrete Cosine Transform + quantize + Byte-Pair
  Encoding); **FAST+** is a universal tokenizer trained on ~1M action chunks, released as
  a drop-in HuggingFace processor. With pi-0 it matches diffusion-VLA quality at 5x less
  training time.

### What each member of the canon added (table)

The axis that organizes the canon is **action representation** (how the policy emits
actions) and **what backbone knowledge it reuses**.

| Model | Year | Backbone reused | Action representation | Headline addition | Reactive `p(a\|o,l)`? |
|---|---|---|---|---|---|
| RT-1 | 2022 | ImageNet vision (EfficientNet) | 256-bin discrete tokens per dim | Action tokenization under BC; real-time (3 Hz) generalist | Yes |
| RT-2 | 2023 | **web VLM** (PaLI-X / PaLM-E, up to 55B) | actions as **text tokens** (256-bin) | "VLA" coined; web-knowledge transfer + emergent semantics via co-fine-tuning | Yes |
| OpenVLA | 2024 | web VLM (Prismatic: DINOv2+SigLIP + Llama 2 7B) | quantile 256-bin text tokens | **Open**, reproducible, LoRA-fine-tunable; beats RT-2-X with 7x fewer params | Yes |
| Octo | 2024 | t5-base lang + ViT image patches | **diffusion** action head | **Modular** interface (swap sensors/action space at fine-tune); diffusion > token head | Yes |
| pi-0 | 2024 | web VLM (PaliGemma 3B) + action expert | **flow-matching** continuous chunks (H=50) | High-frequency (50 Hz) dexterous control; pre-train/post-train recipe | Yes |
| FAST | 2025 | (tokenizer, backbone-agnostic) | **DCT + BPE** frequency-space tokens | Fixes low-marginal-information failure of binning at high frequency | n/a (tokenizer) |

Two readings of the table (interpretation):

1. The canon's progress is **less about the policy objective** (it stays behavior
   cloning / supervised) **and more about two levers**: which pretrained knowledge the
   backbone imports (ImageNet -> web VLM) and how actions are represented (discrete bins
   -> diffusion/flow -> frequency-space tokens). The "intelligence" largely comes from the
   reused VLM, exactly RT-2's thesis.
2. **Every canon member is reactive** `p(a|o,l)`: none predicts a future observation
   `o'`. This is the precise gap a WAM fills. They are the strongest available "act"
   models, and that is the point - a WAM is built by giving an act model a *forward
   predictive commitment*.

---

# Part 2: The WAM synthesis (predict + act)

This part is taught from the WAM survey (arXiv 2605.12090, re-read from LaTeX sections
`020-def`, `040-arch`, `070-oppo`). The formal `p(o',a|o,l)` derivation is already in
`wam-foundations.md`; here the goal is to make the *idea* click for a newcomer.

## 2.1 The setup: three things you can model

Notation (survey): `o` = current observation, `l` = language instruction, `a` = action,
`o'` = the next observation. Three model families differ only in what conditional
probability they are trained to fit:

- **World Model (WM)**: `p(o' | o, a)`. "Given where we are and what we do, predict what
  happens next." A learned **simulator**. It does *not* choose actions. (Lanes 7-8 cover
  the WM lineage in depth.)
- **VLA (policy)**: `p(a | o, l)`. "Given what we see and what we are told, choose an
  action." Reactive; no model of consequences. (Part 1 above.)
- **World Action Model (WAM)**: `p(o', a | o, l)`. "Jointly predict *what will happen*
  and *what to do*." It fuses the two.

## 2.2 The two criteria that make something a WAM (primary-source)

The survey is explicit that a WAM must satisfy **both** of these (020-def, verbatim
sense):

1. **Forward Predictive Modeling**: the model must forecast the environment's future by
   producing or using a *quantifiable representation* of future states `o'`. This can be
   **explicit visual** (predicted pixel frames, optical flow) **or implicit physical**
   (a physics-grounded latent space). The word "World" denotes internalized physical
   laws, **not** a commitment to pixels.
2. **Coupled Action Generation**: the model must derive its action `a` "by strictly
   aligning [it] with the anticipated future states `o'`." The action must be tied to the
   prediction, not produced independently of it.

The litmus test for a newcomer: *is the future prediction load-bearing for the action?*
If a system predicts the future but chooses actions some other way, it is a WM plus a
separate policy, not a WAM. If it chooses actions with no forward prediction, it is a
VLA. A WAM is the case where the two are genuinely coupled.

## 2.3 Two architectures: Cascaded vs Joint (with a tiny worked example each)

The survey (040-arch) splits WAMs by *how* prediction and action are coupled.

### Cascaded WAM: imagine first, then act

Factorization: `p(o', a | o, l) = p(a | o', o, l) . p(o' | o, l)`. First a world model
imagines the future `o'` (in pixels, latent, or flow); then a separate action module
reads the action out of that imagined future, often with an IDM (recall section 1.2: an
IDM infers the action from before/after states). Trained as **two modules** (separated
training). Inductive bias: the world model need not know robot kinematics; the action
module need not solve long-horizon scene prediction.

Worked example (pixel cascaded WAM, after the survey's UniPi family): you tell the system
"put the cup on the shelf."
1. A video-diffusion world model generates a short clip of a cup *moving onto the shelf*
   (`p(o'|o,l)`).
2. An inverse-dynamics model looks at consecutive predicted frames and reads off the
   end-effector motions that would produce that clip (`p(a|o',o,l)`).
3. The robot executes those motions.
The future is load-bearing: the action is literally extracted from the imagined frames.
(DreamZero, arXiv 2602.15922, realizes this cascade *inside one 14B model* - video
prediction times IDM - and is the canonical "WAM-as-zero-shot-policy"; see its existing
note. AVID, 2410.12822, shows the world-model stage can be a *frozen* pretrained video
model adapted with a small adapter, so you need not train it from scratch; see its note.)

### Joint WAM: predict and act in one shared computation

Directly model `p(o', a | o, l)` with **one** model that produces future state and action
*together*, co-optimized under a unified objective (joint training). The model is forced
to internalize the causal interdependence between dynamics and control. The survey
subdivides this into **autoregressive** joint models (serialize future-state tokens and
action tokens into one sequence and decode left-to-right; e.g. GR-1/GR-2, WorldVLA,
VLA-JEPA) and **diffusion-based** joint models (denoise future state and action streams
in parallel; e.g. DreamZero's unified-stream variant, UWM).

Worked example (joint autoregressive WAM, after GR-2's pattern): same "put the cup on the
shelf."
1. One transformer, given the current image + instruction, autoregressively emits a
   short *visual forecast* (tokens for the next frames) **and** the action tokens, in one
   interleaved sequence, so the action tokens are generated conditioned on the just-
   predicted visual future.
2. The robot executes the action chunk.
Here the coupling is internal: there is no separate IDM; the same model's predicted
future conditions its own action tokens (the survey calls this "action generation as a
foresight-guided inverse-dynamics problem").

The survey's own honest caveat (070-oppo): **no controlled study has compared Cascaded
vs Joint under matched scale/data/eval**, and "it remains empirically unclear whether
explicit visual prediction is strictly necessary for physical grounding." So treat the
Cascaded/Joint split as a real architectural taxonomy, not a settled ranking. (Wave-1's
Do-WAMs-Generalize note, 2603.22078, adds one data point: IDM-style cascaded designs
appear more data-efficient and less diversity-hungry than joint-denoising designs.)

## 2.4 WAM vs its neighbors: a clean contrast for a newcomer

This is the disambiguation that most helps someone new (survey 020-def + the existing
`wam-vs-vla-vs-policy-vs-runtime.md` matrix, which has the full paradigm grid; here is the
compact mental model):

| | Predicts future `o'`? | Chooses action `a`? | One-line identity |
|---|---|---|---|
| **World Model (WM)** | **Yes** | No | A learned simulator. You must bolt a planner/policy on top to act. |
| **VLA / policy** | No | **Yes** | Reactive map from observation+instruction to action. No sense of consequence. |
| **Video Policy** | No (only *uses* video features) | **Yes** | A policy that *inherits* a video-generation backbone for strong features, but makes no explicit prediction of `o'`. |
| **WAM** | **Yes** | **Yes**, coupled to the prediction | Predict-and-act fused: the action is aligned to the anticipated future. |

The two contrasts a newcomer most often gets wrong:

- **WAM vs Video Action Model / pixel commitment**: the survey defines WAM as a
  *modality-independent superset*. "Video is merely one possible proxy for modeling the
  world"; a WAM may predict "single-image state transitions, dense point clouds, or ...
  tactile and force feedback." So a WAM is **not** "a model that predicts video." It is
  "a model that predicts *some* quantifiable future state and couples actions to it." The
  future could be a typed structured-state delta (this is the door for a Minecraft social
  WAM; the argument is developed in `wam-foundations.md`, not re-derived here).
- **WAM vs Video Policy**: the distinction is **predictive commitment**. A Video Policy
  borrows a video model's features to compute `p(a|o)` but never *outputs* a future; a WAM
  must be supervised by a world-modeling objective where synthesizing `o'` is an explicit
  part of its reasoning. "Uses video features" is not "predicts the world."

(The survey also distinguishes WAM from the older term **Action World Model (AWM)** -
identical math, but "WAM" reframes the system as a primary Agent with World and Action
co-equal, the successor to the VLA lineage - and from **model-based RL / Dreamer**, which
learns a WM and then trains an actor-critic *inside* it by RL rather than fitting a
per-step joint `p(o',a)`. Both are in `wam-foundations.md`.)

## 2.5 The key conceptual question: when is predicting the future load-bearing vs decorative?

This is the question the lane brief flags as central for a newcomer, and the survey's open
problems (070-oppo) speak to it directly. The honest primary-source position is **it is
sometimes decorative**:

- The survey: "removing the future prediction head at test time does not necessarily
  degrade downstream control performance," which motivates a **latent-predictive**
  (JEPA-style) approach where the model predicts abstract future representations rather
  than pixels, or skips explicit future generation at inference entirely.
- Two wave-1 by-paper notes sharpen this (cite, do not rewrite): **Privileged Foresight
  Distillation (2604.25859)** reframes the future signal "not as a target to predict, nor
  a regularizer to absorb, but as a **compressible correction to be distilled**" - the
  useful part of imagination is a small signal, not rendered frames, and can be restored
  by a tiny adapter with no future generation at inference. **Fast-WAM / GigaWorld**
  generate future video only during training.

So when is the prediction load-bearing? The defensible reading (interpretation):

- The future prediction is **most load-bearing when used as an explicit, checkable
  expectation** - i.e. the **verifier** framing. **When-to-Trust-Imagination / FFDC
  (2605.06222)** uses the predicted future as "an internal expectation of how the physical
  world should evolve," and a *separate lightweight module* compares predicted-vs-observed
  to decide whether to keep executing or replan. There the prediction does real work: it
  gates execution. (See its existing note.)
- The future prediction is **most decorative when it is rendered pixels at inference for
  control accuracy** - the evidence (PFD, Fast-WAM, the survey's own remark) says you can
  often delete the inference-time pixel rollout and keep a compact signal.

The survey's framing of why this matters for *safety* (070-oppo) is the cleanest
motivation for the verifier reading: a WAM "that confidently imagines an incorrect
physical future may commit to extended action sequences whose real-world consequences are
difficult to interrupt." The proposed remedy is **prediction-integrated safety**: "use
world predictions not only to guide actions but to verify them before execution," treating
uncertainty over imagined futures as a first-class input to a safety monitor. That is the
predict-then-verify-then-act loop, and it is exactly the *advisory* use a runtime that owns
physical truth can admit.

Relevance to this repo (one line, per scope discipline): of the WAM uses above, the
**predict-then-verify** (FFDC) and **compressible-advisory-signal** (PFD) framings are the
ones compatible with the repo's hard rule that a WAM stays advisory and never selects the
action or overrides a verifier. The full repo-application argument (structured-state social
WAM, 4-layer hierarchy) is wave-1's and lives in `wam-foundations.md` and the
`repo-adaptation-matrix.md`; it is not re-derived here.

---

## Sources cited (this file builds on, does not overwrite)

- WAM survey 2605.12090 (LaTeX `020-def`, `040-arch`, `070-oppo`); existing notes
  `2605.12090-wam-survey.md`, `2605.12090-wam-survey-data-section.md`.
- Action lineage: `2206.11795-vpt.md`, `2410.11758-lapa.md` (existing); new this lane:
  `2212.06817-rt1.md`, `2307.15818-rt2.md`, `2406.09246-openvla.md`, `2405.12213-octo.md`,
  `2410.24164-pi0.md`, `2501.09747-fast.md`.
- WAM members (existing): `2602.15922-dreamzero.md`, `2603.22078-do-wams-generalize.md`,
  `2605.06222-when-to-trust-imagination.md`, `2604.25859-privileged-foresight-distillation.md`,
  `2410.12822-avid.md`.
- Sibling theme/matrix (do not duplicate): `wam-foundations.md`,
  `minecraft-vla-and-visual-policy.md`, `matrices/wam-vs-vla-vs-policy-vs-runtime.md`,
  `matrices/action-space-comparison.md`.
