# Current Architecture And Implementation Audit

Status: active audit snapshot
Date: 2026-05-24
Search token: `CURRENT_ARCHITECTURE_IMPLEMENTATION_AUDIT`

This document explains the current runtime architecture, compares it against the
implemented TypeScript paths, and records the next decisions for settlement-cycle
work. It is an audit of the active rebuild path, not a replacement for `SPEC.md`.

## Scope

This audit focuses on the current headless Minecraft runtime loop:

- one bounded Mineflayer actor;
- actor-owned action skills;
- runtime-owned execution and verification;
- transcript, provider snapshots, action evidence, cycle goals, and judgments;
- the Soul / LifeGoal / social-cycle vertical slice;
- the new `placeCraftingTable` and `buildBasicShelter` surface.

It intentionally does not treat persona richness, a large multi-actor village, or a
Voyager-style eval loop as current delivery targets.

## Evidence Read For This Audit

Architecture docs read:

- `SPEC.md`
- `docs/blog-doc/Agent-Search-Index.md`
- `docs/blog-doc/Architecture/Runtime-Loop-And-Verification.md`
- `docs/blog-doc/Architecture/Transcript-And-Runtime-Artifacts.md`
- `docs/blog-doc/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
- `docs/blog-doc/Architecture/Action-Skill-Verification.md`
- `docs/blog-doc/Architecture/Soul-Life-Goal-Runtime-Architecture.md`
- `docs/blog-doc/Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`
- `docs/blog-doc/Architecture/Current-Handoff-And-Next-Work.md`

Implementation paths inspected:

- `probe/src/gameplay/seedSkills/registry.ts`
- `probe/src/runtime/agentLoop.ts`
- `probe/src/runtime/actionSkillProbeRunner.ts`
- `probe/src/runtime/socialCycleRunner.ts`
- `probe/src/runtime/socialCycleExecution.ts`
- `probe/src/runtime/goals/cycleContextAssembler.ts`
- `probe/src/provider/socialGoalMindProvider.ts`
- `probe/src/provider/socialActionPlannerProvider.ts`
- `probe/src/provider/socialCycleJudgmentProvider.ts`
- `probe/src/tools/placeBlock.ts`
- `probe/src/tools/buildPattern.ts`

Verification commands used for this snapshot:

```bash
cd probe
bun run probe:skills -- --dry-run --report ../tmp/action-skill-dry-run-architecture-audit.json
bun run probe:skills -- \
  --actor npc_b \
  --max-actions 8 \
  --init-actor-workspace baseline \
  --continue-on-failure \
  --report ../tmp/action-skill-live-matrix-docker-engine-before-commit.json
