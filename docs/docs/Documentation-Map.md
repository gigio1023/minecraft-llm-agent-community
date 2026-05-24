---
sidebar_position: 3
---

# Documentation Map

Search token: `DOCUMENTATION_MAP`.

Status: active documentation routing and cleanup policy.

This page consolidates the repo documentation into stable categories. Use it
when a document feels stale, AI-generated, duplicated, or unclear in authority.

## Authority Order

When documents disagree, use this order:

1. `SPEC.md`
2. `AGENTS.md`
3. `docs/docs/Specification/*`
4. `docs/docs/Agent-Search-Index.md`
5. active architecture docs
6. current handoff and audit docs
7. setup docs
8. supporting evaluation or propagation docs
9. research, archived plans, and historical notes

Do not fix a conflict by silently rewriting the spec. If the conflict changes
long-term direction, get explicit user approval first.

## Active Spec Gateway

These documents define product identity, long-term constraints, and governance:

- `SPEC.md`
- `AGENTS.md`
- `docs/docs/Specification/Soul-Grounded-Social-Simulation.md`
- `docs/docs/Specification/Runtime-Evidence-And-Action-Skills.md`
- `docs/docs/Specification/Engineering-Governance-And-Testing.md`
- `docs/docs/Specification/Reference-Adaptation-Guide.md`

Treat edits here as spec edits.

## Active Orientation

These documents route readers and define vocabulary:

- `docs/docs/intro.md`
- `docs/docs/Documentation-Map.md`
- `docs/docs/Agent-Search-Index.md`
- `docs/docs/Terminology.md`

If a new major document is added, update the search index and this map in the
same change.

## Active Architecture

These documents describe the current intended architecture:

- `docs/docs/Architecture/SPEC.md`
- `docs/docs/Architecture/Minimal-Probe.md`
- `docs/docs/Architecture/Runtime-Loop-And-Verification.md`
- `docs/docs/Architecture/Transcript-And-Runtime-Artifacts.md`
- `docs/docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
- `docs/docs/Architecture/Async-Reviewer-Sidecars.md`
- `docs/docs/Architecture/Implementation-Workstreams.md`
- `docs/docs/Architecture/Action-Skill-Verification.md`
- `docs/docs/Architecture/Bounded-Action-Skill-Creation.md`
- `docs/docs/Architecture/Soul-Life-Goal-Runtime-Architecture.md`
- `docs/docs/Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`
- `docs/docs/Architecture/Real-Server-Simulation-Test-Plan.md`
- `docs/docs/Architecture/LLM-Context-And-Actor-Workspace.md`
- `docs/docs/Architecture/Social-Actor-Profiles-And-Relationships.md`

Architecture docs should describe durable contracts. Dated command output and
volatile evidence belong in handoff or audit docs instead.

## Current State And Audits

These documents are allowed to contain dated implementation state:

- `docs/docs/Architecture/Current-Handoff-And-Next-Work.md`
- `docs/docs/Architecture/Current-Architecture-And-Implementation-Audit.md`
- `docs/docs/Architecture/Future-Works.md`
- dated run reports under `docs/docs/Research/`

When a live matrix, provider result, or runtime report changes, update these
documents before changing spec docs.

## Supporting Evaluation And Propagation Tracks

These documents are useful but subordinate to the Soul/LifeGoal social runtime:

- `docs/docs/Architecture/Autonomous-Objective-Evaluation.md`
- `docs/docs/Architecture/Direct-Generated-Action-Skills.md`
- `docs/docs/Architecture/Single-Actor-Long-Term-Diamond-Handoff.md`
- `docs/docs/Architecture/composer-2.5-Single-Actor-Long-Term-Diamond-Plan.md`
- `docs/docs/Architecture/Social-Simulation-Next-Goal-Handoff.md`

They must clearly state their status. They must not make generic autonomy,
diamond acquisition, or benchmark progress look like the top-level product goal.

## Setup And Operations

These documents are operational:

- `docs/docs/Setup/Headless-Server.md`
- `docs/docs/Setup/Provider-Setup.md`
- `docs/docs/Setup/OpenAI-Tier3-Free-Usage.md`

Update them when commands, auth boundaries, provider defaults, or server
preflight behavior changes.

## Knowledge

These documents capture Minecraft mechanics for runtime/verifier use:

- `docs/docs/Knowledge/Minecraft-Encyclopedia-Research-Brief.md`
- `docs/docs/Knowledge/Minecraft-Encyclopedia/*`

Knowledge docs should distinguish vanilla mechanics from repo-specific action
skill contracts.

## Research And Historical Material

These paths are not active build instructions unless another active doc
explicitly promotes a section:

- `docs/docs/Research/*`
- `docs/docs/Plans/*`
- `docs/research-archive/*`
- `docs/docs/Archived/*`

Research docs should preserve context and references. Do not delete them merely
because direction changed. Instead, add a status note or point readers to the
active replacement.

## Cleanup Rules

- Prefer adding a status banner over deleting historical context.
- Prefer one canonical definition doc over several drifting definitions.
- When two docs repeat the same active rule, keep the rule in the higher
  authority doc and replace the lower copy with a pointer.
- If a doc describes an older direction, mark it supporting, historical, or
  deprecated near the top.
- Never leave an old implementation plan looking like the active next step.
- Do not use absolute local paths in committed docs.
- After changing docs structure, run the Docusaurus build.

## 2026-05-24 Consolidation Decisions

- `SPEC.md` is now a gateway spec, not a giant all-in-one design document.
- Detailed spec is split under `docs/docs/Specification/`.
- Long-objective and diamond docs are supporting evaluation harnesses only.
- Direct generated action skills are a supporting propagation path, not goal
  authority.
- The active product framing is Soul-grounded social simulation with Minecraft
  as pressure and evidence substrate.
- The current action-skill evidence baseline is 14/14 live matrix, not the older
  12/12 baseline.
- Future work discovered from long-horizon live runs is tracked in
  `docs/docs/Architecture/Future-Works.md` and must not be treated as a spec
  change unless explicitly promoted through the spec governance process.
