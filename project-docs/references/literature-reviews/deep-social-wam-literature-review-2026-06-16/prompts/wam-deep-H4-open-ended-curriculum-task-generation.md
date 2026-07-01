# Lane 21 (H4): Open-ended automated curriculum and task generation

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave4.md`. This brief layers scope on top.

## Area
What an autoresearch loop should attempt NEXT: methods that generate tasks, environments, or goals
and order them by learnability, including open-endedness and quality-diversity. Central question:
how do you keep generating new, solvable-but-not-trivial challenges so a system keeps improving
instead of saturating?

## Seeds (verify ids before fetching)
- POET: 1901.01753; Enhanced POET: 2003.08536 (paired open-ended trailblazer; co-evolve environment
  and agent).
- OMNI, Open-endedness via Models of human Notions of Interestingness: verify id (~2306.01711);
  OMNI-EPIC, programmable environments: verify id (~2405.15568).
- MAP-Elites: 1504.04909; one quality-diversity survey.
- Automatic curriculum learning survey (Portelas et al.): verify id (~2003.04664).
- Open-ended learning: DeepMind AdA / Human-Timescale Adaptation: verify id (~2301.07608). Cite
  MineDojo (wave-1) for the Minecraft task space; EXTEND, do not re-survey it.
- Verify-then-add: Eurekaverse, ACED, and open-endedness position pieces (Clune).

## Owned deliverables
- Theme: `notes/by-theme/research-area-open-ended-curriculum-and-task-generation.md`.
- by-paper notes (at least POET or Enhanced POET, OMNI or OMNI-EPIC, one ACL/QD source).
- `raw-search-results/lane-21-manifest.jsonl`, `raw-search-results/lane-21-search-log.md`,
  `notes/subagent-briefs/lane-21-open-ended-curriculum-task-generation.md`.

## Deconflict
- H3 owns reward/skill CODE generation; you own TASK/ENVIRONMENT/GOAL generation and ordering.
- Cite wave-1 `minecraft-agent-benchmarks` and `minecraft-multi-agent-social`; cite wave-3
  `research-area-agent-based-economic-simulation` for scenario design.

## WAM tie + thesis
The repo needs social-material SCENARIOS to probe (borrow/lend/return, weak-commons stress,
obligation under scarcity). Map open-ended task generation onto "auto-generate social-material
situations whose outcomes the verifier can score". Land the honest bound: interestingness in a
social world is hard to define and easy to game; a generated scenario is only useful if the verifier
can label its `(state, action, next-state)`. Tie to the repo's maturity ladder
(proto-social, organization, settlement, village, society) as a hand-authored curriculum spine the
loop can extend.
