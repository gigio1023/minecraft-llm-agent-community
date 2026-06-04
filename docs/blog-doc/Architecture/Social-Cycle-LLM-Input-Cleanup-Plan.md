---
sidebar_position: 42
---

# Social Cycle LLM Input Cleanup Plan

Search token: `SOCIAL_CYCLE_LLM_INPUT_CLEANUP`.

Status: implemented cleanup slice and migration input. The target hot-path
architecture is now `Actor-Episode-And-Actor-Turn-Architecture.md`.

Recorded: 2026-06-01.

## Capability

Social-cycle providers should receive stage-specific context that helps a
Minecraft actor think freely under ActorSoul/LifeGoal, choose executable
affordances, and preserve durable work state without being buried under stale
history, duplicated packets, or domain-strategy scaffolding.

The goal is not to constrain the LLM into a hard-coded plan. The goal is to give
the LLM clearer tools: truthful observation, compact continuity, executable
affordances, retry constraints, memory, relationship context, PlanBead ready
fronts, and a compact Minecraft Basic Guide for stable game mechanics.

## Harness Insights

This plan borrows workflow structure from local harness projects:

- Ralph: phase tables work when each phase has status, priority, and concrete
  test evidence rather than prose-only intent.
- Ralph specification workshop: plans should state acceptance criteria, edge
  cases, implementation approach, and test strategy before implementation.
- Everything Claude Code product-capability: hidden product constraints should
  become a durable capability contract with non-goals and handoff criteria.
- Everything Claude Code working context: keep current truth concise and move
  old execution notes out of the live decision surface.
- Ouroboros: a spec-first workflow can keep the core workflow stable while
  runtime backends vary; this repo should likewise keep Soul/LifeGoal and
  runtime evidence stable while provider input projection evolves.
- Ouroboros capability matrix: separate workflow-layer invariants from
  runtime/provider-specific execution surfaces.

## Audit Findings

The 20-cycle OpenAI run showed that the provider inputs were structurally valid
but not clean enough for longer runs.

| Finding | Evidence | Risk | Fix |
|---------|----------|------|-----|
| Strategic goals accumulated without a provider-facing window | Cycle 20 `goal_mind` sent 29 active strategic goals, about 35 KB | Old goal text can dominate current observation and PlanBead ready-front state | Send a bounded strategic-goal window and include omitted-count metadata |
| Goal mind received the full action surface | Cycle 20 `goal_mind` included about 18 KB of action-surface details | Goal selection sees action args and deferred capability detail it does not need | Send `action_surface_summary` for goal mind |
| Action planner duplicated action-skill and settlement data | `direct_action_skills` duplicated `action_surface.direct_action_skills`; `settlement_checklist` duplicated `settlement_state.checklist` | More tokens, more places for providers to overfit to compatibility fields | Keep executable `runtime_affordances`, direct action skills, and one settlement-state packet |
| Cycle judgment received the full action surface | Late-cycle judgment inputs spent about 18 KB on action-surface detail | Judgment may reason about capability catalog instead of runtime result and evidence | Send compact `action_surface_summary` only |
| Judgment duplicated settlement checklist | `settlement_checklist` repeated `settlement_state.checklist` | Provider can treat settlement checklist as a second strategy source | Keep checklist inside `settlement_state` |

## Constraints

- ActorSoul and ActorLifeGoal remain visible to every provider stage.
- PlanBeads remain read-only continuity context. They do not add executable
  args, physical proof, or action authority.
- `runtime_affordances` and direct action skills remain the action planner's
  executable body.
- `settlement_state` is observation/evidence context, not a universal plan.
- Provider input cleanup must not weaken runtime gates, verifier requirements,
  retry constraints, provider usage accounting, or actor workspace artifacts.
- The LLM should keep freedom to pivot when current observation, LifeGoal,
  memory, relationship state, or runtime blockers justify it.

## Stage Input Boundaries

### Goal Mind

Purpose: choose the next CycleGoal.

Must receive:

