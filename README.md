# ⛏️ Dream of One: Minecraft LLM Agent Social Simulation

![Cover Image](assets/cover-image.jpeg)

**Dream of One** is a next-generation multi-bot Minecraft social simulation probe. We use a strictly bounded, headless agent runtime powered by TypeScript and Mineflayer to simulate an emergent **multi-NPC society**.

- [📚 Documentation Blog](https://gigio1023.github.io/minecraft-llm-agent-community/)

## 🎯 Vision

Our goal is to prove that language models can maintain long-running, multi-agent interactions when bounded by strict runtime validation, biological pressures (like gathering wood or food), and memory compaction. We focus on **pressure-driven behavior**, **material scarcity**, and **social obligations**.

## 🏗️ Architecture: The Headless Probe

We have transitioned away from legacy bridge servers and raw eval loops. Our architecture is **Zero-Based**, **Headless**, and **Deterministic**:

1. **Headless Environment**: Runs entirely on a local Vanilla Minecraft server via Docker. No manual client required.
2. **Mineflayer Runtime**: Multiple NPCs connect simultaneously via TypeScript bots.
3. **Pressure-Intent Lifecycle**: Agents operate under needs ("Pressures") compiled into structured "Intents".
4. **Bounded Tools**: Agents use a strict, runtime-validated seed skill registry (e.g., `collect_logs`).
5. **RCON & Config Management**: Environment enforced externally via Docker RCON and `probe-config.yaml`.

## ⚙️ Usage

The project is built with **TypeScript**, executed via **Bun**, and uses **Docker Compose**.

```bash
# 1. Start the headless Minecraft server
docker compose up -d

# 2. Install dependencies
cd probe
bun install

# 3. Run the Agent Loop Probe
PROBE_BOTS="npc1,npc2,npc3" bun run src/cli.ts
```

*Every run outputs a deterministic Transcript JSON in `data/evidence/` for evaluation.*

## 📂 Structure

- `probe/`: The core bounded agent loop, skills, NPC logic, and memory system.
- `docs/`: Technical reports, specifications (see `docs/docs/Architecture/SPEC.md`), and the project blog.
