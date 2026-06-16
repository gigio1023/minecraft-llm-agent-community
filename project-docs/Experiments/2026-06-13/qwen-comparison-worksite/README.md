# 50-Cycle GPT/Qwen Worksite Benchmark

Search token: `EXPERIMENT_2026_06_13_QWEN_WORKSITE_COMPARISON`.

Status: completed dated comparison.

## Condition

- actor: `npc_b`
- cycles: 50 requested per model
- `max_actions_per_cycle`: 1
- world: fresh `wooden-pickaxe-flat-benchmark-v1` world per model run
- visual evidence: enabled, every 5 cycles plus initial/final captures when
  available
- benchmark target: Minecraft behavior only; tool schema and structured
  argument transport are not scoring dimensions

## Scoring

Strict target:

- runtime evidence for `wooden_pickaxe`;
- explicit held/equipped `wooden_pickaxe` evidence;
- at least six unique actor-placed `oak_log`/`oak_planks` structure blocks.

Structure target without equip:

- runtime evidence for `wooden_pickaxe`;
- at least six unique actor-placed `oak_log`/`oak_planks` structure blocks.

The second target is reported because `Qwen-Ambassador/Qwen3.7-Plus` reached
the pickaxe plus six wood/log block chain but did not emit explicit
held/equipped pickaxe evidence.

## Result

| Model | Runtime | Strict Target | Structure Target Without Equip |
|-------|---------|---------------|--------------------------------|
| `gpt-5.5` / `medium` | stopped by provider quota at cycle 29 | cycle 16 | cycle 16 |
| `Qwen-Ambassador/Qwen3.7-Max` / `qwen-no-think` | completed 50 cycles | not reached | not reached |
| `Qwen-Ambassador/Qwen3.7-Plus` / `qwen-no-think` | completed 50 cycles | not reached | cycle 24 |

## Artifacts

- `index.html` - human report with charts and screenshots
- `summary.json` - machine-readable comparison summary
- `qwen-3.7-max/report.json`
- `qwen-3.7-plus/report.json`
- `screenshots/` - copied PNG visual evidence for all three model runs

GPT source artifacts remain in:

```text
project-docs/Experiments/2026-06-13/50-cycle-gpt55-medium-worksite/
```

## Qwen Reasoning Condition

Both Qwen runs used the ModelScope API-Inference adapter with:

```text
SOCIAL_CYCLE_REASONING=qwen-no-think
chat_template_kwargs.enable_thinking=false
```

No ModelScope API-Inference request field equivalent to OpenAI
`reasoning.effort = "medium"` has been confirmed. `thinking_tokens` was `0`
for both Qwen runs.
