---
sidebar_position: 43
---

# Actor Turn Passive PlanBeads Goal Brief

Search token: `PASSIVE_PLANBEADS_ACTOR_TURN_GOAL`.

Status: active goal companion.

Recorded: 2026-06-03 (`Asia/Seoul`).

## Purpose

Use this document as the compact linked target for a Codex `/goal` prompt when
the full campaign instructions are too long for the goal objective field.

This page does not replace the canonical specs. It is a small routing and
decision brief for the current pivot:

- Actor Turn is the hot-path decision maker.
- PlanBeads are passive actor-owned issue-like work state.
- Deliberation mutates PlanBeads only at meaningful branch points.
- Live runtime evidence decides whether low-cost social simulation is working.

## Recommended `/goal` Objective

Codex documents goal text as both the starting prompt and the standard for
completion. If a goal needs multiple instructions, keep the goal short and point
it at a file that carries the detailed context. For this campaign, the goal
should directly link this brief; this brief then routes workers to the active
spec, implementation, handoff, provider, and budget documents.

```text
Finish the Actor Turn + passive PlanBeads campaign for this repo. Use docs/blog-doc/Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md as the routing spec, with AGENTS.md and SPEC.md as authority and docs/blog-doc/Architecture/Current-Handoff-And-Next-Work.md for latest evidence. Keep Actor Turn as the ordinary hot path, PlanBeads passive, and generated Mineflayer action authoring gated through Actor Turn. Verify with focused tests, typecheck, docs build, and budget-guarded 30/60-cycle live evidence. Do not mark complete from green tests alone.
```

## Correct Link Set

A short goal prompt should link this document, then the worker should read these
references as needed:

1. `AGENTS.md` - binding repo-agent rules, current product direction, and
   PlanBeads authority boundaries.
2. `SPEC.md` - canonical rebuild spec.
3. `docs/blog-doc/Documentation-Map.md` - documentation authority order and
   active/supporting/historical document boundaries.
4. `docs/blog-doc/Terminology.md` - canonical terms for Actor Turn, Action
   Cards, Evidence Trace, PlanBeads, agent skills, and action skills.
5. `docs/blog-doc/Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md` -
   campaign gates, social proof scenarios, and acceptance accounting.
6. `docs/blog-doc/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md` -
   target Actor Turn, Active Episode, Evidence Trace, and branch-only
   Deliberation architecture.
7. `docs/blog-doc/Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`
   - current implementation plan and live-run gate status.
8. `docs/blog-doc/Architecture/Actor-Persistent-State-And-PlanBeads.md` -
   durable actor work graph contract.
9. `docs/blog-doc/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
   - generated Mineflayer action authoring authority.
10. `docs/blog-doc/Architecture/Minecraft-Basic-Guide.md` - stable Minecraft
   mechanics guide for provider context.
11. `docs/blog-doc/Architecture/Current-Handoff-And-Next-Work.md` - dated current
   state, live-run evidence, and unresolved risks.
12. `docs/blog-doc/Setup/Provider-Setup.md` - provider auth, usage guard, and
    social-cycle run command reference.
13. `docs/blog-doc/Setup/Provider-Free-Tier-Reset-Windows.md` - OpenAI and
    Gemini free-tier reset windows and Korea-time budget rules.

Do not link broad historical plans as primary goal context unless a specific
question requires them. If these documents conflict, prefer `AGENTS.md`,
`SPEC.md`, and this current goal brief for the current campaign direction.

## Current Decision

PlanBeads are still useful, but only as a passive notebook for durable actor
work state. They should not grow into the planning engine.

Good PlanBeads behavior:

- preserve open work, blockers, obligations, and followups across context
  changes;
- expose bounded compact hints to Actor Turn;
- accept guarded branch-time operations with evidence refs;
- show why work is open, blocked, deferred, or closed.

Bad PlanBeads behavior:

- choosing primitive or action-skill execution;
- supplying missing ActionIntent args;
- acting as a Minecraft strategy planner;
- closing work from provider prose, movement, observe, wait, or memory notes;
- requiring the actor to maintain PlanBeads instead of acting in Minecraft.

## Target Runtime Shape

```text
Actor Turn LLM
-> ActionIntent
-> Mineflayer runtime execution
-> Evidence Trace append
-> branch classifier
-> Deliberation only when branch-worthy
-> guarded PlanBead operation
-> compact PlanBead hints for later turns
```

Ordinary turns should be actionful. The actor can make mistakes, but it should
not get trapped in repeated observe/wait/remember loops when current state and
Action Cards already support a useful action.

## Work Rules

- Inspect `git status` and the current diff before editing.
- Preserve user changes; do not revert unrelated dirty files.
- Use parallel `gpt-5.5 high` subagents for read-heavy lanes when useful:
  Actor Turn hot path, PlanBeads boundary, generated action loop, runtime
  artifact review, and docs/spec alignment.
- Keep write coordination in the main thread.
- Prefer vertical slices over broad infrastructure.
- Keep tests small and contract-focused.

## Done Criteria

The campaign is not complete until current evidence proves all of these:

- Actor Turn is the ordinary low-cost hot path.
- Deliberation is branch-only, not a per-turn planning stage.
- PlanBeads are compact durable context and guarded branch-time mutation, not
  executable authority.
- Generated Mineflayer action authoring originates only from Actor Turn and
  leaves source, schema, params, candidate state, helper events, and evidence in
  actor workspace artifacts.
- Focused tests, typecheck, and docs build pass.
- A low-cost 30-cycle smoke run and, if feasible, a 60-cycle run are reviewed.
- Provider setup and free-tier reset-window docs are checked before long
  provider-backed runs.
- The report shows current-state consumption, actionfulness, no silent errors,
  basic Minecraft mechanics awareness, and at least one plausible
  social-simulation consequence or a clearly classified blocker.

Do not mark the goal complete from green tests alone. Runtime artifacts and
report review must support the product claim.
