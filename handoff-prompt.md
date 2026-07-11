# Successor Prompt: Provider-Free Capability Early Completion

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
schemas, or decide how to trade correctness against compatibility. If the
specified procedure does not fit the current code, stop and report the mismatch
instead of inventing an alternative.

Use plain engineering language. Avoid inflated process terms. Preserve exact
schema, file, command, and branch identifiers when required.

## One Outcome and Mode

- Outcome: capability execution stops before the next cycle when the existing
  evidence evaluator proves the declared target, and the raw and normalized
  reports record first measurable progress and target-completion usage.
- Mode: ordered `change`, `run`, and local `commit` work.

## Definition of Done

All of these must be true:

1. `runSocialCycle` accepts one optional typed progress observer and calls it
   after a completed cycle has been appended to the report, before starting the
   next cycle.
2. `runCapabilityCase` supplies the production observer. It builds the evidence
   bag through the existing social-cycle adapter and furnace adapter, then uses
   the existing capability predicates. Provider prose, tool names, scenario
   text, and self-reported success remain irrelevant.
3. A passed target ends the case normally without setting a budget-stop reason
   and without starting another cycle.
4. The raw report and normalized capability report record:
   - first measurable progress;
   - target completion when present;
   - cycle count, runtime-action count, wall time, provider requests, total
     tokens, passed milestone IDs, and evidence refs at each recorded point.
5. A run without progress still records its final observed wall time and usage
   through the existing budget fields. Do not create a second usage system.
6. Focused tests, all probe tests, TypeScript checking, documentation build, and
   `git diff --check` pass.
7. The implementation and its tests are committed once. No push is authorized
   for the successor.

## Why This Work Exists

The first `openai-api:gpt-5.4-mini` capability campaign produced useful failure
evidence but did not measure the intended goals correctly. Three provider-free
repairs are already complete: exact case-goal delivery, explicit crafting-table
placement coordinates, and diverse world-scan sampling. The next defect is
that target evaluation occurs only after the full social-cycle run, so a target
reached early can still consume unnecessary cycles and provider usage.

This is measurement and runtime correctness work. It is not a model comparison,
social-simulation experiment, or research result.

## Approved Basis

Treat these as fixed input:

- `project-docs/research/benchmarks/capability-live-validation-repair-plan.md`,
  work item 4;
- live-result evidence in
  `project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/README.md`;
- implementation commits:
  - `b7dda428` — capability goal, placement, and scan repairs;
  - `773e3bca` — detailed repair plan and current status;
- existing evaluator modules:
  - `probe/src/benchmarks/capability/evidenceBagAdapter.ts`;
  - `probe/src/benchmarks/capability/furnaceObservationAdapter.ts`;
  - `probe/src/benchmarks/capability/predicates.ts`;
- existing budget observation inside
  `probe/src/runtime/socialCycleRunner.ts`.

No unresolved alternative is delegated to you. Use an optional callback so the
generic social runner does not import capability evaluation policy.

## Current Verified State

- Repository: `/Users/gigio/git/minecraft-llm-agent-community`
- Branch: `codex/capability-gated-social-sandbox-v4`
- Expected worktree at start: clean and synchronized with the branch upstream
  after the handoff commit is pushed; verify this rather than assuming it.
- Required completed commits: `b7dda428` and `773e3bca`
- Most recent full verification before this handoff:
  - `cd probe && bun test` -> 733 passed, 0 failed;
  - `cd probe && bun run typecheck` -> passed;
  - `cd docs && npm run build` -> passed;
  - `git diff --check` -> passed.
- No provider request or live Minecraft rerun occurred after the archived
  three-case campaign.
- The old root `lower-capability-executor-prompt.md` was removed because it
  described an already executed live campaign. This file is now the only active
  root continuation prompt.

## Completed Work and Evidence

| Work | Result | Evidence |
| --- | --- | --- |
| Declared goal delivery | `case_id`, exact `top_level_goal`, and `manifest_hash` reach Actor Turn while evaluator rules stay hidden | `b7dda428`, `probe/test/capabilityRunnerSmoke.test.ts` |
| Scenario-prompt cleanup | capability runs suppress generic natural-survival and milestone-rich fixture task prose | `b7dda428`, saved-input regression test |
| Crafting-table placement | empty parameters are rejected; no adjacent coordinate is invented | `b7dda428`, `probe/test/socialCycleExecution.test.ts` |
| World scan | retained blocks are sampled across distance, direction, height, and observed names without resource-specific priorities | `b7dda428`, `probe/test/worldStateScan.test.ts` |
| Detailed continuation plan | work items 4-8, verification, and future live conditions are recorded | `773e3bca`, repair plan |

## Exact Allowed Scope

You may modify only these files:

