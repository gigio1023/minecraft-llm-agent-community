# Lane 3 Brief: LLM Social Simulation and Social Benchmarks

Lane: 3 (LLM Social Simulation and Social Benchmarks). Date: 2026-06-16.
Scope: how LLM social behavior is defined, evaluated, and where validity claims
are weak; translate each metric into a verified Minecraft social-material
transition. All claims source-backed; "plausible dialogue" separated from
"verified world consequence" throughout.

## Sources reviewed (count + ids)

27 sources in `raw-search-results/lane-3-manifest.jsonl`.

- LaTeX-read in depth (11): SOTOPIA 2310.11667, Generative Agents 2304.03442,
  Concordia 2312.03664, SimBench 2510.17516, Don't Trust Generative Agents
  2506.21974, Belief-Behavior Consistency 2507.02197, GLEE 2410.05254, Social
  World Models/S3AP 2509.00559, AgentSense 2410.19346, Lifelong SOTOPIA 2506.12666,
  PersonaGym 2407.18416.
- PDF/abstract deep (1): Generative Agent Simulations of 1,000 People 2411.10109
  (e-print source was a PDF).
- Abstract-level breadth (15): SOTOPIA-pi 2403.08715, AgentSociety 2502.08691,
  SocioVerse 2504.10157, From Individual to Society survey 2412.03563, Concordia
  Contest 2512.03318, MAgIC 2311.08562, MultiAgentBench 2503.01935, PARTNR
  2411.00081, CoELA 2307.02485, Hypothetical Minds (Melting Pot) 2407.07086, Can
  LLMs Simulate Human Trust 2402.04559, PsyMem 2505.12814, SALM 2505.09081, PEBA
  2509.16457. (AgentSociety/SocioVerse/MAgIC/MultiAgentBench/PARTNR also covered
  at abstract level in the repo's existing reference sweeps; Lane 3
  cross-references rather than re-fetching.)

By-paper notes written for the 12 deep sources under `notes/by-paper/`.

## Owned deliverables written

- `notes/by-theme/llm-social-simulation.md`: how social state is defined/measured
  across Generative Agents, SOTOPIA family, AgentSense, S3AP, Concordia,
  population simulators, mixed-motive/economic games; the recurring
  partner-dependence finding; what to adapt vs avoid.
- `notes/by-theme/benchmark-validity-and-evaluation.md`: SimBench, Don't Trust,
  belief-behavior, the LLM-judge problem, the Concordia validation hierarchy,
  "more capability ≠ more fidelity," and the repo's reporting contract + overclaim
  boundaries.
- `notes/by-theme/project-sid-critical-review.md`: layers the social-benchmark
  lens onto the repo's existing Sid review: where Sid's signals sit on the
  plausibility-vs-verified axis, Sid failure modes cross-read with the validity
  literature, lift/don't-lift recommendations, and a four-point defensibility
  argument for the repo's narrower frame.
- `matrices/benchmark-metrics-matrix.md`: benchmark × {construct, grounded/dialogue,
  metric form, environment, repro, Minecraft-transition translation, validity caveat}.
- `raw-search-results/lane-3-manifest.jsonl`, `raw-search-results/lane-3-search-log.md`.

## Strongest findings (source-backed)

1. **The structured-state social WAM is real and is the canonical WAM applied to
   social state.** S3AP (2509.00559) formalizes a social world model computing
   `p(A_t^{-i}|S_t)` and `p(S_{t+1}|S_t, A^{-i}, a^i)`, with a "Foresee and Act"
   imagine-then-execute loop = Cascaded WAM. It improves SOTOPIA-hard goal
   completion. This directly validates the repo's structured-state (non-pixel)
   social-WAM direction. Caveat: S3AP's state is an LLM parse of free-form
   narrative scored on a dialogue benchmark, the repo's job is to make S' a
   *verified* Minecraft+social delta.

2. **Plausibility is not validity, and the ceiling is low and capability-saturated.**
   SimBench (2510.17516): best LLM = 40.8/100 on the easiest static task, scales
   with model size but NOT inference compute, with an alignment-simulation tradeoff
   (instruction tuning collapses pluralistic diversity). S3AP: stronger agent ≠
   better world model (GPT-4.1 6.01 vs Llama-4 4.52 as agent, 6.34 vs 6.36 as
   world model). Lifelong SOTOPIA: believability/goal-completion decline over
   chained episodes and the LM judge over-rates at long context. Convergent
   message: more model capability does not buy social fidelity; measure behavior
   as behavior.

