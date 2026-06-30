# Lane 7 brief: the world-model lineage (RL, latent dynamics, learning in imagination)

Wave 2, pedagogical. Goal: give a newcomer the genealogy that produced a 2026 "World Action
Model" (WAM): the "predict the world to act" story from its modern origin (2018) through the
latent-dynamics agents that mastered Minecraft.

## Sources reviewed (11 total)

Cornerstones, deep-read from LaTeX (7), each with a new by-paper note:

1. 1803.10122 World Models (Ha, Schmidhuber, 2018) - `notes/by-paper/1803.10122-world-models-ha-schmidhuber.md`
2. 1811.04551 PlaNet / RSSM (Hafner et al., 2018) - `notes/by-paper/1811.04551-planet-rssm.md`
3. 1912.01603 Dreamer v1 (Hafner et al., 2019) - `notes/by-paper/1912.01603-dreamer-v1.md`
4. 2010.02193 DreamerV2 (Hafner et al., 2020) - `notes/by-paper/2010.02193-dreamer-v2.md`
5. 2301.04104 DreamerV3 (Hafner et al., 2023) - `notes/by-paper/2301.04104-dreamer-v3.md`
6. 1911.08265 MuZero (Schrittwieser et al., 2019) - `notes/by-paper/1911.08265-muzero.md`
7. 2310.16828 TD-MPC2 (Hansen, Su, Wang, 2023) - `notes/by-paper/2310.16828-td-mpc2.md`

Breadth, abstract-level (4), folded into the theme file:

8. 2011.03506 Value Equivalence Principle (Grimm, Barreto, Singh, Silver, 2020)
9. 2106.01345 Decision Transformer (Chen et al., 2021) - contrast case (no forward model)
10. 2203.04955 TD-MPC v1 (Hansen, Wang, Su, 2022) - lineage predecessor of TD-MPC2
11. Dyna (Sutton, 1991) - textbook model-based-RL root

Owned theme file: `notes/by-theme/wam-lineage-rl-and-latent-dynamics.md` (the teachable
genealogy, with timeline table and "how this feeds into WAM" closing). Manifest:
`raw-search-results/lane-7-manifest.jsonl`. Search log: `raw-search-results/lane-7-search-log.md`.

Cited, not rewritten (per contract): `wam-foundations.md`, `minecraft-world-models.md`,
`2509.24527-dreamer4.md`, `game-world-models-family.md`.

Counts: 11 sources; 7 LaTeX deep-read; 0 PDF-only; 4 abstract-only.

## Strongest findings (source-backed)

1. The lineage is **two converging branches, not one line**. The reconstruction-based latent line
   (World Models -> PlaNet/RSSM -> Dreamer v1 -> V2 discrete latents -> V3 -> Dreamer 4) learns a
   model that decodes observations (at least as a training signal) and learns the policy in
   imagination. The value-equivalent line (MuZero -> TD-MPC2) predicts only reward/value/policy and
   never reconstructs. DreamerV2 and MuZero reached Atari competence at nearly the same time from
   opposite philosophies; TD-MPC2 even imports DreamerV3's log-space trick. Teaching the two axes
   (what it predicts; pixels vs latent vs value-only) is the clearest way in for a newcomer.

2. **Latent + structured state, not pixels, did hard Minecraft control.** DreamerV3 (2301.04104,
   Nature 2025) collected diamonds from scratch with no human data using a latent RSSM with
   structured inventory state as input; Dreamer 4 (2509.24527) extended to offline-only, real-time
   single-GPU. This is the lineage's direct backing for `wam-foundations.md`'s structured-state
   feasibility argument, the pixel/video Minecraft world models are generators, not the systems that
   achieve hard control.

3. **The model-exploitation / compounding-error failure mode is original to the field, not new.**
   Ha and Schmidhuber (2018) state it verbatim ("a policy that looks good under our dynamics model
   but will fail in the actual environment ... because it visits states where the model is wrong"),
   and PlaNet's intro (2018) names "accumulating errors of multi-step predictions" and "overconfident
   predictions outside of the training distribution." Mitigations along the line: stochasticity
   (temperature), the RSSM deterministic+stochastic split, value bootstrapping beyond a short horizon.
   This is why a runtime that "owns physical truth" should keep any WAM advisory. (Deep treatment
   handed to Lane 10.)

## Weak or uncertain claims (what I could not verify)

- The DreamerV3 Minecraft-diamonds result is dated "Nature 2025" from the arXiv text and field
  knowledge; I read the arXiv LaTeX (2301.04104), not the Nature version, so the exact Nature
  publication details are an unverified report-level attribution.
- MuZero reproducibility is "partial": no official code was released at publication (the paper says
  so), and the compute is large (the DreamerV2 paper cites "over 2 months on a GPU"). Third-party
  reimplementations exist but I did not run or audit them.
- Dyna (Sutton 1991) is cited at textbook level only; no primary fetch.
- I did not independently re-measure any reported benchmark number; all numbers are as stated in the
  papers' own text.

## Implications for this repo (mechanically useful vs research contribution)

- Mechanically useful: the architectural shape (encoder + latent dynamics + advisory predictor); the
  value-equivalence discipline (predict consequences and their costs, not a full reconstruction);
  stabilization tricks (symlog/return normalization, KL balancing, SimNorm); the "decode only as a
  training signal, predict/score in latent space" principle.
- NOT the contribution / out of scope: training a policy by RL inside the dream (Dreamer family) and
  planning with MCTS/MPPI over a learned model (MuZero, TD-MPC2). Both make the model the action
  selector, which violates this repo's advisory-WAM rule (predict/evaluate, never fill args, mark
  progress, or override verifiers). Cite as contrast, do not adopt as runtime authority.

## Recommended next questions

- Stochastic value-equivalent models: MuZero's dynamics are deterministic and it flagged stochastic
  transitions as future work; Stochastic MuZero exists. For a social predictor where outcomes are
  genuinely uncertain (a request may be refused), is a stochastic value-equivalent formulation the
  right target? (Lane 10 / a future lane.)
- How to make "predict consequences, not observations" concrete for typed social-material state:
  what is the social analogue of a "return" that a value-equivalent predictor would target (cost
  imposed on others? obligation balance?)? Wave 1 owns the 4-layer argument; this is the bridge
  question between the lineage's value-equivalence idea and the repo's structured social state.
- Uncertainty as a guardrail: Ha and Schmidhuber's temperature knob made the model less exploitable.
  What is the runtime equivalent of "treat the predictor's confidence as suspect" for an advisory WAM
  feeding a verifier (the FFDC framing in `wam-foundations.md` section 4)?
