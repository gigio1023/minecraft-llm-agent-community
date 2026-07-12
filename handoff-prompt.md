# Successor Prompt: Provider-Free Failure Attribution and CLI Summary Order

Do not optimize for completing the V4 repair plan as broadly as possible.
Optimize for the smallest correct and verifiable change described below.

Execute only the immediate task in this prompt. The design decision is already
made. Verify it against the current checkout, then continue without asking for
routine approval unless a listed stop condition is met.

## Role and Operating Rules

You are continuing the capability live-validation repair on behalf of the user.
You may implement the fixed provider-free task below, run the named checks, and
commit it when every required check passes. You must not choose a new runtime
architecture, widen the task to later plan items, make an external model call,
or improvise recovery after an unexpected failure.

This packet assumes you can make exact TypeScript edits and run supplied
commands, but should not be asked to resolve new product decisions, redesign
schemas beyond attribution, or decide how to trade correctness against
compatibility. If the specified procedure does not fit the current code, stop
and report the mismatch instead of inventing an alternative.

Use plain engineering language. Avoid inflated process terms. Preserve exact
schema, file, command, and branch identifiers when required. Say “required
check” when a check must pass before the next step.

## One Outcome and Mode

- Outcome: keep `runtime_status`, target/milestone status, action-selection
  result, and `interpretation_status` / `failure_class` independent in
  normalized capability results; add or reuse explicit failure values from the
  repair plan; CLI summaries print target, milestone progress, interpretation,
  and stop reason before lower-level `runtime_status`.
- Mode: ordered `change`, `run`, and local `commit` work. No push.

## Definition of Done

All of these must be true:

1. Normalized `individual-capability-report/v1` keeps these layers independent:
   - `runtime_status` — process, provider, environment, or Minecraft execution;
   - `target` and `milestones` — capability evidence predicates only;
   - action-selection result — valid selection, malformed parameters, repeated
     blocker, or no measurable goal progress;
   - `interpretation_status` and optional `failure_class`.
2. Explicit failure values are added or reused so that:
   - absent capability context makes the run `unverifiable`;
   - successfully executed actions with no target or milestone change become
     `no_measurable_progress`;
   - malformed structured parameters remain an action-selection / input failure;
   - Mineflayer or environment failures remain separate from the layers above.
3. CLI summaries print, in this order before lower-level runtime status:
   target status, milestone progress, interpretation (including `failure_class`
   when present), and stop reason; then `runtime_status` and existing budget
   flags.
4. Completion counterexamples from the repair plan pass:
   - a movement-only verified action under a log-collection goal is not labeled
     as Minecraft execution failure when movement itself verified;
   - clean runtime exit without target evidence is still not capability success;
   - parameter-contract / malformed-input failures are not collapsed into
     `runtime_execution_failed` or environment failure;
   - absent `capability_case_context` on a capability-normalized path is
     `unverifiable`, not actor `no_measurable_progress`.
5. Focused tests, all probe tests, TypeScript checking, documentation build, and
   `git diff --check` pass.
6. The implementation and its tests are committed once. No push is authorized.
7. The repair-plan Progress checkbox for item 5 is marked complete only after the
   required checks pass. Do not mark later items complete.

## Why This Work Exists

The first `openai-api:gpt-5.4-mini` capability campaign produced useful failure
evidence, but summaries and interpretation often collapsed distinct layers. A
verified movement under a log goal could be read as execution failure; a clean
runtime exit could be mistaken for competence; missing context or malformed
parameters could be mislabeled as actor progress failure.

Items 1–4 of the repair plan are already complete provider-free, including
evidence-based early completion with **action-level** stop: after each completed
action is recorded, not only after each cycle. This task is item 5 only:
attribution and CLI summary order. It is measurement correctness, not a model
comparison, Action Card redesign, or live Minecraft rerun.

## Approved Basis

Treat these as fixed input:

- `project-docs/research/benchmarks/capability-live-validation-repair-plan.md`,
  section `### 5. Attribute failure at the right layer` and its completion
  checks;
- item 4 status writeup:
  `project-docs/research/benchmarks/capability-early-completion-implementation.md`
  (action-level early stop is done; do not redo it);
- live-result evidence in
  `project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/README.md`
  (diagnostic motivation only; no rerun authority);
