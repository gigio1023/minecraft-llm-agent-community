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
- `GEMINI.md`
- `project-docs/Specification/*`
- `project-docs/Terminology.md`

Tier 0 should no longer name advisory WAM as the active headline. It may preserve
that work as historical context or the F-loop branch.

## Tier 1 - Current Research Spine

Read these before planning implementation, experiments, benchmarks, or research
claims.

- `project-docs/Architecture/Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
- `project-docs/Architecture/Research-Value-Harness.md`
- `project-docs/Architecture/Prior-Work-Proximity-Current-Spine-2026-06-29.md`
- `project-docs/Architecture/No-Regret-Core-Research-Protocol.md`
- `project-docs/Architecture/Transition-Row-V1-Contract.md`
- `project-docs/Architecture/Seed-Reset-Record-V1-Contract.md`
- `project-docs/Architecture/Transition-Row-Label-Codebook.md`
- `project-docs/Architecture/No-Regret-Core-Scenario-Catalog.md`
- `project-docs/Architecture/Goldilocks-Preflight-Protocol.md`
- `project-docs/Architecture/Society-Observable-Preflight.md`
- `project-docs/Architecture/Research-Decision-Current-Spine-2026-06-29.md`

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

- `project-docs/Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`
- `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`
- `project-docs/Architecture/Actor-Persistent-State-And-PlanBeads.md`
- `project-docs/Architecture/Runtime-Loop-And-Verification.md`
- `project-docs/Architecture/Transcript-And-Runtime-Artifacts.md`
- `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`
- `project-docs/Architecture/No-Regret-Core-Implementation-Campaign.md`
- `project-docs/Architecture/No-Regret-Core-Current-Status-2026-06-29.md`

Tier 2 status and audit notes may become stale. They are useful for deciding
what to inspect next, but they do not override Tier 1 research gates or Tier 0
runtime authority.

## Tier 3 - Reference And Case Libraries

These documents contain useful mechanisms, scenarios, metrics, and warnings, but
they are not active headline or implementation order.

- `project-docs/Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`
  - reference status: case library for possession, access, claims, obligations,
    refusal, repair, public affordances, and weak commons;
  - not active phase order before Goldilocks.
- `project-docs/Architecture/Grounded-Social-Trajectory-Benchmark-Spec.md`
  - reference status: provider-free fixture and report sanity check;
  - not evidence of open-world social behavior.
- `project-docs/Architecture/Project-Level-Benchmark-Plan.md`
  - reference status: calibration task families and audit shape;
  - not the current benchmark program.
- `project-docs/Architecture/Research-Direction-Reference-Synthesis.md`
  - reference status: prior-work synthesis and literature map;
  - not the current thesis.
- `project-docs/Architecture/Project-Sid-Harness-Absorption-Plan.md`
  - reference status: Project Sid case mining and cautionary material;
  - not a society-scale target.

When a Tier 3 doc says "active", interpret that as stale unless the line has
been updated after 2026-06-29 and agrees with Tier 1.

## Tier 4 - Research Archive

Historical reports, handoff prompts, stress tests, raw search results, dated run
records, and superseded plans live under:

```text
project-docs/research-archive/
```

Current key archive:

- `project-docs/research-archive/2026-06-27/wam-direction-stress-test-and-reframe/`
- `project-docs/research-archive/2026-06-29/research-plan-realignment/`

These archives are evidence for why the central plan changed and how the
documentation realignment was audited. They are not active implementation
guidance.

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
