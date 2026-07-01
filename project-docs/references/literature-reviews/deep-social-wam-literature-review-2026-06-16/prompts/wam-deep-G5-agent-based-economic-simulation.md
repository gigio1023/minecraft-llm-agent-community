# Lane 16 (G5): Agent-based economic simulation and computational social science

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum-wave3.md`
first. You are Lane 16. Manifest fragment: `raw-search-results/lane-16-manifest.jsonl`.
Owned theme: `notes/by-theme/research-area-agent-based-economic-simulation.md`.

## Why this area (tie to the query)

The material/economic layer (possession, scarcity, claims, exchange, commons, costs to others) has a
whole research field behind it: agent-based computational economics (ACE) and computational social
science, now increasingly with LLM agents. The wave-1 themes cover game-theoretic LLM evaluation
(GLEE) and the GM-driven social sim (Concordia), but not the ABM / computational-economics research
area. That is this lane.

## What to nail down (source-backed, taught plainly)

- Define: agent-based model (ABM), agent-based computational economics (ACE), emergence (macro
  patterns from micro rules), mechanism design, resource economy / commons.
- Threads: (a) classic ABM (Sugarscape: agents, resources, trade, emergent inequality); (b) learned
  economic policy (the AI Economist: RL agents + a social planner); (c) LLM-driven economic / market
  simulation and large-scale generative ABM.
- Honest maturity: ABM is decades-mature but validity/calibration is the perennial hard problem
  (cite `benchmark-validity-and-evaluation.md` and `project-sid-critical-review.md` on overclaim, do
  not redo them). Be cautious about "emergent economy" claims.

## Seed sources (verify IDs before fetching)

- Classic ABM: Epstein and Axtell 1996 "Growing Artificial Societies" / Sugarscape (book, docs-level);
  Schelling segregation (docs) as the canonical emergence example.
- Learned economics: "The AI Economist" 2004.13332 (deep-read); follow-up foundation-model AI
  Economist (verify).
- LLM economic / market simulation: EconAgent 2310.10436 (verify, deep-read); generative agent-based
  modeling / "Generative Agent-Based Models" (verify); a large-scale LLM-society simulation work
  (verify). Cite GLEE (`2410.05254-glee.md`) and Concordia (`2312.03664-concordia.md`) as existing.

## Layer tie and deliverable

Maps mainly to the Material/economic layer (possession, exchange, scarcity, commons) and the
Institutional layer (emergent market/governance patterns). In the theme file give the 4-layer mapping
and a closing "relevance to the original query": how ABM/ACE is the precedent for predicting
material-economy consequences of actions, what is mechanically useful (the possession/exchange/commons
modeling vocabulary, the calibration-and-validity discipline) vs research contribution (none of these
grounds the economy in a verified embodied Minecraft runtime), with an explicit overclaim caveat.

Write: the theme file, by-paper notes for cornerstones (AI Economist + one LLM economic-sim work at
minimum), manifest + search-log fragments, lane brief
`notes/subagent-briefs/lane-16-agent-based-economic-simulation.md`. Tag rows `material-wam`,
`institutional-wam`, `validity`, `social-wam` as apt.