```

Result:

- dry-run matrix found 14 implemented action skills;
- the first live run found a real setup-path bug in `buildBasicShelter`: the
  shelter anchor was derived from configured spawn Y rather than the live actor
  foot position, which placed the shell one block above support and made every
  `place_block` report "no adjacent support";
- after fixing that anchor, the fresh live matrix passed 14/14 with
  `current_run=14`, `failed=0`, `error=0`, and `environment_blocked=0`.
- after replacing the Podman compatibility path with official Docker Engine on
  Ubuntu 24.04 arm64, the same 14/14 matrix passed again through the managed
  Minecraft server path.

The previously remembered 12/12 live matrix is now stale because the implemented
surface has grown to 14 action skills. The current baseline is the fresh 14/14
live matrix above.

## Architecture In One Sentence

The current system is an evidence-first Minecraft runtime where an actor may
choose goals through a provider, but only runtime-owned primitives and
actor-owned action skills can touch the world, and every meaningful claim must
be grounded in current-run evidence artifacts.

## Runtime Authority Model

The core authority split is:

| Layer | Owns | Must not own |
|-------|------|--------------|
| Provider | goal proposals, action-legacy-planner-action proposals, judgment wording | physical success, tool expansion, unverified world claims |
| Runtime loop | primitive dispatch, active action skill gate, timeout/cancel behavior, transcript events | high-level narrative success |
| Mineflayer tools | direct world interaction and inventory/container/block evidence | social meaning or long-horizon goal authority |
| Verifiers | pass/fail/progress interpretation from tool evidence | optimistic completion without evidence |
| Actor workspace | durable actor-owned skill records, memory, goals, relationships, artifacts | global implicit truth outside artifacts |

This is the right authority model for the repo's active direction. It is closer
to robotics affordance grounding than to unconstrained code-generation autonomy:
the model can suggest, but the runtime says what happened.

## Runtime Loop Contract

The canonical runtime-loop contract is:

1. Observe actor and world state.
2. Assemble provider context from actor workspace, memory, active action skills,
   recent evidence, and goal context.
3. Ask the provider for a bounded proposal.
4. Validate the proposal against runtime-owned action skill and primitive gates.
5. Execute one bounded primitive or an action skill execution unit.
6. Verify from current-run tool evidence.
7. Persist transcript, evidence, provider input/output snapshots, memory, and
   judgments.

The general action loop implements this shape in `probe/src/runtime/agentLoop.ts`.
It supports `place_block` and `build_pattern` as optional installed tool
handlers, and it can continue past `deposit_shared_materials` when a caller needs
handoff evidence after storage completion.

The social-cycle runner implements the same authority split with a different
goal stack: ActorSoul -> ActorLifeGoal -> StrategicGoal -> CycleGoal ->
ActionIntent -> runtime execution -> CycleJudgment.

## Actor Workspace

The actor workspace is the source of truth for actor-owned state:

- active action skill records;
- candidate and retired action skill memory;
- actor memory records;
- relationship edges;
- goals and judgments;
- provider snapshots;
- tool evidence;
- run reports.

The important design property is locality. A provider does not receive an
unbounded transcript dump as truth. It receives a compressed packet derived from
workspace artifacts, current observation, and limited retrieval.

This is correct for long-running agents. Raw transcript context grows in the
wrong direction: it is large, stale, and hard to evaluate. The workspace can keep
durable, typed, reviewable facts.

## Action Skill Ownership

An action skill is a Minecraft/Mineflayer behavior owned by an actor and backed
by declared primitives and success evidence. In the current implementation, seed
action skills live in `probe/src/gameplay/seedSkills/registry.ts`, and actor
ownership is assigned into the workspace at initialization.

The current implemented action skills are:

| Action skill | Role emphasis | Primitive boundary | Evidence shape |
|--------------|---------------|--------------------|----------------|
| `runtimeObserveAndRemember` | baseline control | `observe`, `wait`, `remember` | observation, bounded wait, memory write |
| `collectLogs` | gatherer, settler | `observe`, `collect_logs`, `wait` | dug log attempts and log inventory delta |
| `craftPlanksAndSticks` | crafter, settler | `observe`, `craft_item`, `wait` | planks/sticks inventory output |
| `craftCraftingTable` | crafter, settler | `observe`, `craft_item`, `wait` | crafting table inventory output |
| `craftWoodenPickaxe` | crafter, settler | `observe`, `craft_with_table`, `wait` | nearby table and pickaxe inventory delta |
| `mineCobblestone` | gatherer, settler | `observe`, `mine_block`, `wait` | stone dig and cobblestone inventory delta |
| `inspectSharedChest` | all settlement roles | `observe`, `inspect_chest`, `wait` | ledger-backed chest snapshot |
| `depositSharedItems` | gatherer, quartermaster, settler | `observe`, `inspect_chest`, `deposit_shared`, `wait` | ledger-backed positive deposit |
| `placeCraftingTable` | crafter, quartermaster, settler | `observe`, `place_block`, `wait` | target block reread as `crafting_table` |
| `buildBasicShelter` | settler | `observe`, `build_pattern`, `remember` | shell ledger plus shelter world scan |
| `approachAndRequestItem` | crafter | `observe`, `move_to`, `say`, `wait` | measured movement and targeted request text |
| `announceResourceDiscovery` | gatherer | `observe`, `say`, `remember` | targeted resource announcement and memory |
| `handoffItemAtChest` | gatherer | `observe`, `inspect_chest`, `deposit_shared`, `say`, `wait` | ledger deposit plus handoff text |
| `waitForBusyCrafter` | gatherer | `observe`, `wait`, `say` | busy/defer text plus bounded wait |

Planned action skills remain visible in the registry, but they explicitly name
their missing primitive boundary. That matters. It keeps prompt text from
pretending that unsupported behavior is available.

Important planned gaps for settlement work:

- `exploreForMaterials`: needs `explore_until` and `world_diff`;
- `collectDroppedItems`: needs dropped-item targeting and pickup verification;
- `equipBestTool`: needs held-item observation and equip verification;
- `placeTorchLightArea`: needs light-level and torch placement evidence;
- `craftFurnace` / `smeltRawIron`: need furnace interaction verification;
- `setupSharedStash`: needs chest placement, container open, and shared chest
  registration.

## Primitive Surface

The primitive surface is deliberately small. The settlement-relevant primitives
are:

- observation: `observe`;
- movement and positioning: `move_to`;
- resource gathering: `collect_logs`, `mine_block`;
- crafting: `craft_item`, `craft_with_table`;
- world placement: `place_block`, `build_pattern`;
- storage: `inspect_chest`, `deposit_shared`, `withdraw_shared`;
- social/control: `say`, `wait`, `remember`.

The strongest new primitive is `build_pattern`: it expands a bounded starter
shelter blueprint into place-block operations, then re-reads the world for wall,
roof, floor support, clear interior, and new shell evidence. That is the right
level of abstraction for the current repo. It gives the model a meaningful action
without giving it arbitrary block-programming authority.

`place_block` is also correctly evidence-oriented: it verifies inventory, equips
the item, chooses adjacent support, attempts placement, and re-reads the target
block. Its current limitation is that it is a placement primitive, not a site
selector.

## Probe Matrix Implementation

The action skill probe matrix now has 14 deterministic driver branches. The two
new branches are meaningful:

- `placeCraftingTable` calls `place_block` with `itemName: crafting_table`, then
  remembers only after the result reports placed evidence.
- `buildBasicShelter` calls `build_pattern` with `starter_shelter_2x2_v1`,
  dirt-first materials, and a bounded placement count, then remembers only after
  built evidence.

The matrix has postcondition specs for both:

- `placeCraftingTable`: selected `crafting_table`, target coordinates, verified
  target block, and inventory delta;
- `buildBasicShelter`: built status, passed shelter verification, wall/roof
  coverage, clear interior, and new shell blocks.

The dry-run proves those contracts are declared. The fresh live matrix after this
audit proves they can now execute in the managed live world: 14/14 action skills
passed with current-run evidence.

## Social Cycle Runtime

The social cycle path is the active one-actor social simulation seed.

High-level flow in `probe/src/runtime/socialCycleRunner.ts`:

1. Load probe config and choose workspace root.
2. Initialize actor workspace and seed action skill ownership.
3. Ensure ActorSoul and active LifeGoal.
4. Persist WorldEvent context, if provided.
5. Optionally connect to a live or fresh Minecraft server.
6. Optionally prepare spawn access with a flat area, chest, and crafting table.
7. For each cycle:
   - observe the world;
   - assemble context;
   - run cycle goal provider;
   - run up to `maxActionsPerCycle` ActionPlanner / executor / Judgment turns;
   - persist memory writes from judgments;
   - write report after each cycle.
8. Finalize runtime status from provider failure, fixture dependency, cycle
   completion, and meaningful progress evidence.

The most important property: the social label does not force chat. The actor has
ActorSoul, actor profile, and relationship context, but ordinary Minecraft work
remains valid.

## Goal Stack

The current goal stack is:

- ActorSoul: stable actor identity and tendencies;
- ActorLifeGoal: durable top-level context that is not completed by one user
  prompt;
- StrategicGoal: rolling direction;
- CycleGoal: current bounded cycle target;
- ActionIntent: one provider-proposed action;
- CycleJudgment: evidence-based interpretation of what happened.

This hierarchy is aligned with the current direction. It prevents user prompts
from becoming the actor's top-level goal, while still allowing scenario/world
events to apply context.

## Context Packet

`assembleSocialCycleContext()` builds `social-cycle-context/v1` with:

- ActorSoul;
- ActorLifeGoal;
- strategic goals;
- WorldEvents;
- previous cycle judgments;
- current observation;
- owned action skills with primitive requirements and preconditions;
- allowed primitive IDs;
- relationship context;
- retrieved memory packet;
- runtime-owned settlement state and checklist progress;
- recent blocker histogram;
- max-action and cycle-index limits;
- hard rules: world events are context, no user prompt, runtime verifies
  success.

This is a solid context core. It is already better than raw transcript stuffing.
The first settlement-specific progress vector is now implemented as
`settlement-state/v1`; it summarizes:

- table placed and coordinates verified;
- chest known and contribution ledger sequence;
- shelter shell verified;
- current inventory counts;
- known base/spawn/table/chest positions;
- recent blocker histogram;
- missing primitive blockers;
- current settlement objective checklist.

This packet is intentionally runtime-owned. The provider can use it to choose
CycleGoals and ActionIntents, but it cannot mark checklist success without
matching evidence and postcondition results.

## Providers

The social runtime has three provider stages:

| Stage | File | Responsibility |
|-------|------|----------------|
| CycleGoal provider | `probe/src/provider/socialGoalMindProvider.ts` | choose strategic updates and a CycleGoal |
| ActionPlanner | `probe/src/provider/socialActionPlannerProvider.ts` | choose one bounded ActionIntent |
| CycleJudgment | `probe/src/provider/socialCycleJudgmentProvider.ts` | judge evidence and propose memory/relationship updates |

The provider prompts have the right posture:

- do not make every action social;
- use live observation, nearby resources, memory, previous judgments, and recent
  attempts;
- avoid repeating blocked table crafts;
- for shelter goals, use `build_pattern` when solid materials are already
  available;
- do not claim success through text.

Two implementation details matter:

1. `socialGoalMindProvider` currently normalizes allowed action skills and
   primitives from runtime context rather than trusting the LLM's own narrowed
   list. This is conservative for capability safety, but it also means the
   cycle goal provider is not the real authority for narrowing the action
   surface.
2. `deterministic-social` is a wiring baseline, not an autonomy baseline. It
   defaults to observe/wait/remember behavior and should not be used to estimate
   settlement competence.

## Social Executor

`executeSocialActionIntent()` resolves either:

- one `use_primitive` intent; or
- every primitive in an owned `use_action_skill` bundle.

It checks:

- primitive is social-executable;
- primitive is allowed by CycleGoal;
- primitive is allowed by active action skill gate;
- live bot exists;
- each tool result status.

It writes per-tool evidence and derives progress verifier status from tool
statuses. It now also records action-skill postcondition results for owned
action-skill bundles. The social-cycle bridge is intentionally smaller than the
full matrix runner, but it covers the settlement-critical contracts:
crafting-table placement, starter shelter verification, storage contribution,
crafting, gathering, mining, runtime observe/remember, and social handoff
evidence.

`move_to` remains available for bounded social-cycle movement, but it is no
longer an implicit exception. It uses a named movement policy with a 12-block
cap and measured before/after movement evidence; non-movement primitives still
go through the active action skill gate.

## Judgment And Memory

CycleJudgment is correctly evidence-facing:

- no `verified_progress` unless meaningful gameplay primitive evidence exists;
- observe-only cycles are `no_progress`;
- verifier status comes from runtime, not from LLM optimism;
- memory writes are persisted as actor memory records with evidence refs.

The social-cycle path persists judgment memory writes and routes
`relationship_event_proposals` through a guarded applier wrapper. Applications
are report-visible as applied, already applied, or rejected. Rejection is the
expected outcome when the target actor workspace or evidence refs are missing;
provider text still never mutates relationship edges directly.

## Architecture Vs Implementation

| Contract | Implementation status | Audit view |
|----------|-----------------------|------------|
| Runtime owns world truth | Strong | Tool outputs and verifier status drive judgments. |
| Actor workspace owns actor state | Strong | Social cycle initializes and writes workspace artifacts. |
| Provider context is compressed and artifact-backed | Good | Context packet now includes settlement state/checklist, blocker histogram, and runtime retry constraints. |
| Active action skill gate constrains execution | Mostly good | Social executor has a named bounded `move_to` movement policy exception. |
| Implemented action skills have verification contracts | Good in live matrix | 14 contracts declared and 14/14 passed with current-run evidence after the shelter-anchor fix. |
| Settlement action surface includes placement/building | Newly good | `place_block` and `build_pattern` are the right abstractions. |
| Action skill execution unit semantics | Improving | Social executor now records settlement-facing postcondition results for owned bundles. |
| Repeated blocked action avoidance | Baseline implemented | ActionPlanner sees `runtime_retry_constraints`, and the executor blocks exact repeated target/args before Mineflayer execution. |
| Social relationship mutation | Guarded path | CycleJudgment proposals route through an applier and may be rejected with reason. |
| Long-horizon settlement evaluation | Not ready as open-ended target | Needs checklist evaluator and compressed settlement state first. |

## External Research Read Through This Repo

Primary references:

- [Voyager](https://arxiv.org/abs/2305.16291)
- [MineDojo](https://arxiv.org/abs/2206.08853)
- [ReAct](https://arxiv.org/abs/2210.03629)
- [Reflexion](https://arxiv.org/abs/2303.11366)
- [Generative Agents](https://arxiv.org/abs/2304.03442)
- [SWE-agent](https://arxiv.org/abs/2405.15793)
- [SayCan](https://arxiv.org/abs/2204.01691)
- [Inner Monologue](https://arxiv.org/abs/2207.05608)

The useful lessons are specific:

- Voyager supports automatic curriculum, executable skill libraries, and
  environment feedback. The lesson for this repo is not to revive raw eval or
  unbounded generated code as the default loop. The lesson is to promote only
  evidence-backed action skills.
- MineDojo supports the need for task diversity, external knowledge, and scalable
  agent architecture. For this repo, that points to a local Minecraft knowledge
  layer and explicit task/checklist evaluators, not broader prompt text.
- ReAct and Inner Monologue support interleaving reasoning, action, and
  environment feedback. The current CycleGoal -> ActionIntent -> evidence ->
  Judgment loop is a good fit, but only if recent failures are compacted into
  actionable context.
- Reflexion and Generative Agents support memory/reflection, but this repo should
  keep memory evidence-derived. Reflection should improve the next action; it
  must not count as world progress.
- SayCan supports the current affordance-gated approach: language chooses among
  feasible skills, and runtime affordances ground what can actually be done.
- SWE-agent is directly relevant even outside software engineering: agent
  performance depends heavily on the action interface. Improving primitives,
  postconditions, and context packets is likely higher leverage than only
  changing models.

## Opinion On The Other Estimate

The other estimate is directionally right with one important correction:

- the current matrix is 14 implemented action skills, not 12;
- the 12/12 live proof is stale;
- this audit refreshed the live proof and now has 14/14 current-run action skill
  evidence after fixing the `buildBasicShelter` anchor bug.

Cycle estimates:

- Deterministic happy path for a narrow starter-settlement proof could be 7-9
  cycles if each cycle selects the correct progression action and if fixtures or
  nearby terrain cooperate.
- LLM social-cycle path at `maxActionsPerCycle=3` is more realistically 18-35
  cycles because observe, failed attempts, movement, blocked table/crafting
  retries, and judgment context consume turns.
- A vague "build a settlement" open-world prompt can easily go 40-60+ cycles
  without converging, because the current context lacks a typed settlement
  checklist and the action surface still lacks exploration/site-selection
  primitives.

The correct next experiment is not a vague settlement run. It is:

```text
verified starter shelter
+ placed crafting table
+ shared storage contribution
+ persisted memory/judgment explaining what is complete and what is blocked
```

## Priority Findings

### P0 resolved: Fresh 14/14 live matrix passed

Do not evaluate settlement competence from the old 12/12 run. The implemented
surface now includes `placeCraftingTable` and `buildBasicShelter`.

This audit ran the fresh matrix and fixed the only failure:

- failure: `buildBasicShelter` exhausted the action budget because all
  placements lacked adjacent support;
- cause: the live probe anchored the shelter from configured spawn Y instead of
  the actor's actual Mineflayer position;
- fix: anchor shelter probes from the live actor position;
- proof: single `buildBasicShelter` live probe passed, then full matrix passed
  14/14.

Current proof command:

```bash
cd probe
bun run probe:skills -- \
  --actor npc_b \
  --max-actions 8 \
  --init-actor-workspace baseline \
  --continue-on-failure \
  --report ../tmp/action-skill-live-matrix-docker-engine-before-commit.json
