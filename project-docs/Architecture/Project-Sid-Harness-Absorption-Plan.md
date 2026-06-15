---
sidebar_position: 46
---

# Project Sid Harness Absorption Plan

Search token: `PROJECT_SID_HARNESS_ABSORPTION`.

Status: active first-pass implementation plan.

Recorded: 2026-06-16 (`Asia/Seoul`).

Primary references:

- `PROJECT_SID_2411_00114_REVIEW`:
  `project-docs/research-archive/Project-Sid-2411-00114-Review-2026-06-15.md`
- `MATERIAL_CLAIMS_SOCIAL_ECONOMY_BENCHMARK`:
  `project-docs/Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`

## Purpose

Project Sid should be absorbed first as harness discipline, not as a
civilization scenario template. The immediate goal is to make the NPC agent
harness harder to fool: every claimed social progression must survive checks
for grounded action, chat/action coherence, cross-actor causality, continuity,
and auditability.

The 1st-pass absorption target is therefore:

```text
Use Project Sid's useful failure framing and evaluation patterns to strengthen
the local Mineflayer NPC harness before adding bigger open-world society runs.
```

This intentionally prioritizes small, repeatable, provider-free or low-cost
checks over dramatic agent counts, religions, constitutions, or civilization
labels.

## What To Absorb First

| Project Sid mechanism | First local adaptation | Harness reason |
| --- | --- | --- |
| Action awareness | Each physical or social event must have an expectation/evidence trail and, when applicable, cite the prior intent/request/promise it is fulfilling. | Prevents reflection text from counting as progress. |
| Chat/action coherence | Requests, promises, refusals, loans, and follow-ups must be consistent with later material events or explicit blockers. | Prevents the "sure, I gave you a pickaxe" failure class. |
| Relationship graph | Relationship updates must cite prior event evidence and should be derived from behavior, not only flavor text. | Makes social state reviewable. |
| Resource allocation | Material movement must include actor, item, count, container/target, and evidence refs. | Turns "social help" into auditable Minecraft consequence. |
| Specialization | Roles are inferred only after repeated evidence-backed behavior. | Avoids predeclared role theater. |
| Collective rules | Norms/rules come later, after small claim/obligation loops work. | Avoids premature constitution/tax simulation. |
| Culture/religion | Treat as controlled diffusion stress tests, not first-phase proof. | Avoids viral surface imitation. |

## First Implementation Slice

Add a provider-free `socialTrajectory` harness audit that runs beside the
existing score. It does not replace the social score; it checks whether the
ledger is strong enough to be trusted by later live runs.

Required audit dimensions:

1. **Event Integrity**
   - event ids are unique;
   - actor ids are known;
   - cycles are valid;
   - evidence refs are non-empty;
   - material events have item/count/container where required.

2. **Chat/Action Coherence**
   - request/promise/refusal-like events target another actor when they claim
     social effect;
   - promises must either lead to a material contribution, a blocker, or an
     explicit later state update;
   - later events must not cite future events.

3. **Action Awareness Trace**
   - material events cite the prior social/intent event they execute when the
     scenario contains such a prior event;
   - craft/use events cite the material source they consume.

4. **Cross-Actor Causality**
   - at least one actor's evidence-backed action must change another actor's
     later options, inventory, crafting, memory, relationship, or obligation
     state.

5. **Continuity State**
   - memory or relationship updates cite prior events;
   - continuity cannot be created from provider-authored summaries alone.

The report should expose these dimensions under a `harness_audit` section so
HTML/JSON reports can distinguish:

- social trajectory score;
- harness trustworthiness;
- provider/cost usage;
- live Minecraft evidence scope.

## Success Criteria For This Pass

- Provider-free grounded social fixture still scores as a valid social
  trajectory and passes the harness audit.
- A negative fixture with only private crafting or ungrounded promises fails
  the harness audit.
- The active benchmark plan and routing index point to this absorption plan.
- No provider call is required.
- No live Minecraft server is required.

## Deferred Work

Do not implement these in the first pass:

- many-agent society runtime;
- specialization inference from live runs;
- tax/constitution mechanics;
- culture/religion diffusion;
- hidden planner fields that preselect Minecraft strategy;
- any provider-backed benchmark without quota preflight.

The next live-harness step after this pass should be a two-actor
`open_world_live_borrowed_tool_v1` run where request, loan/refusal, material
use, return/debt, and relationship/memory continuity are all emitted as runtime
artifacts.
