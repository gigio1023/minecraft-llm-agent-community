# Research area: scenario and environment generation, and evaluation freshness

Lane 35 (wave 6) theme file. Audience: external team / newcomer. Jargon is defined on first use. ASCII
punctuation only (`-`, `:`, `,`, `.`, parentheses).

This area answers two of the directions report's hard questions at once
(reports/research-directions-for-the-repo.md, lines 135 to 138, 158 to 159, 174 to 175): how to
GENERATE comparable, resettable scenarios for a self-improvement loop, and how to keep HELD-OUT
SOCIAL scenarios FRESH so the loop cannot overfit. The directions report calls clean scenario reset
"the real blocker" (matrix row Environment: reset = MISSING) and freshness "the SWE-rebench
contamination analog."

## 0. Deconfliction (what this file does NOT re-survey)

- **Lane 21 (sibling, wave 4) owns OPEN-ENDED CURRICULUM and the learnability/interestingness
  question** (notes/by-theme/research-area-open-ended-curriculum-and-task-generation.md). It deep-read
  POET (1901.01753), Enhanced POET (2003.08536), OMNI (2306.01711), OMNI-EPIC (2405.15568),
  Eurekaverse (2411.01775), MAGELLAN (2502.07709), and logged PAIRED/ACCEL at ABSTRACT level. This
  lane goes DEEPER on the GENERATION MECHANICS and ADMISSIBILITY GATE (PAIRED deep-read; PCGRL,
  ProcTHOR, Holodeck, QDAIF as the procedural and scene-generation machinery) and adds the FRESHNESS
  axis (time-gating, decontamination) that lane 21 only named. Where they meet (the generate -> run
  -> verify -> select-next loop), this lane treats the SCENARIO ARTIFACT and its VALIDITY GATE as the
  object and points to lane 21 for the learnability ordering.
- **Lane 24 (wave 5) owns the CONTAMINATION/CODING-AGENT angle**
  (notes/by-theme/research-area-coding-agent-autoresearch.md): SWE-rebench (2505.20411), the
  passes-but-wrong result (2503.15223), SlopCodeBench (2603.24755). This lane cites those and adds the
  TIME-GATED-BENCHMARK construction methods themselves (LiveCodeBench, AntiLeak-Bench) and the
  rephrase-attack decontamination result (2311.04850), with the social/agentic-freshness lens.
- **Wave-1 minecraft-agent-benchmarks owns how Minecraft tasks are scored** (MineDojo, MCU, Odyssey,
  Plancraft). This file cites them as the task space and verification machinery, not re-described.
- **SOTOPIA (2310.11667) and Lifelong-SOTOPIA (2506.12666) already have by-paper notes.** This file
  covers only SOTOPIA-pi's task SYNTHESIS (2403.08715), the new angle.

## 1. The two central questions (one line each)

1. **Generation**: how do you produce COMPARABLE, RESETTABLE scenarios (same seed, bounded variation,
   guaranteed solvable) that a self-improvement loop can run twice and measure a difference, across
   the 4 layers (Physical, Material-Economic, Social, Institutional)?
2. **Freshness**: how do you keep HELD-OUT scenarios fresh and CHEAP, so the loop improves social
   competence rather than overfitting a fixed set, given that social scenarios do not regenerate for
   free the way GitHub issues or coding contests do?

## 2. Glossary (defined once)

- **Procedural Content Generation (PCG)**: algorithmic creation of content (levels, maps, scenes)
  rather than hand-authoring. PCG via RL (PCGRL, 2001.09212) trains a policy to make iterative
  content edits.
- **Unsupervised Environment Design (UED)**: framing curriculum as a game between an environment
  GENERATOR and a POLICY, where the generator proposes valid, solvable environments adapted to the
  policy. The canonical regret-based instance is PAIRED (2012.02096).
- **Regret (in UED)**: the gap between the best achievable return and the policy's return. Maximizing
  regret targets environments that are hard for the current policy yet still solvable (because an
  unsolvable environment yields zero regret).
- **Domain randomization (DR)**: generating fully-specified environments uniformly at random,
  regardless of the policy. The baseline UED critiques: it cannot adapt difficulty or generate
  structure.
- **Validity gate / admissibility check**: a deterministic procedure that decides whether a generated
  artifact is admissible (navigable, solvable, collision-free, constraint-satisfying). PCGRL uses a
  Sokoban solver; ProcTHOR uses a BFS-reachability check; Holodeck uses a constraint solver.
