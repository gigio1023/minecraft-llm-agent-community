---
sidebar_position: 1
---

# Headless Server Setup

This guide explains the local headless Minecraft setup used by the current
runtime rebuild.

## Why Headless

The first proof should not require a manual Minecraft client.

The active workflow is:

1. start a local headless server;
2. connect Mineflayer bots;
3. run the bounded runtime;
4. inspect transcript and runtime artifacts;
5. optionally use viewer evidence if needed.

The primary evidence is not a GUI.
It is transcript plus runtime artifacts.

## Recommended Setup

Use Docker for a repeatable local vanilla server.

Example shape:

```yaml
services:
  mc:
    image: itzg/minecraft-server:java21
    ports:
      - "25565:25565"
    environment:
      EULA: "TRUE"
      VERSION: "1.21.1"
      TYPE: "VANILLA"
      ONLINE_MODE: "FALSE"
      ENABLE_RCON: "true"
```

The exact compose file should live under `probe/` and be treated as the runtime
source of truth.

## Important Rules

- local headless setup only for the first proof;
- no manual client gate;
- no Fabric/Forge requirement for the first proof;
- Mineflayer is the client API layer;
- RCON and viewer are optional support tools, not the primary evidence path.

## Evidence Order

Use these in order:

1. transcript
2. checkpoint-like runtime artifacts
3. traces
4. optional visual confirmation
