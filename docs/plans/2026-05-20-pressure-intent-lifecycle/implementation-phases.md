# Pressure, Intent, And Lifecycle Implementation Phases

Status: branch-local working design for `feature/runtime-contract-refactor`
Date: 2026-05-20

## Goal

Split the next implementation into three slices that preserve current runtime
contracts while shifting the center of control from rigid curriculum steps to
pressure-driven intent selection.

## Phase 1. Pressure And Intent Scaffold

### Scope

- add actor-local lifecycle mode
- add runtime pressure engine
- add current intent record
- change provider input from direct next-task assumption to pressure/intention
  context
- keep existing bounded tools and seed skills

### Expected Output

- the runtime can compute multiple competing pressures each turn
- the LLM can choose one current intent from structured context
- bootstrap progression can be deprioritized when stronger local pressures exist
- death or gear loss can reactivate recovery pressures

### Acceptance Signals

- transcript shows computed pressures and selected intent
- at least one probe can choose a non-bootstrap intent while still staying within
  bounded skills
- the system can re-enter recovery after an injected loss state

### Out Of Scope

- full multi-actor scheduler
- new generated skill execution path
- large memory extraction worker

## Phase 2. Intent-To-Skill And Role Society Integration

### Scope

- compile intent into bounded skill candidates
- add role-aware intent filtering and weighting
- route bulletin, mailbox, obligations, and shared settlement shortages into
  pressure generation
- add social intents such as request, handoff, defer, or unblock teammate

### Expected Output

- actors can choose between material, social, and recovery intents
- role differences influence which intents and skills are realistic
- social coordination happens because pressures and obligations changed, not only
  because dialogue was allowed

### Acceptance Signals

- at least three cooperative roles can select distinct intents from the same
  shared world state
- a blocked crafter can cause gatherer or quartermaster intents to shift
- bulletin and mailbox events materially affect later intent selection

### Out Of Scope

- hostile embodied bot loop
- long-run compaction policy

## Phase 3. Memory, Reinjection, And Transcript Closure

### Scope

- make memory updates explicitly pressure-shaping
- record lifecycle transitions, pressures, intents, and interruptions in the
  canonical transcript
- define reinjection rules for bootstrap and recovery after death, scarcity, or
  settlement failure
- prepare checkpoint summaries around lifecycle state rather than flat task lists

### Expected Output

- memory can change future pressure rankings
- lifecycle transitions are visible in transcript and checkpoint summaries
- long runs can resume with pressure/intention context instead of only replaying
  raw actions

### Acceptance Signals

- transcript can explain what pressure or memory caused an intent switch
- a resumed run can rebuild current intent candidates from checkpoint summary plus
  recent tail
- bootstrap progression is no longer the only stable source of behavior

### Out Of Scope

- full offline memory worker
- generalized generated skill synthesis

## Recommended Order Inside The Branch

1. implement Phase 1 first
2. use the resulting transcript to validate that intent choice is legible
3. only then expand into Phase 2 role society behavior
4. finish with Phase 3 transcript and memory closure work
