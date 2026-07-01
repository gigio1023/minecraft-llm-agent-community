# Lane 30 brief: Calibration and Predictor Evaluation for an advisory social-material WAM

Wave 6, lane 30. Scope: evaluation and calibration for an ADVISORY social-material predictor (forecasts
the next structured state, scored against the verifier-observed delta, separately from the acting
outcome). New angles this archive lacked: proper scoring rules and calibration / ECE; distribution-free
uncertainty quantification and conformal prediction for sequential/structured outputs; selective
prediction / abstention; reproducibility and statistical power for stochastic few-seed evaluation; and
scoring a predictor of deltas separately from action success (the S3AP separation, extended).

## Sources reviewed (count + list)

Deep-read cornerstones (LaTeX, 6):
1. 1706.04599 On Calibration of Modern Neural Networks (Guo et al., ICML 2017) -- ECE, reliability
   diagram, MCE, NLL, temperature scaling, overconfidence of modern nets.
2. 2107.07511 A Gentle Introduction to Conformal Prediction (Angelopoulos and Bates, 2022) --
   distribution-free coverage, the score-function caveat, exchangeability, weighted conformal under
   drift, selective classification via Learn-then-Test.
3. 2108.13264 Deep RL at the Edge of the Statistical Precipice / rliable (Agarwal et al., NeurIPS
   2021) -- IQM, stratified-bootstrap CIs, performance profiles, point-estimate unreliability.
4. 1709.06560 Deep Reinforcement Learning that Matters (Henderson et al., AAAI 2018) -- few-seed
   variance (t=-9.09, p=0.0016 across two sets of 5 seeds), bootstrap power analysis, the Swimmer
   local-optimum progress-laundering analogue.
5. 2304.15004 Are Emergent Abilities of LLMs a Mirage? (Schaeffer et al., NeurIPS 2023) -- metric
   choice manufactures apparent effects; Brier score (a proper scoring rule) removes the artifact.
6. 2107.11277 Machine Learning with a Reject Option: A Survey (Hendrickx et al., 2021) -- ambiguity
   vs novelty rejection; predictive + rejective quality.

Extended (existing note, added a lane-30 section):
7. 2509.00559 Social World Models / S3AP -- the predictor-vs-action dissociation, turned into a
   two-axis measurement protocol.

Cited, not duplicated (existing notes):
- 2306.05685 Judging LLM-as-a-judge / MT-Bench (eval-reliability angle only; note already exists at
  notes/by-paper/2306.05685-judging-llm-as-judge.md). GPT-4 judge reaches >80 percent agreement with
  humans but has position/verbosity biases; reinforces "do not trust an LLM judge as the primary
  social score," owned by notes/by-theme/benchmark-validity-and-evaluation.md.

Breadth (abstract-level, verified ids, logged in manifest):
- 2311.08298 A Survey of Confidence Estimation and Calibration in LLMs (Geng et al., NAACL 2024).
- 2407.01032 Overcoming Common Flaws in the Evaluation of Selective Classification Systems (Traub et
  al., 2024) -- threshold-independent selective evaluation (claim-only status).

Total: 7 by-paper note files written/extended (covering 8 papers), plus 2 breadth ids and 1 cited
existing note. Owned theme file: research-area-calibration-and-predictor-evaluation.md.

## Strongest findings (source-backed)

1. Calibration is a SEPARATE axis from accuracy, and capability does not buy it. Modern nets are
   systematically overconfident, and depth/width WORSEN calibration as they improve accuracy
   (1706.04599). So a strong LLM predictor's stated confidence must be measured (ECE + reliability
   diagram) against verifier outcomes, never assumed. Continuous PROPER scoring rules (Brier, log
   loss) are the right progress metric, and a thresholded metric can manufacture a misleading sharp
   jump that the Brier score removes (2304.15004).
2. Distribution-free coverage is available and cheap for the repo, but breaks on sequential social
   state. Conformal prediction guarantees 1-alpha <= P(Y in C(X)) <= 1-alpha+1/(n+1) for any model and
   distribution using a held-out calibration set (2107.07511), which the verifier supplies at ~$0. But
   the guarantee assumes exchangeability; a maturing settlement violates it, and weighted conformal
   only recovers coverage minus 2*sum(w_i*eps_i), with eps_i never known exactly. Clean-coverage claims
   on multi-cycle social runs are overclaims.
