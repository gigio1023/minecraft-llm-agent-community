---
sidebar_position: 5
---

# Evidence-Grounded Minecraft Society

Search token: `EVIDENCE_GROUNDED_MINECRAFT_SOCIETY`.

Status: active conceptual spec.

Recorded: 2026-06-15 (`Asia/Seoul`).

## Purpose

This document defines what this repo means by `society`, `organization`, and
`village` in the Soul-grounded Minecraft social simulation direction.

The definition is intentionally operational. It should make benchmark design
possible without turning the runtime into a hidden domain planner or a fixed
house-building script.

## Core Definition

An evidence-grounded Minecraft society is:

```text
a persistent multi-actor social system in a shared Minecraft world where
actors with Soul/LifeGoal continuity coordinate, conflict, remember, exchange
resources, maintain obligations, and alter shared world state in ways that are
observable through runtime evidence.
```

This definition has three important consequences:

1. A society is not just many bots in one server.
2. A society is not just believable dialogue.
3. A society is not just task completion by a group.

The social claim requires durable social state and Minecraft evidence.

## Why Society Exists In An Open-Ended World

In a nearly unbounded Minecraft world, the possible action space is too large
for a single fixed objective to explain behavior. Society exists because it
compresses this open-ended space into locally meaningful commitments.

Society gives actors:

- continuity, by preserving who did what, who promised what, and what remains
  unresolved;
- coordination, by reducing duplicated work and enabling handoffs;
- resource order, by turning private inventory, shared storage, stations, and
  scarcity into social facts;
- role meaning, by letting an actor's Soul/LifeGoal become useful or contested
  in a shared world;
- conflict handling, by making refusal, hoarding, blame, repair, and trust
  visible rather than invisible failure;
- future optionality, by maintaining infrastructure, safety, memory, and
  relationships that make later action possible.

Society does not need one universal goal. It needs enough structure for actors
to keep acting together after any one local goal is finished.

## Related Terms

| Term | Definition | Minimum evidence |
| --- | --- | --- |
| `proto-social runtime` | One actor or scripted actors interacting with shared social state. Useful for smoke tests, but not a society claim. | Evidence-linked request, shared-state action, and memory or relationship update. |
| `organization` | Two or more actors with differentiated roles or obligations around recurring work. | Role/obligation records, actor-specific actions, and at least one cross-actor dependency. |
| `settlement` | A place-anchored organization with shared resources, stations, and local world improvements. | Shared location, shared container or station, world-state evidence, and recurring actor use. |
| `village` | A settlement with enough durable infrastructure and social routines to be readable as a local community. | Repeated shared use, safety/resource routines, relationship continuity, and multiple episodes. |
| `society` | A persistent social system whose roles, norms, obligations, conflicts, resources, and memory continue across episodes. | Multi-actor continuity, social-state reproduction, and post-goal continuation under new pressure. |

These are maturity levels, not product milestones. The current runtime may
start with proto-social and organization slices while preserving the north star
of society.

## Necessary Conditions

A benchmark should not call a run a society unless most of these conditions are
present.

### 1. Actor Multiplicity Or Durable Social State

The strong form requires two or more actors. A single actor can exercise
proto-social machinery only when it acts against durable shared state such as a
settlement obligation, shared storage, or a remembered request.

### 2. Actor Identity And Direction

Each actor needs an ActorSoul/LifeGoal frame. The frame should influence what
the actor notices, values, remembers, and treats as socially costly or useful.

Identity is not decorative role-play text. It is continuity pressure.

### 3. Shared Physical Substrate

The society needs a common world surface:

- territory or worksite;
- shared storage;
- stations such as crafting table, furnace, farm, bed, or path;
- hazards and safety state;
- visible world improvements or damage.

The substrate matters because it lets social claims be verified.

### 4. Resource Flow

Society becomes measurable when resources move between private and shared
states. Examples:

- actor gathers wood and deposits it into shared storage;
- another actor withdraws it for a role-specific purpose;
- an actor hoards scarce food and creates conflict;
- an actor conserves resources because of a remembered obligation.

### 5. Communication Or Equivalent Social Signaling

Actors need a way to request, promise, refuse, inform, warn, apologize, or
repair. Chat is the obvious channel, but a structured social event can also
serve this role if it is evidence-backed.

### 6. Obligations And Norms

Society needs expectations that persist beyond one action:

- promises;
- role duties;
- shared-resource norms;
- conflict and repair rules;
- trust updates;
- unresolved blockers or debts.

