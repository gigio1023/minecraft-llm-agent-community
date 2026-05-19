---
sidebar_position: 1
---

# Architecture Specification

**Date:** 2026-05-20

## 1. Goal

Build a minimal viable "living NPC society" in Minecraft using a headless probe. Success requires three pillars:
1. **Gameplay Competence:** Play Minecraft like an expert.
2. **Social Pressure:** Drive behavior via roles, resources, shared storage, danger, and obligations.
3. **Resilient Architecture:** Survive long simulations using robust transcripts, memory, and compaction.

Adding more persona prompts will not achieve this.

## 2. Core Decisions

**Why past attempts failed:** The runtime didn't treat Minecraft like a game. There was no concrete curriculum, no trusted gameplay primitives, weak anti-repeat policies, and no social pressure (like shared storage or scarcity).

**The new direction:** NPCs must gather, craft, store, divide roles, cooperate, and occasionally conflict, all while maintaining long-term memory.

## 3. Research Takeaways

- **Voyager:** Take its one-task-at-a-time curriculum, trusted primitives, task verification, and early-game progression.
- **mc-multimodal-agent:** Take its post-action refresh, layered memory, blocker tracking, and loop detection.
- **mineflayer-chatgpt:** Take its event-driven brain, role restrictions, team bulletin, and strictly bounded hostile roles.
- **mindcraft-ce:** Take its single-action gate, interruption policies, and busy-aware conversation scheduling.
- **opencode & codex:** Take the part-based transcript, thread-store abstraction, compaction checkpoints, and explicit tool records.

## 4. Target State

A minimal society consists of:
- **3-4 Cooperative NPCs:** Roles include gatherer, crafter, scout, and guard.
- **1 Hostile NPC:** Bounded by strict cooldowns, short leashes, and role-based attack policies.
- **Social Requirements:** Shared storage, public/private resource distinction, obligations, scarcity, and busy/idle-aware interactions.

## 5. Architectural Principles

1. **Gameplay First, Persona Second:** Reliable seed skills, primitives, and resource models must precede persona text.
2. **Runtime Owns Reality:** The runtime handles validation, timeouts, storage ledgers, and hostility bounds. The LLM only handles intent, short-term plans, and utterance style.
3. **Society Emerges From Pressure:** Cooperation stems from shared stash upkeep and crafting dependencies, not prompts.
4. **Real Session Architecture:** Long runs require part-based transcripts, canonical replay history, and replacement-history compaction checkpoints.

## 6. Domain Model

- **Agent Thread:** Independent thread per NPC (role, current task, recent events, mailbox).
- **Shared Settlement State:** Known shared chests, workstation registry, resource summary, and tension state.
- **Transcript Parts:** Structured execution records (validated args, diffs, status).
- **Memory Layers:** Episodic (recent experiences), Procedural (known workflows), Semantic (world anchors), and Working (current blockers).

## 7. Gameplay Competence

- **Bootstrap/Recovery Scaffold:** Progression spines (e.g., `Collect 4 logs`, `Craft wooden pickaxe`) trigger during fresh starts or severe scarcity. 
- **Pressure & Intent Loop:** The runtime calculates compact pressures (e.g., shared shortage, hostile risk). The LLM selects a single, multi-turn intent executed via bounded skills.
- **Primitives & Skills:** Strictly TypeScript-owned helpers (`mineBlock`, `craftItem`) and curated seed skills (`collectLogs`, `depositSharedItems`).

## 8. Social Simulation

- **Role Contracts:** Define allowed tools, keep-item policies, and hostility bounds.
- **Team Bulletin:** A shared ledger showing current tasks, blockers, and recent events.
- **Conversation Scheduler:** Enforces busy/idle delays and batches inbound messages.
- **Hostile Policy:** One hostile agent only. Strictly limited by short patrol radii and retreat conditions.

## 9. Runtime Loop

Event-driven execution: 
`Observe state -> Merge mailbox/bulletin -> Choose intent -> Execute via single-action gate -> Attach post-action diffs -> Update memory -> Compact/Checkpoint`

Only one action is active at a time. The runtime attaches a strict post-action refresh (inventory/position diffs) after every skill.

## 10. Transcript & Memory

- **Compaction:** Uses replacement-history checkpoints containing the overall mission, shared state, and active blockers, while preserving a short recent raw tail.
- **Offline Extraction:** Hot loops are deterministic and replay-safe. Long-term memory extraction (social patterns, reputation) happens offline.

## 11. Implementation Phases

1. **Gameplay Foundation:** Pressure engine, intent selector, primitives, and task verification.
2. **Role Society:** Shared storage, role contracts, team bulletin, and obligation routing.
3. **Memory Architecture:** Thread stores, canonical replays, and compaction checkpoints.
4. **Bounded Hostile:** Introduce the single hostile NPC with patrol/retreat logic.
5. **Long-run Stability:** Mailbox phases and offline memory extraction.

## 12. Anti-Patterns (Do Not Do)

- Expanding persona prompts without gameplay logic.
- Reintroducing open-ended JS `eval` loops.
- Simulating a full village economy immediately.
- Giving all NPCs combat authority.
