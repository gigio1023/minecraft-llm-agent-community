# Skill Village Failure Report

Date: 2026-05-19

## Verdict

The current skill-village probe is a functional integration test, not a valid
Minecraft agent simulation. It connects LLMs to Mineflayer and records traces,
but the behavior is not meaningfully grounded in Minecraft gameplay.

## What Failed

- The agents repeatedly scanned, looked at nearby players, walked slightly, dug
  grass/dirt, and reacted to dropped items.
- This was not survival progression, exploration, crafting, collecting,
  trading, farming, building, or social simulation.
- The "social" behavior was mostly monologue shaped by persona text. It did not
  emerge from meaningful Minecraft constraints, roles, scarce resources, or
  complementary tasks.
- Digging dirt/grass had no game purpose. It was not tied to a goal like
  acquiring materials, crafting tools, building shelter, farming, or mining
  toward ores.
- Keeping an inactive NPC in the world biased active NPCs toward meaningless
  alignment behavior.
- Longer runs caused prompt growth without strategic improvement.

## Root Cause

The runtime gave the model low-level affordances without a Minecraft gameplay
model. Without seed skills and concrete progression goals, the LLM used the only
obvious primitives available: scan, face, move, dig, and collect drops.

Voyager's design makes this failure predictable. Voyager does not ask an LLM to
invent Minecraft from scratch. It provides reusable control primitives,
game-specific skills, a curriculum that proposes concrete tasks, and iterative
feedback from execution errors and environment state.

## Required Correction

- Treat Minecraft as a game with progression systems: resource collection,
  crafting, tools, food, shelter/base, mining, exploration, farming, trading,
  equipment, and dimensions.
- Add a compact Minecraft gameplay guide to the system prompt.
- Add a seed skill library equivalent to Voyager's early-game primitives before
  expecting social behavior.
- Replace vague "survive and observe" goals with concrete Minecraft tasks, such
  as "obtain logs", "craft crafting table", "craft wooden pickaxe", "mine
  cobblestone", "craft furnace", "cook food", "inspect village chest", or
  "trade with villager".
- Make social dynamics emerge from task allocation and resource contention, not
  from personality text alone.
