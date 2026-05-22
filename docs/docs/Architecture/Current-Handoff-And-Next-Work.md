---
sidebar_position: 7
---

# Current Handoff And Next Work

Search token: `CURRENT_HANDOFF_NEXT_WORK`.

This page is the handoff point for continuing the current rebuild. It summarizes
what has landed, what was verified, and what should be improved next.

## Current Runtime Baseline

The active direction is a bounded, observable Minecraft agent runtime.

The current proof target is still small:

- run a local headless Minecraft server;
- spawn one or more Mineflayer actors;
- feed each actor a bounded LLM/provider context;
- execute only actor-owned active action skills;
- verify progress from runtime evidence;
- persist artifacts so failures can be reviewed without guessing.

Do not expand into a large village simulation until boring gameplay competence
is reliable.

## Implemented Work

### Actor Workspace

Actor workspace is the source of truth for actor-owned runtime state.

Implemented surfaces:

- non-destructive actor workspace initialization;
- actor profile, memory, evidence, reviews, provider inputs, provider outputs,
  and relationship directories;
- action skill lifecycle directories for active, candidate, retired, rejected,
  and legacy proposal paths;
- actor-owned active seed action skill materialization;
- actor workspace active action skill reads for the runtime gate.

Important files:

- `probe/src/runtime/actorWorkspace.ts`;
- `probe/src/runtime/actorWorkspacePaths.ts`;
- `probe/src/runtime/actorWorkspaceStore.ts`;
- `probe/test/actorWorkspace.test.ts`;
- `probe/test/skillOwnership.test.ts`.

### Active Action Skill Gate

Runtime proposals now fail closed when the proposed primitive is not backed by
the actor's active action skill records.

Implemented surfaces:

- active primitive set derived from actor-owned active action skill records;
- `runAgentLoop` blocks provider proposals that are outside the gate;
- fake-progress and verification failures are persisted as actor-scoped
  evidence;
- mutual runtime dispatchers can consume active action skill records.

Important files:

- `probe/src/runtime/activeActionSkillGate.ts`;
- `probe/src/runtime/agentLoop.ts`;
- `probe/src/runProbe.ts`;
- `probe/test/activeActionSkillGate.test.ts`;
- `probe/test/agentLoop.phase1.test.ts`.

### Action Skill Lifecycle

Generated TypeScript is no longer trusted as active runtime capability.

Implemented surfaces:

- action skill recipe schema and validator;
- role/primitive compatibility checks;
- missing timeout and success-by-text rejection;
- bounded primitive recipe trials with evidence;
- promotion, supersession, retirement, and rejection helpers;
- legacy `build/generated-skills` archival into actor workspace candidates.

Important files:

- `probe/src/skills/recipes/*`;
- `probe/src/skills/proposals/*`;
- `probe/src/skills/lifecycle/*`;
- `probe/test/actionSkillRecipe.test.ts`;
- `probe/test/actionSkillProposalLifecycle.test.ts`;
- `probe/test/generatedActionSkillPolicy.test.ts`.

### Per-NPC Async Reviewer

Reviewer work is actor-scoped and asynchronous. Reviewers can propose findings,
candidate action skill repairs, and guarded relationship events, but they do not
mutate active action skills directly.

Implemented surfaces:

- reviewer output schema and writer;
- actor-scoped immutable review queue refs;
- deterministic reviewer runner;
- optional `openai-codex` reviewer adapter;
- guarded relationship proposal applier.

Important files:

- `probe/src/reviewer/reviewerQueue.ts`;
- `probe/src/reviewer/reviewerStore.ts`;
- `probe/src/reviewer/openaiCodexReviewer.ts`;
- `probe/src/reviewer/relationshipProposalApplier.ts`;
- `probe/test/asyncReviewer.test.ts`;
- `probe/test/relationshipProposalApplier.test.ts`.

### Provider Context And Snapshots

Provider context now carries runtime evidence instead of persona text alone.

Implemented surfaces:

- actor-provider-context builder;
- active action skills, candidates, recent evidence, reviews, memory, profile,
  goals, and relationship pressure in provider-facing context;
