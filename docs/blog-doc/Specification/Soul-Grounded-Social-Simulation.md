---
sidebar_position: 1
---

# Soul-Grounded Social Simulation

This is the product-identity spec.

The project is not "an LLM in Minecraft." It is a Soul-grounded social
simulation seed that uses Minecraft as a live observation/evidence substrate.
The runtime should preserve raw world facts, evidence refs, memory, and
Mineflayer affordances so the model can decide what matters under ActorSoul and
LifeGoal.

## Core Claim

An actor's behavior must be understandable as the result of:

```text
Soul / ActorSoul
+ LifeGoal
+ observation and evidence
+ WorldEvent context
+ role context
+ relationship context
+ memory
+ shared/private inventory
+ settlement state
+ runtime affordances
```

The actor may still gather, craft, place blocks, move, communicate, inspect,
store, repair, or perform other Minecraft actions. Those actions matter because
they create social consequences and durable evidence. They are not isolated
benchmark objectives.

The runtime should increase actor autonomy by improving context, action
surface, gates, hooks, verification, and artifact memory. It should not encode
one example activity, such as building a house or shelter, as the hidden shape
of every cycle.

## Soul And Actor Identity

When `soul.md` or an ActorSoul artifact exists, treat it as the actor's identity
seed. It should influence:

- what the actor notices;
- what kinds of evidence and context matter;
- how obligations and conflict are interpreted;
- which memories are salient;
- how short-, mid-, and long-term goals are framed;
- how the actor weighs private benefit, shared survival, trust, and role duty.

Soul is not a text costume. It is not a decorative persona prompt. It is a
continuity layer that constrains the actor across cycles.

## Goal Layers

Goal authority should remain layered:

| Layer | Role |
|-------|------|
| ActorSoul | identity seed and long-lived behavioral frame |
| LifeGoal | durable direction for the actor's social life |
| observation | raw runtime evidence and world facts |
| WorldEvent | event/context record; never a LifeGoal replacement |
| PlanBead | checkpointed actor-owned issue-like work item under LifeGoal |
| PlanBeadGraph | dependency graph whose ready front can guide Actor Turn continuity |
| StrategicGoal | legacy-adjacent medium-horizon interpretation; use PlanBeads for new persistent work state |
| CycleGoal | legacy-compatible bounded current-cycle objective |
| Actor Turn | ordinary one-step tool-selection hot path |
| runtime action | validated Action Card or generated-action path selected for execution/trial |
| CycleJudgment | evidence-based interpretation of what happened |

PlanBeads sit under LifeGoal and inform Active Episode / Actor Turn continuity.
They preserve durable work state across cycles and restarts. The PlanBeadGraph's
ready front is context, not executable authority or proof of progress.

The implementation may start with one actor, but the structure must not erase
future social dynamics. A single actor can still have obligations, shared
storage context, role duty, remembered conflict, and settlement commitments.

## What Counts As Progress

Progress requires both runtime evidence and social interpretation.

Examples:

- Placing a crafting table is gameplay progress.
- Placing a crafting table because the settlement lacks a shared station is
  social-simulation progress.
- Moving an item into shared storage is gameplay progress.
- Moving an item into shared storage against a remembered obligation or shared
  scarcity is social-simulation progress.
- Placing blocks is gameplay progress.
- Placing blocks while updating memory about a shared safety concern is
  social-simulation progress.

These examples are not a priority order. Shelter is one possible activity among
many, not the architecture. A cycle about storage, request fulfillment,
scarcity, repair, movement, or conflict should not be forced through a building
plan.

The runtime evidence proves what happened. CycleJudgment explains why it matters
under Soul/LifeGoal.

## What Does Not Count

Do not count these as social-simulation success:

- persona-flavored text without world action;
- a model claim that it helped someone without evidence;
- generic long-horizon Minecraft progress that ignores Soul/LifeGoal;
- optimizing a tech tree while relationships, obligations, and memory are
  invisible;
- a successful unit test that never exercises the live runtime path being
  claimed.

## Social Context Vocabulary

The spec expects these context sources to become first-class model-visible inputs
over time:

- role duty;
- shared storage shortage;
- private inventory need;
- station availability;
- shelter/safety state;
- remembered blocker;
- pending obligation;
- trust or friction;
- request or handoff;
- relationship repair;
- scarcity;
- conflict risk;
- settlement improvement.

These are not permission grants. They shape intent only. Runtime gates and
active action skills still decide what can execute.

No context source should become a universal cycle phase. The actor should see
current observations, memory, relationship context, and the current action
surface, then choose within Soul/LifeGoal continuity.

## First Useful Social Slice

The first useful slice is not a full society.

It is one actor that can:

1. load ActorSoul and LifeGoal;
2. observe world and settlement context;
3. choose a bounded CycleGoal;
4. execute or truthfully block a real action;
5. write CycleJudgment from evidence;
6. persist memory;
7. use that memory or prior judgment in a later cycle.

## References

- [Generative Agents](https://arxiv.org/abs/2304.03442) supports memory,
  planning, and reflection as architecture pieces for social behavior, but this
  repo must ground them in runtime artifacts.
- [PsyMem](https://huggingface.co/papers/2505.12814) is relevant because it
  treats role-playing reliability as a memory/control problem, not only persona
  text.
- [PersonaGym](https://huggingface.co/papers/2407.18416) is relevant because
  larger models do not automatically solve persona adherence.
- [Belief-Behavior Consistency](https://huggingface.co/papers/2507.02197) is a
  warning: stated beliefs and actual simulated behavior can diverge.
- [Persona-Environment Behavioral Alignment](https://huggingface.co/papers/2509.16457)
  is relevant because behavior should be modeled as person plus environment.
