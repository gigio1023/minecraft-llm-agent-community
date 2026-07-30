# Collect Logs: First Approved Attempt Review

Date: 2026-07-12

Behavior verdict: `DIAGNOSABLE_FAILURE`

Failure class: `setup-path-bug`

## Recording verdict

The run is complete enough to diagnose setup. Its archived raw report,
actor-workspace scenario artifacts, approved preflight, declaration, normalized
report, and budget status pass the publishable readiness check. No Actor Turn or
Minecraft action evidence exists because setup correctly stopped first.

## Experiment verdict

This run is not evidence about GPT-5.4 Mini's Minecraft ability. It proves that
the checked-in `collect_logs` seed failed the benchmark's own natural-start
condition on Minecraft `1.21.11`. The runtime labeled this as
`environment_blocked` / `world_setup_failed` and made zero provider requests.

## Claim table

| Claim | Result | Evidence |
| --- | --- | --- |
| Material progress | Not observed | Raw report has zero cycles and zero action attempts; normalized target and milestone are `unknown`. |
| Environment setup | Failed | Natural-spawn validation reports `no_loaded_log_within_scan_radius`. |
| Provider behavior | Not observed | Provider usage records, requests, and tokens are all zero. |
| Visual behavior | Not recorded | No visual references or captures exist. |
| Seed repair | Provider-free verified | Suite 1.3.1 capability smoke with seed `9066` passed setup and recorded a nearest oak log at 17.12 blocks. |

## Run identity

- capability run: `capability-collect_logs-cfca1bfe-5311-426f-af51-914c00276271`;
- social run: `social-cycle-0422604b-4385-4877-b96f-3cc00bcc04dc`;
- actor: `npc_b`;
- provider/model: `openai-api:gpt-5.4-mini`, reasoning `low`;
- scenario: `natural-safe-spawn-v1`, fresh world;
- seed: `natural-safe-spawn-v1`;
- Minecraft: `1.21.11`;
- requested runtime: 2 cycles, at most 2 actions per cycle;
- observed runtime: 0 cycles, 0 actions, 18,445 ms;
- provider allowance for this attempt: at most 8 requests and 300,000 tokens;
- observed provider usage: 0 requests and 0 tokens.

Command:

```bash
cd probe
bun run probe:capability -- \
  --manifest benchmarks/capability/individual-capability-v1.json \
  --case collect_logs \
  --provider openai-api \
  --model gpt-5.4-mini \
  --online \
  --cycles 2 \
  --max-actions-per-cycle 2 \
  --max-wall-time-ms 360000 \
  --max-provider-requests 8 \
  --max-total-tokens 300000 \
  --out ../tmp/gpt54mini-v4-repaired-stage1/01-collect-logs
```

## What happened

The actor joined a fresh default world on safe grass at approximately
`(10.5, 65, 8.5)`. The setup scan retained 256 of 569 verified block candidates
using distance, direction, and height sampling. All 49 sampled columns were
loaded, but the separate bounded log lookup found no loaded `*_log` within 32
blocks. Because nearby loaded wood is an explicit `natural-safe-spawn-v1`
condition, setup stopped before Actor Turn.

The failure is not caused by the scan's 256-observation cap: the scenario uses a
separate `findBlocks` lookup for nearby logs. It is also not a provider failure,
action-selection failure, or capability failure because no provider request or
action occurred.

## What was recorded

- approved campaign preflight: `preflight/approved.json`;
- exact-day usage: `preflight/dashboard-usage-2026-07-12.json`;
- positive balance and complimentary enrollment:
  `preflight/dashboard-eligibility-2026-07-12.md`;
- archived live attempt:
  `project-docs/experiments/raw/2026-07-12/gpt54mini-v4-repaired-stage1/01-collect-logs-invalid-setup/`;
- archived provider-free corrected-seed capability smoke:
  `project-docs/experiments/raw/2026-07-12/gpt54mini-v4-repaired-stage1/provider-free-capability-seed-9066/`;
- SHA-256-bound relocation records beside both raw reports.

Both archived raw reports pass the report readiness check with `--publishable`.

## Correction and provider-free verification

The seed scout already identified `9066` as a less village-biased plains/forest
seed. A current provider-free fresh-world social smoke on Minecraft `1.21.11`
passed setup with oak logs 28.46 blocks away. After changing only the
`collect_logs` fixed seed and bumping the suite to 1.3.1, a provider-free
capability CLI smoke passed setup again and recorded the nearest oak log at
17.12 blocks. The deterministic actor then performed only `observe`; its later
`blocked` result is not treated as capability evidence.

## What is not proven

- GPT-5.4 Mini has not received the repaired `collect_logs` Actor Turn input.
- No physical action, inventory mutation, milestone, or target result exists.
- The model's action selection, parameter quality, and stopping behavior remain
  untested in the repaired natural world.
- The seed repair does not prove long-run seed robustness or social behavior.
- No screenshot or video was captured.

## Next experiment

Refresh the exact-day provider preflight after the suite 1.3.1 commit and ask
for explicit approval to repeat `collect_logs` once with the same 8-request /
300,000-token attempt ceiling. Do not run `craft_wooden_pickaxe` unless that
repeat is a valid measurement.
