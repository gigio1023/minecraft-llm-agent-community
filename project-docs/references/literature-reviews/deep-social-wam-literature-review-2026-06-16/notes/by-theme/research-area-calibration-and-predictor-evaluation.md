# Calibration and Predictor Evaluation: how to score an advisory social-material predictor honestly

Lane 30 (wave 6) theme file. Audience: external-team readers; every term is defined in plain language
on first use. This file covers HOW to measure an ADVISORY predictor (a model that forecasts the next
structured state and is scored against the verifier-observed delta, separately from whether the action
succeeded). It deliberately does NOT re-cover general benchmark validity or LLM-judge unreliability,
which are owned by companions:

- notes/by-theme/benchmark-validity-and-evaluation.md (lane 3): is the SOCIAL claim valid; plausibility
  is not validity; the LLM judge is itself unreliable. That file owns the overclaim boundary.
- notes/by-theme/wam-training-evaluation-and-open-problems.md (lane 10): the field-level
  world-model training/eval craft, the fidelity-vs-control gap, and the evaluation-decoupling open
  problem. That file owns "is the WORLD prediction faithful and useful" at the pixel/robot level.
- This file owns the NEW angle: proper scoring rules, calibration, distribution-free coverage,
  selective prediction, and the statistics of evaluating a STOCHASTIC predictor on FEW seeds.

Definitions used throughout (plain, one line each):
- Calibration: a stated probability is honest, i.e. of all the predictions made with confidence p, a
  fraction p actually come true ([[1706.04599-calibration-modern-neural-networks]]).
- Proper scoring rule: a score (Brier, log loss) minimized in expectation only by reporting the TRUE
  probability, so it cannot be gamed by misstating confidence.
- Conformal prediction: a wrapper that turns any model into one emitting a SET / interval with a
  guaranteed chance of containing the truth, with no distributional assumption
  ([[2107.07511-conformal-prediction-tutorial]]).
- Selective prediction / reject option / abstention: a model that says "I do not know" below a
  confidence threshold ([[2107.11277-machine-learning-reject-option]]).
- Point estimate vs interval estimate: a single number (mean accuracy) vs a number plus an uncertainty
  range; rliable's central message is that any finite-run estimate is a random variable
  ([[2108.13264-rliable-statistical-precipice]]).

---

## Section 1. The four questions an advisory predictor must answer about itself