- existing report and CLI surfaces (inspect before editing; do not invent APIs):
  - `probe/src/benchmarks/capability/reportTypes.ts`
    (`CAPABILITY_FAILURE_CLASSES`, `CAPABILITY_INTERPRETATION_STATUSES`,
    `IndividualCapabilityReportV1`);
  - `probe/src/benchmarks/capability/report.ts`
    (`interpretCapability`, `buildIndividualCapabilityReport`);
  - `probe/src/benchmarks/capability/cli.ts`
    (final JSON summary currently emits `interpretation_status` then
    `runtime_status` without target/milestone/stop-reason-first ordering);
  - `probe/src/benchmarks/capability/runner.ts`
    (`CapabilityBudgetStatusV1`, suite-index run rows, budget override of
    interpretation when exhausted / cost-unverifiable);
  - existing evidence already available on `social-cycle-run-report/v1`
    (`capability_case_context`, cycle / `action_attempts`, settlement blockers,
    action-attempt `runtime_status` including `classifier_failed`, and
    actor-evidence categories such as `action_parameter_contract_failure`).

No unresolved product alternative is delegated to you. Prefer reusing existing
`CapabilityFailureClassV1` values (`unverifiable`, `no_measurable_progress`,
`runtime_execution_failed`, `world_setup_failed`, `provider_blocked`,
`missing_action_capability`, `budget_exhausted`, and related listed values)
before inventing new class names. If a dedicated action-selection result field
is required for independence, add the smallest typed optional field on
`IndividualCapabilityReportV1` and derive it from existing report/evidence
facts — do not invent new social-runner hooks or provider tools.

## Current Verified State

- Repository: `/Users/gigio/git/minecraft-llm-agent-community`
- Branch: `codex/capability-gated-social-sandbox-v4`
- Expected at start: item 4 early completion is present, including action-level
  stop after each completed action in `probe/src/runtime/socialCycleRunner.ts`
  via `observeCapabilityProgress`, unique prior-action evidence in subsequent
  Actor Turns, and preservation of executed evidence if runtime classification
  fails. Verify commit `0a29b1c4` rather than assuming the older cycle-boundary
  stop from `d852be2e` or the first action-level change alone.
- Ancestor commits that must be present: `b7dda428`, `773e3bca`, `962440af`, and
  `0a29b1c4`.
- No provider request or live Minecraft rerun is authorized by this packet.
- This file is the only active root continuation prompt for the next change.

## Completed Work and Evidence

| Work | Result | Evidence |
| --- | --- | --- |
| Declared goal delivery | Exact `case_id` / `top_level_goal` / `manifest_hash`; scenario task prose suppressed | `b7dda428` |
| Crafting-table placement | Empty parameters rejected; no adjacent invent | `b7dda428` |
| World scan diversity | Query-neutral sampling | `b7dda428` |
| Early completion (item 4) | Stop after each completed **action** when target evidence passes; do not duplicate the current attempt in the next Actor Turn; preserve executed evidence on runtime-classifier failure; keep progress measurements separate from budget/runtime status | `962440af`, `0a29b1c4`, and `probe/test/capabilityEarlyCompletion.test.ts` |
| Repair plan | Items 1–4 checked; item 5 next | repair plan Progress section |

## Exact Allowed Scope

You may modify only these files:

1. `probe/src/benchmarks/capability/reportTypes.ts`
   - keep existing interpretation / failure enums;
   - add the smallest optional action-selection result type/field only if needed
     for layer independence;
2. `probe/src/benchmarks/capability/report.ts`
   - attribute failures at the correct layer without collapsing
     `runtime_status`, target/milestones, action-selection, and interpretation;
3. `probe/src/benchmarks/capability/cli.ts`
   - reorder / enrich the printed JSON summary so target, milestone progress,
     interpretation, and stop reason appear before `runtime_status`;
4. `probe/src/benchmarks/capability/runner.ts`
   - only if suite-index or CLI-facing result shaping must expose the same
     ordered fields without changing stop policy;
5. `probe/src/benchmarks/capability/index.ts`
   - only if a newly tested public type or helper must be exported;
6. Focused tests under `probe/test/`, especially:
   - `probe/test/individualCapabilityReport.test.ts`
   - `probe/test/capabilityCli.test.ts`
   - and a new focused attribution test file if clearer than overloading others;
7. `implementation-notes.md`
   - record item 5 completion and deviations only;
8. `project-docs/research/benchmarks/capability-live-validation-repair-plan.md`
   - mark only the item 5 Progress checkbox complete when done.

Do not change any other file. In particular, do not edit:

- Action Cards, provider prompts, Mineflayer actions, placement, or world scans;
- early-completion observer / stop policy in `socialCycleRunner.ts` (item 4 is
  done);
- capability manifests or predicate algebra except as read-only fixtures;
- provider quota / preflight policy;
- live experiment archives, `SPEC.md`, or `AGENTS.md`;
- repair-plan items 6–8.

If a required correct change needs another file, stop and report the exact file
and reason. Do not expand your own file list.

## Fixed Attribution Behavior

Ground attribution in existing typed facts:

