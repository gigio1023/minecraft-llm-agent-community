# Research Documentation Hierarchy

Status: active documentation hierarchy for research planning and archive
classification.

Search token: `RESEARCH_DOCUMENTATION_HIERARCHY`.

Recorded: 2026-06-29 (`Asia/Seoul`).

## Purpose

This file makes the research-document stack explicit so older WAM-era plans do
not keep acting like current instructions.

The rule is simple:

```text
governance/spec boundaries -> current research spine -> planning protocols ->
runtime support docs -> reference/archive
```

## Tier 0 - Governance And Long-Term Boundaries

These documents define authority, runtime safety, and durable project identity.
They should be edited only when the user explicitly asks for direction/spec
alignment.

- `SPEC.md`
- `AGENTS.md`
- `CLAUDE.md`
- `project-docs/specification/*`
- `project-docs/orientation/terminology.md`

Tier 0 should no longer name advisory WAM as the active headline. It may preserve
that work as historical context or the F-loop branch.

## Tier 1 - Current Research Spine

Read these before planning implementation, experiments, benchmarks, or research
claims.

Active:

- `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`
  (V4 central plan; capability benchmarks, goal continuity, interdependent
  sandbox, phenomenon discovery, controlled follow-up; added 2026-07-11)
- `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`
  (active contracts, vertical slices, dependencies, acceptance gates, and
  immediate next work; added 2026-07-11)
- `project-docs/research/current-spine/research-value-harness.md`
- `project-docs/research/current-spine/transition-row-v1-contract.md`
- `project-docs/research/current-spine/seed-reset-record-v1-contract.md`
- `project-docs/research/current-spine/transition-row-label-codebook.md`
- `project-docs/research/current-spine/no-regret-core-scenario-catalog.md` (scenario reference)
- `project-docs/research/current-spine/society-observable-preflight.md` (pattern-observation reference; V4 central plan governs)
- `project-docs/research/benchmarks/project-level-benchmark-plan.md`
  (benchmark reference promoted as the starting point for the Stage 1 manifest;
  V4 governs its active subset)

Superseded on 2026-07-11, preserved as audit trail:

- `project-docs/research/current-spine/central-plan-lived-vs-told-social-history.md`
  (V3 central plan; retired because prediction and legibility were too narrow)
- `project-docs/research/current-spine/lived-vs-told-implementation-plan.md`
  (unexecuted V3 Session A/B work order)

Superseded on 2026-07-10, preserved as audit trail:

- `project-docs/research/current-spine/central-plan-embodied-co-actor-legibility.md`
  (V2 central plan; killed on verified defects — see its status header)
- `project-docs/research/current-spine/embodied-co-actor-legibility-implementation-plan.md`
- `project-docs/research/current-spine/legibility-cycle-2-live-substrate-work-plan.md`

Superseded on 2026-07-05, preserved as audit trail:

- `project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md`
- `project-docs/research/current-spine/no-regret-core-research-protocol.md`
- `project-docs/research/current-spine/goldilocks-preflight-protocol.md`
- `project-docs/research/current-spine/no-regret-core-implementation-campaign.md`
- `project-docs/research/current-spine/prior-work-proximity-current-spine-2026-06-29.md`
  (proximity refreshed inside the V2 plan, section 11)
- `project-docs/research/current-spine/research-decision-current-spine-2026-06-29.md`

Tier 1 owns the current sequence:

```text
individual Minecraft capability -> autonomous goal continuity ->
interdependent social sandbox -> phenomenon records ->
selected controlled follow-up experiment
```

## Tier 2 - Active Runtime Support

These docs remain active because they describe runtime authority, Actor Turn,
PlanBeads, action skill authoring, provider context, evidence, setup, cost, and
implementation campaign sequencing. They must be interpreted through Tier 1 when
they discuss research direction.

Examples:

- `project-docs/runtime/actor-turn/actor-turn-tool-calling-and-full-context-codegen.md`
- `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-architecture.md`
- `project-docs/runtime/planbeads/actor-persistent-state-and-planbeads.md`
- `project-docs/runtime/overview/runtime-loop-and-verification.md`
- `project-docs/runtime/evidence-and-verification/transcript-and-runtime-artifacts.md`
- `project-docs/operations/setup/provider-free-tier-reset-windows.md`
- `project-docs/research/current-spine/no-regret-core-implementation-campaign.md`
- `project-docs/research/current-spine/no-regret-core-current-status-2026-06-29.md`

Tier 2 status and audit notes may become stale. They are useful for deciding
what to inspect next, but they do not override Tier 1 research gates or Tier 0
runtime authority.

## Tier 3 - Reference And Case Libraries

These documents contain useful mechanisms, scenarios, metrics, and warnings, but
they are not active headline or implementation order.

- `project-docs/research/benchmarks/material-claims-and-social-economy-benchmark-plan.md`
  - reference status: case library for possession, access, claims, obligations,
    refusal, repair, public affordances, and weak commons;
  - V4 may select cases for interdependent scenarios, but the library is not an
    implementation order by itself.
- `project-docs/research/benchmarks/grounded-social-trajectory-benchmark-spec.md`
  - reference status: provider-free fixture and report sanity check;
  - not evidence of open-world social behavior.
- historical or unused sections of
  `project-docs/research/benchmarks/project-level-benchmark-plan.md`
  - reference status: V4 promotes only the dataset-free capability manifest,
    target predicates, milestones, budgets, and normalized report mechanics;
  - stale prediction-headline or provider-comparison framing does not override
    V4.
- `project-docs/research/reference-synthesis/research-direction-reference-synthesis.md`
  - reference status: prior-work synthesis and literature map;
  - not the current thesis.
- `project-docs/research/reference-synthesis/project-sid-harness-absorption-plan.md`
  - reference status: Project Sid case mining and cautionary material;
  - not a society-scale target.

When a Tier 3 doc says "active", interpret that as stale unless the line has
been updated after 2026-06-29 and agrees with Tier 1.

## Tier 4 - References And Archive

Historical reports, handoff prompts, stress tests, raw search results, dated run
records, literature notes, and superseded plans are preserved, but they are
split by purpose:

```text
project-docs/references/
project-docs/archive/
```

These directories preserve why earlier plans changed and what prior work taught.
They are not active implementation guidance unless a Tier 1 current-spine doc
explicitly promotes a section. Older docs may mention Cursor-era
`2026-06-27`/`2026-06-29` archive paths that are not present in this checkout;
do not treat those missing paths as active routing targets.

## Soft-Archived WAM-Era Material

Some files remain in place for link stability but are soft-archived by status:

- advisory WAM as the headline;
- `social-material-transition/v1` as the no-regret data unit;
- `predicted_delta` before an independent predictor exists;
- three-ledger implementation before the Goldilocks gate;
- borrowed-tool benchmark phase order as an active build sequence;
- civilization-scale or Project Sid-style society framing.

Soft-archive means:

- preserve the file;
- mark it historical/reference;
- keep it searchable;
- do not let it drive current implementation;
- physically move it only after a link/routing audit.

## Required Artifact For New Research Direction Changes

Any future proposal that changes the central plan must include:

- `research-claim/v1`;
- `prior-work-proximity/v1`, when current literature matters;
- `proposal-soundness-review/v1`;
- `experiment-sketch/v1`;
- `research-decision/v1` with `what_not_to_do_next`.

Without those artifacts, the proposal is brainstorming, not a direction change.
