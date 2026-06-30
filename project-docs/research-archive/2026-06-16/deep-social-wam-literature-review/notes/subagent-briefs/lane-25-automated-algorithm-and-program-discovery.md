# Lane 25 (I2) brief: automated algorithm and program discovery

Wave 5. Area: systems that discover NEW algorithms/programs/math by search over programs
graded by an executable evaluator. ASCII punctuation only.

## Sources reviewed (23 logged; 10 with by-paper notes)

Deep-read (LaTeX, 7): AlphaEvolve (2506.13131), DreamCoder (2006.08381), DiscoPOP
(2406.08414), EoH (2401.02051), ReEvo (2402.01145), EvoTrace/EvoReplay skeptic (2605.20086),
AlphaResearch (2511.08522). Web/abstract (key): FunSearch (Nature, PMC10794145), AlphaTensor
(Nature 2022), AlphaDev (Nature 2023), LLM-SR (2404.18400), plus AlphaEvolve descendants
(CodeEvolve 2510.14150, "Math exploration at scale" 2511.02864, SATLUTION 2509.07367,
DeepEvolve 2510.06056, MLEvolve 2606.06473, multiagent-discovery 2602.16928), AEL 2311.15249,
CALM 2505.12285, CoEvo 2412.18890, LLM-SRBench 2504.10415, STOP 2310.02304 (owned by lane 27),
FunSearch reimpl 2503.11061.

Owned deliverables written: theme
`notes/by-theme/research-area-automated-algorithm-and-program-discovery.md`; 7 by-paper notes;
`raw-search-results/lane-25-manifest.jsonl` (23 entries, JSONL-valid); this brief;
`raw-search-results/lane-25-search-log.md`.

## Strongest findings (source-backed)

1. **Search graded by a cheap EXACT evaluator discovers genuinely new, better algorithms.**
   AlphaEvolve: rank-48 4x4 complex-matrix multiplication (first improvement on Strassen's
   rank-49 in 56 years for characteristic-0 fields), SOTA-beating on ~20% of >50 math problems,
   and deployed infra wins (Borg +0.7% fleet compute, Gemini kernel +23%, FlashAttention +32%).
   FunSearch: cap set size 512 in dimension 8, capacity bound 2.2180 -> 2.2202, bin-packing
   heuristic beating best-fit. AlphaTensor/AlphaDev: rank-47 GF(2) matmul and LLVM-shipped sort
   routines. Every one rests on a fast machine check.
2. **The exact evaluator is the hard requirement, stated by the sources themselves, and is the
   thesis bound.** FunSearch (Nature): proofs are out of scope "due to unclear scoring signals."
   AlphaEvolve: "the main limitation is that it handles problems for which it is possible to
   devise an automated evaluator." This maps the area's power onto the repo's Physical/Material
   layers (clean runtime verifier) and off the Social layer (no correctness oracle).
3. **Discovered artifacts overfit weak evaluators and headline scores over-report.** DiscoPOP's
   LRML loss is non-convex and collapses (NaN) for beta outside its discovery range, "because
   beta != 0.05 was never seen during discovery." EvoTrace (121 runs, 4 frameworks, 5 LLMs): a
   24-call Bayesian-optimization pass matches/exceeds the evolutionary final-best on 13/15 math
   targets (late evolution is largely retuning), ~30% of added lines are byte-identical
   re-introductions of deleted lines (cycling, growing in 118/121 runs), and 2/4 frameworks
   overfit the public score on >=30% of competitive-programming problems. Genuine discovery and
   reward-gaming use the same channel.

## Weak or uncertain claims (what I could not verify)

- FunSearch/AlphaTensor/AlphaDev numbers are from Nature abstracts + open-access mirrors, not
  LaTeX (no arXiv source). I did not independently re-run any result; all are as-stated.
- AlphaEvolve is a white paper with no released code; its infra results (0.7%, 23%, 32%) are
  unreproducible claim-only from outside Google.
- I did not deep-read the 6 AlphaEvolve descendants or LLM-SR; abstract-level only.
- The repo-side claim that a discovery loop could propose advisory-WAM rules graded by the
  runtime verifier is an ENGINEERING proposal, not a demonstrated result; no source runs
  program discovery on a Minecraft social-material verifier.

## Implications for this repo (mechanically useful vs research contribution)

- **Mechanically useful**: retarget AlphaEvolve's loop (initial program + evolve-blocks +
  `evaluate`->scalar dict + MAP-elites/island DB + evaluation cascade + diff edits) to search
  over advisory-WAM consequence rules or gated `author_mineflayer_action` skills, scored by the
  runtime verifier's agreement on HELD-OUT (state, action, next-state) transitions; use EoH/ReEvo
  reflection as the proposer and EoH's evaluate-on-a-SET rule against overfit; use DreamCoder's
  compression/MDL as the skill-retention rule; use AlphaResearch's dual-reward (exact executor
  scores; learned model only filters proposals) if a learned social-plausibility signal is ever
  added; use EvoTrace's held-out-judging + tuning-gap control before claiming structural discovery.
  Keep AlphaEvolve's "correct by construction" discipline (discovered code only re-ranks/retunes
  within a verifier-constrained space; never fills args or marks progress true).
- **Research-contribution boundary**: program discovery is engineering SUPPORT, not a
  contribution (shared contract). Do not reframe the repo as "AlphaEvolve/FunSearch/DreamCoder
  for Minecraft." The defensible question: can a verifier-grounded discovery loop propose
  advisory rules/skills that verify on held-out Physical/Material transitions better than a tuned
  baseline, and where does it stop being trustworthy as the evaluator weakens toward Social? The
  sources predict it stops exactly where the exact oracle disappears.

## Tie to the wave-4 / wave-5 thesis

SUPPORTED but BOUNDED. Supported: the runtime verifier is precisely the cheap exact evaluator
this entire area depends on, so an ENPIRE-style discovery loop is feasible at the
Physical/Material layers. Bounded: discovered artifacts overfit weak evaluators (DiscoPOP) and
over-report on strong ones unless held-out-judged (EvoTrace), and there is no exact social
oracle, so any social use must keep discovered rules proposed-and-verifier-gated, never
self-scored (the repo's progress-laundering rule).

## Recommended next questions

1. Smallest verifier-derived RICH (per-delta, non-binary) score over a SET of held-out
   Physical/Material transitions that can drive an AlphaEvolve-style rule search.
2. The tuning-gap control (a tuned-baseline rule) that separates genuine new structure from
   retuning, per EvoTrace, for any "discovered" advisory-WAM rule.
3. Confining a learned social-plausibility model to proposal-filtering (AlphaResearch's RM role,
   contamination-safe split) while the runtime verifier stays the only promoter.
4. DreamCoder-style compression-based retention for the skill library, checked so it does not
   promote gamed skills.
