# Lane 24 (I1): Coding-agent autoresearch (the digital phenomenon) and ML/SWE engineering agents

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave5.md`. This brief layers scope on top.

## Area
The DIGITAL form of autoresearch: a coding agent (Codex-style) given a goal, a codebase, and a
verifier, that iterates code edits and experiments to improve a metric, often as a Git-coordinated
team. This is the phenomenon ENPIRE extends to robots. Central question: when a frontier coding
agent is the research engine, what does it actually improve, how is it scored, and how real are the
gains (capability vs contamination)?

## Seeds (verify ids before fetching)
- Karpathy autoresearch: `github.com/karpathy/autoresearch` (the term origin; "AI agents running
  research on single-GPU nanochat training automatically"). No arXiv; log as repo/docs. The anchor
  `notes/by-paper/enpire.md` is the physical extension; cite it.
- MLE-bench: 2410.07095 (OpenAI; ML-engineering agents on Kaggle). RE-Bench: verify (METR,
  human-anchored ML research engineering). SWE-bench: 2310.06770 (real GitHub issues; ENPIRE ref 21
  notes contamination caution).
- AIDE (Weco AI, ML-engineering agent, tree search over solutions): verify id.
- AgentRxiv: 2503.18102 (collaborative autonomous research across agents). Agent Laboratory:
  verify (Schmidgall et al, EMNLP 2025). AgentRxiv/Agent-Laboratory connect to H2; here keep the
  coding-agent-as-engineer lens.
- A multi-agent system for automating scientific discovery (Nature 2026, ENPIRE ref 16): abstract.
- Verify-then-add: MLGym, MLAgentBench, OpenHands/Devin-style SWE agents, the "agent-computer
  interface" framing, PaperBench.

## Owned deliverables
- Theme: `notes/by-theme/research-area-coding-agent-autoresearch.md`.
- by-paper notes (at least MLE-bench, SWE-bench, one of AgentRxiv/RE-Bench, the Karpathy repo).
- `raw-search-results/lane-24-manifest.jsonl`, `raw-search-results/lane-24-search-log.md`,
  `notes/subagent-briefs/lane-24-coding-agent-autoresearch.md`.

## Deconflict
- H1 (lane 18) owns the loop engineering (ENPIRE/DGM/SAIL); H2 (lane 19) owns paper-writing science.
  You own the DIGITAL coding-agent-as-ML/SWE-engineer phenomenon, its benchmarks (MLE/RE/SWE-bench),
  the Karpathy autoresearch lineage, and Git-coordinated multi-agent research. Cite, do not redo H1/H2.

## WAM tie + thesis
ENPIRE's autoresearch prompt fans out a Git-coordinated subagent team; the digital precedents show
what that team can and cannot reliably do. Land two points: (1) gains are trustworthy only against a
clean external metric (Kaggle grader, hidden tests), and benchmarks warn that headline gains can
reflect contamination (SWE-bench) not capability, which maps to the repo's "verifier owns truth"
rule. (2) For this repo the coding agent's "research" target is the advisory-WAM predictor, prompts,
or gated skills, scored by the runtime verifier, not by the agent.
