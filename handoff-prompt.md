# Successor Agent Prompt: Finish the Reviewed V4 Implementation

You are continuing the V4 Minecraft social-sandbox implementation after a
whole-project review. Work from the verified repository state below. Do not
redo A1R or restore the pre-review completion summary.

Use plain engineering and research language: schema, data format, step,
requirement, condition, result, evidence, and decision. Preserve exact branch,
file, and code identifiers when they must be spelled literally.

## Objective

Finish the two remaining provider-free implementation gaps that prevent a safe
live run:

1. make every manifest-specific A3 budget stop execution and leave a truthful
   saved result;
2. make B2 load and validate saved continuity evidence instead of accepting an
   already-typed in-memory object.

After those are complete, stop before provider use unless the user supplies an
exact provider/model/budget and explicitly approves the run after quota
preflight. Do not begin D2 unless the user selects a real D1 observation record.

## Definition of Done

- A3 stops safely on cycle, total action, wall-time, provider-request, token,
  and estimated-cost limits declared by the selected capability case.
- A3 writes a declaration and a truthful raw/normalized/budget result even when
  a limit stops the run; no provider or Minecraft work continues in the
  background after the command returns.
- B2 has a strict recursive loader for
  `goal-continuity-artifact-bag/v1`, resolves root-safe saved refs, validates
  each supported artifact shape, and rejects actor/run/schema/ref mismatches.
- A restart-required continuity result remains `unverifiable` without distinct
  before/after durable reload evidence and at least one matching open work id.
- Focused tests, the full probe suite, typecheck, docs build, and diff check pass.
- Status docs describe only what the code and saved outputs prove.
- No live provider request is made without the required user decision.

## Current Repository State

- Repository: `/Users/gigio/git/minecraft-llm-agent-community`
- Branch: `codex/capability-gated-social-sandbox-v4`
- Reviewed implementation commit: `620955d8`
- Branch state after that commit: ahead of origin by 14; not pushed
- Provider use in the review: none
- Minecraft live run in the review: none
- Review validation:
  - `cd probe && bun test` -> 688 pass, 0 fail across 104 files
  - `cd probe && bun run typecheck` -> pass
  - `cd docs && npm run build` -> pass
  - `git diff --check` -> pass

Before editing, run `git status -sb` and inspect the latest commits. Preserve
any new user changes if the live worktree differs from this handoff.

## Authority And Required Reading

Read these completely before implementation:

1. `SPEC.md`
2. `AGENTS.md`
3. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
4. `project-docs/orientation/agent-search-index.md`
5. `project-docs/orientation/terminology.md`
6. `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`
7. `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`
8. `project-docs/research/benchmarks/v4-implementation-explanation.md`
9. `implementation-notes.md`

For provider-backed work, read and use
`.agents/skills/provider-quota-preflight/SKILL.md` before any HTTP request.
For a real Minecraft run review, use
`.agents/skills/minecraft-agent-runtime-review/SKILL.md`.

Binding rules:

- Bun is the only runtime for repo TypeScript.
- Runtime observations and verifiers decide Minecraft truth.
- Provider text, tool names, memory prose, PlanBead prose, screenshots, and
  video do not establish physical success.
- Do not derive executable parameters, permissions, retry clearance, or success
  from natural-language text.
- Preserve setup evidence separately from actor progress.
- Do not add a hidden Minecraft planner or action shortlist.
- Screenshots and video are review aids only.
- Use `apply_patch` for source and documentation edits.
- Keep `implementation-notes.md` current when code reality changes the plan.
- Commit each coherent completed repair with detailed Why/What/Validation
  sections. Do not push unless the user asks.

## Reviewed Status

### Accepted provider-free work

- A1R: strict individual capability manifest and typed predicates
- A2: normalized capability report adapter
- A4: basic capability suite declaration
- B1: manifest-owned multi-hop furnace case

### Partial work

- A3: CLI and provider-free smoke work; cycle and total-action limits are now
  enforced, but wall time, provider requests, tokens, and cost are not yet
  manifest-specific runtime stops.
