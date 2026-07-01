# WAM Foundations: what a World Action Model is, and what it is not

Lane 1 theme file. Source-backed. Defines jargon on first use. Separates
primary-source facts from interpretation, and "mechanically useful" from "research
contribution," per the shared lane contract.

Primary anchor: the WAM survey (arXiv 2605.12090, deep-read from LaTeX). Supporting
primary sources: DreamZero (2602.15922), Do-WAMs-Generalize (2603.22078), When-to-
Trust-Imagination / FFDC (2605.06222), Privileged-Foresight-Distillation (2604.25859),
AVID (2410.12822), and the actionable-simulators survey (2601.15533).

---

## 1. The formal definitions (primary-source facts)

Notation (survey 2605.12090): `o` = observation, `l` = language instruction,
`a` = action, `o'` = next-timestep observation. Three paradigms by training objective:

| Paradigm | Objective | What it does |
|---|---|---|
| **VLA** (Vision-Language-Action) | `p(a \| o, l)` | Reactive observation -> action. No dynamics model. |
| **WM** (World Model) | `p(o' \| o, a)` | Predicts the next state given action. A learned simulator. Does NOT select actions. |
| **WAM** (World Action Model) | `p(o', a \| o, l)` | Jointly predicts the future state AND the action. |

A WAM must satisfy **two criteria** (survey, verbatim sense):
1. **Forward Predictive Modeling** - forecast `o'` via a quantifiable representation,
   either *explicit visual* (pixel video, optical flow) **or** *implicit physical
   representation* (physics-grounded latent space).
2. **Coupled Action Generation** - deduce `a` "by strictly aligning them with the
   anticipated future states `o'`."

Two architectural realizations:
- **Cascaded WAM**: `p(o',a|o,l) = p(a|o',o,l)-p(o'|o,l)` - imagine the future, then
  derive the action from it (often via an inverse-dynamics model, IDM). DreamZero is
  this, realized in a single model.
- **Joint WAM**: directly model `p(o',a|o,l)`; state prediction and action generation
  co-optimized in a shared representation.

## 2. WAM vs its neighbors (primary-source disambiguation)

From the survey's disambiguation section plus DreamZero's related work:

- **WAM vs VAM (Video Action Model)**: the survey defines WAM as "a broader,
  modality-independent superset." "video is merely one possible proxy for modeling
  the world"; WAMs may predict "single-image state transitions, dense point clouds,
  or ... tactile and force feedback." The word "World" denotes internalized physical
  laws, *not* a commitment to pixels. DreamZero's authors say the same: "video is
  just one possible world modeling objective - future WAMs may align actions with ...
  learned latent representations."
- **WAM vs Video Policy**: a video policy merely *inherits* a video-generation
  backbone to map `p(a|o)`; a WAM "requires an active predictive commitment" - `o'`
  synthesis is an explicit output, not an implicit backbone feature.
- **WAM vs AWM (Action World Model)**: identical math `p(o',a|o,l)`; "WAM" reframes the
  system as a primary Agent (World + Action co-equal) rather than an augmented simulator.
- **WAM vs model-based RL / Dreamer**: Dreamer-line agents (DreamerV3 2301.04104,
  Dreamer 4 2509.24527) learn a **latent world model** and train an **actor-critic in
  imagination**. The world model is a learned simulator `p(o'|o,a)`; the policy is
  trained *inside* it by RL, rather than per-step joint `p(o',a)`. DreamZero contrasts
  itself with these "latent world models ... which learn dynamics from scratch in
  compact latent spaces," whereas DreamZero reuses pretrained *video* priors.
- **WAM vs learned simulator**: a WM/learned-simulator (MineWorld 2504.08388, Oasis,
  Matrix-Game) predicts `o'` but does not pick `a`. To get a policy you bolt on
  planning/search over its rollouts.
- **WAM vs LLM tool-use agent + Mineflayer runtime (this repo)**: an LLM-tool-use
  actor selects a typed action from full context under strict schemas; the runtime
  (schemas, gates, verifiers, artifacts) owns physical truth. This is neither a VLA
  nor a WAM: it has no learned `p(o'|...)` and no pixel/latent forward model. A WAM, if
  added, would be an *advisory* `p(o'|o,a)`-style predictor feeding the actor/verifier,
  never the action selector.

## 3. What a WAM actually predicts (pixels vs latent vs symbolic vs reward vs trajectory)

Primary-source spread (survey background `030-wm.tex` + sources):
- **Pixels / video** (explicit): ACVP, CDNA, diffusion WMs; MineWorld, Oasis,
  Matrix-Game, Solaris, Genie 3, GameNGen. Most of the field. The survey calls these
  "Explicit World Models."
- **Latent state** (implicit): PlaNet/RSSM, Dreamer series, TransDreamer; JEPA / I-JEPA
  / V-JEPA 2 / LeWorldModel predict **future latent embeddings** "instead of
  reconstructing pixels with substantially lower reconstruction overhead." The survey
  calls these "Implicit World Models."
