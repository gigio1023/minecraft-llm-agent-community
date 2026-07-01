# No-Regret Core Current Status

Status: dated implementation/status note, not long-term research authority.

Search token: `NO_REGRET_CORE_CURRENT_STATUS_2026_06_29`.

Recorded: 2026-06-29 (`Asia/Seoul`).

Use after reading:

- `Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
- `No-Regret-Core-Research-Protocol.md`
- `No-Regret-Core-Implementation-Campaign.md`

This file holds volatile status that should not live inside the stable research
spine. If it conflicts with the central plan, protocol, or implementation
campaign, treat this file as the stale one until re-audited.

## Current Dated Notes

### Pre-Run Declaration

The current campaign notes say `runSocialCycle` writes a pre-run
`no-regret-run-declaration/v1` artifact under
`reviews/no-regret-run-declarations/` before Actor Turn cycles start, and the
final report links it with `no_regret_run_declaration_ref`.

The declaration records actor ids, Soul/LifeGoal refs, seed/reset ids, explicit
scenario-pressure families, row thresholds, provider-budget guard status,
world-setup caveats, known risks, stop conditions, and whether the run can count
toward no-regret pilot evidence.

Deterministic single-actor or offline runs are declared as `competence_control`
with `counts_toward_no_regret_pilot: false`. World-scenario ids such as
`natural-safe-spawn-v1` or `wooden-pickaxe-flat-benchmark-v1` are world setup
lanes, not scenario-pressure family ids.

### Passive Observation

The current campaign notes say `runSocialCycle` accepts
`passiveObservedActorIds` / `--passive-observed-actors` and records
`actor_scope.active_actor_ids` separately from
`actor_scope.passive_observed_actor_ids`.

Passive observed actors are visibility/target scope only. They do not run Actor
Turn, do not receive active ActorSoul/LifeGoal scheduling, and do not satisfy the
2-3 active-actor no-regret requirement. Rows can cite passive scope in
response-window metadata, but `observed_actor_ids` should come from actual
observations rather than from the configured roster.

### Response Windows

The current campaign notes say the runtime has a first bounded
`transition-response-window/v1` artifact path. `runSocialCycle` opens a window at
action start, closes it on the immediate post-action observation, writes the
artifact under `evidence/response-windows/`, and passes the window into
`transition-row/v1`.

No-world deterministic rows close as `unknown_social_response` with
`loaded_world_limited` rather than pretending silence is `no_observable_response`.
Concrete reply or movement labels require explicit event evidence in the
response-window artifact.

This remains a minimum artifact surface. Multi-cycle follow-up, live 2-3 actor
target bots, chat listeners, and relationship-event windows need separate
verification before they are treated as landed.

### Batch Audit

The current campaign notes say an initial `transition-row-batch-audit/v1`
artifact path exists and can compute row contract failures, action/target
dominance, action-class coverage, label/tag distributions, bounded
response-window counts, material and interaction tag counts, and negative-result
notes from actor workspace `transition-row/v1` files. The audit now counts
`seed_or_reset_id` provenance separately from raw Minecraft seed strings so
fresh seeds, reset sessions, reused live sessions, and no-world controls do not
collapse into one bucket.

This is a calculation surface, not a completed no-regret pilot. A pilot still
needs live 2-3 active-actor evidence, counting seed/reset records,
scenario-family coverage, provider/cost evidence, and a closed batch that meets
the protocol.

### Seed/Reset Provenance

The planning contract now exists at:

```text
project-docs/research/current-spine/seed-reset-record-v1-contract.md
```

Runtime implementation and live evidence for `seed-reset-record/v1` should be
split into two states:

- artifact wiring now exists for deterministic/no-world and live-run setup
  declarations: `runSocialCycle` writes `seed-reset-record/v1` under
  `reviews/seed-reset-records/`, links it from the final report with
  `seed_reset_record_ref`, and passes the stable `seed_or_reset_id` into
  `transition-row/v1`;
- live no-regret seed/reset coverage is still not established. Deterministic
  no-world records are preserved as control evidence and explicitly set
  `counts_toward_no_regret_seed_requirement: false`.

### Visual Evidence Boundary

The active visual capture protocol now exists at:

```text
project-docs/runtime/evidence-and-verification/minecraft-visual-evidence-capture-protocol.md
```

New `prismarine-viewer` capture artifacts should carry:

- `renderer_trust: review_only_not_block_identity`;
- `block_identity_authority: runtime_world_state_scan_or_observe_evidence`;
- `state_evidence_pairing: nearest_same_cycle_observe_or_world_state_scan`;
- `known_renderer_limitations`.

This status note has older screenshots that predate the protocol. Treat those
images as review context only. If an image appears to show redstone-like blocks,
large colored cubes, missing textures, or strange patterns, check
`observe`/`worldStateSummary`/`world-state-scan/v1` artifacts before making a
block claim.

## Remaining Known Gaps

- No completed no-regret pilot batch has been established by this status note.
- Deterministic/offline artifacts remain control evidence only.
- A live 2-3 active-actor run still needs provider/cost and environment evidence.
- Older visual captures need protocol-aware captions before being reused in
  public/shareable reports.
- Goldilocks prediction preflight and society-observable preflight remain future
  branch gates.

## Next Empirical Step

The next useful movement is not broader unit-test coverage. It is a managed
artifact run that checks whether the current no-regret surfaces close together:

```text
no-regret-run-declaration/v1
seed-reset-record/v1
transition-response-window/v1
transition-row/v1
transition-row-batch-audit/v1
```

Run it first as a cheap control if provider/server setup is uncertain, then move
to a live 2-3 active-actor pilot only after provider preflight and platform
checks. A successful control run proves wiring only. A live pilot still needs
non-degenerate actor behavior, scenario-pressure coverage, counting seed/reset
records, provider/cost evidence, and a batch audit verdict before it can become
Goldilocks or society-observable preflight input.

### Managed Control Run Recorded

A deterministic no-world control run now exists:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-managed-artifact-control/
```

