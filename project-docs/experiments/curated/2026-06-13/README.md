# 2026-06-13 Benchmark And Provider Experiments

Search token: `EXPERIMENT_2026_06_13_BENCHMARKS`.

Status: active dated experiment record.

## Archived Inputs

The following scratch experiment families were copied from `tmp/` into
`project-docs/experiments/raw/2026-06-13/`:

- ModelScope Qwen tool-calling smoke:
  `raw/2026-06-13/modelscope-tool-calling-check-20260613/`
- ModelScope social-cycle offline smokes:
  `raw/2026-06-13/modelscope-social-cycle-qwen-max-offline-smoke.json`
  and `raw/2026-06-13/modelscope-social-cycle-qwen-plus-offline-smoke.json`
- deterministic world/setup checks:
  `raw/2026-06-13/social-cycle-natural-safe-spawn-deterministic-1-20260613.json`
  and `raw/2026-06-13/social-cycle-deterministic-no-model-check.json`
- model comparison benchmarks:
  `raw/2026-06-13/benchmarks/model-comparison-20260613-small-oak-log/`
  `raw/2026-06-13/benchmarks/model-comparison-20260613-wooden-pickaxe/`
  `raw/2026-06-13/benchmarks/model-comparison-20260613-wooden-pickaxe-targeted/`

The generated full raw index is `project-docs/experiments/raw-index.md`; machine
readable metadata is `project-docs/experiments/catalog.json`.

## Previous Small Benchmark Review

### `small-oak-log-fresh-fixture-20260613`

Condition:

- target: collect at least one `oak_log`;
- cycles: 1;
- scenario: `roofless-hut-flat-survival-v1`;
- world: fresh fixture world per scored model;
- scored models: `gpt-5.4-mini`, `gpt-5.5`, `gpt-5.4`;
- reasoning: `low`.

Result:

- `gpt-5.5` reached the target in one cycle by selecting `collect_logs`.
- `gpt-5.4-mini` and `gpt-5.4` moved instead of collecting and did not reach
  the target.

Verdict: useful as a transport and action-selection smoke only. The target is
too easy and too short to compare model competence.

### `wooden-pickaxe-flat-benchmark-targeted-20260613`

Condition:

- target: craft one `wooden_pickaxe` from empty inventory;
- cycles: 8;
- scenario: `wooden-pickaxe-flat-benchmark-v1`;
- world: fresh fixture world per model;
- scored models: `gpt-5.5`, `Qwen-Ambassador/Qwen3.7-Max`,
  `Qwen-Ambassador/Qwen3.7-Plus`;
- scoring: tool schema compliance excluded; target requires runtime inventory
  or held-item evidence for `wooden_pickaxe`.

Result:

| Model | Target | Partial | Main Evidence |
|-------|--------|---------|---------------|
| `gpt-5.5` | not reached | 4/6 | collected logs, crafted planks, sticks, and crafting table, but did not place table or craft pickaxe within 8 cycles |
| `Qwen-Ambassador/Qwen3.7-Max` | not reached | 3/6 | collected logs, crafted planks and crafting table, then repeated blocked table placement |
| `Qwen-Ambassador/Qwen3.7-Plus` | not reached | 4/6 | collected/crafted enough intermediate materials but did not reach table placement or pickaxe |

Review findings:

- 8 cycles are not enough for a multi-step objective when the runtime allows
  only one primary action per cycle.
- The report did not include screenshots, so visual progress and placement
  state had to be inferred only from structured runtime artifacts.
- The target was better than one-log collection, but still too narrow to test
  recovery, visible construction, or sustained goal tracking.
- Qwen Max exposed a useful blocker pattern: repeated `place_block` attempts
  against occupied/support positions should be visible as benchmark recovery
  weakness, not hidden under final `runtime_status: passed`.

Behavior verdict: `DIAGNOSABLE_FAILURE`.

The run made real verified Minecraft progress, but the benchmark was undersized
and lacked visual evidence. The next run should use a longer cycle budget,
explicit milestone scoring, screenshots, trend charts, and a target that
requires both inventory progression and visible world mutation.

## Next Benchmark Standard

The next benchmark in this date folder should:

- run `gpt-5.5` for 50 cycles;
- set OpenAI reasoning effort explicitly to `medium`;
- use a fresh world reset before the run;
- use a fixed scenario/seed so repeated runs are comparable;
- enable visual evidence and include screenshots in the HTML report;
- score Minecraft behavior only, not provider tool-call or structured-args
  compliance;
- report trend charts for cumulative milestones, action mix, verifier outcomes,
  and provider latency.

