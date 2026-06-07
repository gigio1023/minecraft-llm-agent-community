# Gemini Agent Repo Guidance

`AGENTS.md` is the binding authority for this repository. This file exists so
Gemini-based agent sessions see the same operating rules quickly. If this file
and `AGENTS.md` disagree, follow `AGENTS.md` and update this file only when the
user has approved an operating-rule change.

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
12. `project-docs/Architecture/Context-Projection-And-Source-Evidence.md`
13. `project-docs/Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md`
14. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`
15. `project-docs/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
16. `project-docs/Architecture/Minecraft-Basic-Guide.md`
17. `project-docs/Setup/Provider-Setup.md`
18. `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`

## Project Direction

This repo is a bounded, observable headless Minecraft runtime for a
Soul-grounded social simulation seed. It is not a Voyager clone, a Minecraft
benchmark project, or a house-building architecture.

Providers propose goals, actions, and judgments. Runtime code owns Minecraft
truth: schemas, structured args, permission gates, Mineflayer execution,
verification, artifacts, actor workspace state, and provider usage records.

Never parse LLM-facing prose with string `includes`, regexes, or keyword
heuristics to decide runtime policy. `current_state_requirements`, Action Card
descriptions, rationale, Minecraft Basic Guide text, memory, and PlanBeads are
context, not executable authority. Tool calling plus strict schemas/enums
enforce flow; within a selected visible tool/action, the LLM keeps decision
freedom with full context and schema-bound logical parameters. Runtime then
validates explicit params, schema, permission, retry/safety, source guards,
timeouts, verifier/evidence, and artifacts.

`decision_frame` is context, not a planner output. Do not add
`parameter_candidates`, `top_eligible_action_cards`,
`recommended_next_action_candidates`, generated chat text, coordinates, recipe
decisions, or other pre-selected action payloads to it.
Do not add provider-facing `deposit_candidates`, `open_social_requests`,
`obligation_summaries`, `nearby_block_hints`, or `known_position_summaries`.
Use bounded typed facts in `current_state` plus source cards/refs in
`source_evidence_bundle` so the LLM sees evidence rather than hidden
preselection.

Do not hide Action Cards or tools through hardcoded Minecraft heuristics such as
item-family, station-family, construction-readiness, survival-priority, or
shelter-first filters. Tool visibility and rejection must be represented with
typed readiness/eligibility contracts, structured state, schemas, gates, retry
constraints, or evidence. The runtime must not become a hidden Minecraft
planner. No compatibility or legacy compromise is required when removing prose
parsing or hidden domain-planner behavior.

PlanBeads are structured actor-owned work state for concerns an LLM actor would
otherwise forget or blur in free-form prose. They should make the NPC more
flexible under changing Minecraft/social context, not checklist-bound. Do not
let PlanBeads grant executable authority, action permissions, physical success,
or retry-constraint clearance.

CycleJudgment may carry raw PlanBead operation proposal candidates. A malformed
candidate should remain visible as a rejected operation-result artifact from the
guarded PlanBead applier, not disappear by failing the whole judgment.

PlanBeads are Beads-inspired TypeScript/JSON runtime records in actor
workspaces. They are not external Beads CLI integration, and this runtime must
not require `bd`, `br`, `beads-mcp`, `.beads`, or downloaded Beads binaries for
NPC state.

## Action Skill Authoring

During social-cycle runtime, new Minecraft action skill creation starts only
from the action-selection stage. In Actor Turn mode, that means
`author_mineflayer_action`, which starts full-context generated Mineflayer
authoring and trial. The outer tool call carries detailed rationale and desired
behavior, not TypeScript source and not a lossy context summary. Background
reviewers, PlanBeads, async sidecars, and legacy generated-code importers may
review, patch, re-trial, reject, promote, retire, or supersede an existing
candidate, but they must not originate a new NPC action skill candidate.

Generated Mineflayer code should be used through that explicit author-and-trial
path. The internal codegen provider receives the full original Actor Turn
context, the raw outer tool call, parsed authoring arguments, and the Mineflayer
code-generation agent skill markdown. The generated candidate must include
schema-bound parameters, generated TypeScript source, helper API version,
timeout, verifier, failure modes, promotion policy, helper-event evidence, and
post-observation. Prose never supplies missing executable parameters.

## Change Discipline

Follow `KARPATHY_GUIDELINES` from `AGENTS.md`:

- state assumptions and success criteria before non-trivial work;
- prefer the simplest implementation that satisfies the current request;
- make surgical changes and avoid unrelated cleanup;
- verify with the smallest meaningful command, and use live runtime artifacts
  when behavior matters.

## Documentation Boundary

Internal project docs live under `project-docs/`: specs, architecture notes,
setup notes, provider/API access notes, handoffs, implementation campaigns,
terminology, and routing indexes.

Docusaurus-exposed public docs live under `docs/public-docs/`. They should
explain the project externally, not carry private provider access, operator
budget state, dated handoffs, implementation plans, or agent operating rules.

Repo-root review and agent-operation docs live at the project root. Historical
research, old public plans, and raw paper dumps live under
`project-docs/research-archive/`.

Do not add new public docs under `docs/docs/`. Do not treat archived research as
an active build instruction unless an active spec or handoff promotes it.

## Provider Cost And Auth

Live provider calls must be explicit and usage-guarded. Gameplay Codex auth is
the repo-local game-runtime provider auth store, not Codex CLI login. Do not
inspect or print raw tokens.
