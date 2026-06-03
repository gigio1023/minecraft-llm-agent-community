---
sidebar_position: 1
---

# Overview

**minecraft-llm-agent-community** is a headless Mineflayer runtime for
Soul/LifeGoal-grounded social-cycle experiments, where Minecraft provides live
observation and evidence.

The project is intentionally small. It tests whether an actor can act from
ActorSoul, LifeGoal, memory, relationship context, and world state while
leaving enough runtime evidence to explain the result.

## What It Does

- starts or connects to a local Minecraft server;
- runs Mineflayer actors through a bounded TypeScript loop;
- lets a provider propose one action at a time;
- exposes an `action_surface` packet with direct/deferred runtime affordances;
- exposes query-neutral world-state diagnostics with scan limits, not gameplay
  strategy categories;
- rejects malformed physical `ActionIntent` args before hidden executor defaults
  can look like progress;
- derives `runtime_retry_constraints` after exact repeated target/args blockers
  and blocks another identical attempt before Mineflayer execution;
- verifies progress from Minecraft state, not model text;
- writes transcripts, provider inputs, evidence, and review artifacts.

## Core Model

Each actor has a workspace under `data/actors/<actor_id>/`.

That workspace owns the actor's active action skills, candidate repairs, memory,
PlanBeadGraph state, evidence, provider inputs, reviews, and relationships.
Runtime code reads from that workspace before it allows a primitive to execute.

The hot path stays narrow:

```text
observe -> gate -> execute -> verify -> record
```

Reviewer and repair work runs after the turn from saved artifacts.

```mermaid
flowchart TD
  Workspace["actor workspace"]
  Context["bounded provider context"]
  Surface["action_surface"]
  Proposal["CycleGoal / ActionIntent proposal"]
  Gate["active action skill gate"]
  Action["Mineflayer action skill or primitive"]
  Evidence["runtime evidence"]
  Contract["ActionIntent args contract"]
  Retry["runtime_retry_constraints"]
  Judgment["CycleJudgment and memory"]
  Review["async reviewer sidecars"]

  Workspace --> Context
  Context --> Surface
  Surface --> Proposal
  Proposal --> Contract
  Contract --> Gate
  Retry --> Gate
  Gate --> Action
  Action --> Evidence
  Evidence --> Judgment
  Judgment --> Workspace
  Evidence --> Retry
  Retry --> Context
  Evidence --> Review
```

The next architecture layer is actor-owned goal continuity: `soul.md`, a
persistent LifeGoal, per-cycle CycleGoal selection, and CycleJudgment artifacts.
It separates "Minecraft evidence passed" from "the actor's social-life judgment
actually controlled the current goal."

The latest live testing showed this separation matters. A 100-cycle
long-objective stress test with the OpenAI social-cycle provider reused prior
judgment and memory and produced concrete Minecraft evidence, but did not claim
goal completion without verifier support.
That result belongs in future work, not the long-term spec. It should improve
the autonomy substrate, not turn one domain activity into the architecture.

```mermaid
flowchart LR
  Observation["Observation/evidence"]
  Event["WorldEvent context"]
  Context["Soul/LifeGoal + memory + prior judgment"]
  Surface["action_surface"]
  Action["bounded Minecraft actions"]
  Evidence["runtime evidence"]
  Verifier["verifier"]
  Future["future work: partial-progress reporting and richer diagnostics"]

  Observation --> Context
  Event --> Context
  Context --> Surface
  Surface --> Action
  Action --> Evidence
  Evidence --> Verifier
  Verifier --> Future
```

## What It Is Not

This is not a loose generated-code gameplay loop, generic Minecraft benchmark,
race-to-diamond project, house-building architecture, or persona-first NPC demo.

The current proof is simpler: complete concrete Minecraft tasks, reject fake
progress, and make failures easy to inspect.

This is not a revival of unverifiable Voyager-style generated-code execution.
Direct generated TypeScript is allowed when it is tied to an objective,
helper-call artifacts, and current-run evidence.

The repo should not treat a model-written JavaScript file, a progress-looking
animation, or an optimistic provider explanation as success. Success belongs to
runtime verification backed by world, inventory, position, container, or
transcript evidence.

## Read Next

- [Soul-Grounded Social Simulation](Specification/Soul-Grounded-Social-Simulation.md)
- [Runtime Evidence And Action Skills](Specification/Runtime-Evidence-And-Action-Skills.md)
- [Engineering Governance And Testing](Specification/Engineering-Governance-And-Testing.md)
- [Reference Adaptation Guide](Specification/Reference-Adaptation-Guide.md)
- [Documentation Map](Documentation-Map.md)
- Repo-root review doc: `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
- [Actor Turn Passive PlanBeads Goal Brief](Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md)
- [Low-Cost Social Simulation Campaign Spec](Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md)
- [Actor Episode And Actor Turn Architecture](Architecture/Actor-Episode-And-Actor-Turn-Architecture.md)
- [Actor Episode And Actor Turn Implementation Plan](Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md)
- [Actor Persistent State And PlanBeads](Architecture/Actor-Persistent-State-And-PlanBeads.md)
- [PlanBeads Implementation Campaign](Architecture/PlanBeads-Implementation-Campaign.md)
- [Action Selection Gated Action Skill Authoring Plan](Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md)
- [Minecraft Basic Guide](Architecture/Minecraft-Basic-Guide.md)
- [Runtime Loop And Verification](Architecture/Runtime-Loop-And-Verification.md)
- [Actor Workspace And Action Skill Memory](Architecture/Actor-Workspace-And-Action-Skill-Memory.md)
- [Soul Life Goal Runtime Architecture](Architecture/Soul-Life-Goal-Runtime-Architecture.md)
- [Composer 2.5 Soul Life Goal Runtime Implementation Plan](Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md)
- [Future Works](Architecture/Future-Works.md)
- [Async Reviewer Sidecars](Architecture/Async-Reviewer-Sidecars.md)
- [Social Actor Profiles And Relationships](Architecture/Social-Actor-Profiles-And-Relationships.md)
- [Headless Server Setup](Setup/Headless-Server.md)
- [Provider Setup](Setup/Provider-Setup.md)
- [Architecture Spec](Architecture/SPEC.md)
- [Agent Search Index](Agent-Search-Index.md)
- [Terminology](Terminology.md)
