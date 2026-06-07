---
sidebar_position: 2
---

# Getting Started

This page is for running the current probe locally. Internal provider-budget
notes, private access instructions, and implementation handoffs live in the
repository's internal `project-docs/` tree, not in the public docs site.

## Requirements

- Docker Engine and Docker Compose plugin
- Bun 1.3+
- Node.js 22+ for building the docs site

## Install

```bash
git clone https://github.com/naem1023/minecraft-llm-agent-community.git
cd minecraft-llm-agent-community
cd probe
bun install
```

## Start The Minecraft Server

```bash
bun run server:ready
```

The command starts or reuses the managed local server and prints a direct
connect address for a Minecraft Java client when one is available.

Stop the managed server with:

```bash
bun run server:stop
```

## Run A Deterministic Probe

```bash
bun run src/cli.ts --npcs 1 --observe-ms 60000
```

The deterministic path is the default because live provider calls should never
consume API quota by accident.

## Run A Social-Cycle Smoke

```bash
bun run probe:social-cycle -- \
  --actor npc_b \
  --provider deterministic-social \
  --cycles 2 \
  --max-actions-per-cycle 2 \
  --offline \
  --no-dashboard \
  --report ../tmp/social-cycle-deterministic-smoke.json
```

Offline runs can still end as blocked because they cannot prove Minecraft world
mutation. That is a useful result when the report clearly explains why progress
could not be verified.

## Dashboard

Probe runs start a local read-only dashboard by default:

```text
http://127.0.0.1:4173
```

The dashboard reads local artifacts such as actor workspace files, evidence,
provider input/output snapshots, memory records, relationships, and action skill
state.
