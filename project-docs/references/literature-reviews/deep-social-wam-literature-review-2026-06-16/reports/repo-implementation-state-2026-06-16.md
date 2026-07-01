# Repo implementation state, read from code 2026-06-16 (snapshot)

What this is: a dated snapshot of the probe/ runtime's actual state, read directly from code on
2026-06-16, so that the directions note (reports/research-directions-for-the-repo.md) is traceable to
the starting point it reasons from. This is NOT a re-derivation of the repo's own canonical
CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md; it records only the facts the directions note relies on,
with verified paths. All listed paths were confirmed to exist on 2026-06-16. ASCII punctuation only.

## Layout (verified)

- Runtime: probe/ (TypeScript, Bun). package.json defines the probe: script surface.
- Canonical specs: SPEC.md, AGENTS.md, CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md.
- Architecture notes used here: project-docs/research/benchmarks/grounded-social-trajectory-benchmark-spec.md,
  project-docs/research/benchmarks/material-claims-and-social-economy-benchmark-plan.md.
- Run artifacts: data/actors/social-runs/<run_id>/<actor_id>/ (confirmed; example run_id
  social-cycle-1381e729-ea13-416a-b5e2-278fd4355184 is present on disk).

## Verifier

- File: probe/src/skills/generated/verifierEvaluation.ts (confirmed).
- Deterministic evaluation of a completed Mineflayer action result plus world/inventory snapshots.
- Verifier kinds: helper_event_progress, helper_result_status, inventory_count, world_scan,
  container_snapshot.
- Emits status passed or failed with a reason and matched helper events.
- Layer coverage TODAY: Physical (block place/mine, movement) and Material-Economic (inventory deltas,
  container snapshots) are covered. Social is limited to "say completed". Institutional is absent.
- This is the asset the directions note calls "doubly special" (cheap exact evaluator AND fresh
  external signal). It auto-labels (state, action, next-state) at near-$0.

## Actor Turn, author_mineflayer_action, gated skills

- Actor Turn: the one-step decision hot path. The provider (OpenAI or Gemini) receives ActorTurnInput
  (current_state + source_evidence_bundle + visible Action Cards) and selects exactly one tool call.
  Orchestration in probe/src/runtime/socialCycleRunner.ts and probe/src/runtime/goals/actorEpisode/.
- author_mineflayer_action: the Actor-Turn tool that requests new generated Mineflayer code (rationale
  and desired behavior, not source). Contract in probe/src/runtime/goals/actorEpisode/actionCards.ts.
  The internal codegen provider receives the full original Actor Turn context. Generated code is
  trial-run, verifier-evaluated, then promoted. This is Voyager-style skill-as-code.
- Gated skills: probe/src/runtime/activeActionSkillGate.ts (confirmed). The actor may only use action
  skills marked active in its workspace; a candidate is promoted to active only after trial + verifier
  pass. Autonomy is bounded by the actor's own verified skill library, not by hidden domain strategy.

## Advisory WAM (the predictor) does not exist as a model

- There is NO trained model and NO next-state prediction today. The "advisory WAM" is prompt-based:
  ActorSoul + LifeGoal + current_state + source_evidence_bundle feed a one-step tool selection.
- So the runtime is currently an ACTOR/policy, not a PREDICTOR. Building the predictor p(o'|o,l) as a
  separate artifact is the OBJECT the directions note recommends (phase 1).

## Evidence trace (this is the dataset)

Per cycle, persisted under data/actors/social-runs/<run_id>/<actor_id>/:
- provider input/output snapshots, resolved-action, mineflayer-result, verifier-result,
  cycle-judgment, plus action-skill records, memory, plan-beads, relationships, visual-evidence
  cycle-end snapshots.
- No large replay dataset is committed; runs are live and archived to data/ or tmp/.

## PlanBeads

- Wired (graph structure, ready front computed) but not substantively used in cycles. Intended as
  actor-owned durable work state (open concerns, blockers, obligations, followups), never executable
  authority.

## Benchmark and eval surface (verified probe: scripts)

- probe:social-cycle (live multi-cycle run), probe:social-cycle-review, probe:social-cycle-benchmark-metrics,
  probe:social-cycle-benchmark-score, probe:social-cycle-export-llm-io, probe:social-trajectory,
  probe:skill, probe:skills, probe:v0, probe:v1, plus gemini smokes and objective runs.
- Benchmark question (Grounded-Social-Trajectory-Benchmark-Spec.md): can LLM-controlled actors sustain
  evidence-grounded social behavior in natural seeds, measured by durable obligations, material claims,
  public-affordance use, memory continuity, recovery from blockers, and observable common-world change,
  not only task completion.

## Latest live evidence (2026-06-04)

- 60-cycle fresh-world run, OpenAI gpt-5.4-mini. Result: PASSED_RUNTIME_BUT_BEHAVIOR_LOOP_WEAK.
- Runtime executed correctly (114 requests, ~2.85M tokens) but the actor stayed fixed on shared-storage
  verification for all 60 cycles, never selected author_mineflayer_action, and never used PlanBeads.
- This is a behavior/substrate problem (the actor loops), not a WAM problem, and it is phase-0 work in
  the directions note.

## Maturity (what runs vs scaffold vs spec-only)

| Component | Status |
|---|---|
| Single-actor social cycle (observe, turn, gate, execute, verify, record) | working |
| Action primitives, provider tool-calling, Mineflayer codegen + promotion | working |
| Verifier (Physical + Material) and full per-cycle evidence persistence | working |
| PlanBeads | wired, not substantively used |
| Advisory WAM predictor | does not exist (prompt-based only) |
| Multi-actor village simulation | not ready (single actor only) |
| Social verification beyond "say completed", and Institutional layer | spec-only |

## What this means for the directions

The substrate runs and records honestly, and the verifier already owns the expensive half of any
self-improvement loop at near-$0. The gaps that gate the research: the predictor does not exist, the
actor loops, clean scenario reset is missing, and the social-material layer needs multi-actor that is
not built. Order of work follows from that (directions note section 6): substrate fix, then the
single-actor Physical/Material predictor, then the loop, then climb to Social only with multi-actor.

## Provenance

Read from probe/ source and project-docs/ on 2026-06-16; key paths and the probe: script list were
re-verified before recording. For the canonical, maintained implementation review see the repo's
CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md (this snapshot defers to it on any disagreement).
