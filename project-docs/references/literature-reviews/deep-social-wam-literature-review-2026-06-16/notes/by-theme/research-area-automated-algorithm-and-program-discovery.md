# Research area: automated algorithm and program discovery

Lane 25 (I2) theme file, wave 5. Audience: a newcomer to this sub-field. Jargon is
defined on first use. ASCII punctuation only (no em-dash, middle-dot, or bullet-char).

This file surveys systems that discover NEW algorithms, programs, or mathematical
constructions, usually by search over programs graded by an executable evaluator. The
distinguishing feature versus the neighbor lanes is the OUTPUT: a new artifact (a faster
sort, a better matrix-multiplication scheme, a new heuristic, a new loss function, a new
math construction), not just a tuned policy or a written paper. The central question:

**Can search over programs, graded by a correctness/quality evaluator, find genuinely new
and better algorithms, and what does that require?**

The short answer this literature gives: yes, demonstrably, but ONLY where the evaluator is
cheap and (nearly) exact. Every headline result in this area rests on a fast machine check.
Where the check is exact (math correctness, sort correctness, tensor reconstruction,
combinatorial cost) the method discovers genuinely new artifacts that beat decades of human
work and ship in production. Where the check is noisy or learned (a finetune-then-judge
score, an LLM critic) the discovered artifact overfits its evaluator and its discovery
conditions. There is no clean correctness oracle for "good social conduct," so this area's
power transfers to the repo's Physical/Material layers and stops at the Social layer.

Anchors:
- Original query: "Can a hierarchical action-conditioned world model predict and evaluate
  how Minecraft actions transform physical state, material economy, social relations,
  memory, and future action opportunities in an embodied open world?"
- Wave-4 thesis under test (the anchor [[enpire]]): an ENPIRE-style loop, grounded by the
  runtime VERIFIER as the success signal, can autonomously improve this repo's advisory
  social-material WAM and/or actor policy at near-zero cost with no human labels, IF it
  stays advisory (the LLM proposes; the runtime owns truth) and the agent never scores its
  own success (progress laundering). This lane's verdict: SUPPORTED for the Physical/Material
  layers, where program-discovery's exact-evaluator requirement is met by the runtime
  verifier; BOUNDED at the Social layer, where there is no exact oracle and discovered
  artifacts demonstrably overfit weak evaluators.

Deconfliction (this lane EXTENDS, does not re-survey): H1 / lane 18
[[research-area-agentic-self-improvement-loops]] owns the loop itself; H3 / lane 20
[[research-area-llm-reward-and-code-generation]] owns reward/skill CODE generation
(Eureka-style), graded by task REWARD; this lane owns discovery of NEW
algorithms/programs/math graded by CORRECTNESS/QUALITY. H4
[[research-area-open-ended-curriculum-and-task-generation]] owns task generation. STOP
(2310.02304, recursively self-improving scaffolding code) is cited here but owned by lane 27
(agentic-system/prompt/workflow design). AI-Scientist paper-writing is lane 19
[[research-area-ai-scientist-automated-discovery]]. Cite, do not redo.

---

## 1. Glossary (defined once)

- **Algorithm/program discovery**: finding a new program (sort, heuristic, construction,
  loss) that scores better on an evaluator than prior art, by search over program space.
- **Evaluator / fitness function / oracle**: the program that scores a candidate. EXACT
  oracle = deterministic, unambiguous, cheap (a math check, a sort-correctness test, a
  combinatorial cost). LEARNED/NOISY evaluator = a finetune-then-judge score or an LLM
  critic; biased and expensive.
- **LLM-guided evolution / evolutionary coding agent**: an evolutionary loop where the
  mutation/crossover operators are LLM calls (the LLM proposes a code edit) instead of
  hand-written operators. A population/archive of programs, an evaluator, and a sampler that
  feeds scored programs back into prompts.
- **Superoptimization**: iteratively improving a program against execution feedback to make
  it faster/shorter while preserving correctness.
- **Correct by construction**: the discovered code can only change things that cannot break
  correctness (e.g. re-rank already-valid options, retile a kernel without changing its
  math); an external check still confirms correctness.
- **Library learning / named-subroutine retention**: a loop that distills reusable, named,
  inspectable subroutines from solved tasks into a growing library (DreamCoder).
- **Cycling (failure mode)**: a run re-adds code it earlier deleted (byte-identical),
  wasting search budget (EvoTrace, 2605.20086).