Run id:

```text
social-cycle-29eed2b0-81c1-4ccf-8b0a-f9ba9ed3afd8
```

The run wrote and cross-linked:

- `no-regret-run-declaration/v1`;
- `seed-reset-record/v1`;
- four `transition-response-window/v1` artifacts;
- four `transition-row/v1` artifacts;
- `transition-row-batch-audit/v1`.

The result is explicitly control evidence, not no-regret pilot evidence:

- report `runtime_status`: `blocked`;
- seed/reset `session_kind`: `deterministic_no_world`;
- `counts_toward_no_regret_seed_requirement`: `false`;
- declaration `counts_toward_no_regret_pilot`: `false`;
- batch audit verdict: `degenerate-action-loop`;
- row contract failures: `0`;
- rows contain no `predicted_delta` or `expected_outcome`.

Use this as evidence that artifact wiring closes in a managed control path. Do
not use it as evidence of 2-3 active-actor behavior, live seed/reset coverage,
Goldilocks readiness, or society-observable behavior.

### Managed 2-Active-Actor Control Recorded

A second deterministic control now checks cross-actor batch aggregation:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-managed-2active-control/
```

Batch id:

```text
no-regret-managed-batch-8775474c-08c3-4f81-892a-6292e6e80568
```

This control uses the new managed batch orchestrator:

```text
cd probe && bun run probe:no-regret-managed-batch -- --actors npc_b,npc_c ...
```

It ran `npc_b` and `npc_c` sequentially under one managed batch root, then
aggregated both actor workspaces with `transition-row-batch-audit/v1`.

Verified result:

- manifest schema: `no-regret-managed-batch-control/v1`;
- manifest status: `control_only`;
- active actor ids in the managed batch: `npc_b`, `npc_c`;
- aggregate transition rows: `8`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `2`;
- aggregate row contract failures: `0`;
- aggregate audit verdict: `cost-or-environment-blocked`;
- row bodies contain no `predicted_delta` or `expected_outcome`.

This is stronger than the single-actor artifact-control run because it proves
cross-actor aggregation works. It is still not a live 2-3 active-actor pilot:
actor turns were sequential, no-world, deterministic controls, not simultaneous
live Minecraft behavior.

### Managed 2-Active Live Deterministic Control Recorded

A third control now checks live Minecraft connection while keeping provider cost
at zero:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-managed-2active-live-deterministic-control/
```

