---
sidebar_position: 1
---

# Welcome to minecraft-llm-agent-community

**minecraft-llm-agent-community** is an experimental project focused on creating **Social NPCs** in Minecraft using Large Language Models (LLMs). We aim to build a stable, multi-agent society where NPCs cooperate, manage resources, and follow social rules within a deterministic game environment.

## Why Minecraft?

Minecraft provides a robust physics and state engine, making it an ideal "sandbox" for AI research. By placing agents in a world with material scarcity and survival needs, we can observe emergent behaviors that go beyond simple chat interactions.

## Key Concepts

Our agents aren't just chatbots; they are **Embodied Agents** driven by:

- **Survival & Scarcity**: NPCs must gather resources (food, wood, iron) to survive. Cooperation emerges naturally when resources are shared or limited.
- **Roles & Responsibilities**: Each NPC has a clear purpose—whether they are a gatherer, a crafter, or a guard.
- **Social Obligations**: Cooperation is built on promises and shared storage, not just persona text.

## Technical Foundation

To ensure stability and safety, we use a **Headless Runtime** architecture:

- **Headless Environment**: The simulation runs on a local Minecraft server via Docker. No manual setup or graphical client is required.
- **Mineflayer-Based Bots**: We use [Mineflayer](https://github.com/PrismarineJS/mineflayer) to create lightweight, programmable bots that interact with the world via TypeScript.
- **Bounded Tool Loop**: Instead of letting AI write risky code, we provide a strictly validated set of tools (e.g., `mineBlock`, `say`, `craftItem`).
- **Deterministic Evaluation**: Every session is recorded as a structured JSON transcript, allowing us to analyze agent decisions and social interactions with high precision.

## Getting Started

Check out our [Architecture Specification](/docs/Architecture/SPEC) for a deep dive into how our agents think, or head over to the [Setup Guide](/docs/Setup/Headless-Server) to run your first multi-bot simulation.
