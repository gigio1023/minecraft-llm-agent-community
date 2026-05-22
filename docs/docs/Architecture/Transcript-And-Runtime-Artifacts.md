---
sidebar_position: 3
---

# Transcript And Runtime Artifacts

This document defines the evidence contract for explaining runtime behavior
without immediate reruns.

## Evidence Goals

Artifacts should answer:

- what task or pressure the actor was responding to;
- what active action skill or primitive was selected;
- what the provider saw, when a provider was involved;
- what the runtime attempted;
- what changed in the world, inventory, position, or container state;
- why verification passed, failed, timed out, or stalled;
- what a per-NPC reviewer should inspect next.

## Primary Artifacts

Primary artifacts are:

- run transcript files;
- canonical transcript parts;
- actor workspace evidence files;
- provider input snapshots;
- per-NPC review notes;
- Langfuse traces when provider-backed paths are used.

Screenshots or viewer evidence can supplement these, but they are not the source
of truth.

## Transcript Shape

Each runtime step should record:

- actor id;
- turn id;
- selected task or pressure;
- selected active action skill or primitive;
- pre-observation;
- validated args;
- tool/recipe step result;
- post-observation when verification needs it;
- verifier decision;
- timeout, cancellation, or blocker state;
- provider metadata when applicable.

Canonical transcript parts should remain append-oriented so compaction or
projection cannot rewrite evidence.

## Actor Evidence Files

Actor-scoped evidence should be written under:

```text
data/actors/<actor_id>/evidence/
```

Evidence files should be immutable records for one event, turn, trial, or
failure. They should not be edited in place to hide a failed attempt.

Recommended evidence categories:

- `turn`;
- `tool_attempt`;
- `recipe_trial`;
- `verification_failure`;
- `timeout`;
- `fake_progress_rejection`;
- `provider_snapshot`;
- `review_input`.

For fake progress failures, the evidence record should include the selected
target, pre/post actor position, pre/post relevant block or container state, the
tool attempt result, the verifier reason, and the concrete missing delta.

## Provider Input Snapshots

LLM-backed runs must persist the exact provider-facing packet before request
execution.

Recommended path:

```text
data/actors/<actor_id>/provider-inputs/
  turn-0003.json
```

Provider input snapshots should include:

- actor id;
- turn id;
- provider id and model;
- prompt or structured input packet;
- allowed tools or active action skills shown to the provider;
- observation and memory fields shown to the provider;
- recent transcript or social context fields shown to the provider;
- trace/session ids when available.

Do not store raw auth tokens or provider credentials.

## Langfuse Relationship

Langfuse traces are provider-observability evidence. They can explain model
input/output and latency, but they do not prove gameplay success.

Runtime transcript and actor evidence remain authoritative for Minecraft state.

## Reviewer Inputs

Per-NPC reviewers should consume immutable artifacts only:

- transcript slices for the actor;
- canonical transcript parts for the actor;
- actor evidence files;
- actor provider input snapshots;
- Langfuse trace references;
- actor action skill lifecycle records.

Reviewers should never read mutable runtime state directly.

## Acceptance Checks

- A failed log collection attempt can be understood from artifacts alone.
- A "started swinging" or "pathing started" attempt cannot be mistaken for
  success in transcript or evidence files.
- A provider-backed action can be traced back to the exact provider input packet.
- A reviewer can identify the actor, action skill, target, failure mode, and
  next repair proposal without rerunning the world.
- Artifacts never contain provider auth tokens.
