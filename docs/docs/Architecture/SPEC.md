---
sidebar_position: 1
---

# Architecture Specification

**minecraft-llm-agent-community** is designed to simulate an emergent NPC society. This document outlines the technical pillars required to move beyond simple chatbots and create agents with real **Gameplay Competence** and **Social Pressure**.

## 1. Design Philosophy

A believable society cannot be built with "Persona Prompts" alone. It requires:
- **Expert Play**: Agents must handle Minecraft's mechanics like skilled players.
- **Material Scarcity**: Cooperation and conflict should emerge from the need for finite resources (wood, coal, iron).
- **Social Framework**: Roles, shared storage, and social obligations provide the "glue" for long-term interactions.

## 2. Core Subsystems

### A. The Bounded Runtime
To ensure stability, the runtime (built on **Mineflayer**) owns the "Reality" of the world. It validates every action, handles timeouts, and records every state change.
- **Single Active Action**: Only one physical action (like mining or moving) can be active at a time per agent to prevent race conditions.
- **Post-Action Refresh**: After every action, the runtime provides a fresh observation of the agent's inventory and surroundings.

### B. Pressure & Intent Loop
Instead of open-ended planning, our agents operate on a **Pressure-Intent** model:
1. **Pressures**: The environment generates internal "pressures" (e.g., *Hunger*, *Shared Stash Shortage*, *Hostile Nearby*).
2. **Intents**: The LLM compiles these pressures into a high-level **Intent** (e.g., "Collect wood for the shared chest").
3. **Execution**: The intent is carried out using a strictly validated registry of **Tools** (e.g., `collectLogs`, `craftItem`).

### C. Social Simulation
- **Role Contracts**: NPCs have specific roles (Gatherer, Crafter, Scout, Guard) with corresponding permissions and priorities.
- **Shared Storage**: The settlement uses shared chests, creating a mutual dependency between NPCs.
- **Hostile Entities**: A single, bounded hostile NPC act as a source of "dramatic pressure," forcing the cooperative NPCs to react to danger.

## 3. Memory & Transcripts

Long-running simulations require a sophisticated memory architecture:
- **Part-Based Transcripts**: Every turn is recorded as a structured record (Observation + Intent + Tool Call + Result).
- **Compaction**: As the session grows, the runtime "compacts" old history into a summary while keeping a "raw tail" of recent events to stay within the LLM's context window.
- **Memory Layers**:
    - **Episodic**: Recent experiences and successes/failures.
    - **Procedural**: Knowledge of how to perform specific workflows (e.g., smelting iron).
    - **Semantic**: Shared knowledge (e.g., "Where is the main storage?").

## 4. Key References

Our design draws lessons from several pioneering Minecraft AI projects:
- **Voyager**: Adopted structured curriculum and primitive validation.
- **mc-multimodal-agent**: Adopted post-action refreshes and layered memory.
- **mineflayer-chatgpt**: Adopted event-driven multi-bot brains and role restrictions.
- **mindcraft-ce**: Adopted single-action gating and busy-aware conversation.
- **Opencode/Codex**: Adopted advanced transcript compaction and replay architectures.
