---
sidebar_position: 1
---

# Overview

`minecraft-llm-agent-community` is a small headless Minecraft runtime for
studying LLM-backed actors in a world where actions have concrete consequences.

The project is not a generic benchmark bot and not a revival of loose
Voyager-style generated-code execution. The near-term goal is more basic:
make one Mineflayer actor attempt bounded Minecraft actions, verify what really
happened, and leave artifacts that explain success, failure, stalls, and
reconnects.

## Why Minecraft

Minecraft is useful because it turns abstract agent behavior into inspectable
state. An actor can gather resources, craft, move, place blocks, use containers,
or speak, and the runtime can check whether the world, inventory, position, or
transcript changed.

The long-term direction is a social simulation seed. Actors should eventually
carry role context, memory, relationships, obligations, and actor-owned action
skills. The first proof is deliberately smaller: competence and observability
before richer social behavior.

## What The Runtime Owns

The model proposes a bounded next action. The runtime owns the parts that decide
truth:

- schema validation and structured action parameters;
- permission and retry gates;
- Mineflayer execution;
- post-action observation;
- verifier results;
- transcript, evidence, and actor workspace artifacts.

Provider text is context, not proof. A confident explanation does not count as
Minecraft progress unless the runtime records supporting evidence.

## Read Next

- [Getting Started](getting-started.md)
- [Architecture](architecture.md)
- [Evidence And Artifacts](evidence-and-artifacts.md)
- [Roadmap](roadmap.md)
