# Natural Stone Tool World Smoke

Search token: `EXPERIMENT_2026_06_14_NATURAL_STONE_TOOL_WORLD_SMOKE`.

Status: rejected seed candidate for the next default benchmark.

## Purpose

Provider-free smoke for the proposed seed string
`natural-stone-tool-benchmark-v1`. This did not evaluate model behavior. It
only checked fresh-world setup, natural spawn validation, and visual evidence.

## Result

- provider: `deterministic-social`
- provider usage records: `0`
- cycles: `0`
- runtime status: `blocked` because no gameplay cycle ran
- world scenario: `natural-safe-spawn-v1`
- seed: `natural-stone-tool-benchmark-v1`
- level type: `default`
- fixture dependency: `false`
- setup status: `passed`
- natural spawn validation: `passed`
- visual captures: `4`
- visual failures: `0`
- cleanup note: first-person browser close timed out after report write

## Verdict

The setup is valid, but the visual spawn is a dense bamboo jungle. It is a
natural world, but it is too visually busy and terrain-noisy for the next
baseline benchmark. Do not use it as the default seed for Qwen model comparison.

## Artifacts

- `report.json`
- `visual-evidence/`
- `world-scenarios/`
