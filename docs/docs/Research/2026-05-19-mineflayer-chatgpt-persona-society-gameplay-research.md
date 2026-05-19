# mineflayer-chatgpt Persona, Society, And Gameplay Research

Date: 2026-05-19

## Scope

This report re-reads local `mineflayer-chatgpt` code for the problem most
 relevant to this repo's next stage: how to get multiple bots to feel like a
 small society while still acting like competent Minecraft players.

Local repo inspected: [`mineflayer-chatgpt`](https://github.com/KNiemitz/mineflayer-chatgpt)

## Files Inspected

- `src/bot/brain.ts`
- `src/bot/role.ts`
- `src/bot/bulletin.ts`
- `src/bot/perception.ts`
- `src/bot/actions.ts`
- `src/bot/memory.ts`
- `src/llm/prompts.ts`
- `src/skills/types.ts`
- `src/skills/registry.ts`
- `src/skills/executor.ts`
- `src/skills/materials.ts`
- `src/skills/stash.ts`
- `src/skills/setup-stash.ts`
- `src/skills/craft-gear.ts`
- `src/skills/strip-mine.ts`
- `src/skills/smelt-ores.ts`
- `src/neural/combat.ts`
- `docs/plans/2026-02-25-multi-bot-team-design.md`

## Main Takeaway

This repo is the strongest source for small-society structure. The most reusable
 idea is:

`persona = voice + role restrictions + shared bulletin + shared storage + failure memory + event-driven runtime`

That is much closer to the target state of this repo than any prompt-only social
 design.

## Conceptual Lessons

### Role restrictions matter more than character prose

`bot/role.ts` gives each bot explicit:

- allowed actions;
- allowed skills;
- keep-items policy;
- leash radius;
- priority rules.

That is the right way to make NPCs feel distinct without relying on lore-heavy
 prompts.

### Shared bulletin is the cleanest minimal society primitive

`bot/bulletin.ts` lets bots see live teammate status and adapt locally. This is a
 better first social primitive for this repo than a heavy central planner.

### Shared storage creates real cooperation

`skills/stash.ts` and `skills/setup-stash.ts` show that bots cooperate most
 naturally when resources are routed through shared storage. That gives dialogue
 and coordination real stakes.

### One hostile NPC should be a special role, not a universal capability

The repo's role system plus combat specialization suggests the right adaptation:

- civilians do not get broad combat authority;
- exactly one guard/raider/hunter role gets bounded combat tools;
- aggression should still obey leash, timeout, and retreat rules.

## Skilled Gameplay Lessons

### Event-driven brains are better than constant polling

`bot/brain.ts` reacts to danger, hunger, damage, chat, idle timeout, and action
 completion. This is important because competent Minecraft behavior often starts
 with reacting to local events at the right time, not re-running a big planner on
 every tick.

### Failure blocking is essential

`bot/memory.ts` and `bot/brain.ts` keep recently failed actions/skills from being
 retried blindly. This is directly portable into this repo's runtime loop.

### Material planning and seed skills make bots look capable

`skills/materials.ts`, `skills/craft-gear.ts`, `skills/smelt-ores.ts`, and
 `skills/strip-mine.ts` encode real gameplay progression. They are a strong
 reference for how to make bots act like players with goals rather than walkers
 with dialogue.

## What To Port

### Highest priority

1. Event-driven brain architecture.
2. Role contract model.
3. Shared team bulletin.
4. Per-bot failure memory.
5. Typed skill interface and executor.
6. Shared stash/storage logic.

### Strong secondary imports

- compact perception builder;
- specialized reactive combat for one hostile role;
- gather-before-skill material planning.

## What Not To Port

- raw generated JS skill execution via dynamic loader paths;
- teleport-heavy recovery as normal gameplay;
- random exploration as the default exploration model;
- giant mixed-responsibility files as-is.

## Repo-Specific Recommendation

If the goal is a believable small Minecraft society, this repo is the best local
 source for:

- role-based differentiation;
- shared public state;
- event-driven coordination;
- bounded combat specialization.

Use it as the social architecture reference after the gameplay substrate exists.
