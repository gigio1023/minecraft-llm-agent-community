# minecraft-llm-agent-community

A headless, multi-agent Minecraft probe for studying LLM-driven NPC interactions.

[Documentation](https://gigio1023.github.io/minecraft-llm-agent-community/)

## Overview

minecraft-llm-agent-community runs multiple Mineflayer bots against a local vanilla Minecraft server. Each bot is driven by a language model through a bounded tool loop -- no raw eval, no manual client, no Fabric mods. Agents operate under resource pressures (gathering, crafting, inventory management) and produce structured transcripts for evaluation.

## Quick Start

```bash
# Start the headless server
docker compose -f probe/compose.yaml up -d

# Install dependencies
cd probe && bun install

# Run the probe
PROBE_BOTS="npc1,npc2,npc3" bun run src/cli.ts
```

Transcripts are written to `data/evidence/` after each run.

## Architecture

The probe replaces the legacy Voyager eval-loop with a strictly bounded runtime:

- **Headless server** -- Vanilla Minecraft via Docker Compose, no manual client required
- **Mineflayer bots** -- Multiple NPCs connect simultaneously as TypeScript clients
- **Bounded tool loop** -- The LLM selects from a registry of validated skill functions, each with a short runtime timeout and static API screening
- **Pressure-driven behavior** -- Agents act on resource needs (wood, food, tools) rather than persona text alone
- **Structured transcripts** -- Every run produces deterministic JSON evidence for analysis

## Project Structure

| Path | Purpose |
|------|---------|
| `probe/` | Agent loop, skills, NPC logic, memory, Docker server config |
| `docs/` | Technical reports, specifications, and project blog |
| `data/evidence/` | Transcript outputs from probe runs |

## Requirements

- Docker and Docker Compose
- Bun 1.3+
- Node.js 20+ (for Docusaurus docs)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions, validation steps, and design rules.

## License

This project is a reference and migration staging area. Do not revive the legacy Voyager architecture as the active implementation path.
