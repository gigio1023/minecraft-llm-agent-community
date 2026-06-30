# WAM Training, Evaluation, and the Open Problems (a newcomer's "what is hard" map)

Lane 10 (wave 2) theme file. Audience: a reader new to the world-model / world-action-model
(WAM) field. Every term is defined in plain language on first use, then used. This file is
deliberately problem-organized, not paper-organized: it teaches the cross-cutting craft of
HOW these models are trained, HOW they are judged, and WHAT is genuinely unsolved.

Companions (link, do not duplicate):
- `wam-foundations.md` (wave 1): the formal `p(o', a | o, l)` definition and Cascaded-vs-Joint
  split. Lanes 7-9 cover the historical lineage and the VLA canon.
- `benchmark-validity-and-evaluation.md` (lane 3): social-fidelity validity (SimBench, LLM-judge
  unreliability). That file owns "is the SOCIAL claim valid"; this file owns "is the WORLD
  prediction faithful and useful."
- `data-and-training-feasibility.md` (lane 5): the repo's own build options and dataset ROW
  schema. That file owns "should THIS repo build a WAM and how"; this file owns the field-level
  training/eval craft behind that decision.

Definitions used throughout (plain, one line each):
- **World Model (WM)**: a learned predictor of the next state given the current state and an
  action, `p(o' | o, a)`. A "learned simulator." It does not choose actions.
- **World Action Model (WAM)**: jointly models a future state AND an action, `p(o', a | o, l)`
  (`o` observation, `l` language, `a` action). It both forecasts `o'` and proposes an `a`
  aligned to it (WAM survey, arXiv 2605.12090; see `2605.12090-wam-survey.md`).
- **Rollout / imagination**: running a WM forward many steps, feeding its own predictions back in.
- **Latent**: a compact learned vector representation of state, as opposed to raw pixels.

---

## Section 1. Training mechanics (how these models are actually fit)

### 1.1 Teacher forcing vs autoregressive rollout, and exposure bias

- **Teacher forcing** (plain): during training, to predict step `t+1` the model is fed the
  GROUND-TRUTH history up to `t`, not its own predictions. It is the standard, stable way to
  train any next-step predictor (next-token language models, next-frame video models).
- **Autoregressive rollout** (plain): at inference the ground truth is gone, so the model must
  consume ITS OWN previous predictions to produce the next one.
- **Exposure bias** (plain): the train/test mismatch that results. The model was only ever
  "exposed" to clean ground-truth inputs in training, but at test time it sees its own
  imperfect outputs, a distribution it never trained on.

### 1.2 Compounding error and the canonical reference (DAgger)

- **Compounding error** (plain): once a rollout makes one small error, it lands in a state
  slightly off the training distribution, which makes the next prediction worse, and errors
  accumulate over a long horizon. This is the central reason long rollouts drift.
- Canonical reference: **DAgger**, Ross, Gordon, Bagnell, AISTATS 2011 (arXiv 1011.0686; new
  deep-read this lane, see `1011.0686-dagger.md`). Although it is about imitation-learning
  policies, it is the cleanest proof of the phenomenon. Key result: a policy with per-step
  error probability `epsilon` measured under the EXPERT's state distribution can make as many
  as **`T^2 * epsilon`** mistakes over `T` steps under the distribution IT ITSELF induces. The
  mechanism, verbatim: "as soon as the learner makes a mistake, it may encounter completely
  different observations than those under expert demonstration, leading to a compounding of
  errors." The bound is tight (grows as Theta(T^2 epsilon)).
- The DAgger fix (the idea the field reuses): train the model on the states IT actually visits,
  not only on the expert's states. Iteratively collect data under the current model, label it,
  aggregate, retrain. This reduces the error growth from quadratic in `T` to roughly linear.
