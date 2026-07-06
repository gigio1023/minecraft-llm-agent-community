---
sidebar_position: 1
---

# Overview

`minecraft-llm-agent-community` is a small headless Minecraft runtime for
studying embodied co-actor legibility: whether an observer model can predict a
co-actor's next-turn social and material responses from public interaction
history alone.

The project is not a generic benchmark bot, a race-to-diamond agent, a large
village simulator, or a revival of loose Voyager-style generated-code
execution. The near-term proof is a bounded 2-3 actor shared session that
records what each actor could observe, what action executed, what changed, and
which response window made the result scorable.

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
research question is whether public history improves prediction of
`social_response` and `material_access` labels beyond baselines such as current
observation, majority/no-response, policy-copy, shuffled-history, and leakage
controls.

`transition-row/v1` records never contain predicted outcomes. Prediction
artifacts are joined later by row id after labels are locked.

## Read Next

- [Getting Started](getting-started.md)
- [Architecture](architecture.md)
- [Evidence And Artifacts](evidence-and-artifacts.md)
- [Roadmap](roadmap.md)
