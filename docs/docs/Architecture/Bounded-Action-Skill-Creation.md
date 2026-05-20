---
sidebar_position: 3
---

# Bounded Action Skill Creation

This page defines how this repo should add the future ability to create,
improve, supersede, and retire Minecraft action skills.

For terminology, see `../Terminology.md`: an action skill is a Mineflayer-based
runtime behavior, while an agent skill is a `.agents/skills/*/SKILL.md`
capability for coding agents.

The decision is intentionally not "copy Voyager" or "pick one reference repo".
The useful pattern is evidence-backed action skill evolution. The unsafe pattern is
runtime code generation that immediately enters the hot loop.

## Core Decision

Action skill creation in this repo should mean:

```text
runtime evidence -> action skill proposal -> bounded recipe -> validation
-> live trial -> actor-owned promotion or rejection
```

It should not mean:

```text
LLM writes JavaScript or TypeScript -> runtime imports/evals it -> bot runs it
```

The runtime already has a bounded action loop. New action skills should first
compose existing trusted primitives and verifiers. Generated code can be
considered later, but only outside the hot loop and only after review, tests, and
explicit promotion.

## Reference Synthesis

| Reference | Useful pattern | Reject for this repo |
|-----------|----------------|----------------------|
| Voyager | Action skill artifacts split into code, description, metadata, and retrieval index | Concatenating learned code into prompts and executing it through `eval` |
| mineflayer-chatgpt | Static action skills, generated action skills, registry, executor, telemetry, precondition-vs-real-failure tracking | Immediate auto-load and auto-run of generated JavaScript via VM-style dynamic execution |
| mindcraft-ce | Command/action metadata, docstring-generated docs, central action lifecycle guard | `!newAction` as a default runtime path and giant global action skill files |
| yearn_for_mines | Spec-first capability changes, bounded macro tools, reflection after verification, centralized memory | Saving exact tool-call traces as durable action skill truth or treating "success" text as completion |

The project-specific insight is that Minecraft action skill creation is mostly a
control-and-verification problem, not a code-generation problem. If the bot
swings near a tree, walks far away, and repeats, the missing action skill is not
"write clever code"; it is a better target-selection, movement, cancellation,
and verification contract.

## Action Skill Artifact Types

### Seed Action Skill

A hand-authored registry entry under `probe/src/gameplay/seedSkills/`.

Seed action skills can be:

- `implemented`: primitives and verification exist;
- `planned`: valid Minecraft capability, but a primitive or verifier is missing.

Only `implemented` seed action skills should enter active provider candidate
lists or actor ownership.

### Candidate Recipe

A structured proposed action skill made of already implemented primitives.

Candidate recipes are data, not executable source. They describe:

- task intent;
- required actor role;
- preconditions;
- primitive steps;
- local guards;
- timeout budget;
- success verifier;
- failure modes;
- evidence references that justify the proposal.

### Actor-Owned Action Skill Record

A promoted action skill record owned by one actor or shared across actors. It
should record lifecycle, provenance, and supersession metadata so the runtime can
later distinguish "this bot learned a better way" from "global seed behavior
changed".

### Generated Code Bundle

A possible future artifact. It is not a Phase 1 hot-loop behavior.

If introduced later, generated code must be treated like a proposed patch: it is
written outside the live run, reviewed, tested, and promoted intentionally. It
must not be auto-imported by the runtime just because a provider produced it.

## Lifecycle

### 1. Trigger

Create an action skill proposal only from real evidence:

- a repeated failure in transcript or artifacts;
- a human-visible behavior note, such as "pretends to chop" or "walks away in
  the same direction";
- a successful trace worth turning into a reusable procedure;
- a planned action skill whose missing primitive now exists;
- a role-specific need, such as a gatherer needing a safer local log routine.

### 2. Propose

The proposer consumes artifacts, current seed action skills, primitive
contracts, actor role ownership, and review notes. It emits a proposal, not code.

Required proposal fields:

```ts
type ActionSkillProposalRecord = {
  skill_id: string;
  owner_actor_id: string | "shared";
  source_kind: "seed" | "derived" | "manual" | "learned";
  status: "draft";
  task_intent: string;
  evidence_refs: string[];
  preconditions: string[];
  required_primitives: string[];
  proposed_recipe_id: string;
  success_verifier: string;
  known_failure_modes: string[];
  created_at: string;
  updated_at: string;
  notes?: string;
};
```

### 3. Compile To Recipe

The recipe should be a small ordered plan over existing primitive contracts.

Example shape:

```ts
type ActionSkillRecipe = {
  recipe_id: string;
  skill_id: string;
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

### 4. Validate

Before any live trial:

- every primitive exists and is implemented;
- the actor role can use every primitive;
- every step has a timeout;
- every precondition can be observed;
- the verifier uses world, inventory, position, or container evidence;
- the recipe cannot mark success from provider text or optimistic tool status;
- the candidate does not duplicate an active action skill without a supersession
  note.

### 5. Test

Add small Detroit-style tests around the contract being introduced.

Useful tests:

- invalid primitive is rejected;
- planned primitive is rejected;
- role-incompatible primitive is rejected;
- verifier cannot be missing;
- success text without state evidence is rejected;
- repeated real failure moves the candidate toward retirement or revision;
- precondition failure does not permanently blacklist a static seed action skill.

### 6. Live Trial

Run the candidate in a bounded live session and save transcript-visible
evidence. A live trial must record:

- selected action skill and actor;
- pre-observation;
- primitive step attempts and results;
- abort/timeout/stall state;
- post-observation;
- verifier decision;
- final lifecycle decision.

### 7. Promote, Supersede, Or Reject

Promote only if live evidence proves real progress.

Lifecycle statuses:

- `draft`: proposal exists but has not passed validation;
- `candidate`: validation passed, live trial pending or running;
- `active`: live evidence proved it;
- `superseded`: replaced by a better action skill;
- `retired`: consistently unhelpful or obsolete;
- `rejected`: invalid, unsafe, or unsupported by evidence.

Supersession should preserve history. Do not delete failed variants just because
they are embarrassing; they are useful anti-repeat evidence.

## Runtime Boundaries

Action skill creation should be split across small modules:

- `gameplay/seedSkills/`: hand-authored seed action skill definitions;
- `skills/ownership.ts`: actor ownership and lifecycle records;
- `skills/recipes/`: recipe schema, validation, and examples;
- `skills/proposals/`: evidence-backed proposal records;
- `runtime/actions/`: primitive execution only;
- `gameplay/verification/`: deterministic success/failure checks;
- `transcript/`: evidence persistence.

The hot loop should only execute active action skills through the same bounded
action runner used by ordinary tool proposals. It should not generate code,
import new modules, or mutate the action skill registry during an action.

## First Implementation Slice

The first practical slice should be deliberately small:

1. Add an `ActionSkillRecipe` schema and validator.
2. Add a candidate proposal store under build or data artifacts.
3. Add one recipe example for a safer local log-collection variant.
4. Add tests that reject unknown primitives, planned primitives, missing
   verifiers, and role-incompatible recipes.
5. Add transcript fields for candidate action skill trial evidence.
6. Promote nothing automatically.

This gives the project the ability to learn from runs without pretending it has
open-ended autonomous action skill generation.

## Review Checklist

When reviewing a proposed new action skill, ask:

- What exact run or trace made this action skill necessary?
- Is it solving a real Minecraft mechanics problem or only changing prompt text?
- Does it compose implemented primitives only?
- Are movement, targeting, cancellation, and pickup separated enough to debug?
- Is success backed by state evidence?
- Does the actor role own or have permission for every primitive?
- What previous action skill does it supersede, if any?
- What failure would retire it?

If the answer is unclear, keep the action skill as `draft` or `planned`.

## Anti-Patterns

- raw `eval`, `Function`, VM-loaded generated JS, or dynamic import as the
  normal gameplay path;
- generated TypeScript bundles in active Phase 1 use;
- treating a provider explanation as a verifier;
- storing exact tool-call traces as timeless truth;
- injecting an unbounded action skill library into every prompt;
- deleting failed action skill history instead of recording supersession or
  rejection;
- adding a new action skill when the real issue is a missing primitive or weak
  verifier.
