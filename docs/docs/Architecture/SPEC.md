---
sidebar_position: 1
---

# Architecture Specification

This page is now a thin architecture overview.

The canonical rebuild spec lives in the repo root at:

- `SPEC.md`

Use that file as the source of truth for:

- current product direction;
- current rebuild scope;
- non-negotiable runtime rules;
- immediate implementation priority;
- split architecture doc routing.

## Current Architecture Summary

The active architecture direction is:

- a small, headless, bounded Minecraft runtime;
- one-bot boring gameplay competence before larger social claims;
- runtime-owned validation, timeout, verification, transcript, artifacts, and
  reconnect/session lifecycle when reconnect is explicitly in scope;
- live transcript and runtime artifacts as the primary evidence;
- checkpoint-ready runtime design;
- actor workspaces for per-NPC memory, evidence, review notes, and action skill
  lifecycle records;
- per-NPC asynchronous reviewer sidecars that read immutable evidence without
  blocking runtime turns;
- room for later per-agent action skill ownership and social simulation growth.

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

The next implementation slice prioritizes actor workspace source of truth,
action skill lifecycle, actor evidence, provider input snapshots, and per-NPC
reviewers.

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
8. `LLM-Context-And-Actor-Workspace.md`
9. `../Setup/Headless-Server.md`
10. `../Setup/Provider-Setup.md`

## Historical Note

Older architecture and plan docs in this repository may still be useful as
research context, but they should not override the current root `SPEC.md`.
