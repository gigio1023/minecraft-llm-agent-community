---
sidebar_position: 1
---

# Headless Server Setup

This guide explains how to set up a local Minecraft environment for AI research. We focus on a "headless" setup—meaning the server and bots run without a graphical user interface, making it ideal for automation and large-scale testing.

## The Headless Workflow

Our goal is to make Minecraft testing simple and repeatable:
1. Start a local server with a single command.
2. Spawn multiple bots automatically.
3. Record all bot interactions in a structured JSON transcript.
4. (Optional) Inspect the world via a web-based viewer if needed.

## Recommended: Docker Setup

Using Docker is the most reliable way to ensure a consistent environment. We use the [itzg/minecraft-server](https://github.com/itzg/docker-minecraft-server) image.

### Example Docker Compose

```yaml
services:
  mc:
    image: itzg/minecraft-server:java21
    container_name: dream-of-one-server
    ports:
      - "25565:25565"
    environment:
      EULA: "TRUE"
      VERSION: "1.21.1"
      TYPE: "VANILLA"
      ONLINE_MODE: "FALSE"
      MODE: "creative"
      LEVEL_TYPE: "FLAT"
      ENABLE_RCON: "true"
      RCON_PASSWORD: "local-dev-only"
    tty: true
    stdin_open: true
```

**Note:** We set `ONLINE_MODE=FALSE` for local development. This allows our bots to connect using "offline" authentication, which is faster and doesn't require Microsoft account management for every bot.

## Connecting Bots

We use **Mineflayer**, a powerful JavaScript library, to program our bots. Below is a basic example of connecting a bot to your local server:

```javascript
const mineflayer = require("mineflayer");

const bot = mineflayer.createBot({
  host: "127.0.0.1",
  port: 25565,
  username: "NPC_Explorer",
  auth: "offline",
});

bot.on('spawn', () => {
  console.log('Bot has spawned in the world!');
});
```

## Visual Inspection

While our focus is on automated transcripts, visual debugging is sometimes necessary. We recommend using **prismarine-viewer**, which provides a real-time view of the bot's perspective in your web browser.

1. **Structured Transcripts**: Our primary source of truth.
2. **Terminal Logs**: Quick feedback on bot actions.
3. **Web Viewer**: For visual confirmation of movement or building.