1. `probe/src/runtime/goals/types.ts`
   - add the optional raw-report progress-summary types and field;
2. `probe/src/runtime/socialCycleRunner.ts`
   - add the optional progress-observer input;
   - call it after each completed cycle is appended and before the next cycle;
   - record measurement points and stop normally on a passed target;
3. `probe/src/benchmarks/capability/runner.ts`
   - add the production observer using the existing adapters and predicates;
   - add a provider-free test-only observer override only if orchestration cannot
     otherwise be tested deterministically;
4. `probe/src/benchmarks/capability/reportTypes.ts`
   - expose the recorded progress summary in `individual-capability-report/v1`;
5. `probe/src/benchmarks/capability/report.ts`
   - copy the runtime-recorded progress summary into the normalized report
     without recomputing or interpreting provider prose;
6. `probe/test/capabilityEarlyCompletion.test.ts`
   - new direct tests for evaluation, stopping, measurement, and non-progress;
7. `probe/src/benchmarks/capability/index.ts`
   - only if a newly tested public helper or type must be exported.

Do not change any other file. In particular, do not edit:

- capability manifests or predicates;
- Action Cards, provider prompts, Mineflayer actions, placement, or world scans;
- provider usage tracking or quota policy;
- CLI output or failure attribution;
- plans, status documents, reports, archived evidence, `SPEC.md`, or
  `AGENTS.md`.

If a required correct change needs another file, stop and report the exact file
and reason. Do not expand your own file list.

## Fixed Data Shape

Use one optional raw-report field named `capability_progress` with schema
`capability-progress-summary/v1`.

The summary contains:

```ts
type CapabilityProgressMeasurement = {
  cycle_count: number;
  runtime_action_count: number;
  wall_time_ms: number;
  provider_requests: number;
  total_tokens: number;
  passed_milestone_ids: string[];
  evidence_refs: string[];
};

type CapabilityProgressSummary = {
  schema: "capability-progress-summary/v1";
  latest_target_status: "passed" | "failed" | "unknown";
  latest_passed_milestone_ids: string[];
  first_measurable_progress?: CapabilityProgressMeasurement;
  target_completion?: CapabilityProgressMeasurement;
};
```

Requirements:

- arrays are deduplicated and sorted;
- `first_measurable_progress` is written once, when at least one milestone or
  the target first passes;
- `target_completion` is written once when the target first passes;
- measurement counts come from the existing report/action counts, clock, and
  usage observer after the completed cycle;
- evidence refs are the union of the passed target and passed milestones only;
- a later check may update the two `latest_*` fields but must not rewrite the
  first measurement points;
- the normalized report copies this object as `capability_progress`.

Do not introduce a second schema version, event stream, standalone JSON file,
new clock, or new provider ledger.

## Fixed Observer Behavior

Add an optional callback to `SocialCycleRunOptions`. Its input contains only:

- the current `SocialCycleRunReport`, including the cycle just appended;
- the resolved actor workspace directory.

Its output contains only:

- target status;
- passed milestone IDs;
- evidence refs from the passed target and milestones.

The social runner owns elapsed time, request/token counts, action/cycle counts,
measurement persistence, report flushing, and the stop decision. It must not
know manifest predicates.

`runCapabilityCase` owns the production callback:

1. adapt the current report through `adaptSocialCycleReportToEvidenceBag`;
2. apply `applyFurnaceObservationAdapter` exactly as final normalization does;
3. call `evaluateCapabilityPredicate` for the target;
4. call `evaluateCapabilityMilestone` for every declared milestone;
5. return only passed milestone IDs and evidence refs from passed results.

Do not use `top_level_goal`, descriptions, tool names, action names, provider
text, or WorldEvent text to decide progress.

## Fixed Stop Semantics

- Invoke the observer only after a completed cycle is present in
  `report.cycles` and before starting another cycle.
- If target status is `passed`, flush the raw report, leave
  `caseBudgetStop` unset, stop the outer cycle loop, and finalize
  `runtime_status` as `passed` unless provider or environment failure already
  occurred.
- Do not mark `timeout`, `budget_exhausted`, `runtime_execution_failed`, or a
  provider failure merely because execution ended early on target evidence.
- Existing wall/request/token/cost stopping retains higher priority if it was
  already recorded before target observation.
- Do not cancel or race in-flight provider work. This task only prevents a new
  cycle after an already completed cycle.

## Test Procedure

Create `probe/test/capabilityEarlyCompletion.test.ts` with direct tests for all
four cases below:

1. The production capability progress helper evaluates a constructed
   evidence-backed inventory target using real artifact refs and returns a
   passed target. Reuse existing report/evidence fixture style; do not use
   provider prose.
2. A deterministic provider-free social run whose injected observer returns a
   passed target after the first completed cycle ends with one cycle, does not
   record a budget stop, and records both measurement points.