Batch id:

```text
no-regret-managed-batch-c447a8ea-d1a3-4a6c-b32e-461e243a9bcf
```

Verified result:

- command exit code: `0`;
- live fresh-world server mode in per-actor reports: `fresh_world`;
- manifest schema: `no-regret-managed-batch-control/v1`;
- manifest status: `control_only`;
- active actor ids in the managed batch: `npc_b`, `npc_c`;
- aggregate transition rows: `4`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `1`;
- aggregate row contract failures: `0`;
- aggregate audit verdict: `core-inconclusive`;
- response windows had `scope_status: observed_actors`;
- each actor's response windows observed the counterpart actor id;
- row bodies contain no `predicted_delta` or `expected_outcome`;
- post-run live-smoke status was `not_running`.

This is stronger than the no-world 2-active control because it proves the
artifact family closes while connected to real Minecraft fresh worlds. It is
still not a no-regret pilot: actor turns were sequential per actor, the provider
was deterministic, both controls used the same declared scenario seed id
`seed:natural-safe-spawn-v1`, material-stake rows were absent, and the row count
is far below no-regret thresholds.

### Managed 2-Active Live-Smoke Shared-World Control Recorded

A fourth control checks live-smoke endpoint reuse:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-managed-2active-live-smoke-shared-control/
```

Batch id:

```text
no-regret-managed-batch-2e571a51-f024-4e22-ad29-8d4f9a4828dc
```

Verified result:

- manifest schema: `no-regret-managed-batch-control/v1`;
- manifest status: `control_only`;
- run mode: `offline=false`;
- run mode: `sequential_actor_runs=true`;
- run mode: `simultaneous_live_actor_turns=false`;
- per-actor report server mode: `live_smoke`;
- both actor reports used endpoint `127.0.0.1:25565`;
- seed/reset session kind: `reused_live_session`;
- aggregate transition rows: `4`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `2`;
- aggregate row contract failures: `0`;
- aggregate audit verdict: `core-inconclusive`;
- bounded response-window rows: `4`;
- all four response-window artifacts observed actor ids;
- row bodies contain no `predicted_delta` or `expected_outcome`;
- the live-smoke server was stopped after validation, and a post-validation
  status check returned `status=not_running`.

This is stronger than the live fresh-world deterministic control because both
actor runs reused one live-smoke endpoint and the same underlying Minecraft
server seed. It is still not a no-regret pilot: Actor Turns were sequentially
scheduled by the managed batch orchestrator, not run through a shared-session
active actor scheduler; the provider was deterministic; all rows were `partial`;
material-stake rows were absent; and the row count is far below no-regret
thresholds.

### Shared-Session Scheduler Smoke Recorded

A fifth control checks the first thin version of shared-session active
scheduling:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-shared-session-scheduler-smoke/
```

Smoke id:

```text
shared-session-scheduler-smoke-b643027d-d5ed-4db8-867d-e5e8d3b2c82f
```

Verified result:

- manifest schema: `shared-session-active-scheduler-smoke/v1`;
- manifest status: `control_only`;
- `shared_live_session`: `true`;
- `simultaneous_live_actor_connections`: `true`;
- `round_robin_actor_turn_slots`: `true`;
- `full_actor_turn_provider_loop`: `false`;
- `no_regret_pilot_evidence`: `false`;
- active actor ids: `npc_b`, `npc_c`;
- live-smoke endpoint: `127.0.0.1:25565`;
- server source: `started`;
- post-run server status: `stopped`;
- scheduler slots: `4`;
- represented primitive action classes: `observe`, `wait`;
- aggregate transition rows: `4`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `1`;
- aggregate row contract failures: `0`;
- aggregate audit verdict: `core-inconclusive`;
- bounded response-window rows: `4`;
- interaction-opportunity rows: `4`;
- all four rows had observed actor ids in their response windows;
- row bodies contain no `predicted_delta` or `expected_outcome`.

