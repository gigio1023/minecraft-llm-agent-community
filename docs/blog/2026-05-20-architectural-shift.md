---
slug: architectural-shift-headless-probe
title: "The Great Migration: Moving to a Headless Probe Architecture"
authors: [gigio1023]
tags: [architecture, headless, typescript, mineflayer, update]
---

We're excited to announce a major shift in the architecture of the Dream of One project! We have officially deprecated and removed the legacy `bridge-server` in favor of a new, highly focused `probe` architecture.

<!--truncate-->

## Why We Moved Away from the Bridge Server

In the past, our project relied on a complex setup involving a `bridge-server` that communicated with clients. This approach, similar to early iterations of projects like Voyager, often involved raw `eval` loops and manual setup of Minecraft instances (like Fabric).

As our goals shifted towards simulating an emergent, **multi-NPC society**, we realized this legacy architecture was holding us back. It lacked the strict runtime validation and deterministic environment needed to enforce social pressures and material scarcity reliably over long periods.

## Enter the Headless Probe

The new architecture, housed in the `probe` directory, is designed to be **Zero-Based**, **Headless**, and **Deterministic**.

Here is what makes it different:

### 1. Headless Environment via Docker
We now run entirely on a local Vanilla Minecraft server via Docker (`itzg/minecraft-server:java21`). This means no manual Minecraft client or mod setup is required. The environment is consistent and easy to spin up for anyone.

### 2. Mineflayer-Based TypeScript Runtime
Multiple NPC bots (e.g., `npc1`, `npc2`, `npc3`) connect directly to the local server simultaneously using Mineflayer. The entire runtime is written in robust TypeScript and executed via Bun for maximum performance.

### 3. The Pressure-Intent Lifecycle
Instead of giving agents open-ended prompts and hoping they do something useful, they now operate under simulated "Pressures" (needs like hunger, shelter, or social obligations). The runtime compiles these pressures into structured "Intents," which map to specific, executable tasks. This is crucial for creating realistic, survival-driven behaviors.

### 4. Bounded Tool Loop
Agents no longer generate raw, unsafe JavaScript. They are restricted to a highly controlled, runtime-validated registry of "seed skills" (e.g., `observe`, `move`, `say`, `wait`, `collect_logs`). This ensures safety and determinism.

### 5. Deterministic Evaluation
Every run now outputs a comprehensive **Transcript JSON**. This transcript acts as a deterministic ledger of every intent, task success/failure, observation, and conversation state. This allows for robust CI/CD evaluation of our agent models without requiring visual inspection.

## Looking Forward

The removal of the `bridge-server` marks the completion of our transition to this new, more rigorous foundation. We are now fully focused on expanding the `probe` to support complex social behaviors, shared storage, and long-term memory compaction, as outlined in our [Specification](https://github.com/naem1023/minecraft-llm-agent-community/blob/main/SPEC.md).

Stay tuned for more updates as we continue to build out the Dream of One society!
