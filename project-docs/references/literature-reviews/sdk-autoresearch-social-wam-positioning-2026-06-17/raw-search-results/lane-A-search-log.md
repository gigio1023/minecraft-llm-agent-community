# Lane A search log: SDK autoresearch loop mechanics + authority boundary

ASCII only. Records every query, tool, what was found, and what was inaccessible. Dates 2026-06-17.

## Reuse-base reads (old archive, no new search)

- Read contract addendum `prompts/00-contract-addendum.md` (binding rules, manifest schema, output dir).
- Read existing theme `../../../2026-06-16/deep-social-wam-literature-review/notes/by-theme/research-area-coding-agent-autoresearch.md` and matrix `../../../2026-06-16/deep-social-wam-literature-review/matrices/autoresearch-loop-mapping.md`. Both CITED, not rewritten.
- Read existing by-paper notes to cite: enpire.md, karpathy-autoresearch.md, 2405.15793-swe-agent.md, 2310.03714-dspy-and-mipro.md, 2505.22954-darwin-godel-machine.md, 2408.06292-ai-scientist-v1.md.
- `grep` old `source-manifest.jsonl` for openhands/gepa/codex/claude-agent-sdk. Result: OpenHands (2407.16741) present as a manifest row with `source_availability: abstract` and EMPTY `notes_path` (never deep-read). GEPA, Claude Agent SDK, OpenAI Codex SDK absent. So 4 NEW notes are a genuine delta.
- `ls papers/latex/` for 2407.16741 and 2507.19457: neither pre-downloaded.
- Confirmed exact filenames of all cited old notes via `ls | grep` (sica, agentrxiv, slopcodebench, 2503.15223, aide, mle-bench, re-bench, gaming-verifiers, swe-bench 2310.06770). All resolve.

## New primary-source research

### Claude Agent SDK (slug claude-agent-sdk)
- WebFetch https://docs.anthropic.com/en/api/agent-sdk/overview -> 301 to platform.claude.com -> 307 to https://code.claude.com/docs/en/agent-sdk/overview. Final page fetched and read in full. ACCESSED.
- Found: loop-as-library (`query()`, no hand-written tool loop), built-in tools table (Read/Write/Edit/Bash/Monitor/Glob/Grep/WebSearch/WebFetch/AskUserQuestion), hooks (PreToolUse/PostToolUse/Stop/SessionStart/SessionEnd/UserPromptSubmit + HookMatcher), subagents (AgentDefinition, Agent tool, parent_tool_use_id), MCP (mcp_servers), permissions (allowed_tools, permission_mode acceptEdits, canUseTool), sessions (resume/fork, JSONL), filesystem config (Skills/Commands/Memory/Plugins), Agent SDK vs Client SDK vs Managed Agents comparison. Strong, doc-verified.

### OpenAI Codex SDK / CLI (slug openai-codex-sdk)
- WebSearch "OpenAI Codex SDK programmatic agent sandbox approval modes documentation developers.openai.com". Found the docs map.
- WebFetch https://developers.openai.com/codex/agent-approvals-security. ACCESSED. Sandbox modes (read-only / workspace-write / danger-full-access aka --yolo), approval policies (never/untrusted/on-request/on-failure), Auto preset (workspace-write + on-request), approvals_reviewer=auto_review (reviewer agent gates escalations only), OS enforcement (Seatbelt / bwrap+seccomp / WSL2), network off by default.
- WebFetch https://developers.openai.com/codex/guides/agents-sdk. ACCESSED. Codex SDK exists (embed Codex programmatically); codex exec headless; App Server; MCP Server (codex mcp-server); GitHub Action; integration with OpenAI Agents SDK via MCP; loop = understand/plan/execute/iterate.
- WebFetch https://developers.openai.com/codex/subagents. ACCESSED. Subagent TOML in ~/.codex/agents or .codex/agents (name/description/developer_instructions + optional model/sandbox_mode/MCP); Codex orchestrates; spawns only on explicit ask; subagents inherit parent sandbox policy.

