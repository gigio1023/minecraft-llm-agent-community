# Repo Agent Notes

## Current Direction

This repository is a rebuild staging area for a headless Minecraft runtime
loop.

Do not revive the old Voyager-style architecture as the active path.

The current implementation goal is not a full village simulator.
It is a small, bounded, observable runtime that can later grow into a social
simulation seed.

Immediate target:

- one actor, backed by one Mineflayer bot, that can perform boring gameplay
  tasks end-to-end;
- transcript and runtime artifacts that explain success, failure, stall, and reconnect;
- reconnect/session lifecycle that stays truthful when explicitly in scope;
- architecture support for per-actor action skill ownership and later bounded
  action skill evolution.

North star:

- actors, represented by Mineflayer bots, with role context, action skill
  ownership, memory, and later human-in-the-loop social play.

Not current delivery targets:

- persona richness as a content goal;
- long-run autonomy as a product goal;
- large multi-actor society behavior before single-actor competence is trustworthy.

## PlanBeads Intent Rule

PlanBeads exist because free-form strings are too weak to manage what an actor is
trying to do, why it matters, what remains open, and how work should survive
context changes. They are a structured state/work-management substrate for
LLM-based actors, not a replacement for actor freedom.

The intended effect is to give the LLM actor more room to behave naturally in
Minecraft and social simulation, because important concerns, blockers,
dependencies, and resumable work are explicit instead of buried in prose.

The primary pain PlanBeads address is forgetting or muddying multi-cycle work
state. Execution and verification remain important, but the first PlanBeads
implementation should not become a verification project for its own sake. It
must prevent silent error hiding, fake completion, and progress laundering, while
keeping the main emphasis on clear state continuity.

The first meaningful proof is context-change behavior:

- the actor is working on concern A;
- a new concern B appears through observation, relationship pressure, blocker,
  or runtime evidence;
- the runtime preserves A's open/in-progress/blocked/deferred state;
- B can be added, prioritized, deferred, or linked without erasing A;
- the next CycleGoal can choose from current observation and the ready front
  without becoming a checklist executor.

Treat it as a design failure if the actor spends more effort maintaining
PlanBeads than acting in the world, or if PlanBeads make the NPC stiff,
checklist-bound, or less capable of free LLM-based behavior. Bead updates should
be small, evidence-linked, and in service of Minecraft action and social
simulation, not a new activity that displaces them.

PlanBeads must never become executable authority. They do not supply missing
primitive args, grant action-skill permissions, decide physical success, clear
runtime retry constraints, or replace runtime action validation. If an
implementation pushes PlanBeads toward deterministic domain planning, reject or
reframe it.

CycleJudgment may carry raw PlanBead operation proposal candidates, including
malformed candidates. Do not make the entire judgment fail only because one
candidate is invalid. The guarded PlanBead applier owns per-operation
validation, acceptance, rejection, and operation-result artifacts. This keeps
LLM proposal freedom visible while preventing unguarded state mutation.

PlanBeads are Beads-inspired, not Beads CLI integration. The runtime must not
shell out to `bd`, `br`, `beads-mcp`, `.beads`, or downloaded Beads binaries for
NPC state. Actor PlanBeads are repo-owned TypeScript/JSON actor-workspace
records under each actor directory. External Beads-style tools may be used only
for repo implementation campaign management, never as Minecraft runtime state
or as a required device-level dependency.

Parallel GPT-5.5-xhigh workers may be used for speed and context isolation, but
parallelism does not change runtime authority. Workers operate under lane
contracts, produce artifacts or patches, and coordinator verification decides
what lands.

## Action Skill Authoring Gate

New Minecraft action skill creation during social-cycle runtime must originate
only from the action-selection stage. In Actor Turn mode, the provider may
choose `author_mineflayer_action`, which the runtime resolves into full-context
generated action authoring and trial. Legacy planner paths may still produce
`author_and_trial_action_skill` while they remain in explicit migration scope.
In either mode, current observation, CycleGoal or Active Episode, memory,
PlanBeads, relationship context, retry constraints, and the action surface must
justify creating a new actor-owned behavior candidate.

Background reviewers, async sidecars, PlanBead operations, legacy generated
skill importers, and offline maintenance scripts must not originate new action
skill candidates for an NPC during runtime. They may review, patch, reject,
retire, supersede, promote, or re-trial an existing action-selection candidate
with evidence. They may also propose PlanBeads that say a new action skill is
needed, but PlanBeads do not create source, parameters, permissions, or
executable authority.

Generated Mineflayer code should be used more actively through this explicit
full-context authoring path. The outer Actor Turn function call is a selection
and rationale boundary only: it must not include generated source and must not
choose a lossy `context_to_preserve` summary. When `author_mineflayer_action`
is selected, the runtime passes the full original `ActorTurnInput`, raw outer
tool call, parsed tool arguments, and Mineflayer code-generation agent skill
markdown into the internal codegen provider. The generated candidate must then
be schema-bound and helper-limited:

