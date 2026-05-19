# Live NPC Dialogue Design

## Problem

The current mutual NPC probe proves two real Mineflayer bots can exchange a
small deterministic interaction, but it still depends on prewritten provider
steps and fixed dialogue lines. The next slice should let the NPCs talk more
like agents: the runtime should provide rich context, simple memory, and bounded
tools, while a live LLM decides the next utterance or action each turn.

The goal is not an open-ended social simulator. The goal is a small, bounded,
headless runtime where two bots can actually converse in-world, pick their next
move from a constrained tool set, and leave a transcript that shows what context
they saw and what they chose.

## Outcome

Build a new live-provider dialogue path for the mutual probe where:

- each NPC gets per-turn context from the runtime
- each turn produces exactly one validated tool call
- `converse` is a first-class tool for speaking to another NPC or speaking aloud
- short memory and recent transcript history are included in prompt context
- the runtime owns validation, execution, budget, and termination

## Architecture

Use a bounded LLM turn model:

1. The runtime gathers the current context bundle.
2. The runtime sends that bundle to a live LLM provider.
3. The LLM returns one JSON action.
4. The runtime validates and executes that one action.
5. The runtime records the result in memory and transcript.
6. Control passes to the next bounded turn.

This keeps implementation small while still making dialogue agentic. The model
chooses the next valid step, but the runtime owns the world and rejects invalid
or unsafe behavior.

## Tool Surface

Keep the tool set small and explicit:

- `converse`
- `observe_world`
- `move_to`
- `wait`
- `remember`
- `drop_item`

`converse` should allow directed speech to another NPC and optional speech
without a target for aloud self-talk. The runtime validates targets, applies
chat delivery, and records who heard what.

## Context Bundle

Each provider call gets a compact structured bundle:

- Persona: actor name, role, voice/style note, current objective
- World state: position, visible actors, marker/item state, recent action result
- Conversation state: recent utterances, whose turn it is, directed/self-talk
- Memory: recent remembered notes only
- Rules: one tool per turn, use only allowed tools, do not invent observations

## Failure Handling

Do not fall back to fake success dialogue. If the provider fails, returns
invalid JSON, chooses an unsupported tool, or emits invalid arguments, the
transcript records the failure and the run exits with a clear failure result
after a bounded formatting retry.

## Acceptance Criteria

1. Two real bots connect to the headless local world.
2. A live provider selects the next tool for each actor turn.
3. The bots perform at least 4-6 turns of real back-and-forth dialogue before
   later world interaction.
4. At least one later non-dialogue action occurs after the conversation.
5. The transcript records actual utterances, tool choices, observations, and
   memory changes.
6. The run remains bounded by runtime-owned turn and validation rules.
