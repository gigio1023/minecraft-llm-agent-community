# OpenAI Codex SDK / Codex CLI - programmatic coding agent with a layered sandbox+approval model

- **title**: OpenAI Codex (CLI, SDK, App Server, MCP Server, GitHub Action); the agentic coding product
- **authors/owner**: OpenAI
- **year**: 2025-2026 (current docs)
- **venue/source**: official docs, not a paper
- **arxiv_id**: none (product docs)
- **urls**: agent approvals + security https://developers.openai.com/codex/agent-approvals-security (accessed 2026-06-17, read) ; sandbox https://developers.openai.com/codex/concepts/sandboxing ; subagents https://developers.openai.com/codex/subagents (accessed 2026-06-17, read) ; using Codex with the Agents SDK https://developers.openai.com/codex/guides/agents-sdk (accessed 2026-06-17, read) ; full docs https://developers.openai.com/codex/llms-full.txt
- **source availability**: docs (approvals/security, subagents, agents-sdk pages read; some structure inferred from doc navigation)

## What it EXPOSES as a programmable agent loop (loop primitives, doc-verified)

- **Programmatic surfaces**: a **Codex SDK** "for embedding Codex as a programmatic agent"; `codex exec` for non-interactive/headless runs (automation, CI); an **App Server** (server-mode); an **MCP Server** (`codex mcp-server`, exposes Codex as a Model Context Protocol server so other MCP clients, e.g. an OpenAI Agents SDK agent, can drive it); a **GitHub Action** for CI/CD.
- **Loop shape** (doc structure): understand (read codebase context) -> plan -> execute (edits + shell commands) -> iterate (verify results, refine), repeating across turns and agent hand-offs. Same gather-act-verify-repeat shape as the Claude Agent SDK and Karpathy autoresearch (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/karpathy-autoresearch.md`).
- **Subagents**: "spawning specialized agents in parallel and then collecting their results in one response." Defined as standalone TOML files in `~/.codex/agents/` (personal) or `.codex/agents/` (project), with required `name`, `description`, `developer_instructions` and optional `model`, `sandbox_mode`, MCP-server overrides. Codex "handles orchestration across agents, including spawning new subagents, routing follow-up instructions, waiting for results, and closing agent threads," but "only spawns a new agent when you explicitly ask it to."
- **Relationship to the OpenAI Agents SDK**: orchestration framework (Agents SDK) drives Codex as a specialized execution engine through MCP; supports multi-agent hand-offs and tracing.

## The authority / safety model (doc-verified, the lane's main reason to cite Codex)

Codex separates two orthogonal axes: SANDBOX (what is technically possible) and APPROVAL (when a human is asked). This is a cleaner separation of the same idea the repo enforces: the runtime decides what is reachable, not the model's intent.

- **Sandbox modes**:
    - `read-only`: can read and answer; needs approval to edit, run commands, or access network.
    - `workspace-write`: read/edit inside the current working directory; network access blocked by default.
    - `danger-full-access` (alias `--yolo`): no sandbox, no approvals (docs say "not recommended").
- **Approval policy modes**: `never` (no prompting), `untrusted` (only known-safe read operations run automatically; state-mutating or external-execution commands need approval), `on-request` (prompts before sandbox escalation, network, or destructive actions), `on-failure` (referenced).
- **Recommended low-risk preset ("Auto")**: `sandbox_mode = "workspace-write"` + `approval_policy = "on-request"` -> Codex reads/edits/runs in the workspace, asks before editing outside the workspace or accessing network. Full access = `danger-full-access` + `never`.
- **`approvals_reviewer = "auto_review"`**: routes eligible approval requests through a REVIEWER AGENT instead of the human, but only for "actions that already need approval, such as sandbox escalations, blocked network requests... or side-effecting app and MCP tool calls." The reviewer gates escalations, not core scoring.
- **OS-level enforcement**: macOS Seatbelt; Linux `bwrap` + `seccomp`; Windows WSL2 or native sandbox. Network OFF by default. Subagents "inherit your current sandbox policy"; Codex "reapplies the parent turn's live runtime overrides when it spawns a child."

## What a builder MAY improve vs what stays runtime-owned (interpretation, flagged)

- **Builder-improvable**: prompts/`developer_instructions`, subagent definitions (TOML), which MCP tools are wired, the model per subagent, the chosen sandbox/approval preset for a task, the headless invocation in CI. As with the Claude SDK, this is the SOFTWARE surface, not the model weights.
- **Runtime-owned / fixed for the agent**: the OS-level sandbox boundary (filesystem write scope, network off), the approval-policy enforcement, the loop control structure. The agent cannot widen its own sandbox from inside a turn; escalation requires an approval (human or the reviewer agent), which is the structural deny that DGM (`../../../../2026-06-16/deep-social-wam-literature-review/notes/by-paper/2505.22954-darwin-godel-machine.md`) shows you must keep outside the improved agent's reach.

## WAM-repo relevance (interpretation, flagged)

- Codex's sandbox-vs-approval split is the clearest off-the-shelf model for the repo's two-part authority boundary: a technical capability gate (what tools/actions reach the world) and a separate escalation gate (when something beyond the default boundary needs sign-off). Mapping to the repo: `workspace-write` is the analog of "the loop may edit advisory-WAM/prompt/skill code in a sandbox"; `network off` / `approval for escalation` is the analog of "the loop may not touch Minecraft physical truth, scoring, or obligation closure without a human gate."
- `approvals_reviewer=auto_review` is a CAUTION as much as a tool: a reviewer AGENT gating escalations is convenient but is still an LLM in the trust path; the repo's rule keeps the deterministic verifier (not an LLM reviewer) as the success scorer, using an LLM reviewer at most for advisory escalation triage, never for success labeling.

## Mechanically useful vs research contribution

- **Mechanically useful**: the sandbox/approval two-axis model as a ready template for the repo's authority boundary; `codex exec` headless mode for fixed-budget CI trials; subagent TOML definitions with per-agent sandbox overrides; MCP-server mode to drive Codex from an orchestration layer; OS-level sandbox enforcement (Seatbelt/bwrap/seccomp) as the enforcement layer the repo's gates conceptually need.
- **Not a contribution to copy**: "Codex for Minecraft" is a tooling choice. The contribution question is unchanged: what does the loop improve and who scores it.
- **Honest bound**: Codex enforces reachability and escalation, not correctness. Like the Claude SDK it supplies no verifier and no anti-gaming guard; `danger-full-access` exists and removes all gates. The proposer/scorer separation and the deterministic verifier must be added by the repo; the SDK gives the enforcement primitives, not the truth signal.
