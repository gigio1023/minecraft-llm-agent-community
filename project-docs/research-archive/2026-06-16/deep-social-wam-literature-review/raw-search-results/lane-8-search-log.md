# Lane 8 search log: Generative & Video World Models, and the world-model debate

Wave-2 lane. Date of all activity below: 2026-06-16.

## Phase 0: read the contract + the two files I must build on, not redo

- Read `prompts/00-shared-lane-contract.md`, `prompts/wam-deep-00-contract-addendum.md`,
  `prompts/wam-deep-F2-generative-video-and-debate.md`.
- Read existing `notes/by-theme/minecraft-world-models.md` (Lane 1) and
  `notes/by-paper/2601.15533-actionable-simulators.md` to cite, not duplicate.
- Confirmed no by-paper note exists yet for Genie, GameNGen, DIAMOND, IRIS, GAIA-1,
  I-JEPA, V-JEPA 2, or Sora. Those are mine to create.

## Phase 1: verify every seed arXiv id before fetching (brief requires this)

HF papers CLI (`hf papers search`), one query per cornerstone:

- `hf papers search "Genie Generative Interactive Environments" --limit 5`
  -> CONFIRMED 2402.15391 "Genie: Generative Interactive Environments" (DeepMind, 2024).
- `hf papers search "GameNGen Diffusion Models Are Real-Time Game Engines" --limit 5`
  -> CONFIRMED 2408.14837 "Diffusion Models Are Real-Time Game Engines" (GameNGen, Google, 2024).
- `hf papers search "DIAMOND Diffusion World Modeling Atari" --limit 5`
  -> CONFIRMED 2405.12399 "Diffusion for World Modeling: Visual Details Matter in Atari" (DIAMOND, 2024).
- `hf papers search "Transformers are Sample-Efficient World Models IRIS" --limit 4`
  -> CONFIRMED 2209.00588 "Transformers are Sample-Efficient World Models" (IRIS, 2022/2023).
- `hf papers search "GAIA-1 Generative World Model Autonomous Driving" --limit 4`
  -> CONFIRMED 2309.17080 "GAIA-1: A Generative World Model for Autonomous Driving" (Wayve, 2023).
- `hf papers search "Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture" --limit 4`
  -> CONFIRMED 2301.08243 "Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture" (I-JEPA, 2023).
- `hf papers info 2506.09985`
  -> CONFIRMED 2506.09985 "V-JEPA 2: Self-Supervised Video Models Enable Understanding,
     Prediction and Planning" (LeCun et al / FAIR, 2025). Includes V-JEPA 2-AC
     (action-conditioned). github.com/facebookresearch/vjepa2. Seed id was correct.

### ID corrections / clarifications found during verification

- V-JEPA (version 1) is 2404.08471 "Revisiting Feature Prediction for Learning Visual
  Representations from Video" (2024). V-JEPA 2.1 is a later 2603.14482. I use 2506.09985
  as the canonical "V-JEPA 2" cornerstone and mention 2404.08471 (v1) and 2603.14482 (v2.1)
  in genealogy only.
- Early roots predate the HF papers index (HF indexes ~2023+), so they did not surface
  in `hf papers search`. Verified directly on arXiv abstract pages via WebFetch:
  - 1507.08750 CONFIRMED "Action-Conditional Video Prediction using Deep Networks in
    Atari Games" (Oh, Guo, Lee, Lewis, Singh, 2015).
  - 1605.07157 CONFIRMED "Unsupervised Learning for Physical Interaction through Video
    Prediction" (Finn, Goodfellow, Levine, 2016; the CDNA model).
  - 1710.11252 CONFIRMED "Stochastic Variational Video Prediction" (Babaeizadeh, Finn,
    Erhan, Campbell, Levine, 2017; SV2P).

### Docs-level (no arXiv) sources verified via web

- `WebSearch "OpenAI Sora 'Video generation models as world simulators' technical report 2024"`
  -> CONFIRMED official page https://openai.com/index/video-generation-models-as-world-simulators/
     (Feb 2024). No arXiv id. Treat its "world simulator" line as a claim to be examined.