- internal codegen output must include an input schema, current parameters,
  generated TypeScript source, helper API version, timeout, verifier, failure
  modes, and promotion policy;
- primitive and action-skill parameters must validate against JSON
  Schema/OpenAPI-style contracts before execution;
- prose fields such as `why_this_action` never supply missing parameters;
- generated source must run through bounded helpers and record helper events,
  post-observation, verifier output, and actor-workspace evidence;
- a passed trial is not active action skill authority until lifecycle promotion
  succeeds.

Use `project-docs/Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`
as the active outer-selection spec for this rule. Use
`project-docs/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
only for generated candidate, helper allowlist, verifier, trial, and promotion
mechanics after authoring has been selected.

## Tool Calling And Prose-Parsing Anti-Pattern

The strongest current anti-pattern is treating LLM-facing prose as executable
runtime policy. Do not parse `current_state_requirements`, `why_this_action`,
Action Card descriptions, Minecraft Basic Guide text, memory notes, PlanBeads,
or provider rationale with string `includes`, regexes, keyword lists, or similar
text heuristics to decide tool visibility, action eligibility, primitive
arguments, permissions, retry clearance, or generated-code authority.

Tool calling and strict schemas/enums must enforce the Actor Turn flow. The
provider may choose only a visible function tool or `author_mineflayer_action`.
Within that selected tool/action, the LLM keeps decision freedom with full
context, rich rationale, and schema-bound logical parameters. The runtime then
validates explicit structured params, schema conformance, permission gates,
retry/safety constraints, generated-source guardrails, timeouts, verifier output,
and evidence artifacts.

The runtime must not become a hidden Minecraft planner. Do not hide Action Cards
or tools through hardcoded Minecraft domain heuristics such as item-family,
station-family, construction-readiness, survival-priority, shelter-first, or
single-activity strategy filters. If an action should be unavailable or rejected,
represent that with typed readiness/eligibility contracts, structured state,
explicit schemas, permission gates, retry constraints, or verifier evidence.
`decision_frame` is context, not a planner output. Do not add
`parameter_candidates`, `top_eligible_action_cards`,
`recommended_next_action_candidates`, generated chat text, coordinates, recipe
decisions, or other pre-selected action payloads to it.
Do not add provider-facing candidate fields such as `deposit_candidates`,
`open_social_requests`, `obligation_summaries`, `nearby_block_hints`, or
`known_position_summaries`. These fields over-compress social, observation, and
world-state context into hidden preselection. Use bounded typed facts in
`current_state` plus `source_evidence_bundle` cards/refs so the Actor Turn LLM
can reason from the original evidence.
No compatibility or legacy compromise is required for this side project when
removing prose parsing or hidden domain-planner behavior.

## Project Identity vs External References

External Minecraft-agent and LLM-agent papers are references, not product specs.
Do not copy Voyager, MineDojo, ReAct, Reflexion, Generative Agents, SayCan,
SWE-agent, or similar architectures as the active goal.

This project is not a race-to-diamond, fastest-tech-tree, benchmark-maximization,
or generic long-horizon autonomy project. Minecraft is the experimental substrate;
the product direction is a Soul-grounded social simulation seed.

When `soul.md` or an ActorSoul artifact defines an actor, treat it as the actor's
identity seed. Short-, mid-, and long-term goals should be derived under that
Soul/LifeGoal frame, with social context, memory, relationships, role context,
shared/private inventory, obligations, trust, conflict, and settlement state in
view. Gameplay progress matters because it creates observations, consequences, and evidence
for social life, not because the top-level objective is to optimize a Minecraft
benchmark.

Use external references by translating their mechanisms into this project:

- skill-library papers imply evidence-backed, actor-owned action skill promotion,
  not raw eval loops or global skill reuse detached from the actor;
- curriculum papers imply bounded capability scaffolding under ActorSoul/LifeGoal, not a
  universal benchmark objective;
- reasoning/action papers imply Actor Turn tool selection -> runtime action ->
  evidence -> CycleJudgment loops, not unconstrained chain-of-thought as authority;
- memory/reflection papers imply artifact-grounded memory and review, not
  reflection text that can claim world progress;
- affordance/interface papers imply better runtime primitives, gates, and context
  packets, not broader provider authority.

When analyzing literature, always state both:

1. what the reference teaches mechanically; and
2. how that mechanism should be adapted to Soul-grounded Minecraft social
   simulation in this repo.

If a recommendation would make the actor ignore Soul/LifeGoal continuity,
relationships, or social consequences in favor of generic task completion, reject
or reframe it.

Do not turn one domain goal into core architecture. House, shelter, base,
storage, mining, farming, travel, repair, conversation, and conflict are
possible context sources, not mandatory CycleGoal phases. Do not add
`StructurePlacementPlan`, `ShelterBlueprint`, `HomeBasePlan`, or similar
building-first planning artifacts as always-on runtime context. If such an
artifact is useful, keep it local to a bounded action skill, fixture, or offline
design tool and make the current Soul/LifeGoal context justify its use.

Codex/MCP-style references should be adapted as autonomy substrate: action
surface, direct/deferred tool exposure, hooks, permission gates, event streams,
verification, and artifacts. Do not adapt them as hidden domain strategy.

## Canonical Docs

Read these first:

1. `SPEC.md`
2. `AGENTS.md`
3. `CLAUDE.md`
4. `GEMINI.md`
5. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
6. `project-docs/Specification/Soul-Grounded-Social-Simulation.md`
7. `project-docs/Specification/Runtime-Evidence-And-Action-Skills.md`
8. `project-docs/Specification/Engineering-Governance-And-Testing.md`
9. `project-docs/Specification/Reference-Adaptation-Guide.md`
10. `project-docs/Documentation-Map.md`
11. `project-docs/Agent-Search-Index.md`
12. `project-docs/Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md`
13. `project-docs/Terminology.md`
14. `project-docs/Architecture/Runtime-Loop-And-Verification.md`
15. `project-docs/Architecture/Transcript-And-Runtime-Artifacts.md`
16. `project-docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
17. `project-docs/Architecture/Actor-Persistent-State-And-PlanBeads.md`
18. `project-docs/Architecture/PlanBeads-Implementation-Campaign.md`
19. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`
20. `project-docs/Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md`
21. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`
22. `project-docs/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
23. `project-docs/Architecture/Minecraft-Basic-Guide.md`
24. `project-docs/Architecture/Async-Reviewer-Sidecars.md`
25. `project-docs/Architecture/Implementation-Workstreams.md`
26. `project-docs/Architecture/Action-Skill-Verification.md`
27. `project-docs/Architecture/Current-Handoff-And-Next-Work.md`
28. `project-docs/Architecture/Minimal-Probe.md`
29. `project-docs/Architecture/Social-Actor-Profiles-And-Relationships.md`
30. `project-docs/Setup/Headless-Server.md`
31. `project-docs/Setup/Provider-Setup.md`
32. `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`

Treat `SPEC.md` as the canonical rebuild spec.

`SPEC.md` and `project-docs/Specification/*` are long-term spec files.
`AGENTS.md` is binding repo-agent guidance for interpreting and applying that
spec. `CLAUDE.md` and `GEMINI.md` mirror these rules for their agent surfaces
and must point back to `AGENTS.md` as the authority when rules conflict. Editing
any of these files changes product direction or agent operating rules, so do not
modify them during routine implementation work unless the user explicitly
approves the update in the current turn. Put dated implementation status,
command output, and volatile evidence in handoff or audit docs instead.

## Terminology

- `agent skill`: Codex/Claude-style capability under `.agents/skills/*/SKILL.md`,
  built or maintained with `skill-builder`.
- `action skill`: Minecraft/Mineflayer-based bundled behavior the runtime can
  validate, execute, verify, and record. Conversation-like actions are action
  skills when they run through the game runtime.
- Do not use bare `skill` in active guidance when the meaning could be confused.
- `project-docs/Terminology.md` is normative. New docs, code comments, prompts,
  report labels, and agent guides must follow it.
- If existing code or docs conflict with `Terminology.md`, either update them or
  add an explicit legacy-identifier mapping in `Terminology.md`. Do not spread
  outdated wording into new surfaces.
- Avoid AI-slop wording listed in `Terminology.md`, such as "AI brain",
  "magic", "vibes", "smart NPC", broad "autonomous" claims, ambiguous "skill",
  and "persona" as active architecture. Use concrete runtime, Minecraft, and
  schema-backed terms instead.

## Platform-Sensitive Execution

This repo moves between Apple Silicon macOS and Linux ARM. Before running or
changing platform-sensitive setup, server, dependency, or native-binary paths,
check the current platform.

Useful checks:

```bash
uname -s
uname -m
node -p "process.platform + '/' + process.arch"
docker info
```

Platform-sensitive work includes Docker/Compose, Podman, Colima, OrbStack,
`DOCKER_HOST`, native dependencies, binary downloads, Java/Minecraft server
startup, file watchers, shell startup files, executable permissions, browser or
device auth flows, exposed ports, and commands that assume `darwin`, `linux`,
`arm64`, `aarch64`, `x64`, or `amd64`.

Do not assume the host has the same Docker socket, package manager behavior, or
native binary shape as the other ARM platform. If platform setup blocks a run,
record it as an environment blocker with the exact command and platform, not as
actor behavior or action skill failure.

## User Communication Rules

Default to kind, context-rich communication with the user.

The user should be able to understand the agent's intent, work performed,
reasoning, results, and remaining uncertainty without needing to infer hidden
context. Do not hide assumptions, repo-specific implications, or important
tradeoffs inside terse summaries.

When reporting non-trivial work, include:

- what you changed or inspected;
- why that work was necessary;
- what evidence or command output supports the result;
- what remains blocked, risky, stale, or intentionally deferred;
- what terminology or architecture rule shaped the decision.

Avoid the anti-pattern of returning only a compressed final outcome when the
user needs enough context to review, learn, challenge, or extend the work. Keep
small answers small, but do not omit material context for architecture,
debugging, testing, provider/auth, platform-sensitive setup, or documentation
governance work.

Use the user's language when practical. For this repo, Korean explanations are
often appropriate, but keep code identifiers, commands, file paths, schema names,
and canonical terminology exact.

## Thinking, Research, Review, And Change Discipline

Search token: `KARPATHY_GUIDELINES`.

These Karpathy-style rules are binding for coding, research, reviews, refactors,
and implementation planning in this repo. They are adapted from the user-provided
MIT-licensed `karpathy-guidelines` note, derived from Andrej Karpathy's public
observations on common LLM coding mistakes:
`https://x.com/karpathy/status/2015883857489522876`.