- The same phenomenon in WORLD MODELS: a video or latent WM trained by teacher forcing but
  rolled out autoregressively drifts for exactly this reason. The WAM survey states it directly
  in its open challenges: "distributional drift in world model predictions accumulates over
  long rollouts" (`070-oppo.tex`). Inference-time remedy seen in practice: DreamZero replaces
  predicted frames with ground-truth observations in its KV cache "to stop error accumulation"
  (`2602.15922-dreamzero.md`), the inference-side cousin of DAgger's training-side fix.

### 1.3 Two prediction objectives: autoregressive-token vs diffusion

A WM has to commit to HOW it predicts the future. Two dominant families (lane 8 covers the
Minecraft instances in `minecraft-world-models.md`; do not re-survey them, only the contrast):

- **Autoregressive-token (AR)** (plain): discretize each frame into tokens (via a VQ-VAE image
  tokenizer that maps an image patch to a discrete code), interleave with action tokens, and
  predict the next token like a language model. Example: MineWorld (`2504.08388-mineworld.md`),
  IRIS-style. Cost signature: token count explodes. MineWorld states SoTA video tokenizers
  produce "40k to 160k tokens for 16 frames," which is why it needs a custom parallel decoder
  just to reach 4-7 frames/sec.
- **Diffusion** (plain): start from noise and iteratively denoise a whole frame or chunk toward
  a clean prediction, conditioned on history and action. Example: DIAMOND, Matrix-Game, Oasis,
  and DreamZero's flow-matching variant. Cost signature: many denoising steps per frame.

Neither is free of the rollout-drift problem in Section 1.2; the objective changes the cost and
the artifact, not the exposure-bias physics. (Interpretation: for this repo neither AR-token nor
diffusion pixel prediction is relevant, because the repo predicts typed structured deltas, not
frames; this is a field-level contrast, not a repo recommendation. See
`data-and-training-feasibility.md`.)

### 1.4 Latent-dynamics training and representation collapse

- **Latent-dynamics model** (plain): instead of predicting pixels, predict the next state in a
  compact LEARNED latent space. Cheaper, and it can ignore perceptually irrelevant detail.
  Lineage: PlaNet/RSSM, the Dreamer series (model-based RL that learns in "imagination"), and
  the predictive-embedding family JEPA / I-JEPA / V-JEPA (covered for lineage by lanes 7-9; the
  WAM survey calls these methods that "predict future latent embeddings instead of reconstructing
  pixels with substantially lower reconstruction overhead").
- **Representation collapse** (plain): the failure mode unique to learning a latent target. If
  you train both the encoder that makes the prediction AND the encoder that produces the target
  to minimize the same loss, the trivial winning solution is for both to map EVERY input to the
  same constant vector. Loss goes to zero, the representation is useless.
- Why JEPA-style methods need **stop-gradient** and **EMA targets** (primary mechanism, sourced
  to the I-JEPA / JEPA design literature, verified this lane via the JEPA SSL literature):
  - **Stop-gradient**: the target embeddings are treated as fixed regression targets; gradients
    are not allowed to flow back through the target encoder, so the optimizer cannot push both
    encoders to a shared constant at once.
  - **EMA target encoder** (Exponential Moving Average): the target encoder's weights are a slow
    moving average of the prediction encoder's weights (momentum near 1, often scheduled from
    ~0.996 to 1.0). This makes the target a slowly-moving "teacher" the predictor must keep
    chasing.
  - The student/teacher asymmetry is the architectural guardrail against collapse; it forces the
    encoder to learn genuinely predictive features rather than a constant.
  - Honest caveat (sourced): EMA + stop-gradient alone do not GUARANTEE a non-trivial solution;
    some methods additionally need explicit variance-covariance regularization (VICReg-style) for
    robust convergence. So "stop-gradient/EMA prevents collapse" is the mechanism, not an absolute
    guarantee.

### 1.5 Why `(o, a, o')` triplet data is scarce, and "unified data digestion"

- The native training unit of a WM/WAM is the **transition triplet `(o_t, a_t, o_{t+1})`**:
  state, action taken, resulting state (WAM survey `050-data.tex`).
