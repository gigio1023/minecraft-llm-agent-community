# Claude Code Repo Guidance

`AGENTS.md` is the binding authority for this repository. This file exists so
Claude Code sessions see the same operating rules quickly. If this file and
`AGENTS.md` disagree, follow `AGENTS.md` and update this file only when the user
has approved an operating-rule change.

## Read First

1. `SPEC.md`
2. `AGENTS.md`
3. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
4. `docs/blog-doc/Documentation-Map.md`
5. `docs/blog-doc/Agent-Search-Index.md`
6. `docs/blog-doc/Terminology.md`
7. `docs/blog-doc/Architecture/Actor-Persistent-State-And-PlanBeads.md`
8. `docs/blog-doc/Architecture/PlanBeads-Implementation-Campaign.md`

## Project Direction

This repo is not a generic Minecraft bot benchmark, Voyager clone, or
house-building architecture. It is a bounded, observable headless Minecraft
runtime for a Soul-grounded social simulation seed.

Provider output proposes `CycleGoal`, `ActionIntent`, and `CycleJudgment`.
Runtime code owns Minecraft truth: schema validation, structured args,
permission gates, Mineflayer execution, verifier evidence, artifacts, actor
workspace state, and provider usage records.

Do not turn one domain activity, such as shelter, mining, storage, travel, or
conversation, into always-on architecture. Improve autonomy substrate:
`action_surface`, hooks, gates, diagnostics, context compaction, verification,
and review artifacts.

## PlanBeads Intent

PlanBeads are not a planning ritual. They are structured actor-owned work state
for concerns the LLM actor would otherwise forget or blur in free-form prose.

Use PlanBeads to make actor behavior more flexible, not less. A good PlanBeads
implementation lets the NPC keep concern A open when concern B appears, link or
defer work honestly, and choose a CycleGoal from current observation plus the
ready front without becoming a checklist executor.

Do not over-rotate this slice into verification for its own sake. Verification
must catch silent errors, fake completion, and progress laundering, but the main
purpose is state continuity under changing Minecraft/social context.

Treat it as a failure if PlanBeads make the actor spend more time maintaining
beads than acting, or if they grant executable authority. PlanBeads never supply
missing primitive args, action permissions, physical success, or retry-constraint
clearance.

## Karpathy Guidelines

Search token: `KARPATHY_GUIDELINES`.

Use these rules for coding, research, review, refactoring, and planning. They are
adapted from the repo's `AGENTS.md` guidance and the user-provided
MIT-licensed `karpathy-guidelines` note.

### Think Before Coding

- State assumptions, change boundary, and success criteria before non-trivial
  edits.
- If several interpretations exist, name them instead of silently choosing.
- Resolve uncertainty from repo context first. Ask only when a risky assumption
  would change direction, auth, cost, platform setup, or data.
- For research, separate what a reference teaches mechanically from how this
  repo should adapt it under Soul/LifeGoal and runtime-evidence rules.

### Simplicity First

- Write the minimum code that solves the current request.
- Do not add speculative features, abstractions, provider paths, action skills,
  config, or domain strategy.
- Prefer direct typed modules and clear ownership boundaries over framework-like
  generalization.

### Surgical Changes

- Touch only files required by the user request and required alignment.
- Do not refactor adjacent code or rewrite style unless the current change needs
  it.
- Remove only dead code that your own change created. Mention unrelated cleanup
  separately.
- Every changed line should trace to the request, a blocker, or a repo rule.

### Goal-Driven Execution

- Convert tasks into verifiable outcomes before implementing.
- For multi-step work, keep a short plan and verify each material step.
- If verification cannot run, record the exact command, platform, provider,
  artifact path, and failure mode.
- Prefer real runtime artifacts for behavior: reports, helper events, verifier
  output, actor workspace files, transcript, and provider usage records.

## Review Style

When reviewing, lead with findings. Use file and line references where possible.
Classify issues by real risk: runtime truth, fake progress, provider authority,
artifact evidence, platform/auth/cost blockers, stale docs, and terminology
drift.

For this repo, "it works" means artifacts can explain what happened. Provider
text, memory notes, animation, or movement without verifier-backed evidence are
not enough.

## Platform And Cost

This repo moves between Apple Silicon macOS and Linux ARM. Check platform before
Docker, native dependency, Java/Minecraft server, file watcher, shell, port, or
auth-flow work.

Live provider calls must be explicit and usage-guarded. Do not use costly
OpenAI API paths for tests unless the user selected that provider/model and the
budget state is known. Prefer the configured lightweight Gemini/Gemma path when
the task calls for live provider checks.

## Documentation Boundary

Docusaurus-exposed documentation pages live under `docs/blog-doc/`. Despite the
directory name, this is the public docs source, not a blog-post folder.

Do not add new public docs under `docs/docs/`. Do not put ordinary
documentation, specs, architecture notes, setup guides, handoffs, reviews, or
research notes under `docs/blog/`. `docs/blog/` is only for explicitly requested
chronological blog posts.

Repo-internal review and agent-operation docs live at the project root when they
guide direct branch review. Historical research, old public plans, and raw paper
dumps live under `docs/research-archive/`. Do not move archived research back
into public navigation unless an active spec or handoff explicitly promotes it.
