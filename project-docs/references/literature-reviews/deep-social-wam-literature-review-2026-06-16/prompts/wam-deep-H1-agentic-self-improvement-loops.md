# Lane 18 (H1): Agentic self-improvement loops (the autoresearch loop itself)

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave4.md`. This brief layers scope on top.

## Area
The ENPIRE-class loop itself: systems where an agent (often a coding agent) iterates
reset, act/rollout, verify, analyze, rewrite/refine, autonomously improving a policy or itself.
Central question: what makes a real-world self-improvement loop converge instead of stagnate or
game its own metric? Cover loop architecture, the role of the verified success signal,
fleet/parallelism, stagnation and collapse, and the proposer-vs-scorer separation.

## Anchor + seeds (verify ids before fetching)
- ENPIRE: `notes/by-paper/enpire.md` exists. Cite it as `enpire`; build the area around it.
- SAIL, Self-Adapting Improvement Loops for Robotic Learning: 2506.06658 (robot; a video model
  self-improves on self-collected trajectories).
- EvolveR, Self-Evolving LLM Agents through an Experience-Driven Lifecycle: 2510.16079.
- Bootstrapping Task Spaces for Self-Improvement (ExIt): 2509.04575 (autocurriculum RL for
  inference-time self-improvement).
- Q-Evolve, Self-evolving LLM agents with in-distribution Optimization: 2606.07367.
- MARS, Meta-cognitive Reflection for Efficient Self-Improvement: 2601.11974.
- Verify-then-add if real: Darwin Godel Machine / Godel Agent (self-modifying coding agent), a
  survey of self-evolving agents, SELF, and any "self-improvement collapse / model collapse"
  caution you can source.

## Owned deliverables
- Theme: `notes/by-theme/research-area-agentic-self-improvement-loops.md`.
- by-paper notes for your deep-reads (at least SAIL, EvolveR, ExIt, Q-Evolve).
- `raw-search-results/lane-18-manifest.jsonl`, `raw-search-results/lane-18-search-log.md`,
  `notes/subagent-briefs/lane-18-agentic-self-improvement-loops.md`.

## Deconflict
- H3 (lane 20) owns HOW the loop writes a change (reward/skill/code generation). Cite, do not cover.
- H5 (lane 22) owns the verifiable-reward THEORY and self-play signal. Cite, do not cover.
- H6 (lane 23) owns improving the WORLD MODEL specifically. You own policy/agent self-improvement.
- Cite wave-3 `research-area-memory-and-verifiers` for verifier mechanics.

## WAM tie to land
Map the loop modules to the repo cycle (scenario reset, Actor Turn, action, verifier, next cycle).
State plainly which parts of ENPIRE's loop the repo already has (the verifier auto-labels
`(state, action, next-state)` at near-$0), which it lacks (automatic clean reset for social
scenarios; fleet ops), and where the proposer-equals-scorer risk (progress laundering) bites in a
social world with no crisp 99% metric. Modest claims only.