- B2: offline evaluator and fixtures work; strict saved-evidence loading and a
  runtime restart-observation writer are missing.

### Declaration or writer work only

- B3: three continuity case declarations; no live execution
- C1/C2: social scenario schema and economic/cooperative/quest declarations;
  every checked-in capability requirement is an explicit gap
- C3: observation bundle schema, writer/index, public export, and fixture; no
  live capture or metric producer
- D1: phenomenon writer/index and fixture; no real recurring observation
- D2: not started and unavailable until user selection

## Review Findings Already Fixed

Do not regress these behaviors:

1. Restart continuity
   - A single open PlanBead or Active Episode cannot prove survival across a
     restart.
   - Typed before/after refs must be distinct.
   - At least one open work id must appear before and after reload.

2. Checkpoint conflicts
   - Version mismatch fields decide conflicts.
   - Words in `reason` do not create a conflict.

3. Capability dependencies in social declarations
   - A case entry in `individual-capability-v1.json` is not capability evidence.
   - `evidence_status: resolved` requires an exact caller-confirmed normalized
     report ref.
   - Checked-in declarations currently use `declared_gap` honestly.

4. Observation metrics and writers
   - Numeric values require structured evidence refs.
   - Run/join timestamps must be valid ISO date-times.
   - A bundle needs at least one structured source ref.
   - Bundle and index filenames cannot escape their output directory.

5. Phenomenon records
   - There is no manually set `is_research_result` field.
   - File ids and refs must be root-safe relative values.
   - A fixture cannot become `selected_for_followup`.

6. Capability runner
   - Empty cycles count as zero runtime actions.
   - Debug overrides cannot exceed the declared cycle/action maximum.
   - `allowed_evidence_kinds` must cover every target and milestone predicate.

Evidence for these repairs is commit `620955d8` and the focused tests in:

- `probe/test/capabilityRunnerSmoke.test.ts`
- `probe/test/goalContinuityEvaluator.test.ts`
- `probe/test/individualCapabilityManifest.test.ts`
- `probe/test/interdependentSocialScenario.test.ts`
- `probe/test/longRunObservationBundle.test.ts`
- `probe/test/phenomenonCatalog.test.ts`
- `probe/test/socialScenarioFamilies.test.ts`

## Work 1: Complete A3 Budget Stopping

Start by reading:

- `probe/src/benchmarks/capability/runner.ts`
- `probe/src/benchmarks/capability/report.ts`
- `probe/src/benchmarks/capability/reportTypes.ts`
- `probe/src/runtime/socialCycleRunner.ts`
- `probe/src/runtime/socialCycleTurnCore.ts`
- `probe/src/provider/providerUsageTracker.ts`
- `probe/test/capabilityRunnerSmoke.test.ts`
- `probe/test/providerUsageTracker.test.ts`

Required behavior:

- Keep the existing repository-wide provider budget protection. Case-specific
  limits add stricter stopping; they never weaken global protection.
- Extend the runtime through an explicit abort/deadline mechanism. Do not use a
  `Promise.race` that returns while Minecraft/provider work keeps running.
- Check wall time before each new provider or runtime action and propagate
  cancellation into work that can block.
- Count provider requests and tokens from saved usage records, not estimated
  text or tool names.
- Use the declared estimated-cost ceiling only with the repository's existing
  normalized usage/cost data. If cost cannot be computed, stop or report
  `unverifiable`; do not guess.
- Extend `capability-budget-status/v1` so each declared limit has an observed
  value and an explicit stopped/exhausted state.
- Distinguish a budget stop from actor incompetence, provider failure, runtime
  failure, and verifier failure.
- Write the case declaration before work begins and preserve partial raw output
  on a stop.

Tests must cover:

- wall-time stop with a deterministic delayed fake;
- provider-request stop before the next request;
- token stop from saved normalized usage;
- cost stop or an explicit unverifiable result when cost is unavailable;
- cancellation leaves no continued background action;
- cycle/action behavior from `620955d8` remains correct;
- zero-provider deterministic smoke still records zero live requests.