1. `runtime_status` remains the social-cycle exit status copied into
   `IndividualCapabilityReportV1.runtime_status`. Do not overwrite it to encode
   capability failure.
2. Target and milestone statuses remain predicate results on the evidence bag.
3. Action-selection result must distinguish at least:
   - valid selection that executed;
   - malformed structured parameters / parameter-contract failure;
   - repeated blocker;
   - executed actions with no measurable target or milestone change.
4. `interpretation_status` / `failure_class` summarize the capability reading
   after the layers above, reusing `CAPABILITY_FAILURE_CLASSES` where possible:
   - absent capability context → `unverifiable` / `failure_class: "unverifiable"`;
   - successful execution, no target/milestone change →
     `no_measurable_progress` (not `runtime_execution_failed`);
   - malformed parameters → action-selection / input failure, not Mineflayer
     execution failure;
   - Mineflayer / environment failures stay on the runtime / environment path
     (`runtime_execution_failed`, `world_setup_failed`, etc.).

Do not parse provider prose, tool names, scenario text, or Action Card wording
to decide attribution. Use schemas, report fields, evidence categories, verifier
status, settlement blockers/stalls, and predicate results.

## Fixed CLI Summary Order

In `probe/src/benchmarks/capability/cli.ts`, the successful-run JSON summary for
each run must present capability-facing fields before lower-level runtime
status. Required order:

1. target status (from `normalized_report.target.status`);
2. milestone progress (passed milestone ids / counts from
   `normalized_report.milestones`);
3. interpretation (`interpretation_status`, and `failure_class` when present);
4. stop reason (derive from existing `budget_status` and/or
   `capability_progress.target_completion` / early-pass facts — do not invent a
   second budget system);
5. then `runtime_status`, paths, and existing budget flags.

Preserve current useful path fields (`suite_index_path`, report paths,
`budget_stopped`, `budget_exhausted`, `provider_free`). Do not hide them; only
reorder and add the missing capability-facing fields.

## Test Procedure

Add or extend provider-free tests so each attribution counterexample is
asserted directly:

1. Movement-only / verified non-goal action under a log-collection case is not
   `runtime_execution_failed` merely because the target failed; expect
   `no_measurable_progress` (or partial/stalled when milestones warrant it) while
   `runtime_status` can still be a clean pass.
2. Absent capability context → `unverifiable`.
3. Malformed structured parameters / parameter-contract failure remains an
   action-selection / input failure, not environment or Mineflayer execution
   failure.
4. Environment / Mineflayer blocked paths remain separate.
5. CLI stdout JSON for a provider-free offline capability CLI invocation includes
   target, milestone progress, interpretation, and stop reason before
   `runtime_status`.

Reuse fixture style from `probe/test/individualCapabilityReport.test.ts` and
spawn style from `probe/test/capabilityCli.test.ts`. Do not weaken, delete,
skip, or snapshot broad objects in existing tests.

## Preflight

From `/Users/gigio/git/minecraft-llm-agent-community`:

```bash
git status -sb
git branch --show-current
git log -7 --oneline --decorate
git diff --stat
git diff
```

Continue without pausing only if:

- the branch is exactly `codex/capability-gated-social-sandbox-v4`;
- early-completion ancestors are present and action-level observation after each
  completed action exists in `socialCycleRunner.ts`;
- commit `0a29b1c4` is present, and the current cycle is excluded from prior
  Actor Turn history while runtime-classifier failures retain their executed
  action attempt and evidence;
- overlapping unrelated user edits are not present on disallowed files;
- no provider or live-run command is required.

If commit `0a29b1c4` or its two regression behaviors are missing, stop; do not
reimplement item 4 under this packet. If these conditions match, proceed. Do not
ask the user to reconfirm.

## Ordered Execution

1. Read only the approved basis and allowed source/test files.
2. Inspect current `failure_class` / interpretation behavior and CLI summary
   payload; list the minimal field additions actually required.
3. Implement independent-layer attribution in report types / report builder.
4. Update CLI summary order and fields.
5. Touch runner / index only if required for the same CLI-facing shape.
6. Add the attribution and CLI counterexample tests.
7. Update `implementation-notes.md` and the repair-plan item 5 checkbox only
   after required checks pass.
8. Run the focused checks below once.
9. If focused checks pass, run the complete provider-free checks once.
10. Inspect `git diff --check`, changed paths, and the complete diff.
11. If and only if all required checks pass, create one commit with subject:
    `probe: attribute capability failures by layer`
12. Inspect the commit and final worktree. Do not push.

## Allowed Commands

Working directory is `/Users/gigio/git/minecraft-llm-agent-community` unless a
command explicitly changes it.

Focused checks:

