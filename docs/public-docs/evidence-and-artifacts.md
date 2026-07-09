---
sidebar_position: 4
---

# Evidence And Artifacts

The project treats artifacts as audit hygiene. They are the way to check what a
run did, not the research contribution by themselves. This matters because LLM
text can sound successful even when Minecraft state did not change.

For the active lived-vs-told experiment, artifacts should support independent
`transition-row/v1` records:

```text
state_before + executed_action + observed_delta + evidence_refs
```

Prediction artifacts are separate. They are joined to locked rows by `row_id`
only during offline analysis, so the actor's expected outcome and provider
rationale never become ground truth.

## What Counts As Evidence

Useful evidence includes:

- transcript records;
- Mineflayer action attempts and results;
- inventory, position, block, container, entity, or chat observations;
- verifier output;
- world-state scan summaries with explicit scan limits;
- actor workspace evidence references;
- provider input/output snapshots;
- provider usage records when live models are used;
- response-window records showing when another actor had a chance to respond;
- public-history exports that include only allowlisted runtime evidence;
- offline prediction/scoring artifacts after label lock.

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

## Why This Helps The Experiment

The active experiment needs consequences that a reviewer can inspect. If an
actor promises help, fails to gather resources, lends a tool, refuses a request,
places a public affordance, or repeats an impossible action, later turns should
see artifact-backed consequences instead of relying on a fresh prompt summary.

The research question is not whether artifacts are neat. It is whether public
interaction history adds predictive signal for another actor's observable
social/material response, after simple baselines and leakage checks have had a
fair chance to erase the claim.
