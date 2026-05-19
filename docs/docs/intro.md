---
sidebar_position: 1
---

# Welcome to minecraft-llm-agent-community

**minecraft-llm-agent-community** is an experimental project focused on creating **Social NPCs** in Minecraft using Large Language Models (LLMs). We build a stable, multi-agent society where NPCs cooperate, manage resources, and follow social rules within a deterministic game environment.

## Why Minecraft?

Minecraft provides a robust physics and state engine, making it an ideal "sandbox" for AI research. Placing agents in a world with material scarcity and survival needs allows us to observe emergent behaviors that go beyond simple chat interactions.

## Key Concepts

Our agents are **Embodied Agents** driven by:

- **Survival & Scarcity**: NPCs must gather resources (food, wood, iron) to survive. Scarcity naturally encourages cooperation or competition.
- **Roles & Responsibilities**: Each NPC has a clear purpose (e.g., Gatherer, Crafter, Scout).
- **Social Obligations**: Cooperation is built on promises and shared storage rather than just persona text.

## Technical Foundation

To ensure stability and safety, we use a **Headless Runtime** architecture:

- **Headless Environment**: The simulation runs on a local Minecraft server via Docker. No manual GUI client or Fabric/Forge mod setup is required.
- **Mineflayer-Based Bots**: We use [Mineflayer](https://github.com/PrismarineJS/mineflayer) to create lightweight, programmable bots that interact with the world via TypeScript.
- **Bounded Tool Loop**: Instead of letting the AI write raw, risky JavaScript `eval` code, the LLM selects from a strictly validated set of tools (e.g., `mineBlock`, `say`, `craftItem`).
- **Deterministic Evaluation**: Every session is recorded as a structured JSON transcript, allowing us to analyze agent decisions and social interactions.

## Re-designed Structure & Navigation

Our documentation has been reorganized to support researchers and developers:

- 📄 **[Search Index](Agent-Search-Index.md)**: Find specific search tokens and review the recommended reading order.
- 📐 **[Architecture Specification](Architecture/SPEC.md)**: A deep dive into core subsystems, bounded runtime, and memory compaction.
- ⚙️ **[Getting Started Setup](Setup/Headless-Server.md)**: Steps to spin up the local Docker server and connect Mineflayer bots.
- 🎯 **[Simulation Plans](Plans/2026-05-19-mutual-npc-interaction-probe.md)**: Explore the active multi-agent interaction and dialogue probe plans.
- 🔬 **[Research & Audits](Research/2026-05-19-local-minecraft-agent-repo-analysis.md)**: Review comparative audits of 20+ prominent repositories in the Minecraft AI domain.