- provider input snapshots with credential-shaped key rejection;
- provider output store added for dashboard/review visibility;
- opt-in `openai-codex` gameplay provider path.
- gameplay provider failures after a turn observation are recorded as
  transcript-visible `provider_error` steps plus `provider_failed` runtime
  events, with the provider input snapshot still attached when snapshots are
  enabled.

Important files:

- `probe/src/provider/actorProviderContext.ts`;
- `probe/src/provider/providerInputStore.ts`;
- `probe/src/provider/providerOutputStore.ts`;
- `probe/src/provider/openaiCodexGameplayProvider.ts`;
- `probe/test/runtimeArtifacts.test.ts`;
- `probe/test/actorProviderContext.relationshipPressure.test.ts`.

### Social Actor Profiles And Relationships

Persona and goal modeling moved away from vague numeric floats.

Implemented surfaces:

- canonical actor profiles;
- role-aligned goal stacks;
- enum-first relationship state;
- directional relationship ledger;
- relationship-derived pressure injected into provider context without granting
  new tools.

Important files:

- `probe/src/npc/profiles.ts`;
- `probe/src/npc/goals/*`;
- `probe/src/npc/relationships/*`;
- `probe/test/actorProfiles.test.ts`;
- `probe/test/goalStack.test.ts`;
- `probe/test/relationshipLedger.test.ts`;
- `probe/test/relationshipActionPressure.test.ts`.

### Local Server, CLI, And Dashboard

The local probe path has moved toward a managed runtime instead of one-off code
edits per run.

Implemented surfaces:

- fixed Minecraft host port support;
- managed local live-smoke server readiness;
- spawn height offset to avoid burying NPCs;
- seed/spawn configuration updates;
- CLI options for NPC count, bot ids, max actions, observation window, actor
  workspace initialization, and dashboard port;
- Bun/Elysia dashboard server that starts with the CLI by default;
- dashboard assets and Minecraft-style item icons;
- best-effort runtime event streaming from `runAgentLoop` into the dashboard via
  `/api/runtime-events`, with SSE plus polling fallback.

Important files:

- `probe/src/cli.ts`;
- `probe/src/runProbe.ts`;
- `probe/src/server/liveSmokeServer.ts`;
- `probe/src/server/liveSmokeCli.ts`;
- `probe/src/server/dockerServer.ts`;
- `probe/src/dashboard/*`;
- `probe/test/serverConfig.test.ts`.

### Action Skill Verification

Implemented action skills now have explicit verification contracts.

Implemented surfaces:

- `collect_logs` treats block breaking as an atomic Mineflayer boundary;
- `collect_logs` tries the next nearby low log when a candidate cannot be
  reached or dug;
- `collect_logs` requires log inventory increase, not just block removal;
- `move_to` bounds `pathfinder.goto(...)` with timeout and `pathfinder.stop()`;
- `wait` reports positive tick and bounded duration evidence for ordered
  action-skill postconditions;
- `observe` reports observer id plus structured visible-actor and memory arrays
  for runtime-control postconditions;
- `craft_item` resolves real registry/recipe data and awaits `bot.craft(...)`;
- `craft_item` returns blocked, not crafted, when available inventory evidence
  shows no target item increase after `bot.craft(...)`;
- `craft_item` returns blocked before crafting when inventory evidence is
  unavailable, because crafting success cannot be verified without it;
- shared chest deposit rejects zero-item transfers before ledger writes;
- implemented seed action skills must declare primitive ownership, evidence,
  and test coverage.

Important files:

- `probe/src/tools/collectLogs.ts`;
- `probe/src/tools/moveTo.ts`;
- `probe/src/tools/craftItem.ts`;
- `probe/src/tools/sharedChest.ts`;
- `probe/src/gameplay/seedSkills/verificationContracts.ts`;
- `probe/test/actionSkillVerificationContracts.test.ts`;
- `probe/test/collectLogs.test.ts`;
- `probe/test/craftItem.test.ts`;
- `probe/test/sharedChest.test.ts`;
- `docs/docs/Architecture/Action-Skill-Verification.md`.

