# V4 Implementation Notes

Branch: `codex/capability-gated-social-sandbox-v4`
Handoff: `handoff-prompt.md` (item 5 completed in the current Goal run; refresh before successor use)

## Current focus

The active A5 target is now `prepare_first_iron_batch` in capability suite
`1.4.0`, not five disconnected wood-only cases. Its controlled fixture begins
with empty inventory and exposes wood, stone, coal ore, and iron ore without
crediting setup. The final predicate requires `raw_iron >= 3`, `coal >= 1`, a
`stone_pickaxe`, and a placed furnace. Per-milestone first observations retain
action/cycle, elapsed time, provider usage, and evidence even after transient
items such as crafting tables or furnace items are consumed.

The 2026-07-11 GPT-5.4 Mini capability campaign is complete and must not be
rerun unchanged. The active work is
`project-docs/research/benchmarks/capability-live-validation-repair-plan.md`.
Items 1–4 are complete provider-free: exact goal delivery, explicit placement,
diverse world scan, and evidence-based early completion with **action-level**
stop (after each completed action, not only after each cycle). Detailed
writeup:
`project-docs/research/benchmarks/capability-early-completion-implementation.md`.
Item 5 is now complete provider-free: capability context must match the selected
case and manifest, action-selection results remain separate from runtime and
predicate results, and the CLI prints the capability result before the runtime
status. Item 6 is also complete provider-free: model-facing goals now describe
only Minecraft outcomes, including a neutral model-visible diamond case ID.
Repeated Action Card guidance is shared once, direct primitive/action-skill
overlaps are explicit, all runtime mappings remain visible, and strict function
schemas are unchanged. Item 7 is complete provider-free: preflight accepts a
strict dated dashboard-usage observation and records the conservative chosen
calculation. Item 8 is complete provider-free: unchanged raw reports use
SHA-256-bound relocation sidecars for repository-relative actor workspaces and
the exact approved preflight. The complete provider-free verification sequence
and both required capability CLI checks are now done. The first newly approved
`collect_logs` command stopped during world setup with zero provider requests
because its fixed seed had no loaded log inside the declared radius. Suite
1.3.1 changes only that seed to the provider-free-verified `9066`. The approved
retry reached Actor Turn but background Responses polling crossed its request
maximum and an evidence-free stopping-time Deliberation branch raised before
final settlement. Both paths are repaired provider-free; another live attempt
requires approval of the saved 5-request / 150,000-token planning preflight.

Implementation style: default-strength `DietrichGebert/ponytail` at `14a0d79`
via the adaptation in the active implementation plan.

## Accepted (provider-free)

- A1R, A2, A3, A4, B1, B2
- C1/C2 declarations, C3 format/writer, D1 writer/index fixture
- B3 case declarations only (live blocked)
- Live-validation repair items 1–4 (goal, placement, scan, early completion
  including action-level stop)
- Live-validation repair item 5 (failure attribution and CLI summary order)
- Live-validation repair item 6 (evaluator-neutral goals and lossless Action
  Card input reduction)
- Live-validation repair item 7 (structured external dashboard usage in
  provider preflight)
- Live-validation repair item 8 (portable archived report resolution and exact
  approved-preflight linkage)

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
- focused manifest and Actor Turn input set → 54 pass
- provider-free `collect_logs` measurement run → completed without provider
  calls; expected deterministic budget exhaustion remained truthful
- same 32 Action Card titles in the archived and new representative inputs;
  old card array 38,505 bytes / 9,627 estimated tokens, new card array plus
  shared guidance 26,124 bytes / 6,532 estimated tokens (12,381 bytes and 3,095
  estimated tokens fewer; about 32.2%)
- same-input shared-guidance regression: 18,073 → 14,204 bytes and 4,519 →
  3,551 estimated tokens
- `bun test probe/test/providerQuotaPreflightScript.test.ts` → 7 pass
- `bun test probe/test/reportReadinessCheckScript.test.ts` → 4 pass
- all three archived 2026-07-11 raw reports → publishable readiness passed,
  with archived workspaces and the approved preflight resolved from sidecars
- final provider-free `collect_logs` / `craft_wooden_pickaxe` runs → 40 / 80
  Actor Turn inputs inspected, 468 actor-workspace refs resolved, 0 provider
  requests, 0 tokens, and no evaluator-only fields in model input
- all three actual 2026-07-11 raw reports re-evaluated → `unverifiable`
- repaired Stage 1 campaign preflight → `allowed` after explicit approval of at
  most 32 requests / 1,200,000 tokens; current UTC day local ledger and
  exact-day OpenAI dashboard both showed 0 requests / 0 tokens; billing showed
  a `$3.80` credit balance and Data controls confirmed complimentary daily-token
  enrollment for API input/output sharing
- first approved `collect_logs` command → `environment_blocked` /
  `world_setup_failed`, 0 cycles, 0 actions, 0 provider requests, and 0 tokens;
  the archived report passes publishable readiness and is not capability
  evidence
- current Minecraft 1.21.11 setup with seed `9066` → provider-free fresh-world
  smoke passed with oak logs 28.46 blocks away; provider-free capability smoke
  passed setup with the nearest oak log 17.12 blocks away
- second approved `collect_logs` command → exact goal reached two Actor Turns;
  no evaluator-only fields were present; `collectLogs` blocked with empty
  inventory and oak-log hints about 30.5 blocks away; 11 requests / 39,627
  tokens were recorded against the approved 8-request / 300,000-token maximum;
  final report readiness failed because the stopping-path exception prevented
  provider usage settlement
