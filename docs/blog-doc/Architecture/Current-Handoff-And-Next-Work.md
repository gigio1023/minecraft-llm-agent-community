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

## Latest Live Evidence

Recorded 2026-06-03 (`Asia/Seoul`).

The current Actor Turn plus passive PlanBeads line has now been tested beyond
the initial shared-storage fixture. The latest verdict is
`PASSED_RUNTIME_BUT_BEHAVIOR_LOOP_WEAK`: the runtime completes long low-cost
provider runs and records truthful evidence, but the NPC still collapses into
resource loops before the social/shelter behavior is strong enough.

Longer live runs under OpenAI `gpt-5.4-nano`:

- `tmp/social-smoke-openai-nano-30cycle-passive-planbeads-v13.json`:
  `runtime_status=passed`, 45 provider records, 328,773 total tokens, 30 cycles.
  The actor deposited `1 oak_log`, crafted planks/sticks, crafted and placed a
  crafting table, crafted a wooden pickaxe through a table-bound path, and used
  10 distinct top-level actions. Remaining weakness: shelter stayed unverified,
  social evidence stayed thin, and several cycles still hit blocked movement,
  collection, or placement attempts.
- `tmp/social-smoke-openai-nano-60cycle-passive-planbeads-v14.json`:
  `runtime_status=passed`, 75 provider records, 598,552 total tokens, 60 cycles.
  Provider usage guard projected 5,654,444 / 9,000,000 daily tokens, so the run
  stayed within the current OpenAI budget policy. Outcome distribution was
  49 `verified_progress`, 2 `partial_verified_progress`, 8 `blocked`, and
  1 `no_progress`. The actor kept real inventory/world progress:
  final inventory included `wooden_pickaxe`, `crafting_table`, 23 `cobblestone`,
  23 `oak_planks`, 6 `stick`, and 5 `dirt`.

What improved in this slice:

- completed shared-storage evidence can close stale shared-storage PlanBeads
  from current state before the ready front is exposed;
- deliberation receives `current_state` and suppresses stale shared-storage
  reopen proposals when the contribution is already done;
- Actor Turn demotes repeated `mineCobblestone` only when cobblestone is already
  sufficient and no explicit shortage exists, while keeping the Action Card
  available;
- crafting table state now distinguishes a known or placed table from a table
  that is nearby and usable by the actor;
- Actor Turn repair removes rejected Action Cards from both the visible card
  list and `decision_frame` candidate lists.

Remaining failures from the 60-cycle review:

- `mineCobblestone` returned as the dominant late action: 22 of 60 top-level
  actions, including 14 in cycles 41-60. This is a `loop-constriction` finding,
  not a runtime crash.
- `buildBasicShelter` ran 3 times and never produced verified shelter evidence,
  so `starter_shelter_verified` remains pending.
- social evidence remains minimal: one `deposit_shared` mutation, no visible
  actors, no `say` tool calls, and no relationship events.
- PlanBead audit still fails because several CycleJudgments make physical
  absence/progress claims without exhaustive scan evidence, and the live run
  still uses builtin goal authority.

Earlier accepted shared-storage slices remain useful but are no longer the
latest behavioral proof:

- `tmp/social-smoke-openai-nano-2cycle-rerun6.json`:
  `run_lifecycle=completed`, `runtime_status=passed`, 3 provider records,
  20,373 total tokens. The actor saw a nearby chest, chose `inspect_chest`,
  then deposited exactly `1 oak_log` into `shared-chest-1` for the run-scoped
  `npc_a` request.
- `tmp/social-smoke-openai-nano-3cycle-rerun7.json`:
  `run_lifecycle=completed`, `runtime_status=passed`, 5 provider records,
  31,836 total tokens. The actor deposited `1 oak_log`, later Actor Turn inputs
  showed `deposit_candidates[oak_log].socially_requested=false`, and
  `Deposit Shared` / `Deposit Shared Items` Action Cards were hidden, preventing
  repeated completion of the same request.
