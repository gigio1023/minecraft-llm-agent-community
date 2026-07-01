# Qwen 60-Cycle Dual-Camera Benchmark

Search token: `EXPERIMENT_2026_06_14_QWEN_60_DUAL_CAMERA`.

Status: completed dated experiment.

## Condition

- provider: `modelscope-api`
- models: `Qwen-Ambassador/Qwen3.7-Max`, `Qwen-Ambassador/Qwen3.7-Plus`
- actor: `npc_b`
- cycles: 60 per model
- max actions per cycle: 1
- world: fresh `wooden-pickaxe-flat-benchmark-v1` world per model run
- server: `PROBE_SERVER_VERSION=1.21.4`
- visual evidence: first-person and third-person screenshots every cycle plus initial/final
- reasoning condition: `qwen-no-think`, ModelScope request uses `chat_template_kwargs.enable_thinking=false`

## Result

| Model | Runtime | Pickaxe Inventory | Final Pickaxes | Held/Equipped Evidence | API Calls | Visual Captures |
| --- | --- | --- | ---: | --- | ---: | ---: |
| `Qwen-Ambassador/Qwen3.7-Max` | passed | cycle 53 | 3 | no | 78 | 124 |
| `Qwen-Ambassador/Qwen3.7-Plus` | passed | cycle 25 | 2 | no | 87 | 124 |

Primary target was runtime inventory evidence for `wooden_pickaxe`. Held/equipped evidence and settlement structure progress were not proven in either run.

## Artifacts

- `index.html` - visual report with trend graph and screenshots
- `summary.json` - machine-readable normalized summary
- `review-and-next-benchmark.md` - post-run review and next natural-world benchmark proposal
- `qwen-3.7-max/report.json`
- `qwen-3.7-plus/report.json`
- `qwen-3.7-max/visual-evidence/`
- `qwen-3.7-plus/visual-evidence/`
