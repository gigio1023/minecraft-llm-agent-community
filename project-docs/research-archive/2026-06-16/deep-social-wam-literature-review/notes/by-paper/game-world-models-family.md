# Game / neural-engine world models (breadth family)

Breadth note covering the canonical game world models named in the lane brief that
are not given their own deep note. Source level: abstract / project-page / HF card
(not LaTeX deep-read), except where cross-referenced to a deep note. Each is a
**pixel / video** world model unless stated; none models social-material state.

## Matrix-Game & Matrix-Game 2.0 (2506.18701 / 2508.13009, Skywork)
- Interactive **world foundation model** for controllable game-world video generation. Matrix-Game-MC: 2,700h unlabeled + 1,000h labeled Minecraft clips with keyboard/mouse action annotations. Image-to-world generation conditioned on reference image + motion context + actions; 17B params. Matrix-Game 2.0 = few-step autoregressive diffusion, 25 FPS, streaming (Unreal/GTA5 data, ~1200h).
- Eval: **GameWorld Score** (visual quality, temporal quality, action controllability, physical-rule understanding). Reported to beat Oasis and MineWorld on controllability/physical consistency.
- **Weights public**: `Skywork/Matrix-Game` and `Skywork/Matrix-Game-2.0` (MIT), plus distilled diffusers variants. Pixel/video output; no structured/social state.

## Oasis (Decart / Etched, 2024)
- Real-time, fully generated playable Minecraft - a diffusion-transformer "neural game engine" that generates the next frame from the player's keyboard/mouse input (no game engine running). The canonical "playable generated Minecraft" demo.
- **Weights public**: `Etched/oasis-500m` (MIT, ~500M; 496 HF likes). Pixel-only; frame-to-frame; well-known long-horizon drift/consistency limits.

## Genie family (DeepMind): Genie / Genie 2 / Genie 3
- **Genie** (2402.15391, ICML 2024 best paper): foundation **world model** trained from unlabeled internet gameplay video via a **latent action model** (infers discrete latent actions from video, no action labels) + video tokenizer + autoregressive dynamics - enabling action-controllable generation learned without action annotations. (Cited heavily by the WAM survey as the scalable "train from video-only" precedent.)
- **Genie 3** (DeepMind 2025): general-purpose world model, real-time **720p / 24fps**, auto-regressive, generates explorable worlds from text/image prompts, "several minutes" of memory consistency. Pixel/video; **weights not public**; requires substantial compute. Per Dreamer 4: Genie-3-style models "struggle to learn precise physics of object interactions and game mechanics" and "often require many GPUs to simulate a single scene in real time."

## GameNGen (2408.14837, Google, 2024)
- Neural game engine that runs **DOOM** at >20 fps on a single TPU via a diffusion model trained on agent play; next-frame conditioned on past frames + actions. Demonstrated a playable game fully simulated by a neural network. Pixel-only; single-game; no structured state.

## DreamerV3 (2301.04104, Nature 2025, Hafner et al.)
- General model-based RL agent: learns a **latent world model (RSSM lineage)** and trains an actor-critic in imagination. **First to collect diamonds in Minecraft from scratch without human data or curricula**; one config across 150+ tasks. Latent (not pixel-reconstruction-primary). See `2509.24527-dreamer4.md` for the offline-data successor. Code public (`danijar/dreamerv3`).

## iVideoGPT (2405.15223) & PAN (2511.09057)
- **iVideoGPT**: scalable autoregressive transformer integrating observations + actions + rewards into a token sequence (compressive tokenization); pretrained on millions of human/robot manipulation trajectories; serves as interactive WM for action-conditioned prediction, visual planning, model-based RL. Bridges video-gen and MBRL. (Survey background.)
- **PAN** (named in lane brief): LLM latent dynamics + video decoder - a **hybrid** that runs dynamics in an LLM-style latent and renders video on top. Relevant as a "structured/latent core + optional pixel decoder" architecture pattern (abstract-level; not deep-read).

## Cross-cutting interpretation

- Every public game-WM with usable weights (Matrix-Game, Oasis, MineWorld, DreamerV3 code) is a **pixel/video** model (or a latent model whose *output target* is reconstruction). None exposes or predicts **structured social-material state** (possession, claim, obligation, trust). So "reuse existing weights" for this project means reusing a *visual* simulator - a poor fit for a social-material predictor, useful at most as a pixel sidecar for human review.
- The latent line (Genie's latent actions, DreamerV3/Dreamer4 latent dynamics, JEPA) shows structured/latent world modeling is mature and efficient - the architectural license for a structured-state Minecraft WAM.

## WAM layer(s) informed

Physical (all are physical/visual). Establishes that the Minecraft/game-WM frontier is pixel-centric and leaves the social-material layer empty.