This is stronger than the earlier managed live-smoke shared-world control
because it keeps one shared live session provenance rather than running separate
`runSocialCycle` calls per actor. It proves simultaneous live actor connections,
round-robin scheduler slots, per-actor `transition-row/v1`, per-slot
`transition-response-window/v1`, and aggregate `transition-row-batch-audit/v1`
can close together.

It is still not a no-regret pilot. The smoke does not run the full Actor Turn
provider loop; actions are deterministic `observe` / `wait` scheduler slots;
all rows are `partial`; observed deltas are sparse; material-stake rows are
absent; row count is far below threshold; and no live provider/cost evidence was
exercised.

### Shared-Session Actor Turn Smoke Recorded

A sixth control checks the deterministic Actor Turn path inside one shared live
session:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-shared-session-actor-turn-smoke/
```

Smoke id:

```text
shared-session-actor-turn-smoke-8ddc32da-4613-40ce-830a-02b97f616a8b
```

Verified result:

- manifest schema: `shared-session-actor-turn-smoke/v1`;
- manifest status: `control_only`;
- `shared_live_session`: `true`;
- `simultaneous_live_actor_connections`: `true`;
- `round_robin_actor_turn_slots`: `true`;
- `full_actor_turn_provider_loop`: `true`;
- `no_regret_pilot_evidence`: `false`;
- active actor ids: `npc_b`, `npc_c`;
- live-smoke endpoint: `127.0.0.1:25565`;
- server source: `started`;
- post-run server status: `stopped`;
- Actor Turn slots: `2`;
- provider input refs per slot: `2`;
- provider output refs per slot: `2`;
- represented action classes: `observe`, `wait`;
- aggregate transition rows: `2`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `1`;
- aggregate row contract failures: `0`;
- bounded response-window rows: `2`;
- interaction-opportunity rows: `2`;
- both rows had observed actor ids in their response windows;
- row bodies contain no `predicted_delta` or `expected_outcome`.

The batch audit verdict is `degenerate-action-loop`, which is the correct
negative result for this tiny deterministic control. The dominant
`(actor, action, target)` ratio is `0.5`, above the no-regret cap `0.3`, and
material-stake rows are absent.

This is stronger than the shared-session scheduler smoke because it passes
through deterministic CycleGoal provider, Actor Turn provider, runtime
execution, runtime classifier, response-window writer, transition-row writer,
and batch audit inside one shared live session. It is still not a no-regret
pilot because no live provider path was used, only two slots ran, actions were
diagnostic `observe` / `wait`, all rows were `partial`, and the audit rightly
classifies the batch as degenerate.

The next true runtime gap is behavior pressure on the shared-session Actor Turn
scheduler: 2-3 active actors connected at once, provider preflight before live
LLM use, scenario pressure that can produce material-stake rows, action classes
beyond `observe` / `wait`, dominant target ratio under the no-regret cap, one
shared seed/reset provenance, and rows aggregated from that shared session.

### Shared-Session Actor Turn Material-Pressure Control Recorded

A seventh control checks whether the shared-session Actor Turn path can produce
a material-stake row:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-shared-session-actor-turn-material-pressure-control/
```

Smoke id:

```text
shared-session-actor-turn-smoke-ce806f29-54f2-4ec9-afe1-33541798bd89
```

Verified result:

- manifest schema: `shared-session-actor-turn-smoke/v1`;
- manifest status: `control_only`;
- primitive sequence: `collect_logs`, `wait`;
- `shared_live_session`: `true`;
- `full_actor_turn_provider_loop`: `true`;
- `no_regret_pilot_evidence`: `false`;
- active actor ids: `npc_b`, `npc_c`;
- live-smoke endpoint: `127.0.0.1:25565`;
- post-run server status: `stopped`;
- Actor Turn slots: `2`;
- represented action classes: `collect_logs`, `wait`;
- aggregate transition rows: `2`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `1`;
- aggregate row contract failures: `0`;
- bounded response-window rows: `2`;
- interaction-opportunity rows: `2`;
- material-stake rows: `1`;
- material labels: `inventory_gain`, `no_material_delta`;
- both rows had observed actor ids in their response windows;
- row bodies contain no `predicted_delta` or `expected_outcome`.

The batch audit verdict remains `degenerate-action-loop`, which is correct for a
two-row forced-control batch. The dominant `(actor, action, target)` ratio is
`0.5`, above the no-regret cap `0.3`. The useful result is narrower: the
shared-session Actor Turn path can now close at least one `material_stake` row
with `inventory_gain` evidence.

The next true runtime gap is no longer basic material-row wiring. It is
non-degenerate behavior pressure: provider preflight before live LLM use,
scenario pressure that makes material action useful without a forced primitive
sequence, at least four represented action classes, more bounded response
windows, more material-stake rows, and dominant target ratio under the
no-regret cap.

### Shared-Session Actor Turn Material-Breadth Corrected Control Recorded

An eighth control checks whether shared-session Actor Turn can produce four
action classes while keeping the dominant-target cap below threshold:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-shared-session-actor-turn-material-breadth-corrected-control/
```

Smoke id:

```text
shared-session-actor-turn-smoke-feceb2ee-8bde-4e39-be32-536280f49058
```

Verified result:

- manifest schema: `shared-session-actor-turn-smoke/v1`;
- manifest status: `control_only`;
- primitive sequence: `collect_logs`, `craft_item`, `move_to`, `wait`;
- `shared_live_session`: `true`;
- `full_actor_turn_provider_loop`: `true`;
- `no_regret_pilot_evidence`: `false`;
- active actor ids: `npc_b`, `npc_c`;
- live-smoke endpoint: `127.0.0.1:25565`;
- post-run server status: `stopped`;
- Actor Turn slots: `4`;
- represented action classes: `collect_logs`, `craft_item`, `move_to`, `wait`;
- aggregate transition rows: `4`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `1`;
- aggregate action class count: `4`;
- aggregate row contract failures: `0`;
- bounded response-window rows: `4`;
- interaction-opportunity rows: `4`;
- material-stake rows: `1`;
- material labels: `inventory_gain`, `no_material_delta`;
- dominant target over cap: `false`;
- all four rows had observed actor ids in their response windows;
- row bodies contain no `predicted_delta` or `expected_outcome`.

Slot outcomes:

- `npc_b collect_logs`: completed / passed;
- `npc_c craft_item`: failed / failed;
- `npc_b move_to`: completed / passed;
- `npc_c wait`: completed / not applicable.

The audit verdict is `core-inconclusive`, not `degenerate-action-loop`. This is
a useful substrate improvement: the shared-session Actor Turn path can now
produce four action classes, one material-stake row, and a batch whose dominant
target ratio is under the no-regret cap. It is still not a no-regret pilot
because the sequence is deterministic and forced, only four rows exist, only one
material-stake row exists, seed/reset count is `1`, and no live provider/cost
evidence was exercised.

### Gemini Flash-Lite Provider Preflight Recorded

A provider quota preflight now exists for the first provider-backed shared-session
Actor Turn control:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-provider-preflight-gemini-flash-lite-control/
```

Candidate:

```text
gemini-api:gemini-2.5-flash-lite
```

Estimated tiny run shape:

- 2 active actors;
- 1 shared-session round;
- full CycleGoal + Actor Turn provider path;
- conservative allowance for repair/retry/codegen surprise: 8 requests, 240k
  total tokens, 2 requests/minute, 120k total tokens/minute.

Recorded preflight artifacts:

- `gemini-2.5-flash-lite-shared-session-actor-turn-preflight.json`;
- `gemini-2.5-flash-lite-shared-session-actor-turn-preflight-after-first-failure.json`.