```

### P0 landed: Settlement target is an evidence checklist

The next settlement run should not use a large natural-language objective as the
only success definition. The runtime now carries an explicit
`settlement-checklist/v1` with:

- table placed or existing table position known;
- shelter verifier passed;
- shared chest contribution ledger exists;
- memory/judgment persisted;
- blocked reasons summarized.

### P1 landed: First-class settlement state is in provider context

The context packet now includes a deterministic settlement state summary:

- inventory counts;
- shared chest snapshot;
- known base/spawn/table/chest positions;
- known shelter anchor and status;
- recent five to ten action judgments;
- blocked reason histogram;
- available action skills and missing primitive blockers;
- checklist progress.

This is generated by runtime code, not by asking the LLM to infer it from raw
artifacts.

### P1 landed: Social action skill execution is postcondition-aware

The social executor no longer treats an action skill as only a primitive list
when a settlement-facing postcondition bridge exists. It records
`action-skill-postcondition/v1` results for implemented action skills.

Current minimal bridge:

- after `place_block` for `placeCraftingTable`, require verified target block;
- after `build_pattern` for `buildBasicShelter`, require shelter verifier pass;
- after shared-storage bundles, require positive deposit or inspection evidence;
- physical checklist success requires evidence refs in the audit.

### P1 landed: `move_to` gate exception is constrained

`move_to` is intentionally available for bounded scouting and settlement
positioning. It is now represented as policy:

- max distance: 12 blocks;
- valid targets;
- blocked/stuck evidence;
- no bypass for non-movement primitives;
- how repeated movement failures become blocker context.

### P2: Add the next missing primitives before broad settlement prompts

The highest leverage next primitives are:

- `explore_until` / `world_diff` for stone, coal, flat build site, water/lava
  avoidance, and chest/table relocation;
- `collect_dropped_item` for real item recovery;
- `equip_item` plus held-item observation;
- `place_torch` or `light_area`;
- `use_furnace`;
- a settlement checklist evaluator.

### P2: Treat relationship changes as proposals until applied

For the current one-actor settlement slice, relationship proposal-only behavior
is fine. Before evaluating multi-actor social claims, wire a guarded relationship
proposal applier into the social-cycle path or explicitly route it through the
reviewer/applier path.

## Recommended Next Sequence

1. Keep the fresh 14/14 live action skill matrix as the baseline gate.
2. Add deterministic settlement checklist context and report fields.
3. Run a 30-cycle social settlement test on a fresh or prepared world.
4. Audit report JSON, provider input snapshots, evidence refs, and judgments.
5. Only increase to 60 cycles after identifying whether the failures are action
   surface, context, planner, terrain, or verifier problems.

Suggested 30-cycle shape:

```bash
cd probe
OPENAI_MODEL=gpt-5.4-mini bun run probe:social-cycle -- \
  --actor npc_b \
  --provider openai-api \
  --cycles 30 \
  --max-actions-per-cycle 3 \
  --fresh-world \
  --prepare-spawn-access \
  --isolate-workspace \
  --world-event "Build a verified starter shelter, place or use a crafting table, contribute useful items to shared storage, and remember what settlement state is complete." \
  --report ../tmp/social-cycle-settlement-30.json \
  --no-dashboard
```

This should be considered an experiment, not a release gate, until the checklist
evaluator is in place. The 14/14 live action skill matrix is now in place.

## Bottom Line

The architecture is on the right path. The current repo has the core pieces that
modern embodied-agent work keeps converging on: bounded action interfaces,
environment feedback, skill ownership, memory, and evidence-first verification.

The main weakness is not model capability. The main weakness is that settlement
state is still too implicit, and social-cycle action skill execution is not yet
as verifier-aware as the action skill probe matrix. Fixing those two issues is
more important than expanding the provider's raw authority.