- Why it is scarce and expensive: most cheap, abundant video on the internet is **action-free**,
  it shows what happened but not the action that caused it. Getting action labels means either
  paying for teleoperation/contractors or pseudo-labeling. Lane 5 quantifies the Minecraft case:
  VPT (`2206.11795-vpt.md`) paid contractors ~$20/hour to record video plus an actions JSONL,
  ~$160k total, precisely to buy a labeled seed so an inverse-dynamics model could pseudo-label
  the rest.
- **Inverse Dynamics Model (IDM)** (plain): a model that looks at two consecutive states and
  infers the action that caused the transition, `a ~ p(a | o, o')`. It is the standard trick for
  turning action-free video into action-labeled data.
- **Unified data digestion** (plain, WAM survey term): mix data sources, action-labeled robot
  demos (give `(o,a,o')`), and action-free video (gives `(o,o')`), so the model learns dynamics
  from cheap video and action-grounding from expensive demos. VLA needs paired `(o,a)`; a WM
  needs action-free `(o,o')`; a WAM sits at the intersection and tries to exploit both.
- Repo relevance (one line): this repo inverts the scarcity, its Mineflayer verifier auto-labels
  the exact `(o,a,o')` triplet as typed JSON at ~$0 labeling cost (the central argument of
  `data-and-training-feasibility.md`); the cost moves to run GENERATION, not annotation.

---

## Section 2. Evaluation landscape, and the gap

WAM evaluation is, in the survey's own word, **"decoupled"**: world-modeling quality and
action-policy quality are measured by separate, module-specific metrics, and (the gap, Section
2.4) nothing measures the causal link BETWEEN them (`060-eval.tex`).

### 2.1 Visual / rollout fidelity metrics (and why fidelity != usefulness)

These measure whether a generated frame or video LOOKS right. Definitions one line each
(`060-eval.tex`):

- **PSNR** (Peak Signal-to-Noise Ratio): pixel-level reconstruction fidelity; log ratio of max
  signal to mean-squared error. Higher = closer pixels.
- **SSIM** (Structural Similarity): compares luminance, contrast, and structure between two
  images rather than raw pixel error.
- **LPIPS** (Learned Perceptual Image Patch Similarity): distance in a deep feature space,
  closer to human perception than pixel error.
- **FVD** (Frechet Video Distance): distribution-level realism; Frechet distance between real
  and generated video feature distributions; reflects overall realism and temporal dynamics.
- **DreamSim**: a human-aligned perceptual similarity, trained on human judgments of image
  triplets (which of two candidates is more similar to a reference).
- **DINO-similarity**: cosine similarity in DINOv2 self-supervised features; a semantic /
  object-identity alignment signal that is more robust than pixel distance.

The crucial caveat, stated by multiple sources: **high fidelity does not mean the prediction is
useful or physically correct.** The "actionable simulators" position paper names this exact error
"visual conflation", "the mistaken assumption that high-fidelity video generation implies an
understanding of physical and causal dynamics ... visual realism is an unreliable proxy for world
understanding" (`2601.15533-actionable-simulators.md`). The survey makes the same point: pixel
metrics "capture visual plausibility but ignore physical correctness, allowing videos where
unsupported objects hover or fluids defy gravity to score highly" (`070-oppo.tex`).

### 2.2 Physical-commonsense benchmarks (does the world BEHAVE plausibly)

These ask whether the generated world obeys physics, not whether it looks sharp. All IDs verified
this lane. Each one-line "what it tests":

- **VideoPhy** (arXiv 2406.03520, Bansal et al. 2024; new deep-read, `2406.03520-videophy.md`):
  688 human-verified prompts over solid-solid / solid-fluid / fluid-fluid interactions; binary
  human labels on semantic adherence and physical commonsense. Headline: best model (CogVideoX-5B)
  is jointly text-adherent AND physically plausible for only **39.6%** of instances; worst on
  solid-solid (ball bounce, hammer-nail). Auto-evaluator: VideoCon-Physics.
