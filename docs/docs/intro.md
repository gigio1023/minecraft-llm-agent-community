---
sidebar_position: 1
---

# Overview

**minecraft-llm-agent-community** is a headless Mineflayer probe for evaluating
LLM agents in Minecraft.

The project is intentionally small. It tests whether an actor can perform
bounded game actions and leave enough evidence to explain the result.

## What It Does

- starts or connects to a local Minecraft server;
- runs Mineflayer actors through a bounded TypeScript loop;
- lets a provider propose one action at a time;
- verifies progress from Minecraft state, not model text;
- writes transcripts, provider inputs, evidence, and review artifacts.

## Core Model

Each actor has a workspace under `data/actors/<actor_id>/`.

That workspace owns the actor's active action skills, candidate repairs, memory,
evidence, provider inputs, reviews, and relationships. Runtime code reads from
that workspace before it allows a primitive to execute.

The hot path stays narrow:

```text
observe -> gate -> execute -> verify -> record
```

Reviewer and repair work runs after the turn from saved artifacts.

The next architecture layer is actor-owned goal continuity: `soul.md`, a
persistent LifeGoal, per-cycle CycleGoal selection, and CycleJudgment artifacts.
It separates "Minecraft evidence passed" from "the actor's social-life judgment
actually controlled the current goal."

## What It Is Not

This is not a loose generated-code gameplay loop. It is also not a persona-first
NPC demo.

The current proof is simpler: complete concrete Minecraft tasks, reject fake
progress, and make failures easy to inspect.

This is not a revival of unverifiable Voyager-style generated-code execution.
Direct generated TypeScript is allowed when it is tied to an objective,
helper-call artifacts, and current-run evidence.

The repo should not treat a model-written JavaScript file, a progress-looking
animation, or an optimistic provider explanation as success. Success belongs to
runtime verification backed by world, inventory, position, container, or
transcript evidence.

## Read Next

- [Runtime Loop And Verification](Architecture/Runtime-Loop-And-Verification.md)
- [Actor Workspace And Action Skill Memory](Architecture/Actor-Workspace-And-Action-Skill-Memory.md)
- [Soul Life Goal Runtime Architecture](Architecture/Soul-Life-Goal-Runtime-Architecture.md)
- [Composer 2.5 Soul Life Goal Runtime Implementation Plan](Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md)
- [Async Reviewer Sidecars](Architecture/Async-Reviewer-Sidecars.md)
- [Social Actor Profiles And Relationships](Architecture/Social-Actor-Profiles-And-Relationships.md)
- [Headless Server Setup](Setup/Headless-Server.md)
- [Provider Setup](Setup/Provider-Setup.md)
- [Architecture Spec](Architecture/SPEC.md)
- [Agent Search Index](Agent-Search-Index.md)
- [Terminology](Terminology.md)
