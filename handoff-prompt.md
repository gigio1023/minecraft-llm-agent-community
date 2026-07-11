# Successor Agent Prompt

## Operating Contract

You are the implementation successor for the V4 capability-gated Minecraft
social sandbox. Continue from the verified plan state below without repeating
the completed direction interview, V3 review, or documentation rewrite.

Work on `codex/capability-gated-social-sandbox-v4`. If the checkout is on a
different branch, preserve any unexpected changes and switch to this branch
before editing. Do not commit V4 implementation directly to `main` unless the
user explicitly changes the delivery branch.

Read the named authority and live code before editing. Keep changes bounded to
the immediate vertical slice, preserve runtime-owned Minecraft truth, and verify
the slice before reporting it. Proceed with reversible in-scope work without
asking for routine approval. Pause only for a destructive action, a material
scope change, a live provider cost/authorization decision, or information only
the user can provide.

The repository is TypeScript-first and repo `.ts` files run with Bun only. Use
`bun run`, `bun test`, and `bun run typecheck`; never use Node, ts-node, tsx,
`npx tsx`, or `process.execPath` for repo TypeScript.

## Objective

Implement **Slice A1 — Manifest Loader And Typed Predicates** from the active
V4 implementation plan: add the provider-free `individual-capability-manifest/v1`
contract, strict loader, typed evidence predicate evaluator, three checked-in
minimal cases, and focused negative tests.

### Definition of Done

- A checked-in capability suite contains `collect_logs`, `craft_table`, and
  `place_table` cases with explicit world scenario, budgets, typed targets,
  milestones, evidence kinds, seed policy, and completion policy.
- Invalid manifests fail before server or provider work.
- Predicate evaluation returns `passed | failed | unknown`; every pass cites
  structured evidence refs and every unknown names missing/unsupported evidence.
- Provider prose, task text, tool names, and memory text cannot flip a target.
- Minecraft ids are validated through repo/Minecraft data rather than a custom
  synonym list.
- Focused tests, the full relevant test suite, typecheck, and `git diff --check`
  pass.
- The A1 acceptance state in the implementation plan is updated in the same
  scoped commit.
- No live provider call occurs.

## Intent and Background

The user explicitly retired V3 lived-vs-told prediction/observer legibility as
the active research direction. It was meaningful but too narrow to organize the
project. V4 instead follows this sequence:

```text
individual Minecraft capability
-> autonomous goal continuity
-> materially interdependent social sandbox
-> long-run phenomenon discovery
-> selected controlled follow-up study
```

The user wants capable actors that can set and maintain their own social goals
inside economic, cooperative, and multi-activity quest structures. Minecraft is
valuable because world setup, material state, runtime evidence, metrics, and
video are comparatively easy to build and inspect. The project is personal,
exploratory research and a technical portfolio; it is not constrained by a
global preregistered kill rule. Scenario iteration remains user-directed, but
evidence and version provenance must remain truthful.

Stage 1 is intentionally not the scientific headline. It is the competence
control that prevents Minecraft inability from being misread as social
behavior. The initial benchmark requires no SWE-bench-like trajectory dataset:
the manifest declares goals, state predicates, milestones, budgets, and
evidence, while the actor chooses its own actions.

## Scope and Authority

### In Scope

- Add the smallest coherent `probe/src/benchmarks/capability/` boundary or a
  smaller nearby equivalent supported by code inspection.
- Add manifest and case TypeScript types.
- Add a strict JSON loader and validation errors.
- Add the initial typed predicate algebra and deterministic evaluator over saved
  structured evidence.
- Add one checked-in JSON suite with three minimal cases.
- Add focused unit tests and negative fixtures.
- Update the implementation plan's A1 acceptance status after evidence passes.
- Make small adjacent refactors needed to expose an artifact-reader seam.
- Commit completed work following `CONTRIBUTING.md`.

### Out of Scope

- Slice A2 normalized report implementation, except a minimal type seam that A1
  requires.
- Capability runner/CLI wiring, live server execution, or provider-backed runs.
- Goal-continuity, social scenario, long-run video, or phenomenon-record work.
- V3 Session A/B, lived-vs-told delivery, or observer prediction arms.
- Importing external benchmark runtimes or creating a gold trajectory dataset.
- Hidden planners, recipe sequences, recommended actions, coordinates, or
  parameter candidates in manifests.
- Parsing provider-facing prose to decide targets, permissions, arguments,
  retries, or success.
- Broad cleanup of `socialCycleRunner.ts` or unrelated architecture.

### Require Confirmation

- Any live provider request or quota/budget use.
- Destructive reset of worlds, actor workspaces, or user changes.
- A material schema change to the V4 central or implementation plan.
- Expansion beyond A1 into runner, live benchmark, continuity, or social work.
- Publishing, pushing, opening a PR, or external messaging unless separately
  requested.