### Think Before Coding

- Before non-trivial edits, state the working assumptions, the intended change
  boundary, and the verifiable success criteria.
- If multiple interpretations exist, name them. Do not silently choose the path
  that would change product direction, runtime authority, provider cost, data
  retention, auth, or platform setup.
- If a simpler approach solves the request, say so and prefer it.
- If uncertainty can be resolved from repo context, inspect the repo first. If a
  reasonable assumption would be risky, stop and ask the user instead of hiding
  confusion in code.
- During literature, GitHub, or web research, separate "what the reference
  teaches mechanically" from "how this repo should adapt it." References are not
  specs, and a mechanism that conflicts with Soul/LifeGoal continuity or
  autonomy substrate rules must be rejected or reframed.

### Simplicity First

- Write the minimum code that solves the current problem and can be verified.
- Do not add features, configuration knobs, abstractions, provider paths, action
  skills, or domain planners that were not requested or directly required by the
  current runtime contract.
- Avoid speculative flexibility. If an abstraction has one use and no immediate
  need, keep the implementation direct.
- If a change grows beyond the smallest clear shape, simplify before proceeding.
  Large files should be split by responsibility, but not converted into a
  framework.

### Surgical Changes

- Touch only files that are needed for the user's request and the required
  documentation/test alignment.