3. A deterministic provider-free run whose observer reports one passed
   milestone but a failed target records first progress and continues until its
   requested cycle count.
4. A deterministic provider-free run with no passed milestone and an unknown or
   failed target omits both measurement points and retains existing stop/status
   behavior.

If a test-only observer override is necessary, keep it under the existing
`RunCapabilityCaseInput.testHooks` or call `runSocialCycle` directly. Production
execution must always use the real evaluator callback.

Do not weaken, delete, skip, or snapshot broad objects in existing tests.

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
- commits `b7dda428` and `773e3bca` are ancestors of `HEAD`;
- the worktree is clean;
- every allowed file still contains the named current implementation surface;
- no provider or live-run command is required.

If these conditions match, proceed. Do not ask the user to reconfirm.

## Ordered Execution

1. Read only the approved basis and allowed source/test files.
2. Add the fixed types and optional report field.
3. Add the callback and stop/measurement behavior to `runSocialCycle`.
4. Add the production evaluator callback to `runCapabilityCase`.
5. Copy the raw progress summary into the normalized report.
6. Add the four direct tests.
7. Run the focused checks below once.
8. If focused checks pass, run the complete provider-free checks once.
9. Inspect `git diff --check`, changed paths, and the complete diff.
10. If and only if all required checks pass, create one commit with subject:
    `probe: stop capability runs on target evidence`
11. Inspect the commit and final worktree. Do not push.

## Allowed Commands

Working directory is `/Users/gigio/git/minecraft-llm-agent-community` unless a
command explicitly changes it.

Focused checks:

```bash
cd probe
bun test test/capabilityEarlyCompletion.test.ts \
  test/capabilityRunnerSmoke.test.ts \
  test/capabilityBudgetStopping.test.ts
bun run typecheck
```

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

- Keep capability evaluator rules private to the capability runner.
- Keep `runtime_status`, target/milestone evidence, and budget stopping
  independent.
- Preserve setup evidence exclusions and the furnace adapter.
- Preserve typed refs and root-safe actor workspace resolution.
- Preserve the exact case goal delivery, explicit placement requirement, and
  diverse world scan landed in `b7dda428`.
- Use Bun for repository TypeScript.
- Do not install dependencies, change configuration, change model/provider
  settings, or access secrets.
- Do not make a live run or write experiment results.
- Do not update plan checkboxes or claim later work is complete.

## Stop Conditions

Stop before the affected action when:

- the branch, ancestor commits, or clean-worktree prerequisite does not match;
- an allowed file has overlapping user changes;
- the fixed observer design cannot be implemented without another file;
- a required test needs a provider, Docker, Minecraft, credentials, or network;
- evaluator and final normalization would disagree under the fixed procedure;
- a check fails and repair requires architecture, schema naming, or scope
  judgment not stated here;
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

1. improve failure attribution and CLI summary order;
2. reduce repeated Action Card input without changing action availability;
3. add conservative external dashboard usage observations to preflight;
4. add portable archive relocation and approved-preflight linkage;
5. run full provider-free CLI checks;
6. ask the user for a new current-day allowance before one `collect_logs` and
   one wooden-pickaxe live rerun.

Do not begin any of these in the same execution.

## Artifact Map

| Path | Purpose | State |
| --- | --- | --- |
| `project-docs/research/benchmarks/capability-live-validation-repair-plan.md` | Approved full repair order and completion checks | active; work items 1-3 complete |
| `project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/README.md` | Evidence that motivated the repairs | completed diagnostic result; no rerun authority |
| `implementation-notes.md` | Current implementation status and deviations | current through `b7dda428`/`773e3bca` |
| `probe/src/runtime/socialCycleRunner.ts` | Cycle loop, budgets, report flush, and new observer location | work item 4 target |
| `probe/src/benchmarks/capability/runner.ts` | Manifest-owned evaluation and adapter composition | work item 4 target |
| `probe/src/benchmarks/capability/report.ts` | Final normalized capability result | must copy recorded measurements |
| `probe/test/capabilityEarlyCompletion.test.ts` | Direct proof of early completion behavior | must be created |

## Final Report

Lead with whether early completion is implemented and committed. Include:

- preflight consistency result;
- files changed and why each was allowed;
- focused and complete commands with working directory, exit status, and
  concise result;
- the new commit hash and subject, if created;
- evidence that target completion stops before another cycle and does not
  become budget exhaustion;
- evidence that partial/no progress retains truthful behavior;
- any failed, skipped, unavailable, or unverified item;
- final staged, unstaged, and untracked state;
- explicit confirmation that no provider request, live Minecraft run, push, or
  later-plan work occurred.

Do not claim completion from this prompt or a green typecheck alone.