ModelScope Qwen reasoning note: the current ModelScope API-Inference adapter
uses `chat_template_kwargs.enable_thinking=false` for reliable OpenAI-compatible
tool calls. No confirmed OpenAI-style `reasoning.effort` setting exists for
this endpoint yet. Do not treat Qwen as having a comparable reasoning-effort
knob until a smoke test proves one.

## 50-Cycle GPT-5.5 Medium Worksite Attempt

Directory:

```text
project-docs/experiments/curated/2026-06-13/50-cycle-gpt55-medium-worksite/
```

Result:

- requested: 50 cycles;
- completed: 29 cycles;
- provider/model: `openai-api` / `gpt-5.5`;
- reasoning: `medium`;
- world: fresh `wooden-pickaxe-flat-benchmark-v1`;
- visual evidence: 7 screenshots, 0 capture failures;
- behavior target: reached by cycle 12;
- process completion: failed at cycle 29 due OpenAI `insufficient_quota`.

Important interpretation: the Minecraft behavior benchmark target was reached,
but the benchmark harness did not stop on target completion. The process then
continued into blocker recovery and generated action authoring until provider
quota stopped the run. This should be treated as both a useful run and a harness
improvement requirement before the next expensive comparison.

Primary reports:

- `50-cycle-gpt55-medium-worksite/index.html`
- `50-cycle-gpt55-medium-worksite/summary.json`
- `50-cycle-gpt55-medium-worksite/README.md`
- `50-cycle-gpt55-medium-worksite/report.json`

## 50-Cycle GPT/Qwen Worksite Comparison

Directory:

```text
project-docs/experiments/curated/2026-06-13/qwen-comparison-worksite/
```

Condition:

- requested: 50 cycles per model;
- `max_actions_per_cycle`: 1;
- actor: `npc_b`;
- world: fresh `wooden-pickaxe-flat-benchmark-v1` world per model run;
- visual evidence: prismarine-viewer screenshots every 5 cycles plus
  initial/final captures when available;
- scoring boundary: tool schema and structured argument handling are excluded
  from benchmark scoring.

Scoring:

- strict user target: runtime evidence for `wooden_pickaxe`, explicit held or
  equipped `wooden_pickaxe`, and at least six unique actor-placed
  `oak_log`/`oak_planks` structure blocks;
- structure target without equip: runtime evidence for `wooden_pickaxe` and at
  least six unique actor-placed `oak_log`/`oak_planks` structure blocks;
- screenshots are review evidence, not verifier authority.

Result:

| Model | Runtime | Strict Target | Structure Target Without Equip | Main Evidence |
|-------|---------|---------------|--------------------------------|---------------|
| `gpt-5.5` / `medium` | provider quota stopped at cycle 29 | reached at cycle 16 | reached at cycle 16 | crafted and equipped `wooden_pickaxe`; placed six wood/log structure blocks by cycle 16 |
| `Qwen-Ambassador/Qwen3.7-Max` / `qwen-no-think` | completed 50 cycles | not reached | not reached | collected logs and crafted planks/table/sticks, but did not craft `wooden_pickaxe` or place wood/log structure blocks |
| `Qwen-Ambassador/Qwen3.7-Plus` / `qwen-no-think` | completed 50 cycles | not reached | reached at cycle 24 | crafted `wooden_pickaxe` and placed six wood/log blocks by cycle 24, but did not emit explicit held/equipped pickaxe evidence |

Provider usage:

| Model | Requests | Input Tokens | Output Tokens | Thinking Tokens | Total Tokens |
|-------|----------|--------------|---------------|-----------------|--------------|
| `gpt-5.5` | 53 | 1,105,268 | 145,659 | 88,992 | 1,250,927 |
| `Qwen-Ambassador/Qwen3.7-Max` | 60 | 1,741,445 | 27,893 | 0 | 1,769,338 |
| `Qwen-Ambassador/Qwen3.7-Plus` | 61 | 1,773,022 | 73,173 | 0 | 1,846,195 |

Billing follow-up:

- The `gpt-5.5` rows were recorded as `unbudgeted` because the local budget file
  did not include `openai-api` / `gpt-5.5`.
- That should have stopped the run. The guard instead returned an unbudgeted
  decision without throwing, so the run continued until OpenAI returned
  `insufficient_quota`.
- As a corrective action, the provider usage guard now fails closed for missing
  provider/model budgets by default. A deliberate unbudgeted smoke requires an
  explicit `track` plus `allow unbudgeted` local override, and benchmark runs
  must not use that override.