- **Reset granularity**: what exactly is restored to make two runs of a scenario comparable (seeded
  world, scripted preconditions, ledger state). The directions report's named blocker.
- **Time-gating (release-date gating)**: for a model with a known training cutoff, evaluate only on
  items released AFTER that cutoff, so the model provably has not seen them. LiveCodeBench's
  (2403.07974) contamination defense.
- **Decontamination**: removing or detecting test items that leaked into training data. Standard
  methods (n-gram, embedding overlap) are defeated by REPHRASED SAMPLES (2311.04850).
- **Holdout rotation**: periodically retiring a held-out set and authoring a fresh one, so a loop
  cannot overfit a static set. The structural alternative to post-hoc decontamination.

## 3. Key works and sub-threads (each leads with what it introduced and why it matters)

### 3a. Procedural generation and its validity gate (the generation spine)

- **PCGRL (2001.09212, Khalifa/Bontrager/Earle/Togelius, AIIDE 2020)**. Introduced: level design as an
  MDP (iterative typed tile edits, reward toward a goal predicate), three representations
  (narrow/turtle/wide), and a "change percentage" cap (20% in training) that forces a CONSERVATIVE
  designer adapting a seeded starting layout instead of converging to one optimum. Why it matters: the
  VALIDITY GATE is a deterministic solver (a Sokoban BFS/A* solver verifies a level is solvable in at
  least X=18 steps; Zelda requires reachability of key-then-door in at least 16 steps). Solvability
  numbers: narrow 86.7%, turtle 88.3%, wide 67.5% solvable Sokoban at 100% change. The "weak solver
  -> easy levels" finding is the verifier-strength lesson in miniature.
- **ProcTHOR (2206.06994, Deitke et al., NeurIPS 2022)**. Introduced: procedural generation of
  interactive 3D houses from a room-spec tree by multi-stage conditional sampling, serialized to JSON,
  with a BFS-REACHABILITY VALIDATOR that resamples under the same spec if any room lacks >=5 reachable
  grid cells ("All houses are fully navigable"). ProcTHOR-10K = 10,000 houses; 10K verified scenes
  generated "in 1 hour on a local workstation with 4 NVIDIA RTX A5000 GPUs"; SOTA on 6 embodied
  benchmarks. Why it matters: it is the cleanest published example of SEED-SPEC GENERATION +
  REJECT-AND-RESAMPLE against a deterministic gate, environment-verified at scale, and the closest
  structural mirror of the repo's runtime verifier (though physical-only).
- **Holodeck (2312.09067, Yang et al., CVPR 2024)**. Introduced: GPT-4 emits SPATIAL RELATIONAL
  CONSTRAINTS (e.g. "coffee table, in front of, sofa"), and a deterministic DFS/MILP solver places
  objects so that "A placement is only valid if all the hard constraints are satisfied" (collision-
  free, in-bounds), returning the layout satisfying the most constraints over a 30-second budget. Why
  it matters: it generalizes the validity gate from physical reachability to TYPED RELATIONAL
  constraints (the step toward social/institutional admissibility), and its ablation shows LLM-emitted
  ABSOLUTE coordinates are no better than random (MRR 0.364 vs 0.369), the empirical case for
  constraint-emit-then-solve over LLM-picks-values.

### 3b. Unsupervised Environment Design (the comparable-solvable-novel guarantee)

- **PAIRED (2012.02096, Dennis et al., NeurIPS 2020)**. Introduced: UED as regret maximization with a
  three-agent setup (adversary generates, protagonist and antagonist act, regret = antagonist minus
  protagonist return), so unsolvable environments yield zero adversary reward and the curriculum stays
  feasible. Why it matters: the SUCCESS THEOREM (when success and failure form separated reward bands
  and a succeeding policy exists, minimax regret picks a succeeding policy) is the principled version
  of "generate solvable-but-hard," and the honest caveats are load-bearing for the repo: regret is
  NOISY ("training agents on the environment reward itself ... appears to be more effective"), the
  guarantee assumes antagonist-adversary COORDINATION, and a randomly-initialized generator must still
  produce feasible environments (the bad parameterization scored solved-path ~2 vs ~15).
- **ACCEL and replay-guided UED (PLR)**: the regret line continued with editing high-regret levels
  (ACCEL) and prioritized replay of high-regret levels (robust PLR). STATUS: NOT verifiable on
  Hugging Face (see section 7); logged CLAIM-ONLY. Lane 21 already names them at abstract level. The
  mechanism the repo cares about (incrementally EDIT a high-regret scenario rather than generate from
  scratch) is captured by PCGRL's change-percentage bounded-edit idea and ProcTHOR's resample-under-
  the-same-spec, both verifiable.