- Do not "improve" adjacent code, comments, formatting, terminology, or docs
  unless the current change made them wrong or the user asked for cleanup.
- Match the existing style and ownership boundaries even when another style
  seems preferable.
- Remove imports, variables, helpers, docs, and tests that your own change made
  obsolete. Mention unrelated dead code or stale docs instead of deleting them.
- Every changed line should trace to the request, a verified blocker, or a
  documented repo rule.

### Goal-Driven Execution

- Convert work into explicit success criteria before implementing. For example,
  "reject missing physical args" means "produce a contract-failure artifact and
  pass the focused regression test," not "the bot moved somewhere."
- For multi-step work, keep a short plan with a verification step for each
  material task.
- Loop until the chosen verification has run or until the blocker is recorded
  with the exact command, platform, provider, artifact path, and failure mode.
- Prefer real runtime evidence when behavior matters. Unit tests protect narrow
  regressions, but social-cycle value is proven by truthful reports, helper
  events, verifier output, actor workspace artifacts, and provider usage records.

## Search Index

Read `project-docs/Agent-Search-Index.md` first for routing.

Important search tokens:

- `MINECRAFT_AGENT_LOOP_MIGRATION`
- `HEADLESS_MINEFLAYER_PROBE`
- `MINECRAFT_GAMEPLAY_MODEL`
- `SPEC_GOVERNANCE`
- `DOCUMENTATION_MAP`
- `KARPATHY_GUIDELINES`
- `TERMINOLOGY`
- `SOUL_GROUNDED_SOCIAL_SIMULATION`
- `RUNTIME_EVIDENCE_ACTION_SKILLS`
- `ENGINEERING_GOVERNANCE_TESTING`
- `REFERENCE_ADAPTATION_GUIDE`
- `SKILL_VILLAGE_FAILURE`
- `NO_VOYAGER_EVAL_LOOP`
- `NO_MANUAL_CLIENT_GATE`
- `OPENAI_CODEX_PROVIDER`
- `GAME_RUNTIME_CODEX_AUTH`
- `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH`
- `PROVIDER_USAGE_GUARD`
- `PROVIDER_FREE_TIER_RESET_WINDOWS`
- `GEMINI_API_SOCIAL_PROVIDER`
- `WORLD_STATE_DIAGNOSTICS`
- `MINECRAFT_BASIC_GUIDE`
- `ACTOR_PERSISTENT_STATE_PLAN_BEADS`
- `RUNTIME_ACTION_CONTRACT`
- `RUNTIME_RETRY_CONSTRAINT`
- `CONTEXT_COMPACTION`
- `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW`
- `SOCIAL_SIMULATION_SEED`
- `SPEED_BOUNDED_SOCIAL_SIMULATION`
- `LIVE_TRANSCRIPT_FIRST`
- `CHECKPOINT_READY_RUNTIME`
- `MINIMAL_ACTION_SKILL_MEMORY_HOOK`
- `ACTION_SKILL_VERIFICATION`
- `CURRENT_HANDOFF_NEXT_WORK`
- `GENERATED_ACTION_SKILL_LEGACY_STORE`
- `PER_ACTOR_ASYNC_REVIEWER`
- `IMPLEMENTATION_WORKSTREAMS`
- `ACTION_SKILL`
- `AGENT_SKILL`

