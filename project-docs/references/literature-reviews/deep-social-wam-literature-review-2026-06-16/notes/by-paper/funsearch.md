# FunSearch: Mathematical discoveries from program search with large language models

- **title**: Mathematical discoveries from program search with large language models
- **authors**: Bernardino Romera-Paredes, Mohammadamin Barekatain, Alexander Novikov, Matej Balog, M. Pawan Kumar, Emilien Dupont, Francisco J. R. Ruiz, Jordan S. Ellenberg, Pengming Wang, Omar Fawzi, Pushmeet Kohli, Alhussein Fawzi (Google DeepMind)
- **year**: 2024 (Nature 625, 468-475; published online 2023-12-14)
- **venue/source**: Nature. NO arXiv preprint (DeepMind published directly to Nature). Verified via Nature DOI 10.1038/s41586-023-06924-6 and the open-access PMC mirror PMC10794145.
- **arxiv_id**: none (Nature-only)
- **urls**: https://www.nature.com/articles/s41586-023-06924-6 ; open access https://pmc.ncbi.nlm.nih.gov/articles/PMC10794145/ ; code https://github.com/google-deepmind/funsearch ; a practical re-implementation for working mathematicians is arXiv 2503.11061 (Ellenberg et al, "Generative Modeling for Mathematical Discovery", LaTeX-fetchable, abstract-level here)
- **source availability**: abstract+full-text via PMC (web-read, not LaTeX); secondary arXiv 2503.11061 manifest-only

## Primary-source facts (Nature/PMC-verified)

- **Method**: pair a pretrained LLM (Codey, a PaLM2 code model; no fine-tuning) with an automated EVALUATOR inside an islands-based evolutionary loop. FunSearch evolves only "the critical part that governs the logic" inside a human-provided program skeleton, e.g. a `priority` function for a greedy algorithm. Best-shot prompting: build the prompt from k=2 programs sampled from the database, sorted by score (v0 lowest, v1 next), and ask the LLM for an improved `v2`. New programs are scored by executing them and registered into one of several islands (diversity preservation).
- **What is evolved, and why a program not the object**: FunSearch searches PROGRAM space, not solution space, for four stated reasons: interpretability (researchers inspect the code and spot structure such as symmetries), generalization (a heuristic found on small instances generalizes to larger ones), conciseness (the A(24,17) admissible set has 237,984 vectors but the generating program is a few lines), and deployability (programs are easier to deploy than neural nets).
- **Flagship result 1, cap set problem (extremal combinatorics)**: found a cap set of size 512 in dimension n=8, beating the previous best-known construction. Via admissible sets I(12,7) and I(15,10), improved the lower bound on the cap set capacity from 2.2180 to 2.2202 (described as the largest improvement in ~20 years).
- **Flagship result 2, online bin packing**: discovered a heuristic that beats classical first-fit and best-fit on OR-Library and Weibull instances. Reported gaps to optimal: OR1 5.30% (FunSearch) vs 5.81% (best-fit); Weibull 100k 0.03% vs 3.79%. The discovered rule: assign an item to a least-capacity (tight) bin only if the fit is very tight, otherwise leave more space.
- **Critical requirement (stated explicitly)**: the problem must admit an efficient `evaluate` function measuring candidate quality. FunSearch works best with (1) an efficient evaluator, (2) rich (non-binary) scoring feedback, (3) a skeleton isolating the part to evolve.
- **Stated limitation**: generating proofs is out of scope because the scoring signal is unclear. (PMC) The method finds witnesses/counterexamples, not proofs.

## Interpretation (flagged as inference)

- FunSearch is the founding instance of "LLM proposes a program; a cheap exact evaluator selects it" and the direct ancestor of AlphaEvolve ([[2506.13131-alphaevolve]]), EoH/ReEvo (see theme), and DiscoPOP ([[2406.08414-discopop]]). Its design choices are the lane's template: evolve an interpretable program that constructs/scores the object, gated by a fast evaluator.
- The "program over object" rationale (interpretable, generalizing, concise) is exactly why this repo's advisory-WAM rules and gated skills should be code/typed-rules a verifier can score, not opaque learned scalars: a discovered rule a human can read is a feature, not a limitation.
- The hard prerequisite (efficient, rich, non-binary evaluator) is the lane's bound restated at its origin: FunSearch's two wins are a math correctness oracle and a bin-packing cost function, both exact and cheap. There is no FunSearch result on a contested objective.

## Mechanically useful vs research contribution

- **Mechanically useful**: the skeleton-plus-evolved-priority-function pattern (the runtime owns the skeleton; the LLM evolves only the bounded logic); best-shot prompting from k sampled scored programs; islands for diversity; the explicit "rich non-binary score" requirement (this repo's verifier should emit graded per-delta agreement, not a single pass/fail, to drive search).
- **Not a contribution to copy**: the cap-set and bin-packing results are the research contribution. The repo borrows the loop and the program-over-object discipline.
- **Bound**: both wins need an exact, cheap, rich evaluator. This is the Physical/Material layer here; FunSearch offers no evidence of transfer to a contested social objective.

## WAM layer(s) informed

Method-level; Physical/Material (rule/heuristic discovery against an exact runtime verifier). Establishes the "interpretable program, fast evaluator, rich score" prerequisites the social layer cannot yet meet.