- **Open-Endedness is Essential for Artificial Superhuman Intelligence (2406.04268, Hughes et al.,
  DeepMind, ICML 2024 position)**. Introduced (abstract-level here): a formal definition of
  open-endedness through NOVELTY and LEARNABILITY to a human observer. Why it matters: it is the
  field's statement that the generation loop's two filters are novelty (verifier-checkable as
  novel-to-archive) and learnability (frontier difficulty), the same split lane 21 uses.

### 3c. Diversity and curation of the scenario portfolio

- **QDAIF (2310.13032, Bradley et al., ICLR 2024)**. Introduced: MAP-Elites (keep the best solution
  per cell of a behavior grid) with an LM supplying both the QUALITY score and the DIVERSITY descriptor
  in natural language, so subjective axes (story genre, tone) get covered. QD score 130 (CI 118 to
  145) vs random 76 on GPT-4 poetry. Why it matters AND its warning: it is the mechanism for a
  coverage-controlled scenario PORTFOLIO spanning chosen axes, but the authors explicitly suspect
  REWARD HACKING of the LM evaluator (quality-correlation collapses in the 0.995 to 1 range), so the
  LM-as-judge is the documented failure mode, not a validity gate.

### 3d. LLM-driven SOCIAL scenario synthesis (the cheap-fresh-social-content edge)

- **SOTOPIA-pi (2403.08715, Wang et al., ACL 2024)**. Introduced: automatic social-task synthesis
  (sample social-norm keywords from Social Chemistry, Social IQa, NormBank; prompt GPT-4 for a
  scenario plus per-character goals; guarantee train/eval disjointness) feeding a behavior-cloning +
  self-reinforcement loop. 100 tasks per round; 462 generated upfront. Why it matters: it is the ONLY
  source here that cheaply manufactures NEW SOCIAL content, which is what the repo needs. Its warnings
  are equally load-bearing: the GPT-4 judge "significantly overestimates" trained models (GPT-4-rated
  5.71 vs human-rated 4.29 for the same model), and SELF-REINFORCEMENT ALONE kept a harmful-goal
  injury rate at 100% and raised toxicity, i.e. an LLM-judged social loop can move the wrong way while
  the judged metric rises.

### 3e. Evaluation freshness and contamination (the held-out-stays-fresh axis)

