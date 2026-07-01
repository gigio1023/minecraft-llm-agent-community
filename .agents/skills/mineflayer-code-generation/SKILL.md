---
name: mineflayer-code-generation
description: >
  Generate or review bounded Mineflayer TypeScript action skill candidates for
  this repo's Actor Turn `author_mineflayer_action` path. Use when writing
  generated source, helper allowlists, input schemas, verifiers, timeouts, or
  Mineflayer behavior notes for actor-owned action skills.
---

# Mineflayer Code Generation

This skill is for one runtime path only: Actor Turn
`author_mineflayer_action`.

The goal is not raw eval or a hidden planner. The goal is a small,
schema-bound, actor-owned behavior candidate that can be trialed through the
runtime, recorded as evidence, and later promoted only after lifecycle checks.

## Required Output Shape

The provider output must include:

- `proposed_action_skill_id`: stable lower-camel identifier for the candidate.
- `purpose`: one concrete Minecraft behavior this candidate owns.
- `input_schema`: JSON Schema object with `type: "object"`, `properties`,
  `required`, and `additionalProperties: false`.
- `parameters`: the exact current runtime inputs. Every key must be declared in
  `input_schema.properties`.
- `source_language`: exactly `typescript`.
- `source`: TypeScript source defining `export async function run(ctx, params)`.
- `helper_api_version`: exactly `mineflayer-action-skill-helper/v1`.
- `helper_allowlist`: only helpers the source actually calls.
- `timeout_ms`: bounded trial timeout.
- `verifier`: the evidence the runtime should check after trial. Prefer
  supported `verifier.kind` values: `helper_event_progress`,
  `helper_result_status`, `helper_event`, `inventory_delta`,
  `inventory_contains`, `inventory_count`, `world_scan`, `container_snapshot`,
  or `block_or_inventory_delta`.
- `known_failure_modes`: specific blocker strings the runtime can feed back on
  failure.
- `promotion_policy`: `promote_after_passed_trial`.

Do not put codegen metadata inside `parameters`.

## Source Contract

Generated source must:

- define `export async function run(ctx, params)`;
- read runtime inputs from `params`, not from prose;
- call only direct `ctx.*` helpers listed in `helper_allowlist`;
- `await` async helper work before relying on the result;
- return a small JSON-like result with status and useful evidence hints;
- stop naturally within `timeout_ms`.

Generated source must not use:

- `import`, `require`, `process`, `Bun`, `Deno`, filesystem, network, `eval`,
  `Function`, `child_process`, `fs`, `node:fs`, `net`, `http`, or `https`;
- `while (true)` or `for (;;)` loops;
- `ctx.bot`, `ctx.helpers`, `ctx.sharedStorage`, or `ctx.mineflayer().method`.

## Helper API

Allowed direct helpers:

- `ctx.position()`
- `ctx.inventoryItems()`
- `ctx.observe(options?)`
- `ctx.wait({ durationMs })`
- `ctx.collectLogs(targetCount?)`
- `ctx.mineBlock(blockName, targetCount?, searchDistance?)`
- `ctx.craftItem(itemName)`
- `ctx.craftWithTable(itemName)`
- `ctx.consumeItem(itemName)`
- `ctx.placeBlock(itemName, targetPosition)`
- `ctx.buildPattern(args)`
- `ctx.say(text)`
- `ctx.mineflayer(method, args)`

`ctx.mineflayer(method, args)` is a bounded bridge, not raw bot access.
Supported methods:

- `lookAt`
- `lookAtNearestBlock`
- `setControlState`
- `clearControlStates`
- `swingArm`
- `equipByName`
- `activateItem`
- `deactivateItem`
- `chat`

Prefer higher-level helpers when they express the behavior. Use
`ctx.mineflayer(...)` only for short interactions that existing helpers do not
cover.

## Mineflayer Notes

These notes are adapted from upstream `PrismarineJS/mineflayer` at commit
`03eba44f`. A local clone such as `~/git/mineflayer` can be used for inspection,
but the committed reference is the upstream repo and commit, not a device-local
path.

Keep this skill aligned with
`probe/src/runtime/goals/actorEpisode/mineflayerCodegenSkill.ts`,
`probe/src/runtime/goals/actorEpisode/validators.ts`, and
`probe/src/provider/socialActorTurnCodegenContract.ts` when helper names,
helper API version, verifier vocabulary, or generated-candidate fields change.

- Loaded-world visibility is bounded. `bot.findBlock` and `bot.findBlocks`
  search loaded blocks near the bot; a null result is not proof the block does
  not exist globally.
- Crafting should be sequential. Use `recipesFor(...)` conceptually, then
  await each craft step. In this runtime prefer `ctx.craftItem` for inventory
  2x2 recipes and `ctx.craftWithTable` for placed-table 3x3 recipes.
- A crafting table item is not a usable station until placed as a world block.
  Planks, sticks, and the crafting table item itself are inventory-grid
  recipes; wooden pickaxes and other table-sized recipes require a reachable
  placed crafting table.
- `bot.dig(block)` must be awaited. Mineflayer cannot dig a second block before
  the first dig finishes or is stopped; interruption can abort progress.
- Block placement is support-based. Mineflayer `placeBlock(referenceBlock,
  faceVector)` places at `referenceBlock.position.plus(faceVector)`. The target
  cell must be empty or replaceable, and the reference block must be a valid
  adjacent support.
- Opening a container is separate from proving inventory transfer. Prefer the
  existing chest/storage Action Cards when they are visible.
- Movement controls must be time-limited and followed by
  `clearControlStates` when using bounded `setControlState`.
- Equipping needs an inventory item. This runtime exposes `equipByName` instead
  of raw `bot.equip`.

## When To Author

Author a candidate only when visible Action Cards cannot express the needed
behavior.

Good authoring cases:

- a repeated physical blocker needs a reusable helper sequence;
- a short Mineflayer interaction is missing from Action Cards;
- current state has enough concrete parameters to trial behavior now;
- the behavior can produce helper events, inventory/block/container/chat
  evidence, or a clear blocker artifact.

Bad authoring cases:

- choosing codegen to avoid filling required parameters;
- probing chest openability when Inspect Chest is visible;
- probing crafting-table reachability when Craft With Table, Place Crafting
  Table, or Craft Crafting Table is visible;
- repeating observation when current state already explains the blocker;
- encoding a domain strategy such as "always rush tools" into a generic action
  skill.

## Output Checklist

Before returning `author_mineflayer_action`, check:

- `input_schema.required` includes every parameter key used by `source`.
- `input_schema.additionalProperties` is `false`.
- `parameters` validates against `input_schema`.
- `helper_allowlist` contains no unused or unsupported helper.
- source does not access blocked APIs or raw bot internals.
- verifier describes real runtime evidence, not provider narration. Use
  `helper_event_progress` for general helper-backed physical progress instead
  of inventing `runtime-evidence` or `unknown` verifier kinds.
- failure modes are concrete enough for a regeneration prompt.