## Current State

- Status: implementation not started; plans and routing are complete.
- Workspace: `/Users/gigio/git/minecraft-llm-agent-community`
- Repository and branch: `minecraft-llm-agent-community`,
  `codex/capability-gated-social-sandbox-v4`
- Branch point: commit `d5d29cec` (`docs: add V4 capability benchmark handoff
  prompt`), containing the V4 direction, implementation plan, and original
  handoff.
- Verified plan baseline: commit `fe21fd9b`
- V4 direction commit: `6eef8978`
- Worktree at branch creation: clean.
- Runtime code changed by the two plan commits: none.
- Live provider calls made for this direction change: none.
- Last verified: 2026-07-11 (`Asia/Seoul`), after Docusaurus build and
  `git diff --check` passed.

At the start of your session, treat live `git status` and `git log` as authority
over this snapshot. Do not reset or discard unexpected user changes.

## Decisions and Rationale

| Decision | Why it was made | Evidence or source | Revisit when |
| --- | --- | --- | --- |
| V4 capability-gated social sandbox is active | V3 prediction/legibility was too narrow even if successful | `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`, commit `6eef8978` | only on explicit user direction |
| Stage 1 is dataset-free | target states, milestones, budgets, and verifiers can evaluate Minecraft goals without gold trajectories | V4 central plan section 4; `project-docs/research/benchmarks/project-level-benchmark-plan.md` | when typed predicates cannot evaluate a needed capability |
| Capability precedes social interpretation | weak Minecraft execution must not masquerade as social behavior | V4 central plan sections 3-5 | never for V4 social claims |
| Goal continuity is a separate Stage 2 | long-horizon work state differs from bounded task completion | V4 central plan section 5 | after A-series capability infrastructure |
| Interdependence creates opportunity, not outcomes | economic/cooperative/quest pressure is desired, scripted trust or cooperation is not | V4 central plan section 6 | when designing C-series scenarios |
| Scenario iteration has no global kill clock | user wants a flexible personal research program | V4 central plan sections 1, 7, 15 | user-owned |
| A1 comes before report/runner work | current `--benchmark-task` is free-form and current metrics/scorer are furnace-specific | active implementation plan sections 2, 6, 12 | after A1 acceptance evidence |
| No prose-derived predicate authority | runtime and typed evidence own Minecraft truth | `AGENTS.md`, `SPEC.md`, V4 implementation plan section 4 | never |

## Completed Work and Evidence

| Work item | Result | Evidence | Confidence |
| --- | --- | --- | --- |
| Deep direction interview | User-confirmed intent, audience, V3 retirement, exploratory authority, capability/continuity/sandbox sequence | V4 central plan decision record | verified |
| V4 active central plan | 663-line central direction with research-value artifacts and V3 supersede | `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`, commit `6eef8978` | verified |
| Active pointer alignment | Tier 0, orientation, public docs, architecture, terminology, and repo skills route to V4 | commit `6eef8978`; `rg ACTIVE_CENTRAL_PLAN` | verified |
| Detailed V4 implementation plan | Current-code inventory, five artifact families, failure taxonomy, A0-D2 slices, dependencies, tests, and milestones | `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`, commit `fe21fd9b` | verified |
| Documentation validation | Docusaurus generated optimized static files; Markdown diff checks passed | `cd docs && npm run build`; `git diff --check` in plan session | verified |

## Artifact Map

| Path or identifier | Purpose | Current state |
| --- | --- | --- |
| `SPEC.md` | Highest project direction and runtime boundary | V4 aligned |
| `AGENTS.md` | Binding repo-agent, TypeScript, evidence, quota, and commit rules | V4 aligned |
| `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md` | User-approved research direction and stage authority | active |
| `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md` | Executable contracts, slice order, acceptance, validation, immediate work | active; A1 next |
| `project-docs/research/benchmarks/project-level-benchmark-plan.md` | Prior dataset-free task, predicate, milestone, report, and suite ideas | reference promoted selectively by V4 |
| `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md` | Verified high-level map of existing runtime and gaps | current as of plan commit |
| `probe/src/socialCycleCli.ts` | Existing `--benchmark-task`, scenario, provider, and visual CLI seam | free-form benchmark input only |
| `probe/src/runtime/socialCycleRunner.ts` | Existing benchmark CycleGoal injection and runtime artifact source | no manifest-owned target evaluation |
| `probe/src/runtime/goals/socialCycleBenchmarkMetrics.ts` | Saved report/workspace reader and observation metrics | furnace milestone ids are hard-coded |
| `probe/src/runtime/goals/socialCycleBenchmarkScore.ts` | Current furnace scoring/efficiency/report reference | fixture-specific, not generic authority |
| `probe/src/server/worldScenarios.ts` | Strict world scenario ids and setup manifests | reusable by capability cases |
| `probe/src/runtime/goals/planBeads/**` | Durable work graph and guarded operations | Stage 2 substrate, not A1 target |
| `probe/src/runtime/visualEvidence.ts` | Review-only first/third-person capture | later C3 substrate |
| `probe/test/socialCycleBenchmarkTask.test.ts` | Current target-generic evidence-prose boundary test | useful regression reference |
| `project-docs/research/current-spine/central-plan-lived-vs-told-social-history.md` | Superseded V3 audit trail | do not build from it |

