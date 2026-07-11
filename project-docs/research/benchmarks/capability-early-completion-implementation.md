# Capability Early Completion — Implementation Report

Search token: `CAPABILITY_EARLY_COMPLETION_IMPLEMENTATION_2026_07_12`.

Branch: `codex/capability-gated-social-sandbox-v4`  
Commits:
- `d852be2e` — cycle-boundary early stop (narrow handoff)
- follow-up — action-level early stop (repair-plan item 4 completion)

Date: 2026-07-12  
Authority: repair-plan item 4 in
`project-docs/research/benchmarks/capability-live-validation-repair-plan.md`.

This page explains **what was implemented, why, how it works, what was verified,
and what remains out of scope**. It is measurement/runtime correctness
documentation, not a research claim and not a live-run report.

## 1. One-sentence result

Capability cases stop after a completed **action** once existing predicates prove
the declared target (so the next action in the same cycle does not start), and
both the raw social-cycle report and the normalized capability report record
write-once first-progress and target-completion usage without treating that stop
as budget exhaustion.

## 2. Why this change existed

The first `openai-api:gpt-5.4-mini` capability campaign produced useful failure
evidence, but measurement was wrong in several ways. Three provider-free repairs
were already landed before this work:

| Prior repair | Commit | Effect |
| --- | --- | --- |
| Exact case-goal delivery | `b7dda428` | Actor Turn receives `case_id`, exact `top_level_goal`, `manifest_hash`; scenario survival/milestone prose is suppressed for capability runs |
| Explicit crafting-table placement | `b7dda428` | Empty placement parameters are rejected; no adjacent coordinate invention |
| Diverse world-scan sampling | `b7dda428` | Retained blocks sample distance, direction, height, and names without resource-specific priorities |

The remaining defect: **target evaluation happened only after the full
social-cycle run finished**, then a first wave stopped only after each **cycle**.
With default `maxActionsPerCycle >= 2`, a target met on action 1 could still spend
a second action and provider request in the same cycle.

This is instrumentation and stop-policy correctness. It is not a model
comparison, social simulation, or paper result.

## 3. Design that was fixed before coding

### Separation of concerns

| Owner | Responsibility |
| --- | --- |
| Generic `runSocialCycle` | Optional observer hook, elapsed time, request/token counts, cycle/action counts, measurement persistence, report flush, stop decision |
| `runCapabilityCase` | Production observer that adapts evidence and evaluates predicates |
| Predicates / adapters | Unchanged authority for whether a target or milestone passed |
| Provider prose / tool names / scenario text | Never consulted for progress |

The social runner must not import capability evaluation policy. An optional
callback keeps the generic loop reusable.

### Observation timing (repair-plan contract)

After each completed action:

1. refresh settlement snapshot for observation;
2. upsert the in-progress cycle onto `report.cycles` (so adapters and
   runtime-action counts see this action's evidence);
3. flush the raw report;
4. call the optional observer;
5. re-check case budgets at the observation boundary (budget keeps priority);
6. record write-once measurements and flush again;
7. if target status is `passed` and no budget stop exists, break the action loop;
8. finalize the cycle record, then break the cycle loop.

Cycle-end-only observation was removed; action-level observation is the source
of progress truth for early stop.

### Stop semantics

| Condition | Result |
| --- | --- |
| Target passed, no `caseBudgetStop` | Leave budget stop unset; `runtime_status = "passed"` unless provider/environment failure already occurred |
| `caseBudgetStop` already recorded or tripped at observation | Budget keeps priority → `runtime_status = "timeout"`; do not rebrand as early success |
| Provider failure | `runtime_status = "failed"` |
| Environment blocked | Keep environment status from finalize path |
| Clean exit without target evidence | Still not capability success in the normalized report |

Early target stop must not set `timeout`, `budget_exhausted`,
`runtime_execution_failed`, or a provider failure merely because the loop ended
early.

## 4. Data shape

Schema name: `capability-progress-summary/v1`.

Defined in `probe/src/runtime/goals/types.ts` and stored on the raw report as
optional `capability_progress`. The normalized `individual-capability-report/v1`
copies the same object without recomputation.

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

Rules:

- arrays are deduplicated and sorted;
- `first_measurable_progress` is written once, when at least one milestone or
  the target first passes;
- `target_completion` is written once when the target first passes;
- later checks may update `latest_*` but must not rewrite the first measurement
  points;
- measurement counts come from the existing report/action counts, case clock,
  and usage observer after the completed cycle;
- `evidence_refs` are the union of the passed target and passed milestones only;
- no second usage ledger, clock, event stream, or standalone JSON schema was
  added.

## 5. Runtime flow

```text
runCapabilityCase
  └─ observeCapabilityProgress =
       testHooks override OR evaluateCapabilityCaseProgress
  └─ runSocialCycle(... observeCapabilityProgress ...)
       for each cycle:
         ... execute cycle ...
         report.cycles.push(completedCycle)
         writeJson(raw report)                    # durable cycle first
         if observeCapabilityProgress:
           observation = await callback(report, actorDir)
           observed = collectCaseBudgetObserved() # cycles/actions/wall/usage
           applyCapabilityProgressObservation()   # write-once points
           writeJson(raw report)                  # persist progress
           if observation.targetStatus == passed
              and caseBudgetStop unset:
                earlyTargetCompleted = true
                break
       finalize runtime_status
         caseBudgetStop → timeout
         else providerFailed → failed
         else earlyTargetCompleted → passed
  └─ buildIndividualCapabilityReport
       copies report.capability_progress if present
```

### Production observer

`evaluateCapabilityCaseProgress` in
`probe/src/benchmarks/capability/runner.ts`:

1. `adaptSocialCycleReportToEvidenceBag({ report, actorDir, artifactsByRef? })`
2. `applyFurnaceObservationAdapter(...)` exactly as final normalization does
3. `evaluateCapabilityPredicate(case.target, bag)`
4. `evaluateCapabilityMilestone` for every declared milestone
5. return only `{ targetStatus, passedMilestoneIds, evidenceRefs }`

Setup-origin inventory and missing evidence still yield `unknown` /
`failed` through the existing predicate algebra. Provider text is irrelevant.

## 6. Files changed

Only the handoff allowlist was edited.

| File | Change |
| --- | --- |
| `probe/src/runtime/goals/types.ts` | Added `CapabilityProgressMeasurement`, `CapabilityProgressSummary`, and optional `SocialCycleRunReport.capability_progress` |
| `probe/src/runtime/socialCycleRunner.ts` | Added `SocialCycleCapabilityProgressObservation`, `observeCapabilityProgress` option, measurement merge helper, post-cycle observe/stop path, early-pass `runtime_status` override |
| `probe/src/benchmarks/capability/runner.ts` | Added `evaluateCapabilityCaseProgress`; wired production observer into `runSocialCycle`; optional `testHooks.observeCapabilityProgress` override for deterministic orchestration tests |
| `probe/src/benchmarks/capability/reportTypes.ts` | Optional `capability_progress` on `IndividualCapabilityReportV1` |
| `probe/src/benchmarks/capability/report.ts` | Copies raw `capability_progress` into the normalized report |
| `probe/src/benchmarks/capability/index.ts` | Exports `evaluateCapabilityCaseProgress` |
| `probe/test/capabilityEarlyCompletion.test.ts` | Provider-free tests including action-level stop, disk raw/normalized copy, and budget-vs-target priority |

Not changed (intentionally):

- capability manifests and predicate definitions;
- Action Cards, provider prompts, Mineflayer actions, placement, world scan;
- provider usage tracking / quota policy;
- CLI summary order / failure attribution (repair plan item 5);
- `SPEC.md` / `AGENTS.md`.

## 7. Tests

File: `probe/test/capabilityEarlyCompletion.test.ts`.

| # | Case | Proof |
| --- | --- | --- |
| 1 | Production helper + constructed inventory evidence | `evaluateCapabilityCaseProgress` returns `targetStatus: "passed"` with sorted evidence refs; no provider prose |
| 2 | Injected observer returns passed after action 1 (`maxActionsPerCycle: 1`) | One cycle; no `caseBudgetStop`; `runtime_status: "passed"`; both measurement points recorded |
| 3 | Passed target with `maxActionsPerCycle: 2` | Second action never starts; `target_completion.runtime_action_count === 1` |
| 4 | One passed milestone, failed target | First progress recorded; no `target_completion`; continues to requested cycle count |
| 5 | Milestone after action 1 with `maxActionsPerCycle: 2` | Second action still runs; first progress write-once at action count 1 |
| 6 | Unknown target, no milestones | Measurement points omitted; no timeout from early-completion path |
| 7 | `runCapabilityCase` disk regression | Raw and normalized reports on disk share matching `capability_progress` |
| 8 | Target pass + budget ceiling at same observation | `runtime_status: "timeout"`; budget keeps priority |

Regression companions kept green:

- `probe/test/capabilityRunnerSmoke.test.ts`
- `probe/test/capabilityBudgetStopping.test.ts`

## 8. Verification evidence

Working directory: repository root unless noted.

| Check | Result |
| --- | --- |
| Focused tests (`capabilityEarlyCompletion`) | 8 pass |
| `cd probe && bun test` | run after action-level land |
| `cd probe && bun run typecheck` | pass |
| `cd docs && npm run build` | pass when docs change |
| `git diff --check` | pass |

Push: not authorized unless the user asks.

No provider HTTP request, Docker/Minecraft live run, package install, or later
repair-plan item was started in this wave.

## 9. Review findings closed by the action-level refinement

1. **Cycle-only observation (P1)** — observer now runs after each completed
   action with an in-progress cycle upsert so adapters and action counts see
   current evidence; the next action does not start when the target passes.
2. **Weak tests (P2)** — added `maxActionsPerCycle: 2` counterexamples,
   `runCapabilityCase` disk raw/normalized regression, and budget-vs-target
   same-boundary coverage.
3. **Stale handoff (P2)** — `handoff-prompt.md` now points at item 5 (failure
   attribution / CLI), not a re-run of early completion.
4. **Wording (P3)** — avoid “as a gate”; use “required check”.

## 10. What this does and does not prove

### Proven (provider-free)

- The runtime can stop before the next **action** (and therefore before the next
  cycle) when an observer reports a passed target.
- That stop is distinct from budget timeout / `budget_exhausted`, including when
  both are visible at the same observation boundary.
- First progress and target completion can be recorded with cycle, action,
  wall, request, and token counts from the existing observation path.
- Partial and no-progress paths remain truthful.
- Production evaluation reuses the same adapters and predicates as final
  normalization; disk raw and normalized reports share `capability_progress`.

### Not proven

- That a live provider model will actually pass any capability target earlier.
- That GPT-5.4 Mini (or any other model) is competent after the goal/placement/
  scan repairs.
- Mid-request cancellation of live provider SDKs (still an A3/A5 open item).
- Repair plan items 5–8 (attribution/CLI, Action Card reduction, dashboard
  usage observations, portable archives, live reruns).

## 11. Next work (do not start from this document alone)

From the active repair plan, remaining order after this accepted item:

1. improve failure attribution and CLI summary order;
2. reduce repeated Action Card input without changing action availability;
3. add conservative external dashboard usage observations to preflight;
4. add portable archive relocation and approved-preflight linkage;
5. run full provider-free CLI checks as a required check;
6. ask the user for a new current-day allowance before one `collect_logs` and
   one wooden-pickaxe live rerun.

Any live rerun still requires exact `(provider, model, budget)`, quota
preflight, and explicit user approval.

## 12. Related documents

| Path | Role |
| --- | --- |
| `handoff-prompt.md` | Successor packet for item 5 (failure attribution / CLI) |
| `project-docs/research/benchmarks/capability-live-validation-repair-plan.md` | Full repair order; item 4 is this work |
| `project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/README.md` | Evidence that motivated the repairs |
| `project-docs/research/benchmarks/v4-implementation-explanation.md` | Broader V4 implementation map |
| `implementation-notes.md` | Branch-local progress and deviations |

