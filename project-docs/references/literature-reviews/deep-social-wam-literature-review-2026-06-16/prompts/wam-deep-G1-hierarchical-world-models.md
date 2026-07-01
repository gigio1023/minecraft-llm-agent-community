# Lane 12 (G1): Hierarchical and temporally-abstract world models and RL

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum-wave3.md`
first. You are Lane 12. Manifest fragment: `raw-search-results/lane-12-manifest.jsonl`.
Owned theme: `notes/by-theme/research-area-hierarchical-world-models.md`.

## Why this area (tie to the query)

The original query asks for a HIERARCHICAL world model, and the WAM survey names "hierarchical
world-action modeling, connecting high-level semantic decomposition to low-level physical
prediction" an open challenge. This lane surveys the research field that studies temporal
abstraction and hierarchy in RL and world models, so the project's 4-layer stack has an
academic footing (not just a project-local invention).

## What to nail down (source-backed, taught plainly)

- Define: temporal abstraction, the options framework (a "skill" = option = policy + termination),
  semi-MDP, subgoal, manager/worker (feudal) hierarchy, skill discovery, hierarchical planning.
- The genealogy: options -> feudal RL -> modern deep HRL -> hierarchical world models (planning a
  subgoal in a learned latent, then acting). What each fixed.
- How hierarchy interacts with world models specifically: planning at multiple temporal
  resolutions, subgoal-conditioned prediction, long-horizon credit assignment.
- Honest maturity: HRL is powerful but notoriously finicky (subgoal/skill discovery is unsolved);
  say so.

## Seed sources (verify IDs before fetching)

- Options framework: Sutton, Precup, Singh 1999 "Between MDPs and semi-MDPs" (no arXiv; docs-level
  canonical reference). Feudal RL: Dayan and Hinton 1993 (docs). FeUdal Networks 1703.01161.
- Option-Critic 1609.05140; HIRO (data-efficient HRL) 1805.08296; HAC (hierarchical actor-critic)
  1712.00948 (verify).
- Director, "Deep Hierarchical Planning from Pixels" 2206.04114 (Hafner; a hierarchical world-model
  agent that picks subgoals in a learned latent, deep-read this one).
- Skill discovery: DIAYN 1802.06070; option discovery / VIC; LSP or successor options (verify).
- LLM task decomposition / hierarchical planning as the "high-level semantic" layer (one or two
  representative works; tie to the survey's hierarchical-WAM challenge). Cite the existing
  `wam-foundations.md` and `wam-training-evaluation-and-open-problems.md` for the survey's open
  challenge rather than re-deriving it.

## Layer tie and deliverable

Maps mainly to the Institutional/Settlement layer (long-horizon routines, post-goal continuation)
and the cross-layer dependency (physical subgoals under social goals). In the theme file, give the
4-layer mapping and a closing "relevance to the original query": how temporal abstraction would let
an advisory WAM reason about multi-cycle social/settlement horizons, and what is mechanically
useful (subgoal-conditioned prediction, the options vocabulary) vs research contribution.

Write: the theme file, by-paper notes for your cornerstones (Director at minimum; FeUdal Networks,
Option-Critic, HIRO, DIAYN as apt), the manifest + search-log fragments, and the lane brief
`notes/subagent-briefs/lane-12-hierarchical-world-models.md`. Tag rows `world-model`, `wam`,
`institutional-wam` as apt.
