# Capability Live-Validation Repair Plan

Search token: `CAPABILITY_LIVE_VALIDATION_REPAIR_2026_07_11`.

Status: active. Implementation started on 2026-07-11.

This plan repairs the measurement path exposed by the first
`openai-api:gpt-5.4-mini` capability runs. The next live result should measure
the declared Minecraft goal rather than prompt omissions, invented physical
arguments, or a ground-dominated world scan.

The source run report is
`project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/README.md`.
No further provider-backed run is authorized by this plan. All implementation
and checks remain provider-free until a new current-day preflight and explicit
user approval.

## Review Decision

The proposed direction is correct, with four refinements:

1. A capability run must expose a typed case context in Actor Turn, not reuse
   the old free-form `benchmarkTask` option.
2. The existing `current_state` is the model-visible initial and updated state.
   The capability manifest should not duplicate inventory, coordinates, or
   scenario setup into a second state description.
3. Capability runs must suppress scenario task prose that reveals milestones or
   a preferred action order. Scenario manifests and setup evidence remain
   available to the runtime and later reviewers.
4. Action Card reduction must preserve every executable action. The first
   change is shared descriptions and explicit duplicate relationships, followed
   by a measured input-size comparison. No action is hidden because two entries
   appear similar.

The first live campaign remains a `DIAGNOSABLE_FAILURE`: artifact recording was
good enough to locate defects, but the run does not establish individual
Minecraft competence.

## Boundaries

This work includes:

- declared capability goal delivery;
- physical placement argument validation;
- query-neutral world-scan sampling;
- evidence-based early completion;
- clearer result attribution and CLI output;
- lossless Action Card input reduction;
- external dashboard usage in preflight inputs;
- portable archived report references.

This work does not include:

- a longer run or a new model comparison;
- the diamond-pickaxe rerun;
- goal-continuity live restart work;
- multi-actor or social-sandbox execution;
- a hidden Minecraft planner, resource-specific scan priority, or inferred
  action parameters;
- a research claim based only on better instrumentation.

## Work Order

### 1. Deliver the declared goal without revealing the answer

Add a typed `capability-case-context/v1` value containing only:

- `case_id`;
- `top_level_goal`;
- `manifest_hash`.

`runCapabilityCase` passes it into `runSocialCycle`. The runtime records it at
the report level, attaches it to each Actor Turn input, and uses the exact
top-level goal for the capability Active Episode and CycleGoal. The model also
receives the ordinary `current_state` and source evidence already assembled by
the runtime.

When this context is present, `worldScenario.worldEventSummary` is not added to
provider context. This removes both kinds of contamination seen in the first
campaign:

- the generic natural-spawn “early-survival progress” objective;
- the wooden-pickaxe fixture text listing logs, planks, sticks, the table, and
  the final pickaxe.

The manifest target, milestones, completion policy, and evidence kinds remain
outside Actor Turn. They are read only by the capability evaluator.

Files expected to change:

- `probe/src/runtime/goals/types.ts`
- `probe/src/runtime/goals/actorEpisode/types.ts`
- `probe/src/runtime/goals/actorEpisode/turnInput.ts`
- `probe/src/runtime/goals/actorEpisode/validators.ts`
- `probe/src/runtime/socialCycleRunner.ts`
- `probe/src/benchmarks/capability/runner.ts`
- focused tests under `probe/test/`

Completion checks:

- two cases using `natural-safe-spawn-v1` save different Actor Turn capability
  contexts;
- the saved input includes the chosen `case_id`, exact `top_level_goal`, and
  `manifest_hash`;
- saved Actor Turn input contains no manifest target, milestone list, completion
  policy, or allowed evidence list;
- the wooden-pickaxe capability input does not contain the scenario's preferred
  prerequisite sequence;
- non-capability social-cycle behavior remains unchanged.

Before any future small-budget run, revise evaluator-oriented wording in the
diamond-pickaxe goal and its model-visible case ID. A model-facing goal should
state the desired world outcome; the small-budget expectation belongs in case
metadata or report interpretation, not in the instruction to the actor. This
was completed in suite 1.3.0 with the neutral `acquire_diamond_pickaxe` ID.

### 2. Require an explicit crafting-table placement target

Make `targetPosition` or another already supported structured placement form
mandatory for `place_block`, including `placeCraftingTable`. The action skill
may still supply the known item name `crafting_table`; it may not supply a
coordinate the model omitted.

Define the seed action skill's input schema beside the seed action skill and
persist it into actor-owned action-skill state. The provider tool schema then
requires a structured target before selection can become an executable action.
The runtime performs the same validation again before Mineflayer execution.