Both returned `final_status: allowed`. This proves only local quota-policy
permission for the tiny control at the time of checking. It does not prove
provider availability or no-regret pilot readiness.

### Gemini Flash-Lite Shared-Session Failure Attempt Recorded

A first provider-backed shared-session attempt exists:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-shared-session-actor-turn-gemini-flash-lite-control/
```

Smoke id:

```text
shared-session-actor-turn-smoke-8b09653e-8a8c-4f79-a938-82afc40715b1
```

The run failed during `npc_b` Actor Turn provider selection with Gemini
`503 UNAVAILABLE` / high-demand availability failure. The useful distinction is:

- local preflight was `allowed`;
- the provider usage guard allowed the actual request;
- the provider output snapshot recorded the failure and budget decision;
- the live-smoke server was stopped afterward;
- this is provider availability evidence, not actor behavior, row-quality, or
  society-dynamics evidence.

The partial run wrote seed/reset records and provider snapshots, but no manifest
or batch audit. After this attempt, `sharedSessionActorTurnSmokeCli` was updated
so future early failures can still write a `failed_control` manifest and
environment-blocked batch audit.

### Gemini Flash-Lite Shared-Session Actor Turn Control Recorded

A ninth control checks the live provider CycleGoal + Actor Turn path inside one
shared live Minecraft session:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-shared-session-actor-turn-gemini-flash-lite-failure-manifest-control/
```

The directory name includes `failure-manifest-control` because the run was used
after adding failure-manifest support for the prior Gemini 503 attempt. The run
itself completed successfully, so the live `failed_control` path remains
unexercised by this artifact.

Smoke id:

```text
shared-session-actor-turn-smoke-5e87a4d6-4d5d-4852-bf79-52567d6906b4
```

Verified result:

- manifest schema: `shared-session-actor-turn-smoke/v1`;
- manifest status: `control_only`;
- provider: `gemini-api`;
- model: `gemini-2.5-flash-lite`;
- `live_provider_calls`: `true`;
- active actor ids: `npc_b`, `npc_c`;
- shared live session: `true`;
- full CycleGoal + Actor Turn provider loop: `true`;
- declared scenario family: `co_presence_divergence_v1`;
- post-run server status: `stopped`;
- Actor Turn slots: `2`;
- represented action classes: `craftCraftingTable`, `craft_item`;
- slot outcomes: `npc_b craftCraftingTable` completed/passed,
  `npc_c craft_item` failed/failed;
- aggregate transition rows: `2`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `1`;
- aggregate row contract failures: `0`;
- bounded response-window rows: `2`;
- interaction-opportunity rows: `2`;
- material-stake rows: `1`;
- non-empty-delta rows: `2`;
- row bodies contain no `predicted_delta` or `expected_outcome`;
- provider usage records for the successful run: 4 requests, 76,424 total
  estimated tokens.

The batch audit verdict is `degenerate-action-loop`, which is correct. With only
two rows, one seed/reset id, one scenario family, insufficient response windows,
insufficient material-stake rows, and a dominant target ratio of `0.5`, this run
cannot count as a no-regret pilot.

This control closes a new gap: live provider CycleGoal and Actor Turn selection
can now run through the shared-session artifact path. The remaining gap is not
schema wiring. It is producing a non-degenerate, provider-backed 2-3 actor batch
with enough rows, seed/reset coverage, scenario pressure, material-stake rows,
bounded response windows, and action diversity to decide whether Goldilocks or
society-observable preflight should start.

### Gemini Flash-Lite Multi-Family Control And Quota Blocker Recorded

A tenth control attempted to push the provider-backed shared-session path beyond
two slots while declaring three scenario-pressure families:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-shared-session-actor-turn-gemini-flash-lite-multifamily-control/
```

Smoke id:

```text
shared-session-actor-turn-smoke-6a22c8e8-7137-4c53-aff0-033078f6cf51
```

Preflight record:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-provider-preflight-gemini-flash-lite-multifamily-control/
```

