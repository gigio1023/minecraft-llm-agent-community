# Lane 17 (G6): Long-horizon agent memory, and learned verifiers / reward models

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum-wave3.md`
first. You are Lane 17. Manifest fragment: `raw-search-results/lane-17-manifest.jsonl`.
Owned theme: `notes/by-theme/research-area-memory-and-verifiers.md`.

## Why this area (tie to the query)

Two research fields the query and the project's design lean on but that the wave-1/2 files do not
survey as fields:
- Memory: the query names "memory" explicitly (memory commitments, obligations remembered across
  cycles). What is the research area of long-horizon agent memory?
- Verifiers / reward models: the project's WAM is ADVISORY, which is exactly the FFDC verifier role
  (predict expected state, compare to evidence, signal trust). What is the research area of LEARNED
  verifiers and reward/judge models? This is the academic footing for "advisory predictor scored
  against evidence."

## What to nail down (source-backed, taught plainly)

Part A, agent memory:
- Define: episodic vs semantic memory, retrieval-augmented agent, memory stream, reflection,
  working vs long-term memory, context vs external memory.
- Threads: generative-agent memory (cite `2304.03442-generative-agents.md`, do not rewrite),
  external/long-term memory systems for LLM agents, retrieval and memory management.

Part B, verifiers and reward models:
- Define: outcome vs process reward model (ORM/PRM), generative verifier, LLM-as-judge, self-
  verification, the generator-verifier gap.
- Threads: process supervision, generative verifiers, LLM-as-judge and its known biases, verifiers
  for agents. Tie to the project's advisory-WAM = FFDC verifier framing (cite
  `2605.06222-when-to-trust-imagination.md` and `vla-and-the-wam-vs-vla-distinction.md`).

## Seed sources (verify IDs before fetching)

- Memory: MemGPT 2310.08560 (deep-read); a long-term-memory agent survey (verify); A-MEM or
  generative-agent memory follow-ups (verify); cite Generative Agents (2304.03442) and Concordia
  memory (`2312.03664-concordia.md`) as existing.
- Verifiers/reward: "Let's Verify Step by Step" (process reward) 2305.20050 (deep-read); generative
  verifiers / GenRM (verify); "Judging LLM-as-a-Judge" (MT-Bench / Chatbot Arena) 2306.05685
  (verify, for the LLM-judge biases the project must avoid); a verifier/self-verification work
  (verify). Cross-link `benchmark-validity-and-evaluation.md` on LLM-judge unreliability.

## Layer tie and deliverable

Memory ties to the Social and Institutional layers (remembered obligations, routines persisting
across cycles). Verifiers tie to the cross-layer advisory mechanism (the WAM-as-evaluator scored
against runtime evidence). In the theme file give the 4-layer mapping and a closing "relevance to the
original query": how external memory realizes "memory commitments" and how the verifier/reward-model
field is the academic home of the advisory-WAM-scored-against-evidence design, with mechanically-useful
vs research-contribution split, and the explicit caution (from the validity theme) that an LLM judge
must not be the primary social score.

Write: the theme file, by-paper notes for cornerstones (MemGPT + "Let's Verify Step by Step" at
minimum), manifest + search-log fragments, lane brief
`notes/subagent-briefs/lane-17-memory-and-verifiers.md`. Tag rows `social-wam`, `institutional-wam`,
`validity`, `data` as apt.
