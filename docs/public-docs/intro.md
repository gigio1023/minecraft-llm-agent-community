---
sidebar_position: 1
---

# Overview

`minecraft-llm-agent-community` is a headless Minecraft runtime for studying
what happens when individually capable, persistent LLM actors pursue their own
goals in a shared world where economic, cooperative, and quest activity makes
them materially interdependent.

The project is not a generic benchmark bot, a race-to-diamond agent, a scripted
village simulator, or a revival of loose Voyager-style generated-code
execution. Individual task competence and long-horizon goal continuity are
measured first. Capable actors then enter versioned interdependent social
scenarios whose behavior is recorded in structured artifacts, metrics, and
video.

## Why Minecraft

Minecraft is useful because it turns abstract agent behavior into inspectable
state. Actors can gather resources, craft, move, place blocks, use containers,
share or refuse items, or speak, and the runtime can check whether the world,
inventory, position, chat, or transcript changed.

That material grounding matters. If another actor lends a tool, blocks access,
ignores a request, repairs a mistake, or uses a public affordance later, the
project should record evidence for that consequence instead of relying on a
plausible story in model text.

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
That evidence is experiment hygiene, not the contribution by itself. The active
program uses it to separate individual capability, goal continuity, and social
behavior before promoting a recurring phenomenon into a controlled research
question.

`transition-row/v1` records never contain predicted outcomes. Prediction
artifacts are joined later by row id after labels are locked.

## Read Next

- [Getting Started](getting-started.md)
- [Architecture](architecture.md)
- [Evidence And Artifacts](evidence-and-artifacts.md)
- [Roadmap](roadmap.md)
