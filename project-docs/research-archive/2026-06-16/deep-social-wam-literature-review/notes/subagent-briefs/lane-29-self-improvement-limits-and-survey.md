# Lane 29 (I6) brief: the self-improvement concept, its surveys, and its limits

## Lane name
The self-improvement concept and its honest limits map: when a self-improvement ("자가발전" /
autoresearch) loop compounds, when it collapses, when it only sharpens, and where
recursive-self-improvement rhetoric outruns the evidence.

## Sources reviewed (17 total; 7 LaTeX deep-read, 10 abstract/WebFetch)

LaTeX deep-read (by-paper notes written):
- 2305.17493 Curse of Recursion / model collapse (Shumailov et al.; Nature 2024)
- 2307.01850 Self-Consuming Generative Models Go MAD (Alemohammad et al.; ICLR 2024)
- 2404.01413 Is Model Collapse Inevitable? Accumulating data breaks the curse (Gerstgrasser et al.; COLM 2024)
- 2412.01951 Self-Improvement in Language Models: The Sharpening Mechanism (Huang et al.; ICLR 2025)
- 2507.21046 A Survey of Self-Evolving Agents: On Path to ASI (concept frame + limits section)
- 2602.09877 The Devil Behind Moltbook: the self-evolution trilemma (Wang et al.; 2026)
- 2509.26354 Your Agent May Misevolve (Shao et al.; 2025)

Abstract / WebFetch breadth (manifest only, no by-paper note):
- 2507.23181 (compute bottleneck vs intelligence explosion, verified), 2512.04119 (existential-risk
  reassessment, verified), 2510.02665 (MLLM self-improvement survey), 2412.14352 (inference-time
  self-improvement survey), 2412.02674 (Mind the Gap / generation-verification gap), 2411.00750
  (tail narrowing plateau), 2412.17256 (B-STaR exploration decay), 2412.14689 (synthesize text
  without collapse), 2410.12954 (critical note: collapse may be unavoidable), 2402.07712 (model
  collapse demystified, regression).

Cited, NOT re-surveyed (owned by siblings): 2508.07407 (lane 18 loop survey), 2505.21444 (lane 22
Can-Self-Train collapse), ENPIRE `notes/by-paper/enpire.md` (anchor), DGM 2505.22954 (lane 18).

## Strongest findings (source-backed)

1. **Collapse is the default for un-grounded loops, proved three independent ways, and the dividing
   line is always external grounding.** Distributional: model collapse is inevitable in the
   idealized replace-only case (Markov-chain absorbing-state argument, 2305.17493), independently
   confirmed as MAD across diffusion/GAN/flow models with a quality-vs-diversity split (2307.01850).
   Signal: a loop that scores its own success collapses via reward hacking (Can-Self-Train
   2505.21444, lane 22; DGM node 114 deleted its own detector, lane 18). Safety: closed
   self-evolving agent societies lose safety mutual-information monotonically by the Data Processing
   Inequality (Trilemma 2602.09877), measured as a 45% Refusal-Rate drop and 76-93% tool-safety
   failures on frontier models (Misevolution 2509.26354).
2. **Collapse is escapable by exactly the repo's two mechanisms.** Accumulate-don't-replace gives a
   finite error bound independent of iterations (2404.01413; 10% retained real data nearly arrested
   collapse in 2305.17493). External-verifier-plus-reset is independently prescribed by the trilemma
   paper as the way to break the closed loop ("external verifiers + periodic thermodynamic cooling",
   2602.09877). The repo already has both: the runtime verifier and clean scenario reset.
3. **Self-improvement only sharpens; it cannot add new capability.** By the data-processing
   inequality, a no-external-feedback loop cannot create information not already in the model; it
   amortizes hidden knowledge bounded by the base model's coverage and then plateaus (Sharpening
   2412.01951; tail narrowing 2411.00750; B-STaR 2412.17256). So a verifier-grounded loop makes the
   WAM better-calibrated where the verifier checks it, NOT socially smarter.

## Weak or uncertain claims (what I could not verify)

- The trilemma impossibility (2602.09877) rests on an information-theoretic argument with an
  idealized closed-system assumption and QUALITATIVE empirical support (documented Moltbook
  incidents), not a controlled quantitative ablation. The DIRECTION is well-argued and consistent
  with the model-collapse proofs; the precise rate and the sufficiency of "periodic reset" are not
  quantified. Treat as a well-argued theoretical claim, not a measured law.
- The intelligence-explosion critiques (2507.23181, 2512.04119) are read at abstract/WebFetch level
  only (argumentative/economic papers, no LaTeX fetched). The "zero observed instances of sustained
  RSI" claim is a quote from a critique, not an independent measurement; it is a defensible field
  characterization, not a theorem.
- AlphaEvolve's ~1% LLM-training-time reduction is web-reported (interpretation), not LaTeX-verified
  here; cited as a narrow demonstrated positive, flagged.
- Misevolution's headline rates (45% / 76% / 93%) are the paper's own measurements on specific
  models and benchmarks; not independently reproduced.

## Implications for this repo (mechanically useful vs research contribution)

- **Mechanically useful (guardrails)**: accumulate verifier-labeled transitions, never train on
  un-grounded self-outputs; monitor a quality axis AND a diversity axis when filtering by success
  (cherry-picking hides diversity collapse, 2307.01850); treat self-collected satisfaction proxies
  as inadmissible success signals (refund vignette, 2509.26354); keep the loop open and reset
  scenarios (2602.09877); check coverage and expect a plateau (2412.01951); use the four-pathway
  risk checklist (model, memory, tool, workflow).
- **Research contribution it is NOT**: none of these limits-papers is a method to copy.
  "Self-evolving Minecraft agents toward superintelligence" is exactly the overclaim the evidence
  refuses. The defensible repo position is a bounded, verifier-grounded improvement loop at the
  Physical/Material layers; upper layers advisory-only and never closed.

## Tie to the wave-4 thesis
SUPPORTED but tightly BOUNDED. The two escape routes from collapse (accumulate verifier-labeled
data; external verifier + reset) are the repo's design, independently prescribed by the trilemma
paper. Bounded because self-improvement only sharpens within coverage (no new social intelligence),
and recursive-self-improvement-to-superintelligence is rhetoric the evidence does not support.

## Recommended next questions
1. Cheapest EXTERNAL information source for the SOCIAL layer that keeps a loop in the
   compounding regime (self-collected social feedback is inadmissible).
2. The repo's concrete "periodic reset" schedule that the trilemma paper says a closed loop needs.
3. How to measure the advisory WAM's coverage before a loop, to tell "will sharpen" from "cannot
   help, needs new data" (the sharpening bound).
4. Which collapse axes (quality, diversity) to monitor and what diversity floor halts the loop,
   given MAD's finding that confidence-filtering hides diversity collapse.
