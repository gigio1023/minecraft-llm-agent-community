---
sidebar_position: 1
---

# Introduction: Dream of One

**Dream of One** is a multi-bot Minecraft social simulation probe. We use Minecraft as a deterministic physics engine to prove that LLMs can sustain stable, long-running societies when constrained by strict rules.

## Core Philosophy

We abandon open-ended, hallucination-prone prompts in favor of:

1. **Pressure-Driven Behavior**: Actions stem from biological needs (hunger) and material scarcity.
2. **Material Scarcity**: True society requires shared resources, dependencies, and collaboration.
3. **Social Obligations**: NPCs form roles, respect boundaries, and share tasks.

## Architecture: The Headless Probe

- **Zero-Based & Headless**: Runs on a local Dockerized Vanilla server (`itzg/minecraft-server`). No UI, no manual client setup.
- **Bounded Tool Loop**: Agents do not write arbitrary code. They select from a strictly validated registry of static TypeScript skills.
- **Pressure-Intent Lifecycle**: The runtime analyzes the world to generate "Pressures". The LLM processes these into actionable "Intents".
- **Deterministic Evidence**: Relies on structured JSON transcripts for evaluation, not human visual inspection.

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Bun
- **Minecraft Interface:** Mineflayer
- **Infrastructure:** Docker Compose (headless server, DBs)
- **Configuration:** `probe-config.yaml` with RCON dynamic control.

## Documentation Scope

This documentation focuses on active specs, architectural decisions, and research reports. All legacy Voyager-era setups have been archived.
