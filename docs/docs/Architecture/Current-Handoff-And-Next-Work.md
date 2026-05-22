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
- dashboard assets and Minecraft-style item icons.

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
- `craft_item` resolves real registry/recipe data and awaits `bot.craft(...)`;
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

Do not make this a broad NPC simulation runner. It should be a narrow live
contract runner.

Matrix command:

```bash
cd probe
bun run probe:skills -- --max-actions 8 --init-actor-workspace baseline
```

This command enumerates implemented seed action skills from the registry and
runs them one-by-one through the same live probe harness. It exists to make the
full action skill verification checklist reproducible after individual probes
are stable.

The matrix command runs a Docker preflight before actor workspace initialization
or Minecraft startup. If Docker/OrbStack is unavailable, it reports an
environment blocker instead of turning the first action skill into a misleading
runtime failure.

Remaining harness work:

- stream explicit probe events into the dashboard instead of relying only on
  artifact polling;
- run the new craft/storage/social probe matrix after Docker/OrbStack is
  available locally;
- add a small live matrix runner only after the single-skill command is stable.

Current postcondition rules:

- `collectLogs`, `craftPlanksAndSticks`, and `craftCraftingTable` require at
  least one passed runtime verifier in the transcript;
- `inspectSharedChest` requires an `inspect_chest` result with a real item
  snapshot;
- `depositSharedItems` requires `deposit_shared` with `movedCount > 0`;
- `handoffItemAtChest` requires a positive deposit and delivered chat;
- `approachAndRequestItem` requires arrival distance evidence and delivered
  chat;
- `announceResourceDiscovery` requires delivered chat;
- `waitForBusyCrafter` requires busy response, bounded wait, and delivered
  follow-up.

Checked-in protection:

- `probe/test/actionSkillProbeRunner.test.ts` rejects empty transcripts for
  every currently implemented action skill;
- the same test file includes a minimum accepted evidence payload for every
  implemented action skill through the runtime-owned
  `actionSkillPostconditionSpecs`, so adding a new implemented action skill
  without a postcondition rule becomes visible in tests.

Latest local limitation:

On 2026-05-22, the craft live probe was attempted with:

```bash
cd probe
bun run probe:skill -- --actor npc_b --skill craftPlanksAndSticks --max-actions 8 --init-actor-workspace baseline --no-dashboard
```

It failed before Minecraft startup because Docker/OrbStack was unavailable:

```text
dial unix /Users/naem1023/.orbstack/run/docker.sock: connect: no such file or directory
```

The matrix command now reports the same blocker as an environment error:

```bash
cd probe
bun run probe:skills -- --skills craftPlanksAndSticks --max-actions 8 --init-actor-workspace baseline
```

```text
matrix_preflight status=environment_blocked
matrix_summary passed=0 failed=0 error=1 total=0/1
```

Do not treat this as action skill failure evidence. Re-run the matrix once the
daemon is available.

### P0: Live `collect_logs` Validation

Initial live validation has landed through the per-action-skill harness.

Latest confirmed command:

```bash
cd probe
bun run probe:skill -- --actor npc_b --skill collectLogs --max-actions 20 --init-actor-workspace baseline --no-dashboard
```

Latest confirmed artifact:

```text
data/evidence/action_skill_probe_collectLogs-1779385755355.json
```

Confirmed evidence:

- final status: `success`;
- final reason: `collect_4_logs completed with runtime inventory evidence`;
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
  connections and treats an existing dashboard as reusable;
- dashboard startup remains best-effort and does not fail gameplay or action
  skill probes.

Remaining work:

- fixed ports only, with explicit reuse-or-fail behavior;
- clear stale process detection;
- dashboard event ingestion should tolerate missing or partial artifacts.

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

1. Run live `collectLogs` probe until it passes repeatably.
2. Feed failures into actor evidence and reviewer queue.
3. Improve dashboard event stream around that probe.
4. Add precondition setup for craft probes.
5. Add crafting-table primitive.
6. Add generic `mine_block`.
7. Only then re-run 3-NPC LLM gameplay.

This keeps the project focused on real action skill competence before scaling
back to broader NPC behavior.
