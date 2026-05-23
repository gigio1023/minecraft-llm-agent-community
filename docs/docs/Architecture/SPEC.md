---
sidebar_position: 1
---

# Architecture Specification

This page is the public architecture overview for the active rebuild.

The canonical rebuild spec lives in the repo root at:

- `SPEC.md`

Use that file as the source of truth for:

- current product direction;
- current rebuild scope;
- non-negotiable runtime rules;
- immediate implementation priority;
- split architecture doc routing.

## Current Architecture Summary

The active architecture is defined by boundaries more than feature count:

- **Runtime-owned truth**: model proposals are gated, executed, verified, and
  recorded by runtime code.
- **Actor-local ownership**: each NPC owns its action skills, memory, evidence,
  reviews, provider inputs, and relationships under actor workspace.
- **Replayable evidence**: provider packets, turn evidence, verifier deltas, and
  review refs make failures inspectable.
- **Soul/life/cycle goal authority**: for social-agency experiments, durable
  ActorSoul and LifeGoal should steer per-cycle goals before runtime action
  selection.
- **Bounded social pressure**: profiles, goals, obligations, and relationships
  shape intent without granting tools or bypassing action-skill gates.
- **Async repair**: reviewers diagnose from immutable artifacts after the turn;
  runtime guards own mutation and promotion.

## Important Constraints

- do not reintroduce raw gameplay `eval` loops;
- do not optimize for persona richness before competence exists;
- do not optimize for long-run autonomy before short-run boring tasks are reliable;
- do not put critic, reflection, or action-skill generation in the gameplay hot
  path;
- do not let quick probes become permanent monoliths.
- do not treat `build/generated-skills` as an actor-owned action skill source of
  truth.

## Current Slice Boundary

The actor-workspace and social-feedback slices are now implemented enough to be
the active public architecture. The next useful work is not to add a larger
society. It is to validate the runtime against more real Minecraft task
failures, harden provider/reviewer prompts from actual evidence, and migrate any
still-useful legacy generated-code experiments into bounded recipes.

Deep reconnect refactoring is deferred unless it is required to keep hot-path
evidence honest. Reconnect remains a runtime responsibility, but it is not the
driver of the next slice.

## Read Next

1. `../../../../SPEC.md`
2. `Runtime-Loop-And-Verification.md`
3. `Transcript-And-Runtime-Artifacts.md`
4. `Actor-Workspace-And-Action-Skill-Memory.md`
5. `Async-Reviewer-Sidecars.md`
6. `Implementation-Workstreams.md`
7. `Bounded-Action-Skill-Creation.md`
8. `Soul-Life-Goal-Runtime-Architecture.md`
9. `composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`
10. `LLM-Context-And-Actor-Workspace.md`
11. `Social-Actor-Profiles-And-Relationships.md`
12. `../Setup/Headless-Server.md`
13. `../Setup/Provider-Setup.md`

## Historical Note

Older architecture and plan docs in this repository may still be useful as
research context, but they should not override the current root `SPEC.md`.
