# Lane 15 (G4): Computational Theory of Mind, opponent/agent modeling, and emergent norms

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum-wave3.md`
first. You are Lane 15. Manifest fragment: `raw-search-results/lane-15-manifest.jsonl`.
Owned theme: `notes/by-theme/research-area-theory-of-mind-and-agent-modeling.md`.

## Why this area (tie to the query)

The social layer requires predicting OTHER agents: what they want, believe, will do, and how a
social action changes the relationship. GovSim found the ability to model others correlates r=0.83
with survival. This is the COMPUTATIONAL research field of theory of mind (ToM), opponent/agent
modeling, and emergent norms/conventions in multi-agent systems. The wave-1 sociology theme covers
human social THEORY (Goffman, Ostrom); the social-sim theme covers generative-agent DIALOGUE. Neither
surveys the computational modeling-of-other-agents field. That is this lane.

## What to nail down (source-backed, taught plainly)

- Define: theory of mind (modeling others' hidden mental states), opponent/agent modeling (predicting
  another agent's policy), belief modeling, recursive reasoning (I think that you think...), emergent
  norm/convention (a behavior regularity that arises without central design).
- Threads: (a) machine ToM and ToM in LLMs (can models attribute beliefs; benchmarks and critiques);
  (b) opponent/agent modeling in multi-agent RL; (c) emergent norms/conventions and social influence
  in MARL.
- Honest maturity: LLM ToM claims are contested (be balanced; cite the failure-mode critiques).

## Seed sources (verify IDs before fetching)

- Machine ToM: "Machine Theory of Mind" Rabinowitz 2018 1802.07740 (deep-read). ToM in LLMs: a
  benchmark/critique pair, e.g. FANToM 2310.15421 (verify), ToMi (verify), and a "ToM emerged"-vs-
  "it is fragile" pair so the treatment is balanced.
- Opponent/agent modeling: a survey of agent modeling in MARL (Albrecht and Stone 1709.08071, verify,
  deep-read); LOLA "Learning with Opponent-Learning Awareness" 1709.04326 (verify).
- Emergent norms/conventions: emergent social conventions in MARL (verify a representative work);
  social influence as intrinsic motivation 1810.08647 (verify); cite GovSim
  (`2404.16698-govsim.md`) and the public-sanction norm model (`2106.09012-norms-from-public-sanctions.md`)
  as existing, do not rewrite them.

## Layer tie and deliverable

Maps to the Social layer (predicting others, trust, reputation) and Institutional layer (emergent
norms/conventions). In the theme file give the 4-layer mapping and a closing "relevance to the
original query": how modeling other agents is the prediction the Social WAM needs (GovSim's r=0.83),
with mechanically-useful (the agent-modeling framing, the ToM-benchmark caution) vs research-
contribution split, and a clear caveat that LLM ToM is contested.

Write: the theme file, by-paper notes for cornerstones (Machine ToM + an agent-modeling survey at
minimum), manifest + search-log fragments, lane brief
`notes/subagent-briefs/lane-15-theory-of-mind-and-agent-modeling.md`. Tag rows `social-wam`,
`institutional-wam`, `validity` as apt.