- **PhyGenBench** (arXiv 2410.05363, Meng et al. 2024): 160 prompts across 27 physical laws in 4
  domains; automated PhyGenEval framework (key-phenomena detection, physics-order verification,
  naturalness) built on VLMs/LLMs. Finding: scaling models or prompt engineering does not fix
  dynamic-scenario physics.
- **VBench-2.0** (arXiv 2503.21755, Zheng et al. 2025): pushes from "superficial faithfulness"
  (aesthetics, smoothness) to "intrinsic faithfulness" across five dimensions including Physics
  and Commonsense; physics via video QA, commonsense via a clip-level abnormal-entity detector
  (sudden merging/splitting/appearing/disappearing).
- **WorldModelBench** (arXiv 2502.20694, Li et al. 2025): judges video-generation models AS world
  models; physics-adherence = 5 binary physical-law checks (Newton's first law, mass conservation
  + solid mechanics, fluid mechanics, impenetrability, gravitation); 67K human labels used to
  fine-tune an automatic VLM judger that beats GPT-4o by 8.6% at 2B params.
- **Physics-IQ** (arXiv 2501.09038, Motamed et al., DeepMind 2025; paper title "Do generative
  video models learn physical principles from watching videos?"): predicts the future of REAL
  physical events from conditioning frames; metrics are motion/fidelity based (Spatial IoU,
  Spatiotemporal IoU, Weighted Spatial IoU, MSE) across fluid dynamics, optics, solid mechanics,
  magnetism, thermodynamics. Headline, verbatim spirit: across Sora, Runway, Pika, Lumiere, SVD,
  VideoPoet, "physical understanding is severely limited, and **unrelated to visual realism**."

Related corroborating benchmarks found this lane (abstract-level, logged in manifest): WorldBench
(2601.21282, disentangled per-concept physics), WorldReasonBench (2605.10434, reframes generation
as world-state prediction across physical/social/logical/informational consistency), PhyWorldBench
(2507.13428, includes an "anti-physics" category). They reinforce the same finding and are not
deep-read.

### 2.3 Action plausibility and the IDM Turing Test

This axis asks the sharpest question: does the generated future carry enough TRUE ACTION
information to be executed, not just to look real.

- **IDM Turing Test** (plain): run an inverse-dynamics model that was trained ONLY on real
  execution data over a generated video; have it infer the action sequence; execute those actions
  on a real robot; measure success. If the video is real-like in its action content, the
  reality-trained IDM should produce executable actions.
- Source: **Wow, wo, val!** (arXiv 2601.04137, Fan et al. 2026; new deep-read,
  `2601.04137-wow-wo-val-idm-turing.md`), the survey's `fan2026wow`. WoW-World-Eval = 609 robot
  manipulation samples, 22 metrics, 5 dimensions. The numbers:
  - Most high-appearance models nearly fail the IDM test: **Kling 9.88%, Hailuo 2.47%**, early
    open-source models near 0% real-world success.
  - Only models trained with real-robot data transfer: **WoW-wan 40.74%**, WoW-cosmos2 18.52%.
  - Long-horizon planning is the single worst dimension (best Hailuo 17.27).
  - The Human Turing Test (2AFC, 13 raters) shows humans are fooled by appearance: deceive-human
    ratio correlates with Video-Quality at r=0.874 and Physical-Law at r=0.753, but those same
    models collapse on the IDM (executability) test. That divergence IS the fidelity-vs-control
    gap, made numeric.
- Related (manifest-only, found this lane): EVA (2603.17808) names the same problem the
  "executability gap" and turns it into a training reward; Dream.exe (2606.04811) is another
  video-to-execution test ("visual quality proves a poor predictor of executability").
- An older sibling the survey lists: **WorldSimBench** (Implicit Manipulative Evaluation), same
  spirit, judges whether a generated video can be turned into correct control signals.

### 2.4 Downstream control success on robot suites (the real test of a WAM)

The survey's "Action Policy" axis. The point: the honest test of a predictive model used for
control is not fidelity, it is whether a policy built on it COMPLETES TASKS. The standard suites
(named briefly; the survey reviews 40+ in `060-eval.tex`):

- **LIBERO** (130 tasks; generalization, long-horizon, lifelong, language), **MetaWorld** (50
  tasks), **RLBench** (100 tasks), **ManiSkill / ManiSkill2 / ManiSkill3** (object/task/trajectory
  scaling), **CALVIN** (long-horizon language), **RoboCasa** (100 tasks, 100K+ trajectories),
  perturbation suites **COLOSSEUM / LIBERO-Plus** (robustness), real-robot **RoboArena**.
- The comparative study `2603.22078-do-wams-generalize.md` runs released WAMs vs VLAs on
  LIBERO-Plus and RoboTwin-2.0-Plus and reports the control-relevant facts this lane reuses: WAMs
  are robust to perturbations (Cosmos-Policy 82.2% on LIBERO-Plus), but a single WAM inference
  step is "at least 4.8x slower than pi0.5", and its own related-work states the principle
  directly: "improvements in likelihood or visual fidelity do not necessarily translate to better
  planning" and "simulation does not need to occur in pixel space."

### 2.5 The evaluation GAP the survey itself flags

- The decoupling: world-modeling is scored by pixel/physics metrics, action by task success, and
  **nothing measures the causal consistency between the imagined future and the chosen action**
  (`060-eval.tex`, `070-oppo.tex`). A model can score well on both halves while its action is NOT
  actually grounded in its prediction (it could be exploiting dataset correlations).
- The survey's proposed (not-yet-standard) coupled metrics:
  - **Counterfactual Consistency**: quantify how the chosen action CHANGES when you perturb the
    imagined future. If the action does not respond to the prediction, the coupling is fake.
  - **Foresight-Conditioned Success**: require the executed trajectory to actually follow the
    generated visual plan, not just succeed by luck or spurious correlation.
- This is an OPEN gap, the survey proposes these as a direction; they are not established
  protocols. (Interpretation: for this repo the closest realizable version is scoring an advisory
  predicted social-material delta against the verified delta the runtime produced, with prediction
  accuracy and acting outcome reported as SEPARATE axes, the discipline
  `benchmark-validity-and-evaluation.md` already prescribes. That is a structured-state analogue
  of Foresight-Conditioned Success, not the pixel metric itself.)

### Table A: metric -> what it measures -> what it misses

| Metric / benchmark | What it measures | What it misses |
| --- | --- | --- |
| PSNR / SSIM | Pixel/structural closeness to a reference frame | Whether the scene is physically possible or the action is right; rewards a sharp but wrong future |
| LPIPS / DreamSim / DINO-sim | Perceptual or semantic similarity (human-aligned / object identity) | Same blind spot: perceptual match is not physical correctness or control value |
| FVD | Distribution-level realism + temporal dynamics over a video set | Per-sample correctness; a set can look realistic while individual rollouts violate physics |
| VideoPhy (2406.03520) | Joint semantic adherence + intuitive physics (human labels), best model 39.6% | Whether the depicted motion is EXECUTABLE; relies on costly human panels (no cheap ground truth) |
| PhyGenBench (2410.05363) | Physical-commonsense alignment across 27 laws via PhyGenEval | Action/control value; covers generation, not whether a policy could use it |
| VBench-2.0 (2503.21755) | "Intrinsic faithfulness": physics, commonsense, anatomy, composition | Causal link to a chosen action; still a generation-quality benchmark |
| WorldModelBench (2502.20694) | 5 binary physical-law checks, human-aligned auto-judger | Long-horizon action grounding; per-frame law checks, not task success |
| Physics-IQ (2501.09038) | Future-prediction of REAL physical events; physical understanding "unrelated to visual realism" | Action selection; it is a WM (prediction) test, not a WAM (coupled) test |
| IDM Turing Test / Wow (2601.04137) | Whether a reality-trained IDM can execute the generated future on a real robot (Kling 9.88%, best 40.74%) | Long-horizon and social/semantic correctness; needs real-robot exposure to pass at all |
| Robot suites (LIBERO/MetaWorld/RLBench/ManiSkill...) | Downstream task success of a policy (the real test) | Whether success came from accurate FORESIGHT or from spurious correlation (the coupling) |
| Counterfactual Consistency / Foresight-Conditioned Success (proposed) | The MISSING joint metric: does the action causally track the imagined future | Not yet a standard protocol; proposed by the survey, unbuilt |

---

## Section 3. Open problems (the newcomer's frontier list)

Each is one paragraph: what it is, why it is hard, who flags it. Summarized in Table B.

1. **Compounding error / long-horizon drift.** Autoregressive rollouts feed the model its own
   imperfect outputs, so prediction error accumulates and the imagined world diverges from reality
   over a long horizon (Section 1.2). Hard because the train/test distribution mismatch is intrinsic
   to next-step prediction; teacher forcing trains on clean ground truth that inference never has.
   Canonical reference DAgger (1011.0686) proves the error can grow as `T^2 * epsilon`; the WAM
   survey lists "distributional drift accumulates over long rollouts" as an open challenge
   (`070-oppo.tex`); DreamZero shows an inference-time mitigation (ground-truth re-grounding).

2. **Hidden state not present in observations.** Meaningful actions often change internal state
   that is invisible in the raw observation, so a model that only sees observations cannot predict
   the consequence. WildWorld (`2603.23497-wildworld.md`) is the clearest statement: the action
   "shoot" decrements a hidden ammunition count, and "this state cannot be reliably inferred from
   visual observations alone, yet it plays a crucial role in determining future visual outcomes"
   (when ammo hits zero, "shoot" produces no projectile). Hard because pixels are a partial
   projection of the true state; the fix is state-aware modeling, which needs explicit state
   annotations that most datasets lack. (Repo analogue, one line: lending an item changes hidden
   possession and creates a return obligation, neither recoverable from a screenshot.)

3. **Fidelity != control.** A model can produce visually convincing, even human-fooling, futures
   that are physically wrong or carry no executable action information. Demonstrated numerically by
   the IDM Turing Test (Wow 2601.04137: human-fooling models collapse to near-0% real-robot
   success); argued as "visual conflation" by the actionable-simulators position paper
   (2601.15533); and by Do-WAMs-Generalize (2603.22078): "improvements in likelihood or visual
   fidelity do not necessarily translate to better planning." Hard because the cheap, optimizable
   training signal (pixel/perceptual loss) is not the quantity you care about (control value), and
   optimizing the proxy can actively diverge from the goal (objective mismatch).

4. **Real-time inference cost of generative WAMs.** Predicting high-dimensional futures (pixels,
   or many denoising steps) is slow, threatening closed-loop control. The survey calls it a
   "latency tax": DreamZero reaches ~7Hz only after a 38x engineering push (algorithmic + system +
   CUDA), still far below the ~50Hz of non-generative VLA policies (`070-oppo.tex`,
   `2602.15922-dreamzero.md`); MineWorld's token count (40k-160k tokens per 16 frames) forces a
   custom parallel decoder just to hit 4-7 fps (`2504.08388-mineworld.md`); Do-WAMs-Generalize
   measures a single WAM step at >=4.8x a VLA step. Hard because rich foresight and real-time speed
   pull against each other; the open question the survey poses is "how much predictive fidelity
   does downstream control actually need" (task-adaptive fidelity). (Repo relevance: a Minecraft
   Actor Turn already runs at multi-second cadence with no pixel control loop, so this particular
   tax does not bind the repo; a pixel WAM would be both unnecessary and far too heavy.)

