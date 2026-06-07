---
sidebar_position: 4
---

# Evidence And Artifacts

The project treats artifacts as the main proof that a run did what it claimed.
This matters because LLM text can sound successful even when Minecraft state did
not change.

## What Counts As Evidence

Useful evidence includes:

- transcript records;
- Mineflayer action attempts and results;
- inventory, position, block, container, entity, or chat observations;
- verifier output;
- world-state scan summaries with explicit scan limits;
- actor workspace evidence references;
- provider input/output snapshots;
- provider usage records when live models are used.

## What Does Not Count Alone

These are context, not proof of Minecraft progress:

- model rationale;
- memory notes;
- repeated `observe` or `wait`;
- animation or partial motion;
- a generated source file that has not passed a bounded trial;
- a summary that lacks a backing artifact.

## Failure Is A Result

Blocked, failed, and environment-blocked runs are useful when they explain the
reason clearly. A good report should say whether the actor was blocked by
missing parameters, unavailable world state, repeated target failure, provider
budget, auth, server lifecycle, or verifier evidence.

## Why This Helps Social Simulation

Social behavior needs consequences. If an actor promises help, fails to gather
resources, places an item in a shared chest, or repeats an impossible action,
the next cycle should see artifact-backed consequences instead of relying on a
fresh prompt summary.