## Design Rules

- Use Minecraft as an experiment accelerator.
- The first meaningful proof is not a big society. It is boring competence plus
  strong observability.
- Keep implementation aggressively simple. Prefer small, named modules over large files.
- Keep architecture extensible by making ownership boundaries explicit, not by
  adding general-purpose abstractions early. Prefer small typed modules with
  clear contracts that can grow later without turning the current runtime into a
  framework.
- If a TypeScript file becomes large, split it by responsibility before adding more behavior.
- Split files before adding new behavior when a module starts mixing concerns
  such as CLI parsing, provider calls, runtime orchestration, session lifecycle,
  artifact persistence, and gameplay execution.
- Keep functions small and single-purpose.
- Avoid runner files that mix config, provider calls, reconnect, transcript,
  persistence, and gameplay execution in one place.
- Use clear directory boundaries:
  - `gameplay/` for progression, curriculum, primitives, seed action skills,
    verification;
  - `runtime/` for loop, actions, session, and orchestration;
  - `memory/` and `runtime/state/` for actor and runtime state;
  - `skills/` for seed/generated action skill ownership and execution;
  - `provider/` for model calls and tracing;
  - `transcript/` for transcript and artifact persistence.
- Do not let quick probes become permanent monoliths.
- Do not expect social simulation from persona text alone.
- Add concrete Minecraft observations and consequences first: resource gathering, crafting, storage,
  movement, scarcity, and shared/private inventory.
- Mineflayer provides the game client API.
- Prefer bounded TypeScript helpers and bounded action skill bundles over raw
  eval.
- Prefer autonomy substrate over domain-specific strategy encoding. Improve
  context packets, `action_surface`, gates, hooks, verifier feedback, and actor
  memory before adding a specialized planner for one activity such as house
  building.
- Preserve enough world-state evidence for post-run diagnosis. A claim such as
  "no matching block was observed" must be backed by a bounded scan or an
  explicit loaded-world limitation, not only by a thin nearest-block summary.
- World-state diagnostics should record the scan center, radius, vertical range,
  dimension, loaded-chunk limitation, raw observed block/entity/item names,
  nearest examples, truncation policy, and evidence refs. Do not imply that
  unloaded chunks were inspected. Reviews and audits should count explicit
  `world-state-summary/v1` or `world-state-scan/v1` schema artifacts as scan
  evidence, not loose legacy keys such as `nearbyBlocks`.
- Do not expose provider-facing world summaries as fixed material-family,
  station-family, construction-readiness, or survival-priority categories.
  World context is evidence substrate: raw Minecraft names, positions,
  distances, limits, and query refs. The provider decides what matters from
  ActorSoul/LifeGoal, CycleGoal, action surface, and evidence.
- Do expose the compact `minecraft_basic_guide` to social-cycle provider stages
  as stable background mechanics. It should help the provider apply basic item
  flows, station requirements, tool usefulness, item-vs-world-block distinctions,
  blocker recovery, and repeated-observe limits. It is a guide, not a strategy
  checklist, runtime permission, current-state claim, runtime action contract, or
  proof of progress.
- It is acceptable for a specific action skill implementation to query a
  specific Minecraft block or item family as part of its own primitive contract.
  It is not acceptable to turn those families into always-present planner
  context, summary headings, or goal interpretation.
- Treat physical runtime action arguments as a contract. For actions such as
  `move_to`, `mine_block`, `place_block`, `craft_item`, `inspect_chest`,
  `deposit_shared`, or structure/building primitives, required target/item/count
  arguments must be present in structured args before execution.
- Direct `use_primitive` actions must not carry `action_skill_id` or
  `args.actionSkillId`. Actor-owned action skill fallback authority exists only
  after a `use_action_skill` action is resolved by the runtime.
- Safe-looking control actions such as `wait` and `remember` are still runtime
  primitives. They must pass CycleGoal and active action-skill gates.
- Do not silently convert missing physical arguments into movement or gameplay
  defaults. A hidden default that makes the bot move can still be a product
  failure. Reject, repair, or ask the provider for a valid action, then record
  the contract failure in artifacts.
- Natural-language fields such as `why_this_action` explain intent but are not
  executable authority. If prose mentions a coordinate and structured args are
  empty or contradictory, the runtime must treat the structured intent as
  invalid rather than guessing from prose.