Do not make a real provider request while implementing or testing this work.

## Work 2: Complete B2 Saved-Evidence Loading

Start by reading:

- `probe/src/benchmarks/continuity/types.ts`
- `probe/src/benchmarks/continuity/loader.ts`
- `probe/src/benchmarks/continuity/evaluator.ts`
- `probe/benchmarks/continuity/fixtures/*.json`
- `probe/test/goalContinuityManifest.test.ts`
- `probe/test/goalContinuityEvaluator.test.ts`
- `probe/src/runtime/goals/planBeads/**`

Add a strict loader for `goal-continuity-artifact-bag/v1`.

It must:

- reject unknown keys recursively;
- validate the bag schema, actor id, run id, required refs, and arrays;
- require root-safe relative refs and reject absolute/escaping/URI refs;
- reject duplicate refs across incompatible collections;
- verify each `present: true` entry has an artifact with the exact expected
  schema and required fields;
- verify artifact actor ids match the bag actor where the source format has an
  actor id;
- verify required refs resolve and that declared missing refs remain visible;
- validate operation status/op/patch fields without reading `reason` prose;
- validate checkpoint versions as non-negative integers;
- validate restart observations recursively, including distinct before/after
  refs, non-empty source refs, and valid open work id arrays;
- load JSON from a declared actor/run root without following paths outside it;
- pass only validated data into `evaluateGoalContinuity`.

Add negative tests for every rule above. Replace test-only unchecked JSON casts
where practical with the new loader.

Then add the smallest provider-free writer/helper needed for the runtime to
record a typed restart observation. Do not say restart survival works live until
an actual process restart or durable reload produces current-run evidence.

## Work 3: Documentation And Status

After A3 and B2 are actually complete, update:

- `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`
- `project-docs/research/benchmarks/v4-implementation-explanation.md`
- `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
- `project-docs/orientation/agent-search-index.md`
- `implementation-notes.md`
- this handoff file if another transfer is needed

Do not mark A5, B3 live, C2 live, C3 live, or D1 discovery complete from unit
tests or fixture files.

## Provider And User Decision Points

After A3 and B2 pass all provider-free checks:

1. Present the exact proposed `(provider_id, model)` and whole-run estimate.
2. Run the repo-local provider quota preflight.
3. Treat `blocked`, `unbudgeted`, and `needs_dashboard_approval` as not runnable.
4. Obtain the required explicit user approval.
5. Run only the approved command and budget.

No live run is authorized by this handoff itself.

D2 remains separate. Only a real D1 observation record with recurrence,
competence controls, evidence refs, and user selection can enter D2. The fixture
record is permanently ineligible.

## First Three Actions

1. Run:

   ```bash
   cd /Users/gigio/git/minecraft-llm-agent-community
   git status -sb
   git log -4 --oneline --decorate
   ```

   Confirm the expected branch and preserve any newer changes.

2. Read the A3 files listed above and write failing provider-free tests for
   wall-time cancellation and provider-request stopping. Confirm they fail for
   the intended missing behavior.

3. Implement A3 with `apply_patch`, run the focused tests, and do not start B2
   until all declared A3 limits have truthful stopping and saved results.

## Verification

For each coherent implementation step:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community/probe
bun test test/capabilityRunnerSmoke.test.ts
bun run typecheck
cd /Users/gigio/git/minecraft-llm-agent-community
git diff --check
```

Before final delivery:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community/probe
bun test
cd /Users/gigio/git/minecraft-llm-agent-community/docs
npm run build
cd /Users/gigio/git/minecraft-llm-agent-community
git diff --check
git status -sb
```

## Final Delivery

Lead with what now works and what remains unproven. Include:

- commits in order;
- focused/full test counts, typecheck, docs build, and diff result;
- exact saved output paths for any runtime run;
- provider preflight and actual usage if provider work was approved;
- remaining implementation gaps;
- whether D1 contains real observations or only the fixture;
- branch push state.

Do not call V4 complete until current-run capability, continuity, and live
multi-actor evidence exist and the remaining work in the active plan is truly
finished.
