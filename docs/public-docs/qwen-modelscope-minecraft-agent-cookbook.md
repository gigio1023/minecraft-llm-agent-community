---
title: "Cookbook: Run Qwen in the Minecraft LLM-Agent Harness"
description: "A short reproducible note for running Qwen ModelScope lanes in the Minecraft agent comparison harness."
---

# Cookbook: Run Qwen in the Minecraft LLM-Agent Harness

This cookbook records the practical setup used for the Qwen lanes in the
natural-village model comparison. It is intentionally small: the goal is to make
the Qwen part reproducible enough for another developer to inspect or adapt.

## What This Runs

The target lane is a 30-cycle Minecraft run where an LLM-backed actor starts
near a natural village and tries to make grounded material progress:

- collect logs;
- craft planks and sticks;
- create or place a crafting table;
- recover from blockers;
- leave runtime artifacts and screenshots for review.

The Qwen comparison used:

- provider: `modelscope-api`
- models: `Qwen-Ambassador/Qwen3.7-Plus`,
  `Qwen-Ambassador/Qwen3.7-Max`
- scenario: `natural-village-spawn-v1`
- seed: `4167799982467607063`
- visual profile: `report`
- server version for visual evidence: `1.21.4`

## Preflight

Run provider preflight before spending quota. The exact preflight artifact used
for the comparison is stored at:

```text
project-docs/experiments/curated/2026-06-29/goal-oriented-natural-village-30cycle-qwen/preflight/qwen-30cycle-preflight.json
```

The run should be treated as provider-backed and budget-sensitive. Do not start
with a long cycle count until a short provider smoke has passed.

## Example Run Shape

The Qwen lanes were produced through the social-cycle CLI with the natural
village scenario and report visual profile.

The command shape is:

```bash
bun run probe:social-cycle -- \
  --provider modelscope-api \
  --model Qwen-Ambassador/Qwen3.7-Max \
  --actor npc_b \
  --cycles 30 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../project-docs/experiments/curated/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-max.json
```

Use `Qwen-Ambassador/Qwen3.7-Plus` for the Plus lane.

## What To Inspect

Do not judge the run from model text alone. Inspect these artifacts:

- run report JSON;
- review summary JSON;
- visual evidence audit;
- provider usage ledger;
- inventory deltas;
- verifier status;
- selected first-person and third-person screenshots.

For the final comparison, start with:

```text
project-docs/exports/static/final-natural-village-model-comparison-report-2026-06-30.html
project-docs/experiments/curated/2026-06-30/goal-oriented-natural-village-gemini-30cycle-extension/combined-model-comparison-30cycle-analysis.json
```

## Observed Qwen Result

In this run:

| Lane | Verified progress | Blocked | No progress | Provider records | Total tokens |
| --- | ---: | ---: | ---: | ---: | ---: |
| Qwen Plus | 12 | 8 | 10 | 38 | 1.13M |
| Qwen Max | 15 | 8 | 7 | 38 | 1.09M |

Qwen Max produced the strongest material progression among the completed lanes:
wooden pickaxe evidence, six cobblestone, and later material continuation.

Qwen Plus produced a stable early chain around logs, planks, sticks, and
crafting-table evidence.

## Known Caveats

- This is not a general model ranking.
- The harness includes model behavior, action selection, Mineflayer execution,
  verifier contracts, generated action-skill handling, and provider quota
  effects.
- Screenshots are review-only evidence. Runtime artifacts own block identity
  and progress claims.
- Some camera modes can produce misleading cross-section-looking images. Treat
  those as visual caveats, not world truth.

## Next Better Experiment

The next run should narrow the objective:

```text
After placing or locating a crafting table, maintain a safe village-adjacent
work point for continued material work.
```

That target is better than asking for workbench, shelter, shared storage, and
long-run social continuity in a single 30-cycle lane.