- **LiveCodeBench (2403.07974, Jain et al., ICLR 2025)**. Introduced: TIME-GATING. Continuously scrape
  dated contest problems; per model, score only on problems released after its training cutoff;
  DETECT contamination by the before-vs-after-cutoff pass-rate drop (DeepSeek DS-Base-33B "dropping
  from Pass@1 ~60 in May problems to Pass@1 ~0 in September LeetCode problems"). All grading is
  deterministic execution. Why it matters: it is the cheapest STRUCTURAL freshness defense and pairs
  it with deterministic grading, the exact shape the repo's verifier already has. The catch it names:
  the eligible set shrinks after cutoff (only 349 usable problems), and a private hold-out is the
  fallback.
- **AntiLeak-Bench (2412.13670)**. Introduced (abstract-level): automatically CONSTRUCTING
  contamination-free benchmarks from real-world knowledge UPDATED after the model cutoff, so no human
  labeling and guaranteed-fresh items. Why it matters: a second freshness recipe (auto-build from
  post-cutoff facts) complementary to LiveCodeBench's scrape-dated-contests.
- **Rephrased Samples / LLM decontaminator (2311.04850, Yang et al.)**. Introduced: REPHRASED SAMPLES
  (paraphrase/translation of test items) defeat n-gram and embedding decontamination, inflating a
  rephrased-trained 13B to HumanEval 81.1 (vs GPT-4's 67.0) and GSM-8k 95.3; 8 to 18% of HumanEval was
  found rephrase-overlapping in real corpora. The proposed LLM decontaminator (top-k embedding +
  GPT-4 same-or-not judge) catches them. Why it matters: standard decontamination is insufficient, and
  the authors' own remedy is "fresh one-time exams," the same conclusion LiveCodeBench reaches.
- **Living-world agentic benchmarks** (ClawMark 2604.23781, LiveAgentBench 2603.02586): abstract-level
  breadth showing the freshness problem moving into multi-turn, multi-day, real-world AGENT settings,
  where scenarios are persistent and do not refill cheaply, the closest published shape to the repo's
  social-scenario problem.

## 4. How each source maps to the 4 WAM layers

| Source (id) | Generates | Validity gate | Verified vs self-reported | Primary WAM layer |
|---|---|---|---|---|
| PCGRL (2001.09212) | levels (typed edits) | deterministic solver (BFS/A*) | environment-verified | Physical |
| ProcTHOR (2206.06994) | 3D houses (seed-spec sampling) | BFS reachability + resample | environment-verified | Physical |
| Holodeck (2312.09067) | 3D scenes (LLM + constraints) | constraint solver (hard constraints) | env-verified (downstream) + human | Physical, relational |
| PAIRED (2012.02096) | environments (regret adversary) | antagonist as feasibility oracle | environment-verified | Institutional (loop) |
| QDAIF (2310.13032) | text portfolio (MAP-Elites) | LM judge (gameable) | self-reported + human | cross-layer (curation) |
| SOTOPIA-pi (2403.08715) | social tasks (LLM synthesis) | LLM judge (biased) | self-reported | Social |
| LiveCodeBench (2403.07974) | held-out set (time-gated scrape) | deterministic execution | environment-verified | cross-layer (eval) |
| AntiLeak-Bench (2412.13670) | held-out set (post-cutoff facts) | auto-constructed answer key | self-reported (abstract) | cross-layer (eval) |
| Rephrased samples (2311.04850) | decontam check | LLM same-or-not judge | self-reported | cross-layer (eval) |

Layer dependency (kept visible per the contract): a generated SOCIAL scenario is admissible only if
the verifier can label its (state, action, next-state). That requires physical/material facts (who
holds what, durability, reachability) to be verifiable first. So every generator above is trustworthy
at Physical/Material (deterministic gates: PCGRL solver, ProcTHOR reachability, Holodeck hard
constraints) and progressively weaker as the gate becomes an LLM judge (QDAIF, SOTOPIA-pi), which is
exactly where progress laundering would creep in.

## 5. Maturity and open problems

- **Mature**: deterministic-gate procedural generation (PCGRL solver, ProcTHOR reachability) is
  environment-verified and cheap (ProcTHOR: 10K verified scenes in 1 hour). Regret-based UED has a
  proof (PAIRED success theorem). Time-gating (LiveCodeBench) is a deployed, environment-verified
  freshness defense. MAP-Elites coverage (QDAIF) is a standard diversity backbone.
- **Unsolved / honest**:
  - **A deterministic validity gate for SOCIAL/INSTITUTIONAL scenarios does not exist in the
    literature.** Every social generator surveyed (SOTOPIA-pi, QDAIF) gates with an LLM judge that its
    own authors show is biased or hackable. Physical gates (solver, reachability, hard constraints) do
    not transfer to "was the promise keepable, the commons maintainable."
  - **Clean reset of a SOCIAL scenario is unaddressed.** ProcTHOR resets a scene by reloading JSON;
    PCGRL resets to a seeded layout. Resetting "Bob owes Alice a pickaxe and trust is strained" to a
    comparable starting state has no published recipe (it is the repo's reset blocker).
  - **Social scenarios do not refill cheaply.** LiveCodeBench refills from weekly contests;
    AntiLeak-Bench from updated facts; SOTOPIA-pi from LLM synthesis (but LLM-judged). There is no
    cheap, FRESH, DETERMINISTICALLY-VERIFIED social-scenario source; the repo would have to author
    them and budget for it (directions report line 175).
  - **LLM-synthesized held-out sets risk paraphrase leakage** (2311.04850): if the same model family
    generates both training and held-out scenarios, they can be near-duplicates that string/embedding
    checks miss.

## 6. Tie to the project / 4-layer admissibility

The repo needs (a) comparable seeded scenarios to run a self-improvement loop and (b) held-out social
scenarios that stay fresh. This area is the literature on both, and it converges on a single design.

- **What a comparable, resettable Physical/Material scenario IS, concretely** (answering the reset
  blocker, directions report line 158):
  - A SEED-SPEC plus a fixed RNG (ProcTHOR's room-spec tree is the template), serialized to a
    replayable artifact (ProcTHOR's JSON), so two runs start identical.
  - SCRIPTED PRECONDITIONS placed by bounded edits from that seed (PCGRL's change-percentage idea:
    perturb a seeded starting state within a cap, so variants are comparable, not arbitrary).
  - A LEDGER RESET: the Material-Economic state (who holds/controls what, outstanding
    obligations/credits) restored to a declared starting value, the social-layer analog of ProcTHOR
    teleporting the agent to a known pose. The repo already owns the typed ledger; the missing piece
    is a deterministic restore-and-replay of it.
  - A DETERMINISTIC ADMISSIBILITY GATE per layer, applied at generation time with REJECT-AND-RESAMPLE
    (ProcTHOR's pattern): Physical = reachability/collision (PCGRL solver, ProcTHOR BFS); Material =
    feasibility of the intended transfers (enough resources exist, the borrow is repayable); Social =
    typed relational preconditions (the obligation is well-formed, the parties exist), expressed as
    HARD CONSTRAINTS the way Holodeck expresses collision/in-bounds. The repo's runtime verifier is
    the gate; generation only proposes the setup.
- **What keeps held-out social scenarios FRESH, cheaply** (answering directions report line 174):
  - TIME-GATING (LiveCodeBench): stamp every scenario and every verifier-labeled transition with a
    creation date or corpus-version hash; evaluate a trained actor only on scenarios authored after its
    last training snapshot; DETECT overfitting via a before-vs-after-snapshot score gap.
  - A PRIVATE HOLD-OUT bank (LiveCodeBench fallback) never used in training, for final scoring.
  - LLM-SYNTHESIS of new social scenarios (SOTOPIA-pi recipe: norm-keyword seeds -> scenario +
    per-character goals -> train/eval disjointness) as the cheap refill, but with the success label on
    the DETERMINISTIC VERIFIER, never the LLM judge.
  - An ADMISSION-TIME DECONTAMINATION CHECK (2311.04850) against the training-scenario bank, because
    LLM-synthesized held-out scenarios can be paraphrase-near-duplicates of training ones.
- **The honest bound (where the analogy breaks)**:
  - Every DETERMINISTIC validity gate in this lane is PHYSICAL or relational-physical (solver,
    reachability, collision). Extending it to Material is plausible (possession/transfer are checkable
    typed facts); extending it to Social/Institutional admissibility ("is this a well-formed, solvable
    obligation scenario") is the repo's unbuilt work, not a citable result.
  - Every SOCIAL generator (SOTOPIA-pi, QDAIF) gates with an LLM judge its authors debunk. The repo's
    contribution is precisely to keep the generator advisory and the gate deterministic.
  - Social reset and social refill have no cheap published recipe; the repo must author scenarios and
    budget for it.

- **One-line tie to the original query**: this area is how a hierarchical action-conditioned WAM would
  obtain COMPARABLE, RESETTABLE situations to predict-and-evaluate, and keep its held-out social
  probes FRESH, so its calibration is measured on new ground rather than a memorized set.
- **One-line tie to the autoresearch thesis**: a self-improvement loop can be fed comparable seeded
  scenarios (ProcTHOR seed-spec + PCGRL bounded-edit + reject-and-resample against the runtime
  verifier) and kept honest by time-gated, deterministically-verified held-out scenarios
  (LiveCodeBench), but the social validity gate and social reset are the repo's to build, and any
  LLM-judged scenario score is the documented place the loop games itself (QDAIF, SOTOPIA-pi).

## 7. What I could not verify

- **PLR (Prioritized Level Replay, arXiv 2010.03934) and robust/replay-guided PLR (arXiv 2110.02439)
  and ACCEL (arXiv 2203.01302) are NOT indexed on Hugging Face** (hf papers info returns not-found for
  all three; multiple title and author searches via hf papers search did not surface them). Per the
  honesty rules they are logged CLAIM-ONLY and NOT counted as verified deep-reads. The regret-based UED
  mechanism they extend is deep-read via PAIRED (2012.02096, verified), and the bounded-edit idea they
  use is captured by PCGRL (verified). The original seed brief named 2110.02439 and 2203.01302; both
  fail HF verification, so they are dropped from the manifest as verified ids and recorded as
  claim-only in the search log.
- **AntiLeak-Bench (2412.13670), ClawMark (2604.23781), LiveAgentBench (2603.02586), Open-Endedness
  is Essential (2406.04268)** are verified on HF but logged ABSTRACT-LEVEL (not LaTeX deep-read); their
  internal numbers are not quoted here beyond the abstract.
- I did not find a published instance of a DETERMINISTIC (non-LLM-judge) validity gate for SOCIAL or
  INSTITUTIONAL scenario generation, nor a published recipe for resetting a social/obligation state to
  a comparable starting point. The literature stops at physical/relational gates; that gap is the
  repo's surface, not a citable result.