An advisory predictor p(o' | o, l) over typed Minecraft and social state emits a forecast of the next
delta and is scored against the verifier-observed delta. Four orthogonal questions, each with its own
literature and its own metric:

1. Is its stated confidence HONEST (calibration)? Section 2.
2. Can it give a guaranteed-coverage SET when a point guess is too risky (conformal)? Section 3.
3. Does it ABSTAIN on the cases it would get wrong (selective prediction)? Section 4.
4. Are its reported numbers TRUSTWORTHY given few, stochastic runs (rliable / reproducibility)?
   Section 5.

These are separate axes. A predictor can be accurate yet overconfident (fails 1), accurate yet unable
to bound its uncertainty (fails 2), accurate yet never abstaining on novel regimes (fails 3), and look
good on a single mean while being statistically indistinguishable from a worse model (fails 4).

## Section 2. Calibration and proper scoring rules (is the stated confidence honest)

- The canonical result: modern neural networks are systematically OVERCONFIDENT
  ([[1706.04599-calibration-modern-neural-networks]]). A 110-layer ResNet on CIFAR-100 has average
  confidence well above its accuracy, while an old 5-layer LeNet is well-calibrated. Depth, width, and
  removing weight decay all WORSEN calibration even as they improve accuracy. Mechanism: the network
  keeps overfitting to the negative-log-likelihood (cross-entropy) after it has stopped overfitting to
  0/1 error, inflating confidence without improving correctness.
- The metrics (importable verbatim):
  - Reliability diagram: plot observed accuracy vs stated confidence; perfect calibration lies on the
    diagonal.
  - Expected Calibration Error (ECE): weighted average over bins of |accuracy - confidence|. The
    primary scalar.
  - Maximum Calibration Error (MCE): the worst single-bin gap, for high-risk settings.
  - Negative log likelihood (NLL) and Brier score: PROPER scoring rules, minimized only by the true
    probability.
- The fix: TEMPERATURE SCALING, one learned scalar dividing the logits, recalibrates confidence
  without changing the argmax (so accuracy is untouched). "Surprisingly effective."
- The proper-scoring-rule connection runs straight into the emergent-abilities critique
  ([[2304.15004-emergent-abilities-mirage]]): a thresholded metric (exact-match accuracy over a
  multi-token output) can bend a smooth underlying curve into a sharp, misleading jump, and switching
  to the BRIER SCORE (a continuous proper score) "removes the emergent ability" and reveals smooth,
  predictable improvement. The lesson for any probabilistic predictor: track progress with a proper
  scoring rule or a continuous distance, not only a brittle exact-match accuracy that can move sharply
  and mislead.
- LLM-specific caveat ([[2311.08298-llm-confidence-calibration-and-2407.01032-selective-eval-flaws]]):
  when the predictor is an LLM, "confidence" can be a verbalized number, a token probability, or a
  sampled-agreement estimate, each with its own miscalibration pattern. The repo must calibrate
  WHATEVER confidence channel it actually uses, and not assume a verbalized "I am 80 percent sure" is
  honest.

## Section 3. Conformal prediction (a guaranteed-coverage set without distributional assumptions)

- Mechanism ([[2107.07511-conformal-prediction-tutorial]]): wrap any model with a held-out CALIBRATION
  set; emit a prediction SET C(X) instead of a point guess. The marginal coverage guarantee is
  1 - alpha <= P(Y in C(X)) <= 1 - alpha + 1/(n+1), holding for ANY model and ANY distribution, where
  n is the calibration-set size. Three steps: choose a score function, take the
  ceil((n+1)(1-alpha))/n quantile of calibration scores, include all labels under that quantile.
- The crucial caveat, verbatim: "the usefulness of the prediction sets is primarily determined by the
  score function." Coverage is free; INFORMATIVENESS (small sets) is the engineering work. A noise
  score still covers, but with useless, huge sets.
- The standing assumption is EXCHANGEABILITY of calibration and test points. This is the FIRST thing
  that breaks for a sequential social process. Under distribution DRIFT, weighted conformal (discount
  old scores via a rolling window or 0.99^(n-i) decay) still gives marginal coverage, but degraded by
  2 * sum_i (wtilde_i * eps_i), where eps_i is the total-variation shift of point i from the test
  point, and "the eps_i are never known exactly in advance." So conformal coverage on a multi-cycle
  social run must be reported WITH an acknowledgment of non-exchangeability, not as a clean guarantee.

## Section 4. Selective prediction (the advisory "I do not know")

- The reject option ([[2107.11277-machine-learning-reject-option]]) lets a model ABSTAIN when likely
  wrong, and distinguishes two abstention causes the repo needs:
  - AMBIGUITY rejection: genuine two-way uncertainty near a boundary (the partner might return the
    pickaxe or keep it) -- reducible with more/cleaner data.
  - NOVELTY rejection: an input unlike anything seen (an unseen multi-actor coalition) -- a coverage
    gap that abstention should flag and that fresh held-out scenarios (lane 35) should probe.
  Both PREDICTIVE quality (accuracy on accepted predictions) and REJECTIVE quality (did it abstain on
  the right cases) must be measured.
- Conformal supplies the formal guarantee
  ([[2107.07511-conformal-prediction-tutorial]], Selective Classification): a SELECTIVE ACCURACY
  guarantee P(correct | confidence >= lambdahat) >= 1 - alpha, with the threshold chosen by
  Learn-then-Test (scan thresholds, upper-bound the misclassification rate with a Binomial bound,
  pick the smallest threshold that stays under alpha) because accuracy is not monotone in the cutoff.
- The evaluation-methodology warning
  ([[2311.08298-llm-confidence-calibration-and-2407.01032-selective-eval-flaws]], part B): do NOT
  report selective performance at one hand-picked threshold. Report a THRESHOLD-INDEPENDENT
  accuracy-vs-coverage curve (the analogue of an ROC), so the abstention behavior is judged across all
  operating points. This is the abstention twin of rliable's "no single point estimate."

## Section 5. Reproducibility and statistical power for stochastic, few-seed evaluation

- The problem ([[1709.06560-deep-rl-that-matters]], [[2108.13264-rliable-statistical-precipice]]):
  stochastic systems evaluated on a handful of runs produce point estimates dominated by statistical
  noise. The signature demonstration: two groups of 5 same-algorithm, same-hyperparameter RL runs,
  differing only in seed, land in statistically DIFFERENT distributions (HalfCheetah t = -9.0916,
  p = 0.0016). A reported point estimate "evades the question: would similar findings be obtained with
  new independent runs?"
- The toolkit (rliable):
  - INTERVAL estimates via STRATIFIED BOOTSTRAP CIs, not point estimates ("any performance estimate
    based on a finite number of runs is a random variable").
  - PERFORMANCE PROFILES (score distributions) over all runs: unbiased, robust, readable at any
    percentile.
  - INTERQUARTILE MEAN (IQM), the mean of the middle 50 percent of runs: robust like the median but far
    more statistically efficient; the median "requires a large number of runs to claim improvements"
    and is unchanged by zero scores on nearly half the tasks.
  - Probability of improvement and optimality gap as supplements.
  - Compute CIs for the score DIFFERENCE when comparing two models, rather than eyeballing CI overlap.
  - Prefer CIs and effect sizes over dichotomous p < 0.05 significance tests.
- Older but founding ([[1709.06560-deep-rl-that-matters]]): report ALL seeds and hyperparameters; use
  bootstrap POWER ANALYSIS to decide how many runs are needed (give the sample a uniform lift, check
  what fraction of bootstrap simulations stay significant; a low fraction means run more). And: a
  metric can look like progress while the system did the wrong thing (Swimmer local-optimum:
  return ~130 from flailing, not swimming), so show BEHAVIOR, not only the number.

## Section 6. The dissociation that forces a two-axis protocol (the S3AP separation, extended)

- The empirical fact ([[2509.00559-social-world-models]]): world-modeling capability and acting
  capability are dissociable. GPT-4.1 beats Llama-4 Maverick as an AGENT (6.01 vs 4.52 goal
  completion) but their social-world-MODEL scores are nearly identical (6.34 vs 6.36), and a strong
  world model with a weak agent can LOWER end performance. The "smartest" model is not necessarily the
  best predictor (the same "more capability != fidelity" pattern as SimBench in
  notes/by-theme/benchmark-validity-and-evaluation.md).
- The consequence: the predictor of deltas must be scored on its OWN axis, never via a downstream
  task-success number. The two-axis protocol:
  - PREDICTOR axis (this lane): predicted next-delta vs verifier-observed delta, scored with a proper
    scoring rule (Brier / log loss), calibration (ECE + reliability diagram), and distribution-free
    coverage (conformal) where a set is emitted; aggregated with IQM + stratified-bootstrap CIs over
    scenarios and seeds.
  - ACTING axis (separate): goal completion against verifier artifacts, reported alongside but never
    substituted for the predictor axis.
- S3AP's gap is the repo's surface: S3AP scores its predictor only through SOTOPIA goal completion and
  ToM tasks, never against a VERIFIED world change. The repo's verifier auto-labels
  (state, action, next-state) at ~$0, which is exactly the held-out, ground-truth-labeled calibration
  set every method in Sections 2-5 requires. The expensive ingredient for honest predictor evaluation
  is the thing the repo already owns.

---

## Tie to the project / 4-layer admissibility

- The verifier is the precondition for ALL of this. Calibration (Section 2) needs ground-truth
  outcomes to bin confidence against; conformal (Section 3) needs a labeled calibration set; selective
  prediction (Section 4) needs to know whether an abstention was warranted; reproducibility statistics
  (Section 5) need per-transition labels to aggregate. The runtime verifier supplies all of these at
  ~$0 by auto-labeling (state, action, next-state). Without it, none of these protocols can run on
  social-material deltas.
- Layer admissibility (where each protocol bites hardest):
  - Physical / Material layers: nearly exchangeable per-step deltas (a mined block, a moved item).
    Plain split conformal and standard ECE apply cleanly; these are the EASY layers to score.
  - Social / Institutional layers: a sequential, NON-exchangeable process (trust accrues, norms form,
    a settlement matures), so the exchangeability assumption breaks. Weighted conformal with a
    documented coverage-loss bound (Section 3) and the few-seed statistics (Section 5) are mandatory,
    and any clean-coverage claim on a multi-cycle social run is an overclaim.
  - The hard line holds: the predictor is ADVISORY. Every metric here measures forecast quality; none
    lets the prediction gate serving, fill action args, mark progress, or score its own success. The
    proposer is never the scorer, applied at the evaluation boundary (directions report).
- The honest claim the repo can make: "predictor A, on a named held-out scenario set with named seeds,
  achieved Brier/log-loss X, ECE Y, and conformal coverage Z against verifier-observed deltas,
  aggregated as IQM with stratified-bootstrap CIs, and abstained on W percent of cases (accuracy on
  accepted predictions above threshold), with the acting outcome reported separately; and it did so
  more reliably than predictor B (CI on the difference)." That is defensible. A single mean
  delta-accuracy, or a clean conformal-coverage claim on a drifting social run, or a task-success
  number used as a stand-in for prediction quality, are not.

## What I could not verify

- I did not re-run any method. The calibration, conformal, rliable, RL-that-matters, and
  emergent-mirage findings are quoted from their sources (LaTeX deep-read); the numbers are theirs, not
  re-derived here. The conformal coverage theorem and the drift bound are proved in the source; I did
  not check the proofs line by line.
- The two LLM-specific breadth sources
  ([[2311.08298-llm-confidence-calibration-and-2407.01032-selective-eval-flaws]]) were read at
  ABSTRACT level only; their detailed methods and numbers are not verified here, and 2407.01032's
  status is logged claim-only.
- There is NO source in the surveyed literature that applies calibration / conformal / selective-
  prediction / few-seed statistics to VERIFIER-GROUNDED, STRUCTURED SOCIAL-MATERIAL deltas. Every
  source here is from classifier calibration, distribution-free UQ, RL evaluation, or LLM social
  simulation; the structured-social-material, verifier-labeled instance is empty. That emptiness is the
  repo's surface, not a citable result, and I have not claimed otherwise.
- I did not measure whether a maturing Minecraft settlement actually violates exchangeability in
  practice (it almost certainly does, but the magnitude of the drift eps_i is unmeasured here); that is
  an empirical question the repo would answer with its own runs.
