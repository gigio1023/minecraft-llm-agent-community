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

- actors, represented by Mineflayer bots, with role pressure, action skill
  ownership, memory, and later human-in-the-loop social play.

Not current delivery targets:

- persona richness as a content goal;
- long-run autonomy as a product goal;
- large multi-actor society behavior before single-actor competence is trustworthy.

## Project Identity vs External References

External Minecraft-agent and LLM-agent papers are references, not product specs.
Do not copy Voyager, MineDojo, ReAct, Reflexion, Generative Agents, SayCan,
SWE-agent, or similar architectures as the active goal.

This project is not a race-to-diamond, fastest-tech-tree, benchmark-maximization,
or generic long-horizon autonomy project. Minecraft is the experimental substrate;
the product direction is a Soul-grounded social simulation seed.

When `soul.md` or an ActorSoul artifact defines an actor, treat it as the actor's
identity seed. Short-, mid-, and long-term goals should be derived under that
Soul/LifeGoal frame, with social pressure, memory, relationships, role pressure,
shared/private inventory, obligations, trust, conflict, and settlement state in
view. Gameplay progress matters because it creates real pressure and evidence
for social life, not because the top-level objective is to optimize a Minecraft
benchmark.

Use external references by translating their mechanisms into this project:

- skill-library papers imply evidence-backed, actor-owned action skill promotion,
  not raw eval loops or global skill reuse detached from the actor;
- curriculum papers imply bounded goal pressure and capability scaffolding, not a
  universal benchmark objective;
- reasoning/action papers imply CycleGoal -> ActionIntent -> evidence ->
  CycleJudgment loops, not unconstrained chain-of-thought as authority;
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
possible social pressures, not mandatory CycleGoal phases. Do not add
`StructurePlacementPlan`, `ShelterBlueprint`, `HomeBasePlan`, or similar
building-first planning artifacts as always-on runtime context. If such an
artifact is useful, keep it local to a bounded action skill, fixture, or offline
design tool and make the current Soul/LifeGoal pressure justify its use.

Codex/MCP-style references should be adapted as autonomy substrate: action
surface, direct/deferred tool exposure, hooks, permission gates, event streams,
verification, and artifacts. Do not adapt them as hidden domain strategy.

## Canonical Docs

Read these first:

1. `SPEC.md`
2. `AGENTS.md`
3. `docs/docs/Specification/Soul-Grounded-Social-Simulation.md`
4. `docs/docs/Specification/Runtime-Evidence-And-Action-Skills.md`
5. `docs/docs/Specification/Engineering-Governance-And-Testing.md`
6. `docs/docs/Specification/Reference-Adaptation-Guide.md`
7. `docs/docs/Documentation-Map.md`
8. `docs/docs/Agent-Search-Index.md`
9. `docs/docs/Terminology.md`
10. `docs/docs/Architecture/Runtime-Loop-And-Verification.md`
11. `docs/docs/Architecture/Transcript-And-Runtime-Artifacts.md`
12. `docs/docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
13. `docs/docs/Architecture/Async-Reviewer-Sidecars.md`
14. `docs/docs/Architecture/Implementation-Workstreams.md`
15. `docs/docs/Architecture/Action-Skill-Verification.md`
16. `docs/docs/Architecture/Current-Handoff-And-Next-Work.md`
17. `docs/docs/Architecture/Minimal-Probe.md`
18. `docs/docs/Architecture/Social-Actor-Profiles-And-Relationships.md`
19. `docs/docs/Setup/Headless-Server.md`
20. `docs/docs/Setup/Provider-Setup.md`

Treat `SPEC.md` as the canonical rebuild spec.

`SPEC.md` and `docs/docs/Specification/*` are long-term spec files. `AGENTS.md`
is binding repo-agent guidance for interpreting and applying that spec. Editing
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
- `docs/docs/Terminology.md` is normative. New docs, code comments, prompts,
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

## Search Index

Read `docs/docs/Agent-Search-Index.md` first for routing.

Important search tokens:

- `MINECRAFT_AGENT_LOOP_MIGRATION`
- `HEADLESS_MINEFLAYER_PROBE`
- `MINECRAFT_GAMEPLAY_MODEL`
- `SPEC_GOVERNANCE`
- `DOCUMENTATION_MAP`
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
- `GEMINI_API_SOCIAL_PROVIDER`
- `WORLD_STATE_DIAGNOSTICS`
- `ACTION_INTENT_CONTRACT`
- `CONTEXT_COMPACTION`
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
- Add Minecraft task pressure first: resource gathering, crafting, storage,
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
- It is acceptable for a specific action skill implementation to query a
  specific Minecraft block or item family as part of its own primitive contract.
  It is not acceptable to turn those families into always-present planner
  context, summary headings, or goal pressure.
- Treat physical `ActionIntent` arguments as a contract. For actions such as
  `move_to`, `mine_block`, `place_block`, `craft_item`, `inspect_chest`,
  `deposit_shared`, or structure/building primitives, required target/item/count
  arguments must be present in structured args before execution.
- Direct `use_primitive` intents must not carry `action_skill_id` or
  `args.actionSkillId`. Actor-owned action skill fallback authority exists only
  after a `use_action_skill` intent is resolved by the runtime.
- Safe-looking control actions such as `wait` and `remember` are still runtime
  primitives. They must pass CycleGoal and active action-skill gates.
- Do not silently convert missing physical arguments into movement or gameplay
  defaults. A hidden default that makes the bot move can still be a product
  failure. Reject, repair, or ask the provider for a valid intent, then record
  the contract failure in artifacts.
- Natural-language fields such as `why_this_action` explain intent but are not
  executable authority. If prose mentions a coordinate and structured args are
  empty or contradictory, the runtime must treat the structured intent as
  invalid rather than guessing from prose.
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
- Treat `build/generated-skills` as legacy exploratory output, not as active or
  candidate actor-owned action skill memory.
- Prefer structured domain models, typed records, discriminated unions, schemas,
  and validators over ad hoc dictionary blobs. Runtime state, action evidence,
  actor memory, provider packets, relationship pressure, and verifier results
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
- Use `/** ... */` documentation comments for exported APIs, cross-module
  contracts, and code a caller needs to understand. Use `//` comments for local
  implementation notes.
