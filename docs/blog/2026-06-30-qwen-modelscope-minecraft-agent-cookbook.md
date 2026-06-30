---
slug: qwen-modelscope-minecraft-agent-cookbook
title: "Cookbook: Run Qwen ModelScope Lanes in the Minecraft LLM-Agent Harness"
authors: [gigio1023]
tags: [qwen, modelscope, minecraft, llm-agents, cookbook, mineflayer]
---

This is the practical recipe I used to run the Qwen Plus and Qwen Max lanes in
the Minecraft LLM-agent harness through ModelScope API-Inference.

It is written as a reproducible operator note, not a leaderboard. The goal is
to start from a fresh natural village-adjacent Minecraft world, let a
provider-backed actor take bounded actions, and inspect the runtime artifacts
that say what actually happened.

<!--truncate-->

## What This Reproduces

The completed Qwen lanes used this shape:

- provider: `modelscope-api`
- models: `Qwen-Ambassador/Qwen3.7-Plus` and `Qwen-Ambassador/Qwen3.7-Max`
- actor: `npc_b`
- scenario: `natural-village-spawn-v1`
- seed: `4167799982467607063`
- cycles: `30`
- max actions per cycle: `1`
- visual profile: `report`
- Minecraft server version for report screenshots: `1.21.4`

The run objective was intentionally small:

```text
From a fresh natural village-adjacent start, create durable runtime evidence for
a useful shared work point without artificial resource grants.
```

In practice, that means the actor should try to collect logs, craft planks and
sticks, create or place a crafting table, recover from blockers, and leave
evidence that can be reviewed later. Prose alone does not count as progress.

## 1. Prepare ModelScope Access

Create or update the repo-local ignored `.env` file:

```text
MODELSCOPE_API_KEY=...
MODELSCOPE_BASE_URL=https://api-inference.modelscope.ai/v1
```

Use the exact model ids in commands and reports:

```text
Qwen-Ambassador/Qwen3.7-Plus
Qwen-Ambassador/Qwen3.7-Max
```

The social-cycle CLI does not infer the ModelScope model from environment
fallbacks. Pass `--model` explicitly every time so the report cannot hide which
model was evaluated.

For an account-level smoke test, call the OpenAI-compatible Chat Completions
endpoint directly:

```bash
MODEL_ID=Qwen-Ambassador/Qwen3.7-Max

curl -sS -D /tmp/modelscope-qwen.headers \
  -o /tmp/modelscope-qwen.response.json \
  "$MODELSCOPE_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $MODELSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "'"$MODEL_ID"'",
    "messages": [
      {
        "role": "user",
        "content": "Return one short sentence confirming the API works."
      }
    ],
    "stream": false
  }'

rg -i 'modelscope-ratelimit|retry-after|x-ratelimit' /tmp/modelscope-qwen.headers
jq '.usage // .' /tmp/modelscope-qwen.response.json
```

Do not commit tokens or paste raw credential output into reports.

## 2. Run A Provider-Free Visual Setup Smoke

Before spending ModelScope quota, confirm that the scenario and visual capture
path are working without a live provider:

```bash
cd probe

PROBE_SERVER_VERSION=1.21.4 \
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle -- \
  --provider deterministic-social \
  --model deterministic-social \
  --actor npc_b \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../tmp/social-cycle-natural-village-spawn-deterministic-1.json
```

This smoke may exit non-zero if the deterministic actor step blocks. For setup
review, inspect the report before judging the run:

- `server.world_scenario.setup_status`
- `server.world_scenario.manifest_ref`
- `server.world_scenario.natural_spawn_validation_status`
- `visual_evidence.audit.status`
- `visual_evidence.captures[]`

That smoke proves setup readiness: generated world, selected seed, spawn
validation, manifest linking, and report-profile screenshot capture. It does
not prove the Qwen lane will make good Minecraft progress.

## 3. Run Provider Quota Preflight

The completed comparison stored its Qwen preflight here:

```text
project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/preflight/qwen-30cycle-preflight.json
```

That artifact allowed both Qwen lanes under the local ModelScope monthly
API-call policies. The later completed lanes used 38 provider records each, so
future 30-cycle Qwen preflights should estimate at least 40 requests per lane.

From the repository root, the repo preflight helper command shape is:

```bash
mkdir -p tmp

bun .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
  --candidate modelscope-api:Qwen-Ambassador/Qwen3.7-Plus \
  --candidate modelscope-api:Qwen-Ambassador/Qwen3.7-Max \
  --estimate-requests 80 \
  --estimate-total-tokens 2500000 \
  > tmp/qwen-30cycle-preflight.json
```