## Remaining Work

1. Implement Slice A1 exactly as defined in the active implementation plan.
2. After A1 is committed and verified, implement A2 normalized report adapter.
3. Continue A3-A5 capability runner/basic suite/provider batch, using mandatory
   provider quota preflight before any live provider call.
4. Implement B-series goal continuity only after capability reports can be
   cited by scenario requirements.
5. Implement C-series social scenarios and long-run bundles only after the
   required individual/continuity evidence exists.
6. Implement D1 phenomenon catalog; begin D2 only after explicit user selection.

## Blockers, Unknowns, and Risks

- Blocker: none for A1. It is provider-free and does not require a live server.
- Unknown: the narrowest reusable structured-evidence reader seam. Resolve by
  inspecting `socialCycleBenchmarkMetrics.ts`, report types, and test helpers
  before choosing module imports.
- Unknown: whether JSON manifest validation should be hand-written or use an
  already-installed schema utility. Check existing repo validation patterns and
  dependencies; do not add a dependency without need.
- Risk: encoding furnace milestones into the generic contract. Mitigation:
  milestone ids are manifest-owned strings and furnace becomes a later
  case-specific adapter.
- Risk: turning the manifest into a hidden planner. Mitigation: reject action
  sequences, recommended actions, recipe steps, and non-goal coordinates.
- Risk: collapsing missing evidence into `failed`. Mitigation: three-valued
  predicate results and explicit missing-evidence reasons.
- Risk: accepting invalid Minecraft ids or maintaining synonyms manually.
  Mitigation: validate through `minecraft-data`/existing repo normalization.
- Risk: modifying large `socialCycleRunner.ts` before a contract exists.
  Mitigation: keep A1 provider-free and offline; expose only the smallest reader
  seam needed.

## First Actions

1. Run:

   ```bash
   git status -sb
   git branch --show-current
   git log -3 --oneline --decorate
   ```

   Confirm the branch is `codex/capability-gated-social-sandbox-v4`, the V4
   plan commits are present, and preserve any unexpected worktree changes. If
   another branch is checked out and the worktree is clean, run:

   ```bash
   git switch codex/capability-gated-social-sandbox-v4
   ```

   If the worktree is not clean, inspect and preserve those changes before
   switching; do not reset, discard, or hide them in an automatic stash.

2. Read, in order:

   ```text
   SPEC.md
   AGENTS.md
   project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md
   project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md
   CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md
   probe/src/runtime/goals/socialCycleBenchmarkMetrics.ts
   probe/src/runtime/socialCycleRunner.ts
   probe/src/server/worldScenarios.ts
   probe/test/socialCycleBenchmarkTask.test.ts
   ```

3. Implement A1 with `apply_patch`, starting from focused types/loader/predicate
   tests before adding the three checked-in cases. Do not wire provider or live
   execution in this slice.

## Verification and Completion Bar

- Run focused tests for every new module and negative fixture.
- Run:

  ```bash
  cd probe && bun run typecheck
  cd probe && bun test
  git diff --check
  ```

- If documentation changes, also run:

  ```bash
  cd docs && npm run build
  ```

- Inspect the new suite and confirm it contains no action order, recipe plan,
  parameter candidates, hidden strategy, or prose-derived predicate authority.
- Inspect a positive, negative, and missing-evidence predicate result and verify
  evidence refs/reasons are present.
- Update A1 acceptance status in the implementation plan only after the evidence
  exists.
- Commit only A1-related files with a detailed `Why`, `What changed`, and
  `Validation` body.
- If a check cannot run, report the exact command, platform, failure, and
  next-best evidence. Do not claim A1 complete.

## Final Delivery

Lead with the A1 outcome. Link the manifest, types/evaluator, tests, and updated
plan. Report exact validation commands and the commit hash. State explicitly
that no provider call occurred. Name any unresolved evidence-reader limitation
that A2 must address. Do not claim the broader capability benchmark, goal
continuity, social sandbox, or research program is complete.