### Docs And Visual Architecture

The documentation was split so `SPEC.md` remains a gateway rather than a
monolith.

Implemented surfaces:

- architecture docs split by responsibility;
- Korean/English visual explanation page updates;
- Docusaurus homepage/readme refresh;
- current search index routing.

Important files:

- `SPEC.md`;
- `README.md`;
- `docs/docs/Agent-Search-Index.md`;
- `docs/docs/Architecture/*`;
- `docs/static/architecture/llm-context-and-actor-workspace.html`;
- `docs/src/pages/index.js`.

## Verified Commands

The following checks passed after the latest action skill verification work:

```bash
cd probe
bun test
bun run typecheck
```

```bash
git diff --check
```

```bash
cd docs
npm run build
```

The docs build still emits the known Docusaurus `localStorage` experimental
warning. It does not fail the build.

## Important Live Evidence So Far

The 3-NPC smoke run with `--max-actions 20` produced a partial result:

- `npc_a` and `npc_c` succeeded;
- `npc_b` failed `collect_4_logs`;
- increasing the action budget did not solve it;
- the failure pointed to action-skill reliability, not simply step budget.

That result drove the current `collect_logs` hardening:

- try multiple log candidates;
- do not poll mid-dig;
- require inventory acquisition;
- record candidate attempts.

## Next Improvements

### P0: Per-Action-Skill Live Harness

Initial implementation has landed. The CLI now runs one action skill at a time
through the real Mineflayer `runAgentLoop` path with a narrowed active action
skill gate.

Implemented behavior:

- select actor id;
- select action skill id;
- initialize actor workspace to baseline when requested;
- start or reuse the managed server;
- prepare skill-specific fixtures and inventory preconditions through RCON when
  the managed server is available;
- drive deterministic probes with an action-skill-specific provider instead of
  relying on the broader curriculum provider to pick the right primitive;
- keep this action-skill probe provider deterministic regardless of
  `PROBE_GAMEPLAY_PROVIDER`, so live contract checks do not require OpenAI auth
  and do not confuse LLM proposal behavior with primitive correctness;
- run exactly one action skill scenario through the existing runtime loop;
- persist pre/post observations, tool attempts, verification result, provider
  context if used, and transcript output;
- re-read the transcript and apply a postcondition check before reporting pass;
- exit with non-zero status when runtime evidence does not satisfy the action
  skill verification contract.

Command:

```bash
cd probe
bun run probe:skill -- --actor npc_b --skill collectLogs --max-actions 20 --init-actor-workspace baseline
```

The single-skill command runs Docker preflight before actor workspace
initialization, dashboard startup, or Minecraft startup unless `MC_PORT` points
at an already-running manual Minecraft server that passes a Minecraft protocol
ping. Manual `MC_PORT` probes are allowed only for action skills whose
precondition mode is `none`; fixture-backed probes require the managed server
because RCON setup is part of their evidence contract. If Docker/OrbStack is
unavailable and no live manual server override exists, it reports
`environment_blocked` with the Docker preflight command and exits without
mutating actor workspace state.

Do not make this a broad NPC simulation runner. It should be a narrow live
contract runner.

Matrix command:

```bash
cd probe
bun run probe:skills -- --max-actions 8 --init-actor-workspace baseline
```

Checklist command:

```bash
cd probe
bun run probe:skills -- --dry-run
```

Existing-evidence audit command:

```bash
cd probe
bun run probe:skills -- --audit-existing-evidence
```

Report artifact command:

```bash
cd probe
bun run probe:skills -- --dry-run --report ../tmp/action-skill-checklist.json
```

This command enumerates implemented seed action skills from the registry and
runs them one-by-one through the same live probe harness. It exists to make the
full action skill verification checklist reproducible after individual probes
are stable.

