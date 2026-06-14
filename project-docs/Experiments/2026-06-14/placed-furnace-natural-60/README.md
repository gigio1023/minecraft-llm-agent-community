# Placed Furnace Natural 60-Cycle Model Benchmark

Search token: `EXPERIMENT_2026_06_14_PLACED_FURNACE_NATURAL_60`.

Status: completed observation run with first-pass objective-progress scoring.

## Setup

- Date: 2026-06-14
- Benchmark id: `placed_furnace_natural_60`
- Target: obtain and place one `furnace` block in a fresh natural survival world.
- Scoring boundary: raw observations remain in `summary.json`; the first-pass
  milestone scorer writes derived results to `scored-summary.json` and
  `scored-index.html`.
- Provider/models: ModelScope Qwen Ambassador `Qwen3.7-Max` and `Qwen3.7-Plus`;
  OpenAI API `gpt-5.4-mini`
- Reasoning configuration: Qwen runs used `SOCIAL_CYCLE_REASONING=qwen-no-think`;
  the OpenAI run used `SOCIAL_CYCLE_REASONING=medium`, which maps to
  `reasoning.effort=medium`.
- Cycle budget: 60 cycles, `max_actions_per_cycle=1`
- World scenario: `natural-safe-spawn-v1`
- Seed: `9137002542963915989`
- World reset: each model used its own fresh world with the same seed.
- Visual evidence: first-person and third-person screenshots every cycle.

## Result Snapshot

All three runs ended with social-cycle `runtime_status=passed`, which means the
runtime observed some verified progress. That is not the benchmark target
verdict. No run observed `furnace_item_observed` or `furnace_block_observed`.

| Model | Calls | Avg latency | p95 latency | Last milestone observed | Final inventory highlights |
| --- | ---: | ---: | ---: | --- | --- |
| `Qwen-Ambassador/Qwen3.7-Max` | 109 | 8403 ms | 16267 ms | `sticks_inventory_observed` at cycle 7 | `spruce_log=4`, `stick=28` |
| `Qwen-Ambassador/Qwen3.7-Plus` | 91 | 19425 ms | 37794 ms | `cobblestone_8_observed` at cycle 31 | `wooden_pickaxe=1`, `cobblestone=15` |
| `gpt-5.4-mini` | 619 | 12034 ms | 23764 ms | `crafting_table_item_observed` at cycle 3 | early progress only; recovery mode after socket/session failure |

Outcome counts:

| Model | Verified progress | Blocked | No progress |
| --- | ---: | ---: | ---: |
| `Qwen3.7-Max` | 19 | 16 | 25 |
| `Qwen3.7-Plus` | 21 | 10 | 29 |
| `gpt-5.4-mini` | 5 | 12 | 43 |

## Objective-Progress Scoring

The first scorer uses a 100-point milestone ladder for the target "obtain and
place one furnace block." It does not score tool schema, structured arguments,
or provider transport compliance.

| Model | Target reached | Progress score | Best milestone | Post-best cycles |
| --- | --- | ---: | --- | ---: |
| `Qwen-Ambassador/Qwen3.7-Max` | no | 40/100 | sticks crafted at cycle 7 | 53 |
| `Qwen-Ambassador/Qwen3.7-Plus` | no | 78/100 | eight cobblestone acquired at cycle 31 | 29 |
| `gpt-5.4-mini` | no | 24/100 | crafting table item crafted at cycle 3 | 57 |

Interpretation: the current data is strong enough to show where this benchmark
stalls, but not strong enough to claim a general model ranking. `Qwen3.7-Plus`
made materially deeper target progress in this one run. `gpt-5.4-mini` made
early progress, then spent most of the run in disconnected/session recovery and
retry-gated generated-action attempts, so its low score should be read as a
model-runtime-run outcome rather than a pure model capability verdict.

## Quota

The `gpt-5.4-mini` run used the provider quota preflight skill before the live
OpenAI call path. Preflight estimated 110 requests and 3.2M tokens. The final
run used 619 provider usage records and 3,065,794 total tokens. The request
estimate was too low because background polling and generated-action codegen
records counted as separate provider usage records; token usage stayed within
the planned estimate and under the local 9M/day guard.

OpenAI quota guard result:

| Model | Final daily tokens | Local daily cap | Guard status |
| --- | ---: | ---: | --- |
| `gpt-5.4-mini` | 3,065,794 | 9,000,000 | allowed |

ModelScope Qwen quota guard was enforced before provider calls. Final projected
monthly call counts from the local ledger:

| Model | Projected monthly calls | Monthly cap |
| --- | ---: | ---: |
| `Qwen-Ambassador/Qwen3.7-Max` | 268 | 2500 |
| `Qwen-Ambassador/Qwen3.7-Plus` | 256 | 10000 |

## Artifacts

- `index.html` - combined visual report with trend charts and screenshot samples.
- `summary.json` - `benchmark-observation-metrics-bundle/v1`.
- `scored-index.html` - milestone-weighted score report with the item-state
  timeline figure, progress/cost charts, and dataset-readiness notes.
- `scored-summary.json` - `benchmark-score-bundle/v1`.
- `qwen-3.7-max/report.json` - raw `social-cycle-run-report/v1`.
- `qwen-3.7-plus/report.json` - raw `social-cycle-run-report/v1`.
- `gpt-5.4-mini/report.json` - raw `social-cycle-run-report/v1`.
- `qwen-3.7-max/metrics.json` and `qwen-3.7-plus/metrics.json` - per-run
  observation metrics.
- `gpt-5.4-mini/metrics.json` - per-run observation metrics.
- `qwen-3.7-max/report-review.md` and `qwen-3.7-plus/report-review.md` -
  generated review summaries.
- `gpt-5.4-mini/report-review.md` - generated review summary.
- `gpt-5.4-mini/preflight.json` - OpenAI quota preflight artifact for this run.
- `qwen-3.7-max/visual-evidence/` and `qwen-3.7-plus/visual-evidence/` -
  copied screenshot artifacts, 124 captured images per model.
- `gpt-5.4-mini/visual-evidence/` - copied screenshot artifacts, 124 captured
  images.

## Review

This target was better than the previous wooden-pickaxe task because it exposed
where each model's loop stalls. `Qwen3.7-Plus` reached wooden pickaxe and enough
cobblestone for a furnace, then failed to convert that state into furnace craft
and placement. `Qwen3.7-Max` stalled earlier around pickaxe crafting and repeated
blocked or non-progress actions. `gpt-5.4-mini` reached the crafting-table-item
milestone quickly, but then the run shifted into `socketClosed` /
`disconnected_or_error` recovery and repeated generated action attempts instead
of continuing the furnace objective.

The next useful benchmark improvement is not a harder target yet. It is a
scorer pass that consumes `benchmark-observation-metrics/v1` and labels target
success, partial milestone score, repeated-action stall, and recoverable blocker
handling without trusting provider prose.

The report now includes a publication-oriented item-state timeline in addition
to the original score-by-cycle debug chart. The item-state figure keeps each
Minecraft item or block on one row and displays runtime states such as acquired,
crafted, placed, and quantity threshold as cycle markers.
