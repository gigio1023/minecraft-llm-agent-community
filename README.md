# ⛏️ Dream of One: Minecraft LLM Agent Social Simulation

![Cover Image](assets/cover-image.jpeg)

**Dream of One** is a next-generation multi-bot Minecraft social simulation probe. It completely abandons legacy architectures (like Voyager's open-ended raw `eval` loops or manual client/Fabric setups) in favor of a strictly bounded, headless agent runtime powered by TypeScript and Mineflayer.

- [📚 Documentation Blog](https://naem1023.github.io/minecraft-llm-agent-community/)

## 🎯 Purpose and Vision

The primary goal of this project is to simulate an emergent **multi-NPC society** within Minecraft. Instead of building agents that just wander and hallucinate actions, this repository focuses on **pressure-driven behavior**, **material scarcity**, and **social obligations**.

We use Minecraft as a robust, deterministic physics and state engine to prove that language models can maintain long-running, multi-agent interactions when bounded by strict runtime validation, biological pressures (like gathering wood or food), and memory compaction.

## 🏗️ Architecture & Design

Our architecture is designed to be **Zero-Based**, **Headless**, and **Deterministic**:

1. **Headless Environment**: Runs entirely on a local Vanilla Minecraft server via Docker (`itzg/minecraft-server:java21`). No manual Minecraft client is required.
2. **Mineflayer-Based Runtime**: Multiple NPC bots (e.g., `npc1`, `npc2`, `npc3`) connect to the local server simultaneously.
3. **Pressure-Intent Lifecycle**: Instead of free-form prompting, agents operate under "Pressures" (needs). The runtime compiles these pressures into structured "Intents", which map to specific executable "Tasks".
4. **Bounded Tool Loop**: Agents do not generate raw, unsafe JavaScript. They are restricted to a highly controlled, runtime-validated seed skill registry (e.g., `observe`, `move`, `say`, `wait`, `collect_logs`).
5. **RCON & Config Management**: The environment, spawn locations, and server rules are enforced externally via Docker RCON and strict YAML configuration (`probe-config.yaml`), abstracting away in-game bot permissions.

## ⚙️ Implementation & Usage

The project is built with **TypeScript**, executed via **Bun**, and uses **Docker Compose** for the server environment. 

### Prerequisites
- [Bun](https://bun.sh/)
- [Docker](https://www.docker.com/)

### Quick Start (Multi-Bot Probe)

The active execution path is the headless multi-bot probe, which spawns the NPCs and runs their pressure-driven observation and interaction loops.

```bash
# 1. Start the headless Minecraft server via Docker Compose
docker compose up -d

# 2. Install dependencies
cd probe
bun install

# 3. Run the Agent Loop Probe
PROBE_BOTS="npc1,npc2,npc3" bun run src/cli.ts
```

*Note: The script automatically handles RCON setup, world spawn enforcement, and NPC teleportation based on `probe-config.yaml`.*

### Evidence & Artifacts

Rather than requiring a human to visually inspect the bots, every run outputs a comprehensive **Transcript JSON** in `data/evidence/`. This transcript acts as a deterministic ledger of every intent, task success/failure, observation, and conversation state, allowing for robust CI/CD evaluation of the agent models.

## 📂 Repository Structure

- `probe/src/runtime/`: The core bounded agent loop, pressure/intent logic, and compaction checkpoints.
- `probe/src/gameplay/`: Seed skills (e.g., `collect_logs`), tool registry, and Minecraft success verifiers.
- `probe/src/npc/`: Social obligation routers and persona management.
- `probe/src/transcript/`: Event memory, evidence generation, and local JSON stores.
- `docs/reports/`: Detailed technical reports, failure analyses, and design blueprints.