- Repeated identical blocker evidence should become a `runtime-retry-constraint/v1`
  gate over the exact runtime action target and structured args. This is a
  runtime safety rule, not a domain strategy or memory suggestion. It must block
  before Mineflayer execution and write evidence when the provider repeats the
  prohibited target/args.
- Use Mineflayer API behavior to shape runtime contracts: target resolution,
  loaded-world visibility, pathfinder limits, timeout/cancellation behavior, and
  verifier evidence should be documented in code or spec when they affect an
  action skill.
- Long social-cycle runs need context compaction. Do not feed unbounded raw
  transcripts or repeated observe/wait/remember records back to the provider.
  Preserve compact, evidence-linked state: ActorSoul/LifeGoal, current
  inventory, container snapshots, known positions, recent blockers, recent
  judgments, world-state diagnostics, action-surface contracts, and artifact
  refs.
- Compaction must not launder weak evidence into progress. Provider text,
  memory notes, `wait`, or repeated observation are context, not physical
  success unless verifier-backed world, inventory, position, block, container,
  chat, or transcript evidence supports them.
- Human visual inspection is optional. Prefer transcript, checkpoint-like runtime
  artifacts, structured logs, and optional viewer evidence.
- Failures should be explainable from artifacts without immediate reproduction.
- Progress must be real. Do not confuse partial motion, initial animation, or
  optimistic status text with success.
- Treat interruption-sensitive Minecraft actions as atomic action skill
  boundaries. For example, block breaking must keep Mineflayer digging until
  `bot.dig(...)` resolves or fails; do not stop to check progress mid-dig,
  because that resets block-breaking progress.
- Actor workspace is the source of truth for actor-owned action skill state.
- Actor workspace should also become the source of truth for actor-owned
  PlanBead work graph state when that slice is implemented. The purpose is
  state continuity under changing circumstances, not more planning prose.
- Treat `build/generated-skills` as legacy exploratory output, not as active or
  candidate actor-owned action skill memory.
- Prefer structured domain models, typed records, discriminated unions, schemas,
  and validators over ad hoc dictionary blobs. Runtime state, action evidence,
  actor memory, provider packets, relationship context signal, and verifier results
  should be machine-auditable and hard to misread.
- Keep tests small and Detroit-style. Use them to protect real owned behavior,
  not to simulate a fake feeling of coverage.
- Live transcript is the primary evidence of runtime value.

## TypeScript Commenting Rules

These rules are based on the Google TypeScript Style Guide, TypeScript JSDoc
reference, TSDoc, TypeDoc, DefinitelyTyped, and VS Code/TypeScript ecosystem
practice.

- Prefer readable names, narrow functions, and explicit types before adding a
  comment. A comment should not restate what TypeScript already proves.
- This repo should use more explanatory comments than a typical CRUD or library
  project because product policy, runtime authority, evidence semantics, and
  actor-continuity intent are part of the implementation contract. Preserve the
  "why this boundary exists" and "what this code must not imply" background in
  code when it prevents future agents from accidentally changing product
  direction.
- Use `/** ... */` documentation comments for exported APIs, cross-module
  contracts, and code a caller needs to understand. Use `//` comments for local
  implementation notes.
- Comments should explain intent, background, why a runtime boundary exists,
  what invariant is being protected, what failure mode is being rejected, or
  what Minecraft/Mineflayer behavior is non-obvious.
- It is acceptable and often desirable for comments to include project intent,
  design background, and policy constraints when the code implements rules from
  `SPEC.md`, ActorSoul/LifeGoal continuity, PlanBeads, runtime action contracts,
  actor workspace evidence, provider usage/auth boundaries, retry constraints,
  or generated action skill lifecycle. Do not force readers to reconstruct these
  constraints from distant docs when a short local note can prevent misuse.
- For gameplay code, prioritize comments around verification, timeout,
  cancellation, reconnect/session freshness, fake-progress rejection, actor
  workspace initialization, action skill ownership, and transcript semantics.
- For provider-facing code, document which fields are prompt context only and
  which fields may become executable authority after validation. Prose fields,
  memory, PlanBeads, and decision-frame hints should be explicitly described as
  non-authoritative wherever that distinction is easy to blur.
- For persistence and artifact code, document what record is the source of truth,
  what evidence survives compaction, and which claims are only diagnostic context
  rather than proof of Minecraft progress.
- Do not add decorative section banners, obvious parameter descriptions, or
  comments that merely narrate the next line of code.
- Keep comments short enough to review. If a comment needs a long explanation,
  prefer extracting a named helper or adding a design doc section.
- Keep comments current when behavior changes. A stale comment is worse than no
  comment because this repo relies on artifacts and code to diagnose real runs.
- When documenting generated or candidate action skills, state the primitive
  boundary and evidence required for promotion. Do not imply autonomous runtime
  trust before verification exists.
- During comment passes, explicitly inspect every TypeScript file with zero
  comments. Either add a high-signal contract/invariant comment or leave it
  uncommented only when the file is a trivial CLI/re-export/declarative constant.
