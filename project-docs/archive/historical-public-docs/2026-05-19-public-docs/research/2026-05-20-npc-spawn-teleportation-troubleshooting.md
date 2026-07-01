# NPC Spawn and Teleportation Troubleshooting Report

**Date:** 2026-05-20
**Context:** minecraft-llm-agent-community - Headless Mineflayer NPC Probe

## Issue Description
During the execution of the multi-bot agent loop probe, we observed that 3 NPCs (`npc1`, `npc2`, `npc3`) were failing to spawn at the designated village location (`49.224, -60.062, -119.021`). Instead, they consistently spawned and remained at the default world spawn location (around `5.2, -60, -0.8`).

## Root Causes
Analysis of the `bot.chat` teleportation logic and Minecraft server behavior revealed two fundamental issues:

1. **Missing OP Permissions (Silent Failure):**
   The original implementation relied on the bots executing `/tp @s X Y Z` in the game chat right after connecting. However, Mineflayer bots log in as standard players. Without OP (administrator) privileges, the vanilla Minecraft server silently ignores the `/tp` command. 
   *Result:* The bots successfully connected but were never teleported, leaving them stranded at the default world spawn.

2. **Collision and Safety Rejection (Exact Coordinates):**
   When the target coordinates were set exactly to the ground level where the observer (human player) was standing (`Y: -60.062`), the server's collision prevention mechanics interfered. Minecraft often rejects teleports if it determines the destination is unsafe (e.g., clipping into solid blocks or overlapping entirely with another player's bounding box).
   *Result:* Even if OP privileges were granted, the teleport would fail due to physical obstruction.

## Implemented Solution
To ensure stable and guaranteed NPC spawning at the desired location without relying on manual in-game privilege escalation, the following robust approach was adopted in `probe/src/runProbe.ts`:

1. **RCON-Driven Orchestration:**
   Replaced `bot.chat` teleportation with external Docker `rcon-cli` commands. RCON executes commands at the server level, completely bypassing the need for individual bot permissions.
   - `setworldspawn X Y Z`: Globally changes the server's spawn point so that any new connections or respawns naturally occur at the target village location.
   - `tp <bot_name> X Y Z`: Forcefully teleports the bots via RCON to override their offline saved positions.

2. **Vertical Clearance (Anti-Clipping):**
   Modified `probe-config.yaml` to enforce a minimum 3-block vertical clearance above the target ground level (e.g., from `Y: -60.062` to `Y: -57.0`).
   - This ensures the bots spawn mid-air and fall safely to the ground, avoiding any bounding box collisions with solid blocks or the human player.

3. **Command Sequencing & Delays:**
   Introduced a 2-second delay after the bots connect and before sending the RCON teleport commands. This ensures the server has fully loaded the bot entities into the world state before attempting to move them.

## Best Practices for Future Probes
- **Do not rely on `bot.chat` for administrative setup.** Always use server-level mechanisms (RCON or Docker exec) for environment setup (teleporting, time-setting, giving items) in headless probes.
- **Never teleport to exact ground floats.** Always add `+3` to the target `Y` coordinate to prevent anti-clipping failures.
- **Set World Spawn:** Instead of continuously teleporting bots on every script run, explicitly configure the server's `setworldspawn` to the testing site so natural respawns handle positioning automatically.
