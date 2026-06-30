# Lane 35 brief: scenario and environment generation, and evaluation freshness

Wave 6, lane 35. ASCII punctuation only. Owned theme file:
notes/by-theme/research-area-scenario-generation-and-eval-freshness.md.

## Mandate

Fill the directions report's two coupled gaps: GENERATE comparable, resettable scenarios for a
self-improvement loop, and keep HELD-OUT SOCIAL scenarios FRESH so the loop cannot overfit. New angles
beyond lane 21 (open-ended curriculum) and lane 24 (contamination): procedural content / environment
generation (PCG, PCG-RL, procedural 3D scenes, LLM scene synthesis); UED in depth (regret-based
generation); LLM-driven SOCIAL scenario synthesis with controllable difficulty; contamination-free /
freshness-preserving evaluation (time-gating, decontamination, holdout rotation) for agentic/social
settings; and what a clean Physical/Material scenario reset means concretely.

## Sources reviewed (count + list)

8 LaTeX deep-reads + 4 verified abstract-level + 3 claim-only (HF-unverifiable seeds).

Deep-read (LaTeX, environment-verified or self-reported as marked in each by-paper note):
1. 2012.02096 PAIRED (UED, regret) - by me, full LaTeX.
2. 2001.09212 PCGRL (PCG via RL, solver-as-gate) - by me, full LaTeX.
3. 2206.06994 ProcTHOR (procedural 3D houses, BFS-reachability gate) - sub-agent, full LaTeX.
4. 2312.09067 Holodeck (LLM + constraint-solver scene gen) - sub-agent, full LaTeX.
5. 2310.13032 QDAIF (MAP-Elites + LM-judged diversity) - sub-agent, full LaTeX.
6. 2403.07974 LiveCodeBench (time-gating freshness) - sub-agent, full LaTeX.
7. 2403.08715 SOTOPIA-pi (LLM social-task synthesis) - sub-agent, full LaTeX.
8. 2311.04850 Rephrased Samples / LLM decontaminator - sub-agent, full LaTeX.

Verified, abstract-level (logged in manifest, not deep-read):
- 2406.04268 Open-Endedness is Essential for ASI (novelty + learnability definition).
- 2412.13670 AntiLeak-Bench (auto-construct fresh benchmark from post-cutoff facts).
- 2604.23781 ClawMark (living-world multi-day coworker-agent benchmark).
- 2603.02586 LiveAgentBench (agentic systems across real-world challenges).

Claim-only (HF returns not-found; recorded, NOT counted as verified, NOT in manifest as verified):
- 2010.03934 PLR (Prioritized Level Replay).
- 2110.02439 robust / replay-guided PLR (seed brief id, failed HF verification).
- 2203.01302 ACCEL (evolving curricula, seed brief id, failed HF verification).

## Strongest findings (source-backed)

1. **A deterministic validity gate that resamples on failure is the proven, cheap pattern for
   comparable seeded scenarios, but only the PHYSICAL layer has one.** ProcTHOR (2206.06994) generates
   from a seed-spec tree, serializes to JSON, runs a BFS-reachability validator (every room needs >=5
   reachable cells), and resamples under the same spec on failure ("All houses are fully navigable"),
   producing 10K verified scenes "in 1 hour on a local workstation with 4 NVIDIA RTX A5000 GPUs."
   PCGRL (2001.09212) gates with a deterministic Sokoban BFS/A* solver (solvable in >=18 steps;
   solvability 86.7/88.3/67.5% for narrow/turtle/wide). Holodeck (2312.09067) generalizes the gate to
   typed HARD CONSTRAINTS (collision-free, in-bounds) and shows LLM-emitted absolute coordinates are
   no better than random (MRR 0.364 vs 0.369). All three gates are physical/relational; none labels
   social/institutional admissibility.

2. **Time-gating plus deterministic grading is the cheapest freshness defense and is the exact shape
   the repo's verifier already has.** LiveCodeBench (2403.07974) scores a model only on problems
   released after its training cutoff and detects contamination by the before-vs-after-cutoff drop
   (DS-Base-33B "from Pass@1 ~60 in May problems to Pass@1 ~0 in September"). Its grading is
   deterministic execution (hidden tests, `assert f(input)==output`). The catch it names: the eligible
   set shrinks after cutoff (349 usable problems), and a private hold-out is the fallback. The repo can
   timestamp scenarios and transitions and gate by authoring date with near-zero translation cost.

