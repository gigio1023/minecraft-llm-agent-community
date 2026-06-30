---
slug: provider-lane-cookbook
title: "Cookbook: Run Provider Lanes in the Minecraft LLM-Agent Harness"
authors: [gigio1023]
tags: [minecraft, llm-agents, cookbook, mineflayer, evaluation]
---

This is the practical recipe I used to run provider-backed lanes in the Minecraft
LLM-agent harness. The concrete run below used Qwen Plus and Qwen Max through
ModelScope API-Inference, but the harness pattern is not tied to that provider.

This cookbook reflects the project state completed on June 30, 2026. It is an
operator note, not a leaderboard. The goal is to start from a fresh natural
village-adjacent Minecraft world, let a provider-backed actor take bounded
actions, and review what happened from screenshots, inventory, world-state scans,
and action logs.

<!--truncate-->

## What This Reproduces

The completed example lanes used this shape:

- provider: `modelscope-api`
- example models: Qwen Plus and Qwen Max through ModelScope API-Inference
- actor: `npc_b`
- scenario: `natural-village-spawn-v1`
- seed: `4167799982467607063`
- cycles: `30`
- max actions per cycle: `1`
- visual profile: `report`
- Minecraft server version for report screenshots: `1.21.4`

The run objective was intentionally small:

```text
From a fresh natural village-adjacent start, establish a useful work point for
continued material work. Collect wood, craft basic materials, make or use a
crafting table, recover from blockers, and leave the world in a state that can
be reviewed from inventory, screenshots, and runtime records.
```

In practice, that means the actor should try to collect logs, craft planks and
sticks, create or place a crafting table, recover from blockers, and leave
world changes that can be reviewed later. Prose alone does not count as progress.

## 1. Prepare Provider Access

Create or update the repo-local ignored `.env` file:

```text
MODELSCOPE_API_KEY=...
MODELSCOPE_BASE_URL=https://api-inference.modelscope.ai/v1
```

For this example, set the concrete ModelScope model ids available to your account:

```bash
export MODELSCOPE_QWEN_PLUS_MODEL='<your ModelScope Qwen Plus model id>'
export MODELSCOPE_QWEN_MAX_MODEL='<your ModelScope Qwen Max model id>'
```

The social-cycle CLI does not infer the model from provider environment fallbacks.
Pass `--provider` and `--model` explicitly every time so the report cannot hide
which lane was evaluated.

For a ModelScope account-level smoke test, call the OpenAI-compatible Chat
Completions endpoint directly:

```bash
MODEL_ID="$MODELSCOPE_QWEN_MAX_MODEL"

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

Before spending live provider quota, confirm that the scenario and visual capture
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

That smoke checks setup readiness: generated world, selected seed, spawn
validation, manifest linking, and report-profile screenshot capture. It does
not show that a live model lane will make good Minecraft progress.

## 3. Run Provider Quota Preflight

The completed comparison first checked whether the planned ModelScope calls fit
the local provider policy. The later completed lanes used 38 provider records
each, so similar preflights should estimate at least 40 requests per lane.

From the repository root, the repo preflight helper command shape is:

```bash
mkdir -p tmp

bun .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
  --candidate "modelscope-api:$MODELSCOPE_QWEN_PLUS_MODEL" \
  --candidate "modelscope-api:$MODELSCOPE_QWEN_MAX_MODEL" \
  --estimate-requests 80 \
  --estimate-total-tokens 2500000 \
  > tmp/modelscope-provider-lane-preflight.json
```

Use a path appropriate for the experiment you are running. Keep the preflight
beside the run notes if you plan to publish the result.

## 4. Run One ModelScope Lane

From `probe/`, run:

```bash
cd probe

PROBE_SERVER_VERSION=1.21.4 \
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle -- \
  --provider modelscope-api \
  --model "$MODELSCOPE_QWEN_PLUS_MODEL" \
  --actor npc_b \
  --cycles 30 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../tmp/modelscope-provider-lane-plus.json
```

The important result is the run report JSON plus the screenshots written by the
visual profile. Keep them with whatever public write-up or private run note you
are using for the experiment.

## 5. Run A Second ModelScope Lane

Use the same scenario and output shape, changing only the model and report path:

```bash
cd probe

PROBE_SERVER_VERSION=1.21.4 \
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle -- \
  --provider modelscope-api \
  --model "$MODELSCOPE_QWEN_MAX_MODEL" \
  --actor npc_b \
  --cycles 30 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../tmp/modelscope-provider-lane-max.json
```

The completed example used this second lane to compare whether the same setup led
to different material progress, blocker patterns, and provider-record usage.

## 6. Generate Review Summaries

If you have a run report but not a review summary yet, use the review CLI:

```bash
cd probe

bun run probe:social-cycle-review -- \
  ../tmp/modelscope-provider-lane-plus.json \
  --markdown ../tmp/modelscope-provider-lane-plus-review.md

bun run probe:social-cycle-review -- \
  ../tmp/modelscope-provider-lane-max.json \
  --markdown ../tmp/modelscope-provider-lane-max-review.md
```

For a public post, summarize the run instead of pasting raw repository paths.
Readers need the objective, setup, model lane, screenshots, final inventory,
major blockers, and a short caveat list.

## 7. What To Inspect

Do not judge the run from model text alone. Inspect the run report:

- provider id and model id in the top-level report
- `provider_usage.records` and `provider_usage.totals`
- `provider_usage.budget_status`
- `server.world_scenario`
- `visual_evidence.audit`
- per-cycle action records
- action status and failure reasons
- inventory deltas
- world-state or observe records near the cycle being claimed
- review summary outcomes: observed progress, blocked, and no progress

Screenshots are useful review context, especially for movement and obstruction
checks, but they are not enough by themselves for block identity, inventory, or
progress. Pair screenshots with same-cycle logs.

## Expected Metrics From The Completed Lanes

| Lane | Provider records | Total tokens | Observed progress | Blocked | No progress | Visual captures | Visual audit |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Qwen Plus | 38 | 1,129,990 | 12 | 8 | 10 | 96 | passed |
| Qwen Max | 38 | 1,093,021 | 15 | 8 | 7 | 96 | passed |

Material milestones from the completed run:

- Qwen Plus: crafting-table progress, wooden pickaxe in inventory, retained logs
  and planks.
- Qwen Max: crafting-table progress, wooden pickaxe in inventory, six
  cobblestone by the end of the lane.

Those numbers are useful for reproducing this harness lane. They are not a
general model ranking and do not say whether interaction history beats a plain
LLM prior.

## Caveats

- This is a provider-backed Minecraft runtime run, not a pure prompt test.
- The result mixes model behavior, tool selection, Mineflayer execution,
  generated action-skill handling, pathing, visual capture, and provider quota
  state.
- `--visual-profile report` should use `PROBE_SERVER_VERSION=1.21.4` for
  report screenshots in this harness.
- A provider 429 or budget blocker is provider infrastructure state, not
  Minecraft actor behavior.
- Qwen Max cycle 30 had third-person camera frames that looked like a terrain
  cross-section. The paired runtime records showed local stone mining and
  cobblestone increase; treat the strange third-person frames as camera/renderer
  caveats.
- This short task did not prove social or storage progress. It mainly tested
  single-actor physical competence, continuity, and blocker recovery in a natural
  village-adjacent world.

## Next Tighter Run

The next cleaner experiment should narrow the objective:

```text
After placing or locating a crafting table, maintain a safe village-adjacent
work point for continued material work.
```

That target is easier to review than bundling workbench, shelter, shared storage,
and long-run social continuity into one run.