The matrix command runs a Docker preflight before actor workspace initialization
or Minecraft startup unless `MC_PORT` points at an already-running manual
Minecraft server that passes a Minecraft protocol ping. If Docker/OrbStack is
unavailable and no live manual server override exists, it reports an environment
blocker instead of mutating actor workspace state or turning the first action
skill into a misleading runtime failure.

Every matrix mode also prints `matrix_status_counts`, a terminal-readable mirror
of `summary.statusCounts`, so coverage can be checked without opening the JSON
report. It also prints `matrix_scope_counts`, which separates fresh current-run
evidence from historical transcript evidence, missing evidence, and environment
blockers. When gaps remain, it also prints `matrix_fresh_commands` with the
first few one-skill probe commands to run for fresh live evidence.

The dry-run checklist does not touch Docker, actor workspace, or the Minecraft
world. It prints each implemented action skill with:

- selected role;
- primitive ownership;
- declared preconditions;
- deterministic probe fixture/precondition mode;
- readiness items for registry status, role selection, primitive ownership,
  verification contract, postcondition spec, deterministic probe driver, and
  fixture/precondition mode;
- verification contract evidence;
- postcondition evidence;
- planned RCON fixture commands, or `(none)` when the probe must not mutate the
  world before execution.

Implemented action skills are now required to have explicit deterministic live
probe driver coverage and a probe fixture/precondition mode. A newly implemented
action skill without either one fails validation instead of flowing to a generic
terminal `remember` note.

The existing-evidence audit also avoids Docker and Minecraft startup. It scans
raw `action_skill_probe_*` transcripts under the evidence directory, skips
canonical projection files, re-applies runtime-owned postcondition specs, and
reports the newest raw transcript per action skill. This deliberately prevents
an older passing transcript from hiding a newer regression.

`--report <path>` writes the same matrix checklist or live result as JSON with
schema `action-skill-probe-matrix-report/v1`. Use this when handing off action
skill verification gaps to reviewer sidecars or later agents. The report has a
top-level `verdict` field: `passed`, `failed`, `environment_blocked`, or
`incomplete`. This keeps Docker/OrbStack blockers separate from actual action
skill failures and from partial runs that stopped before the whole matrix was
observed. The same report includes `skillStatuses`, one row per selected action
skill, so dashboards and reviewer sidecars can render the whole matrix without
reconstructing it from `results` and `evidenceGaps`. Each `cases[]` row also
includes `readinessItems`, the explicit verification-preparation checklist for
the selected action skill, and `fixtureCommands`, the exact RCON setup command
plan for Minecraft preconditions. Each status row includes a
`freshEvidenceCommand`, the exact single-skill probe command to run for fresh
live Minecraft proof. Each status row also includes `evidenceScope`:
`current_run`, `historical_transcript`, `missing`, or `environment_blocked`, so
reviewers can distinguish historical transcript proof from fresh live proof.
`summary.statusCounts` aggregates those rows by
`passed`, `failed`, `error`, `pendingLiveEvidence`, and `environmentBlocked`.
`summary.evidenceScopeCounts` aggregates those rows by `currentRun`,
`historicalTranscript`, `missing`, and `environmentBlocked`.
`evidenceGaps` lists every unproven action skill with its blocker status,
reason, required contract and postcondition evidence, and the same
fresh-evidence command. `nextActions` derives P0 reviewer/dashboard actions
from those gaps, classifying each row as environment restoration, fresh live
proof, or failed-probe repair with the exact command to run when available.
Environment restoration is de-duplicated into one actionable command;
fixture-backed `MC_PORT` blockers explicitly unset `MC_PORT` before checking the
managed Docker server. Per-skill fresh probe commands remain on `skillStatuses`
and `evidenceGaps`. Historical audit passes also produce
`refresh_historical_evidence` next actions so dashboards do not treat old proof
as fresh current-run proof after code changes.
The top-level report verdict follows the same rule: historical transcript
passes alone cannot make an evidence audit `passed`. A complete historical
audit without fresh current-run proof remains `incomplete` and points reviewers
at `refresh_historical_evidence` actions.
Live and audited rows also preserve structured
terminal/postcondition diagnosis fields when available:
`terminalStatus`, `terminalWhy`, `postconditionStatus`,
`postconditionFailure`, and `failureKind`. Use these fields for dashboards or
reviewer prompts instead of parsing the display `reason`.

