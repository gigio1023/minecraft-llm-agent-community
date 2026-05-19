---
slug: migration-journey
title: "The Migration Journey: From Voyager Eval to Bounded Tool Loops"
authors: [gigio1023]
tags: [migration, voyager, architecture, typescript]
---

In this post, we explain our recent transition from a legacy Voyager-style code-writing architecture to a zero-based, bounded tool-loop design.

Of course, having Yann LeCun's proposed "world model" would make this task much easier, but LLMs are not naturally good at understanding the physical world. We wanted to see how far we could push social simulation by overcoming this constraint.

<!--truncate-->

## The Failure of Open-Ended Eval Loops

The original Voyager architecture pioneered the concept of an agent writing its own JavaScript code to execute Mineflayer actions. While innovative, this approach introduced significant hurdles for long-running, multi-agent simulations:

1. **Syntax & API Errors**: LLMs frequently generate code with slight syntax errors, incorrect API calls, or unhandled exceptions that crash the client.
2. **Behavioral Drift**: Without strict boundaries, agents optimize for simple visible activities (e.g., digging grass, wandering, looking at players) rather than focusing on real survival progression.
3. **Execution Safety**: Running arbitrary generated JavaScript presents security risks and makes execution timeouts difficult to enforce cleanly.
4. **Coordination Failure**: When multiple bots run separate open-ended code writers, managing shared stashes and preventing race conditions becomes highly complex.

## The Bounded Tool-Loop Solution

To address these failures, we migrated to a zero-based, tool-bound architecture. 

In the new design:
- **No Raw Eval**: The LLM is prohibited from writing arbitrary JavaScript. Instead, it selects from a validated registry of built-in skills (e.g., `mineBlock`, `say`, `craftItem`).
- **Separation of Brain and Body**: The LLM acts as the decision-making Brain, while the local TypeScript runtime manages physical execution, collision checks, and timeouts.
- **State Feedback**: After each tool execution, the runtime returns a compact, updated observation of the world (inventory differences, nearby entities) as input for the next decision turn.
- **Deterministic Curriculum**: A rule-based curriculum selects concrete, machine-verifiable tasks (e.g., "Craft a wooden pickaxe") to prevent idle wandering.

This shift has dramatically improved bot stability, lowered token costs, and provided a cleaner foundation for simulating role-based NPC cooperation.

Read our [Minimal Probe Strategy](/docs/Architecture/Minimal-Probe) to see the details of our active multi-bot scenarios.
