# Cross-product novelty: is the 4-way combination occupied, and what is the closest prior work along each axis

Lane B synthesis. Audience: the project owner deciding how to position. ASCII punctuation only.
Lead with the mechanism and the placement, then the interpretation. Jargon is defined on
first use. This file builds on the 2026-06-16 archive (cited by path, not rewritten) and adds
the cross-product census plus a prior-work-gap matrix.

## 0. The four axes (the cross-product being tested)

A work "occupies the 4-way combination" only if it does ALL of:

1. MINECRAFT (or an equivalent wild, natural, already-reproducible embodied open world; not a
   2D grid, not a text sandbox, not a freshly hand-built simulator).
2. WORLD MODEL / WAM: an action-conditioned predictor `p(o' | o, l)` (given observation o and a
   latent/action l, predict next observation o'). The repo's reading is modality-independent:
   structured-state prediction counts, pixels are only one proxy.
3. OPEN-WORLD SOCIAL grounded in MATERIAL dynamics: the predicted/measured social state
   (obligation, trust, gratitude, conflict, repair, cooperation, reputation) is tied to
   verified physical-material change (possession, control, transfer, claims), not to
   dialogue plausibility alone.
4. AUTORESEARCH / SELF-IMPROVEMENT LOOP: a coding-agent or self-evolving loop that proposes a
   change, runs a fixed-budget trial, scores it with an EXTERNAL deterministic signal (not the
   actor's own judgment), keeps or discards, repeats.

Plus the one rule the whole literature enforces and the repo elevates: an external
deterministic verifier may SCORE; a learned reward model, an LLM judge, or the actor scoring
its own success is INADMISSIBLE (the repo's term for the failure: "progress laundering").

## 1. Verdict (lead with the answer)

The 4-way intersection is EMPTY. No single work, in the old 252-source archive or in the new
2026-06-17 discovery, is simultaneously embodied-Minecraft + an action-conditioned world model
+ material-grounded open-world social + a verifier-grounded self-improvement loop.

But three of the four axes, and several PAIRS and one near-TRIPLE, are occupied. So the honest
positioning is NOT "nobody works on any of this". It is:

- Each single axis is crowded (Minecraft agents; world models; social simulation;
  self-improving coding agents are all active, well-populated fields).
- Several pairs are occupied (Minecraft + WM; Minecraft + multi-agent-social; Minecraft +
  self-improvement; WM + multi-agent; social + material economy; WM + self-improvement).
- The CLOSEST triple to the project, Minecraft + world-model + self-improvement
  (EvolvingAgent 2502.05907; also MineEvolve 2603.13131 for Minecraft + self-improvement with
  typed feedback), exists but is SINGLE-AGENT and PHYSICAL/TASK only, and its loop is scored by
  SELF-VERIFICATION (the inadmissible signal), with no social-material layer.
- The social axis, when grounded in material dynamics, exists only OUTSIDE embodied Minecraft
  (economic sandboxes: AIvilization 2602.10429; LLM Economist 2509.10147 (old); GLEE; or text:
  SOTOPIA/S3AP), and OUTSIDE any self-improvement loop.
- Two 2025-2026 POSITION papers (2510.21219 "unify physical and social dynamics";
  2604.22748 "Agentic World Modeling" survey) explicitly NAME physical-plus-social world
  modeling as an open frontier and treat physical and social as "separate silos". They confirm
  the gap and simultaneously prove the FRAMING is not novel - only the embodied,
  verifier-grounded, material-grounded instantiation is.

One-line statement to use: the project's defensible novelty is the INTERSECTION, not any axis.
"Predict-and-verify material-grounded social transitions in an embodied Minecraft world, with
an advisory world model and a self-improvement loop whose success signal is a deterministic
verifier" is the unoccupied cell. Each ingredient has prior art; the combination, under the
verifier-owns-truth rule, does not.

## 2. Per-axis closest work and exactly what it misses

For each axis: the single closest prior work (or the strongest pair already noted in the old
archive), and the precise miss relative to the project. New sources are marked NEW; others cite
the old-archive note by path.

### Axis 1 - Minecraft (wild reproducible embodied open world)

- Closest, well-occupied. Voyager (2305.16291), MineDojo (2206.08853), MineStudio
  (2412.18293), the multi-agent cluster (MineCollab/MINDcraft 2504.17950, MineLand 2403.19267),
  the pixel world models (MineWorld 2504.08388, Solaris 2602.22208, Matrix-Game, Oasis), and
  the Minecraft self-evolvers (EvolvingAgent 2502.05907 NEW, MineEvolve 2603.13131 NEW, ADAM
  2410.22194 NEW, Steve-Evolving family).
- What they miss relative to the project: not the substrate (Minecraft is shared turf). The
  miss is everything ABOVE the physical layer. None pairs Minecraft with a predicted-and-
  verified social-material layer. (Substrate trade-offs vs robotics/dialogue-sim are Lane C's
  job; here Minecraft is simply "occupied, not differentiating on its own".)

### Axis 2 - World model / WAM (action-conditioned next-state predictor)

- Closest in Minecraft: pixel WMs (MineWorld, Solaris) and latent WMs (Dreamer 4 2509.24527).
  Cite old `notes/by-theme/minecraft-world-models.md`. Closest SOCIAL world model: Social World
  Models / S3AP (2509.00559), cite old `notes/by-paper/2509.00559-social-world-models.md`.
- What S3AP misses (the sharpest single miss on this axis): S3AP formalizes a social world
  model `p(A^-i | S)` and `p(S' | S, A^-i, a^i)` and proves structured social-state prediction
  beats free text (+51% on a theory-of-mind task with o1). But its "state" is an LLM parse of a
  free-form narrative, and it is scored only on a DIALOGUE goal-completion metric. It measures
  "does a structured social-state guess help win a dialogue", not "does a predicted
  social-material delta match a VERIFIED world change". It is not embodied, not Minecraft, no
  possession/durability, no deterministic verifier, no self-improvement loop. S3AP is the
  bridge; the project's job is to make S' a verified Minecraft+social delta.
- What the Minecraft WMs miss: all predict pixels or latent physical/task state for control;
  the social-material column is empty across every surveyed Minecraft/game world model (the old
  Lane 1 file's central finding). Solaris is the only MULTIPLAYER Minecraft WM and models
  multi-view pixels with zero social-material state.

### Axis 3 - Open-world social grounded in material dynamics

- Closest material-grounded social, NON-Minecraft: AIvilization v0 (2602.10429 NEW; economic
  sandbox with survival costs, multi-tier production, AMM prices, occupations, plus a
  simulation-guided feasibility check) and LLM Economist (2509.10147, old archive). Closest
  embodied multi-agent Minecraft with item transfer: MineCollab/MINDcraft (2504.17950; typed
  `givePlayer` handoff). Closest "physical + social simulator": SimWorld (2512.01078 NEW; UE5,
  open-sourced).
- What each misses:
  - AIvilization: material grounding is ABSTRACT ECONOMICS (prices, production tiers), not a
    physically located, mined/carried/durable item; not embodied Minecraft; single-run, no
    self-improvement loop; social outcomes not separately verified by a deterministic external
    scorer in the repo's sense.
  - MineCollab/MINDcraft: has the material handoff primitive but scores TASK COMPLETION;
    "the handoff creates no tracked obligation - once the recipe is done, the social fact
    evaporates" (old `notes/by-paper/2504.17950-minecollab-mindcraft.md`). No obligation/claim
    ledger, no post-goal continuation, no world model, no self-improvement loop.
  - SimWorld: is the WORLD (an environment), not a world-MODEL; UE5 not Minecraft; no advisory
    predictor; no self-improvement loop; no verifier-grounded social-material delta scoring.
  - Text social benchmarks (SOTOPIA family, AgentSense): rich social vocabulary but
    dialogue-plausibility-judged, ungrounded (old `notes/by-theme/llm-social-simulation.md`).
- The miss in one line: material-grounded social exists, but never as a PREDICTED-AND-VERIFIED
  physical-material-social delta in an embodied open world. Where it is grounded (economies,
  GLEE terminal states) it is abstract numbers; where it is embodied (MineCollab) it is
  task-completion with no obligation memory.

### Axis 4 - Autoresearch / self-improvement loop

- Closest digital: the coding-agent autoresearch lineage (Karpathy autoresearch; AIDE
  2502.13138; SICA 2504.15228; MLE/SWE/RE-bench), cite old
  `notes/by-theme/research-area-coding-agent-autoresearch.md`. Closest in Minecraft:
  Voyager's skill library (2305.16291) and the Minecraft self-evolvers EvolvingAgent
  (2502.05907 NEW) and MineEvolve (2603.13131 NEW).
- What they miss:
  - Voyager: self-improving skill library, but its success signal is a GPT-4 SELF-VERIFYING
    critic - the canonical progress-laundering risk (old
    `notes/by-paper/2305.16291-voyager-skill-library.md`). Single-agent, physical, no social.
  - EvolvingAgent: Minecraft + continual world model + self-evolution, but single-agent,
    physical-only, and the loop is scored by SELF-VERIFICATION (inadmissible). No social.
  - MineEvolve: Minecraft + self-evolution scored on TYPED in-world feedback (state/inventory
    changes, failure types, stagnation) - the closest precedent for a Minecraft loop grounded
    on typed deltas rather than a self-judge - but single-agent, no social, and no advisory
    predictive world model.
  - Digital autoresearch (AIDE/SICA/SWE-bench): clean external graders, but not embodied, not
    social, not Minecraft; the loop edits ML/SWE artifacts. The whole field's lesson (old Lane
    24 file) is that gains are trustworthy only against a clean external scorer and even then
    inflate three ways (weak verifier, contamination, silent self-iteration degradation).
- The miss in one line: self-improvement loops exist and the safe ones use an external scorer,
  but none drives an ADVISORY SOCIAL-MATERIAL predictor in an embodied world, and the Minecraft
  self-improvers either use a self-judge (Voyager, EvolvingAgent) or stay single-agent/physical
  (MineEvolve).

## 3. The pair and triple census (what is occupied below the 4-way)

Read this as: the 4-way is empty, but here is exactly how much IS occupied, so novelty is not
overclaimed.

| Combination | Occupied? | Closest work(s) | Precise miss vs the project |
|---|---|---|---|
| Minecraft + WM | yes | MineWorld, Solaris, Dreamer 4 | pixels/latent physical only; no social-material state |
| Minecraft + multi-agent social | yes | MineCollab/MINDcraft 2504.17950; Project Sid 2411.00114 (claim-only) | task-completion / LM-judged signals; no obligation ledger; no verifier-owned social delta |
| Minecraft + self-improvement | yes | Voyager; EvolvingAgent 2502.05907 NEW; MineEvolve 2603.13131 NEW; ADAM 2410.22194 NEW | single-agent, physical; self-judge (Voyager, EvolvingAgent) or no social (all) |
| WM + multi-agent | yes | Communicating-Plans 2508.02912 NEW (grid) | spatial-only WM; grid not Minecraft; no social-material; no loop |
| WM + self-improvement | yes | EvolvingAgent 2502.05907 NEW; WALL-E 2410.07484 (rule-learning, Minecraft) | physical WM; WALL-E is MPC-authority not advisory; self-verification; no social |
| WM + social | partial | Social World Models / S3AP 2509.00559 | LLM-parsed state, dialogue-scored, not embodied, not verified, no loop |
| Social + material grounding | yes (non-embodied) | AIvilization 2602.10429 NEW; GLEE; LLM Economist 2509.10147 | abstract economy not physical possession; not Minecraft; no predictive WAM; no loop |
| Physical + social world model (named direction) | position-only | 2510.21219 NEW; 2604.22748 NEW survey | call-to-action / taxonomy; no system; "separate silos" admitted |
| Minecraft + WM + self-improvement (TRIPLE) | yes | EvolvingAgent 2502.05907 NEW | single-agent, physical, self-verified; no social-material layer |
| Minecraft + WM + social-material (TRIPLE) | NO | none found | this is the project's primary open cell (advisory WAM over verified social-material deltas) |
| Minecraft + social-material + self-improvement (TRIPLE) | NO | none found | second open cell |
| ALL FOUR | NO | none found | the project's positioning target |

## 4. Project Sid: the nearest neighbor, and why it does not close the gap (cautionary, label unreproduced)

Project Sid (2411.00114, PIANO = Parallel Information Aggregation via Neural Orchestration,
Altera) is the single nearest neighbor on three axes at once: embodied Minecraft + many-agent
SOCIETY (specialization, collective rules/taxation, cultural and religious transmission) + a
concurrent agent architecture. It is the closest thing to "Minecraft + open-world social at
scale" that exists.

It still does NOT occupy the project's cell, and its status must be labeled honestly:

- UNREPRODUCED. As of the repo's 2026-06-15 primary-source audit
  (`project-docs/references/external-project-notes/project-sid-2411-00114-review-2026-06-15.md`, and confirmed
  by a 2026-06-17 web check: the public GitHub https://github.com/altera-al/project-sid still
  contains only the report PDF, README, and visual abstract), there is NO released PIANO source,
  server setup, prompts/configs for the reported runs, raw transcripts, action logs, world
  seeds, replay artifacts, or scoring scripts, and no independent replication. Every Sid claim
  used here is CLAIM-ONLY.
- No WORLD MODEL. PIANO is a concurrent agent architecture, not an action-conditioned next-state
  predictor. There is no advisory `p(o'|o,l)`.
- No self-improvement / autoresearch loop. Runs are configured, not iteratively self-improved
  against an external scorer.
- Its social signals are mostly LM-JUDGED PLAUSIBILITY, not verified world consequence:
  LM-scored sentiment, LM-inferred "true" likeability, GPT-4-inferred roles, keyword-proxy meme
  spread (old `notes/by-theme/project-sid-critical-review.md`). Its ONE defensible signal is
  taxation compliance (% of inventory deposited in tax windows), because a deposit into a
  community chest is a verifiable inventory transition - which is exactly the
  predict-and-verify material move the project generalizes.

So Sid is the nearest neighbor AND the clearest cautionary tale: it shows the embodied-social-
at-scale direction is plausible, but its public artifact cannot verify it, it has no world
model, no self-improvement loop, and its social metrics are the LM-judged kind the project
rejects. The project's defensible move (old archive's conclusion, restated): keep the
embodiment, drop the civilization framing and the LM-judged signals, study a small number of
actors whose social-material transitions are VERIFIED against world artifacts, add an advisory
predictor, and refine it with a verifier-scored loop.

## 5. What is genuinely unoccupied vs what is crowded (the honest split)

CROWDED (do not claim as novelty):
- Minecraft embodied agents (Voyager, MineDojo, JARVIS, Optimus, MineStudio family).
- World models, including Minecraft pixel/latent WMs and the WM survey taxonomy.
- "Social world models" as a NAMED category (S3AP coined the formalization; 2604.22748 lists
  "social" as a governing-law regime; 2510.21219 calls physical+social unification the
  frontier). The project did not invent this category.
- Self-improving / self-evolving coding and embodied agents (AIDE, SICA, Voyager, EvolvingAgent,
  MineEvolve). "Self-improvement loop" is not novel.
- Multi-agent Minecraft collaboration and even many-agent Minecraft society (MineCollab,
  Project Sid). "Agents in Minecraft doing social things" is not novel.

GENUINELY UNOCCUPIED (the defensible novelty, in priority order):
1. An action-conditioned world model whose predicted next-state is a VERIFIED PHYSICAL-MATERIAL-
   SOCIAL delta (possession + claim + obligation + trust change), scored against a deterministic
   Mineflayer verifier, with prediction accuracy reported SEPARATELY from acting outcome. No
   surveyed work predicts-and-verifies social-material state; S3AP gets closest and is
   dialogue-scored and unembodied.
2. The same, kept ADVISORY: the world model predicts and proposes but never selects the executed
   action, fills arguments, marks progress true, or overrides the verifier. WALL-E (the closest
   Minecraft LLM-as-world-model) uses its model as MPC planning AUTHORITY; keeping it advisory
   is a deliberate, uncommon design choice.
3. A self-improvement loop over that advisory social-material predictor whose success signal is
   the deterministic verifier (NOT a self-judge). Voyager and EvolvingAgent self-improve in
   Minecraft with a self-judge; MineEvolve uses typed feedback but stays single-agent/physical;
   no work runs a verifier-scored loop to improve a social-material predictor.
4. Small-N (2-3 actors), reproducible, falsifiable social-material trajectories with
   post-goal continuation, as a deliberate contrast to Project Sid's unreproduced 50-500+ agent
   civilization claims.

What is NOT a novelty claim (support, per the contract): the verifier, the logs, the ledger,
the scoring scripts, the benchmark harness, and the loop engineering are SUPPORT infrastructure
and an audit surface, not the contribution. The contribution is whether embodied LLM actors
sustain socially meaningful, materially-grounded behavior that a world model can predict and a
verifier can check.

## 6. One-line tie to the thesis

The 4-way intersection of Minecraft + advisory world model + material-grounded open-world
social + verifier-grounded self-improvement loop is empty across 560+ old sources and 10 newly
verified 2025-2026 works; each ingredient is crowded and two position papers already name the
physical-plus-social direction, so the project's only defensible novelty is the INTERSECTION
under the verifier-owns-truth rule, not any single axis.

## 7. Sources touched in this lane (pointers)

New (this investigation's `notes/by-paper/`): 2502.05907 (EvolvingAgent), 2603.13131
(MineEvolve), 2510.21219 (unify physical+social position), 2604.22748 (Agentic World Modeling
survey), 2602.10429 (AIvilization), 2512.01078 (SimWorld), 2508.02912 (Communicating Plans).
Manifest-only new: 2410.22194 (ADAM), 2503.03505 (Parallelized Planning-Acting), 2510.13982
(Static Sandboxes position).

Cited from old archive (not rewritten): 2305.16291 (Voyager), 2410.07484 (WALL-E), 2504.17950
(MineCollab/MINDcraft), 2509.00559 (S3AP), 2411.00114 (Project Sid) + the 2026-06-15 root
review, and the theme files minecraft-world-models, minecraft-multi-agent-social,
llm-social-simulation, project-sid-critical-review, research-area-coding-agent-autoresearch,
plus matrices/research-gap-matrix and matrices/source-comparison-matrix. Old-archive economic:
2509.10147 (Virtual Agent Economies), 2507.15815 (LLM Economist).
