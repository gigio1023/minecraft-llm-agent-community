---
slug: design-philosophy-and-references
title: "The Design Philosophy Behind Dream of One"
authors: [gigio1023]
tags: [architecture, design, references, voyager, social-simulation]
---

Building a multi-agent society in Minecraft isn't just about writing a better prompt. As we set out to build the **Dream of One** headless probe, we realized that giving an LLM a persona and dropping it into a world usually results in bots that aimlessly wander, hallucinate actions, and fail to survive.

To create a minimally viable "living, breathing society," we had to rethink the foundational architecture. Here is a deep dive into our design intent and the open-source projects that heavily influenced our new direction.

<!--truncate-->

## The Core Intent: Pressure-Driven Society

Our primary goal with this iteration is to move beyond open-ended exploration and create an environment where **cooperation and hostility emerge organically from material pressure**. 

We realized past attempts failed not because the models were weak, but because the runtime didn't treat Minecraft like a real game. There was no concrete curriculum, no reliable gameplay primitives, and most importantly, no *scarcity*. 

Our new headless architecture relies on three pillars:
1. **Gameplay Competence**: The agent must be able to act like a skilled player.
2. **Social Pressure**: The agent's actions must be driven by roles, shared storage, danger, and obligations.
3. **Resilient Architecture**: The system must survive long simulations via strict transcript management, memory compaction, and bounded execution.

## Standing on the Shoulders of Giants

We didn't invent all of this from scratch. We analyzed several prominent Minecraft LLM agent repositories and cherry-picked the best architectural patterns while aggressively discarding the parts that led to instability.

Here is what we learned and adapted:

### 1. Voyager: Structured Curriculum and Primitives
*Voyager* showed the world that LLMs could play Minecraft. However, its reliance on generating and executing raw JavaScript via `eval` loops is too fragile and unsafe for a long-running, multi-bot server.
**What we kept:** The concept of a "one-task-at-a-time" curriculum, trusted gameplay primitives (like `mineBlock`), early-game progression seed skills, and strict task verification. 
**What we discarded:** The open-ended code generation loop. Our agents select from a pre-validated registry of TypeScript tools.

### 2. mc-multimodal-agent: Memory and Planning
**What we kept:** Layered memory structures, tracking blockers and goals, craft/material planning, and crucial **loop detection**. We also adopted the "post-action refresh" concept, ensuring the bot's state is strictly synced after every tool execution.

### 3. mineflayer-chatgpt: The Event-Driven Brain
**What we kept:** Instead of constant polling, our agents now use an **event-driven multi-bot brain**. We adopted their approach to role restrictions, team bulletins, and shared stash cooperation. Importantly, we learned from them to heavily bound combat—in our society, only exactly *one* NPC has a bounded hostile role to act as a source of pressure, rather than turning the world into a chaotic deathmatch.

### 4. mindcraft-ce: Action Gating and Conversation
**What we kept:** The **single active action gate**. Only one world action can execute at a time per bot, with strict interruption, timeout, and resume policies. We also took inspiration from their busy-aware conversation scheduling—bots won't interrupt a complex crafting task for idle chatter unless it's urgent.

### 5. opencode & codex: Transcript and Compaction
For long-term survival, a flat text transcript quickly overwhelms the context window.
**What we kept:** A part-based transcript model (separating observations, tool calls, and results) and explicit tool lifecycle records. From *codex*, we adopted the thread-store abstraction and **replacement-history compaction checkpoints**, allowing the simulation to run indefinitely by summarizing the past while keeping the recent "raw tail" of actions.

## Conclusion

By combining the structured primitives of Voyager, the event-driven roles of mineflayer-chatgpt, and rigorous memory compaction strategies, **Dream of One** is designed to be a stable, deterministic testbed. We aren't just simulating chat; we're simulating survival.