- ActorSoul and ActorLifeGoal;
- current observation and world events;
- previous judgment summary;
- memory packet;
- relationship context;
- PlanBead ready front;
- settlement state;
- runtime retry constraints;
- compact action-surface summary;
- `minecraft_basic_guide` for stable mechanics such as item flows, station
  requirements, blocker recovery, and repeated-observe limits;
- bounded strategic-goal window with omitted-count metadata.

Must not receive:

- full action-surface args catalog;
- unbounded strategic-goal history;
- duplicate settlement checklist.

### Action Planner

Purpose: choose one bounded ActionIntent.

Must receive:

- ActorSoul, ActorLifeGoal, and CycleGoal;
- raw observation;
- executable `runtime_affordances`;
- direct action skills;
- current memory, relationship, PlanBead, retry, and settlement-state context;
- recent action attempts;
- `minecraft_basic_guide`, especially `known_item_flows`,
  `station_requirements`, `blocked_recovery_guides`, and `observe_stop_guides`;
- compact action-surface summary for missing-affordance context.

Must not receive:

- a second full action-surface copy when `runtime_affordances` and direct action
  skills already define executable choices;
- duplicate settlement checklist.

### Cycle Judgment

Purpose: judge the executed action from runtime evidence.

Must receive:

- ActorSoul, ActorLifeGoal, CycleGoal, and ActionIntent;
- runtime result, evidence refs, executed tools, tool statuses, verifier status;
- memory, relationship, PlanBead, and settlement-state context;
- `minecraft_basic_guide` so blocker interpretation can distinguish missing
  prerequisites from useful observation;
- compact action-surface summary only when needed to explain why the action
  mattered or failed.

Must not receive:

- full action-surface catalog;
- duplicate settlement checklist;
- any packet that implies provider prose can prove physical progress.

## Implementation Phases

| Phase | Status | Work | Verification |
|-------|--------|------|--------------|
| 1 | complete | Add stage-specific provider input projection for goal mind, action planner, and cycle judgment | Focused social-cycle runner test asserts schemas, bounded strategic goals, and no duplicate `action_surface` or `settlement_checklist` |
| 2 | complete | Re-run a short deterministic and live social cycle, then compare input byte totals and provider behavior | 2-cycle OpenAI run passed with 77,264 tokens; snapshots used stage schemas, no full `action_surface`, and no duplicate top-level `settlement_checklist` |
| 3 | complete | Add Minecraft Basic Guide to all provider input stages so basic Minecraft mechanics are visible without turning them into strategy | Focused social-cycle runner test asserts `minecraft_basic_guide`, schema `minecraft-basic-guide/v1`, known item flows, blocker recovery guides, and observe-stop guides |
| 4 | pending | Re-run a longer live cycle under budget and inspect whether the LLM uses PlanBeads and memory without overfitting to them | Runtime report, provider inputs, provider outputs, PlanBead ops, and usage ledger |

## Acceptance Criteria

- Goal mind provider inputs cap strategic goals and expose
  `strategic_goal_window`.
- No provider stage sends both `settlement_state.checklist` and top-level
  `settlement_checklist`.
- Action planner does not receive a full `action_surface` when it already
  receives executable `runtime_affordances` and `direct_action_skills`.
- Cycle judgment does not receive the full action-surface catalog.
- Provider prompts name `action_surface_summary` where that is the packet being
  sent.
- All social-cycle provider stages receive `minecraft_basic_guide` with concrete
  known item flows and blocker recovery guidance.
- Existing deterministic social-cycle tests pass.
- TypeScript typecheck passes.
- A live run remains budget-auditable through the provider usage ledger.

## Non-Goals

- This plan does not make PlanBeads a mandatory task list.
- This plan does not encode shelter, base building, crafting, storage, or any
  other Minecraft domain as the core runtime strategy.
- This plan does not remove runtime verification or retry constraints.
- This plan does not claim long-run social simulation is solved.

## Handoff

Continue with phase 2 using a short live run first. If provider inputs look
clean, run the longer budgeted OpenAI cycle and inspect whether the LLM uses the
cleaner packets to act, pivot, remember blockers, and update PlanBeads without
turning PlanBeads into a checklist.
