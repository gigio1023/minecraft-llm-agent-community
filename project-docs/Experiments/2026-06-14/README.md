# 2026-06-14 Qwen Benchmark Experiments

Search token: `EXPERIMENT_2026_06_14_QWEN_BENCHMARKS`.

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
- `placed-furnace-natural-60/index.html` - Qwen Max/Plus 60-cycle natural-world
  placed-furnace benchmark observation report with trend charts.
- `placed-furnace-natural-60/scored-index.html` - first-pass objective-progress
  score report with milestone ladder, progress/cost charts, and benchmark
  readiness notes.
- `placed-furnace-natural-60/README.md` - run setup, quota summary, and review.
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

No OpenAI API calls were made in the Qwen 60-cycle experiment.