- `tmp/social-smoke-openai-nano-3cycle-decision-frame-v2.json`:
  `run_lifecycle=completed`, `runtime_status=passed`, 4 provider records,
  29,916 total tokens. The actor performed
  `deposit_shared(1 oak_log) -> craftPlanksAndSticks -> craftCraftingTable`.
  Cycle 3 input showed `decision_frame.episode_focus_status.status=satisfied`,
  `open_social_requests=[]`, and no `Inspect Chest` / `Inspect Shared Chest`
  Action Cards, so the cheap model did not re-verify the completed handoff.

Next work:

- make Actor Turn choose a valuable next action after sufficient cobblestone
  instead of returning to `mineCobblestone`;
- improve `buildBasicShelter` or replace it with a narrower, more verifiable
  Mineflayer-backed shelter action skill;
- add a social-visible follow-up action after a completed shared-storage
  contribution, such as a bounded `say` or relationship event path;
- tighten CycleJudgment wording or audit policy so non-exhaustive scans do not
  become absolute absence claims;
- keep Actor Turn as the opt-in hot path until actionfulness, PlanBead
  continuity, social consequence, and budget gates pass together.

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

### Per-Actor Async Reviewer

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
  goals, and relationship context signal in provider-facing context;
- social-cycle context now includes `action_surface`, a direct/deferred
  affordance packet for the actor's current body. It is not a domain strategy or
  single-domain checklist;
- social-cycle context now includes a runtime-owned `settlement_state` packet
  with inventory counts, checklist progress, blocker histogram, active action
  skill ids, shared storage summary, known positions, and checklist status. This
  is compatibility diagnostic state, not a fixed provider strategy;
- provider input snapshots with credential-shaped key rejection;
- provider output store added for dashboard/review visibility;
- opt-in `openai-codex` gameplay provider path.
- gameplay provider failures after a turn observation are recorded as
  transcript-visible `provider_error` steps plus `provider_failed` runtime
  events, with the provider input snapshot still attached when snapshots are
  enabled.

### World-State Diagnostics And ActionIntent Contracts

Provider context now has a stricter autonomy-substrate boundary:

- `observe` can include `world-state-summary/v1`, a bounded Mineflayer scan with
  center, radius, vertical range, loaded-world limits, raw observed Minecraft
  names, nearest examples, truncation, and limitations;
- loaded-world coverage is marked as sampled and non-exhaustive unless a future
  scanner can prove otherwise. Absence claims must stay scoped to scan limits;
- provider-facing world summaries must stay query-neutral and must not expose
  fixed resource, station, construction-readiness, or survival-priority
  categories;
- direct provider `use_primitive` intents are checked against structured
  primitive args contracts before persistence/execution;
- natural-language rationale fields are not executable authority;
- direct provider primitive intents cannot spoof `args.actionSkillId` to borrow
  an action-skill-local fallback;
- direct provider shared-storage transfers require explicit `count` or
  `targetCount`;
- `wait` and `remember` pass through CycleGoal and active action-skill gates
  instead of bypassing runtime authority;
- report audit/review now count only explicit `world-state-summary/v1` or
  `world-state-scan/v1` artifacts as scan evidence;
- missing physical args produce artifact-visible
  `action_intent_contract_failure` evidence instead of hidden movement or
  gameplay defaults.

Important files:

- `probe/src/provider/actorProviderContext.ts`;
- `probe/src/provider/providerInputStore.ts`;
- `probe/src/provider/providerOutputStore.ts`;
- `probe/src/provider/openaiCodexGameplayProvider.ts`;
- `probe/src/tools/worldStateScan.ts`;
- `probe/src/runtime/goals/actionIntentContracts.ts`;
- `probe/test/runtimeArtifacts.test.ts`;
- `probe/test/actorProviderContext.relationshipContext.test.ts`.

### Runtime Retry Constraints

