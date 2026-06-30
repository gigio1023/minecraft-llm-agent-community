# Lane 28 (I5): Automated design of agentic systems and prompt/workflow optimization

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave5.md`. This brief layers scope on top.

## Area
Self-improvement aimed at the AGENT itself: automatically designing or optimizing an agent's prompts,
tool-use workflow, and multi-agent architecture, scored on task performance. Central question: can a
system search over agent designs (prompts, graphs, workflows) and find better agents than humans hand-
build, and is the gain robust or overfit to the eval?

## Seeds (verify ids before fetching)
- ADAS, Automated Design of Agentic Systems (Hu et al, 2408.08435): a meta-agent programs new agents
  in code, building an archive (Meta Agent Search).
- AFlow (Zhang et al, 2410.10762): MCTS over agentic-workflow code. GPTSwarm (Zhuge et al, 2402.16823):
  agents as optimizable graphs.
- Prompt optimization: APE (Zhou et al, 2211.01910), OPRO (Yang et al, 2309.03409, LLMs as
  optimizers), PromptBreeder (Fernando et al, 2309.16797), DSPy (Khattab et al, 2310.03714) and its
  optimizers (MIPRO). Verify each id.
- Verify-then-add: EvoPrompt, AgentSquare, Meta-agent search variants, automated-prompt-optimization
  surveys.

## Owned deliverables
- Theme: `notes/by-theme/research-area-automated-agent-and-prompt-design.md`.
- by-paper notes (at least ADAS, AFlow or GPTSwarm, OPRO or DSPy).
- `raw-search-results/lane-28-manifest.jsonl`, `raw-search-results/lane-28-search-log.md`,
  `notes/subagent-briefs/lane-28-automated-agent-and-prompt-design.md`.

## Deconflict
- H1 owns self-improvement loops in general; H3 owns reward/skill code. You own automating the
  AGENT'S architecture, workflow, and prompts (the agent improves the agent). Cite, do not redo.

## WAM tie + thesis
This is the most directly transferable wave-5 area: the repo's actor IS an LLM tool-use agent with
prompts and a workflow, so ADAS/AFlow/OPRO-style optimization could tune the Actor Turn prompts or the
advisory-WAM prompts. Land the tie and the bound together: optimization is only as honest as the score
it optimizes, so prompt/agent search MUST be scored by the runtime verifier on held-out scenarios, not
by an LLM judge or training-set accuracy, or it overfits the eval (the recurring failure across these
papers). Keep advisory: an auto-designed prompt or workflow is proposed and verifier-gated, never self-
promoted.
