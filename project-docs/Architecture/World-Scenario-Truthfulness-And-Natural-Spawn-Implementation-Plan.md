---
sidebar_position: 103
---

# World Scenario Truthfulness And Natural Spawn Implementation Plan

Search token: `WORLD_SCENARIO_TRUTHFULNESS_NATURAL_SPAWN_PLAN`.

Status: active implementation plan.

Recorded:

- `2026-06-12 08:06:41 KST (+0900)`
- `2026-06-11 23:06:41 UTC`

## Summary

The next world-scenario work must make setup evidence truthful before another
provider-heavy Minecraft run is used to judge Actor Turn behavior. The latest
flat roofless-hut manifests recorded required RCON setup commands as `passed`
even when the command output contained failure text such as `Incomplete` and
`That position is not loaded`. That means the previous flat fixture run is
useful as a failure signal, but not trustworthy enough to prove that the
worksite and resource rack were actually prepared.

The implementation should proceed in two slices:

1. harden world-scenario setup truthfulness; then
2. add a natural safe-spawn scenario that validates a playable ordinary start
   without mutating terrain or pre-crediting actor progress.

This must not become a hidden shelter planner, spawn script for success, or
domain-specific strategy layer. World scenarios are test-environment contracts.
Actor Turn still chooses actions through visible Action Cards or
`author_mineflayer_action`, and runtime evidence remains the only progress
authority.

## Planning Method Used

This plan follows the local harness planning pattern:

- write a committable markdown artifact so intent survives context resets;
- separate the problem and non-goals from implementation mechanics;
- ground each phase in repo files and existing patterns;
- define verifiable gates before runtime experiments;
- keep dated handoff context separate from long-term architecture.

For this repo, that means the plan is an internal project document under
`project-docs/Architecture/`, with search-index routing and explicit validation
commands. It is not a public docs page and not a replacement for `SPEC.md` or
`AGENTS.md`.

## Current Evidence

Latest relevant docs:

- `project-docs/Architecture/Natural-Safe-Spawn-World-Scenario-Research-2026-06-10.md`
- `project-docs/Architecture/Roofless-Hut-Flat-Scenario-Run-2026-06-08.md`
- `project-docs/Setup/World-Scenario-Testing.md`

Latest local artifact evidence found repeated setup false positives:

| Manifest symptom | Why it matters |
| --- | --- |
| `setworldspawn 0 64 0 0` returned `Incomplete ...` but was recorded as `passed` | The fixture spawn anchor may not have been set. |
| `gamerule minecraft:spawn_chunk_radius 2` returned `Incorrect argument for command` but was recorded as `passed` | Optional compatibility commands need truthful failure status. |
| required `fill ... minecraft:dirt` returned `That position is not loaded` but was recorded as `passed` | The work pad may not have been prepared. |
| required `fill ... minecraft:oak_log` returned `That position is not loaded` but was recorded as `passed` | The nearby resource rack may not have existed. |

Therefore the next Actor Turn run should not be used as a model-quality verdict
until scenario setup results can distinguish:

- setup failure;
- bad spawn;
- missing reachable natural resource;
- genuine Actor Turn decision-loop failure.

## Non-Goals

- Do not make flat fixtures the default social-run environment.
- Do not hide a building, shelter, storage, or survival planner inside world
  setup.
- Do not place natural-scenario resources, clear a pad, or build starter
  structures.
- Do not count any RCON setup, spawn validation, teleport, gamerule, fixture
  block, or scenario event as actor progress.
- Do not parse provider prose, PlanBeads, memory, or Minecraft Basic Guide text
  as execution authority.
- Do not make this a broad biome-search or benchmark curriculum project.

## Patterns To Mirror