5. **Hierarchical world-action modeling.** Real tasks need reasoning across long horizons, which
   means connecting high-level semantic decomposition (what subgoal next) to low-level physical
   prediction (what happens if I act now) in one learnable system. The survey names this explicitly
   an open challenge: "A principled framework for hierarchical world-action modeling, connecting
   high-level semantic task decomposition to low-level physical prediction within a unified,
   learnable architecture, remains a critical open challenge" (`070-oppo.tex`), and Wow shows
   long-horizon planning is empirically the weakest dimension (best 17.27). Hard because the field
   has no agreed architecture for multi-resolution prediction; the survey sketches three unproven
   paths (modular hierarchy with a VLM planner; an intrinsic multi-resolution WAM; scaling temporal
   context). This is the open problem most relevant to a SOCIAL/settlement layer, where the horizon
   spans many cycles (linked from `hierarchical-wam-for-minecraft-societies.md`).

6. **Evaluation decoupling / the missing joint metric.** As in Section 2.5: world prediction and
   action are scored on separate leaderboards, and there is no standard metric for the causal
   consistency between an imagined future and the action taken, so a model can look good on both
   halves without the action being genuinely grounded in the prediction. Flagged by the WAM survey,
   which proposes Counterfactual Consistency and Foresight-Conditioned Success as directions
   (`070-oppo.tex`). Hard because measuring causal grounding requires controlled counterfactual
   perturbation of the prediction and re-checking the action, which existing single-axis benchmarks
   are not built to do.

