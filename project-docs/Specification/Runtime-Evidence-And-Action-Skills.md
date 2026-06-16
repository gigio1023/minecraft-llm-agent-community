---
sidebar_position: 2
---

# Runtime Evidence And Action Skills

This is the execution-truth spec.

The runtime owns Minecraft reality. Providers and reviewers can propose,
interpret, and diagnose, but success belongs to verifier-backed runtime
evidence.

## Runtime Authority

The hot path is:

```text
observe -> choose -> gate -> execute -> verify -> record
```

Required properties:

- every physical action starts from observed state;
- every provider proposal is validated before execution;
- execution is bounded by timeout and cancellation;
- each meaningful primitive emits evidence;
- verifier status comes from world, inventory, position, block, container, chat,
  transcript, or structured tool result evidence;
- optimistic provider text cannot mark success.

## World-State Diagnostics

The runtime should preserve enough surrounding world evidence for a later review
to answer basic questions without rerunning the same seed.

Absence claims must be scoped. A report that says no matching target was
observed should also say what query ran, what "nearby" meant, and what
Mineflayer could actually inspect. New provider-facing summaries should avoid
domain-specific absence labels; use raw observed Minecraft names, query refs,
and scan limits instead.

World-state diagnostic artifacts should include:

- scan id, actor id, cycle id, and evidence refs;
- scan center, radius, vertical range, dimension, and timestamp;
- Mineflayer visibility limits, including whether unloaded chunks were omitted;
- raw observed Minecraft block, item, and entity names with counts or samples;
- nearest examples for each relevant group, with position and distance;
- entity and item-drop summaries when relevant to the action surface;
- truncation policy, raw-scan artifact ref, and summary version.

The scanner is an observability substrate, not a domain strategy. It may expose
raw Minecraft names, positions, distances, dropped items, or hazards when
present, but it must not turn resource gathering, house building, mining, or any
other activity into an always-on cycle phase. Do not publish fixed material,
station, construction-readiness, or survival-priority fields to the provider.
Specific action skills may query specific block/item families inside their own
bounded contract, but that local query must not become the general planning
context.

## Runtime Action Contract

An active Actor Turn tool selection is the provider's structured proposal for
one bounded actor turn. Physical runtime action parameters are a contract.
Archived `ActionIntent` artifacts are review-only historical evidence and must
not shape new runtime contracts.

Runtime rules:

- Required args must be present before executing physical primitives or action
  skills. Examples include target coordinates for `move_to`, block or material
  selectors for `mine_block`, item/count for `craft_item`, container/item/count
  for `deposit_shared`, and anchor/pattern args for any building primitive.
- Natural-language fields such as rationale, `why_this_action`, Action Card
  descriptions, Minecraft Basic Guide text, memory, or PlanBeads can explain
  context but cannot supply missing executable args.
- Hidden physical defaults are not valid success paths. A fallback such as
  "move east 8 blocks" may be useful only when it is an explicit action in the
  structured args or a documented repair path that records the repair.
- Direct `use_primitive` actions must not carry `action_skill_id` or
  `args.actionSkillId`. Actor-owned action skill fallback authority exists only
  after the runtime resolves a `use_action_skill` action or an Action Card
  mapped to an action skill into its primitive bundle.
- Shared-storage transfer primitives require an explicit `count` or
  `targetCount` for direct provider selections.
- Control/memory actions such as `wait` and `remember` are still runtime
  primitives. They must pass CycleGoal and active action-skill gates instead of
  bypassing authority because they look safe.
- If prose and structured parameters disagree, the runtime should reject or
  repair the selection through a typed path and record the mismatch.
- Rejected runtime action contracts are useful evidence. They should be visible
  in the transcript, provider snapshot, actor workspace evidence, and review
  summaries.

Mineflayer-backed contracts should be shaped by Mineflayer behavior: loaded
chunk visibility, target lookup, pathfinder semantics, movement tolerances,
dig/place interruption behavior, timeout behavior, and the verifier evidence
needed to prove success or truthful failure.

World-state scan evidence is explicit schema evidence. Reviews and audits should
count `world-state-summary/v1` or `world-state-scan/v1` artifacts, not loose
keys such as archived `nearbyBlocks`. Sampled loaded-coverage metadata is
non-exhaustive unless a future scanner can prove otherwise.

## Actor Workspace

Actor workspace is the source of truth for actor-owned runtime state:

- ActorSoul and goal artifacts;
- active/candidate/retired/rejected action skills;
- memory records;
- evidence files;
- provider input/output snapshots;
- review jobs and outputs;
- relationship edges;
- direct-trial artifacts.

An actor's state must not be inferred from a global transcript tail when a typed
workspace artifact exists.

## Action Skills

An action skill is a Minecraft/Mineflayer behavior the runtime can validate,
execute, verify, and record.

Action skills are not Codex/Claude agent skills. Conversation-like behavior is
an action skill when it goes through the Minecraft runtime and leaves runtime
evidence.

Action skills are available behaviors, not strategic goals. A shelter-building
action skill, chest action skill, mining action skill, or conversation action
skill should be selected because current observation, memory, relationship
context, CycleGoal, and runtime evidence make it relevant, not because the core
runtime always routes cycles through that activity.

