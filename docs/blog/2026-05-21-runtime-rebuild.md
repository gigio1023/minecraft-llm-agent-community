---
slug: runtime-rebuild
title: "The Runtime Rebuild Is Now About Evidence, Ownership, and Bounded Action"
authors: [gigio1023]
tags: [runtime, mineflayer, architecture, action-skills, social-simulation]
---

This project has moved past the original Voyager-style migration question.

The current work is a small headless Minecraft runtime where an LLM-backed actor
can make bounded proposals, but the TypeScript runtime owns execution,
verification, artifacts, and lifecycle state.

<!--truncate-->

## The Important Concepts

The recent rebuild matters less because of the number of modules added and more
because the code now preserves the right boundaries.

**Runtime-owned truth.** The provider can suggest one bounded action. The runtime
checks whether the actor owns an active action skill that permits the primitive,
executes through Mineflayer, observes the world again, and verifies real deltas
before accepting progress.

**Actor-local ownership.** An NPC is not just a prompt. It has an actor
workspace: active and candidate action skills, memory, evidence, provider input
snapshots, reviews, and relationship state. That workspace is the local source
of truth for what the actor can currently do and what needs repair.

**Replayable evidence.** The runtime records provider packets, turn evidence,
tool attempts, verifier reasons, fake-progress rejection, and review refs. The
point is to inspect failure from artifacts instead of trusting a clean process
exit or a confident model explanation.

**Bounded social pressure.** Actor profiles, goals, obligations, and
relationships are now structured context. They influence intent, but they do not
grant tools or override role/action-skill boundaries.

**Async repair.** Reviewers read immutable artifacts after the turn. They can
write findings, candidate action-skill proposals, or relationship event
proposals, but runtime guards own promotion and mutation.

## Why We Are Not Reviving Raw Eval

The old path let the model write code and asked the runtime to execute it. That
is attractive for demos, but brittle for social simulation. It makes partial
motion look like success, hides primitive failures behind generated code, and
turns repair into prompt archaeology.

The new rule is stricter:

```text
provider proposal -> active action-skill gate -> Mineflayer execution
-> runtime verification -> transcript/evidence -> async review
```

Providers can choose. They do not decide whether the bot succeeded. Reviewers
can explain and propose. They do not mutate active runtime state.

## The Social Layer Is Bounded On Purpose

The project still points toward a social simulation seed, but not through
persona text alone. Actor behavior should be shaped by Minecraft pressure:
resources, tools, storage, obligations, memory, relationship evidence, and
action skills the actor actually owns.

The first social loop is intentionally modest. A reviewer can propose a
relationship event. A guarded runtime module validates the actor ids, event enum,
and evidence refs. Only then can a directional relationship edge change. That
relationship state becomes pressure in the next provider context, not a license
to invent new capabilities.

## What To Read Now

Start with the public [architecture overview](/docs/architecture), then read:

- [Evidence And Artifacts](/docs/evidence-and-artifacts)
- [Getting Started](/docs/getting-started)
- [Roadmap](/docs/roadmap)

The short-term proof remains deliberately boring: a bot should complete concrete
gameplay tasks and leave artifacts that make failures easy to inspect. That is
the base a later society can stand on.
