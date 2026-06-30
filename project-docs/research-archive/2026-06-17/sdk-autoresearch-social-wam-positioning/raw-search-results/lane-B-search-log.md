# Lane B search log (cross-product novelty)

ASCII punctuation only. Records queries run, tools used, what was found, what is unresolved or
inaccessible.

## Tools used

- hf papers search (Hugging Face CLI, `/Users/user/.local/bin/hf`).
- WebSearch (built-in).
- WebFetch on arXiv abstract pages (https://arxiv.org/abs/<id>) for primary verification of
  title, authors, date, category, abstract.
- Read on the old 2026-06-16 archive theme files, by-paper notes, matrices, and the repo's
  2026-06-15 Project Sid root review.

## Reuse-first step (before any new search)

Read from old archive `2026-06-16/deep-social-wam-literature-review/`:
- theme files: project-sid-critical-review, minecraft-multi-agent-social, minecraft-world-models,
  llm-social-simulation, minecraft-agent-benchmarks, minestudio-positioning,
  research-area-coding-agent-autoresearch.
- matrices: research-gap-matrix, source-comparison-matrix.
- by-paper notes: 2305.16291 (Voyager), 2410.07484 (WALL-E), 2504.17950 (MineCollab/MINDcraft),
  2509.00559 (S3AP).
- repo root: project-docs/research-archive/Project-Sid-2411-00114-Review-2026-06-15.md.
Confirmed there is NO by-paper note for 2411.00114 in the old archive (only the theme + the root
review); 252 by-paper notes total in the old archive.

## HF papers search queries

1. `hf papers search "social world model agent society"` -> surfaced 2412.03563 (social-sim
   survey) and others; mostly old-archive or non-Minecraft.
2. `hf papers search "minecraft social world model embodied agents"` -> MineWorld 2504.08388 and
   pixel WMs (old archive); no 4-way occupant.
3. `hf papers search "agent society world model self-improvement"` -> general society sims.
4. `hf papers search "self-improving embodied agent autonomous research loop Minecraft"` ->
   FOUND new: 2502.05907 (EvolvingAgent), 2603.13131 (MineEvolve/Steve-Evolving family),
   2605.27762 (PEAM), 2605.09998, plus old Minecraft agents.
5. `hf papers search "world model multi-agent society emergent norms"` -> FOUND new: 2508.02912
   (Communicating Plans), 2604.22748 (Agentic World Modeling survey), 2510.13982 (Static
   Sandboxes), plus norm-emergence sims (2510.14401, 2602.00755, 2412.10270 - social, non-
   embodied, no WM).
6. `hf papers search "embodied social simulation obligation trust material economy"` -> FOUND
   2602.10429 indirectly via web; surfaced SocioVerse 2504.10157, Virtual Agent Economies
   2509.10147 (old), LLM Economist 2507.15815 (old), AgentSociety 2502.08691 (old).

## WebSearch queries

1. `"world model" "social" Minecraft LLM agents 2025 2026 embodied society` -> FOUND new:
   2510.21219 (unify physical+social position), 2512.01078 (SimWorld), 2602.10429
   (AIvilization), 2503.03505 (Parallelized Planning-Acting). Also 2510.21219 confirmed via the
   result snippet.
2. `Minecraft embodied agent "world model" social relationships obligations trust self-improving
   loop 2026` -> mostly Voyager/MineDojo restated; confirmed ADAM 2410.22194 lead;
   no 4-way occupant.
3. `Project Sid PIANO Altera reproduction replication independent code release 2025 2026` ->
   confirmed PIANO = Parallel Information Aggregation via Neural Orchestration; GitHub
   altera-al/project-sid still report-PDF + README + visual abstract only; no independent
   reproduction found (reconfirms the 2026-06-15 root review, now as of 2026-06-17).

## arXiv abstract verifications (WebFetch, primary-source)

All accessed OK on 2026-06-17:
- 2510.21219: position paper, cs.CY, 2025-10-24, physical+social "separate silos", no system,
  not Minecraft, no loop.
- 2512.01078 SimWorld: cs.AI, 2025-11-30 (v2 2026-01-22), UE5 physical+social simulator,
  open-sourced, no predictive WM, no self-improvement loop, not Minecraft.
- 2602.10429 AIvilization v0: cs.MA, 2026-02-11, economic sandbox (survival/production/AMM),
  simulation-guided validation, not Minecraft, no self-improvement loop.
- 2503.03505 Parallelized Planning-Acting: Minecraft multi-agent, 2025-03-05 (v2 2026-03-07),
  task efficiency only, no social, no WM, no loop.
- 2508.02912 Communicating Plans: cs.MA, 2025-08-04 (v4 2025-11-24), grid-world embodied WM
  (ITGM) spatial-only, multi-agent, no social, no loop, not Minecraft.
- 2502.05907 EvolvingAgent: cs.RO, 2025-02-09 (v3 2026-04-29), Minecraft + continual WM +
  self-evolution scored by self-verification, single-agent, physical, no social.
- 2603.13131 MineEvolve: 2026-03-13 (v3 2026-05-10), Minecraft + self-evolution on typed
  in-world feedback (Monitor/Inducer/Curator/Adaptor), code stated available, single-agent,
  no social, no predictive WM.
- 2604.22748 Agentic World Modeling: cs.AI, 2026-04-24 (v3 2026-06-16), 400+ paper survey,
  levels (L1 Predictor / L2 Simulator / L3 Evolver) x laws (physical/digital/social/scientific);
  social is a named regime, physical and social kept separate; not Minecraft-specific.
- 2410.22194 ADAM: 2024-10-29, Minecraft embodied causal agent, causal-graph world knowledge,
  single-agent, lifelong learning, no social.

## What was found (summary)

- 10 NEW sources (not in old archive) verified at abstract level; 7 got NEW by-paper notes,
  3 are manifest-only census rows (ADAM, Parallelized Planning-Acting, Static Sandboxes).
- 2 sources already in old archive (Virtual Agent Economies 2509.10147, LLM Economist
  2507.15815) cited by old-archive path, no new note.
- 5 old-archive by-paper notes cited as the closest-work anchors (Voyager, WALL-E,
  MineCollab/MINDcraft, S3AP, Project Sid review).
- Verdict: the 4-way intersection is EMPTY; closest occupied TRIPLE is Minecraft + WM +
  self-improvement (EvolvingAgent), single-agent/physical/self-judged.

## Unresolved / inaccessible / caveats

- No FULL LaTeX deep-read for any of the 10 new sources; all are ABSTRACT-availability. Component
  internals (exact scoring mechanism, multi-agent claims) are abstract-quoted, not body-verified.
  If the final report leans hard on EvolvingAgent's "self-verification" or MineEvolve's typed
  feedback as the precise contrast, a LaTeX pass on 2502.05907 and 2603.13131 would harden it.
- 2510.13982 (Static Sandboxes) authors not fully captured (abstract page not deep-fetched);
  recorded as position-paper census row only.
- "EMPTY 4-way" is bounded by HF/web/arXiv indexing as of 2026-06-17; not a proof of
  non-existence (a private or just-posted unindexed system could exist).
- arXiv API curl (export.arxiv.org/api/query) returned no usable lines with the grep pattern
  tried; switched to WebFetch on abstract pages, which worked for all IDs. No source was
  inaccessible via WebFetch.
- All Project Sid 2411.00114 claims are CLAIM-ONLY (artifact status reconfirmed report-PDF-only
  on 2026-06-17); labeled unreproduced throughout.