Remove the adjacent-cell fallback from `readPlacementTarget`. If a malformed
record reaches execution, return a recorded blocked result without calling
`placeBlock`.

Extend the existing Action Card hint to include `Place Crafting Table`. It must
point the model to `current_state.world_scan.named_block_examples` and
`nearby_block_observations`; it must not choose a coordinate.

Files expected to change:

- `probe/src/gameplay/seedSkills/registry.ts`
- `probe/src/runtime/actorWorkspaceStore.ts`
- `probe/src/runtime/actionSurface.ts`
- `probe/src/runtime/goals/actionParameterContracts.ts`
- `probe/src/runtime/goals/actorEpisode/actionCardSelection.ts`
- `probe/src/runtime/socialCycleExecution.ts`
- direct runtime and provider-input tests

Completion checks:

- `{}` for `placeCraftingTable` is rejected before Mineflayer placement;
- no adjacent position is generated for missing input;
- an explicit replaceable target remains executable and verifiable;
- the provider-visible schema and hint both describe the same required shape.

### 3. Preserve spatial and block-name diversity in world scans

Mineflayer's nearest-first `findBlocks` result must not also be the final
provider sample. Request a larger bounded candidate pool, verify candidates
with `blockAt`, then select the recorded sample with query-neutral strata:

- distance bands;
- horizontal direction sectors;
- vertical bands relative to the actor;
- a small per-block-name minimum when the candidate pool contains that name.

No Minecraft resource name receives special treatment. The algorithm operates
only on position, distance, and exact observed block name.

The scan records both candidate-pool size and retained-sample size. If the
requested radius is 32 but the retained sample has weak outer-band or sector
coverage, limitations say so directly. `truncated` continues to forbid global
absence claims.

Files expected to change:

- `probe/src/tools/worldStateScan.ts`
- `probe/src/tools/observe.ts` only if candidate and retained limits need
  separate settings
- `probe/src/runtime/goals/actorEpisode/currentStateProjection.ts`
- `probe/test/worldStateScan.test.ts`
- provider-input projection tests

Completion checks:

- a dense near-ground fixture plus a farther block type retains at least one
  verified example of the farther type;
- rotating the fixture produces comparable sector coverage;
- the result is deterministic for identical candidates;
- no block-name priority list exists;
- all limitations still describe loaded-client-cache and sampling bounds.

### 4. Stop when the declared target passes

After each completed action, adapt current report evidence into a capability
evidence bag and evaluate target and milestones with the existing predicate
evaluator. Do not inspect provider prose, tool names, or scenario text.

Because the generic social runner must not import benchmark policy, pass an
optional callback from `runCapabilityCase`. The callback receives saved report
and actor-workspace state and returns only a typed progress observation:

- target status;
- passed milestone identifiers;
- evidence refs.

The generic runner owns the stop decision from that observation; the callback
does not return stop policy.

Record time, provider requests, tokens, runtime actions, and completed cycles at
first measurable progress and at target completion. Flush the report before
cleanup when target completion stops the loop.

Completion checks:

- a provider-free case whose target passes on the first action does not start a
  second action or cycle;
- target completion is distinct from budget stopping;
- clean runtime exit without target evidence still does not become capability
  success;
- timing and usage values are present even when the target never passes.

### 5. Attribute failure at the right layer

Keep these independent in normalized results:

- `runtime_status`: process, provider, environment, or Minecraft execution;
- target and milestone status: capability evidence;
- action-selection result: valid selection, malformed parameters, repeated
  blocker, or no measurable goal progress;
- interpretation status and failure class.

Add or reuse explicit failure values so that:

- absent capability context makes the run `unverifiable`;
- successfully executed actions with no target or milestone change become
  `no_measurable_progress`;
- malformed structured parameters remain an action-selection/input failure;
- Mineflayer or environment failures remain separate.

CLI summaries print target, milestone progress, interpretation, and stop reason
before the lower-level runtime status.

Completion checks use counterexamples for each attribution. A movement-only
action under a log-collection goal must not be described as Minecraft execution
failure when movement itself was verified.

### 6. Reduce repeated Action Card input without removing actions

Measure the current serialized Actor Turn input first. Then move repeated
parameter rules, evidence rules, and common explanatory prose into one shared
provider-visible section referenced by cards. Each card keeps:

- stable ID and title;
- what distinct behavior it offers;
- its structured parameter schema reference;
- readiness and current-state hints that are specific to that action;
- expected evidence and blockers that differ from the shared rules.