| Category | Source | Pattern |
| --- | --- | --- |
| Scenario definitions | `probe/src/server/worldScenarios.ts` | Keep named scenarios small, typed, manifest-backed, and explicit about fixture dependency. |
| Scenario reporting | `probe/src/runtime/socialCycleRunner.ts` | Write world-scenario manifests into actor workspace evidence and link them from the social-cycle report. |
| Tests | `probe/test/worldScenarios.test.ts` | Use focused `node:test` assertions around scenario parsing, command building, and command-run outcomes. |
| Documentation routing | `project-docs/Agent-Search-Index.md` | Add a search token and route the plan beside current setup/research docs. |
| Runtime authority | `AGENTS.md` and `SPEC.md` | Keep setup context separate from actor progress and runtime action truth. |

## Files To Change

| File | Action | Why |
| --- | --- | --- |
| `probe/src/server/worldScenarios.ts` | Update | Add RCON output failure classification, correct known command issues, and define `natural-safe-spawn-v1`. |
| `probe/test/worldScenarios.test.ts` | Update | Lock required/optional RCON failure handling and natural-scenario config behavior. |
| `probe/src/runtime/socialCycleRunner.ts` | Update | Persist natural spawn validation artifacts and make setup status truthful in reports. |
| `project-docs/Setup/World-Scenario-Testing.md` | Update | Document fixture vs natural safe-spawn lanes and setup-failure semantics. |
| `project-docs/Architecture/Current-Handoff-And-Next-Work.md` | Update | Record the current implementation order and latest evidence caveat. |
| `project-docs/Agent-Search-Index.md` | Update | Route future agents to this plan. |
| `project-docs/Documentation-Map.md` | Update | List the plan as an active internal implementation document. |

## Implementation Phases

### Phase 1: RCON Output Truthfulness

Goal: scenario setup commands must fail when their output is failure-like, even
if the RCON transport itself does not throw.

Tasks:

- Add a small function that classifies known failure-like RCON output.
- Treat required command failure-like output as `status: "failed"` and
  `required_failure: true`.
- Treat optional command failure-like output as `status: "failed"` without
  blocking the phase.
- Preserve the raw output in command results so reviews can inspect it.
- Keep the classifier narrow and evidence-driven; do not attempt broad natural
  language interpretation of all server output.

Initial failure strings:

- `That position is not loaded`
- `Incomplete`
- `Incorrect argument for command`
- `Unknown or incomplete command`
- `No player was found`

Validation:

```bash
cd probe
bun test test/worldScenarios.test.ts
```

Acceptance:

- A required command returning `That position is not loaded` blocks setup.
- An optional command returning `Incorrect argument for command` records failed
  status but does not block setup.
- Existing successful outputs still record `passed`.

### Phase 2: Repair Or Reframe The Flat Fixture

Goal: keep the flat roofless-hut fixture useful as a controlled lane only if it
can prove its own setup.

Tasks:

- Fix command syntax that is known to fail on the configured Minecraft version.
- Decide whether pre-bot `fill` commands need chunk-loading preparation or
  should move to a post-bot phase after the actor joins and the area is loaded.
- If a command is intentionally best-effort, mark it optional and explain why in
  the manifest notes.
- If the fixture cannot be made truthful cheaply, keep it as a lower-priority
  debug lane and prioritize `natural-safe-spawn-v1`.

Validation:

```bash
cd probe
bun test test/worldScenarios.test.ts
```

Then run a short fixture setup smoke before any provider-heavy run.

Acceptance:

- A flat fixture report cannot say `setup_status: "passed"` while required
  setup command output contains known failure text.
- Scenario manifest evidence is enough to tell whether the work pad and resource
  source actually existed.

### Phase 3: Add `natural-safe-spawn-v1`

Goal: provide a natural survival/social run lane that avoids dense-canopy or
tree-top starts without turning the world into an artificial fixture.

Scenario policy:

- `lane`: `survival_social_run`
- `LEVEL_TYPE`: `default`
- no `GENERATOR_SETTINGS`
- no `fill`, `setblock`, resource rack, cleared pad, or starter structure
- ordinary terrain and natural resources remain world truth
- peaceful or otherwise deterministic starting conditions may be configured
  only as scenario policy, not actor progress