- A file with zero comments is acceptable only after inspection when it is a
  re-export, a tiny CLI shim, a declarative constant table with self-explanatory
  names, or a small pure helper whose behavior and policy implications are
  obvious from types and tests. Large provider, runtime, validation, Mineflayer
  tool, memory, artifact, or lifecycle files should not remain comment-free.
- When the user explicitly requests a comment pass, report whether existing
  guidance was sufficient, then update only comments that clarify contracts,
  invariants, runtime evidence, or non-obvious Mineflayer behavior. Tests may
  receive comments only for non-obvious invariants; do not pad every test with
  narration.
- Configuration comments should explain non-obvious defaults, auth boundaries,
  artifact locations, and destructive-vs-non-destructive behavior. Do not label
  obvious scalar defaults.
- Prefer TSDoc `@remarks` for invariants that must survive refactors (for example,
  “WorldEvent is context, not LifeGoal”). Use `@see` to link architecture docs
  when a module implements a written contract.
- Keep JSDoc tags sparse: `@param` only when the name is not self-explanatory;
  avoid `@returns` on obvious `Promise<void>` helpers.

Reference anchors:

- Google TypeScript Style Guide: `https://google.github.io/styleguide/tsguide.html`
- TypeScript JSDoc Reference:
  `https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html`
- TSDoc approach: `https://tsdoc.org/pages/intro/approach/`
- TypeDoc TSDoc support:
  `https://typedoc.org/documents/Doc_Comments.TSDoc_Support.html`
- DefinitelyTyped contribution guidance:
  `https://definitelytyped.org/guides/contributing.html`
- VS Code TypeScript/JSDoc hover behavior issue:
  `https://github.com/microsoft/vscode/issues/215550`

## Testing Rules

- Keep tests aggressively small, direct, and Detroit-style.
- Tests should exercise real owned behavior through the smallest practical
  public boundary, with minimal mocking and no broad harnesses that can pass
  while the runtime contract is broken.
- Prefer tests that prove one important owned behavior or regression.
- Use tests to reject fake success and hidden dependencies.
- Do not add broad mocks or snapshot-heavy suites.
- If a test would still pass after the real logic was broken, rewrite or delete it.
- Do not add elaborate tests for persona richness or long-run autonomy yet.
- Unit tests protect narrow regressions, but live implementation runs with
  truthful reports, helper events, verifier output, and actor artifacts are the
  primary evidence for runtime value.

## Documentation Rules

