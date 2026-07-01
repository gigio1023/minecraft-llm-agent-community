# Lane 7 (F1): The World-Model Lineage: RL, latent dynamics, and "learning in imagination"

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum.md`
first. You are Lane 7. Manifest fragment: `raw-search-results/lane-7-manifest.jsonl`.

## Why this lane exists

A newcomer cannot understand a 2026 "World Action Model" without the genealogy that
produced it. This lane tells the **"predict the world to act" story** from its modern
origin (2018) through the latent-dynamics agents that mastered Minecraft. The narrative
spine: pixels -> compact latent state -> value-equivalent (predict only what matters for
acting) -> learning a policy inside a learned dream.

## What to nail down (with primary-source evidence, taught plainly)

- What problem a "world model" solves for a decision-making agent, and why model-based
  beats model-free in sample efficiency (and where it does not).
- The architectural arc: VAE+RNN controller -> recurrent state-space model (RSSM) ->
  actor-critic trained purely in latent imagination -> discrete latents -> value-
  equivalent models that skip reconstruction.
- "Imagination" / "rollout" / "dreaming" (training a policy on the model's own predicted
  trajectories): what it is, why it is powerful, and its failure mode (compounding error
  / model exploitation). Hand off the deep compounding-error treatment to Lane 10 but
  define it here.
- Why latent (not pixel) world modeling is what actually did hard Minecraft control.

## Seed sources (best-known IDs; VERIFY before fetching, correct if wrong)

Cornerstones (download LaTeX, deep-read intro+method):
- 1803.10122 Ha & Schmidhuber, "World Models" (NeurIPS 2018), V (VAE) + M (MDN-RNN) + C
  (controller, CMA-ES); training the controller inside the RNN's hallucinated dream.
  The seminal modern world-model paper. Likely cite-foundation for the whole field.
- 1811.04551 PlaNet (Hafner et al.), Recurrent State-Space Model (RSSM): deterministic +
  stochastic latent transition; planning by latent rollouts (CEM). Define RSSM here.
- 1912.01603 Dreamer (v1), actor-critic learned by backprop through imagined latent
  trajectories.
- 2010.02193 DreamerV2, discrete (categorical) latents; first world-model agent to reach
  human-level Atari.
- 2301.04104 DreamerV3, one config across 150+ tasks; first to collect Minecraft
  diamonds from scratch with no human data (Nature 2025). Reference the existing Dreamer4
  note (`2509.24527-dreamer4.md`) for the offline/real-time successor; do not rewrite it.
- 1911.08265 MuZero, value-equivalent model: learn only reward/value/policy-relevant
  dynamics (no observation reconstruction), plan with MCTS. Define "value equivalence."
- 2310.16828 TD-MPC2 (verify), scalable latent model-based control; model-predictive
  control over a learned latent model.

Context / breadth (abstract level fine):
- 2011.03506 (verify) "The Value Equivalence Principle for Model-Based RL" (Grimm et al.)
- 2106.01345 Decision Transformer, RL as return-conditioned sequence modeling; a useful
  contrast (no explicit forward model, yet "models" trajectories).
- The Sutton "Dyna" lineage / model-based RL background (one line, textbook-level).

## Owned deliverables

- `notes/by-theme/wam-lineage-rl-and-latent-dynamics.md`, the genealogy as a teachable
  story: the problem, each milestone (what it introduced, why it mattered, what it fixed
  from the prior one), a small timeline table (year, system, key idea, what it predicts,
  pixel/latent/value), and a closing "how this feeds into WAM" paragraph (the WAM survey
  treats Dreamer-line agents as model-based-RL neighbors of WAM). Define every term.
- New by-paper notes (schema in shared contract) for the cornerstones that have NO note
  yet: Ha-Schmidhuber, PlaNet, Dreamer v1, DreamerV2, DreamerV3, MuZero, TD-MPC2.
- Manifest + search-log fragments (lane 7); per-lane brief
  `notes/subagent-briefs/lane-7-world-model-lineage.md`.

Tag manifest rows with at least `world-model` and `wam` where apt; add `minecraft` for
Dreamer rows. Keep "relevance to repo" to one line per source (wave 1 owns the app).
