# Lane 7 search log (world-model lineage: RL and latent dynamics)

Date: 2026-06-16. Channel order per contract: Hugging Face CLI first (`hf papers info/read`),
then web (`WebFetch` against arxiv.org) for IDs not on the HF papers index. LaTeX fetched via
`bash scripts/fetch_arxiv_latex.sh <id> <slug>`.

## Step 1: verify all seed arXiv IDs before fetching

The lane brief said "best-known IDs, verify first." I verified each before any LaTeX fetch.

- `hf papers info 1803.10122` -> CONFIRMED "World Models" (Ha, Schmidhuber). On HF papers.
- `hf papers info 1811.04551` -> "not found on the Hub." Expected for a 2018 paper. Verified
  independently via `WebFetch https://arxiv.org/abs/1811.04551` -> CONFIRMED "Learning Latent
  Dynamics for Planning from Pixels" (PlaNet), Hafner et al., 2018. ID correct.
- `hf papers info 1912.01603` -> CONFIRMED "Dream to Control: Learning Behaviors by Latent
  Imagination" (Dreamer v1). On HF papers.
- `hf papers info 2010.02193` -> "not found on the Hub." Verified via
  `WebFetch https://arxiv.org/abs/2010.02193` -> CONFIRMED "Mastering Atari with Discrete World
  Models" (DreamerV2), Hafner et al., 2020. ID correct.
- `hf papers info 2301.04104` -> CONFIRMED "Mastering Diverse Domains through World Models"
  (DreamerV3). On HF papers. Abstract confirms "first algorithm to collect diamonds in Minecraft
  from scratch without human data or curricula."
- `hf papers info 1911.08265` -> CONFIRMED "Mastering Atari, Go, Chess and Shogi by Planning with
  a Learned Model" (MuZero). On HF papers.
- `hf papers info 2310.16828` -> CONFIRMED "TD-MPC2: Scalable, Robust World Models for Continuous
  Control." On HF papers. Abstract confirms "decoder-free world model," "104 online RL tasks,"
  "single 317M parameter agent."
- `hf papers info 2011.03506` (breadth) -> "not found on the Hub." Verified via
  `WebFetch https://arxiv.org/abs/2011.03506` -> CONFIRMED "The Value Equivalence Principle for
  Model-Based Reinforcement Learning" (Grimm, Barreto, Singh, Silver), 2020. ID correct.
- `hf papers info 2106.01345` (breadth) -> CONFIRMED "Decision Transformer: Reinforcement Learning
  via Sequence Modeling" (Chen, Lu, ... Abbeel, Srinivas, Mordatch). On HF papers.
- `hf papers info 2203.04955` (TD-MPC v1, for lineage context) -> CONFIRMED "Temporal Difference
  Learning for Model Predictive Control" (Hansen, Wang, Su), 2022.

ID-correction summary: ALL 10 seed/context IDs were correct as given. No corrections needed.
The three "not found on the Hub" results (1811.04551, 2010.02193, 2011.03506) are HF-papers-index
gaps for older papers, not wrong IDs; each was confirmed correct directly on arXiv.

## Step 2: fetch LaTeX for the 7 cornerstones

All succeeded (tarball_extracted), polite 3s sleep between calls (script-enforced):

- `bash scripts/fetch_arxiv_latex.sh 1803.10122 world-models-ha-schmidhuber` -> papers/latex/1803.10122/ (1 tex)
- `bash scripts/fetch_arxiv_latex.sh 1811.04551 planet-rssm` -> papers/latex/1811.04551/ (27 tex; content in sections/)
- `bash scripts/fetch_arxiv_latex.sh 1912.01603 dreamer-v1` -> papers/latex/1912.01603/ (24 tex; content in sections/)
- `bash scripts/fetch_arxiv_latex.sh 2010.02193 dreamer-v2` -> papers/latex/2010.02193/ (33 tex; content in sections/)
- `bash scripts/fetch_arxiv_latex.sh 2301.04104 dreamer-v3` -> papers/latex/2301.04104/ (44 tex; content in sections/)
- `bash scripts/fetch_arxiv_latex.sh 1911.08265 muzero` -> papers/latex/1911.08265/ (6 tex)
- `bash scripts/fetch_arxiv_latex.sh 2310.16828 td-mpc2` -> papers/latex/2310.16828/ (2 tex; iclr2024_conference.tex)

## Step 3: deep-read (LaTeX), sections read

- Ha-Schmidhuber: main.tex full intro + Agent Model (V/M/C) + Car Racing + VizDoom dream + the
  "model exploitation / adversarial policy / temperature tau" passages (lines 414-596).
- PlaNet: sections/introduction.tex, model.tex (RSSM deterministic+stochastic), planning.tex (CEM/MPC).
- Dreamer v1: sections/intro.tex, behavior.tex (actor-critic in imagination, analytic value gradients,
  lambda-return).
- DreamerV2: sections/intro.tex, method.tex (categorical latents, straight-through gradients, KL
  balancing; MuZero compute contrast).
- DreamerV3: sections/intro.tex (Minecraft diamonds from scratch), algorithm.tex (RSSM, symlog, free bits).
- MuZero: main.tex intro + Prior Work (value equivalence, Predictron lineage) + Algorithm
  (representation/dynamics/prediction functions, MCTS, Reanalyze).
- TD-MPC2: iclr2024_conference.tex intro + Background (MPC) + sec 3 (implicit decoder-free model,
  joint-embedding + reward + TD objective, MPPI planning, SimNorm, 317M multitask agent).

## Step 4: breadth (abstract-level)

- Value Equivalence Principle (2011.03506): abstract via arXiv; folded into theme file section 3.
- Decision Transformer (2106.01345): abstract via `hf papers info` ("RL as sequence modeling,"
  "no value functions or policy gradients"); contrast case in theme file section 4.
- TD-MPC v1 (2203.04955): abstract via `hf papers info`; lineage predecessor of TD-MPC2.
- Dyna (Sutton 1991): textbook model-based-RL root; cited in theme file section 0/timeline, no fetch.

## Notes on scope

- Did NOT re-survey Minecraft pixel world models (Solaris, MineWorld, Oasis, Matrix-Game, WildWorld):
  wave-1 `minecraft-world-models.md` owns that; referenced, not redone.
- Did NOT rewrite the existing `2509.24527-dreamer4.md` or `game-world-models-family.md`: cited only.
- No paid-LLM / provider / API calls. No runtime code or AGENTS/README/SPEC/CLAUDE edits. All writes
  inside ROOT.