- **Symbolic / structured state**: WildWorld (2603.23497) adds explicit per-frame
  **world-state annotations** and evaluates **State Alignment**; H-WM couples symbolic
  task-level prediction with visual state. The fully-structured-state branch (predict a
  typed state delta, no pixels) is exactly where this repo's social WAM would sit, and
  it is under-instantiated in the literature.
- **Reward**: VIPER, Diffusion Reward, SRPO (reward from a V-JEPA2 latent), RoboScape-R
  (joint future+reward). The WM produces a reward signal for RL.
- **Trajectories / futures**: video-as-plan systems (UniPi etc.) predict a future
  trajectory used as a plan, then extract actions via IDM/optical flow.

So "WAM" names a family that can predict any of these; the survey's definition is
deliberately modality-independent.

## 4. Is "WAM" the actuator, planner, evaluator, transition model, or counterfactual simulator?

It is several different things at different layers, and the primary sources let us be
precise:

- As an **actuator/policy**: DreamZero ("World Action Models are Zero-shot Policies")
  - the WAM *is* the policy; it outputs the executed action chunk. This is the
  mainstream WAM framing.
- As a **learned transition model / simulator**: MineWorld, Solaris, Oasis,
  Matrix-Game model `p(o'|o,a)`; the survey's "World Models for VLA" treats WMs as
  data-driven simulators for (a) imitation data, (b) RL surrogate environments,
  (d) **reproducible policy evaluation** (Ctrl-World, Veo Robotics).
- As a **counterfactual simulator / planner**: V-JEPA2-AC, NWM, H-WM, PETS/PlaNet do
  model-predictive control by querying imagined rollouts; the actionable-simulators
  survey (2601.15533) argues the *whole point* is "counterfactual reasoning,
  intervention planning, and robust long-horizon foresight."
- As an **evaluator/verifier**: When-to-Trust-Imagination / FFDC (2605.06222) uses the
  WAM's predicted future as "an internal expectation of how the physical world should
  evolve," and a **separate lightweight verifier** compares predicted-vs-observed to
  decide whether to keep executing or replan. The WAM does not fill arguments or
  override anything - it produces a consistency signal.

For this repo's hard rule ("a WAM must stay advisory: predict/evaluate consequences;
do not fill missing args, mark progress true, override verifiers, or replace Actor
Turn selection"), the **evaluator/verifier** and **counterfactual-simulator** framings
are the admissible ones. The **actuator/policy** framing (DreamZero) is explicitly out
of scope for the runtime.

## 5. Data, training, and evaluation requirements (primary-source facts)

- **Data**: a WAM ideally needs `(o_t, a_t, o_{t+1})` triplets (paired
  action-state-state) but can also ingest action-free `(o_t, o_{t+1})` video (survey
  "unified data digestion"). The survey's four data sources - robot teleoperation,
  portable human demos, simulation, internet ego-centric video - are **entirely robot
  manipulation**. Game WMs use gameplay video + keyboard/mouse action logs (MineWorld,
  Matrix-Game-MC 3,700h, Solaris 12.64M bot frames, WildWorld 108M ARPG frames).
- **Training objectives**: pixel/video WAMs use diffusion/flow-matching denoising
  (DreamZero, Matrix-Game) or autoregressive next-token prediction over discrete
  visual+action tokens (MineWorld); latent WMs use latent-dynamics + reconstruction or
  JEPA-style latent prediction; Dreamer trains the world model then an actor-critic in
  imagination.
- **Evaluation** (survey `060-eval.tex`) is **decoupled** into:
  - *World-modeling capability*: Visual Fidelity (PSNR, SSIM, LPIPS, DreamSim, DINO,
    FVD); Physical Commonsense (VideoPhy, PhyGenBench, VBench-2.0, WorldModelBench's 5
    physical-law checks, Physics-IQ); Action Plausibility (WorldSimBench; **"Wow, wo,
    val!" IDM Turing Test** - run an inverse-dynamics model on generated video, execute
    inferred actions in the real world; many visually convincing models "collapse to
    nearly zero success").
  - *Action-policy capability*: 40+ robot manipulation benchmarks (MetaWorld, RLBench,
    LIBERO/LIBERO-Plus, ManiSkill, RoboCasa, RoboTwin, COLOSSEUM perturbations, ...).
  - **None of these evaluate social or material-economic state.** The survey itself
    flags the missing piece: "joint evaluation metrics that quantify the causal
    consistency between imagined futures and generated actions" (proposes
    Counterfactual Consistency, Foresight-Conditioned Success).

## 6. Can existing weights be reused without training from scratch? (primary-source facts)

- **Yes, for pixel/video WAMs.** AVID (2410.12822) adapts a *frozen* (even API-only,
  noise-prediction-only) pretrained video diffusion model into an action-conditioned
  world model via a small adapter + learned mask - no base-model parameter access
  needed. DreamZero, Matrix-Game, LingBot-VA, GE-Act, Cosmos-Policy all initialize from
  pretrained video backbones (Wan, LTX, Cosmos, SVD). Genie learns action-control from
  unlabeled video via a **latent action model** (no action labels). Public Minecraft
  weights exist: `Etched/oasis-500m`, `Skywork/Matrix-Game(-2.0)`, `nyu-visionx/solaris`,
  MineWorld (Microsoft).
