# Claude Code Repo Guidance

`AGENTS.md` is the binding authority for this repository. This file exists so
Claude Code sessions see the same operating rules quickly. If this file and
`AGENTS.md` disagree, follow `AGENTS.md` and update this file only when the user
has approved an operating-rule change.

## Read First

1. `SPEC.md`
2. `AGENTS.md`
3. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
4. `project-docs/Documentation-Map.md`
5. `project-docs/Agent-Search-Index.md`
6. `project-docs/Terminology.md`
7. `project-docs/Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md`
8. `project-docs/Architecture/Actor-Persistent-State-And-PlanBeads.md`
9. `project-docs/Architecture/PlanBeads-Implementation-Campaign.md`
10. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`
11. `project-docs/Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`
12. `project-docs/Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md`
13. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`
14. `project-docs/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
15. `project-docs/Architecture/Minecraft-Basic-Guide.md`
16. `project-docs/Setup/Provider-Setup.md`
17. `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`

## Project Direction

This repo is not a generic Minecraft bot benchmark, Voyager clone, or
house-building architecture. It is a bounded, observable headless Minecraft
runtime for a Soul-grounded social simulation seed.

Provider output proposes goals, runtime actions, and judgments.
Runtime code owns Minecraft truth: schema validation, structured parameters,
permission gates, Mineflayer execution, verifier evidence, artifacts, actor
workspace state, and provider usage records.

Never implement runtime policy by parsing LLM-facing prose with string
`includes`, regexes, or keyword heuristics. `current_state_requirements`, Action
Card descriptions, `why_this_action`, Minecraft Basic Guide text, memory, and
PlanBeads are context, not executable authority. Tool calling plus strict
schemas/enums enforce flow; within a selected visible tool/action, the LLM keeps
decision freedom with full context and schema-bound logical parameters. Runtime
then validates explicit params, schema, permission, retry/safety, source guards,
timeouts, verifier/evidence, and artifacts.

`decision_frame` is context, not a planner output. Do not add
`parameter_candidates`, `top_eligible_action_cards`,
`recommended_next_action_candidates`, generated chat text, coordinates, recipe
decisions, or other pre-selected action payloads to it.

Do not turn one domain activity, such as shelter, mining, storage, travel, or
conversation, into always-on architecture. Improve autonomy substrate:
`action_surface`, hooks, gates, diagnostics, context compaction, verification,
and review artifacts.

Do not hide Action Cards or tools through hardcoded Minecraft heuristics such as
item-family, station-family, construction-readiness, survival-priority, or
shelter-first filters. If a tool should be hidden or rejected, express that with
typed readiness/eligibility contracts, structured state, schemas, gates, retry
constraints, or evidence. The runtime must not become a hidden Minecraft
planner. No compatibility or legacy compromise is required when removing prose
parsing or hidden domain-planner behavior.

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

CycleJudgment may carry raw PlanBead operation proposal candidates. A malformed
candidate should be rejected by the guarded PlanBead applier with an
operation-result artifact, not silently dropped by failing the whole judgment.

PlanBeads are Beads-inspired repo runtime state, not `bd`, `br`, `beads-mcp`,
`.beads`, or a downloaded binary dependency. Do not add external Beads CLI calls
to Minecraft actor state. Campaign work may use external task tools separately,
but NPC PlanBeads live under actor workspace JSON records.

## Action Skill Authoring

During social-cycle runtime, new Minecraft action skill creation starts only
from the action-selection stage. In Actor Turn mode, that means
`author_mineflayer_action`, which starts full-context generated Mineflayer
authoring and trial. The outer tool call carries detailed rationale and desired
behavior, not TypeScript source and not a lossy context summary. Background
reviewers, PlanBeads, async sidecars, and legacy generated-code importers may
review, patch, re-trial, reject, promote, retire, or supersede an existing
candidate, but they must not originate a new NPC action skill candidate.

Generated Mineflayer code is encouraged through that explicit author-and-trial
path, not as hidden background authority. The internal codegen provider receives
the full original Actor Turn context, the raw outer tool call, parsed authoring
arguments, and the Mineflayer code-generation agent skill markdown. The
generated candidate must include schema-bound parameters, generated TypeScript
source, helper API version, timeout, verifier, failure modes, promotion policy,
helper-event evidence, and post-observation. Prose never supplies missing
executable parameters.

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

Internal project docs live under `project-docs/`: specs, architecture notes,
setup notes, provider/API access notes, handoffs, implementation campaigns,
terminology, and routing indexes.

Docusaurus-exposed public docs live under `docs/public-docs/`. They should
explain the project externally, not carry private provider access, operator
budget state, dated handoffs, implementation plans, or agent operating rules.

Do not add new public docs under `docs/docs/`. Do not put ordinary
documentation, specs, architecture notes, setup guides, handoffs, reviews, or
research notes under `docs/blog/`. `docs/blog/` is only for explicitly requested
chronological blog posts.

Repo-internal review and agent-operation docs live at the project root when they
guide direct branch review. Historical research, old public plans, and raw paper
dumps live under `project-docs/research-archive/`. Do not move archived research back
into public navigation unless an active spec or handoff explicitly promotes it.
