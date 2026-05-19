# minecraft-llm-agent-community

<img src="assets/cover-image.png" alt="Cover Image" width="60%">

A headless, multi-agent Minecraft probe designed to study LLM-driven NPC interactions under resource scarcity and social contracts.

[Documentation & Web Portal](https://naem1023.github.io/minecraft-llm-agent-community/)

---

## Overview

**minecraft-llm-agent-community** runs multiple lightweight Mineflayer bots on a local vanilla Minecraft server using Docker. Unlike systems that generate raw JavaScript code to execute directly, this runtime uses a strictly bounded tool loop. The LLM acts as the decision-making "Brain" that selects from a validated registry of tools (e.g., `mineBlock`, `say`, `craftItem`), while the TypeScript runtime owns the physical "Body," validating actions and tracking execution outcomes. 

Every run records structured JSON transcripts, allowing developers to analyze and evaluate multi-agent cooperation, role responsibilities, and resource distribution.

Of course, having Yann LeCun's proposed "world model" would make this task much easier, but LLMs are not naturally good at understanding the physical world. We wanted to see how far we could push social simulation by overcoming this constraint.

---

## Comparative Analysis (References & Inspirations)

This project is a staging area that consolidates, simplifies, or adapts concepts from several pioneering open-source projects in the LLM agent, multi-agent, and Minecraft AI research spaces.

Below is a comparison of how this project relates to **22 famous repositories**:

| Repository | Focus Area | Relationship to This Project |
|------------|------------|-----------------------------|
| [Voyager](https://github.com/MineDojo/Voyager) | Minecraft AI Agent | We adopt their early-game survival progression but replace their open-ended JavaScript `eval` loop with static tool-bound TypeScript execution. |
| [MineDojo](https://github.com/MineDojo/MineDojo) | Minecraft Framework | We share the goal of training embodied agents but focus on simple vanilla servers rather than complex Fabric/Forge mod setups. |
| [Generative Agents](https://github.com/joonspk-research/generative_agents) | Multi-Agent Society | We simulate NPC societies but drive cooperation through material scarcity and shared storage rather than text-only personas. |
| [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | Generalist LLM Agent | We limit execution to a strict tool-registry rather than allowing open-ended shell execution to ensure deterministic behavior. |
| [BabyAGI](https://github.com/yoheinakajima/babyagi) | LLM Task Planner | We replace autonomous agent-guided planning with a machine-verifiable gameplay curriculum. |
| [MetaGPT](https://github.com/geekan/MetaGPT) | Multi-Agent Framework | We adapt their structured role-contracts and clean API boundaries to define NPC responsibilities. |
| [ChatDev](https://github.com/OpenBMB/ChatDev) | Collaborative Agents | We apply similar role-based collaboration protocols to Mineflayer bots working in a shared space. |
| [LangChain](https://github.com/langchain-ai/langchain) | LLM Orchestration | We write clean, lightweight TS modules instead of importing heavy frameworks to minimize execution overhead. |
| [LlamaIndex](https://github.com/run-llama/llama_index) | RAG & Context | We use a custom episodic-and-semantic memory wrapper instead of external vector databases for bot observations. |
| [Mineflayer](https://github.com/PrismarineJS/mineflayer) | Minecraft Bot API | The core library powering our bot connections, movement, and physical world interactions. |
| [Prismarine Viewer](https://github.com/PrismarineJS/prismarine-viewer) | Real-time Web Viewer | Used as an optional tool for manual visual verification of bot movement and builds. |
| [GITM](https://github.com/bytedance/GITM) | Text-Based Minecraft AI | We build on their text-based planning success while centering the system on multi-agent cooperative loops. |
| [DEPS](https://github.com/wangbingyt/DEPS) | Task-Planning Errors | We adopt their error-aware feedback and action criticism to prevent bots from repeating failing actions. |
| [Cradle](https://github.com/baai-agents/Cradle) | Screen-Control Agent | We interact programmatically through Mineflayer APIs rather than simulating keyboard and mouse clicks. |
| [Steve-1](https://github.com/shibhansh/steve-1) | Visual-Motor Control | We focus on symbolic LLM task planning rather than end-to-end neural network visual controls. |
| [Camel](https://github.com/camel-ai/camel) | Role-Playing Cooperative | We implement role-based dialogues inside Minecraft to coordinate resource gathering. |
| [MineAgent](https://github.com/polixir/MineAgent) | Multi-Agent Coordination | We use task pressure (scarcity, shared chest stashes) to trigger cooperation instead of plain conversation. |
| [Mindcraft-CE](https://github.com/wearedevx/Mindcraft-CE) | Minecraft LLM Client | We adapt their busy-aware dialogue system and single-action lock gates to prevent bot race conditions. |
| [Mineflayer-ChatGPT](https://github.com/PrismarineJS/mineflayer-chatgpt) | ChatGPT Bot Client | We incorporate their event-driven brain designs, team bulletins, and safety overrides for environmental hazards. |
| [Microsoft JARVIS](https://github.com/microsoft/JARVIS) | LLM Tool Controller | We use the LLM to choose from verified tools, while the runtime validates the outputs. |
| [Project Malmo](https://github.com/microsoft/malmo) | Historical Minecraft AI | We replace historical modded setups with lightweight Docker containers running vanilla server instances. |
| [OpenCode/Codex](https://github.com/OpenCode-AI) | Code & Compaction | We adapt their history-compaction techniques to fit long-running bot logs into the LLM context window. |

---

## Technical Architecture

Our system replaces the legacy Voyager eval-loop with a robust, tool-bound architecture:

- **Headless Server**: Vanilla Minecraft running inside a Docker container. No graphical client is required.
- **Mineflayer Bots**: Multiple NPCs join the server concurrently as TypeScript clients.
- **Bounded Tool Loop**: The LLM chooses actions from a strictly validated tool registry. Each tool has a short runtime timeout and a static API screen.
- **Pressure-Driven Behavior**: Bots prioritize gathering, crafting, and building based on resource needs and obligations, not just persona templates.
- **Structured Transcripts**: Run evidence is logged as deterministic JSON.

---

## Quick Start

### 1. Requirements
- Docker and Docker Compose
- Bun 1.3+
- Node.js 22+ (to build Docusaurus documentation)

### 2. Start the Headless Server
```bash
# Start the server container
docker compose -f probe/compose.yaml up -d
```

### 3. Install Dependencies
```bash
cd probe && bun install
```

### 4. Configure Provider Authentication
This project uses the OpenAI Codex provider with `gpt-5.4-mini` by default. Define your credentials in a local JSON file at:
```
build/provider-auth/openai-codex-auth.json
```
*Note: This path is gitignored. The runtime reads and refreshes tokens internally. Do not commit or print raw API tokens.*

### 5. Run the Probe Simulation
```bash
PROBE_BOTS="npc1,npc2,npc3" bun run src/cli.ts
```
Structured transcripts are saved to `data/evidence/` after completion.

---

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `probe/` | Core runtime: agent loops, skills, memory, and Docker server configurations. |
| `docs/` | Project documentation, search index, research, and Docusaurus blog site. |
| `data/evidence/` | JSON transcripts saved from active simulation runs. |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on commit conventions, validation steps, and styling rules.

---

## License

This project is a reference staging area. Do not revive the legacy Voyager architecture as the active implementation path.
