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

- `project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md`
- `project-docs/research/current-spine/research-value-harness.md`
- `project-docs/research/current-spine/prior-work-proximity-current-spine-2026-06-29.md`
- `project-docs/research/current-spine/no-regret-core-research-protocol.md`
- `project-docs/research/current-spine/transition-row-v1-contract.md`
- `project-docs/research/current-spine/seed-reset-record-v1-contract.md`
- `project-docs/research/current-spine/transition-row-label-codebook.md`
- `project-docs/research/current-spine/no-regret-core-scenario-catalog.md`
- `project-docs/research/current-spine/goldilocks-preflight-protocol.md`
- `project-docs/research/current-spine/society-observable-preflight.md`
- `project-docs/research/current-spine/research-decision-current-spine-2026-06-29.md`

Tier 1 owns the current sequence:

```text
no-regret core -> prediction and/or society-observable branch triage -> larger
confirming experiment or branch deferral
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
  - not active phase order before Goldilocks.
- `project-docs/research/benchmarks/grounded-social-trajectory-benchmark-spec.md`
  - reference status: provider-free fixture and report sanity check;
  - not evidence of open-world social behavior.
- `project-docs/research/benchmarks/project-level-benchmark-plan.md`
  - reference status: calibration task families and audit shape;
  - not the current benchmark program.
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