Current harness status:

- the single-skill live harness is stable enough for current implemented action
  skills;
- the live matrix runner is implemented and has produced fresh current-run proof
  for every implemented seed action skill;
- dashboard runtime event streaming is implemented as best-effort observer
  telemetry and remains intentionally outside the gameplay success path.

Current postcondition rules:

- `runtimeObserveAndRemember` requires an observe result with an observation
  snapshot containing observer id, visible actor array, and memory array; a
  completed bounded wait with positive tick/duration evidence after that
  observation; and then a non-empty memory note;
- `collectLogs` requires passed runtime verifier progress with supported
  log-family inventory at the target count;
- `craftPlanksAndSticks` requires passed runtime verifier progress with both
  supported plank-family and stick output counts;
- `craftCraftingTable` requires passed runtime verifier progress with crafting
  table inventory output;
- inventory verifier progress must be attached to the expected primitive
  (`collect_logs` or `craft_item`), not an unrelated successful step;
- `inspectSharedChest` requires an `inspect_chest` result with a non-empty
  positive item snapshot, chest id, actor id, and positive ledger sequence;
- `depositSharedItems` requires `deposit_shared` with `itemName` and
  `chestId`, `movedCount > 0`, actor id, and positive ledger sequence;
- `handoffItemAtChest` requires an actor/ledger-identified named positive
  deposit before delivered handoff chat with matching target/text result
  evidence;
- `approachAndRequestItem` requires measured arrival distance evidence before
  delivered targeted chat result evidence requesting a specific item;
- `announceResourceDiscovery` requires delivered targeted resource-discovery
  chat result evidence and a resource memory note persisted after that
  announcement;
- `waitForBusyCrafter` requires busy response before bounded wait before
  delivered targeted follow-up chat result evidence; the wait result must carry
  positive ticks and duration evidence.

Checked-in protection:

- `probe/test/actionSkillProbeRunner.test.ts` rejects empty transcripts for
  every currently implemented action skill;
- the same runner now classifies terminal status separately from postcondition
  evidence, so a failed terminal note with valid Minecraft evidence is reported
  differently from missing evidence;
- matrix `results`, `skillStatuses`, and `evidenceGaps` now carry structured
  terminal/postcondition diagnosis fields, so handoff reviewers can tell whether
  a failure came from control flow, evidence, or both;
- existing-evidence audit uses the newest raw probe transcript per action skill,
  rather than selecting the best historical pass;
- implemented action skills must have deterministic probe driver and fixture
  mode coverage before the matrix accepts them;
- probe fixture setup has a pure RCON command planner, so craft, storage, and
  social preconditions can be checked without starting Minecraft;
- `none`-mode probes emit no fixture RCON commands, preventing setup from
  mutating the world for observation-only probes;
- the same test file includes a minimum accepted evidence payload for every
  implemented action skill through the runtime-owned
  `actionSkillPostconditionSpecs`, so adding a new implemented action skill
  without a postcondition rule becomes visible in tests.

Latest live matrix:

After OrbStack/Docker was restored on 2026-05-22, the current implemented
action-skill matrix passed:

```bash
cd probe
bun run probe:skills -- --max-actions 8 --init-actor-workspace baseline --continue-on-failure --report ../tmp/action-skill-live-matrix-current-final.json
```

```text
matrix_summary verdict=passed passed=10 failed=0 error=0 total=10/10
matrix_status_counts passed=10 failed=0 error=0 pending_live_evidence=0 environment_blocked=0
matrix_scope_counts current_run=10 historical_transcript=0 missing=0 environment_blocked=0
matrix_evidence_gaps count=0
```

Fresh current-run transcripts were produced for:

- `runtimeObserveAndRemember`;
- `collectLogs`;
- `craftPlanksAndSticks`;
- `craftCraftingTable`;
- `inspectSharedChest`;
- `depositSharedItems`;
- `approachAndRequestItem`;
- `announceResourceDiscovery`;
- `handoffItemAtChest`;
- `waitForBusyCrafter`.