When a direct primitive and actor-owned action skill overlap, record their
relationship explicitly. Keep separate selectable entries only when the action
skill supplies meaningful multi-step behavior, local verification, ownership,
or recovery beyond the primitive.

Completion checks:

- the set of runtime mappings before and after the change is identical;
- every previously executable action remains selectable;
- provider tool schemas remain strict;
- representative serialized Actor Turn input is smaller, with the byte and
  token estimate recorded in tests or a provider-free measurement artifact.

Implemented provider-free on 2026-07-12. The archived and new representative
inputs expose the same 32 Action Card titles. The former card array was 38,505
bytes / 9,627 locally estimated tokens; the new card array plus its one shared
guidance section is 26,124 bytes / 6,532 locally estimated tokens. This is a
reduction of 12,381 bytes and 3,095 estimated tokens (about 32.2%) on the action
surface. A same-input regression also rebuilds the repeated form and verifies
18,073 → 14,204 bytes and 4,519 → 3,551 estimated tokens. Runtime mapping tests
compare the generated mapping set with every executable primitive and
actor-owned action skill, and every function schema remains strict.

### 7. Include external dashboard usage in preflight

Extend the approval input with a structured `external_already_used` observation:

- provider and quota day;
- requests and tokens already used;
- observation time;
- period certainty and source note.

Only a confirmed matching UTC quota day is numerically combined. When local and
dashboard numbers overlap ambiguously, use the more conservative remaining
capacity rather than adding two possibly overlapping totals. Preserve both raw
observations and the chosen calculation in the preflight output.

Completion checks cover confirmed same-day usage, ambiguous periods, stale
observations, and a dashboard value larger than the local ledger.

### 8. Make archived reports portable

Do not rewrite raw evidence silently. Add an archive relocation record that maps
the original actor-workspace root to its repository-relative archived root.
Report readers resolve the archived mapping before the original absolute path.

Add the approved preflight ref directly to archived report metadata or a
sidecar that the readiness checker recognizes. Verify the process from a fresh
temporary copy of the repository subtree where the original `tmp/` path does
not exist.

Completion checks:

- all actor-workspace refs resolve from the archived copy;
- the original absolute path is not required;
- report readiness finds the exact approved preflight record;
- raw JSON remains byte-identical unless a separately named normalized archive
  artifact is intentionally produced.

## Provider-Free Verification

Run focused tests after each work item. Before asking for a live rerun, run:

```bash
cd probe
bun test
bun run typecheck

cd ../docs
npm run build

cd ..
git diff --check
```

Also run one provider-free capability CLI execution for `collect_logs` and one
for `craft_wooden_pickaxe`, then inspect saved Actor Turn inputs, normalized
reports, budget status, and artifact references. Provider-free runs prove input
and recording shape; they do not prove Minecraft competence.

## Future Live Check

Only after all provider-free checks pass and the user approves a new current-day
allowance:

1. run `collect_logs` once in `natural-safe-spawn-v1`;
2. review the saved Actor Turn goal, scan diversity, chosen action, runtime
   evidence, target status, and usage;
3. stop if the run exposes a new measurement defect;
4. otherwise run `craft_wooden_pickaxe` once in the controlled fixture;
5. review with `minecraft-agent-runtime-review` and author the result with
   `minecraft-run-report-author`.

Do not automatically run the infeasible case, extend cycle counts, add models,
or start social simulations from this plan.

## Progress

- [x] Recheck the conclusions against live artifacts and current code.
- [x] Record the implementation and verification plan.
- [x] Deliver typed capability goal context and remove scenario task leakage.
- [x] Require explicit crafting-table placement targets.
- [x] Improve query-neutral world-scan sampling.
- [x] Add evidence-based early completion and measurements
  (action-level stop after each completed action; no duplicated current-action
  input; executed evidence survives runtime classification failure).
- [x] Improve failure attribution and CLI summary order. Missing or mismatched
  capability context is `unverifiable`; structured action-input failures,
  repeated blockers, runtime failures, and no-goal-progress executions remain
  separately visible; CLI output leads with target, milestones, interpretation,
  and stop reason.
- [x] Remove evaluator wording from model-facing goals and reduce repeated
  Action Card input without changing action availability. The 32-title action
  surface is unchanged; shared guidance and overlap IDs replace repeated prose.
- [ ] Add external usage observations to preflight.
- [ ] Add portable archive relocation and preflight linkage.
- [ ] Complete all provider-free checks.
- [ ] Request approval for two bounded live reruns.