Use a path appropriate for the experiment you are running. Do not overwrite a
published preflight artifact unless you intentionally want to replace that
record.

## 4. Run The Qwen Plus Lane

From `probe/`, run:

```bash
cd probe

PROBE_SERVER_VERSION=1.21.4 \
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle -- \
  --provider modelscope-api \
  --model Qwen-Ambassador/Qwen3.7-Plus \
  --actor npc_b \
  --cycles 30 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-plus.json
```

The completed lane produced:

- report: `project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-plus.json`
- review summary: `project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-plus-review-summary.json`
- review markdown: `project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-plus-review.md`

## 5. Run The Qwen Max Lane

Use the same scenario and output shape, changing only the model and report path:

```bash
cd probe

PROBE_SERVER_VERSION=1.21.4 \
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle -- \
  --provider modelscope-api \
  --model Qwen-Ambassador/Qwen3.7-Max \
  --actor npc_b \
  --cycles 30 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-max.json
```

The completed lane produced:

- report: `project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-max.json`
- review summary: `project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-max-review-summary.json`
- review markdown: `project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-max-review.md`

## 6. Generate Review Summaries

If you have a run report but not a review summary yet, use the review CLI:

```bash
cd probe

bun run probe:social-cycle-review -- \
  ../project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-plus.json \
  --markdown ../project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-plus-review.md

bun run probe:social-cycle-review -- \
  ../project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-max.json \
  --markdown ../project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/reports/qwen-3.7-max-review.md
```

For the completed comparison, start from these aggregate artifacts:

```text
project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/model-comparison-30cycle-analysis.json
project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/summary.json
project-docs/static-exports/no-regret-core-qwen-ambassador-report-2026-06-29.html
project-docs/static-exports/final-natural-village-model-comparison-report-2026-06-30.html
```

## 7. What To Inspect

Do not judge the run from model text alone. Inspect runtime artifacts:

- provider id and model id in the top-level report
- `provider_usage.records` and `provider_usage.totals`
- `provider_usage.budget_status`
- `server.world_scenario`
- `visual_evidence.audit`
- per-cycle action evidence refs
- verifier status and failure reasons
- inventory deltas
- world-state or observe artifacts near the cycle being claimed
- review summary outcomes: `verified_progress`, `blocked`, and `no_progress`

Screenshots are useful review context, especially for movement and obstruction
checks, but they are not the source of truth for block identity, inventory, or
progress. Pair screenshots with same-cycle runtime artifacts.

## Expected Metrics From The Completed Lanes

| Lane | Provider records | Total tokens | Verified progress | Blocked | No progress | Visual captures | Visual audit |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Qwen Plus | 38 | 1,129,990 | 12 | 8 | 10 | 96 | passed |
| Qwen Max | 38 | 1,093,021 | 15 | 8 | 7 | 96 | passed |

Material milestones from the completed artifacts:

- Qwen Plus: crafting-table evidence, wooden pickaxe in inventory, retained logs
  and planks.
- Qwen Max: crafting-table evidence, wooden pickaxe in inventory, six
  cobblestone by the end of the lane.

Those numbers are useful for reproducing this harness lane. They are not a
general Qwen ranking and not evidence that interaction history beats a plain
LLM prior.

## Caveats

- This is a provider-backed Minecraft runtime run, not a pure prompt test.
- The result mixes model behavior, tool selection, Mineflayer execution,
  verifier contracts, generated action-skill handling, pathing, visual capture,
  and provider quota state.
- `--visual-profile report` should use `PROBE_SERVER_VERSION=1.21.4` for
  report-grade screenshots in this harness.
- A provider 429 or budget blocker is provider infrastructure evidence, not
  Minecraft actor behavior.
- Qwen Max cycle 30 had third-person camera frames that looked like a terrain
  cross-section. The paired runtime evidence recorded local stone mining and
  cobblestone increase; treat the strange third-person frames as camera/renderer
  caveats.
- The 30-cycle task did not prove social or storage progress. It mainly tested
  single-actor physical competence, continuity, blocker recovery, and evidence
  quality in a natural village-adjacent world.

## Next Tighter Run

The next cleaner experiment should narrow the objective:

```text
After placing or locating a crafting table, maintain a safe village-adjacent
work point for continued material work.
```

That target is easier to score than bundling workbench, shelter, shared storage,
and long-run social continuity into one 30-cycle lane.