### Table B: open problem -> why hard -> who flags it

| Open problem | Why it is hard | Who flags it (primary source) |
| --- | --- | --- |
| Compounding error / long-horizon drift | Train/test mismatch is intrinsic to next-step prediction; errors feed forward; bound grows ~T^2 | DAgger (1011.0686); WAM survey 070-oppo; DreamZero (2602.15922) mitigation |
| Hidden state not in observations | Pixels are a partial projection; the causal variable is invisible; needs state annotations datasets lack | WildWorld (2603.23497) |
| Fidelity != control | The cheap optimizable proxy (pixel/perceptual loss) is not the control objective; optimizing it can diverge | Wow IDM Turing Test (2601.04137); actionable-simulators (2601.15533); Do-WAMs-Generalize (2603.22078) |
| Real-time inference cost | Rich foresight and millisecond control pull against each other; high-dim prediction is slow | WAM survey 070-oppo "latency tax"; DreamZero 7Hz vs 50Hz; MineWorld token cost (2504.08388) |
| Hierarchical world-action modeling | No agreed architecture links high-level semantic planning to low-level physical prediction; multi-resolution prediction unsolved | WAM survey 070-oppo (named open challenge); Wow planning is weakest dimension |
| Evaluation decoupling / missing joint metric | Causal grounding needs counterfactual perturbation + re-check; single-axis benchmarks cannot probe it | WAM survey 060-eval, 070-oppo (proposes Counterfactual Consistency, Foresight-Conditioned Success) |

---

## One-paragraph takeaway

The craft of training a world/action model is dominated by one physics: a model fit by teacher
forcing on clean ground truth must, at inference, consume its own imperfect predictions, so error
compounds over the horizon (DAgger's `T^2 * epsilon`), latent methods add a second hazard
(representation collapse, held off by stop-gradient/EMA targets), and the native data unit
`(o, a, o')` is scarce because cheap video is action-free. The craft of judging one is dominated by
a single warning repeated from every direction: visual fidelity (PSNR/SSIM/LPIPS/FVD) is not
physical correctness (VideoPhy 39.6%, Physics-IQ "unrelated to visual realism") and is not control
value (the IDM Turing Test, where human-fooling models hit near-0% real-robot success). The honest
test is downstream task success, and the field's own admitted gap is that NO standard metric yet
measures whether a chosen action is causally grounded in the imagined future. The six open
problems, drift, hidden state, fidelity-vs-control, latency, hierarchy, and evaluation decoupling,
are the frontier a newcomer should carry; for this repo the load-bearing ones are hidden state
(possession/obligation are invisible in pixels) and the prediction-vs-action separation, while the
pixel-specific costs (latency, AR/diffusion token blowup) simply do not apply to a structured-state
advisory predictor.