- **Tuning gap**: how much of an evolutionary run's headline gain is recoverable by just
  tuning the hyperparameters of one intermediate program (a control for "is this real
  structural discovery?", EvoTrace).

---

## 2. The lineage, from RL oracles to LLM evolution (source-backed)

The area has two generations, both built on an exact evaluator.

Generation 1, bespoke RL with an exact checker ([[alphatensor-alphadev]]):
- AlphaTensor (Nature 2022) cast matrix multiplication as a tensor-decomposition game and
  trained AlphaZero-style RL to find a rank-47 scheme for 4x4 matrices over GF(2), beating
  Strassen's rank-49. Correctness is a cheap tensor-reconstruction check.
- AlphaDev (Nature 2023) cast sorting as an assembly-instruction game; found fixed-size sort
  routines shorter than the human benchmark (VarSort4: 29 instructions shorter; 2-70%
  speedups) that were upstreamed into LLVM libc++. Correctness is a test harness.
- Lesson: search graded by an exact correctness checker discovers faster, provably-correct
  algorithms that beat decades-old human work. (These are Nature-only; no arXiv source.)

Generation 2, LLM-guided evolution (the wave-5 center):
- FunSearch (Nature 2024, [[funsearch]]) replaced the bespoke RL agent with a pretrained LLM
  proposer in an islands-based evolutionary loop, evolving a single Python function (e.g. a
  greedy `priority` function) scored by a fast evaluator. Found a cap set of size 512 in
  dimension 8 and improved the cap-set capacity lower bound from 2.2180 to 2.2202; found a
  bin-packing heuristic beating best-fit (OR1 5.30% vs 5.81%; Weibull 100k 0.03% vs 3.79%).
  It evolves a PROGRAM not the object, for interpretability, generalization, and conciseness.
- AlphaEvolve (2025, [[2506.13131-alphaevolve]]) scaled FunSearch to whole multi-file
  codebases, any language, frontier LLMs, multi-objective, with MAP-elites + island database
  and an evaluation cascade. Found a rank-48 4x4 complex-matrix scheme (first improvement on
  Strassen for characteristic-0 fields in 56 years), matched/beat SOTA on ~75%/~20% of >50
  math problems, and deployed infra wins (Borg scheduling +0.7% fleet compute; Gemini kernel
  +23%; FlashAttention +32%).
- EoH (2401.02051) and ReEvo (2402.01145) ([[2401.02051-eoh-and-2402.01145-reevo]]) added a
  natural-language reasoning channel: EoH evolves a "thought" plus code with 5 prompt
  strategies; ReEvo uses a generator + reflector LLM with short-term and long-term
  reflections as "verbal gradients." Both beat prior automatic-heuristic-design (EoH beats
  FunSearch on bin packing at a lower query budget).
- DiscoPOP (2406.08414, [[2406.08414-discopop]]) extended discovery to a machine-learning
  artifact, an LLM-discovered preference-optimization LOSS function, with a finetune-then-judge
  evaluator.
- AlphaResearch (2026, [[2511.08522-alpharesearch]]) extended to OPEN-ENDED problems with a
  dual reward (exact executor + a learned peer-review filter), beating AlphaEvolve on circle
  packing.

DreamCoder (2020, [[2006.08381-dreamcoder]]) is the orthogonal LIBRARY-LEARNING ancestor:
wake-sleep program induction that grows a DSL of reusable subroutines by compressing out
reused patterns (MDL objective), rediscovering map, vector algebra, Newton/Coulomb laws.

---

## 3. The one invariant: every success needs a cheap exact evaluator

This is the single most important fact in the area, stated by the primary sources themselves:

- FunSearch (Nature): the problem must admit "an efficient evaluate function," with rich
  (non-binary) feedback; proofs are out of scope "due to unclear scoring signals."
- AlphaEvolve (2506.13131): "the main limitation is that it handles problems for which it is
  possible to devise an automated evaluator" (math, CS, systems), not natural-science domains
  needing physical experiment.
- AlphaTensor/AlphaDev: tensor reconstruction and sort correctness are cheap exact checks.
- EoH/ReEvo: an exact combinatorial cost on a set of instances.

Table: the evaluator, by source.

| System | What it discovers | Evaluator | Exact? | Cheap? |
|---|---|---|---|---|
| AlphaTensor | matmul tensor decompositions | tensor reconstruction | yes | yes |
| AlphaDev | sort/hash assembly routines | test harness (correctness+latency) | yes | yes |
| FunSearch | math constructions, heuristics | problem-specific `evaluate` | yes | yes (<=20min/CPU) |
| AlphaEvolve | code, kernels, math, circuits | user `evaluate` -> scalar dict | yes (mostly) | seconds to ~100 CPU-h |
| EoH / ReEvo | combinatorial heuristics | cost over instance SET | yes | yes |
| DreamCoder | reusable subroutines (DSL) | per-task I/O correctness + MDL | yes | moderate |
| DiscoPOP | preference-optimization loss | finetune-then-LLM-judge | NO (noisy/learned) | NO (expensive) |
| AlphaResearch | open-ended algorithms | exact executor + learned idea filter | score yes; filter no | mixed |

The two rows where the evaluator is NOT a cheap exact oracle (DiscoPOP, AlphaResearch's
filter) are exactly the rows that introduce learned/noisy signals, and exactly the rows that
show the failure modes in section 4. That is the lane's whole argument in one table.

---

## 4. What goes wrong (the bounds, source-backed)

These are the reasons "a discovery loop found a new algorithm" must be read critically, and
the reasons the thesis is BOUNDED.

1. **Discovered artifacts overfit their discovery conditions.** DiscoPOP's LRML loss
   ([[2406.08414-discopop]]) has a non-convex region and FAILS to converge for beta outside
   the range it was discovered at (beta <= 0.01 or >= 2.5), "likely because beta != 0.05 was
   never seen during the discovery process" (model collapses to NaN). A discovered artifact
   inherits the distribution of its evaluator/conditions and can silently fail off-distribution.
2. **Headline scores conflate discovery with tuning, recombination, and overfitting.** EvoTrace
   ([[2605.20086-what-evolutionary-coding-agents-evolve]]) shows: a 24-call Bayesian-optimization
   pass on a single intermediate program matches or exceeds the evolutionary run's final-best on
   13 of 15 math targets (so "late evolution" is largely just hyperparameter tuning); ~30% of
   added lines are byte-identical re-introductions of deleted lines (cycling), growing over the
   run in 118 of 121 cases; 2 of 4 frameworks overfit the public score on >=30% of competitive-
   programming problems (one gained +1,606 private rating while another lost 1,610 on the same
   problem despite positive public scores); and same-prompt replay recovers a median 0.76 of a
   breakthrough's score from a DIFFERENT program (exact-match 0.00), so a "discovery" is a draw
   from a distribution, not a crisp artifact.
3. **Genuine discovery and reward-gaming use the SAME channel.** AlphaEvolve and FunSearch
   discover real new math BECAUSE search exploits whatever the evaluator rewards; an
   under-specified evaluator is then exploited the same way. (This lane's siblings show the
   gaming directly: Auto MC-Reward's lava-avoidance gaming and DGM node 114 deleting its
   detector, in [[research-area-llm-reward-and-code-generation]] and
   [[research-area-agentic-self-improvement-loops]].)

Net: the methods are real discovery engines where the evaluator is exact and cheap, and
over-report (or break off-distribution) as the evaluator weakens. The social layer is the
weakest-evaluator regime, so it is where over-reporting and gaming would be worst.

---

## 5. The WAM tie (the lane's job to land)

The repo's runtime verifier IS the cheap exact evaluator this entire area requires. The repo
already emits verifier-scored (state, action, next-state) transitions at the Physical/Material
layers (item mined, container changed, durability spent, possession transferred). So a
program-discovery search could, in principle, propose new ADVISORY-WAM rules (consequence
predictors) or new gated SKILLS (`author_mineflayer_action` candidates), graded by their
agreement with the verifier on held-out transitions. This is the same loop AlphaEvolve runs,
with the runtime verifier playing the role of `evaluate`.

Mapping the area's tools onto the repo (mechanically useful, engineering only):

| Borrow | Source | Repo use |
|---|---|---|
| evolve a PROGRAM/typed rule, not an opaque scalar | FunSearch, AlphaEvolve | advisory-WAM rules and skills stay human-inspectable code/typed rules a verifier can score |
| `evaluate` -> scalar dict; multi-metric; cascade | AlphaEvolve | the verifier emits graded per-delta agreement (rich, non-binary), cheap checks first |
| correct-by-construction | AlphaEvolve (Borg, kernels) | a discovered rule may only re-rank/retune within a space the verifier already constrains; never fills args or marks progress true |
| reflection-augmented proposer (thought + code; short/long-term reflection) | EoH, ReEvo | compare two candidate rules on the same transitions, verbalize why one verified better, accumulate persistent "what makes a rule verify" hints |
| evaluate on a SET of scenarios, not one | EoH | a discovered rule must verify across a scenario set, not one episode (directly counters the overfitting bound) |
| library growth by compression/MDL | DreamCoder | promote an `author_mineflayer_action` skill when it compresses/explains many verified action sequences |
| dual reward: exact executor scores, learned model only filters proposals | AlphaResearch | IF a learned social-plausibility model is ever added, it may only prioritize which rules to PROPOSE; the verifier on held-out transitions remains the only promoter |
| held-out judging + tuning-gap control | EvoTrace | score discovered rules on held-out transitions; report (score, tuning ceiling) before claiming structural discovery |

The bound the lane lands: these methods shine where the evaluator is exact and cheap, i.e. the
Physical and Material layers. There is no analog of a clean correctness oracle for social-layer
"algorithms" (request/promise/trust/cooperation outcomes are contested), and the sources show
discovered artifacts overfit weak evaluators (DiscoPOP) and over-report on strong ones
(EvoTrace). So: program-discovery can propose advisory-WAM rules and gated skills at the
Physical/Material layers, scored by verifier-agreement on held-out transitions; it must NOT be
claimed to transfer to contested social outcomes, and any learned social signal must stay an
advisory proposal-filter (AlphaResearch pattern), never the success metric (the repo's
progress-laundering rule).

---

## 6. Mechanically useful vs research contribution (for this repo)

- **Mechanically useful (engineering this repo can borrow)**: the full row-set in section 5,
  the headline being: retarget AlphaEvolve's loop (initial program with marked evolve-blocks +
  an `evaluate` returning a scalar dict + MAP-elites/island database + evaluation cascade +
  diff edits) to "search over advisory-WAM consequence rules or gated skills, scored by the
  runtime verifier's agreement on held-out (state, action, next-state) transitions," with
  EoH/ReEvo's reflection as the proposer, DreamCoder's compression as the skill-retention rule,
  AlphaResearch's dual-reward as the guard if a learned signal is added, and EvoTrace's held-out
  judging + tuning-gap as the over-reporting control.
