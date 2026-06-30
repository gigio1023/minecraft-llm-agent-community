# Building and measuring the loop (wave-6 capstone)

What this is: the synthesis of 6 parallel lanes (lanes 30-35) that turn the directions report's seven
HARD QUESTIONS (reports/research-directions-for-the-repo.md, section 7) from open worries into
literature-backed engineering recipes. Where waves 4 and 5 asked "is a verifier-grounded
self-improvement loop admissible" (yes, bounded), wave 6 asks "how do you actually BUILD and MEASURE
it." ASCII punctuation only; numbers are as-stated by sources, with environment-verified results
distinguished from self-reported or claim-only ones.

## TL;DR verdict

- Every one of the directions report's seven hard questions now has a concrete, source-backed recipe.
  None required inventing new theory; the field already built the machinery, just never for structured
  social-material state grounded by a deterministic verifier.
- The repo's deterministic verifier keeps coming back as the asset that converts a known failure into a
  free fix: it is the "gold" side of reward over-optimization (no proxy gap), the per-step external
  scorer that removes the proposer-equals-scorer hole in LLM-as-world-model loops, the consolidation
  gate that stops memory collapse, and the validity gate that makes seeded scenarios comparable.
- The empty cell is now confirmed from six more directions: no surveyed system applies calibration,
  conformal coverage, verifier hardening, LLM-as-world-model scoring, verifier-gated memory, or a
  deterministic scenario/reset gate to STRUCTURED SOCIAL-MATERIAL state. That convergence is the repo's
  contribution surface, not a citable result.
- Wave 6 added 67 unique sources (493 to 560), 6 theme files, ~48 by-paper notes.

## The six lanes, one strongest finding each (tie to the repo)

| Lane | Strongest datapoint (source) | Repo tie |
|---|---|---|
| 30 evaluation and calibration | calibration is a separate axis from accuracy and capability does not buy it (modern nets systematically overconfident, depth/width worsen ECE as accuracy rises, 1706.04599); a thresholded metric manufactures a false sharp jump that the Brier score removes (2304.15004); S3AP shows a model can be a better agent yet an equal world model (GPT-4.1 6.01 vs 4.52 acting, 6.34 vs 6.36 as world model, 2509.00559) | measure the advisory WAM on a TWO-AXIS protocol: predictor axis (proper score + ECE + conformal coverage vs verified delta, aggregated with rliable IQM and stratified-bootstrap CIs, 2108.13264 / 1709.06560) reported separately from the acting axis, never substituted |
| 31 reward models and over-optimization | optimizing a LEARNED proxy predictably destroys the true objective and severity scales with proxy size (Gao 2210.10760); a state-of-the-art reward model collapses below random under a meaning-preserving no-op ("Append Other Code" drops accuracy 0.96 to 0.13) and invariance training generalizes to 27 transforms (reWordBench 2503.11751) | the deterministic verifier is the "gold" side with no proxy gap, so a learned reward model is the more hackable choice; harden the verifier with an invariance + no-op + differential + causal + adversarial probe suite so passing entails correctness |
| 32 LLM as world model | RAP proves an LLM can predict structured next-states usefully (Blocksworld 64%, +33% rel) but is itself proposer AND scorer (2305.14992); WebDreamer's ablation shows the predicted DYNAMICS carry the gain (+34.1% VWA) and it needs a second LLM to score only because the web has no cheap truth (2411.06559); WALL-E patches mispredicted Minecraft transitions with gradient-free rules at near-$0 (+15-30%, 2410.07484) | a prompt-based LLM is a usable advisory WAM at Physical/Material; the verifier replaces the self-score, removing the progress-laundering hole; report per-transition prediction accuracy, a metric NO paper produces |
| 33 mechanism design and institutions | Formal Contracts: a rich enough space of evidence-contingent reward transfers makes every subgame-perfect equilibrium socially optimal, welfare rising with the richness of contractible observations (2208.10469); a governance graph + evidence log cuts LLM collusion (tier 3.1 to 1.8) while a prompt-only constitution does nothing (2601.11369); a model that could write to its scorer Goodharted it 59x (2603.19453) | the verifier produces exactly the "contractible observations" the contracts theorem presupposes; obligations/credit = outcome-dependent commitments on verified deltas; but every system that makes cooperation HAPPEN enforces, and the repo is observe-only, so the Institutional layer stays human-in-the-loop |
| 34 long-horizon memory | evidence-linked memory is architectural and measurably helps (TierMem provenance link to an immutable raw page, +4.2pp, 2602.17913); verifier-gated consolidation shown on the Minecraft/Voyager substrate gives 0% cross-category forgetting vs 32-78% (PEAM 2605.27762); cross-trial experience reuse backs post-goal continuation gradient-free (ExpeL 2308.10144) | post-goal continuation is real IF consolidation is verifier-gated and every social/material memory cites a concrete Mineflayer artifact (verifier record id, inventory diff, transfer/chat event), not free prose; adopt the gate, not PEAM's internalization (the WAM stays advisory) |
| 35 scenario generation and freshness | a deterministic validity gate with reject-and-resample is the proven cheap pattern for comparable seeded scenes (ProcTHOR 10K verified scenes in 1 hour, 2206.06994; PCGRL solver-gated, 2001.09212) but only the PHYSICAL layer has one; time-gating plus deterministic grading is the cheapest freshness defense (LiveCodeBench, 2403.07974); every SOCIAL generator gates with an LLM judge its own authors debunk (SOTOPIA-pi GPT-4 5.71 vs human 4.29, 2403.08715) | a comparable scenario = seed-spec + fixed RNG + replayable artifact + reject-and-resample against the verifier; a ledger reset = deterministic restore of typed Material state; freshness = time-gate by authoring date + private holdout + verifier-labeled (not LLM-judged) synthesis |

