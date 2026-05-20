---
sidebar_position: 1
---

# Welcome to minecraft-llm-agent-community

**minecraft-llm-agent-community** is currently rebuilding a headless Minecraft
agent-loop runtime.

The project is not currently trying to prove a full NPC society.
It is trying to build a small, bounded, observable runtime that can later grow
into a social simulation seed.

## Current Goal

The current goal is to make one bot reliably perform boring gameplay tasks while
leaving enough transcript and runtime evidence that failures are easy to inspect
and improve.

The first proof is not persona richness.
The first proof is competence plus observability.

## Long-Term Direction

The long-term north star remains a **social simulation seed**:

- bots with role pressure;
- eventually distinct action skill ownership;
- memory and bounded action skill evolution;
- cooperation with each other and later with a human player.

That future depends on the runtime being small, inspectable, and trustworthy now.

## What We Are Not Optimizing For Yet

- long-run autonomy as a product goal;
- rich social roleplay as a content goal;
- large multi-bot society behavior before single-bot competence is trustworthy.

## Current Technical Foundation

The active architecture is built around these rules:

- **Headless Runtime**: local Minecraft server, no manual GUI requirement
- **Mineflayer Bots**: embodied TypeScript bots using the game client API
- **Bounded Tool Loop**: the runtime validates actions; the model only selects valid tools
- **No Raw Eval Loop**: do not return to open-ended JavaScript gameplay execution
- **Live Transcript First**: transcript and runtime artifacts are the primary evidence
- **Checkpoint-Ready Runtime**: phase 1 should leave useful artifacts and progress snapshots
- **Actor Workspace Source Of Truth**: actor-owned memory, evidence, provider inputs, reviews, and action skill lifecycle records should live under the actor workspace
- **Bounded Action Skill Creation**: future action skill evolution should start from runtime evidence and validated recipes, not generated code in the hot loop
- **Per-NPC Async Reviewers**: each NPC gets its own reviewer sidecar; global review only summarizes cross-actor patterns

## Read These Next

- [Canonical Rebuild Spec](Architecture/SPEC.md)
- [Agent Search Index](Agent-Search-Index.md)
- [Terminology](Terminology.md)
- [Minimal Probe](Architecture/Minimal-Probe.md)
- [Runtime Loop And Verification](Architecture/Runtime-Loop-And-Verification.md)
- [Transcript And Runtime Artifacts](Architecture/Transcript-And-Runtime-Artifacts.md)
- [Actor Workspace And Action Skill Memory](Architecture/Actor-Workspace-And-Action-Skill-Memory.md)
- [Async Reviewer Sidecars](Architecture/Async-Reviewer-Sidecars.md)
- [Implementation Workstreams](Architecture/Implementation-Workstreams.md)
- [Bounded Action Skill Creation](Architecture/Bounded-Action-Skill-Creation.md)
- [Headless Server Setup](Setup/Headless-Server.md)
- [Provider Setup](Setup/Provider-Setup.md)
