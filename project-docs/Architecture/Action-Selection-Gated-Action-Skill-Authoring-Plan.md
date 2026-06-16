---
sidebar_position: 43
---

# Action-Selection-Gated Action Skill Authoring

Search token: `ACTION_SELECTION_GATED_ACTION_SKILL_AUTHORING`.

Status: active mechanics spec for generated action-skill candidates after Actor
Turn selects `author_mineflayer_action`.

Recorded: 2026-06-01. Updated: 2026-06-07.

## Rule

New Minecraft action skill creation during social-cycle runtime starts only from
Actor Turn tool selection.

Actor Turn has two ordinary choices:

- call a visible Action Card function with schema-bound `parameters`; or
- call `author_mineflayer_action` when no visible Action Card can express the
  needed bounded Mineflayer behavior.

No background reviewer, PlanBead operation, async sidecar, archive importer, or
offline maintenance script may originate a new NPC action skill candidate during
runtime. Those systems may review, patch, reject, retire, supersede, re-trial, or
promote an existing Actor Turn candidate with evidence.

## Outer Tool Boundary

The `author_mineflayer_action` outer tool call is a selection and rationale
boundary. It must include:

- `situation_assessment`;
- `why_codegen_is_needed`;
- `desired_minecraft_behavior`;
- `existing_tools_considered`;
- `expected_outcome`;
- `success_evidence`;
- `failure_handling`.

It must not include generated TypeScript source, `input_schema`, verifier,
helper allowlist, timeout, promotion policy, hidden runtime fields, or a
model-selected context summary such as `context_to_preserve`.

## Full-Context Codegen Boundary

After the outer tool call selects `author_mineflayer_action`, the runtime invokes
the internal generated-action provider with:

- the full original `ActorTurnInput`;
- the raw outer function call;
- parsed outer tool arguments;
- the full Mineflayer code-generation agent skill markdown;
- current runtime retry constraints and action-surface evidence already present
  in Actor Turn input.

The internal provider must produce a generated candidate with:

- strict input schema;
- current parameters;
- generated TypeScript source;
- helper API version;
- helper allowlist;
- timeout;
- verifier;
- known failure modes;
- promotion policy.

The generated source is not trusted because it exists. It must pass source guard,
parameter validation, helper allowlist checks, timeout handling, bounded trial,
verifier evaluation, post-observation recording, and actor-workspace persistence.

## Actor Workspace Artifacts

Runtime authoring writes evidence under the actor workspace:

- candidate proposal with generated source metadata;
- helper events and trial evidence;
- verifier result;
- post-observation or explicit failure artifact;
- optional active action-skill record after promotion succeeds.

Archived generated TypeScript under `build/generated-skills` is not actor-owned
runtime authority. If still useful, it may be archived into draft proposal
records for manual review, but runtime selection cannot execute it until it
becomes a validated actor workspace action skill.

## Anti-Patterns

Do not reintroduce:

- compressed planner action objects between Actor Turn and codegen;
- `args` aliases beside active `parameters`;
- prose parsing to fill missing parameters;
- provider-facing candidate lists that preselect Minecraft strategy;
- background creation of action skills outside Actor Turn;
- generated source execution from archive/debug directories;
- compatibility shims inside active schemas.

## Acceptance

The slice is acceptable when:

- Actor Turn provider tools expose only visible Action Cards plus
  `author_mineflayer_action`;
- generated action authoring receives the full Actor Turn context, not a lossy
  summary;
- candidate contracts reject undeclared parameter reads and unsafe source;
- trial evidence records helper events, verifier output, and post-observation;
- promoted records live under actor workspace action-skill state;
- focused tests and runtime reports show no hidden ActionIntent/planner adapter
  in the ordinary path.
