---
sidebar_position: 5
---

# Async Reviewer Sidecars

This document defines per-NPC reviewer sidecars.

## Core Decision

Every NPC should have its own asynchronous reviewer sidecar.

A global reviewer can summarize cross-actor patterns, but it must not own actor
memory, actor action-skill lifecycle, or actor-specific repair proposals.

## Why Per-NPC

This project is a social simulation seed. Actor identity and actor memory matter.

If one global critic owns repair decisions, the system loses the distinction
between:

- `npc_a` failed because its local action skill is weak;
- `npc_b` failed because its role pressure selected the wrong task;
- all actors are failing because the shared seed primitive is wrong.

Per-NPC reviewers keep repair ownership local while still allowing a later global
summary to detect shared patterns.

## Reviewer Input

The reviewer for actor A should read only immutable evidence:

- actor A transcript slices;
- actor A canonical transcript parts;
- actor A evidence files;
- actor A provider input snapshots;
- actor A Langfuse trace references;
- actor A active/candidate/retired action skill records;
- actor A memory summaries when explicitly persisted.

The reviewer should not read mutable runtime objects directly.

## Reviewer Output

The reviewer writes under:

```text
data/actors/<actor_id>/reviews/
data/actors/<actor_id>/action-skills/candidates/
```

Allowed outputs:

- failure explanation;
- fake-progress diagnosis;
- pressure/task hint;
- candidate action skill proposal;
- recipe revision suggestion;
- retirement or supersession recommendation;
- evidence links that justify the recommendation.

Forbidden outputs:

- runtime success/failure verdict;
- direct mutation of active action skill records;
- direct promotion of a candidate recipe;
- generated code import;
- another actor's lifecycle record.

## Async Contract

Reviewer jobs must not block the actor turn.

Hot path:

```text
actor turn -> write evidence -> release turn
```

Reviewer sidecar:

```text
read immutable evidence -> write review note/proposal -> wait for validation
```

The next actor turn may optionally read already-validated active action skill
records, but it must not wait for a reviewer job to finish.

## Current Implementation

The current code has the deterministic sidecar boundary in place:

- failed phase-one runtime verification writes actor evidence;
- the hot path enqueues `actor-review-job/v1` files under
  `data/actors/<actor_id>/reviews/queue/`;
- queued jobs contain only actor-scoped artifact refs plus an active action
  skill snapshot;
- `bun run review:actors [actor_id...]` runs the deterministic reviewer over
  queued jobs and writes `actor-review/v1` outputs under
  `data/actors/<actor_id>/reviews/`;
- deterministic fake-progress and verification-failure reviews also write draft
  candidate action skill proposals under
  `data/actors/<actor_id>/action-skills/candidates/`;
- `REVIEW_ACTORS_PROVIDER=openai-codex bun run review:actors [actor_id...]`
  can use the bounded LLM reviewer adapter for findings/proposal hints;
- reviewer output always declares `active_mutation: "forbidden"`.

This proves the sidecar contract without adding network calls or blocking actor
turns. LLM-backed reviewer reasoning is opt-in and still cannot mutate active
records.

## Cross-Actor Summarizer

A global summarizer may read per-actor reviews and identify patterns:

- several actors drift away after failed log targeting;
- several actors propose the same weak repair;
- a shared primitive is producing consistent verifier failures.

It may recommend a shared seed fix, but it cannot mutate actor workspaces or
promote a shared fix without explicit validation.

## LLM Reviewer Use

An LLM can implement reviewer reasoning later, but the first implementation
should use deterministic or stubbed reviewer outputs to prove:

- actor-scoped paths;
- immutable input references;
- output schema;
- guardrails against active mutation;
- deterministic mode without network calls.

## Acceptance Checks

- each actor has an independent review output path;
- reviewer input references are immutable artifact paths or ids;
- reviewer outputs are actor-scoped;
- reviewer code cannot call runtime success APIs;
- reviewer code cannot write active action skill records directly;
- global summaries read per-actor reviews only;
- deterministic test paths perform zero network calls.
