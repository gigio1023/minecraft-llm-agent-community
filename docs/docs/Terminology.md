---
sidebar_position: 3
---

# Terminology

Use these terms consistently across this repo.

## Core Rule

Do not use bare **skill** in active repo guidance when the meaning could be
confused. Prefer **agent skill** or **action skill**.

Bare **skill** is allowed only when:

- quoting an external repository or historical artifact name;
- referring to a legacy path, file, JSON field, or project name that still
  contains `skill`;
- using a generic English phrase where it cannot be confused with the two
  project-specific terms.

## Agent Skill

An **agent skill** is a Codex/Claude-style capability under `.agents/skills/`.
It is built or maintained with `skill-builder` and documented by a `SKILL.md`.

Agent skills help coding agents work on this repository. They are not Minecraft
runtime behavior and must not be described as bot gameplay abilities.

Example:

- `.agents/skills/minecraft-agent-runtime-review/SKILL.md`

## Action Skill

An **action skill** is a Minecraft/Mineflayer-based bundled behavior that the
game runtime can validate, execute, verify, and record.

Action skills include boring gameplay behaviors such as collecting logs, crafting
steps, storage interaction, movement routines, and conversation-like actions.
They are runtime capabilities, not Codex/Claude agent skills.

Phase 1 action skills must stay bounded:

- composed from trusted runtime primitives;
- validated before execution;
- executed through the action runner;
- verified from world, inventory, container, position, or transcript evidence;
- recorded in live transcript and runtime artifacts.

### Seed Action Skill

A **seed action skill** is a hand-authored action skill definition in the runtime
registry. It can be `implemented` or `planned`.

Only `implemented` seed action skills should be offered to the provider as active
runtime candidates.

### Candidate Action Skill

A **candidate action skill** is a proposed action skill that has not yet been
promoted. It should be represented as a bounded recipe over trusted runtime
primitives, not arbitrary generated code.

### Generated Action Skill Bundle

A **generated action skill bundle** is a possible future implementation artifact.
It is not a Phase 1 hot-loop behavior. If introduced later, it should be treated
like a reviewed patch, not automatically imported runtime output.

## Runtime Primitive

A **runtime primitive** is a small, trusted game operation such as `observe`,
`collect_logs`, `craft_item`, `move_to`, `say`, or `wait`.

Runtime primitives are lower-level than action skills. Action skills compose
runtime primitives.

## Tool Call

A **tool call** is the provider's structured request to run one runtime primitive
with validated arguments.

The provider proposes tool calls. The runtime validates and executes them.

## Action Runner

The **action runner** is the runtime boundary that applies timeout,
cancellation, result normalization, and transcript-visible execution records for
runtime primitives and action skills.

## Actor, Bot, And NPC

Use these terms with this distinction:

- **bot**: the Mineflayer client object connected to Minecraft;
- **actor**: the runtime identity that owns role, memory, action skill metadata,
  and transcript records;
- **NPC**: the user-facing game character concept represented by an actor and a
  bot.

## Actor Workspace

An **actor workspace** is the per-actor filesystem home for runtime-owned actor
state.

It is where one actor's memory artifacts, runtime evidence, action skill
library, candidate action skills, and retired action skills are organized.

Initializing an actor workspace means restoring the expected initial structure
and baseline index files. It does not mean deleting actor artifacts. Existing
candidate action skills, evidence, retired action skills, and memory files must
survive initialization unless a separate explicit cleanup operation is requested.

## Provider

A **provider** is the model-facing component that proposes the next valid tool
call or short utterance. The provider does not own reality, verification,
timeouts, or action skill promotion.

## Transcript

A **transcript** is the append-oriented behavior record for a run. It should show
what the actor intended, what the runtime attempted, what changed, and why the
runtime marked progress, failure, timeout, or stall.

## Runtime Artifact

A **runtime artifact** is a structured file written by a run, such as canonical
evidence JSON, checkpoint-ready state, debug timeline, or final status summary.

## Evidence

**Evidence** means observed game/runtime facts, not optimistic text. Valid
evidence includes inventory deltas, block deltas, position distance, container
state, transcript records, runtime artifacts, Langfuse traces, and
human-visible behavior notes.

## Human-Visible Behavior Note

A **human-visible behavior note** is what the user or reviewer saw in game, such
as "pretends to chop", "walks away in one direction", or "keeps retrying empty
space". Treat it as first-class evidence, especially when artifacts are thin.

## Langfuse Trace

A **Langfuse trace** is provider-observability evidence. It can explain model
inputs/outputs and timing, but it does not prove Minecraft progress unless it
matches world, inventory, position, container, or transcript evidence.

## Agent Guide

An **agent guide** is repo guidance for coding agents, such as `AGENTS.md`,
`GEMINI.md`, or an agent skill reference. Agent guides must point back to this
terminology when discussing action skills or agent skills.

## Current Runtime Direction

The active path is:

- headless Mineflayer runtime;
- no Voyager-style eval loop;
- bounded action loop;
- live transcript first.