- OpenAI Responses background polling is also treated as provider HTTP usage:
  each poll must pass the guard and is recorded as one zero-token request.

Qwen reasoning condition: the ModelScope adapter ran both Qwen models with
`chat_template_kwargs.enable_thinking=false` and recorded the condition as
`qwen-no-think`. No ModelScope API-Inference field equivalent to OpenAI
`reasoning.effort = "medium"` has been confirmed.

Primary reports:

- `qwen-comparison-worksite/index.html`
- `qwen-comparison-worksite/summary.json`
- `qwen-comparison-worksite/qwen-3.7-max/report.json`
- `qwen-comparison-worksite/qwen-3.7-plus/report.json`
- `qwen-comparison-worksite/screenshots/`

## Visual Evidence Third-Person Smoke

Directory:

```text
project-docs/experiments/curated/2026-06-13/visual-evidence-third-person-smoke/
```

Result:

- provider: `deterministic-social`, no external LLM requests;
- camera mode: `third_person`;
- interval: `1`, meaning every completed cycle;
- visual evidence: initial, `cycle-0001` cycle-end, and final screenshots
  captured with zero capture failures.

The CLI exited nonzero because the one-cycle deterministic gameplay smoke ended
with runtime status `blocked`; the visual capture path itself passed.

## Plain Natural Seed Scout

Directory:

```text
project-docs/experiments/curated/2026-06-13/seed-scout-plain-natural/
```

Purpose: find ordinary natural seeds for future project-level LLM benchmarks,
preferably near useful early resources and optionally near villages.

Result:

| Candidate | Seed | Setup | Natural Validation | Recommendation |
|-----------|------|-------|--------------------|----------------|
| `plains-village-near-spawn` | `9137002542963915989` | passed | passed | default natural benchmark seed |
| `plains-village-cherry-nearby` | `4167799982467607063` | passed | passed | use for village-adjacent/social runs |
| `sunflower-plains-forest` | `9066` | passed | passed | backup ordinary plains/forest seed |
| `plains-village-south` | `300043` | failed | failed | reject for `natural-safe-spawn-v1` |
| `plain-flower-meadow` | `400` | failed | failed | reject for `natural-safe-spawn-v1` |

Provider usage: `deterministic-social` only, with zero external LLM requests.

Visual caveat: current natural-world screenshots are only rough scouting
evidence because local `prismarine-viewer` does not cleanly match Minecraft
`1.21.11`; structured world-scenario validation remains the authority for seed
selection.

## Stable 1.21.4 Natural Seed Capture

Directory:

```text
project-docs/experiments/curated/2026-06-13/seed-scout-1214-stable-capture/
```

Follow-up to the visual caveat above. The seed `9137002542963915989` was
re-captured with `PROBE_SERVER_VERSION=1.21.4`, matching a
`prismarine-viewer`-supported version exactly.

Result:

- setup: passed;
- natural spawn validation: passed;
- provider usage: `deterministic-social`, zero external LLM requests;
- first-person capture: natural forest/coast view, no redstone/crafter mismatch;
- third-person capture: natural forest/coast overview, no redstone/crafter
  mismatch;
- visual evidence stabilization: default viewer `viewDistance` raised to `8`
  and render settle waits added.

Use this condition for visual seed scouting until the viewer supports the
benchmark runtime server version exactly.

## Visual Evidence Dual-Camera Smoke

Directory:

```text
project-docs/experiments/curated/2026-06-13/visual-evidence-dual-camera-smoke/
```

Result:

- visual camera mode: `both`;
- interval: `1`, meaning every completed cycle;
- captures: first-person and third-person for initial, cycle-end, and final;
- capture failures: `0`;
- provider usage: `deterministic-social`, zero external LLM requests.

The third-person capture is center-cropped so the NPC remains visible instead of
being shown as a tiny marker from a very high overhead view.

## Qwen Local Quota Check

Artifact:

```text
project-docs/experiments/curated/2026-06-13/qwen-quota-check-20260613.json
```

Local ledger/cap result:

| Model | Local Monthly Cap | Used This Month | Remaining | 50-Cycle Rerun |
|-------|-------------------|-----------------|-----------|----------------|
| `Qwen-Ambassador/Qwen3.7-Max` | 100 requests | 81 requests | 19 requests | blocked |
| `Qwen-Ambassador/Qwen3.7-Plus` | 100 requests | 78 requests | 22 requests | blocked |

Do not start another 50-cycle Qwen benchmark under the current local cap. The
previous 50-cycle runs used more than 60 provider requests per model, so the
remaining local request budget is not enough for a full comparable rerun.