```bash
cd probe
bun test test/individualCapabilityReport.test.ts \
  test/capabilityCli.test.ts \
  test/capabilityBudgetStopping.test.ts \
  test/capabilityEarlyCompletion.test.ts \
  test/capabilityRunnerSmoke.test.ts
bun run typecheck
```

If you add a new attribution test file, include it in the focused `bun test`
invocation.

Complete checks after focused checks pass:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community/probe
bun test
bun run typecheck
cd ../docs
npm run build
cd ..
git diff --check
```

Git inspection and commit commands are allowed only for the listed files. Stage
them by explicit path. Do not use `git add -A`, amend, rebase, reset, checkout,
stash, clean, force-push, or push.

No provider command, Docker command, Minecraft server command, package install,
network request, or credential access is authorized.

Permitted retries:

- one retry of a focused test only when the first failure is clearly a transient
  filesystem cleanup or port-timing failure and no edit is made between runs;
- no other command retry.

A failed check is evidence to report, not permission to change an unlisted file
or redesign the procedure.

## Preservation Rules

- Keep `runtime_status`, target/milestone evidence, action-selection result, and
  interpretation independent.
- Preserve item 4 action-level early completion, unique prior-action context,
  classifier-failure evidence retention, and `capability_progress` measurement
  semantics.
- Preserve setup evidence exclusions and the furnace adapter.
- Preserve typed refs and root-safe actor workspace resolution.
- Preserve exact case-goal delivery, explicit placement, and diverse scan from
  `b7dda428`.
- Use Bun for repository TypeScript.
- Do not install dependencies, change configuration, change model/provider
  settings, or access secrets.
- Do not make a live run or write experiment results.
- Do not mark repair-plan items after item 5 complete.

## Stop Conditions

Stop before the affected action when:

- the branch, ancestor commits, or action-level early-completion prerequisite
  does not match;
- an allowed file has overlapping unrelated user changes;
- correct attribution requires editing a disallowed file (for example Action
  Cards or `socialCycleRunner` stop policy);
- a required test needs a provider, Docker, Minecraft, credentials, or network;
- the change would redesign schemas beyond attribution (new progress schemas,
  new budget systems, predicate redesign);
- a check fails and repair requires architecture or scope judgment not stated
  here;
- committing would include an unlisted file.

Use this stop report:

```text
Stopped before the unauthorized or undefined action.
Mismatch: ...
Evidence: ...
Work performed: ...
Changed files or side effects: ...
Smallest missing decision or authority: ...
Checks completed and not completed: ...
```

## Later Work — Do Not Start It

After this task is reviewed, the remaining plan order is:

1. reduce repeated Action Card input without changing action availability;
2. add conservative external dashboard usage observations to preflight;
3. add portable archive relocation and approved-preflight linkage;
4. run full provider-free CLI checks for `collect_logs` and
   `craft_wooden_pickaxe` as required checks before any live ask;
5. ask the user for a new current-day allowance before one `collect_logs` and
   one wooden-pickaxe live rerun.

Do not begin any of these in the same execution.

## Artifact Map

| Path | Purpose | State |
| --- | --- | --- |
| `project-docs/research/benchmarks/capability-live-validation-repair-plan.md` | Approved repair order; item 5 is this work | items 1–4 complete; item 5 checkbox pending |
| `project-docs/research/benchmarks/capability-early-completion-implementation.md` | Item 4 done, including action-level stop, unique next-turn evidence, and classifier-failure evidence retention | prerequisite at `0a29b1c4`; do not reopen |
| `probe/src/benchmarks/capability/reportTypes.ts` | Interpretation / failure enums and report shape | edit if action-selection field needed |
| `probe/src/benchmarks/capability/report.ts` | Attribution logic | primary change surface |
| `probe/src/benchmarks/capability/cli.ts` | Summary field order | primary change surface |
| `probe/test/individualCapabilityReport.test.ts` | Existing interpretation counterexamples | extend |
| `probe/test/capabilityCli.test.ts` | Provider-free CLI spawn coverage | extend for summary order |
| `implementation-notes.md` | Branch-local status | update after success |

## Final Report

Lead with whether failure attribution and CLI summary order are implemented and
committed. Include:

- preflight consistency result, including confirmation that item 4 action-level
  stop was already present;
- files changed and why each was allowed;
- focused and complete commands with working directory, exit status, and
  concise result;
- the new commit hash and subject, if created;
- evidence for each required attribution counterexample;
- evidence that CLI summary order places target, milestones, interpretation, and
  stop reason before `runtime_status`;
- any failed, skipped, unavailable, or unverified item;
- final staged, unstaged, and untracked state;
- explicit confirmation that no provider request, live Minecraft run, push,
  Action Card work, or later-plan work occurred.

Do not claim completion from this prompt or a green typecheck alone.
