---
sidebar_position: 4
---

# Actor Workspace And Action Skill Memory

This document defines the source-of-truth model for per-actor artifacts and action
skill lifecycle state.

## Terminology

An **action skill** is a Minecraft/Mineflayer runtime behavior that the game
runtime can validate, execute, verify, and record.

An **agent skill** is a Codex/Claude-style `.agents/skills/*/SKILL.md`
capability. Agent skills help coding agents work on this repo. They are not
Minecraft runtime behaviors.

For the full terminology contract, see `../Terminology.md`.

## Actor Workspace Purpose

Actor workspace is the per-actor filesystem home for runtime-owned actor artifacts:

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
      working/
      episodic/
      semantic/
      procedural/
      social/
      beliefs/
      guardrails/
      index/
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
history. Candidate action skills, retired action skills, reviews, relationships,
and memory files are review assets and should survive ordinary startup
initialization. Runtime evidence and provider packets are volatile current-run
artifacts and may be cleared when a run explicitly asks for baseline
initialization.

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
- `memory/working`;
- `memory/episodic`;
- `memory/semantic`;
- `memory/procedural`;
- `memory/social`;
- `memory/beliefs`;
- `memory/guardrails`;
- `memory/index`;
- `evidence`;
- `reviews`;
- `provider-inputs`.

Current code also:

- materializes seed ownership records into persisted active action skill
  records;
- reads active action skill records from actor workspace;
- gates the phase-one `runAgentLoop` with actor-owned active record primitives;
- gates mutual live/deterministic dispatchers when actor-owned active records
  are supplied;
- queues deterministic per-actor review jobs under actor workspace reviews when
  runtime evidence fails verification;
- writes reviewer-proposed draft candidate action skill records under actor
  workspace candidates without mutating active records;
- records bounded candidate recipe trials as actor evidence and promotes passed
  trials through explicit active/superseded action skill records;
- runs candidate recipe primitive steps with bounded per-step timeouts before
  recording trial evidence;
- retires active action skills through explicit retired records with evidence
  refs;
- supports opt-in LLM reviewer reasoning for bounded findings/proposal hints
  without active mutation;
- stores generated/candidate proposals under actor workspace candidates by
  default;
- archives older `build/generated-skills` TypeScript files into actor workspace
  candidate proposals for manual recipe conversion;
- supports actor-owned direct generated TypeScript trials when they are tied to
  objective evidence and helper-call artifacts.
- writes direct generated objective reports into typed actor memory:
  episodic attempt records, procedural candidates for verified success, and
  guardrail candidates for failed execution or failed verification.
- retrieves typed memory into provider context by objective, item, action skill,
  verifier status, and diagnosis while leaving objective success to current-run
  verifiers.

Future extensions:

- production hardening for LLM reviewer prompt/scoring quality;
- migration of any still-needed legacy skill-village generated-code behavior
  into actor-owned direct generated action skill trials or executable bounded
  recipes.

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

Bounded recipes are the stable cleanup format for action skills after direct
generated code or reviewer evidence has shown value.

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

Generated TypeScript action skill bundles are now an immediate objective
propagation format when they are actor-owned and evidence-bound:

- written as actor workspace direct trial artifacts;
- executed with light guards and timeout;
- reviewed through helper-call and pre/post evidence;
- promoted or retained intentionally;
- never counted as success because the generated return value says so.

During the transition, anything still emitted to `build/generated-skills` is a
legacy artifact. It can be inspected by humans or migration tools, but it is not
available to runtime selection until it has been converted into a validated
actor workspace candidate recipe.

## Typed Actor Memory Record

Typed memory exists to make bounded actor behavior reusable without scripting
future choices. The schema is stable at the indexing boundary and flexible
inside `content`.

```ts
type ActorMemoryRecord = {
  schema: "actor-memory-record/v1";
  memory_id: string;
  actor_id: string;
  layer:
    | "working"
    | "episodic"
    | "semantic"
    | "procedural"
    | "social"
    | "belief"
    | "guardrail";
  status: "candidate" | "active" | "superseded" | "stale" | "rejected";
  confidence: "observed" | "reviewed" | "inferred" | "uncertain";
  scope: { kind: "actor_private"; actor_id: string } |
    { kind: "shared"; shared_with_actor_ids: string[] };
  created_at: string;
  updated_at: string;
  summary: string;
  evidence_refs: string[];
  tags: string[];
  index: {
    objective_ids: string[];
    objective_categories: string[];
    item_names: string[];
    block_names: string[];
    tool_names: string[];
    action_skill_ids: string[];
    diagnoses: string[];
    verifier_statuses: string[];
    causal_refs: string[];
  };
  content: Record<string, unknown>;
};
```

Current implementation writes:

- `episodic` records for every direct generated objective report;
- `procedural` candidate records for verified direct trials;
- `guardrail` candidate records for failed direct trials.

Provider context receives a bounded `typed_memory` packet. Retrieval is symbolic
first: objective id, objective category, target items, action-skill ids, layer,
and status. Embedding/vector retrieval can come later, but it must not replace
objective and causality signals.

Memory is never proof. It is a hint substrate for future bounded actor action
and direct-trial planning.

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
- direct generated objective reports create typed memory records;
- provider context includes objective-scoped typed memory without allowing stale
  or rejected memory to satisfy runtime objectives.