Repeated exact failures are now runtime gates, not only prompt advice.

Implemented surfaces:

- `runtime-retry-attempt/v1` records are derived from blocked, failed, timeout,
  cancelled, or postcondition-failed attempts;
- `runtime-retry-constraint/v1` groups the same actor, ActionIntent target,
  normalized structured args, and normalized blocker reason after repeated
  evidence;
- social-cycle context exposes `runtime_retry_constraints` to both CycleGoal and
  ActionIntent providers;
- the executor blocks a matching retry before Mineflayer execution and writes
  `retry_constraint_blocked` evidence;
- social-cycle reports record `runtime_retry_constraints` and per-attempt
  `retry_constraint_blocked` flags;
- review summaries count runtime retry constraints and blocked retry attempts;
- context compaction preserves retry constraints as exact target/args gates, not
  domain strategy.

Important files:

- `probe/src/runtime/retryConstraints.ts`;
- `probe/src/runtime/socialCycleRunner.ts`;
- `probe/src/runtime/socialCycleExecution.ts`;
- `probe/src/runtime/goals/cycleContextAssembler.ts`;
- `probe/src/runtime/goals/socialCycleContextCompaction.ts`;
- `probe/src/runtime/goals/socialCycleReviewSummary.ts`;
- `probe/test/socialCycleExecution.test.ts`;
- `probe/test/socialCycleContextCompaction.test.ts`.

### Social Actor Profiles And Relationships

Persona and goal modeling moved away from vague numeric floats.

Implemented surfaces:

- canonical actor profiles;
- role-aligned goal stacks;
- enum-first relationship state;
- directional relationship ledger;
- relationship-derived context injected into provider context without granting
  new tools.
- social-cycle `relationship_event_proposals` now route through a guarded
  applier path and are recorded as applied, already applied, or rejected instead
  of mutating relationship edges directly from provider text.

Important files:

- `probe/src/npc/profiles.ts`;
- `probe/src/npc/goals/*`;
- `probe/src/npc/relationships/*`;
- `probe/test/actorProfiles.test.ts`;
- `probe/test/goalStack.test.ts`;
- `probe/test/relationshipLedger.test.ts`;
- `probe/test/relationshipActionContext.test.ts`.

### Local Server, CLI, And Dashboard

The local probe path has moved toward a managed runtime instead of one-off code
edits per run.

Implemented surfaces:

- fixed Minecraft host port support;
- managed local live-smoke server readiness;
- spawn height offset to avoid burying Mineflayer bots;
- seed/spawn configuration updates;
- CLI options for actor count, bot ids, max actions, observation window, actor
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
- the social-cycle executor now records action-skill postcondition results for
  owned action skill bundles, so `placeCraftingTable`, `buildBasicShelter`,
  storage, crafting, gathering, and social handoff bundles cannot rely on
  primitive status alone when a checklist-facing verifier is available.
- the `move_to` social-cycle exception is represented as a bounded movement
  policy with a 12-block cap and measured movement evidence instead of an
  invisible active-action-skill gate bypass.

Important files:

- `probe/src/tools/collectLogs.ts`;
- `probe/src/tools/moveTo.ts`;
- `probe/src/tools/craftItem.ts`;
- `probe/src/tools/sharedChest.ts`;
- `probe/src/runtime/settlement/settlementState.ts`;
- `probe/src/runtime/socialCycleExecution.ts`;
- `probe/src/gameplay/seedSkills/verificationContracts.ts`;
- `probe/test/actionSkillVerificationContracts.test.ts`;
- `probe/test/collectLogs.test.ts`;
- `probe/test/craftItem.test.ts`;
- `probe/test/sharedChest.test.ts`;
- `docs/blog-doc/Architecture/Action-Skill-Verification.md`.

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
- `docs/blog-doc/Agent-Search-Index.md`;
- `docs/blog-doc/Architecture/*`;
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

## Current Provider Cost Posture

