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

Per-action-skill probes add a second gate after transcript write:

- `craftPlanksAndSticks` and `craftCraftingTable` pass only when the runtime
  verifier reaches `passed`;
- a non-throwing `bot.craft(...)`, a `crafted` result, or a terminal memory note
  is not enough;
- probe fixtures may give the actor starting logs, planks, or sticks, but the
  final claim must still come from post-action inventory observation.
- matrix reports include a top-level verdict, so `environment_blocked` remains
  separate from runtime verifier failures and incomplete runs.
- matrix reports include `skillStatuses`, one row per selected action skill,
  for dashboard and reviewer consumption. Each row carries the exact
  `freshEvidenceCommand` for a one-skill live probe.
- matrix reports also include `evidenceGaps`, which repeats the required
  contract and postcondition evidence for every unproven action skill and the
  same fresh-evidence command.
- `--audit-existing-evidence` can re-score saved raw action skill probe
  transcripts without starting Docker. This is historical proof, not a
  substitute for a fresh live matrix after code changes.

### Shared Storage

Shared chest actions must close container windows after use and must not write
ledger evidence for zero-item transfers.

Required evidence:

- opened shared chest accessor;
- before/after chest snapshot;
- before/after inventory snapshot when available;
- positive moved count for deposit/withdraw ledger events.

Per-action-skill probes currently use a tiny RCON-placed chest fixture. The
probe passes only when the transcript shows actual chest inspection or positive
item movement. This keeps shared-storage action skills from passing on role
permission alone.

### Social Runtime Actions

Social action skills are still runtime action skills. They do not pass because
text was proposed by the provider.

Required evidence:

- `approachAndRequestItem`: measured arrival within interaction range and
  delivered chat;
- `announceResourceDiscovery`: delivered chat;
- `handoffItemAtChest`: positive shared-chest deposit and delivered handoff
  chat;
- `waitForBusyCrafter`: busy response, bounded wait, and delivered follow-up.

## Current Coverage

Implemented seed action skills are indexed in
`probe/src/gameplay/seedSkills/verificationContracts.ts`.

The contract test requires every implemented seed action skill to declare:

- owned runtime primitives;
- required evidence;
- checked-in tests that protect the behavior.

The live probe postcondition test also requires every implemented action skill
to fail on an empty transcript and to define a minimum accepted evidence
payload through `actionSkillPostconditionSpecs` in
`probe/src/runtime/actionSkillProbeRunner.ts`. This protects the gap where a
provider terminal note or no-op result could otherwise look like success, and
keeps the acceptance payloads beside the runtime postcondition rules instead of
burying them in tests.

Planned action skills may remain in the registry without verification contracts.
They must not become active until their primitive boundaries and evidence rules
exist.
