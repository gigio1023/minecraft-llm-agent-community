---
sidebar_position: 1
---

# Architecture Specification

This page is the public architecture overview for the active rebuild.

The canonical rebuild spec lives in the repo root at:

- `SPEC.md`

Use that file as the source of truth for:

- current product direction;
- long-term spec governance;
- advisory social-material WAM research spine;
- Soul-grounded social simulation identity;
- current rebuild scope;
- non-negotiable runtime rules;
- immediate implementation priority;
- split architecture doc routing.

Detailed long-term spec pages live under `../Specification/`.

## Current Architecture Summary

The active architecture is defined by boundaries more than feature count:

- **Advisory social-material WAM**: the active research object predicts
  physical, material, and social deltas for candidate embodied Minecraft
  actions. Acting outcome and prediction quality are separate axes.
- **Soul-grounded social simulation**: Minecraft is the embodied substrate for
  actors whose goals are derived from ActorSoul, LifeGoal, memory,
  relationships, obligations, and settlement state.
- **Runtime-owned truth**: model proposals are gated, executed, verified, and
  recorded by runtime code.
- **Actor-local ownership**: each NPC owns its action skills, memory, evidence,
  reviews, provider inputs, and relationships under actor workspace.
- **Replayable evidence**: provider packets, turn evidence, verifier deltas, and
  review refs make failures inspectable. This is verification hygiene, not the
  research contribution by itself.
- **Transition rows**: WAM work should emit predicted-vs-observed deltas for
  state/action/next-state analysis.
- **Soul/life/cycle goal authority**: for social-agency experiments, durable
  ActorSoul and LifeGoal should steer per-cycle goals before runtime action
  selection.
- **Bounded social context**: profiles, goals, obligations, and relationships
  inform intent without granting tools or bypassing action-skill gates.
- **Async repair**: reviewers diagnose from immutable artifacts after the turn;
  runtime guards own mutation and promotion.

## Important Constraints

- do not reintroduce raw gameplay `eval` loops;
- do not reduce the project to race-to-diamond, fastest-tech-tree, or generic
  Minecraft LLM benchmarking;
- do not present verified actions, evidence-first reports, or screenshots as
  the research contribution;
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
society. It is to add transition-row support, keep validating the runtime
against real Minecraft task failures, harden provider/reviewer prompts from
actual evidence, and migrate any still-useful archived generated-code
experiments into bounded recipes.

Deep reconnect refactoring is deferred unless it is required to keep hot-path
evidence honest. Reconnect remains a runtime responsibility, but it is not the
driver of the next slice.

## Read Next

1. `../../../SPEC.md`
2. `../Specification/Advisory-Social-Material-WAM.md`
3. `../Specification/Soul-Grounded-Social-Simulation.md`
4. `../Specification/Runtime-Evidence-And-Action-Skills.md`
5. `../Specification/Engineering-Governance-And-Testing.md`
6. `../Specification/Reference-Adaptation-Guide.md`
7. `../Documentation-Map.md`
8. `Runtime-Loop-And-Verification.md`
9. `Transcript-And-Runtime-Artifacts.md`
10. `Actor-Workspace-And-Action-Skill-Memory.md`
11. `Async-Reviewer-Sidecars.md`
12. `Implementation-Workstreams.md`
13. `Bounded-Action-Skill-Creation.md`
14. `Soul-Life-Goal-Runtime-Architecture.md`
15. `composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`
16. `LLM-Context-And-Actor-Workspace.md`
17. `Social-Actor-Profiles-And-Relationships.md`
18. `../Setup/Headless-Server.md`
19. `../Setup/Provider-Setup.md`

## Historical Note

Older architecture and plan docs in this repository may still be useful as
research context, but they should not override the current root `SPEC.md`.
