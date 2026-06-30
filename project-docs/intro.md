---
sidebar_position: 1
---

# Overview

**minecraft-llm-agent-community** is a headless Mineflayer runtime for advisory
social-material WAM experiments, where Minecraft provides embodied actions and
observable consequences.

The project is intentionally small. It tests whether actors can act from
ActorSoul, LifeGoal, memory, relationship context, and world state while
leaving transition rows that compare predicted consequences with observed
results.

## What It Does

- starts or connects to a local Minecraft server;
- runs Mineflayer actors through a bounded TypeScript loop;
- lets Actor Turn choose one visible Action Card or
  `author_mineflayer_action` at a time;
- exposes Action Cards projected from the current action surface;
- exposes query-neutral world-state diagnostics with scan limits, not gameplay
  strategy categories;
- rejects malformed physical runtime action parameters before hidden executor
  defaults can look like progress;
- derives `runtime_retry_constraints` after exact repeated target/args blockers
  and blocks another identical attempt before Mineflayer execution;
- checks progress from Minecraft state, not model text;
- records predicted-vs-observed physical/material/social deltas when a WAM is
  present;
- writes transcripts, provider inputs, evidence, and review artifacts.

## Core Model

Each actor has a workspace under `data/actors/<actor_id>/`.

That workspace owns the actor's active action skills, candidate repairs, memory,
PlanBeadGraph state, evidence, provider inputs, reviews, and relationships.
Runtime code reads from that workspace before it allows a primitive to execute.

The runtime hot path stays narrow:

```text
observe -> gate -> execute -> verify -> record
```

The research path adds an advisory prediction before execution:

```text
state_before + candidate_action -> predicted_delta -> observed_delta
```

Reviewer and repair work runs after the turn from saved artifacts.

```mermaid
flowchart TD
  Workspace["actor workspace"]
  Context["bounded provider context"]
  WAM["advisory WAM"]
  Cards["Action Cards"]
  Proposal["Actor Turn tool selection"]
  Gate["active action skill gate"]
  Action["Mineflayer action skill or primitive"]
  Evidence["runtime evidence"]
  Contract["runtime action parameters contract"]
  Retry["runtime_retry_constraints"]
  Judgment["CycleJudgment and memory"]
  Row["transition row"]
  Review["async reviewer sidecars"]

  Workspace --> Context
  Context --> Cards
  Context --> WAM
  Cards --> Proposal
  Proposal --> Contract
  Contract --> Gate
  Retry --> Gate
  Gate --> Action
  Action --> Evidence
  WAM --> Row
  Evidence --> Row
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
The WAM layer adds a different separation: prediction quality is not the same
as acting outcome.

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
  WAM["future work: advisory delta prediction"]
  Future["future work: partial-progress reporting and richer diagnostics"]

  Observation --> Context
  Event --> Context
  Context --> Surface
  Surface --> Action
  Context --> WAM
  Action --> Evidence
  Evidence --> Verifier
  WAM --> Future
  Verifier --> Future
```

## What It Is Not

This is not a loose generated-code gameplay loop, generic Minecraft benchmark,
race-to-diamond project, house-building architecture, or persona-first NPC demo.

The current proof is simpler: complete concrete Minecraft tasks, reject fake
progress, make failures easy to inspect, and prepare transition rows.

This is not a revival of unverifiable Voyager-style generated-code execution.
Direct generated TypeScript is allowed when it is tied to an objective,
helper-call artifacts, and current-run evidence.

The repo should not treat a model-written JavaScript file, a progress-looking
animation, or an optimistic provider explanation as success. Runtime checks are
mandatory hygiene, not the research contribution. The research contribution is
the advisory prediction of social-material consequences and its measurement.

## Read Next

- [Soul-Grounded Social Simulation](Specification/Soul-Grounded-Social-Simulation.md)
- [Advisory Social-Material World Action Model](Specification/Advisory-Social-Material-WAM.md)
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
- [Provider Free-Tier Reset Windows](Setup/Provider-Free-Tier-Reset-Windows.md)
- [Architecture Spec](Architecture/SPEC.md)
- [Agent Search Index](Agent-Search-Index.md)
- [Terminology](Terminology.md)
