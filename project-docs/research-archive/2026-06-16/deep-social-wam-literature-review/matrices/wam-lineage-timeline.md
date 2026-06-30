# Matrix: the WAM lineage timeline (one chronological spine)

Coordinator capstone, wave 2. This is the single chronological view a newcomer can scan to
see how three separate braids converge into the 2026 World Action Model (WAM) idea:

- `WM-latent`: the predict-the-world, latent-dynamics / RL line (lane 7 theme).
- `WM-video`: the predict-the-world, generative / video line (lane 8 theme).
- `Action/VLA`: the produce-the-action line (lane 9 theme; VLA depth in lane 11).
- `WAM`: the fusion of prediction + action (the survey and its cluster).
- `contrast`: a clarifying boundary case (not in any single braid).

Every row is backed by the by-paper note named in the lane theme files. Dates follow each
paper's arXiv vintage. The 2026 cluster (ids 26xx) is the recent WAM-specific frontier this
review's cornerstone survey belongs to.

Read alongside: `notes/by-theme/wam-lineage-rl-and-latent-dynamics.md`,
`notes/by-theme/wam-generative-video-and-the-world-model-debate.md`,
`notes/by-theme/wam-action-models-vla-and-synthesis.md`,
`notes/by-theme/vla-and-the-wam-vs-vla-distinction.md`, and the field-level summary in
`reports/wam-field-primer.md`.

## Chronological spine

