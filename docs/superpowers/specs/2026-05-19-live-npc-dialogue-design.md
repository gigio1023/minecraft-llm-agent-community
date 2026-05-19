# Live NPC Dialogue Design

## Problem

The current mutual NPC probe proves two real Mineflayer bots can exchange a small deterministic interaction, but it still depends on prewritten provider steps and fixed dialogue lines. The next slice should let the NPCs talk more like agents: the runtime should provide rich context, simple memory, and bounded tools, while a live LLM decides the next utterance or action each turn.

The goal is not an open-ended Voyager-style eval loop. The goal is a small, bounded, headless runtime where two bots can actually converse in-world, pick their next move from a constrained tool set, and leave a transcript that shows what context they saw and what they chose.

## Outcome

Build a new live-provider dialogue path for the mutual probe where:

- each NPC gets per-turn context from the runtime
- each turn produces exactly one validated tool call
- `converse` is a first-class tool for speaking to the other NPC or speaking aloud without a target
- short memory and recent transcript history are included in the prompt context
- the runtime still owns validation, execution, budget, and termination

## Recommended Approach

Use a **bounded LLM turn** model.

Each NPC turn works like this:

1. The runtime gathers the current context bundle.
2. The runtime sends that bundle to a live LLM provider.
3. The LLM returns one JSON action.
4. The runtime validates and executes that one action.
5. The runtime records the result in memory and transcript.
6. Control passes to the next bounded turn.

This keeps implementation small while still making the dialogue feel agentic. It also stays aligned with the repo direction: the model chooses the next valid step, but the runtime owns the world and stops invalid or unsafe behavior.

## Scope

### In scope

- live provider-backed turn selection for mutual NPC dialogue
- a new `converse` tool that supports directed speech and optional self-talk
- prompt context built from persona, world state, memory, recent transcript, and runtime rules
- transcript capture of actual spoken text, tool choices, observations, and memory changes
- bounded retries or bounded failure on malformed provider output
- a watchable live run with delayed start or repeat-friendly startup

### Out of scope

- unbounded autonomous planning loops
- broad long-term memory systems or vector databases
- reviving Voyager-style generated code execution
- hiding provider or validation failures behind fake deterministic dialogue
- large-scale social simulation

## Architecture

### 1. Turn runtime

Keep the existing mutual probe runtime shape, but replace the deterministic provider path with a live provider path for the new dialogue mode.

For each turn, the runtime:

- identifies the active actor
- gathers a fresh observation of the world
- loads that actor's recent memory
- loads a short recent conversation window
- applies role and tool constraints
- calls the live provider
- validates the response schema
- executes one allowed tool
- records the outcome

The turn boundary is the core safety boundary. The LLM never gets raw runtime authority over the loop.

### 2. Provider boundary

Introduce a provider interface that returns a single structured action for one actor turn. The provider should be swappable, but the first implementation targets a live model provider for this repo's gameplay path.

Suggested response shape:

```json
{
  "tool": "converse",
  "args": {
    "target": "npc_b",
    "utterance": "Jun, can you check whether the marker paper is near the shared chest?"
  },
  "why": "I need Jun to confirm the handoff point before moving the marker."
}
```

`why` is optional runtime-facing metadata for debugging and transcript review. It is not required for world execution.

### 3. Tool surface

Keep the tool set small and explicit:

- `converse`
- `observe_world`
- `move_to`
- `wait`
- `remember`
- `drop_item`

`converse` is the important new tool. It should allow:

- directed speech to the other NPC
- optional speech without a target for aloud self-talk

The runtime remains responsible for validating the target, applying chat delivery, and recording who heard what.

## Context Bundle

Each provider call gets a compact structured bundle rather than a long freeform prompt.

### Persona

- actor name
- role
- short voice/style note
- current objective

### World state

- actor position
- target position or visibility if known
- marker/item state if known
- last observation summary
- recent action result

### Conversation state

- recent utterances between the two NPCs
- whose turn it is
- whether the last utterance was directed speech or self-talk

### Memory

- recent remembered notes only
- fixed small limit

### Rules

- one tool per turn
- use only allowed tools
- do not invent observations
- prefer `observe_world` if uncertain
- runtime may reject malformed or impossible actions

## Memory Model

Keep memory intentionally small.

Use only:

- recent transcript window
- recent tool results
- explicit `remember` notes produced during the run

Do not add retrieval systems, embeddings, or external stores in this slice. The purpose is continuity across a short interaction, not durable knowledge management.

## Transcript Design

Extend the transcript so a reviewer can see:

- actor
- selected tool
- tool arguments
- actual utterance text for `converse`
- observation snapshot used for the turn
- execution result
- memory note if one was created
- category verdicts and final run status

The transcript should make it obvious whether the dialogue came from the live provider and how that dialogue related to later movement or item handoff.

## Failure Handling

Do not fall back to fake success dialogue.

If the provider fails, returns invalid JSON, chooses an unsupported tool, or emits invalid arguments:

- the runtime may do a small bounded retry if the failure is purely formatting-related
- otherwise the turn fails explicitly
- the transcript records the failure
- the run exits with a clear failure result

This keeps the proof honest and avoids success-shaped masking.

## Acceptance Criteria

The slice is successful when all of the following are true:

1. Two real bots connect to the headless local world.
2. A live provider selects the next tool for each actor turn.
3. The bots perform at least 4-6 turns of real back-and-forth dialogue before later world interaction.
4. At least one later non-dialogue action occurs after the conversation, such as observation, movement, or dropping the marker paper.
5. The transcript records actual utterances, tool choices, observations, and memory changes.
6. The run remains bounded by runtime-owned turn and validation rules.

## Testing Strategy

Keep tests small and contract-focused.

### Add or update tests for:

- context bundle creation
- provider response schema validation
- `converse` transcript recording
- memory updates from `remember`
- deterministic fake-provider contract coverage for the runtime loop

### Do not rely on tests for:

- full live provider correctness
- broad scripted dialogue coverage

The main proof remains the live run artifact.

## File-Level Design

### Modify

- `probe/src/mutual/provider.ts`
  - introduce a live provider path that returns one bounded action
- `probe/src/mutual/tools/index.ts`
  - add `converse` execution and transcript wiring
- `probe/src/mutual/runtimeState.ts`
  - track recent utterances and simple memory continuity
- `probe/src/mutual/mutualLoop.ts`
  - use live-provider turn selection while preserving bounded execution
- `probe/src/mutual/runMutualProbe.ts`
  - wire the live provider mode into the existing end-to-end probe
- `probe/test/runtimeLogic.test.ts`
  - validate runtime contracts for the new tool and provider output
- `probe/test/transcript.test.ts`
  - verify utterance capture and memory capture
- `README.md`
  - document the live dialogue mode and how to run it

### Add

- `probe/src/mutual/dialogueContext.ts`
  - build the structured provider input bundle
- `probe/src/mutual/tools/converse.ts`
  - execute directed speech or self-talk
- `probe/src/mutual/providerSchema.ts`
  - validate the single-turn provider response shape

## Open Choices Resolved

- Use a live LLM provider in this slice.
- Keep the loop bounded to one tool per turn.
- Treat dialogue as a real tool instead of prewritten script beats.
- Keep memory simple and local to the runtime.
- Prefer honest failure over fake fallback dialogue.

## Implementation Notes

- Preserve the existing deterministic mutual probe path if it is still needed for low-cost contract checks.
- The live dialogue path should be a separate mode or entrypoint rather than silently replacing all existing behavior.
- Delay-start support is useful so a human can join the world before the bots begin talking.
