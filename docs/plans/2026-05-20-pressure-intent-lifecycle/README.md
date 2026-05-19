# Pressure, Intent, And Lifecycle Design Pack

Status: branch-local working design for `feature/runtime-contract-refactor`
Date: 2026-05-20

This document pack captures a design shift for the current branch.

The repo should not stay centered on a rigid deterministic curriculum that picks
the next gameplay task directly. The updated direction is:

`runtime-owned pressure -> LLM-selected intent -> bounded skill execution`

The early-game progression spine still matters, but it should behave like a
bootstrap and recovery scaffold instead of a permanent script. As the shared
settlement, role obligations, and memory become richer, that spine should fade
into the background. After death, gear loss, scarcity, or settlement collapse,
it should re-enter the foreground.

## Search Tokens

- `PRESSURE_INTENT_LIFECYCLE`
- `PRESSURE_ENGINE`
- `INTENT_SELECTOR`
- `BOOTSTRAP_RECOVERY_SCAFFOLD`
- `LIFECYCLE_REINJECTION`

## Document Map

- `architecture.md`
  Explains the new control model and freedom boundary.
- `implementation-phases.md`
  Splits implementation into three stages for this branch.
- `pressure-data-model.md`
  Defines the branch-local data model for pressure, intent, and lifecycle.

## Why This Exists

The current branch now targets NPCs that feel more self-directed without giving
up runtime control over world truth.

Desired NPC behavior:

- change priorities based on current world state
- help, refuse, wait, or hand off based on social context
- act opportunistically when new resources or risks appear
- accumulate memory that changes future priorities
- fall back to bootstrap/recovery behavior when the world becomes unstable again

Non-goals for this pack:

- raw LLM control over low-level world mutation
- open-ended eval loops
- purely persona-driven social behavior
- a giant monolithic planner that decides the whole settlement centrally

## Core Position

Freedom should move upward in the stack.

- The runtime should continue to own pathing safety, inventory truth,
  craftability, smeltability, timeout, interruption, and transcript truth.
- The LLM should gain more authority over intent selection, obligation triage,
  delegation, opportunistic deviation, and social choice.

## Relationship To `SPEC.md`

`SPEC.md` remains the canonical repo-level direction document.

This folder is intentionally more detailed and more local to the current branch.
The rule is:

- keep `SPEC.md` short enough to stay durable
- put branch-local elaboration here
- update `docs/docs/Agent-Search-Index.md` so later sessions can route here fast
