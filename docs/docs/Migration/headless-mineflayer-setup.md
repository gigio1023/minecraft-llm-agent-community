---
sidebar_position: 2
---

# Headless Mineflayer Setup

Status: active setup guide
Search tokens: `HEADLESS_MINEFLAYER_PROBE`, `NO_MANUAL_CLIENT_GATE`,
`MINECRAFT_SERVER_HEADLESS`.

## Goal

Make Minecraft testing boring:

```text
one command starts a local offline server
one command spawns bots
one command writes transcript/evidence
optional browser viewer only when visual inspection is useful
```

The human should not need to open the Minecraft client for the first proof.

## Recommended Server Path

Use Docker first if available:

```yaml
services:
  mc:
    image: itzg/minecraft-server:java21
    container_name: minecraft-agent-loop-probe
    ports:
      - "25565:25565"
    environment:
      EULA: "TRUE"
      VERSION: "1.21.1"
      TYPE: "VANILLA"
      ONLINE_MODE: "FALSE"
      MODE: "creative"
      DIFFICULTY: "peaceful"
      LEVEL_TYPE: "FLAT"
      GENERATE_STRUCTURES: "false"
      SPAWN_ANIMALS: "false"
      SPAWN_MONSTERS: "false"
      SPAWN_NPCS: "true"
      VIEW_DISTANCE: "6"
      SIMULATION_DISTANCE: "6"
      ENABLE_COMMAND_BLOCK: "true"
      ENABLE_RCON: "true"
      RCON_PASSWORD: "local-dev-only"
    volumes:
      - ./tmp/minecraft-server:/data
    tty: true
    stdin_open: true
```

Use `ONLINE_MODE=FALSE` for local automation so mineflayer bots can connect
with `auth: "offline"` and no Microsoft login.

## Alternative Server Path

Mineflayer's own test suite uses `minecraft-wrap` to download and start a
vanilla server programmatically. That is a valid alternative for a Node-only
test harness.

The useful pattern in `/Users/naem1023/git/mineflayer/test/externalTest.js`:

- choose a free local port;
- download the versioned server jar;
- start it with property overrides;
- set `online-mode=false`;
- set `level-type=FLAT`;
- set `gamemode=1`;
- set `spawn-npcs=true`;
- connect mineflayer bot to `127.0.0.1`;
- stop and delete server data after the run.

Docker is simpler for the first project-owned spike. `minecraft-wrap` is better
when the probe needs isolated per-test server lifecycle.

## Bot Connection Baseline

Use local offline auth:

```js
const mineflayer = require("mineflayer");

const bot = mineflayer.createBot({
  host: "127.0.0.1",
  port: 25565,
  username: "npc_a",
  auth: "offline",
  viewDistance: "tiny",
});
```

Spawn multiple bots by giving each a unique username.

## Observation Without Minecraft Client

Use these in order:

1. structured transcript;
2. structured event log;
3. terminal chat log;
4. optional `prismarine-viewer` browser view;
5. optional headless screenshot/video.

`prismarine-viewer` can serve a browser view of a bot in first or third person.
Use it for visual debugging, not as the proof gate.

## First Proof Evidence

Each probe run should write one small artifact:

```json
{
  "probe": "agent_loop_probe_v0",
  "server": "local-offline-flat",
  "bots": ["npc_a", "npc_b"],
  "steps": [
    {
      "actor": "npc_a",
      "observation": "...",
      "tool": "move_to",
      "result": "arrived"
    }
  ],
  "final": {
    "status": "success",
    "why": "npc_a handled a blocked or available conversation through tool results"
  }
}
```

Do not add a broad test matrix before this artifact exists.