The run requested 2 active actors x 3 rounds, but stopped after 4 completed
Actor Turn slots because Gemini returned a live API quota failure:

```text
RESOURCE_EXHAUSTED
GenerateRequestsPerDayPerProjectPerModel-FreeTier
quotaValue: 20
model: gemini-2.5-flash-lite
```

Verified partial result:

- manifest schema: `shared-session-actor-turn-smoke/v1`;
- manifest status: `failed_control`;
- provider: `gemini-api`;
- model: `gemini-2.5-flash-lite`;
- active actor ids: `npc_b`, `npc_c`;
- requested scenario families: `borrow_refuse_return_tool_v1`,
  `shared_station_public_affordance_v1`, `co_presence_divergence_v1`;
- completed Actor Turn slots: `4`;
- represented action classes: `craft_item`, `craftPlanksAndSticks`,
  `craftWoodenPickaxe`, `observe`;
- aggregate transition rows: `4`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `1`;
- aggregate action class count: `4`;
- dominant target over cap: `false`;
- aggregate row contract failures: `0`;
- bounded response-window rows: `4`;
- interaction-opportunity rows: `4`;
- material-stake rows: `1`;
- non-empty-delta rows: `4`;
- scenario-family count: `3`;
- audit verdict: `cost-or-environment-blocked`;
- row bodies contain no `predicted_delta` or `expected_outcome`.

This is useful partial evidence because it reached action-class diversity and
scenario-pressure provenance under a live provider. It is not a no-regret pilot:
the run did not complete, row count is far below 40, material-stake rows are too
sparse, seed/reset count is `1`, and every social response remained
`no_observable_response`.

The local provider quota policy was corrected after this run. A post-policy
preflight for one additional `gemini-2.5-flash-lite` request now returns
`final_status: blocked` with current day requests above the observed 20 RPD cap.
Do not run more `gemini-2.5-flash-lite` controls in the same Pacific-day window
unless the active project quota changes and the local policy is explicitly
updated.

### Qwen Ambassador Provider Preflight Recorded

A ModelScope/Qwen quota preflight now exists for the next provider-backed
shared-session Actor Turn control:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-provider-preflight-qwen-ambassador-control/
```

Candidate:

```text
modelscope-api:Qwen-Ambassador/Qwen3.7-Plus
```

Estimated small run shape:

- 2 active actors;
- 2 shared-session rounds;
- full CycleGoal + Actor Turn provider path;
- conservative allowance for repair/retry/codegen surprise: 12 requests, 600k
  total tokens, 2 requests/minute, 120k total tokens/minute.

Recorded preflight artifact:

- `qwen-ambassador-plus-shared-session-actor-turn-preflight.json`.

It returned `final_status: allowed` under the repo-local ModelScope Qwen
Ambassador guard:

```text
current month requests: 259
projected month requests: 271
monthly request limit: 10000
```

This is permission for the planned small control only. It does not prove
provider availability, no-regret pilot readiness, Goldilocks prediction lift, or
society-observable behavior.

### Qwen Ambassador Shared-Session Actor Turn Control Recorded

An eleventh control ran the same live shared-session artifact path using Qwen
Ambassador Plus:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-shared-session-actor-turn-qwen-ambassador-plus-control/
```

Smoke id:

```text
shared-session-actor-turn-smoke-919fe5a1-d36e-477c-b125-643ea45d0ab5
```

Verified result:

- manifest schema: `shared-session-actor-turn-smoke/v1`;
- manifest status: `control_only`;
- provider: `modelscope-api`;
- model: `Qwen-Ambassador/Qwen3.7-Plus`;
- `live_provider_calls`: `true`;
- active actor ids: `npc_b`, `npc_c`;
- shared live session: `true`;
- full CycleGoal + Actor Turn provider loop: `true`;
- declared scenario families: `borrow_refuse_return_tool_v1`,
  `shared_station_public_affordance_v1`, `co_presence_divergence_v1`;
- post-run server status: `stopped`;
- Actor Turn slots: `4`;
- represented action classes: `place_block`, `observe`, `placeCraftingTable`,
  `inspectSharedChest`;