- `probe:social-cycle` defaults to `deterministic-social`; live provider calls
  require `--provider`.
- Current lightweight live provider target is `gemini-api` with
  `gemma-4-31b-it`.
- Provider-backed calls write usage records into provider output snapshots and
  `build/provider-usage/provider-usage-ledger.jsonl`.
- Use `PROVIDER_USAGE_BUDGETS_JSON` or
  `build/provider-usage/free-tier-budgets.json` to encode user-provided
  dashboard usage before long free-tier runs.

## Important Live Evidence So Far

Latest fresh action-skill matrix:

- `14/14` implemented action skills passed with `current_run` evidence;
- `buildBasicShelter`, `placeCraftingTable`, `mineCobblestone`, storage, and
  social handoff contracts all passed their isolated live postconditions;
- this proves the seed action skills can work when their preconditions are made
  explicit by the harness.

Latest long-horizon OpenAI social-cycle stress test:

- command target: one actor, `gpt-5.4-mini`, fresh world, 100 cycles, broad
  settlement WorldEvent context;
- recorded result: 54 cycles before cleanup hit a host file-permission blocker;
- report audit: passed;
- `builtin_goal_authority=false`, `builtin_execution_source=false`,
  `fixture_dependency=false`;
- later provider inputs used prior judgment and memory;
- concrete progress included current-run inventory, crafting, and block
  placement evidence;
- the run did not claim broader goal completion because the matching verifier
  did not pass.

Interpretation:

- the runtime is preserving truth and context;
- the planner/control layer still needs stronger argument validation,
  repeated-blocker pivot rules, partial-progress reporting, and review-summary
  schema catch-up;
- those follow-ups are now tracked in `Architecture/Future-Works.md` rather
  than changing the long-term spec.

The 3-actor/3-bot smoke run with `--max-actions 20` produced a partial result:

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
  log-family inventory at the target count, plus a `collect_logs` result with
  positive `inventoryDelta`, `afterLogCount` at the target count, and at least
  one `attemptedBlocks[]` entry whose outcome is `dug`;
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

The previously recorded 2026-05-22 live matrix covered 12 action skills. That
baseline is now stale because the implemented surface has grown to 14 action
skills. The current baseline was refreshed on 2026-05-24:

```bash
cd probe
bun run probe:skills -- \
  --actor npc_b \
  --max-actions 8 \
  --init-actor-workspace baseline \
  --continue-on-failure \
  --report ../tmp/action-skill-live-matrix-docker-engine-before-commit.json
```

```text
matrix_summary verdict=passed passed=14 failed=0 error=0 total=14/14
matrix_status_counts passed=14 failed=0 error=0 pending_live_evidence=0 environment_blocked=0
matrix_scope_counts current_run=14 historical_transcript=0 missing=0 environment_blocked=0
matrix_evidence_gaps count=0
```

This latest matrix was rerun after replacing the Podman compatibility path with
official Docker Engine on Ubuntu 24.04 arm64. The managed Minecraft server path,
RCON fixtures, runtime loop, and all 14 action-skill postconditions passed under
that Docker Engine setup.

Fresh current-run transcripts were produced for:

- `runtimeObserveAndRemember`;
- `collectLogs`;
- `craftPlanksAndSticks`;
- `craftCraftingTable`;
- `placeCraftingTable`;
- `craftWoodenPickaxe`;
- `mineCobblestone`;
- `buildBasicShelter`;
- `inspectSharedChest`;
- `depositSharedItems`;
- `approachAndRequestItem`;
- `announceResourceDiscovery`;
- `handoffItemAtChest`;
- `waitForBusyCrafter`.

The generated transcripts and matrix report live under ignored `data/evidence/`
and `tmp/` paths. Treat the command output as the current durable handoff
summary, not as committed artifact content.

Implementation notes from this pass:

- `collectLogs` uses actor-relative log fixtures and a bounded post-dig pickup
  sweep, closing a live matrix failure where four logs were dug but only three
  were observed before the provider repeated the action.