- `WebSearch "LeCun 'A Path Towards Autonomous Machine Intelligence' 2022 OpenReview JEPA"`
  -> CONFIRMED https://openreview.net/pdf?id=BZ5a1r-kVsf (v0.9.2, 2022-06-27). The
     non-generative-camp manifesto. Docs-level position paper.

## Phase 2: LaTeX-first fetch (cornerstones)

`bash scripts/fetch_arxiv_latex.sh <id> <slug>` for the seven arXiv cornerstones with
source available. Results recorded below (latex_status from papers/metadata/<id>.json).

Fetch results (all `latex=tarball_extracted`, LaTeX source available, deep-read):

- 2402.15391 Genie -> tex_files=3 (main.tex + appendix + defns). Read main.tex (intro,
  method: LAM/tokenizer/dynamics, inference, experiments, agent training).
- 2408.14837 GameNGen -> tex_files=3 (main.tex). Read main.tex (DOOM, two-phase RL+diffusion,
  noise-augmentation, PSNR 29.4, 20fps single TPU).
- 2405.12399 DIAMOND -> tex_files=34 (clean per-section). Read intro, method (EDM diffusion,
  U-Net), experiments (Atari 100k, 1.46 mean HNS), limitations, CSGO note.
- 2209.00588 IRIS -> tex_files=26 (clean per-section). Read intro, method (VQ-VAE discrete
  autoencoder + GPT autoregressive transformer, interleaved frame/action tokens), conclusion.
- 2309.17080 GAIA-1 -> tex_files=14 (section files). Read intro, model overview, emerging
  properties (give-way reactions, OOD steer-out-of-lane, 3D geometry), conclusion (neural sim).
- 2301.08243 I-JEPA -> tex_files=2 (one big main.tex). Read intro + background (EBM: JEA vs
  Generative vs JEPA) + method (predict target-block representations in latent space).
- 2506.09985 V-JEPA 2 -> tex_files=1 (one big main.tex). Read intro (the canonical
  generative-vs-JEPA argument + "blade of grass / leaf" metaphor), action-conditioned
  world-model training, planning by energy minimization (CEM/MPC), limitations
  (autoregressive compounding error, exponential search space, image-only goals).

## Phase 3: docs-level + breadth (no LaTeX deep-read)

- Sora tech report: `WebFetch` on official OpenAI page returned HTTP 403 (blocked). Got the
  load-bearing primary-source claims via `WebSearch` instead:
  - Verbatim claim: "scaling video generation models is a promising path towards building
    general purpose simulators of the physical world."
  - Verbatim limitation: "it does not accurately model the physics of many basic interactions,
    like glass shattering. Other interactions, like eating food, do not always yield correct
    changes in object state"; "may not understand specific instances of cause and effect."
  - Source page (canonical, for citation):
    https://openai.com/index/video-generation-models-as-world-simulators/ (Feb 2024).
- LeCun manifesto: WebFetch on openreview.net/pdf?id=BZ5a1r-kVsf could not render the binary PDF
  to text (it cached the raw PDF in WebFetch's own tool-results dir, NOT in this review's
  papers/ tree, so no downloaded_pdf_path is claimed in the manifest). The JEPA-vs-generative
  argument is captured second-hand from I-JEPA
  (2301.08243), which cites and instantiates lecun2022path, and from V-JEPA 2 (2506.09985),
  which builds on it. Treated as docs-level position paper; cited, not deep-read line-by-line.
- 2407.10311 "Sora and V-JEPA Have Not Learned The Complete Real World Model" (Zhang, 2024):
  verified via `WebFetch` on arXiv abs. Balanced critique arguing BOTH camps fall short
  (Kantian "productive imagination" frame). Abstract-only breadth source, tag validity.

## Notes on dedup with wave 1

- Genie, GameNGen appear in Lane-1 `minecraft-world-models.md` table at card level only (no
  by-paper note). I create the by-paper notes; Lane 1 keeps the Minecraft-pixel-WM survey.
- 2601.15533 (actionable-simulators) already has a by-paper note; I cite it for the critique
  side, do not rewrite it.
- I did not touch Solaris / MineWorld / Oasis / Matrix-Game (Lane 1 owns the Minecraft pixel
  WMs). One short bridge paragraph references `minecraft-world-models.md`.

