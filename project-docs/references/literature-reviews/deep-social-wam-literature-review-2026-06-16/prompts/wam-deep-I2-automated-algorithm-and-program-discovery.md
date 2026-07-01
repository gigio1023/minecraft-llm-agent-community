# Lane 25 (I2): Automated algorithm and program discovery

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave5.md`. This brief layers scope on top.

## Area
Systems that discover NEW algorithms, programs, or mathematical constructions, often by LLM-guided
or evolutionary search scored by an executable evaluator. Self-improvement that produces new
artifacts (a faster sort, a better optimizer, a new heuristic), not just a tuned policy. Central
question: can search over programs, graded by a correctness/quality evaluator, find genuinely new
and better algorithms?

## Seeds (verify ids before fetching)
- FunSearch (Romera-Paredes et al, Nature 2024): LLM + evolutionary search finds new
  math/combinatorics programs scored by an evaluator. Verify the arXiv/Nature ref.
- AlphaEvolve (DeepMind 2025): evolutionary coding agent for algorithm discovery. Verify id.
- AlphaDev (Mankowitz et al, Nature 2023): faster sorting algorithms via deep RL. AlphaTensor
  (Fawzi et al, Nature 2022): matrix-multiplication algorithms. Verify refs.
- DreamCoder (Ellis et al, 2021, ENPIRE ref 13): wake-sleep library learning, bootstraps a growing
  library of reusable program subroutines (the "named subroutine retention" pattern). Verify id.
- STOP, Self-Taught Optimizer (Zelikman et al, 2310.02304): a program that recursively improves its
  own scaffolding code (bridges to lane 27, cite there).
- DiscoPOP (Lu et al, 2024): LLM-discovered preference-optimization loss. Verify id.
- Verify-then-add: Evolution of Heuristics (EoH), ReEvo, symbolic regression / equation discovery.

## Owned deliverables
- Theme: `notes/by-theme/research-area-automated-algorithm-and-program-discovery.md`.
- by-paper notes (at least FunSearch, AlphaDev or AlphaTensor, DreamCoder, one LLM-evolution method).
- `raw-search-results/lane-25-manifest.jsonl`, `raw-search-results/lane-25-search-log.md`,
  `notes/subagent-briefs/lane-25-automated-algorithm-and-program-discovery.md`.

## Deconflict
- H3 (lane 20) owns reward/skill CODE generation (Eureka). You own discovery of NEW
  algorithms/programs/math (broader, graded by correctness not task-reward). I5 owns agent-workflow
  design. Cite, do not redo.

## WAM tie + thesis
Every success here rests on a cheap, exact evaluator (a math check, a sort correctness+speed test).
Land the tie: the repo's runtime verifier is that evaluator for Minecraft action consequences, so
program-discovery search could in principle propose new advisory-WAM rules or gated skills graded by
verifier-agreement. Land the bound: these methods shine where the evaluator is exact and cheap
(Physical/Material), and there is no analog of a clean correctness oracle for social-layer
"algorithms"; do not overclaim transfer to contested social outcomes.
