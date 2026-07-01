# Lane 10 brief: Training, Evaluation, and the Open Problems of World/Action Models

Wave 2, problem-organized capstone lane. Goal: teach a newcomer the cross-cutting craft of HOW
world/action models are trained, HOW they are judged, and WHAT is unsolved. Built on the
already-downloaded WAM survey and wave-1 notes; added three new deep-reads where the field needed
a primary anchor (compounding error, the IDM Turing test, a physics-commonsense benchmark).

## Files created

- Owned theme file: `notes/by-theme/wam-training-evaluation-and-open-problems.md` (three sections:
  Training mechanics; Evaluation landscape + the gap; Open problems; includes Table A
  "metric -> what it measures -> what it misses" and Table B "open problem -> why hard -> who
  flags it").
- New by-paper notes (genuinely new deep-reads):
  - `notes/by-paper/1011.0686-dagger.md` (DAgger, compounding error).
  - `notes/by-paper/2601.04137-wow-wo-val-idm-turing.md` (IDM Turing Test, concrete numbers).
  - `notes/by-paper/2406.03520-videophy.md` (physics-commonsense benchmark).
- `raw-search-results/lane-10-manifest.jsonl` (18 rows).
- `raw-search-results/lane-10-search-log.md`.
- This brief.

## Sources reviewed (count + list)

18 sources logged. New LaTeX deep-reads (3): 1011.0686 DAgger, 2601.04137 Wow/IDM-Turing,
2406.03520 VideoPhy. Re-read already-downloaded LaTeX (1, cited not rewritten): 2605.12090 WAM
survey (060-eval, 070-oppo). Cited existing wave-1 notes (4 LaTeX): 2602.15922 DreamZero,
2603.22078 Do-WAMs-Generalize, 2601.15533 actionable-simulators, 2504.08388 MineWorld, 2603.23497
WildWorld. Verified-but-abstract physics benchmarks (4): 2501.09038 Physics-IQ, 2502.20694
WorldModelBench, 2410.05363 PhyGenBench, 2503.21755 VBench-2.0. Breadth corroborators (abstract,
6): 2601.21282 WorldBench, 2605.10434 WorldReasonBench, 2507.13428 PhyWorldBench, 2603.17808 EVA,
2606.04811 Dream.exe, 2601.07823 video-gen-in-robotics survey.

Counts: LaTeX downloaded by this lane = 3 new (DAgger, Wow, VideoPhy) + 5 already-present reused.
PDF-only = 0. Abstract-only (verified IDs, not fetched) = 10.

## Strongest findings (source-backed)

1. Compounding error has a tight, canonical bound. DAgger (1011.0686) proves a policy with
   per-step error `epsilon` under the expert distribution can make up to `T^2 * epsilon` mistakes
   over `T` steps under its own induced distribution, because one mistake shifts the whole
   downstream state distribution. This is the imitation-learning name for the exact phenomenon the
   WAM survey calls "distributional drift accumulates over long rollouts." It is the load-bearing
   reason long autoregressive world-model rollouts drift, and the DAgger fix (train on the model's
   own induced states) is the conceptual ancestor of DreamZero's inference-time ground-truth
   re-grounding.

2. Fidelity is provably not control, with numbers. The IDM Turing Test (Wow, 2601.04137) runs a
   reality-trained inverse-dynamics model on generated robot videos and executes the inferred
   actions: human-fooling models collapse to near-0% real-robot success (Kling 9.88%, Hailuo
   2.47%), and only models with real-robot data exposure pass at all (WoW-wan 40.74%). Meanwhile
   the human deceive-ratio correlates with Video-Quality at r=0.874. So appearance convinces
   humans while executability collapses. VideoPhy (2406.03520) shows the upstream version: the best
   T2V model is jointly text-adherent and physically plausible for only 39.6% of prompts; Physics-IQ
   (2501.09038) states physical understanding is "unrelated to visual realism." Three independent
   sources, one conclusion.

3. The field admits its own evaluation gap. The WAM survey (2605.12090, 070-oppo) states there is
   NO standard metric for the causal consistency between an imagined future and the chosen action;
   world-modeling and action are scored on separate leaderboards. It proposes (does not provide)
   Counterfactual Consistency and Foresight-Conditioned Success. This is the cleanest "insider"
   confirmation that the prediction-vs-action coupling is unmeasured, which is exactly the axis a
   structured-state social predictor would need.

## Weak or uncertain claims (what I could not verify)

- The four physics-commonsense benchmarks beyond VideoPhy (Physics-IQ, WorldModelBench,
  PhyGenBench, VBench-2.0) are logged at abstract level only; their exact protocols are taken from
  the survey's table and the HF abstracts, not from their LaTeX. Their headline "models fail
  physics" direction is consistent across all, but I did not independently reproduce per-benchmark
  numbers.
- Representation-collapse mechanism (stop-gradient + EMA) is grounded in the JEPA SSL literature
  via web verification, not from a single canonical JEPA LaTeX deep-read this lane. The mechanism
  (constant-collapse trivial solution, moving-teacher asymmetry, VICReg caveat) is well attested,
  but the JEPA lineage proper is lanes 7-9's territory; I treated it as a training-mechanics
  definition, not a paper review.
- The breadth corroborators (EVA, Dream.exe, WorldReasonBench, WorldBench, PhyWorldBench, video-gen
  survey) are abstract-only; I did not deep-read them. They reinforce the themes; I did not lean
  any unique claim on them.
- Wow's reproducibility is "partial": LaTeX is full, but the GC-IDM and real-robot execution rig
  are not something this review can run.

## Implications for this repo (mechanically useful vs research contribution)

- Mechanically useful (engineering): the discipline these sources enforce maps cleanly onto the
  repo's existing rules. (a) Never accept a plausible-looking prediction as success; require it to
  match a verified world delta, the verifier already plays the role the IDM Turing Test assigns to
  a reality-trained reader. (b) Score prediction accuracy and acting outcome as SEPARATE axes (the
  survey's decoupling, reframed positively), which `benchmark-validity-and-evaluation.md` already
  prescribes. (c) If the repo ever trains a small transition model on its own logs, keep retraining
  on the states the model's own use induces (the DAgger lesson), not only on already-logged states.
- Research contribution framing (modest): the lane does NOT add a new repo claim; it supplies the
  field-level "what is hard" backbone behind the feasibility decision in
  `data-and-training-feasibility.md`. The honest position: the two open problems that bind a
  structured-state social WAM are hidden state (possession/obligation are invisible in pixels, the
  WildWorld argument) and the unmeasured prediction-vs-action coupling; the pixel-specific costs
  (real-time latency, AR/diffusion token blowup) do NOT apply to a structured-state advisory
  predictor, which is a point in the repo's favor, not a capability claim.

## Recommended next questions

1. Can the survey's "Foresight-Conditioned Success" be operationalized for structured state, score
   whether the runtime's executed action matches the advisory predicted social-material delta, with
   a counterfactual variant (perturb the predicted future, check the action responds)? This is the
   only place the lane sees a realizable joint causal-consistency metric for this repo.
2. WorldReasonBench (2605.10434) is one of the few benchmarks naming a SOCIAL consistency dimension
   for world-state prediction. Worth a wave-3 deep-read to see whether its social/logical/
   informational-consistency framing offers a transferable protocol, or whether it stays
   pixel-bound like the rest.
3. The "unified data digestion" idea (mix action-labeled and action-free data) is well-motivated
   for pixel WAMs but the repo auto-labels every triplet; is there any residual value in ingesting
   action-free Minecraft video, or is it strictly unnecessary given the verifier? (Cross-check with
   `data-and-training-feasibility.md` Option E and LAPA.)