The generated transcripts and matrix report live under ignored `data/evidence/`
and `tmp/` paths. Treat the command output as the current durable handoff
summary, not as committed artifact content.

Latest deterministic 3-NPC smoke:

```bash
cd probe
bun run src/cli.ts --provider deterministic --npcs 3 --max-actions 20 --observe-ms 0 --no-dashboard
```

```text
transcript: data/evidence/agent_loop_probe_v0-1779431536545.json
final.status: success
npc_b: collect_logs afterLogCount=4, inventoryDelta=4
npc_b: deposit_shared itemName=oak_log, movedCount=1
```

The managed probe start now clears bot inventories and prepares a tiny baseline
resource surface near spawn: one shared chest and four low `oak_log` blocks.
That keeps broader product smoke runs from inheriting stale action-skill
fixture inventory while still giving the gatherer a real boring task to finish.

Latest live provider smoke attempt:

```bash
cd probe
bun run src/cli.ts --provider openai-codex --npcs 3 --max-actions 6 --observe-ms 0 --no-dashboard
```

Current result:

```text
failed before gameplay provider turns because build/provider-auth/openai-codex-auth.json was missing
```

This is a setup/auth blocker, not action-skill evidence. Do not treat it as a
live LLM gameplay verdict. Once the ignored auth store exists, rerun the same
command and review provider input/output snapshots plus Langfuse traces against
the runtime transcript. If the provider fails after an actor turn begins,
`runAgentLoop` now records a failed `provider_error` transcript step and
`provider_failed` event instead of losing actor-local evidence.

Latest existing-evidence audit:

```bash
cd probe
bun run probe:skills -- --audit-existing-evidence --report ../tmp/action-skill-existing-evidence-current.json
```

Current result:

```text
matrix_summary verdict=incomplete passed=10 failed=0 error=0 total=10/10
matrix_status_counts passed=10 failed=0 error=0 pending_live_evidence=0 environment_blocked=0
matrix_scope_counts current_run=0 historical_transcript=10 missing=0 environment_blocked=0
matrix_evidence_gaps count=0
```

This is intentionally still `incomplete`: existing-evidence audit mode only
re-scores saved raw transcripts as historical proof. It must not replace a
fresh live matrix after code changes.

### P0: Live `collect_logs` Validation

Initial live validation has landed through the per-action-skill harness.

Latest confirmed command:

```bash
cd probe
bun run probe:skill -- --actor npc_b --skill collectLogs --max-actions 8 --init-actor-workspace baseline --no-dashboard
```

Latest confirmed artifact:

```text
data/evidence/action_skill_probe_collectLogs-1779430617926.json
```

Confirmed evidence:

- final status: `success`;
- final reason: `collectLogs completed with runtime verification evidence`;
- `collect_logs` attempted four `oak_log` blocks in the prepared fixture;
- inventory increased from `0` to `4`;
- verifier reason: `collect_4_logs reached 4/4 relevant inventory items`.

Implementation fixes discovered from the live run:

- preserve the full Mineflayer `Block` object from `bot.blockAt(...)` before
  `bot.dig(...)`; collapsing it to `{name, position}` removed `digTime()`;
- after a dig, walk back to the broken block as a pickup fallback when dropped
  item entity metadata is not visible yet;
- return `progressing`, not `blocked`, when one log was acquired before a later
  pickup miss;
- reset probe actor inventory and prepare a small `oak_log` fixture before the
  `collectLogs` live probe so repeated runs do not depend on depleted natural
  trees.

Still validate `collectLogs` alone in several nearby-tree conditions.

Validate:

- reachable low log;
- first candidate unreachable, second reachable;
- dropped item pickup after dig;
- no log nearby;
- action abort while pathing or digging.

If live failures remain, improve in this order:

1. pathfinder target/range selection;
2. candidate sorting and reachable filtering;
3. pickup wait/move behavior;
4. tool/equipment handling;
5. explicit tree search fallback.

