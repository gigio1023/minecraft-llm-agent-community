---
sidebar_position: 4
---

# Actor Workspace And Action Skill Memory

This document defines the source-of-truth model for per-NPC artifacts and action
skill lifecycle state.

## Terminology

An **action skill** is a Minecraft/Mineflayer runtime behavior that the game
runtime can validate, execute, verify, and record.

An **agent skill** is a Codex/Claude-style `.agents/skills/*/SKILL.md`
capability. Agent skills help coding agents work on this repo. They are not
Minecraft runtime behaviors.

For the full terminology contract, see `../Terminology.md`.

## Actor Workspace Purpose

Actor workspace is the per-NPC filesystem home for runtime-owned actor artifacts:

- identity;
- memory;
- evidence;
- provider input snapshots;
- review notes;
- action skill lifecycle records.

It should become the source of truth for what an actor can currently do and what
that actor is trying to improve.

## Target Layout

Each actor workspace should converge on this shape:

```text
data/actors/
  index.json
  <actor_id>/
    actor.json
    memory/
    evidence/
    reviews/
    provider-inputs/
    action-skills/
      index.json
      active/
      candidates/
      retired/
      rejected/
```

Initialization means "restore this baseline shape." It does not mean delete
history. Candidate action skills, retired action skills, evidence, reviews,
provider input snapshots, and memory files are review assets and should survive
ordinary startup initialization.

## Source Of Truth Rule

Actor workspace is the only source of truth for actor-owned action skill state.

The current seed ownership records are source-specific inputs. They should be
materialized into actor workspace records before runtime selection reads active
skills. They should not remain a second active ownership database.

The old exploratory generated action skill output path,
`build/generated-skills`, is not actor-owned memory. It may remain as archived
debug output while the project transitions, but candidate action skill proposals
must be written under:

```text
data/actors/<actor_id>/action-skills/candidates/
```

No runtime code should promote, execute, or review an actor-owned generated
candidate from `build/generated-skills`.

## Current State

Current code initializes:

- `actor.json`;
- `action-skills/index.json`;
- `action-skills/active`;
- `action-skills/candidates`;
- `action-skills/retired`;
- `action-skills/rejected`;
- `memory`;
- `evidence`;
- `reviews`;
- `provider-inputs`.

Current code also:

- materializes seed ownership records into persisted active action skill
  records;
- reads active action skill records from actor workspace;
- gates the phase-one `runAgentLoop` with actor-owned active record primitives;
- stores generated/candidate proposals under actor workspace candidates by
  default;
- keeps exploratory generated TypeScript execution behind explicit legacy
  opt-in.

Still missing:

- live recipe trial, promotion, supersession, and retirement execution modules;
- the async per-NPC reviewer queue/runner;
- the same active action-skill gate on any legacy or mutual gameplay path still
  outside `runAgentLoop`.

## Action Skill Record

Each actor-owned action skill record should include:

```ts
type ActorActionSkillRecord = {
  skill_id: string;
  owner_actor_id: string;
  source_kind: "seed" | "derived" | "manual" | "learned";
  status: "draft" | "candidate" | "active" | "superseded" | "retired" | "rejected";
  created_at: string;
  updated_at: string;
  required_primitives: string[];
  preconditions: string[];
  success_verifier: string;
  known_failure_modes: string[];
  evidence_refs: string[];
  review_refs: string[];
  supersession?: {
    superseded_by_skill_id: string;
    reason: string;
    evidence_refs: string[];
  };
  legacy_source_ref?: string;
  notes?: string;
};
```

Seed records may omit fields that are not yet available, but candidate and
promoted records should become increasingly explicit. Existing
`SeedActionSkillOwnershipRecord` values should be converted into this persisted
record shape by an adapter. Internal TypeScript types may use idiomatic
camelCase, but persisted workspace JSON should use one canonical schema so
reviewers and later tools do not need to understand multiple ownership formats.

## Action Skill Recipe

The immediate implementation should treat new action skills as bounded recipes,
not executable generated code.

```ts
type ActionSkillRecipe = {
  recipe_id: string;
  skill_id: string;
  owner_actor_id: string;
  max_duration_ms: number;
  steps: Array<{
    primitive: string;
    args: Record<string, unknown>;
    guard?: string;
    timeout_ms: number;
    expected_evidence: string[];
  }>;
  verifier: {
    kind: "inventory_delta" | "block_delta" | "position_delta" | "container_delta";
    target: string;
    minimum_delta?: number;
  };
};
```

Recipes must not include arbitrary code, imports, filesystem access, network
access, or unbounded loops.

## Validation Rules

A recipe is invalid if:

- it references an unknown primitive;
- it depends on a primitive that is planned but not implemented;
- the actor role cannot use one of the required primitives;
- any step lacks a timeout;
- the verifier is missing;
- the verifier accepts provider text or optimistic tool status as success;
- preconditions cannot be observed;
- it duplicates an active action skill without a supersession note.

## Lifecycle

Action skill lifecycle:

```text
runtime evidence
-> candidate proposal
-> bounded recipe
-> validation
-> live trial
-> active | superseded | retired | rejected
```

Promotion must be explicit. A reviewer can recommend promotion, but cannot
promote directly.

## Generated TypeScript Bundles

Generated TypeScript action skill bundles are not an immediate hot-loop behavior.

If introduced later, generated code must be treated like a proposed patch:

- written outside the live run as an actor workspace candidate artifact;
- reviewed;
- tested;
- promoted intentionally;
- never auto-imported because a provider produced it.

During the transition, anything still emitted to `build/generated-skills` is a
legacy artifact. It can be inspected by humans or migration tools, but it is not
available to runtime selection until it has been converted into a validated
actor workspace candidate recipe.

## Acceptance Checks

- startup initialization creates `reviews/` and `provider-inputs/` without
  deleting existing files;
- active seed action skills can be materialized and read from actor workspace;
- phase-one runtime action selection blocks primitives that are not backed by
  actor-owned active records;
- legacy generated action skill output is not treated as actor-owned active or
  candidate state;
- candidate recipes are validated before trial;
- invalid primitives, missing verifiers, role-incompatible primitives, and
  success-by-text are rejected;
- retired and rejected variants remain inspectable.