- Comments should explain intent, background, why a runtime boundary exists,
  what invariant is being protected, what failure mode is being rejected, or
  what Minecraft/Mineflayer behavior is non-obvious.
- For gameplay code, prioritize comments around verification, timeout,
  cancellation, reconnect/session freshness, fake-progress rejection, actor
  workspace initialization, action skill ownership, and transcript semantics.
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
- When the user explicitly requests a comment pass, report whether existing
  guidance was sufficient, then update only comments that clarify contracts,
  invariants, runtime evidence, or non-obvious Mineflayer behavior. Tests may
  receive comments only for non-obvious invariants; do not pad every test with
  narration.
- Configuration comments should explain non-obvious defaults, auth boundaries,
  artifact locations, and destructive-vs-non-destructive behavior. Do not label
  obvious scalar defaults.
- Prefer TSDoc `@remarks` for invariants that must survive refactors (for example,
  “WorldEvent is pressure, not LifeGoal”). Use `@see` to link architecture docs
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

- Keep `SPEC.md`, `README.md`, `docs/docs/intro.md`,
  `docs/docs/Documentation-Map.md`, `docs/docs/Terminology.md`, and
  `docs/docs/Agent-Search-Index.md` aligned.
- When adding or changing project vocabulary, update `docs/docs/Terminology.md`
  first, then update affected docs/code comments/prompts to match it.
- If a plan becomes historical rather than active, mark it clearly as archived or
  deprecated instead of leaving it ambiguous.
- Prefer one canonical definition doc over several drifting ones.
- Never use absolute local paths in committed docs.

## Default LLM Planner (Codegen)

For **Mineflayer TypeScript codegen** (long-objective / direct-generated planner),
do **not** use Gemini Native Audio Dialog as the primary path. Recorded verdict:
`docs/docs/Architecture/Gemini-Native-Audio-Codegen-Verdict.md`.

Use:

- **REST `text-genai`** (`gemini-2.5-flash` via `@google/genai`) — current working
  path; `--force-path text-genai` on long-objective CLI, or
- **Gemini OpenAI-compatible Chat Completions** (OpenAI SDK + same `system`/`user`
  message shape) — evaluate via `probe/scripts/experimentGeminiOpenAiCompatMatrix.ts`.

Native Audio Dialog (`live-transcription`) remains in the repo for dialog/smoke
only: text in, audio out, **transcription-only** readback. It is not reliable for
`export async function run(ctx)` generation.

Codegen-friendly defaults (override in ignored `.env`):

```text
GEMINI_PLANNER_PRIMARY=text-genai
PROBE_LONG_OBJECTIVE_PROVIDER_ORDER=text-genai,live-transcription
```

Implementation:

- `probe/src/provider/gemini/nativeAudioDialog.ts`
- `callGeminiLivePlanner()` prefers `live-transcription` first
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

Smoke tests (`probe:gemini-live-smoke`, `probe:gemini-native-audio-dialog-smoke`)
are allowed only as quick optional wiring checks. They do not replace Minecraft
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

Canonical plan: `docs/docs/Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`.

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