- Keep `SPEC.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `project-docs/intro.md`,
  `project-docs/Documentation-Map.md`, `project-docs/Terminology.md`, and
  `project-docs/Agent-Search-Index.md` aligned.
- Internal project docs live under `project-docs/`. This includes specs,
  architecture notes, setup notes, provider/API access notes, handoffs,
  implementation campaigns, terminology, and routing indexes.
- Docusaurus-exposed public docs live under `docs/public-docs/`. These pages
  should explain the project externally: purpose, high-level architecture, basic
  local run instructions, evidence semantics, and roadmap.
- Do not add new public docs under `docs/docs/`.
- Do not put ordinary documentation, specs, architecture notes, setup guides,
  handoffs, reviews, or research notes under `docs/blog/`. `docs/blog/` is only
  for explicitly requested chronological blog posts.
- Do not put internal setup notes, private provider access instructions,
  provider-budget state, dated run handoffs, implementation workstreams, or
  agent operating rules under `docs/public-docs/` or `docs/blog/`.
- Repo-internal review and operation docs belong in the project root when they
  guide branch review or agents directly. Historical research, stale public
  plans, and raw paper dumps belong under `project-docs/research-archive/`.
- When adding or changing project vocabulary, update `project-docs/Terminology.md`
  first, then update affected docs/code comments/prompts to match it.
- If a plan becomes historical rather than active, mark it clearly as archived or
  deprecated instead of leaving it ambiguous.
- Prefer one canonical definition doc over several drifting ones.
- Never use absolute local paths in committed docs.

## Default LLM Planner (Codegen)

For **Mineflayer TypeScript codegen** (long-objective / direct-generated planner),
do **not** use Gemini Native Audio Dialog as a planner path. Recorded verdict:
`project-docs/Architecture/Gemini-Native-Audio-Codegen-Verdict.md`.

Use:

- **REST `text-genai`** (`gemini-2.5-flash` via `@google/genai`) with
  structured output (`responseMimeType: "application/json"` plus
  `responseJsonSchema`) — current working path; `--force-path text-genai` on
  long-objective CLI, or
- **Gemini OpenAI-compatible Chat Completions** (OpenAI SDK + same `system`/`user`
  message shape) — evaluate via `probe/scripts/experimentGeminiOpenAiCompatMatrix.ts`.

Native Audio Dialog (`live-transcription`) is not a fallback, recovery path, or
provider order entry for `export async function run(ctx)` generation.

Codegen-friendly defaults (override in ignored `.env`):

```text
GEMINI_PLANNER_PRIMARY=text-genai
PROBE_LONG_OBJECTIVE_PROVIDER_ORDER=text-genai
```

Implementation:

- `probe/src/provider/gemini/textGenai.ts`
- `callGeminiLivePlanner()` is a legacy-named facade; active planner calls use
  only the structured REST `text-genai` path.
- Long-objective planning goes through `ObjectivePhasePlannerPort`
  (`probe/src/provider/planner/`) — Gemini, OpenAI Codex, or explicit
  `builtin-planner`
- When LLM output is empty, blocked, or rejected, the runner falls back to
  **builtin phase source**: repo-authored `export async function run(ctx)` templates
  in `builtinPhaseSources.ts`. This is **not** loading an existing seed action skill
  from the gameplay registry; it is the same *execution shape* as a generated
  program, but checked in per phase.
- CLI `--provider deterministic` is kept as an alias for `--provider builtin-planner`

Do not treat optional Gemini smoke CLIs as the main validation loop. They are
shallow wiring checks only.

## Testing Priority

Prefer **real implementation runs** with truthful artifacts over smoke-only
proof:

1. Run the actual command (`probe:long-objective`, `probe:objective`, etc.).
2. Read the report JSON, actor workspace provider snapshots, helper events, and
   verifier output.
3. Feed failures back into substrate or prompt fixes.

Smoke tests (`probe:gemini-planner-smoke`, `probe:gemini-json-smoke`) are
allowed only as quick optional wiring checks. They do not replace Minecraft
current-run verification.

## Provider Cost And Usage Guard

Live provider calls must be explicit and auditable.

- Do not run OpenAI API models for cost-sensitive tests unless the user has
  explicitly selected that provider/model and the local free-tier or paid budget
  is known.
- Prefer `gemini-api` with `gemma-4-31b-it` for lightweight live provider checks
  when `GEMINI_API_KEY` is available.
- Run `probe:gemini-json-smoke` before longer Gemini/Gemma social-cycle tests.
- Provider calls should write usage into provider output snapshots and
  `build/provider-usage/provider-usage-ledger.jsonl`.
- If the user provides provider dashboard usage, encode it in
  `PROVIDER_USAGE_BUDGETS_JSON` or
  `build/provider-usage/free-tier-budgets.json` as `already_used` before running
  long or repeated live provider tests.
- Before long OpenAI or Gemini API free-tier runs, read
  `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md` and use its reset
  windows when deciding whether the budget has refreshed:
  - OpenAI API data-sharing complimentary tokens reset at `00:00 UTC`, which is
    `09:00 KST`.
  - Gemini API `RPD` quotas reset at midnight Pacific time, which is `16:00 KST`
    during PDT and `17:00 KST` during PST. Convert from
    `America/Los_Angeles`; do not assume a fixed KST calendar-day boundary.
- Treat a usage-budget block as a provider setup/budget blocker, not as actor
  behavior or action-skill failure.

Gemini/Gemma free-tier limits are provider/project/tier dependent and can
change. Check current Google AI Studio active limits before long runs. The repo
has a built-in operator guardrail for `gemini-api` + `gemma-4-31b-it`, but that
guardrail is not an official quota guarantee.

## Social Cycle Runtime (Soul / LifeGoal)

Use `probe:social-cycle` for the Soul/LifeGoal/CycleGoal vertical slice. The CLI
defaults to `deterministic-social`; live provider calls require an explicit
provider.

Preferred lightweight live path:

```bash
cd probe
bun run probe:gemini-json-smoke -- \
  --model gemma-4-31b-it \
  --report ../tmp/gemini-json-smoke.json

bun run probe:social-cycle -- \
  --actor npc_b \
  --provider gemini-api \
  --model gemma-4-31b-it \
  --cycles 2 \
  --max-actions-per-cycle 3 \
  --report ../tmp/social-cycle-npc-b-gemma31b.json \
  --no-dashboard
```

This path uses **Gemini API** (`GEMINI_API_KEY` in repo-local `.env`), not
`openai-codex` / `build/provider-auth/openai-codex-auth.json`.

OpenAI API (`OPENAI_API_KEY`) remains available with
`--provider openai-api --model "$OPENAI_MODEL"` but should not be used for
cost-sensitive tests until budget state is known.

`deterministic-social` is for tests and baseline reports only (`builtin_goal_authority`).
Do not use `probe:long-objective` as the social-life runtime.

Canonical plan: `project-docs/Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`.

## Auth Rule

When this repo says "Codex auth" for gameplay, it means game-runtime provider
auth for the `openai-codex` provider. It does not mean Codex CLI login.

Use an ignored repo-local auth store such as:

```text
build/provider-auth/openai-codex-auth.json
```

Do not inspect or print raw tokens. Do not start a browser/device login flow
unless the auth store is missing, expired, rejected by a live smoke, or the user
explicitly asks to refresh provider auth.