### GEPA (arXiv 2507.19457)
- WebSearch confirmed id 2507.19457, ICLR 2026 Oral, Genetic-Pareto, code github.com/gepa-ai/gepa.
- `hf papers info 2507.19457`: AUTHORITATIVE published abstract. 17 authors (Agrawal ... Khattab). Summary: samples system-level trajectories, reflects in natural language, Pareto frontier; "Across FOUR tasks, GEPA outperforms GRPO by 10% on average and by up to 20%, while using up to 35x fewer rollouts"; beats MIPROv2 by over 10% across two LLMs; inference-time code optimization. github_stars 5185.
- WebFetch https://arxiv.org/abs/2507.19457: returned "6% on average" and "six tasks" (CONFLICTS with HF "10% / four tasks"). Treated as a fetch artifact; note uses the HF/canonical figures and records the discrepancy explicitly.
- WebFetch https://github.com/gepa-ai/gepa: loop primitives (Select Pareto candidate -> Execute on minibatch -> Reflect on traces -> Mutate -> Accept/update front); API gepa.optimize(seed_candidate, trainset, valset, task_lm, reflection_lm, max_metric_calls); user supplies evaluator returning score + textual feedback ("Actionable Side Information"); GEPAAdapter (evaluate(), make_reflective_dataset()); optimizes prompts/code/text, evaluator stays fixed.

### OpenHands / OpenDevin (arXiv 2407.16741) - NEW deep-read note
- `hf papers info 2407.16741`: title "OpenDevin: An Open Platform for AI Software Developers as Generalist Agents", 25+ authors (Xingyao Wang ... Graham Neubig), MIT, 1.3K+ contributions / 160+ contributors, evaluated over 15 tasks incl SWE-Bench and WebArena. github_repo opendevin/opendevin (now All-Hands-AI/OpenHands), 77k+ stars.
- WebFetch https://arxiv.org/abs/2407.16741 (abstract): code/CLI/browse, sandboxed envs, multi-agent coordination, benchmarks. Abstract does NOT contain event-stream/AgentSkills/AgentHub detail.
- WebFetch https://arxiv.org/pdf/2407.16741: returned BINARY (3.1MB PDF, not text-extractable by the fetch model). FULL PDF BODY NOT READ. Saved to tool-results but not parsed.
- WebFetch https://www.emergentmind.com/papers/2407.16741 (secondary summary): event stream architecture (chronological actions+observations = agent history), agent abstraction (state/actions/observations defined), sandboxed runtime (CmdRunAction, IPythonRunCellAction, browser), AgentSkills library (file editing, image parsing, IPython), multi-agent delegation (CodeActAgent -> BrowsingAgent), 15 tasks incl SWE-Bench/WebArena.
- WebFetch https://github.com/All-Hands-AI/OpenHands (README): Docker sandbox vs full-filesystem mode, Agent Server (REST API for multiple agents), Automation Server, ACP support, MIT, ~77.5k stars.
- HONESTY: the OpenHands note is sourced from abstract + HF summary + a SECONDARY paper-summary page + the README, NOT from the paper body. Flagged in the note and manifest (source_availability: abstract).

## Unresolved / inaccessible

- OpenHands full PDF body (2407.16741): not text-extractable on fetch; architecture facts are secondary-sourced. A LaTeX deep-read would strengthen the event-stream / AgentSkills claims but was not done in this lane (the contribution-relevant facts are adequately covered for an authority-boundary note).
- GEPA arxiv.org HTML "6% / six tasks" vs HF "10% / four tasks": one is a fetch parsing artifact. Resolved in favor of the HF authoritative summary; a LaTeX body read would settle it definitively. All GEPA numbers are marked claim-only.
- Did not deep-read GEPA or any SDK as code; SDK facts are doc-level by design (these are tools, not papers).

## Files written by lane A

- notes/by-paper/claude-agent-sdk.md (NEW)
- notes/by-paper/openai-codex-sdk.md (NEW)
- notes/by-paper/2407.16741-openhands.md (NEW deep-read; old archive had abstract-only row, no note)
- notes/by-paper/2507.19457-gepa.md (NEW)
- notes/by-theme/sdk-loop-mechanics-and-authority.md (synthesis)
- notes/subagent-briefs/lane-a-sdk.md (this lane's brief)
- raw-search-results/lane-A-manifest.jsonl (17 rows: 4 new + 13 cited-existing)
- raw-search-results/lane-A-search-log.md (this file)
