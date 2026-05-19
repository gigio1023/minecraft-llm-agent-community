---
sidebar_position: 1
---

# Introduction
This documentation site tracks the active migration of
`minecraft-llm-agent-community`.

The current direction is no longer the old Voyager-style runtime. The active
work is a small headless mineflayer probe:

- a local vanilla Docker server;
- two offline mineflayer bots;
- a bounded `observe` / `move` / `say` / `wait` / `remember` loop;
- a transcript artifact under `data/evidence/`.

The goal of this slice is simple: prove the runtime-owned NPC tool loop works
without a manual Minecraft client, Fabric/Forge setup, or an eval-driven agent
runtime.

<!-- <div style="text-align: center;">
  <img src="img/cover-image.jpeg" alt="Description" style="max-width: 400px; height: auto;">
</div> -->

![](img/cover-image.jpeg)

Older Voyager, Fabric, Python, and manual-server notes are still kept in this
repository as reference material, but they are now archived background rather
than the default way to run the project.