- provider-free request/stop repair → focused 30 pass; request-bounded OpenAI
  stages disable background polling and internal retries; stopping-time or
  evidence-free Deliberation branches are not persisted
- `cd probe && bun test` → 753 pass
- `cd probe && bun run typecheck` → pass
- `cd docs && npm run build` → pass
- `git diff --check` → pass
- The first approved live command stopped before the first provider request;
  its observed provider usage remained zero

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
| The plan asked for one shared Action Card explanation | Repetition also existed in every provider function description and actor-owned action-skill hint list | Put general, evidence, and grouped guidance in `action_card_shared_guidance`; keep per-card behavior/state details and strict function schemas | Revisit after the next approved live run if tool selection quality regresses |
| A historical and a current full Actor Turn input differed in more than Action Cards | World state and capability context also changed between runs | Compare the identical 32-title Action Card surface only, then add a same-input re-expansion regression for isolated measurement | Keep both measurements with their stated scope |
| Dashboard totals may include the same calls as the local ledger | Adding both would understate remaining capacity | For confirmed current UTC-day observations, add only when disjointness is explicit; otherwise use the larger value for each metric | Revisit only if the provider exposes stable per-key usage identifiers |
| Raw reports must remain byte-identical but contain machine-local workspace roots | Rewriting the root would damage the raw audit trail | Add SHA-256-bound `report-archive-relocation/v1` sidecars and make readiness prefer the archived repository-relative root | Keep for every future archive import with a stale absolute root |
| One full-suite run hit the wall-time test once and Bun then emitted cascading `node:test` nesting errors | The earliest test passed alone, and the full suite passed when rerun without concurrent checks | Treat the first result as a Bun runner cascade, record both runs, and keep the isolated wall-time test in future verification | Revisit if the earliest test fails independently |
| The earlier dashboard screenshot covered an ambiguous multi-day period | A logged-in dashboard session was available and could be filtered to exactly `2026-07-12` without an API request | Record the exact-day zero usage separately, regenerate the unapproved preflight, and continue to require explicit approval and complimentary-pool eligibility confirmation | Recheck immediately before a live run if approval is delayed or the UTC day changes |
| A positive balance and complimentary-token enrollment were still indirect assumptions | The logged-in Billing page showed `$3.80`, and Data controls showed API input/output sharing enabled for all projects plus the complimentary-token enrollment message | Preserve a read-only observation and narrow the blocker to the newly proposed allowance's explicit approval | Recheck account and usage state if approval arrives on a later UTC day |
| The checked-in `collect_logs` seed used the scenario id string itself | The first approved run produced a safe spawn but no loaded log inside the scenario's declared 32-block bound, so setup failed before Actor Turn with zero provider usage | Change only the case's fixed seed to provider-free-verified seed `9066`, bump the suite to 1.3.1, and require a new live approval | Revisit if seed `9066` fails setup on the pinned Minecraft version or if the scenario's feasibility policy changes |
| The 8-request case maximum was checked only between provider stages | Three background OpenAI stages used 11 HTTP requests because response polling happened before the runner regained control | For request-bounded runs, disable background polling and internal retries so one stage equals one request | Revisit only if provider calls gain a reservation-aware run-local request counter |
| A budget-stopped empty cycle still evaluated context branch reasons | The branch had no new action or judgment evidence and strict validation raised before final report settlement | Do not persist Deliberation branches while stopping or without evidence refs; keep the strict validator | Revisit if context-only branches gain a typed runtime evidence source |
| A preflight test assumed the real local ledger was empty | Current live usage changed the expected value and triggered Bun's known cascading `node:test` errors | Give the test its own empty temporary ledger, then rerun it and the full suite | Keep tests isolated from operator usage |
| Public OpenAI documentation listed models beyond the operator's active dashboard notice | The operator clarified that only the supplied dashboard aliases may be complimentary-usage candidates and selected exact `gpt-5.4` | Make the operator list the executable allowlist, remove snapshots/GPT-5.5/GPT-5.6, and use public docs only for general eligibility/reset/overage rules | Update only when the operator supplies a new dashboard notice |
| Removing an unlisted OpenAI model from built-in policies still left a historical local budget capable of matching it | A local brake could accidentally promote `gpt-5.5` into preflight/runtime eligibility | Require every `openai-api` model to pass the operator-provided built-in allowlist before local budgets are evaluated | Add a separate explicit paid-model authority contract if paid OpenAI runs are later desired |
| The 2026-07-24 provider plan treated five isolated wood-only cases as the primary experiment | Those cases mostly measured short resets and could not test retention across Minecraft's real wood → stone → iron dependency boundary | Keep them as calibration probes and make one `prepare_first_iron_batch` run the primary A5 measurement | Revisit difficulty after one artifact-complete Qwen 3.8 run |
| A first iron pickaxe would be the clearest next outcome | Furnace interaction/smelting is not an implemented runtime action, so requiring ingots would measure a known substrate gap | Stop at the exact ready-to-smelt state: three raw iron, one coal, stone pickaxe retained, furnace placed | Extend to smelted ingots only after a verified furnace-use action lands |
| Final inventory snapshots were expected to describe the item path | Placed crafting tables and furnaces disappear from inventory, erasing when those items were first acquired | Persist write-once `milestone_first_observations` after every action with usage and evidence refs | Keep; add report visualization only after the first live artifact shows it is useful |

## Recent commits (this successor wave)

| Hash | Subject |
| --- | --- |
| `d852be2e` | probe: stop capability runs on target evidence |
| `962440af` | probe: stop capability runs after each action |
| `0a29b1c4` | probe: preserve action-level capability evidence |
