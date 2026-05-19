# mc-multimodal-agent Persona, Society, And Gameplay Research

Date: 2026-05-19

## Scope

This report revisits local `mc-multimodal-agent` code for one specific question:
 what should be borrowed to make this repo's NPCs feel embodied, persistent, and
 competent inside Minecraft.

Local repo inspected: `mc-multimodal-agent`

## Files Inspected

- `src/agent/AgentLoop.ts`
- `src/agent/systemPrompt.ts`
- `src/agent/toolLoopDetection.ts`
- `src/tools/ToolRegistry.ts`
- `src/tools/MinecraftTools.ts`
- `src/memory/MemoryStore.ts`
- `src/memory/TranscriptStore.ts`
- `src/skills/SkillLibrary.ts`
- `src/goals/GoalStore.ts`
- `src/bot/MinecraftBot.ts`
- `src/bot/CraftPlanner.ts`
- `src/planning/MaterialPlanner.ts`
- `src/learning/ImitationObserver.ts`
- `test/tool-loop.test.ts`
- `test/minecraft-bot-stability.test.ts`
- `test/pathfinding-settings.test.ts`

## Main Takeaway

The most useful lesson here is not multimodality. It is the loop shape:

`compact observation -> one validated action -> structured result -> automatic post-action refresh -> memory/goal update -> repeat`

That loop is highly compatible with this repo's runtime-contract direction.

## Conceptual Lessons

### Persona should live on top of layered memory

`memory/MemoryStore.ts` separates memory into layers and kinds instead of using
 one undifferentiated transcript. That is directly useful for social NPCs.

For this repo, the useful split is:

- private episodic memory;
- private procedural memory;
- shared settlement memory;
- current working memory.

### Role identity needs persistent goals and blockers

`goals/GoalStore.ts` shows that believable identity comes from durable goals,
 blockers, and verification, not just style text. For this repo, roles like
 gatherer, crafter, scout, and guard should therefore have:

- recurring goals;
- current blockers;
- remembered obligations;
- visible contribution to shared progress.

### One hostile NPC should still use the same bounded runtime

`MinecraftTools.ts` includes bounded combat-oriented tools and retreat-style
 behavior. The portable idea is not broad combat autonomy; it is that a hostile
 actor should still be expressed as a narrow role inside the same tool loop.

## Skilled Gameplay Lessons

### Post-action refresh is one of the highest-value imports

`AgentLoop.ts` automatically enriches many tool results with fresh state. This is
 the best direct answer to repeated blind retries and stale-context planning.

For this repo, each important tool should attach compact post-state such as:

- inventory diff;
- position diff;
- nearby resource diff;
- target reached yes/no;
- danger change;
- current blocker.

### Craft planning should be runtime-owned

`bot/CraftPlanner.ts` and `planning/MaterialPlanner.ts` translate desired items
 into ordered prerequisite work. This is exactly the missing bridge between high
 level intent and player-like action.

### Loop detection is essential

`agent/toolLoopDetection.ts` provides a concrete model for blocking repeated
 action/result loops. This is directly aligned with this repo's documented need
 for anti-repeat policy.

## What To Port

### Highest priority

1. Consistent tool registry/result envelope patterns.
2. Automatic post-action refresh after important tools.
3. Tool loop detection and repeat blocking.
4. Craft/material planning helpers.
5. Goal tree with blockers and verification.
6. Layered memory model.

### Strong secondary imports

- skill representation as ordered steps with preconditions and success criteria;
- compact transcript plus checkpoint compaction;
- lightweight imitation/event capture later, after the basics work.

## What Not To Port

- image-heavy control or raster-first interaction as the main architecture;
- its giant mixed tool surface as-is;
- benchmark-specific or vision-budget-specific design choices.

## Repo-Specific Recommendation

Borrow `mc-multimodal-agent` for runtime discipline, not for visual control.
 The most valuable imports are:

- tool result consistency;
- post-action refresh;
- goal/blocker tracking;
- craft planning;
- loop detection.

These should become the control skeleton underneath future social simulation.
