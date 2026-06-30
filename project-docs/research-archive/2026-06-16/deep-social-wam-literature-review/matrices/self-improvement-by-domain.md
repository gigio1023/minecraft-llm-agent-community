# Matrix: self-improvement by domain

Wave-5. One row per domain of machine self-improvement studied in this review. Columns: what the loop
improves, what signal scores it, whether the literature shows it compounds / only sharpens / collapses,
the key bound, and the relevance to this repo. ASCII only. Numbers are as-stated by sources.

## A. By domain

| Domain (lane) | What is improved | Success signal | Compounds, sharpens, or collapses | Key bound | Repo relevance |
|---|---|---|---|---|---|
| Physical autoresearch: ENPIRE (anchor) | robot policy + training code | environment reset+verify (agent may study failures, cannot train on or alter the metric) | compounds to ~99% on dexterous tasks | crisp resettable near-binary metric; one-time verifier construction | the loop and the verifier-as-truth separation; bounded above Material |
| Coding-agent autoresearch (24) | ML/SWE code, scaffolds, training recipes | external grader (Kaggle, hidden tests, env score) | compounds vs a clean grader; degrades/games when self-graded or unchecked | external is necessary not sufficient: weak verifier (+6.4pt inflation), contamination, self-iteration erosion (77%) | external-grader discipline; differential/invariance verifier hardening; freshness against contamination |
| Algorithm / program discovery (25) | new algorithms, programs, math | a cheap exact evaluator (correctness, speed) | compounds where the evaluator is exact (FunSearch, AlphaDev) | overfits a weak evaluator (DiscoPOP NaN); no social oracle | the runtime verifier is that exact evaluator at Physical/Material; propose-and-gate, never self-score |
| AutoML / NAS / learned optimizers (26) | architecture, pipeline, hyperparameters, optimizer | a validation metric | compounds but EXPENSIVE and search-space-sensitive | NAS ~1000x cost fall over years; AutoML-Zero 1-in-10^12 sparse; VeLO trained-distribution-bound | the near-$0 verifier is the cheap performance-estimation the field always lacked; the repo will not spend a big AutoML search |
| Meta-learning / recursive self-improvement (27) | the learning algorithm / the system's own code | (theory) a provable benefit check; (practice) task performance | only 1-2 demonstrated levels; no unbounded recursion shown | the only optimality proof (Goedel machine) is unrealized; runnable instances drop the guarantee | AI-GAs pillar-3 scenario generation + a thin pillar-2 recipe slice, gated by the verifier (Schaul's feedback condition) |
| Automated agent / prompt design (28) | the agent's prompts, workflow, architecture | task metric (must be a held-out verifier) | compounds and transfers (ADAS) when scored honestly | optimization only as honest as the score: OPRO train 5-20% over test; PromptBreeder wins with a meaningless prompt | most transferable: DSPy "metric + cross-validation" with the runtime verifier as the metric, held-out, Physical/Material |
| Limits of self-improvement (29) | (the meta-question) | n/a | un-grounded loops COLLAPSE; grounded loops only SHARPEN within coverage | model collapse (DPI), reward-hacking, safety mutual-info loss; escape = accumulate fresh verified data + verifier + reset | the two escape routes are the repo's design; expect calibration, not new social capability |

## B. The decision rule the matrix implies

1. A self-improvement loop is admissible only with a cheap, accurate, external, hard-to-game signal on
   fresh data. The repo has exactly that at Physical/Material (the runtime verifier).
2. Score on a held-out set with the verifier, never an LLM judge or training accuracy, and track the
   train/held-out gap (overfitting is measured across the field).
3. Accumulate verifier-labeled transitions (passes AND failures); never train on un-verified self-output
   (collapse).
4. Expect sharpening within the base model's coverage, not new capability; stop and require new external
   data when coverage is exhausted.
5. Keep every change advisory and verifier-gated; isolate the verifier's checking logic from the
   improved agent. Confine the loop below the layer where the verifier stops returning a clean score.

## C. Cross-reference

- Wave-4 loop-to-repo mapping: `matrices/autoresearch-loop-mapping.md`.
- Wave-5 capstone: `reports/self-improvement-across-domains.md`.
- Wave-4 capstone: `reports/autoresearch-for-wam.md`.
