# 2026-06-14 Minecraft Benchmark Experiments

Search token: `EXPERIMENT_2026_06_14_MINECRAFT_BENCHMARKS`.

Status: active dated experiment record.

## Curated Reports

- `qwen-60-cycle-dual-camera/index.html` - Qwen Max/Plus 60-cycle comparison
  with trend graph and first-person/third-person screenshots for every cycle.
- `qwen-60-cycle-dual-camera/summary.json` - machine-readable normalized
  summary.
- `qwen-60-cycle-dual-camera/README.md` - run condition and result table.
- `qwen-60-cycle-dual-camera/review-and-next-benchmark.md` - post-run review
  and next natural-world benchmark proposal.
- `natural-seed-candidate-9137002542963915989-smoke/README.md` - accepted
  provider-free natural seed smoke for the next benchmark.
- `placed-furnace-natural-60/index.html` - Qwen Max/Plus and OpenAI
  `gpt-5.4-mini` 60-cycle natural-world placed-furnace benchmark observation
  report with trend charts.
- `placed-furnace-natural-60/scored-index.html` - first-pass objective-progress
  score report with milestone ladder, progress/cost charts, and benchmark
  readiness notes.
- `placed-furnace-natural-60/README.md` - run setup, quota summary, and review.
- `provider-quota-preflight-gpt55/README.md` - provider/model quota preflight
  showing that `gpt-5.5` remains blocked for the 60-cycle benchmark while Qwen
  Max/Plus remain under monthly API-call caps.
- `natural-stone-tool-world-smoke/README.md` - rejected dense bamboo-jungle
  seed smoke kept for audit history.

## Quota Context

This date also updated provider quota documentation and runtime guard behavior:

- ModelScope Qwen Ambassador quotas are API-call based:
  `Qwen-Ambassador/Qwen3.7-Max` has 2500 calls/month and
  `Qwen-Ambassador/Qwen3.7-Plus` has 10000 calls/month.
- OpenAI data-sharing complimentary usage is token-pool based and still
  requires dashboard eligibility, enabled project data sharing, positive
  balance, projected-token review, and explicit operator approval before any
  future `openai-api` benchmark.

The later `placed-furnace-natural-60/gpt-5.4-mini/` run did use OpenAI API after
local preflight and operator approval. It ended under the local `gpt-5.4-mini`
9M/day token guard at 3,065,794 total tokens, with the preflight artifact stored
as `placed-furnace-natural-60/gpt-5.4-mini/preflight.json`.