- `mineCobblestone` uses an actor-relative stone fixture, preserves the full
  Mineflayer block object for `bot.dig(...)`, and separates pickup movement from
  dig-range look-at behavior.
- `observe` no longer lets optional shared-chest inspection failures abort an
  observation, while storage probes clear nearby stale chests before placing the
  managed fixture.

Latest deterministic 3-actor/3-bot smoke:

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
matrix_summary verdict=incomplete passed=14 failed=0 error=0 total=14/14
matrix_status_counts passed=14 failed=0 error=0 pending_live_evidence=0 environment_blocked=0
matrix_scope_counts current_run=0 historical_transcript=14 missing=0 environment_blocked=0
matrix_evidence_gaps count=0
```

This is intentionally still `incomplete`: existing-evidence audit mode only
re-scores saved raw transcripts as historical proof. It must not replace a
fresh live matrix after code changes. The command can exit non-zero because
`incomplete` is the correct verdict for historical-only evidence, even when all
14 historical transcripts re-score as passed.

### P0: Live `collect_logs` Validation

Initial live validation has landed through the per-action-skill harness.

Latest confirmed command:

```bash
cd probe
bun run probe:skill -- --actor npc_b --skill collectLogs --max-actions 8 --init-actor-workspace baseline --no-dashboard
```

Latest confirmed artifact:

```text
data/evidence/action_skill_probe_collectLogs-1779432570621.json
```

Confirmed evidence:

- final status: `success`;
- final reason: `collectLogs completed with runtime verification evidence`;
- `collect_logs` attempted four `oak_log` blocks in the prepared fixture;
- inventory increased from `0` to `4`;
- primitive result reported `inventoryDelta=4`, `afterLogCount=4`, and four
  `attemptedBlocks[]` entries with `outcome=dug`;
- verifier reason: `collect_4_logs reached 4/4 relevant inventory items`.

The probe postcondition now rejects a `collectLogs` transcript when the verifier
passes but the primitive result lacks positive inventory delta or dug-block
attempt evidence. This keeps action-skill proof tied to the Mineflayer action
boundary, not only to a later inventory snapshot.

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

### Implemented: Table-Bound Crafting Boundary

`craft_item` remains inventory-only. Wooden pickaxe progression now uses the
separate `craft_with_table` primitive and `craftWoodenPickaxe` seed action
skill.

Implemented behavior:

- `craft_with_table` finds a nearby `crafting_table` block instead of silently
  treating inventory-only crafting as enough;
- the recipe is resolved against the table block;
- `bot.craft(recipe, 1, table)` is awaited;
- primitive evidence records `tablePosition`, `beforeCount`, `afterCount`, and
  positive `inventoryDelta`;
- runtime postconditions require passed `wooden_pickaxe` inventory evidence;
- the action-skill matrix includes `craftWoodenPickaxe` as current-run proof.

Placement boundary:

- placing a crafting table from inventory is now represented by the separate
  `placeCraftingTable` action skill and `place_block` evidence path;
- keep `craft_with_table` focused on table-bound crafting and local table
  fallback only when the primitive can prove the table position and crafted
  inventory delta.

Do not overload inventory-only `craft_item` with table discovery and placement.

### Implemented: Narrow Mine Block Primitive

`mine_block` now exists for the first bounded progression contract:
`mineCobblestone`.

Implemented behavior:

- live fixture gives a wooden pickaxe and places exposed nearby `stone`;
- primitive checks a pickaxe before digging;
- nearby in-range stone is looked at and dug without letting pathfinding become
  the proof;
- postcondition requires `status=mined`, `equippedTool` containing `pickaxe`,
  a dug `stone` attempt, `blockRemoved=true`, positive `cobblestone`
  `inventoryDelta`, and passed verifier evidence.

Remaining target-action expansion:

- broader target discovery, target selection, traversal, and large target counts
  remain future action-skill contracts. Do not treat one narrow proof as broad
  autonomy.

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

1. Keep the implemented action-skill live matrix as the regression gate after
   action skill, primitive, role, or verifier changes.
2. Preserve the corrected architecture rule: provider-facing context is
   query-neutral evidence substrate, not a fixed resource, station,
   construction, or survival strategy taxonomy.
3. Treat physical `ActionIntent` args as the immediate runtime contract. Missing
   target, item, position, or container args should fail with artifact-visible
   `action_intent_contract_failure` evidence instead of hidden executor defaults.
4. Improve world-state diagnostics as a raw Mineflayer scan: center, radius,
   vertical range, loaded-world limits, raw observed names, nearest examples,
   truncation, and evidence refs.
5. Expand context compaction only as evidence-linked state preservation:
   ActorSoul/LifeGoal, current inventory, known positions, container snapshots,
   repeated blockers, runtime retry constraints, action-surface contracts,
   recent judgments, and artifact refs. Do not convert provider prose or memory
   notes into progress.
6. Add repeatability checks for interruption-sensitive action skills based on
   observed failures, but keep those checks action-skill-local. Do not promote
   one domain activity into the general cycle architecture.
7. Use dashboard runtime events and review summaries to inspect each live probe
   turn while keeping those tools as observers, not control planes.
8. Feed live failures into actor evidence and reviewer queue.
9. Only then re-run broader multi-actor LLM gameplay as a product smoke, not as
   a substitute for per-action-skill proof.

This keeps the project focused on autonomy substrate and real action competence
before scaling back to broader actor behavior.

## 2026-06-03 Actor Turn Cheap-Model Live Run Update

Latest accepted smoke:

- report: `tmp/social-smoke-openai-nano-30cycle-actor-turn-v8.json`
- review: `tmp/social-smoke-openai-nano-30cycle-actor-turn-v8-review.md`
- actor workspace:
  `data/actors/social-runs/social-cycle-182fa49e-b18f-48f8-ad39-f4caf7d35043`
- provider/model: `openai-api` / `gpt-5.4-nano`
- runtime status: `passed`
- cycles: 30
- provider usage: 45 requests, 326,481 input tokens, 15,286 output tokens,
  341,767 total tokens
- projected quota day total after run: 3,452,160 / 9,000,000 tokens

What improved:

- `remember` no longer dominated the loop. v8 had 1 top-level `remember` action
  across 30 cycles.
- repeated `move_to` loops were reduced. v8 had no top-level `move_to` action.
- malformed generated-action authoring no longer stopped the run. Parser
  recovery now handles split authoring fields, metadata nested under
  `parameters`, schema echoes, sparse `input_schema`, and non-executable
  `record_candidate_only` authoring outputs.
- action-selection-only generated authoring produced candidate artifacts without
  bypassing trial lifecycle gates.
- the run produced verified physical progress: shared storage deposit,
  planks/sticks, log collection, crafting table crafting, and crafting table
  placement.

Behavior verdict:

- `PASSED_RUNTIME_BUT_BEHAVIOR_LOOP_WEAK`.
- The run is now diagnosable and no longer blocked by provider schema repair,
  but the behavior is still too narrow for the social-simulation target.

Observed weaknesses:

- `craftPlanksAndSticks` dominated: 14/30 turns.
- generated Mineflayer candidates were attempted twice and both failed trial
  verification. They stayed as candidate evidence, which is correct, but source
  quality remains weak.
- no visible actor, `say`, relationship, or guarded relationship evidence
  appeared. The only social signal was the shared-storage contribution.
- shelter attempts remained partial/failed.
- settlement state had crafting table and shared-storage progress, but no
  verified shelter and no strong social continuity beyond the initial request.

Implemented fixes that enabled v8:

- suppress `Remember` after repeated no-progress memory-only turns;
- suppress `Move To` after repeated movement without durable progress;
- avoid recommending target-required primitive cards with empty parameters;
- prefer `Mine Cobblestone` over raw `Mine Block` when available;
- keep blocker/inspection/openability focus open even when unrelated shared
  storage contribution already exists;
- hide or reject redundant `craftWoodenPickaxe` when a wooden pickaxe is
  already carried;
- restrict generated source to direct helper API shapes and reject unsupported
  `ctx.helpers`, `ctx.sharedStorage`, `ctx.bot`, and `ctx.mineflayer()` usage;
- normalize sparse generated `input_schema` from parameters;
- repair malformed Actor Turn provider outputs once before failing the run.

Next implementation targets:

1. Reduce repeated `craftPlanksAndSticks` by hiding or downgrading it when
   current inventory already has enough planks/sticks for the active episode and
   no explicit spare-material request exists.
2. Improve generated Mineflayer authoring examples and verifier guidance so a
   candidate uses actual supported helpers and produces passable evidence.
3. Add a real inspect/open-container Action Card or action skill instead of
   forcing low-cost models to invent chest UI probes.
4. Improve social-smoke setup so visible actor or chat pressure can be observed,
   not only represented as a world event.
5. Add acceptance accounting for top-action concentration and social-surface
   evidence so `runtime_status=passed` is not confused with product acceptance.

## 2026-06-03 Actor Turn Passive PlanBeads Pivot Update

Goal companion:

- `docs/blog-doc/Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md`

Current decision:

- Actor Turn remains the hot-path decision maker.
- PlanBeads remain useful only as passive actor-owned issue-like work state.
- Deliberation should propose PlanBead mutations only at meaningful branch
  points.
- PlanBeads must not become a semantic Minecraft planner, primitive selector,
  ActionIntent argument source, retry override, or success oracle.

Implemented in this checkpoint:

- Added a compact goal companion document and routed it through
  `Documentation-Map.md` and `Agent-Search-Index.md` with search token
  `PASSIVE_PLANBEADS_ACTOR_TURN_GOAL`.
- Reduced `craftPlanksAndSticks` repetition pressure by hiding/rejecting the
  broad planks/sticks action when current state already has enough basic
  planks/sticks for early progression, while keeping it available when sticks
  are still missing.
- Clarified `inspect_chest` as the existing bounded shared-chest container
  snapshot/openability check, so Actor Turn should use it instead of authoring
  generated Mineflayer probes for the same chest boundary.
- Rejected generated shared-chest and crafting-table reachability probes when
  visible Action Cards or current state already cover the same check.
- Corrected generated-source prompt examples away from unsupported
  `ctx.mineflayer.lookAtNearestBlock(...)` object-style usage and toward direct
  helper calls.

Explicitly not implemented:

- Automatic PlanBead blocker matching from failed runtime actions was not kept.
  It would push PlanBeads toward semantic reconciliation/planning authority.
  Blocker expansion should happen through branch-time Deliberation and guarded
  PlanBead operations, or through narrow evidence-backed lifecycle rules that do
  not interpret provider prose.

Verification:

- `cd probe && bun test ./test/actorTurnProviderInput.test.ts ./test/actorTurnResolver.test.ts ./test/planBeadLifecycle.test.ts`
  - passed: 52 tests.
- `cd probe && bun test ./test/actorTurnProviderInput.test.ts ./test/actorTurnResolver.test.ts ./test/directGeneratedActionSkillExecutor.test.ts ./test/socialCycleExecution.test.ts ./test/planBeadOperations.test.ts ./test/planBeadLifecycle.test.ts ./test/socialDeliberationProvider.test.ts`
  - passed: 102 tests.
- `cd probe && bun run typecheck`
  - passed.
- `git diff --check`
  - passed.
- `cd docs && npm run build`
  - passed.

Remaining:

- Re-run a low-cost 30-cycle Actor Turn smoke before claiming product progress.
- A 60-cycle run remains required before the overall goal can be considered
  complete.