Do not solve this by accepting block removal without inventory pickup.

### P0: Server/Dashboard Lifecycle Cleanup

The CLI should own server and dashboard process lifecycle cleanly.

Implemented behavior:

- dashboard startup checks whether the fixed port is already accepting
  connections and treats an existing process as reusable only after its
  `/api/state` endpoint returns `minecraft-agent-dashboard-state/v2`;
- dashboard startup remains best-effort and does not fail gameplay or action
  skill probes;
- dashboard event ingestion tolerates missing or partial artifacts because
  runtime events are fire-and-forget and state refresh still falls back to
  artifact polling;
- dashboard health checks use a short timeout, so a stale listener cannot hang
  CLI startup indefinitely.

Remaining work:

- stale process remediation remains manual: identify the process occupying the
  fixed port and stop it before re-running with dashboard events.

### P1: Crafting Table Boundary

Current `craft_item` is inventory-only. Wooden pickaxe and later progression
need a separate table-bound boundary.

Implement a primitive such as `use_crafting_table` or
`craft_with_crafting_table`.

Required evidence:

- table item exists or table block is nearby;
- if placing is required, block placement succeeds and is observed;
- recipe is resolved against the table;
- `bot.craft(recipe, count, table)` is awaited;
- inventory output increases.

Do not overload inventory-only `craft_item` with table discovery and placement.

### P1: Generic Mine Block Primitive

Add `mine_block` only after `collect_logs` is live-stable.

Required evidence:

- block target type;
- required tool check;
- pathfinder movement;
- atomic `bot.dig(...)`;
- inventory delta for target drop;
- failure reason for wrong tool, unreachable block, or missing drop.

Use it for cobblestone, coal, and later ore progression.

### P1: Dashboard As Runtime Observer

Keep the dashboard as an observer, not a control plane.

Improve:

- event stream from runtime artifacts;
- per-actor action timeline;
- current action skill ownership;
- current provider input/output;
- memory and relationship state;
- inventory/chest deltas with item icons;
- failed verification cards grouped by actor and action skill.

The dashboard should help a human see what happened, not become a dependency
for gameplay success.

### P1: Provider Output Snapshots Everywhere

Provider input snapshots exist. Provider outputs are now represented, but need
consistent use across all provider-backed paths.

Improve:

- gameplay provider output snapshots;
- reviewer output snapshots;
- dashboard consumption of latest raw input/output;
- credential filtering on output-like debug payloads.

### P2: Reviewer Scoring From Real Runs

Do not tune reviewer prompts from imagined failures.

Use live action skill probe evidence to improve:

- fake-progress detection;
- repeated path failure detection;
- candidate action skill repair proposal quality;
- relationship event proposal quality.

Reviewers remain asynchronous sidecars.

### P2: Documentation Cleanup Before Commit

Before committing the current branch, inspect docs and generated assets.

Check:

- deleted `docs/blog/2026-05-22-migration-journey.md` is intentional;
- new `data/` artifacts should not be committed unless explicitly selected;
- dashboard assets are intentional and license-safe;
- no absolute local paths are committed in docs;
- `SPEC.md`, `README.md`, `intro.md`, and `Agent-Search-Index.md` align.

## Suggested Next Work Order

1. Keep the 10-action-skill live matrix as the regression gate after action
   skill, primitive, role, or verifier changes.
2. Add repeatability checks for the most interruption-sensitive skills,
   starting with `collectLogs` variants: reachable low log, first candidate
   unreachable then second reachable, dropped-item pickup after dig, no log
   nearby, and abort while pathing or digging.
3. Use dashboard runtime events to inspect each live probe turn while keeping
   the dashboard as an observer, not a control plane.
4. Feed live failures into actor evidence and reviewer queue.
5. Add crafting-table primitive.
6. Add generic `mine_block`.
7. Only then re-run broader 3-NPC LLM gameplay as a product smoke, not as a
   substitute for per-action-skill proof.

This keeps the project focused on real action skill competence before scaling
back to broader NPC behavior.
