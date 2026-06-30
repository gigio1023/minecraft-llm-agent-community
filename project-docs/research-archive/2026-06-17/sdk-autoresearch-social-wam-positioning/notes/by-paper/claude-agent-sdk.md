# Claude Agent SDK (formerly Claude Code SDK) - the agent loop as a programmable library

- **title**: Claude Agent SDK (overview docs); SDK packages `claude-agent-sdk` (Python), `@anthropic-ai/claude-agent-sdk` (TypeScript)
- **authors/owner**: Anthropic
- **year**: 2025-2026 (renamed from "Claude Code SDK" to "Claude Agent SDK")
- **venue/source**: official docs, not a paper
- **arxiv_id**: none (SDK docs)
- **urls**: overview https://code.claude.com/docs/en/agent-sdk/overview (accessed 2026-06-17 via redirect chain docs.anthropic.com -> platform.claude.com -> code.claude.com; full page read) ; demos https://github.com/anthropics/claude-agent-sdk-demos ; Python repo https://github.com/anthropics/claude-agent-sdk-python ; TS repo https://github.com/anthropics/claude-agent-sdk-typescript
- **source availability**: docs (overview page fetched and read in full)

## What it EXPOSES as a programmable agent loop (loop primitives, doc-verified)

- **The loop itself is the product.** The docs state the SDK "gives you the same tools, agent loop, and context management that power Claude Code, programmable in Python and TypeScript." A `query(prompt, options)` call returns an async stream of messages while Claude autonomously reads files, runs commands, searches, and edits. The builder does NOT implement the tool-execution loop (contrast with the Anthropic Client SDK, where "you implement a tool loop" with a `while response.stop_reason == "tool_use"` cycle).
- **Built-in tools** (the action surface, doc table): `Read`, `Write`, `Edit`, `Bash`, `Monitor` (watch a background script, react to each output line as an event), `Glob`, `Grep`, `WebSearch`, `WebFetch`, `AskUserQuestion` (multiple-choice clarifying question).
- **Hooks** (deterministic lifecycle gates): "Run custom code at key points in the agent lifecycle... callback functions to validate, log, block, or transform agent behavior." Named hooks: `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`, and more. A `HookMatcher(matcher="Edit|Write", hooks=[...])` runs the callback only for matching tools. Hooks are plain code, so the gate decision is deterministic, not model-decided.
- **Subagents**: "Spawn specialized agents to handle focused subtasks." Defined via `AgentDefinition(description, prompt, tools=[...])`; invoked through the `Agent` tool (must be in `allowed_tools` to auto-approve). Subagent messages carry `parent_tool_use_id` for attribution.
- **MCP (Model Context Protocol)**: connect external systems (databases, browsers, APIs) via `mcp_servers={...}`.
- **Sessions**: context persists across exchanges; sessions can be resumed (`resume=session_id`) or forked to explore alternatives. Session state is JSONL on the filesystem.
- **Filesystem config**: Skills (`.claude/skills/*/SKILL.md`, model-invoked or `/name`), Commands, Memory (`CLAUDE.md`), Plugins (skills + agents + hooks + MCP). `setting_sources` restricts what loads.

## The permission / authority / safety model (doc-verified)

- **`allowed_tools` (allowedTools)**: explicit allowlist of tools the agent may use without prompting. A read-only agent passes `["Read", "Glob", "Grep"]` and "can analyze but not modify code." This is the primary capability boundary: the builder, not the model, decides which tools exist.
- **`permission_mode` (permissionMode)**: e.g. `acceptEdits`. Controls how edits/sensitive actions are approved.
- **Hooks as blocking gates**: a `PreToolUse` hook can BLOCK a tool call; `PostToolUse` can log/transform. This is deterministic, code-owned authority over the model's proposed action.
- **`canUseTool` callback / approval prompts and `AskUserQuestion`** (referenced, on the user-input page) for interactive approval of sensitive actions.
- **Authentication is operator-controlled**: API key, Bedrock, Vertex, Azure, Claude Platform on AWS. The docs explicitly forbid third parties offering claude.ai login for SDK-built agents without approval.
- **Agent SDK vs Managed Agents**: with the SDK the agent loop runs "inside your own process," works on "files on your infrastructure," and custom tools are "in-process Python or TypeScript functions." Managed Agents run on Anthropic infra in a managed sandbox per session.

## What a builder MAY improve vs what stays runtime-owned (interpretation, flagged)

- **Builder-improvable** (the autoresearch target surface): the system prompt / `CLAUDE.md` memory, the set of allowed tools (action surface), custom in-process tools, subagent definitions and their tool subsets, hook callbacks (the gates), skills, MCP server wiring, the per-call budget/options. These are exactly the SOFTWARE-not-weights surface SICA (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2504.15228-self-improving-coding-agent.md`) identifies as the safe improvable target.
- **Runtime-owned (fixed for the agent)**: the agent loop's control structure (the SDK runs gather-context -> act -> verify -> repeat; the model does not rewrite it), the tool-execution semantics, the permission enforcement (a `PreToolUse` block is not negotiable by the model), the deterministic outcome of a hook. A hook or `allowed_tools` boundary is code; the model cannot edit it from inside a turn.

## WAM-repo relevance (interpretation, flagged)

- This SDK is a near-exact match for the repo's stated architecture: "the LLM proposes; the runtime owns truth." `allowed_tools` is the repo's bounded typed tool surface; `PreToolUse` hooks are the repo's schema/permission/retry gates; subagents are the repo's reviewer/sidecar pattern; MCP is an external-state connector. The SDK is therefore a concrete TOOLING candidate for building the repo's autoresearch loop and its action_surface gates, NOT a research contribution.
- The mechanism to borrow: hooks-as-deterministic-gates and allowed-tools-as-capability-boundary are the SDK's enforcement of the same proposer/scorer separation the literature requires. The SDK does NOT supply a verifier or anti-gaming guard; the builder must add the deterministic runtime verifier as the success signal (the SDK will not score correctness for you).

## Mechanically useful vs research contribution

- **Mechanically useful**: the loop-as-library (no hand-written tool loop), hooks for deterministic PreToolUse/PostToolUse gating and audit logging, allowed-tools capability scoping, subagents with attribution, headless/programmatic operation for CI, session fork/resume for trial comparison.
- **Not a contribution to copy**: using the Claude Agent SDK to drive a Minecraft loop is a tooling choice, not a research result. The defensible work is what the loop IMPROVES and how it is SCORED, not which SDK runs it.
- **Honest bound**: the SDK enforces tool/permission boundaries but is agnostic about truth. It will happily run an agent that grades its own output if the builder wires it that way. The proposer/scorer separation must be designed in (deterministic verifier as the metric, verifier code outside the agent's editable surface), not assumed from the SDK.
