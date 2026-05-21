---
sidebar_position: 6
---

# Action Skill Verification

Search token: `ACTION_SKILL_VERIFICATION`.

Action skills are only trustworthy when each Mineflayer boundary has observable
post-action evidence. A runtime call is not evidence by itself.

## Reference Inputs

The current verification rules were checked against local reference clones:

- Mineflayer API docs for `bot.dig`, `bot.craft`, `bot.openChest`, and window
  transfer APIs.
- Mineflayer tutorial guidance that crafting must await `bot.craft(...)` before
  dependent work continues.
- Mineflayer examples for digging, inventory crafting, and chest deposit flows.
- Local Mineflayer-agent reference code that wraps `pathfinder.goto(...)` with
  timeout/stall protection and uses `GoalNear(...)` before `bot.dig(...)`.

## Primitive Boundaries

### Digging

`collect_logs` must treat block breaking as an atomic Mineflayer action. It can
search candidate blocks before digging and inspect evidence after digging, but
it must not stop and restart the same block break to check progress mid-dig.

Required evidence:

- selected candidate log block;
- pathfinder did not move farther from that block;
- `bot.dig(block, true)` resolved or failed;
- log inventory count increased after the dig or after moving toward a nearby
  dropped item.

Failure handling:

- if one candidate cannot be reached or dug, record that candidate attempt and
  try the next nearby low log;
- if the action is aborted, stop Mineflayer movement/dig state and propagate the
  abort instead of converting it into ordinary blocked progress;
- do not count block removal alone as success for the current seed action skill,
  because the goal is item acquisition.

### Movement

`move_to` must be bounded. `pathfinder.goto(...)` is preferred over manual
control nudges, but it must not be allowed to hang the actor turn.

Required evidence:

- before distance;
- after distance;
- distance delta;
- bounded timeout result, with `pathfinder.stop()` called when available.

### Crafting

`craft_item` must resolve a real Mineflayer recipe before calling craft.

Required evidence:

- item name resolves to a registry item id;
- `recipesFor(...)` returns an available recipe;
- `bot.craft(recipe, count, craftingTable)` is awaited;
- crafted item inventory count is reported when available.

Inventory-only crafting is intentionally separate from table-bound crafting.
Table-bound recipes need their own primitive that can find/place/use a crafting
table and verify that boundary.

### Shared Storage

Shared chest actions must close container windows after use and must not write
ledger evidence for zero-item transfers.

Required evidence:

- opened shared chest accessor;
- before/after chest snapshot;
- before/after inventory snapshot when available;
- positive moved count for deposit/withdraw ledger events.

## Current Coverage

Implemented seed action skills are indexed in
`probe/src/gameplay/seedSkills/verificationContracts.ts`.

The contract test requires every implemented seed action skill to declare:

- owned runtime primitives;
- required evidence;
- checked-in tests that protect the behavior.

Planned action skills may remain in the registry without verification contracts.
They must not become active until their primitive boundaries and evidence rules
exist.