- slot runtime statuses: 2 completed, 2 failed;
- verifier statuses: 1 passed, 2 failed, 1 not applicable;
- aggregate transition rows: `4`;
- aggregate actor count: `2`;
- aggregate seed/reset count: `1`;
- aggregate action class count: `4`;
- dominant target ratio: `0.25`, under the `0.30` cap;
- aggregate row contract failures: `0`;
- bounded response-window rows: `4`;
- interaction-opportunity rows: `4`;
- material-stake rows: `1`;
- non-empty-delta rows: `4`;
- scenario-family count: `3`;
- audit verdict: `core-inconclusive`;
- row bodies contain no `predicted_delta` or `expected_outcome`;
- actual provider usage: 8 successful Qwen calls, 150,054 total tokens.

This is the strongest provider-backed control so far for the current
no-regret-core path. It proves that Qwen can drive the live CycleGoal + Actor
Turn path through shared-session Minecraft execution and close response-window,
transition-row, and batch-audit artifacts under local budget guard.

It is still not a no-regret pilot: it has only four rows, one seed/reset id, one
material-stake row, no non-empty social response beyond
`no_observable_response`, and no prediction baseline. The correct project verdict
remains `core-first`.

### OpenAI Small Baseline Preflight Recorded

A no-call OpenAI preflight now exists for a possible future conservative
baseline:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-provider-preflight-openai-small-baseline-control/
```

Candidates:

- `openai-api:gpt-5.4-nano`;
- `openai-api:gpt-5.4-mini`.

Recorded preflight artifact:

- `openai-small-baseline-shared-session-actor-turn-preflight.json`.

It returned:

```text
final_status: needs_dashboard_approval
```

The OpenAI baseline was not run. Dashboard/free-tier eligibility and explicit
operator approval remain required before any OpenAI live provider call.

### Natural Village-Adjacent Run Profile Added

The next comparison setup should use the new natural-world profile:

```text
natural-village-spawn-v1
```

Default seed:

```text
4167799982467607063
```

This seed comes from the prior `plains-village-cherry-nearby` seed-scout
candidate:

```text
project-docs/experiments/curated/2026-06-13/seed-scout-plain-natural/candidates/plains-village-cherry-nearby/
```

The purpose is to avoid provider-turn waste from dense forest or obstructed
spawn traps while keeping a natural generated world. The profile keeps
`LEVEL_TYPE=default`, `GENERATE_STRUCTURES=true`, natural terrain, village
structures, animals, trees, caves, and no fixture mutation. It must not grant
inventory, place resources, clear pads, or count village blocks as actor
progress.

The associated run/comparison plan is:

```text
project-docs/research/benchmarks/natural-village-model-comparison-plan-2026-06-29.md
```

Model comparison remains secondary. The useful OpenAI lane is
`openai-api:gpt-5.4-mini`, but it still requires dashboard/free-tier approval
before any live call. Compare providers by evidence yield:
`tokens_per_transition_row`, `tokens_per_material_stake_row`, action-class
diversity, response-window yield, natural-world trap recovery, and village
affordance use after observation.

### Current Decision After Qwen Control

A dated decision note now records the branch decision:

```text
project-docs/experiments/curated/2026-06-29/no-regret-core-qwen-ambassador-decision-note.md
```

Verdict:

```text
core-first
```

Goldilocks prediction preflight remains blocked because the current rows are too
few, too same-session, and too sparse in material/social-response density to test
whether interaction history beats an LLM prior. Society-observable preflight also
remains blocked because the control does not yet show recurring social-material
patterns, repair, refusal, exchange, or continuation.

The next single bottleneck is material-stake density under live provider control.
The next empirical run should stay small but deliberately create more rows where
another actor can observe or be affected by possession, access, station
placement, resource sharing, refusal, repair, or blocked access.

## Update Rule

Update this file, a dated audit, or a handoff/status document when implementation
status changes. Do not put volatile command output or transient run status into
the central plan, research protocols, or long-term specification files.