Acceptance criteria for a selected natural spawn:

- player standing cell and head cell are passable;
- block below is ordinary solid natural ground, not leaves or logs;
- immediate radius is not dominated by leaves or logs;
- player is not in water, lava, powdered snow, cactus, fire, or a cave opening;
- a reachable `*_log` block exists within a bounded radius such as 16-32 blocks;
- if simpler terrain candidates exist, reject dense canopy starts such as jungle
  or dark forest;
- evidence records scan radius, selected coordinate, rejections, nearest logs,
  loaded-world limits, and `credited_as_actor_progress: false`.

Validation:

```bash
cd probe
bun test test/worldScenarios.test.ts
```

Acceptance:

- `parseWorldScenarioId("natural-safe-spawn-v1")` succeeds.
- Applying the scenario keeps a default natural world and does not set
  `generatorSettings`.
- The scenario manifest explicitly says setup validation is not actor progress.

### Phase 4: Spawn Validation Artifact

Goal: make safe-spawn selection inspectable from actor workspace artifacts.

Tasks:

- Add `natural-spawn-validation/v1` evidence under the actor workspace.
- Include server seed, selected coordinate, scan center/radius, ground block,
  headroom result, nearest logs, rejection reasons, and loaded-world limits.
- Link the artifact from the scenario manifest or report.
- If no acceptable spawn is found, mark setup failed rather than starting a
  misleading Actor Turn run.

Validation:

```bash
cd probe
bun test test/worldScenarios.test.ts
cd probe
bun run typecheck
```

Acceptance:

- A natural scenario setup failure is visible as environment/setup failure, not
  Actor Turn failure.
- The artifact is reviewable without replaying the world.

### Phase 5: Smoke Runs Before Provider Runs

Goal: avoid spending model budget before environment truthfulness is proven.

Order:

1. run focused tests;
2. run a short deterministic/no-provider setup smoke when possible;
3. run a 10-20 cycle provider run with screenshots;
4. only then run a 40/60 cycle provider-heavy behavior evaluation.

Initial provider-run review questions:

- Did scenario setup pass with no required failure-like command output?
- Did spawn validation prove a playable natural start?
- Did Actor Turn consume source evidence and prior action results?
- Did repeated non-progress create a visible pivot pressure without hidden
  strategy injection?
- Did PlanBeads remain passive and evidence-linked?

## Validation Gate

Before committing implementation work for this plan:

```bash
cd probe
bun test test/worldScenarios.test.ts
cd probe
bun run typecheck
cd docs
npm run build
git diff --check
```

For runtime claims, include exact report paths, manifest paths, screenshot
directories, provider/model/reasoning settings, usage totals, and setup status.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| RCON failure classifier is too broad | Medium | Could mark valid output as failed | Keep patterns narrow and test exact known failures first. |
| Flat fixture still fails due to unloaded chunks | High | Fixture remains unreliable | Run setup after bot join or record it as a fixture limitation before natural-lane work. |
| Natural spawn validation becomes a hidden planner | Medium | Violates runtime authority boundary | Record only starting-condition evidence; do not supply strategy, coordinates for building, or material plans to Actor Turn. |
| Spawn search gets too expensive or flaky | Medium | Live run setup becomes slow | Bound radius/candidates and fail truthfully when no acceptable start is loaded. |
| Provider run is judged before setup is proven | High | Misdiagnosis repeats | Require setup manifest and validation artifact review before behavior verdict. |

## Done Criteria

- RCON command output failure handling is implemented and tested.
- Existing flat fixture manifests can no longer hide required setup failures.
- `natural-safe-spawn-v1` is defined as a natural-world lane with no terrain
  mutation or fixture resource placement.
- Spawn validation writes an artifact with explicit
  `credited_as_actor_progress: false`.
- Documentation explains fixture vs natural lanes and setup-failure semantics.
- A short smoke report proves environment setup truthfulness before another
  provider-heavy Actor Turn evaluation.
