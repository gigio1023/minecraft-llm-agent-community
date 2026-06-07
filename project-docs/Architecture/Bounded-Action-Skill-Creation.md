---
sidebar_position: 3
---

# Bounded Action Skill Creation

Status note: this page remains the baseline lifecycle and evidence contract for
action skill creation. It is not the active Actor Turn provider contract.
The active outer-selection spec is
`Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`: new generated Mineflayer
candidate creation during social-cycle runtime starts only when Actor Turn
selects `author_mineflayer_action`.

This page defines how this repo should add the future ability to create,
improve, supersede, and retire Minecraft action skills.

For terminology, see `../Terminology.md`: an action skill is a Mineflayer-based
runtime behavior, while an agent skill is a `.agents/skills/*/SKILL.md`
capability for coding agents.

The decision is intentionally not "copy Voyager" or "pick one reference repo".
The useful pattern is evidence-backed action skill evolution. The unsafe pattern
is generated code becoming hidden runtime authority or entering the loop without
an explicit action-selection decision, schema validation, helper-event evidence,
and verifier-backed trial.

## Core Decision

Action skill creation in this repo should mean:

```text
action-selection decision -> schema-bound candidate -> bounded helper/source
validation -> live trial -> actor-owned promotion or rejection
```

It should not mean:

```text
background reviewer writes JavaScript or TypeScript -> runtime imports/evals it
-> bot runs it as an active skill
```

The runtime already has a bounded action loop. New action skills should be
created only when Actor Turn explicitly selects the creation path. Generated
code is allowed as a bounded trial artifact when it is schema-bound,
helper-limited, recorded, and verified. It is not automatically active action
skill memory until lifecycle promotion succeeds.

## Atomic Gameplay Boundaries

Some Minecraft actions lose progress if they are interrupted. Action skills must
model those operations as atomic gameplay boundaries rather than repeatedly
checking partial progress.

Example: breaking a block is not "swing, inspect, swing, inspect." Mineflayer
must keep digging until `bot.dig(...)` resolves or fails. Only after that
boundary should the runtime inspect block state, dropped items, inventory
pickup, or verifier evidence.

Apply this rule whenever an in-game operation has hidden continuous progress:

- block breaking;
- eating or drinking;
- sleeping;
- smelting waits;
- item pickup after a drop appears;
- container transfer while a window is open.

The action skill can still be bounded by a timeout and AbortSignal. The timeout
is an outer runtime safety boundary, not a reason to poll and restart the
in-game operation every few ticks.

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

- task purpose;
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

Generated code is now a direct objective propagation artifact and, under the
action-selection-gated authoring plan, a social-cycle candidate trial artifact.
It can run during a bounded trial, but its result is treated like proposed
behavior until current-run evidence verifies the objective or action skill
postcondition. Background reviewers can improve, review, reject, or promote an
existing candidate, but they must not originate a new action skill candidate
outside the action-selection gate.

## Lifecycle

### 1. Trigger

Create an action skill proposal only from an explicit action-selection decision
or from offline/manual implementation work. In social-cycle runtime, the first
candidate record must originate from Actor Turn selecting
`author_mineflayer_action`.

The decision should be grounded in real evidence:

- a repeated failure in transcript or artifacts;
- a human-visible behavior note, such as "pretends to chop" or "walks away in
  the same direction";
- a successful trace worth turning into a reusable procedure;
- a planned action skill whose missing primitive now exists;
- a role-specific need, such as a gatherer needing a safer local log routine.

### 2. Propose

The proposer consumes artifacts, current seed action skills, primitive
contracts, actor role ownership, and review notes. In the new social-cycle path,
the proposer emits a schema-bound candidate plus generated TypeScript source for
trial; the runtime still treats it as a proposal, not active code.

Required proposal fields:

```ts
type ActionSkillProposalRecord = {
  skill_id: string;
  owner_actor_id: string | "shared";
  source_kind: "seed" | "derived" | "manual" | "learned";
  status: "draft";
  task_purpose: string;
  evidence_refs: string[];
  preconditions: string[];
  required_primitives: string[];
  proposed_recipe_id: string;
  success_verifier: string;
  known_failure_modes: string[];
  created_at: string;
  updated_at: string;
  generated_candidate?: GeneratedActionSkillCandidate;
  generated_parameters?: JsonObject;
  generated_lifecycle_status?: "trial_failed" | "promotable";
  generated_trial?: GeneratedActionSkillTrial;
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

Recipes and generated source must not include imports, filesystem access,
network access, process access, eval, Function, child processes, or unbounded
loops.

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

For the initial generated-authoring implementation, `trial_failed` and
`promotable` are stored as `generated_lifecycle_status` metadata on the draft
proposal. They are not active action skill record statuses yet.

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

The hot loop should execute active action skills through the same bounded action
runner used by ordinary tool proposals. It may generate and trial a new
candidate only through the explicit action-selection-gated authoring path. It
must not import arbitrary generated modules, mutate the active registry, or
create candidate records from background side effects.

## First Implementation Slice

The original first practical slice was deliberately small:

1. Add an `ActionSkillRecipe` schema and validator.
2. Add a candidate proposal store under build or data artifacts.
3. Add one recipe example for a safer local log-collection variant.
4. Add tests that reject unknown primitives, planned primitives, missing
   verifiers, and role-incompatible recipes.
5. Add transcript fields for candidate action skill trial evidence.
6. Promote nothing automatically unless a later plan explicitly enables
   evidence-gated auto-promotion for the run.

This gives the project the ability to learn from runs without pretending it has
open-ended autonomous action skill generation.

The current generated-authoring slice builds on that baseline:

1. `author_mineflayer_action` is the only active Actor Turn path that can
   originate a new generated Mineflayer candidate.
2. Existing Action Card tool `parameters` are executable authority only after
   runtime validation; authoring rationale never supplies missing parameters.
3. The internal codegen provider receives the full original `ActorTurnInput`,
   raw outer function call, parsed authoring args, and Mineflayer codegen agent
   skill markdown.
4. Generated TypeScript runs as `run(ctx, params)` through a helper allowlist.
5. Candidate proposals, generated source refs, helper events, trial evidence,
   verifier status, and generated lifecycle status are persisted in the actor
   workspace.
6. Background reviewers cannot originate a generated candidate without an
   existing action-selection candidate ref.

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