## The seven hard questions, now answered

| Directions-report hard question | Wave-6 answer (recipe + source) |
|---|---|
| 1. Reset granularity | seed-spec + fixed RNG + replayable artifact + per-layer reject-and-resample against the verifier (ProcTHOR/PCGRL, lane 35); ledger reset = deterministic restore-and-replay of typed Material state. The social validity gate is the repo's to build (empty cell). |
| 2. Verifier hardening | invariance + no-op + differential + causal + adversarial probe suite; a meaning-preserving rewrite must not change the verdict, an injected defect must (reWordBench 2503.11751, lane 31). Invariance training generalizes. |
| 3. Progress laundering, structurally blocked | the verifier scores, never the actor or proposer; RAP and WebDreamer show self-scoring is the default hole and an external per-step scorer closes it (lane 32); a writable scorer was gamed 59x (2603.19453, lane 33); two-axis eval keeps predictor and acting separate (lane 30). |
| 4. Sharpening ceiling (calibration not capability) | calibration is a separate axis; measure proper score + ECE of the predictor's confidence against verified deltas, never assume it (1706.04599, lane 30). Confirms the wave-5 sharpening bound operationally. |
| 5. Multi-actor dependency | every mechanism that makes cooperation actually happen presupposes multiple agents and enforcement (contracts theorem 2208.10469, Institutional AI 2601.11369, lane 33); single-actor caps the repo at Physical/Material, as the directions report stated. |
| 6. Cost posture | structured-state prediction and correction is near-$0 (WALL-E gradient-free rules, lane 32; ProcTHOR 10K scenes/hour, time-gating ~free, lane 35), versus pixel world models; reinforces the structured-state choice. |
| 7. Freshness | time-gate scenarios/transitions by authoring date, keep a private holdout, refill via LLM synthesis but label with the verifier, run an admission-time paraphrase decontamination check (LiveCodeBench 2403.07974 + 2311.04850, lane 35). Social scenarios do not refill for free; budget authoring. |

## Newly actionable engineering recipes (the build kit)

1. Two-axis evaluation protocol (lane 30): predictor axis = proper scoring rule + ECE + conformal
   coverage of predicted vs verifier-observed delta, aggregated with rliable IQM and stratified
   bootstrap (single means on few stochastic seeds are untrustworthy); acting axis reported separately.
2. Verifier-hardening probe suite (lane 31): auto-generate, for sampled passing transitions,
   meaning-preserving rewrites, no-op padded variants, and defect-injected variants; measure verdict
   stability and flip rate. This is the repo-native analog of reWordBench and an empty cell.
3. Predict-vs-observe advisory loop (lane 32): the WebDreamer/WALL-E shape with the verifier as the
   per-step scorer; report per-transition prediction accuracy on verified Physical/Material deltas (no
   paper reports this; it is the first measurement the repo can uniquely make).
4. Verifier-gated memory (lane 34): consolidate a transition into durable memory only after the
   verifier passes it; every social/material memory carries a provenance link to a concrete Mineflayer
   artifact (TierMem + PEAM patterns).
5. Contracts and institutions as ledger events (lane 33): obligations/credit = outcome-dependent
   commitments conditioned on verified deltas; norms = ABDICO-style records with verifier-detected
   triggers; sanctions/reputation = typed evidence events. Observe-only, never enforced by the runtime.
6. Comparable-scenario and freshness kit (lane 35): seed-spec + fixed RNG + reject-and-resample against
   the verifier; deterministic ledger restore; time-gating + holdout + verifier-labeled synthesis.

## The empty cell persists (the honest surface)

Six independent lanes report the same gap: the machinery exists everywhere except where the repo needs
it. Calibration and conformal coverage are never applied to verified social-material deltas (lane 30);
verifier hardening is shown for text reward models, not embodied typed transitions (lane 31); LLM
world-model scoring is never per-step on typed social state (lane 32); verifier-gated memory is
single-agent and physical-only (PEAM, lane 34); the contracts theorem and institutional enforcement are
abstract or enforced, not observe-only on verified Minecraft deltas (lane 33); deterministic scenario
and reset gates exist only at the physical layer, and every social generator self-grades with a debunked
LLM judge (lane 35). Building the deterministic social validity gate, the social ledger reset, and the
per-step verifier-grounded social predictor is the repo's work, not a citable import.

## The 6 area surveys (read for depth)

- notes/by-theme/research-area-calibration-and-predictor-evaluation.md (lane 30)
- notes/by-theme/research-area-reward-models-and-overoptimization.md (lane 31)
- notes/by-theme/research-area-llm-as-world-model-and-reasoning-planning.md (lane 32)
- notes/by-theme/research-area-mechanism-design-and-cooperative-ai.md (lane 33)
- notes/by-theme/research-area-long-horizon-memory-and-continuity.md (lane 34)
- notes/by-theme/research-area-scenario-generation-and-eval-freshness.md (lane 35)

Companion matrix: matrices/wave6-hard-questions-to-evidence.md. Directions report (the questions this
answers): reports/research-directions-for-the-repo.md. Wave-4 capstone: reports/autoresearch-for-wam.md.
Wave-5 capstone: reports/self-improvement-across-domains.md.