- **But all reusable weights output pixels.** None outputs structured social-material
  state. So "reuse weights" for this repo would yield a *visual* Minecraft simulator -
  usable at most as a pixel-imagination sidecar for human review, never as a structured
  social predictor or runtime authority. A structured-state social WAM has no
  off-the-shelf weights and would need to be built (and the project's first step is a
  small logged predictor/evaluator, not a large learned model - see the repo's research
  frame).

## 7. Why pixel/video WAM is NOT the immediate path here, and structured is more feasible

This is the lane's central argument. It is grounded in evidence, not preference:

**Cost / latency (primary-source):**
- DreamZero: a 14B video-diffusion WAM reaches only **7Hz** after a 38x engineering
  speedup; the survey notes this is far below the 50Hz standard of non-generative VLAs.
- Do-WAMs-Generalize: a WAM inference step is "at least **4.8x slower** than π0.5."
- MineWorld: SoTA video tokenizers emit "**40k-160k tokens for 16 frames**"; a custom
  parallel decoder is needed just to hit 4-7 fps. Pixel state is an expensive
  representation.

**Pixel generation at inference is not even load-bearing (primary-source):**
- The survey's open challenges: "removing the future prediction head at test time does
  not necessarily degrade downstream control performance," motivating a
  **latent-predictive (JEPA-style)** approach.
- Fast-WAM / GigaWorld skip future video at inference, predicting it only during
  training.
- Privileged Foresight Distillation (2604.25859): the future signal is "a **compressible
  correction to be distilled**," restorable by a small adapter with no future
  generation at inference. So the useful part of "imagination" is a compact signal, not
  rendered frames.

**Visual fidelity is the wrong objective for control (primary-source):**
- "Wow, wo, val!" IDM Turing Test: visually convincing models "collapse to nearly zero"
  executable success.
- Do-WAMs-Generalize: "improvements in likelihood or visual fidelity do not necessarily
  translate to better planning" (objective mismatch).
- Actionable-simulators survey (2601.15533): **"visual conflation"** - assuming
  high-fidelity video implies physical/causal understanding - is a mistake; reframe as
  **"actionable simulators ... structured 4D interfaces, constraint-aware dynamics,
  closed-loop evaluation"**; "a true world model is defined not by how realistically it
  predicts the future, but by how reliably it supports intervention, reasoning, and
  decision-making."

**Hidden state is not in the pixels (primary-source):**
- WildWorld (2603.23497): meaningful actions act through **hidden state variables**
  ("shoot" decrements an invisible "remaining ammunition count") that "cannot be
  reliably inferred from visual observations alone." Models must be **state-aware**.
- The Minecraft-social analogue is exact: `lend_item(alice, bob, pickaxe)` changes
  possession and creates a return obligation - neither is recoverable from pixels.
  Social-material state is *definitionally* the hidden-state branch.

**Structured is cheaper and more checkable (interpretation, evidence-grounded):**
- A typed social-material delta (possession move, obligation created, trust update) is
  orders of magnitude smaller than a frame, runs at the LLM Actor Turn's multi-second
  cadence with no pixel-decoding cost, and is directly checkable against the runtime's
  existing structured evidence (inventory, container, transcript, verifier artifacts).
- The latent-WM line (DreamerV3/Dreamer 4 do hard long-horizon Minecraft control on a
  single GPU using **latent dynamics + structured inventory state**, not pixel-primary)
  is the feasibility proof that structured/latent world modeling works in Minecraft.

**Conclusion (interpretation):** the canonical WAM is robot-manipulation, pixel/video,
very recent (2026). The project's "Social WAM" is an adaptation into the survey's
**modality-independent / implicit-state branch**, not the mainstream pixel WAM. The
evidence (cost, dispensable inference-time pixels, fidelity!=control, hidden-state
arguments) says a **structured-state transition model**, used **advisorily** as a
predictor/evaluator (the FFDC verifier framing), is the feasible and defensible path -
and that pixel Minecraft WMs (MineWorld, Solaris, Oasis, Matrix-Game) are at most
optional visual sidecars, never the runtime's structured social predictor.

## 8. Mechanically useful vs research contribution (summary)

- **Mechanically useful to borrow**: the `p(o',a|o,l)` vocabulary and Cascaded/Joint
  distinction; the WAM-as-evaluator/verifier control loop (FFDC: predict expected state,
  compare to observed evidence, decide trust/replan); the verifier-training recipe
  (positives from successes, negatives from failures + synthetic corruptions); the
  "future signal is compressible, no inference-time rendering needed" principle; the
  "actionable simulator / structured state" framing and citations.
- **NOT the research contribution**: building a verifier or evidence pipeline is
  *support*, per the shared contract. Re-deriving WAM theory is not novel. Reusing pixel
  weights yields a visual sidecar, not the contribution. The defensible research target
  is **action-conditioned social-material transition modeling in Minecraft** -
  predicting and verifying who-has-what / who-owes-whom / who-can-now-do-what deltas -
  which no surveyed system does.