3. The predictor of deltas must be scored separately from action success, because the two dissociate.
   S3AP shows GPT-4.1 is a better AGENT than Llama-4 (6.01 vs 4.52) but an equal world MODEL (6.34 vs
   6.36), and a strong model + weak agent can lower performance (2509.00559). This forces a two-axis
   protocol: predictor axis (proper score + ECE + conformal coverage vs verified delta, aggregated
   with rliable IQM + bootstrap CIs) reported separately from the acting axis. Single mean numbers are
   untrustworthy on stochastic few-seed runs (1709.06560, 2108.13264).

## Weak / uncertain claims

- The two LLM-specific sources (2311.08298, 2407.01032) are abstract-level only; 2407.01032 is logged
  claim-only. Their detailed methods/numbers are not verified.
- Whether a Minecraft settlement empirically violates exchangeability, and by how much (the drift
  magnitude eps_i), is unmeasured here; it is asserted as near-certain on first principles, not shown.
- The conformal coverage theorem and drift bound are proved in the source; I did not re-check the
  proofs.
- No source applies any of this machinery to verifier-grounded structured SOCIAL-MATERIAL deltas. That
  cell is empty; it is the repo's surface, not a citable result.

## Implications for this repo (mechanical vs contribution)

- Mechanical (reuse off the shelf):
  - Report ECE + reliability diagrams for the predictor's confidence channel; optionally temperature-
    scale it on a held-out scenario set (1706.04599).
  - Track predictor progress with Brier / log loss (proper scores), not only exact-match accuracy
    (2304.15004).
  - Use the `rliable` library for IQM + stratified-bootstrap CIs + performance profiles over
    scenarios/seeds; compute CIs on differences for model comparison (2108.13264).
  - Use split conformal for guaranteed-coverage prediction SETS on near-exchangeable Physical/Material
    deltas; use Learn-then-Test for a guaranteed-accuracy abstention threshold (2107.07511).
  - Report selective performance as a threshold-independent accuracy-vs-coverage curve, and label
    abstentions as ambiguity vs novelty (2107.11277, 2407.01032).
- Contribution (the repo's actual novelty):
  - FIRST application of calibration / distribution-free coverage / selective prediction to
    VERIFIER-GROUNDED, structured social-material deltas, where the calibration set is auto-labeled at
    ~$0.
  - The two-axis protocol (predictor vs acting) with the predictor kept strictly ADVISORY, closing the
    progress-laundering hole S3AP's "Foresee and Act" leaves open by feeding the prediction back to the
    agent.
  - An honest treatment of NON-exchangeability for social/settlement prediction (weighted conformal
    with a reported coverage-loss bound), which the existing literature does not instantiate for this
    domain.

## Recommended next questions

1. Which confidence channel does the repo's LLM predictor actually expose (verbalized number, token
   probability, sampled-agreement), and is THAT channel calibrated against verifier deltas?
2. What is the empirical drift magnitude across cycles of a maturing settlement, i.e. how much
   conformal coverage is actually lost, and does a 0.99-decay or rolling-window weighting recover it?
3. What score function over typed social-material deltas produces INFORMATIVE (small) conformal sets,
   not just valid ones (the score-function caveat is where the engineering is)?
4. How many seeds per scenario does a bootstrap power analysis say the repo needs to claim
   "predictor A beats B" on delta-prediction quality?
5. Does abstention split cleanly into ambiguity (boundary) vs novelty (unseen social configuration) on
   real runs, and does novelty rejection correlate with fresh held-out scenarios (lane 35)?

## One-line tie to the thesis

A structured-state, advisory, hierarchical social-material WAM is measurable HONESTLY, because the
runtime verifier supplies the ~$0 held-out labels that calibration, distribution-free coverage,
selective prediction, and few-seed statistics all require, and the predictor stays advisory so its
forecast is scored against the verified delta without ever scoring its own success.
