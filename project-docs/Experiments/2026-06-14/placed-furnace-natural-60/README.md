# Placed Furnace Natural 60-Cycle Qwen Benchmark

Search token: `EXPERIMENT_2026_06_14_PLACED_FURNACE_NATURAL_60`.

Status: completed observation run with first-pass objective-progress scoring.

## Setup

- Date: 2026-06-14
- Benchmark id: `placed_furnace_natural_60`
- Target: obtain and place one `furnace` block in a fresh natural survival world.
- Scoring boundary: raw observations remain in `summary.json`; the first-pass
  milestone scorer writes derived results to `scored-summary.json` and
  `scored-index.html`.
- Provider/models: ModelScope Qwen Ambassador `Qwen3.7-Max` and `Qwen3.7-Plus`
- Reasoning configuration: `SOCIAL_CYCLE_REASONING=qwen-no-think`
- Cycle budget: 60 cycles, `max_actions_per_cycle=1`
- World scenario: `natural-safe-spawn-v1`
- Seed: `9137002542963915989`
- World reset: each model used its own fresh world with the same seed.
- Visual evidence: first-person and third-person screenshots every cycle.

## Result Snapshot

Both runs ended with social-cycle `runtime_status=passed`, which means the
runtime observed some verified progress. That is not the benchmark target
verdict. Neither run observed `furnace_item_observed` or
`furnace_block_observed`.

| Model | Calls | Avg latency | p95 latency | Last milestone observed | Final inventory highlights |
| --- | ---: | ---: | ---: | --- | --- |
| `Qwen-Ambassador/Qwen3.7-Max` | 109 | 8403 ms | 16267 ms | `sticks_inventory_observed` at cycle 7 | `spruce_log=4`, `stick=28` |
| `Qwen-Ambassador/Qwen3.7-Plus` | 91 | 19425 ms | 37794 ms | `cobblestone_8_observed` at cycle 31 | `wooden_pickaxe=1`, `cobblestone=15` |

Outcome counts:

| Model | Verified progress | Blocked | No progress |
| --- | ---: | ---: | ---: |
| `Qwen3.7-Max` | 19 | 16 | 25 |
| `Qwen3.7-Plus` | 21 | 10 | 29 |

## Objective-Progress Scoring

The first scorer uses a 100-point milestone ladder for the target "obtain and
place one furnace block." It does not score tool schema, structured arguments,
or provider transport compliance.

| Model | Target reached | Progress score | Best milestone | Post-best cycles |
| --- | --- | ---: | --- | ---: |
| `Qwen-Ambassador/Qwen3.7-Max` | no | 40/100 | sticks crafted at cycle 7 | 53 |
| `Qwen-Ambassador/Qwen3.7-Plus` | no | 78/100 | eight cobblestone acquired at cycle 31 | 29 |

Interpretation: the current data is strong enough to show where this benchmark
stalls, but not strong enough to claim a general model ranking. `Qwen3.7-Plus`
made materially deeper target progress in this one run, while both models failed
the final furnace item/block milestones.

## Quota

No OpenAI API calls were made.

ModelScope Qwen quota guard was enforced before provider calls. Final projected
monthly call counts from the local ledger:

| Model | Projected monthly calls | Monthly cap |
| --- | ---: | ---: |
| `Qwen-Ambassador/Qwen3.7-Max` | 268 | 2500 |
| `Qwen-Ambassador/Qwen3.7-Plus` | 256 | 10000 |

## Artifacts

- `index.html` - combined visual report with trend charts and screenshot samples.
- `summary.json` - `benchmark-observation-metrics-bundle/v1`.
- `scored-index.html` - milestone-weighted score report with progress/cost
  charts and dataset-readiness notes.
- `scored-summary.json` - `benchmark-score-bundle/v1`.
- `qwen-3.7-max/report.json` - raw `social-cycle-run-report/v1`.
- `qwen-3.7-plus/report.json` - raw `social-cycle-run-report/v1`.
- `qwen-3.7-max/metrics.json` and `qwen-3.7-plus/metrics.json` - per-run
  observation metrics.
- `qwen-3.7-max/report-review.md` and `qwen-3.7-plus/report-review.md` -
  generated review summaries.
- `qwen-3.7-max/visual-evidence/` and `qwen-3.7-plus/visual-evidence/` -
  copied screenshot artifacts, 124 captured images per model.

## Review

This target was better than the previous wooden-pickaxe task because it exposed
where each model's loop stalls. `Qwen3.7-Plus` reached wooden pickaxe and enough
cobblestone for a furnace, then failed to convert that state into furnace craft
and placement. `Qwen3.7-Max` stalled earlier around pickaxe crafting and repeated
blocked or non-progress actions.

The next useful benchmark improvement is not a harder target yet. It is a
scorer pass that consumes `benchmark-observation-metrics/v1` and labels target
success, partial milestone score, repeated-action stall, and recoverable blocker
handling without trusting provider prose.
