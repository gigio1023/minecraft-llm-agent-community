# Pressure, Intent, And Lifecycle Architecture

Status: branch-local working design for `feature/runtime-contract-refactor`
Date: 2026-05-20

## Problem

The current deterministic progression spine is a good bootstrap, but it is too
rigid to produce the kind of NPC autonomy this branch now wants.

The target NPC should be able to:

- change priorities when the world changes
- negotiate social obligations instead of always following a fixed ladder
- act opportunistically when useful resources or risks appear
- keep long-lived context that changes future behavior
- return to recovery behavior after death, scarcity, or settlement failure

## Core Shift

Move from:

`curriculum decides next task`

to:

`runtime computes pressures -> LLM selects one intent -> runtime compiles intent into bounded skills`

## Control Layers

### 1. Bootstrap And Recovery Scaffold

The old early-game progression spine stays, but only as a lifecycle scaffold.

Foreground cases:

- fresh world bootstrap
- death and gear loss
- no functional shared storage
- severe material scarcity
- broken crafting progression

Background cases:

- the settlement already has storage, stations, and stable resource flow
- the actor has active obligations or stronger local opportunities
- another role already covers the same missing progression slice

### 2. Runtime-Owned Pressure Engine

Each turn, the runtime computes compact pressure entries from:

- world state
- inventory and station truth
- shared settlement state
- bulletin and mailbox state
- recent failures
- lifecycle mode
- private and shared memory

Example pressure kinds:

- bootstrap progression missing
- shortage in shared essentials
- teammate blocked on missing material
- unresolved promise or handoff
- nearby opportunity worth claiming
- nearby danger or hostile pressure
- recovery after death

The pressure engine does not decide the final action. It builds the structured
choice field the LLM reasons over.

### 3. LLM Intent Selector

The LLM should mostly decide:

- which pressure matters most now
- whether to keep or switch the current intent
- whether to help, wait, ask, refuse, or hand off
- whether to take an opportunistic detour
- whether to enter recovery behavior

The selected intent should persist for multiple turns unless:

- success condition is reached
- a stronger interrupting pressure arrives
- the action repeatedly fails
- the intent expires or becomes irrelevant

### 4. Intent-To-Skill Compilation

The runtime should not let the LLM jump from intent straight to arbitrary low-
level world control.

Instead, an intent becomes a bounded candidate set such as:

- `collectLogs`
- `inspectSharedChest`
- `depositSharedItems`
- `withdrawSharedItems`
- `craftPlanksAndSticks`
- `handoffItemAtChest`
- `waitForBusyCrafter`
- `recoverBasicToolsAfterDeath`
- `retreatFromThreat`

This is the main freedom boundary.

- LLM chooses why and what goal to foreground.
- Runtime constrains how world-side execution can happen.

### 5. Memory-Shaped Lifecycle

Memory is not just replay context.

It should actively reshape which pressures win in future turns.

Examples:

- remembered shared chest locations lower search pressure
- remembered teammate specialization raises delegation pressure
- remembered death raises recovery pressure
- remembered hostile sightings raise caution pressure
- remembered failed routes lower reuse priority

## Runtime Versus LLM Boundary

### Runtime must own

- movement and pathing safety
- inventory and chest truth
- craft and smelt prerequisite checks
- action timeout and interruption
- anti-repeat policy
- transcript and result truth
- mailbox timing and delivery phases
- hostile bounds

### LLM should own

- current intent selection
- short-horizon prioritization
- delegation and request choice
- obligation triage
- social phrasing and refusal style
- opportunistic deviation within bounded options

## Lifecycle Modes

Suggested actor-local lifecycle modes:

- `bootstrap`
- `normal`
- `recovery`
- `scarcity`
- `danger`
- `social_obligation`

These modes should not hard-code behavior. They should only bias pressure
weights, valid intents, and interrupt rules.

## Recommended Turn Shape

```text
observe compact world state
-> update lifecycle mode
-> compute pressure set
-> merge role, memory, bulletin, mailbox, and recent failures
-> choose or continue one current intent
-> compile allowed bounded skills for that intent
-> execute one validated skill/tool
-> attach post-action refresh and diffs
-> update pressure-relevant memory
-> continue or interrupt
```

## Key Rule

The agent should feel freer because it can choose what matters, not because it
can mutate the world with less supervision.
