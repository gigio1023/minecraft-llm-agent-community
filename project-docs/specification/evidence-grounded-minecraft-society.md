---
sidebar_position: 5
---

# Evidence-Grounded Minecraft Society

Search token: `EVIDENCE_GROUNDED_MINECRAFT_SOCIETY`.

Status: active conceptual spec.

Recorded: 2026-06-15 (`Asia/Seoul`).

Direction note, 2026-06-18: this file name is retained for link stability, but
the active research spine is now
[`Advisory Social-Material World Action Model`](advisory-social-material-wam.md).
Evidence and verification are audit hygiene, not the contribution. This document
defines the social-material variables that the WAM should predict and the
runtime should observe.

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
actors with Soul/LifeGoal continuity coordinate, conflict, remember, make
material claims, exchange goods or access, maintain obligations, and alter
public world state in ways that are observable through runtime evidence.
```

This definition has three important consequences:

1. A society is not just many bots in one server.
2. A society is not just believable dialogue.
3. A society is not just task completion by a group.

The social claim requires durable social state and Minecraft observations. In
the current WAM framing, these variables are also prediction targets.

## Why Society Exists In An Open-Ended World

In a nearly unbounded Minecraft world, the possible action space is too large
for a single fixed objective to explain behavior. Society exists because it
compresses this open-ended space into locally meaningful commitments.

Society gives actors:

- continuity, by preserving who did what, who promised what, and what remains
  unresolved;
- coordination, by reducing duplicated work and enabling handoffs;
- material order, by distinguishing personal possession, material claims,
  public affordances, weak commons, and unclaimed world resources;
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
| `settlement` | A place-anchored organization with public affordances, material claims, obligations, and local world improvements. | Shared location, usable station or route, claim/access evidence, and recurring actor use. |
| `village` | A settlement with enough durable infrastructure and social routines to be readable as a local community. | Repeated public-affordance use, safety/material routines, relationship continuity, and multiple episodes. |
| `society` | A persistent social system whose roles, norms, obligations, conflicts, material claims, and memory continue across episodes. | Multi-actor continuity, social-state reproduction, and post-goal continuation under new pressure. |

These are maturity levels, not product milestones. The current runtime may
start with proto-social and organization slices while preserving the north star
of society.

## Material Economy Model

Vanilla Minecraft does not need a separate currency mod to support a useful
economy. The local economy is the evidence-backed management of possession,
access, claims, use, debt, and trust.

This repo should use these categories instead of treating `shared resources` as
the default social center:

| Category | Meaning | Typical evidence |
| --- | --- | --- |
| `personal possession` | Items, tools, armor, food, and carried materials controlled by one actor's body. This is the strongest default ownership signal. | Inventory snapshots, equipment state, pickup/drop records, craft/use evidence. |
| `material claim` | An evidence-backed assertion that an actor, role, or group controls access to an item stack, container, worksite, station, crop, or cache. | Claim ledger entry, container snapshot, sign/marker, chat request, memory record with evidence refs. |
| `public affordance` | A world change that can help other actors act: crafting table, furnace, path, safe marker, bridge, lit area, farm row, worksite, shelter opening. | Block placement/use records, world scans, another actor using the affordance. |
| `weak commons` | Lightly shared or unclaimed surplus that actors may use with low social cost. It is not the core lifecycle objective. | Public chest section, surplus marker, explicit "available" event, repeated unchallenged use. |
| `unclaimed world resource` | Natural wood, stone, animals, crops, terrain, or loot that has not yet become a personal possession or material claim. | World-state scans, harvest evidence, absence of claim records. |
| `obligation or credit` | A social debt, credit, promise, or expected repair caused by help, borrowing, refusal, damage, or contribution. | Request/promise/refusal/handoff events, relationship update, PlanBead or memory evidence. |

Shared storage can still exist, but it is only one implementation of a weak
commons, claimed cache, or public affordance. It should not be treated as the
definition of economy or society.

## Necessary Conditions

A benchmark should not call a run a society unless most of these conditions are
present.

### 1. Actor Multiplicity Or Durable Social State

The strong form requires two or more actors. A single actor can exercise
proto-social machinery only when it acts against durable shared state such as a
settlement obligation, material claim, public affordance, or a remembered
request.

### 2. Actor Identity And Direction

Each actor needs an ActorSoul/LifeGoal frame. The frame should influence what
the actor notices, values, remembers, and treats as socially costly or useful.

Identity is not decorative role-play text. It is continuity pressure.

### 3. Common Physical Substrate

The society needs a common world surface:

- territory or worksite;
- public affordances such as crafting table, furnace, farm, bed, route, marker,
  or path;
- material claims over caches, stations, crops, work areas, or carried goods;
- weak commons when surplus is explicitly available;
- hazards and safety state;
- visible world improvements or damage.

The substrate matters because it lets social-material consequences be observed
and compared with prior predictions. That check is baseline hygiene, not a
standalone contribution.

### 4. Material Claims And Exchange

Society becomes measurable when actors change possession, access, claims, or
obligations in ways that affect another actor. Personal possession is the
default ownership baseline; shared access must be made visible rather than
assumed.

Examples:

- an actor gathers wood, keeps it, and later lends or trades part of it;
- another actor asks to use a claimed crafting table or furnace;
- an actor creates a public crafting table that later changes another actor's
  options;
- an actor hoards scarce food and creates conflict;
- an actor takes from a weak commons without social cost;
- an actor borrows a tool, fails to return it, and creates an obligation;
- an actor conserves resources because of a remembered promise or debt.

### 5. Communication Or Equivalent Social Signaling

Actors need a way to request, promise, refuse, inform, warn, apologize, or
repair. Chat is the obvious channel, but a structured social event can also
serve this role if it is evidence-backed.

### 6. Obligations And Norms

Society needs expectations that persist beyond one action:

- promises;
- role duties;
- access, claim, borrowing, refusal, and repair norms;
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
- who holds or claims a useful item;
- which public affordance exists and who can use it;
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
- scarcity in personal possessions, claimed caches, weak commons, or public
  affordances;
- incompatible role interests;
- new requests after old work remains open.

## Goals Of A Society

The society itself should not be given one fixed optimization target such as
`build a house` or `reach diamond`.

Instead, its top-level purpose is:

```text
to preserve and adapt shared life in the world by maintaining enough trust,
memory, material order, role differentiation, and physical infrastructure for
actors to keep pursuing Soul/LifeGoal-grounded activity together.
```

Local goals can still exist:

- collect food;
- make tools;
- mark a hazard;
- place a public station;
- repair a broken promise;
- settle a claim or borrowing conflict;
- prepare for night;
- improve a cache, route, farm, worksite, or other public affordance;
- explore nearby terrain.

These are context sources, not mandatory phases.

## What Counts As Social Progress

Social progress is an observed increase in the system's capacity to continue
meaningful shared life. For the WAM program, the stronger question is whether
the model predicted that increase before the action happened.

Examples:

- one actor's personal possession enables a later exchange, loan, refusal, or
  repair;
- a material claim becomes clear enough that another actor can request access
  instead of silently taking;
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
- a single successful material exchange with no later memory;
- a hidden central planner assigning all work while actors merely execute;
- a fixed building script that always treats shelter as the social goal;
- benchmark-optimized tech-tree progress that ignores relationships,
  obligations, or shared-world consequences;
- memory text that claims social progress without evidence refs.

## Shared Resource Demotion Rule

Do not use `shared resource` as the default explanation for Minecraft society.
When a run involves shared-looking material, classify it more precisely:

- `personal possession` when the item is carried or controlled by one actor;
- `material claim` when access is socially asserted or contested;
- `public affordance` when a placed world object expands what others can do;
- `weak commons` when surplus is deliberately available with low social cost;
- `unclaimed world resource` when no actor or group has claimed it yet.

This rule keeps economy lightweight while still allowing resource conflicts,
borrowing, credit, debt, and public infrastructure to matter.

## Benchmark Implications

A society benchmark should report:

- time and cycles to first observed social-material consequence;
- number and type of social events;
- physical evidence for each social claim;
- personal possession deltas;
- material claim and access changes;
- public affordance and world-state deltas;
- weak commons use when applicable;
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

For the active research spine, also report:

- predicted physical/material/social delta;
- observed physical/material/social delta;
- prediction accuracy or calibration by layer;
- acting outcome separately from prediction outcome.

## Design Boundary

This spec does not authorize a hidden society manager that chooses goals,
crafting recipes, placements, or resource priorities for the actors.

The runtime should provide:

- evidence;
- action surface;
- social event records;
- memory and relationship state;
- personal possession, material claim, weak commons, public-affordance, and
  obligation state;
- quota and provider usage guards;
- runtime checks and artifacts.

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
