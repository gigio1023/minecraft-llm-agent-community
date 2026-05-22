---
sidebar_position: 2
---

# Runtime Loop And Verification

This document defines the gameplay hot path. It is intentionally narrower than
the full project spec.

## Product Constraint

This project is not a Voyager-style single-agent marathon. It is a
speed-bounded social simulation seed.

Actors do not need hard realtime, but they must remain observable and responsive
enough that one NPC's critic, reflection, action-skill generation, or repair loop
does not block the shared world.

## Hot Path Contract

Each actor turn should do only this:

```text
observe
-> select pressure/task from current state
-> select active action skill or primitive from actor workspace active records
-> execute with timeout and cancellation
-> verify from world, position, inventory, container, or transcript evidence
-> write transcript and actor evidence
-> release control so the next actor can proceed
```

The hot path must not await:

- LLM critic review;
- long reflection;
- action skill proposal generation;
- recipe revision;
- cross-run summarization;
- Langfuse-heavy trace analysis;
- generated TypeScript generation or reviewer cleanup.

Those jobs belong to asynchronous sidecars that read immutable evidence and
write future-facing artifacts.

Direct generated action skill execution is allowed only when it is the selected
objective action for the current turn and it writes source/helper/evidence
artifacts. It is not allowed to count as success without the same current-run
world, inventory, position, container, or transcript evidence required from
hand-written action skills.

## Runtime Owns Reality

The runtime owns:

- primitive and recipe schema validation;
- active action-skill permission gates;
- timeout and cancellation;
- state verification;
- transcript shape;
- actor evidence artifacts;
- provider input snapshots;
- action skill lifecycle guards;
- reconnect/session lifecycle when explicitly in scope.

The provider owns only:

- next bounded proposal;
- optional short explanation for trace/debug context.

Providers never decide success. Reviewers never decide success. Success is a
runtime verifier decision backed by evidence.

The phase-one `runAgentLoop` already enforces the active action-skill gate:
provider proposals are validated against the actor's active workspace records
before any Mineflayer primitive is executed. A missing active action skill is a
runtime blocker and review signal, not a reason to silently fall back to a
success note.

The mutual dispatcher now follows the same ownership rule when active action
skill records are provided. Live mutual runs initialize/read actor workspaces
before provider turns and pass those records into the dispatcher, so social tools
such as `converse` are gated through the underlying `say` primitive.

Phase-one gameplay can also use an opt-in `openai-codex` provider through
`PROBE_GAMEPLAY_PROVIDER=openai-codex`. The provider receives the same bounded
runtime packet as deterministic mode plus actor workspace context: active action
skills, candidates, recent evidence, recent reviews, and memory. The provider
still only proposes one primitive; runtime gates and verification remain
authoritative.

## Reconnect Scope

Reconnect remains a runtime-owned lifecycle problem, but it is not the main
driver of the next implementation slice.

For now, reconnect work should be limited to preserving truthful evidence:

- do not report success because a socket or bot object exists again;
- do not reuse stale tool closures after a reconnect;
- mark reconnect-caused staleness as a blocker when it prevents verification;
- defer broad checkpoint/resume behavior until actor workspace and evidence
  contracts are stable.

## No Fake Progress

The runtime must reject fake progress.

Examples:

- `collect_logs` is not successful because the bot started swinging;
- `move_to` is not successful because pathing started;
- `craft_item` is not successful because the model said the item was crafted;
- a generated action skill is not successful because it returned a confident
  object;
- reconnect is not successful because a socket reappeared while tool closures
  still point at stale state.

Every success must be supported by concrete observed state change or a verifier
that explicitly explains why no state delta was required.

## Observation Contract

Observation should be small but decisive.

For gameplay tasks, the runtime should prefer:

- actor id and position;
- inventory snapshot;
- nearby relevant blocks with distance;
- target block identity and distance when a target is selected;
- visible actors and distances;
- shared chest snapshot when storage is relevant;
- last tool result;
- bounded actor memory tail.

For failures such as "pretends to chop, walks away, repeats," evidence should
include:

- selected target block name and position;
- pre-action actor position;
- pathing attempt result;
- dig attempt result;
- post-action actor position;
- post-action target block existence;
- inventory delta;
- verifier reason.

## Verification Contract

Verification is task-specific and evidence-backed.

Verification must respect atomic gameplay boundaries. If interrupting an action
would reset in-game progress, the primitive should await that action's natural
completion or failure before collecting evidence. For `collect_logs`, this means
the runtime does not poll block or inventory evidence while `bot.dig(...)` is
still breaking the block.

Valid verifier evidence includes:

- inventory delta;
- block delta;
- position delta or arrival distance;
- container delta;
- observed chat/tool result only when the task is explicitly conversational;
- timeout/cancellation/blocker records.

Invalid verifier evidence:

- provider text alone;
- optimistic tool status alone;
- animation alone;
- pathfinder starting alone;
- generated action skill return object alone.

## Deterministic First

New behavior must first work with deterministic provider paths and small tests.
Provider-backed behavior can be layered on only after the runtime evidence
contract is explicit.

Deterministic mode must perform zero network calls.

## Immediate Validation Checks

- `collect_logs` only passes with real inventory pickup evidence.
- `move_to` only passes with distance or arrival evidence.
- repeated identical failures become visible blockers, not hidden retries.
- transcript ties every tool attempt to pre/post observation.
- fake progress produces a structured verifier failure, not a successful step.
- deterministic mode performs zero network calls.