Norms are not hardcoded global strategy. They are remembered social facts and
evaluation criteria grounded in observed history.

### 7. Memory And History

A society must carry history forward. A later cycle should be able to cite and
use prior evidence:

- who contributed;
- who failed or refused;
- which resource is scarce;
- which station exists;
- what promise remains open;
- what relationship changed.

### 8. Post-Goal Continuation

The social system should continue after a local objective succeeds. If a run
ends conceptually after "craft furnace" or "build shelter", it is a task
benchmark, not a society benchmark.

### 9. External Pressure

Society is easier to distinguish from scripted cooperation when actors face
changing pressure:

- night, hunger, damage, weather, or hostile mobs;
- missing materials;
- travel and pathfinding failures;
- scarce shared resources;
- incompatible role interests;
- new requests after old work remains open.

## Goals Of A Society

The society itself should not be given one fixed optimization target such as
`build a house` or `reach diamond`.

Instead, its top-level purpose is:

```text
to preserve and adapt shared life in the world by maintaining enough trust,
memory, resource flow, role differentiation, and physical infrastructure for
actors to keep pursuing Soul/LifeGoal-grounded activity together.
```

Local goals can still exist:

- collect food;
- make tools;
- mark a hazard;
- place a shared station;
- repair a broken promise;
- settle a resource conflict;
- prepare for night;
- expand storage;
- explore nearby terrain.

These are context sources, not mandatory phases.

## What Counts As Social Progress

Social progress is a verified increase in the system's capacity to continue
meaningful shared life.

Examples:

- a shared chest contains resources because one actor fulfilled a request;
- a crafting table is placed where another actor can use it;
- a failed task produces a truthful blocker and a revised obligation;
- an actor remembers that another actor helped and later adjusts trust or
  priority;
- a scarce item creates conflict and the actors repair or escalate it with
  evidence;
- a role duty produces a useful action that another actor consumes.

## What Does Not Count

Do not count these as society:

- many agents independently completing private tasks;
- chat role-play without physical or social-state consequences;
- a single successful resource exchange with no later memory;
- a hidden central planner assigning all work while actors merely execute;
- a fixed building script that always treats shelter as the social goal;
- benchmark-optimized tech-tree progress that ignores relationships,
  obligations, or shared-world consequences;
- memory text that claims social progress without evidence refs.

## Benchmark Implications

A society benchmark should report:

- time and cycles to first verified social consequence;
- number and type of social events;
- physical evidence for each social claim;
- private/shared inventory deltas;
- shared station and world-state deltas;
- open, fulfilled, blocked, and repaired obligations;
- cross-actor dependencies;
- memory and relationship continuity;
- post-goal continuation;
- provider calls, token usage, cost, latency, and action count;
- screenshots only as supporting evidence, never as the sole proof.

The score should separate final outcome from process. The important question is
not only "did the group make X?" but:

```text
Who asked for X, who accepted or refused, what changed in the world, who used
the change, what was remembered, and what did the group do next?
```

## Design Boundary

This spec does not authorize a hidden society manager that chooses goals,
crafting recipes, placements, or resource priorities for the actors.

The runtime should provide:

- evidence;
- action surface;
- social event records;
- memory and relationship state;
- shared/private resource state;
- quota and provider usage guards;
- verification and artifacts.

The Actor Turn provider should still decide within the visible action surface,
under ActorSoul/LifeGoal and current evidence. Runtime validators decide what
is physically executable and what was actually true.

## References

- [SOTOPIA](https://arxiv.org/abs/2310.11667) teaches social-goal evaluation
  through interactive scenarios.
- [AgentSense](https://aclanthology.org/2025.naacl-long.257/) teaches
  scenario diversity, multi-turn interaction, and implicit reasoning.
- [M3-BENCH](https://arxiv.org/html/2601.08462v2) teaches process-aware social
  evaluation across behavior, reasoning, and communication.
- [Generative Agents](https://arxiv.org/abs/2304.03442) teaches the value of
  memory and reflection for believable social continuity.
- [Lifelong SOTOPIA](https://openreview.net/forum?id=XdcuqZRhjQ) teaches that
  social intelligence should be tested across repeated episodes.
- [VillagerBench](https://aclanthology.org/2024.findings-acl.964/) teaches
  that Minecraft collaboration can be evaluated through spatial, causal, and
  temporal dependencies.
- [Concordia](https://github.com/google-deepmind/concordia) teaches that
  social simulation can be framed as grounded agent-based modeling, but this
  repo should use Minecraft runtime evidence rather than a language-only game
  master as the primary truth source.