3. **Every SOCIAL scenario generator gates with an LLM judge its own authors debunk, which is the
   measured place a social loop games itself.** SOTOPIA-pi (2403.08715) cheaply synthesizes social
   tasks (100/round, 462 upfront) but its GPT-4 judge "significantly overestimates" trained models
   (GPT-4-rated 5.71 vs human-rated 4.29 for the same model), and self-reinforcement ALONE kept a
   harmful-goal injury rate at 100% and raised toxicity. QDAIF (2310.13032) explicitly suspects reward
   hacking of its LM evaluator (quality-correlation collapses in 0.995 to 1). The repo's improvement is
   to keep the generator advisory and the success label on the deterministic verifier.

## Weak / uncertain claims

- The regret-based UED replay line (PLR 2010.03934/2110.02439, ACCEL 2203.01302) is CLAIM-ONLY here
  because HF does not index it; the mechanism is verified only via PAIRED. Do not cite PLR/ACCEL
  numbers as verified.
- PAIRED's own caveat: regret is noisy and "training agents on the environment reward itself ...
  appears to be more effective," and the success theorem needs separated SUCCESS/FAILURE reward bands
  that the social layer lacks. So regret as a social-scenario difficulty signal is uncertain.
- AntiLeak-Bench, ClawMark, LiveAgentBench, Open-Endedness-is-Essential are abstract-level; their
  internal numbers are not verified by me.
- Holodeck and QDAIF scene/text quality rest partly on human preference, not deterministic correctness
  (self-reported); only ProcTHOR/PCGRL/LiveCodeBench are environment-verified on their core claim.

## Implications for this repo (mechanical vs contribution)

- **Mechanical (engineering the repo can borrow)**:
  - A comparable, resettable Physical/Material scenario = seed-spec + fixed RNG + replayable artifact
    (ProcTHOR JSON) + bounded edits from the seed (PCGRL change-percentage) + a per-layer deterministic
    admissibility gate with reject-and-resample (ProcTHOR pattern), where the gate is the runtime
    verifier and generation only proposes the setup.
  - A LEDGER RESET (Material-Economic state restored to a declared starting value) is the social-layer
    analog of teleporting the agent to a known pose; the repo owns the typed ledger, the missing piece
    is deterministic restore-and-replay.
  - Freshness = timestamp every scenario/transition, time-gate evaluation by authoring date
    (LiveCodeBench), keep a private hold-out, refill via SOTOPIA-pi-style LLM synthesis but label with
    the verifier, and run an admission-time paraphrase decontamination check (2311.04850).
  - Express social/institutional preconditions as HARD CONSTRAINTS (Holodeck pattern), not LLM-emitted
    values; the no-absolute-coordinates lesson reinforces the repo's no-coordinates-from-the-LLM rule.
- **NOT a contribution this repo should claim**: importing PCGRL/ProcTHOR/Holodeck/PAIRED/QDAIF/
  SOTOPIA-pi is method transfer / support infrastructure per the contract. The defensible, honest
  research surface is exactly the gap: a DETERMINISTIC validity gate for social/institutional scenario
  generation, and a clean RESET of a social/obligation state, neither of which the literature provides.

## Recommended next questions

1. What is the typed schema of a "comparable Physical/Material scenario seed" in this repo (seeded
   world hash + scripted preconditions + ledger starting state), and what deterministic restore-and-
   replay makes two runs byte-comparable at the Material layer?
2. What per-layer admissibility predicates can the runtime verifier check at GENERATION time (Physical
   reachability; Material transfer-feasibility; Social well-formed-obligation) so reject-and-resample
   works above the physical layer?
3. What is the cheapest authoring + time-gating workflow for held-out social scenarios, given they do
   not refill for free, and what before-vs-snapshot score gap counts as overfitting?
4. If social scenarios are LLM-synthesized (SOTOPIA-pi recipe), what admission-time decontamination
   check (2311.04850 shape) and what verifier-grounded (not LLM-judged) success label keep the loop
   from gaming itself the way QDAIF and SOTOPIA-pi's judges do?

## One-line tie to the thesis

A self-improvement loop can be fed comparable seeded scenarios (ProcTHOR seed-spec + PCGRL bounded-edit
+ reject-and-resample against the runtime verifier) and kept honest by time-gated, deterministically-
verified held-out scenarios (LiveCodeBench), but the deterministic social validity gate and the social
reset are the repo's to build, and any LLM-judged scenario score is the documented place the loop games
itself.
