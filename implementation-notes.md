# V4 Implementation Notes

Branch: `codex/capability-gated-social-sandbox-v4`
Handoff: `handoff-prompt.md` (item 5 completed in the current Goal run; refresh before successor use)

## Current focus

The first GPT-5.4 Mini capability campaign is complete and must not be rerun
unchanged. The active work is
`project-docs/research/benchmarks/capability-live-validation-repair-plan.md`.
Items 1–4 are complete provider-free: exact goal delivery, explicit placement,
diverse world scan, and evidence-based early completion with **action-level**
stop (after each completed action, not only after each cycle). Detailed
writeup:
`project-docs/research/benchmarks/capability-early-completion-implementation.md`.
Item 5 is now complete provider-free: capability context must match the selected
case and manifest, action-selection results remain separate from runtime and
predicate results, and the CLI prints the capability result before the runtime
status. Next is evaluator-neutral goal wording and Action Card input reduction.
No new provider request is authorized.

Implementation style: default-strength `DietrichGebert/ponytail` at `14a0d79`
via the adaptation in the active implementation plan.

## Accepted (provider-free)

- A1R, A2, A3, A4, B1, B2
- C1/C2 declarations, C3 format/writer, D1 writer/index fixture
- B3 case declarations only (live blocked)
- Live-validation repair items 1–4 (goal, placement, scan, early completion
  including action-level stop)
- Live-validation repair item 5 (failure attribution and CLI summary order)

## Partial / blocked

- A5 / B3 live / live multi-actor: exact provider+model, estimate, preflight,
  and approval required
- D2: user must select a D1 candidate (fixture is not eligible)
- Push/PR: only on request
- Live restart survival: offline restart-observation writer exists; no current
  process-restart evidence yet

## Validation snapshot

- `cd probe && bun test test/capabilityEarlyCompletion.test.ts` → 10 pass
- focused runtime/capability set → 37 pass
- focused capability attribution set → 45 pass
- `cd probe && bun test` → 747 pass
- `cd probe && bun run typecheck` → pass
- `cd docs && npm run build` → pass
- `git diff --check` → pass
- No live provider request in this wave

## Deviations

| Plan said | Reality | Choice | Revisit |
| --- | --- | --- | --- |
| Item 4 “after each completed action” | First land (`d852be2e`) only observed after each cycle | Treated as partial until action-level follow-up | Closed by action-level refinement |
| Cycle upsert before observe | Adapters only see `report.cycles` | Upsert in-progress cycle + settlement refresh after each action | Keep |
| In-progress cycle appeared in prior history for action 2 | Current action verdict and evidence were duplicated in Actor Turn input | Exclude the current cycle before adding local attempts | Closed by `0a29b1c4` |
| Runtime classifier failed after Minecraft execution | The action attempt and capability observation were skipped and the failure was called provider failure | Write a validated fallback judgment, preserve the attempt/evidence, observe target progress, and keep runtime failure separate | Closed by `0a29b1c4` |
| Handoff pointed at early completion after docs claimed next was attribution | Stale handoff risk | Rewrote `handoff-prompt.md` to item 5 | Keep current |
| A report could be normalized without proving that the declared goal reached Actor Turn | Target evidence alone could pass an old or mismatched run | Require exact `capability_case_context` case, goal, and manifest hash; otherwise report `unverifiable` | Keep |
| Bun's test runner did not expose nested CLI stdout through `node:child_process` | The real CLI emitted JSON outside the test runner, but nested stdout was empty under `bun test` | Extract the exact CLI summary builder, keep the subprocess artifact check, and assert field order through the same builder | Revisit only if Bun exposes nested stdout reliably |

## Recent commits (this successor wave)

| Hash | Subject |
| --- | --- |
| `d852be2e` | probe: stop capability runs on target evidence |
| `962440af` | probe: stop capability runs after each action |
| `0a29b1c4` | probe: preserve action-level capability evidence |