- **Not a research contribution this repo should claim**: "AlphaEvolve/FunSearch/DreamCoder for
  Minecraft" is a method import, not a contribution (shared contract). Building the verifier,
  transcript store, or discovery loop is support infrastructure, not the contribution. The
  defensible research question this area sharpens: can a verifier-grounded program-discovery
  loop propose advisory-WAM rules or gated skills that verify on HELD-OUT Physical/Material
  transitions better than a tuned baseline, and exactly where does it stop being trustworthy as
  the evaluator weakens toward the Social layer? The sources predict it stops being trustworthy
  precisely where the exact oracle disappears.

## 7. One-line ties

- To the original query: program discovery is a way to BUILD/REFINE the predictive rules the
  hierarchical WAM needs, but only the Physical/Material layers have the exact evaluator these
  methods require.
- To the autoresearch thesis: SUPPORTED but BOUNDED. Supported, the runtime verifier is the
  cheap exact evaluator the whole area depends on, so a discovery loop is feasible at the
  Physical/Material layers. Bounded, discovered artifacts overfit weak evaluators (DiscoPOP) and
  over-report on strong ones unless held-out-judged (EvoTrace), and there is no exact social
  oracle, so any social use must keep discovered rules proposed-and-verifier-gated, never
  self-scored.

## 8. Recommended next questions

1. What is the smallest verifier-derived, RICH (non-binary, per-delta) score over a SET of
   held-out Physical/Material transitions that is informative enough to drive an AlphaEvolve-style
   search for advisory-WAM rules?
2. For any discovered advisory-WAM rule, what is the tuning-gap control (a tuned-baseline rule)
   that distinguishes genuine new structure from retuning (EvoTrace's discipline)?
3. If a learned social-plausibility model is introduced, can it be confined to proposal-filtering
   (AlphaResearch's RM role) with a contamination-safe train/test split, while the runtime
   verifier remains the only promoter?
4. What is the analog of DreamCoder's compression-based retention for the repo's skill library
   (promote the skill that most compresses verified action sequences), and does it avoid
   promoting gamed skills?