Action skill requirements:

- actor owner;
- role compatibility;
- primitive boundary;
- preconditions;
- success verifier;
- evidence refs;
- lifecycle status;
- promotion/retirement/supersession rules.

Generated or candidate action skills may exist, but they must not bypass
runtime gates. `build/generated-skills` remains archived exploratory output, not
actor-owned action skill memory.

## Verification

A verifier should reject fake progress:

- movement without measured position change;
- crafting without inventory delta;
- mining without item pickup or block/item evidence;
- container interaction without named item movement or snapshot evidence;
- chat without target/text evidence when the action skill requires social
  communication;
- memory-only completion for physical actions.

The verifier should also preserve partial/progressing evidence when useful. A
truthful blocker is better than a false pass.

The social runtime may use `partial_verified_progress` when a current run
produces real world, inventory, movement, container, or block mutation but the
final verifier or action-skill postcondition does not pass. This status must
not be used to claim completion.

## Action Surface

The provider-visible action surface is the actor's current body. It should show:

- direct primitives and action skills that are executable now;
- deferred primitives or action skills that explain missing affordances;
- relevant preconditions and verifier expectations;
- recent blockers and missing primitive blockers;
- rules that remind the provider that runtime verification decides success.

The action surface is substrate. It is not a domain strategy. For example,
`build_pattern` may appear as a direct primitive for a settler, but that does
not mean every CycleGoal should consider building. It only means building is
available if the model chooses it from current context.

## Minecraft Basic Guide

The provider may also receive `minecraft_basic_guide`, a compact mechanics guide
for stable Minecraft facts such as prerequisite item flows, station
requirements, item-vs-world-block distinctions, useful tool requirements,
blocker recovery, and repeated-observe limits.

The guide is not runtime truth. It does not prove inventory, world blocks,
container state, reachability, or success. It helps the provider avoid basic
mechanics mistakes such as trying a table-sized recipe before a reachable placed
crafting table exists or repeatedly observing for an inventory item that must be
crafted from known prerequisites.

Runtime evidence and action-surface gates remain authoritative:

- current state comes from observation and runtime artifacts;
- executable choices come from `runtime_affordances`, direct action skills, and
  runtime gates;
- physical success comes from verifier-backed evidence;
- `minecraft_basic_guide` supplies background mechanics only.

## Transcript And Artifacts

Every meaningful run should leave artifacts that explain:

- what the provider saw;
- what it proposed;
- what the runtime allowed or blocked;
- what tool ran;
- what changed in the world or inventory;
- what verifier decided;
- what memory or judgment was written;
- what should be tried next.

The artifact trail should be enough to audit failure without immediately
reproducing the world.

## Settlement State

For Soul-grounded social simulation, settlement state is not background flavor.
It is model-visible context.

The runtime should move toward a compressed settlement state packet containing:

- current inventory counts;
- shared chest snapshot;
- known positions that may be relevant to the model, such as actor, table,
  chest, shelter, or other work sites;
- verifier status for relevant domain-specific action skills;
- pending obligations and handoffs;
- recent blockers;
- recent CycleJudgments;
- available action skills and missing primitive blockers.

This packet should be computed from runtime artifacts, not hallucinated by the
provider. It is an observation/evidence/context packet, not a universal domain
checklist.

## Context Compaction

Long social-cycle runs should compact context before feeding it back to the
provider. Raw transcript growth is not a memory system.

Compaction should preserve:

- ActorSoul and LifeGoal continuity;
- current CycleGoal and recent CycleJudgments;
- current inventory and relevant container snapshots;
- known positions and recent movement blockers;
- latest world-state diagnostics and their evidence refs;
- action-surface contracts, unavailable actions, and repeated blocker counts;
- artifact refs for provider input/output, action evidence, verifier output, and
  review notes.

Compaction should drop or summarize:

- repeated observe/wait records that add no new evidence;
- provider explanations that were not backed by runtime evidence;
- old raw transcript lines once their facts are represented in typed state;
- stale proposed plans that never became validated runtime actions.

Compaction must not launder weak evidence into progress. Memory notes,
provider prose, and `wait` records remain context unless verifier-backed world,
inventory, position, block, container, chat, or transcript evidence proves a
real change.

## Current Evidence Belongs In Handoff Docs

Current matrix results and command outputs are implementation state. They should
be documented in current handoff or audit docs, not treated as immutable spec.

Current-state docs:

- `../Architecture/Current-Handoff-And-Next-Work.md`
- `../Architecture/Current-Architecture-And-Implementation-Audit.md`

## References

- [ReAct](https://arxiv.org/abs/2210.03629) supports interleaving reasoning,
  acting, and environment feedback.
- [Inner Monologue](https://arxiv.org/abs/2207.05608) supports planning with
  language feedback from embodied environments.
- [SayCan](https://arxiv.org/abs/2204.01691) supports grounding language choices
  in feasible skills/affordances.
- [Embodied Agent Interface](https://huggingface.co/papers/2410.07166) supports
  evaluating hallucination, affordance, and planning errors separately rather
  than only final success.
- [SWE-agent](https://arxiv.org/abs/2405.15793) is relevant because agent
  performance depends heavily on the action interface.