3. **Stated disposition does not predict enacted behavior, the say-vs-do gap.**
   Belief-Behavior Consistency (2507.02197, Trust Game): systematic
   belief-behavior inconsistency at both individual and population level; task
   context doesn't fix it; imposed priors undermine it; forecasts degrade over
   horizon. This is the scientific form of Sid's pickaxe failure and exactly the
   repo's chat/action-incoherence rule. The corrective is verification against
   world state, not the utterance, which is the repo's stance.

## Weak / uncertain claims (could not fully verify)

- **Reproducibility of the breadth set.** Repo-availability for AgentSociety,
  SocioVerse, SALM, PsyMem, PEBA, Hypothetical Minds is marked from abstracts/HF
  pages, not from cloning and running; treat repro tags as "claimed," not verified.
- **1000 People** source was a PDF (no LaTeX); its 85%-of-human-test-retest number
  is from the abstract + web confirmation, not a full read.
- **Concordia Contest (2512.03318)** read at abstract level only; its exact metric
  definitions for "cooperative intelligence" were not extracted from full text.
- **GLEE** was confirmed via web + full LaTeX of the metric definitions, but the
  per-model leaderboard numbers were not transcribed (only the qualitative findings
  on partner-dependence and parameter effects).
- The line between Sid's "verified" vs "LM-judged" signals (matrix in the Sid
  theme file) is my interpretation of the report's described method, not a claim
  Sid makes; Sid's raw scoring scripts are not public, so the exact computation of
  several signals cannot be confirmed.

## Implications for this repo

Mechanically useful (engineering to borrow):

- S3AP social-world-model formulation + Foresee-and-Act → shape of an *advisory*
  social-delta predictor (predict deltas before acting), kept strictly advisory.
- Generative Agents retrieval (recency×importance×relevance) + reflection-with-
  citations → evidence-linked actor memory / PlanBead surfacing.
- SOTOPIA-Eval 7 dimensions → the *names* of social outcomes to verify; GLEE
  efficiency/fairness/self-gain formulas → scoring over *verified* exchanges.
- Lifelong SOTOPIA 8-item failure checklist + recall-forcing episode chaining →
  cheap transcript signals + memory-continuity benchmark design.
- Concordia grounded-variables + components + validation hierarchy → possession/
  claim ledger and methodology framing.

Research contribution (what is genuinely novel, not borrowable):

- Moving the entire benchmark-metrics table from the dialogue/LM-judged column into
  the **verified-world-consequence** column for an embodied substrate: every social
  score backed by a Mineflayer-verified material/claim/obligation/memory delta.
- Scoring **prediction accuracy** (advisory social WAM) separately from **acting
  outcome**, with partner/seed always specified.
- This is the gap no surveyed benchmark fills: SOTOPIA/AgentSense/S3AP are
  dialogue-graded; GLEE/MAgIC abstract the world to a number; Melting Pot is a
  gridworld; Concordia/AgentSociety trust a generative or correlational layer.

Boundary the repo must keep (do not become the contribution): the evidence/verifier
infrastructure is support, not the research claim; the social-material transition
being modeled and verified is the claim.

## Recommended next questions

1. Which Minecraft social-material transitions are *cheapest to verify* end-to-end
   (lend/return inventory delta, container claim, station sharing) and should seed
   the first advisory-predictor lane? (Cross-check with Lane 2's Minecraft action
   space and Lane 5's data feasibility.)
2. For the advisory social WAM, what is the minimal record schema (adapt S3AP's
   state/observations/actions tuple to repo typed fields) that lets prediction
   accuracy be scored against a verified delta without the predictor touching
   Actor Turn selection?
3. How to operationalize the partner/seed generalization matrix cheaply (same
   soul + different partner model; same seed + different partner) given the
   GPU-endpoint sharing constraint noted in the repo?
4. Which Lifelong-SOTOPIA-style *recall-forcing* scenarios best test memory
   continuity for obligation closure (`failed_promise_v1`), and how to avoid the
   "incidental history" trap where approaching each cycle independently also scores
   well?
5. Should an LLM-judged dialogue-quality axis be retained at all as a *secondary*
   metric (with the failure-checklist + human-correlation correction), or dropped
   entirely in favor of world-artifact scoring?
