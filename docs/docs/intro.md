---
sidebar_position: 1
---

# Introduction: Dream of One

Welcome to the documentation for **Dream of One**, a next-generation multi-bot Minecraft social simulation probe built within the `minecraft-llm-agent-community` repository.

## Project Purpose

The primary goal of this project is to simulate an emergent **multi-NPC society** within Minecraft. Instead of building agents that blindly explore and hallucinate unstructured actions (like earlier Voyager-style approaches), this project focuses on:

1. **Pressure-Driven Behavior**: Agents act based on survival, material, and social pressures.
2. **Material Scarcity & Crafting**: True interaction requires sharing finite resources, crafting dependencies, and collaborative building.
3. **Social Obligations**: NPCs form relationships, respect boundaries, and share tasks.

We use Minecraft as a robust, deterministic physics engine to prove that Large Language Models can maintain long-running, stable multi-agent interactions when bounded by strict runtime constraints.

## System Architecture

The active runtime is designed as a **Zero-Based, Headless Mineflayer Probe**:

- **Headless Server**: The environment is hosted on a local Dockerized Vanilla server (`itzg/minecraft-server`). There is no need for manual client installations, Fabric, Forge, or graphical UI.
- **Bounded Tool Loop**: Agents do not write arbitrary JavaScript code. The LLM selects from a tightly controlled registry of static, pre-validated TypeScript skills (`observe`, `move`, `say`, `collect_logs`, etc.).
- **Pressure-Intent Lifecycle**: The LLM does not generate free-form goals. The runtime analyzes the environment and biological needs to assign "Pressures", which the LLM compiles into actionable "Intents".
- **Deterministic Evidence**: Instead of relying on human visual inspection, every run generates a structured JSON transcript (`data/evidence/*.json`) detailing observations, intent selections, and success verification.

## Implementation Details

The project utilizes a modern web and backend stack tailored for local AI execution:

- **Language:** TypeScript
- **Runtime:** Bun
- **Minecraft Client:** Mineflayer (handling bot physics, connection, and inventory state)
- **Infrastructure:** Docker Compose (for the local headless server and optional databases)
- **Configuration:** Strictly managed via `probe-config.yaml` to handle multi-bot spawning and world rules dynamically via RCON.

## Documentation Structure

This documentation site contains our core blueprints, architectural changes, and research reports:

- **Migration Guides**: Details on how we moved away from the old eval loop and manual clients to our current headless, deterministic probe.
- **Agent Search Index**: A routing document for key technical decisions.
- **Technical Reports**: Insights into specific failure modes, debugging (e.g., NPC teleportation fixes), and prompt engineering experiments.

*Note: All legacy documentation regarding Voyager, Python setups, and manual client configurations has been archived or removed from the active site to prevent confusion.*

---
![Dream of One Cover](img/cover-image.jpeg)