| Year | System (arXiv) | Braid | Key idea introduced | What it predicts | Why it matters |
|---|---|---|---|---|---|
| 1991 | Dyna (Sutton, textbook) | WM-latent | Interleave real experience with planning against a learned model | next state + reward | The model-based-RL root: a learned model buys sample efficiency |
| 2010 | DAgger (1011.0686) | contrast | Train on the states the policy itself visits, not just the expert's | n/a (imitation) | The canonical proof of compounding error (`T^2 * epsilon`) |
| 2015 | ACVP (1507.08750) | WM-video | First action-conditioned next-frame predictor (Atari) | next frame | Shows action + frame -> next frame is learnable |
| 2016 | CDNA / Finn et al. (1605.07157) | WM-video | Unsupervised physical-interaction video prediction | next frame (pixel motion) | Pushes video prediction toward physical interaction |
| 2017 | SV2P (1710.11252) | WM-video | Latent variables for multi-modal (non-blurry) futures | next frame (stochastic) | Fixes the "blurry mean future" failure |
| 2018 | World Models (1803.10122) | WM-latent | VAE encoder + recurrent dynamics + tiny controller; train in the "dream" | next latent (reconstructs pixels) | First modern "learn a model, act inside it"; names model exploitation |
| 2018 | PlaNet (1811.04551) | WM-latent | RSSM (deterministic + stochastic latent); plan by CEM in latent space | next latent + reward | A latent model strong enough to plan from pixels; ~200x data efficiency |
| 2019 | Dreamer v1 (1912.01603) | WM-latent | Actor-critic learned by backprop through imagined latent rollouts | next latent + reward + value | Replaced slow online search with a fast learned policy |
| 2019 | MuZero (1911.08265) | WM-latent | Value equivalence: predict only reward/value/policy, plan with MCTS | reward + value + policy (no observation) | Plans superhumanly without reconstructing the world; rules-free |
| 2020 | DreamerV2 (2010.02193) | WM-latent | Discrete (categorical) latents + straight-through gradients | next latent + reward + value | First human-level Atari purely inside a learned world model |
| 2021 | Decision Transformer (2106.01345) | contrast | RL as return-conditioned sequence modeling | next action (no explicit `o'`) | Clarifies "modeling trajectories" is not "forecasting the world" |
| 2022 | LeCun JEPA manifesto (docs) | WM-video (non-gen) | Predict in representation space, not pixels | future latent features | The manifesto for the non-generative camp |
| 2022 | VPT (2206.11795) | Action/VLA | Internet-scale BC via inverse-dynamics-model auto-labeling | action (Minecraft) | Strong action prior from unlabeled video; the IDM trick |
| 2022 | RT-1 (2212.06817) | Action/VLA | Action tokenization under BC; real-time generalist | action (256-bin tokens) | Root of "treat actions like tokens" |
| 2022 | IRIS (2209.00588) | WM-video | Token world model: dynamics as language modeling | next frame-tokens + action | Sample-efficient transformer WM; discretization limits drift |
| 2023 | I-JEPA (2301.08243) | WM-video (non-gen) | First working JEPA: predict image-block features, not pixels | future latent features | The non-generative alternative made to work |
| 2023 | DreamerV3 (2301.04104) | WM-latent | One fixed config across 150+ tasks (symlog, free bits, balancing) | next latent + reward + value | First Minecraft diamonds from scratch (Nature 2025); latent + inventory state |
| 2023 | RT-2 (2307.15818) | Action/VLA | Co-fine-tune a web VLM; actions as text tokens; coined "VLA" | action (text tokens) | Web semantics transfer to actions; emergent generalization |
| 2023 | GAIA-1 (2309.17080) | WM-video | Token world model + diffusion decoder for real driving | next frame (driving) | Token WMs capture multi-agent dynamics; dynamics/appearance split |
| 2023 | Open X-Embodiment (2310.08864) | Action/VLA | Cross-embodiment dataset (1M+ trajectories, 22 robots) | n/a (dataset) | Made generalist VLAs trainable; positive cross-robot transfer |
| 2023 | TD-MPC2 (2310.16828) | WM-latent | Scalable decoder-free latent model (JEPA + reward + TD); MPPI planning | future latent + reward + return | Value equivalence made scalable, robust, and open |
| 2024 | Genie (2402.15391) | WM-video | Foundation world model; latent actions from unlabeled video | next frame (latent-action controlled) | Controllable worlds from the cheapest data; clean taxonomy |
| 2024 | Sora report (docs) | WM-video | "Video generation models are world simulators" (the strong claim) | next frames (text-to-video) | The contested claim; also admits wrong physics |
| 2024 | DIAMOND (2405.12399) | WM-video | Diffusion world model: keep image space, visual details matter | next frame (diffusion) | Representation choice changes control performance |
| 2024 | Octo (2405.12213) | Action/VLA | Diffusion action head + modular tokenizers/readouts | action (diffusion) | Add/swap sensors and action spaces at fine-tune time |
| 2024 | OpenVLA (2406.09246) | Action/VLA | Open 7B VLA; LoRA-fine-tunable; quantile tokenization | action (256-bin tokens) | The standard open, reproducible VLA baseline |
| 2024 | GameNGen (2408.14837) | WM-video | DOOM as a real-time diffusion neural game engine | next frame (game) | Vivid "video model as playable world"; noise-aug curbs drift |
| 2024 | LAPA (2410.11758) | Action/VLA | Latent action pretraining: learn an action vocabulary with no labels | latent action (+ decoder = WM) | Bridge from VPT toward the WAM idea |
| 2024 | AVID (2410.12822) | WAM (enabler) | Adapt a frozen pretrained video model into an action-conditioned WM | next frame (adapted) | Existing weights reusable without base-model access |
| 2024 | pi-0 (2410.24164) | Action/VLA | Flow-matching action expert; action chunks; 50 Hz | action (flow-matching chunk) | High-frequency dexterous control token VLAs cannot reach |
| 2025 | FAST (2501.09747) | Action/VLA | Frequency-space (DCT + BPE) action tokenization | action (compressed tokens) | Fixes low-marginal-information failure of binning at high frequency |
| 2025 | OpenVLA-OFT (2502.19645) | Action/VLA | Fine-tuning recipe: parallel decode + chunk + continuous + L1 | action (continuous) | Lifts LIBERO 76.5% -> 97.1% at 26x throughput |
| 2025 | GR00T N1 (2503.14734) | Action/VLA | Dual-system humanoid VLA (slow VLM planner + fast diffusion control) | semantic plan + action | Open humanoid VLA; plan-then-act (still not a forecast of `o'`) |
| 2025 | pi-0.5 (2504.16054) | Action/VLA | Heterogeneous co-training for open-world generalization | language subtask + action | Generalizes to unseen homes; hierarchical (semantic subtask) |
| 2025 | V-JEPA 2 (2506.09985) | WM-video (non-gen) | Latent world model that plans real robot control, no pixels | future latent (action-conditioned) | The non-generative camp closes the loop to real control |
| 2025 | Dreamer 4 (2509.24527) | WM-latent | RL in imagination inside a scalable tokenizer/transformer WM; offline | next latent + reward + value | Offline Minecraft diamonds, 100x less data than VPT; real-time single GPU |
| 2026 | WAM survey (2605.12090) | WAM | Defines WAM `p(o',a\|o,l)`; two criteria; Cascaded vs Joint | (survey) | The cornerstone definition; names the open challenges |
| 2026 | DreamZero (2602.15922) | WAM | "World Action Models are Zero-shot Policies" (cascaded, one model) | next video + action | The canonical WAM-as-actuator |
| 2026 | Do-WAMs-Generalize (2603.22078) | WAM | Robustness study: WAMs vs VLAs under perturbation | next state + action | Evidence WAMs are robust but >=4.8x slower than a VLA step |
| 2026 | Privileged Foresight Distillation (2604.25859) | WAM | The future signal is a compressible correction, distilled | (compact future signal) | The useful part of imagination is small, not rendered frames |
| 2026 | FFDC / When to Trust Imagination (2605.06222) | WAM | Predict expected state, verify against observation, trust or replan | expected next state + trust signal | The canonical WAM-as-advisory (the admissible role here) |

## How to read the convergence

- 2015-2021: the two WM braids (latent and video) mature in parallel; the action braid is still
  mostly per-task behavior cloning.
- 2022-2025: VPT and the VLA canon make generalist action models the dominant paradigm, while
  Genie, the Sora claim, and the JEPA counter-camp sharpen the "what should a model predict"
  debate, and Dreamer keeps proving latent + structured state does hard control.
- 2026: the WAM cluster fuses prediction and action into `p(o',a|o,l)`, and immediately splits
  into actuator (DreamZero) and advisory (FFDC) uses. The advisory use is the one a runtime that
  owns physical truth can adopt; see `matrices/wam-vs-vla-distinction.md`.
