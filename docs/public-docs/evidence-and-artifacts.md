---
sidebar_position: 4
---

# Evidence And Artifacts

The project treats artifacts as audit hygiene. They are the way to check what a
run did, not the research contribution by themselves. This matters because LLM
text can sound successful even when Minecraft state did not change.

For the active WAM direction, artifacts should support transition rows:

```text
state_before + candidate_action + predicted_delta + observed_delta
```

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
- predicted-vs-observed transition rows when a WAM is evaluated.

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
budget, auth, server lifecycle, or runtime checks.

## Why This Helps Social Simulation

Social-material WAM research needs consequences. If an actor promises help,
fails to gather resources, lends a tool, refuses a request, places a public
affordance, or repeats an impossible action, the next cycle should see
artifact-backed consequences instead of relying on a fresh prompt summary. The
model's predicted consequences should be compared with what the runtime
observed.
