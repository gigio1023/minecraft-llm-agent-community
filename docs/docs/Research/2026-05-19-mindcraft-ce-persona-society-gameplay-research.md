# mindcraft-ce Persona, Society, And Gameplay Research

Date: 2026-05-19

## Scope

This report re-reads local `mindcraft-ce` code for patterns that make Minecraft
 agents feel embodied, interruptible, and practically competent, especially in
 the areas of action management, conversation timing, and inventory-aware play.

Local repo inspected:

- `../mindcraft-ce`

## Files Inspected

- `src/agent/action_manager.js`
- `src/agent/commands/actions.js`
- `src/agent/commands/queries.js`
- `src/agent/history.js`
- `src/agent/memory_bank.js`
- `src/agent/library/world.js`
- `src/agent/library/skills.js`
- `src/agent/modes.js`
- `src/agent/conversation.js`
- `src/agent/npc/item_goal.js`
- `src/utils/mcdata.js`
- `profiles/defaults/survival.json`

## Main Takeaway

`mindcraft-ce` is the best local source for action discipline and survival helper
 behavior. The most portable idea is:

`single active action + interruption policy + compact world helpers + inventory-aware craft/smelt logic + small reactive survival automations`

## Conceptual Lessons

### Conversation should respect activity state

`agent/conversation.js` does not treat chat as instant and free. Reply timing
 changes based on whether this bot or the other bot is busy. That is highly
 relevant to believable social NPC behavior.

### Social behavior needs private, public, and summarized memory

`history.js` and `memory_bank.js` are limited, but they still reinforce the right
 pattern: keep recent detail close, summarize older context, and preserve a
 smaller durable memory instead of dumping full transcript back into the prompt.

### One hostile NPC should be mode-bounded

The repo has broad combat/self-defense support, but the safest reusable lesson is
 that aggression should be expressed as a runtime mode with clear activation and
 exit conditions, not as ambient behavior for all agents.

## Skilled Gameplay Lessons

### Action gating is one of the strongest portable patterns

`agent/action_manager.js` enforces:

- one active action;
- interruption;
- timeout;
- resumable action hooks;
- repeated-loop detection;
- compact action summaries.

This is directly useful for this repo because incompetent behavior often comes
 from overlapping loops and unbounded retries.

### World helpers make planning less blind

`library/world.js` and `commands/queries.js` expose compact helpers for:

- nearby blocks and entities;
- inventory counts;
- craftability;
- path clarity;
- biome/time context.

This is exactly the sort of structured state this repo should send into its tool
 loop instead of vague freeform observation.

### Inventory-aware craft/smelt logic is a major competence signal

`library/skills.js` and `utils/mcdata.js` contain practical checks for:

- crafting table requirement;
- furnace requirement;
- fuel availability;
- fuel count;
- recipe dependency;
- ingredient deficiency.

That is high-value because it makes the agent reason about prerequisites like a
 real player.

### Small reactive survival automations improve embodiment

`modes.js` includes examples like:

- unstuck;
- self-preservation;
- item pickup;
- underwater response.

The portable lesson is not to build a giant automation layer, but to let the
 runtime own a few safety-critical reflexes.

## What To Port

### Highest priority

1. Single-action gate and interruption policy.
2. Compact world helper/query layer.
3. Inventory-aware crafting and smelting helpers.
4. Chunked memory/history summarization.
5. Busy-aware conversation scheduling.
6. Small runtime-owned safety automations.

## What Not To Port

- raw code generation as default behavior;
- giant command surfaces too early;
- monolithic agent objects that own too many responsibilities;
- benchmark-specific task machinery;
- restart-to-refresh patterns as normal runtime behavior.

## Repo-Specific Recommendation

Use `mindcraft-ce` as the source for runtime action discipline and survival
 helper design. It should influence:

- action manager boundaries;
- observation helper modules;
- craft/smelt planners;
- small safety reflexes;
- socially aware conversation timing.
