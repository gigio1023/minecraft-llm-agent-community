# Goal-Oriented Natural Village Gemini 30-Cycle Extension

Date: 2026-06-30

This folder extends the 2026-06-29 natural-village 30-cycle comparison with
only the Gemini-family lane that actually completed the current harness.

The goal is not to crown a model. The comparison asks a narrower question:
under the same natural village spawn, visual evidence rule, and 30-cycle budget,
which model keeps making grounded progress toward a simple Minecraft settlement
starter task, and where does it fail?

## Included Lane

`gemini-3.1-flash-lite` is included as
`gemini-31-flash-lite-paced`.

Run condition:

```bash
GEMINI_MIN_REQUEST_INTERVAL_MS=15000 GEMINI_JSON_MAX_RETRIES=0 \
  bun run probe:social-cycle -- \
  --provider gemini-api \
  --model gemini-3.1-flash-lite \
  --actor npc_b \
  --cycles 30 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report
```

Result:

- runtime status: `passed`
- cycles: `30`
- visual audit: `passed`
- visual captures: `96`
- provider requests: `67`
- total tokens: `1,709,204`
- verified progress: `11`
- blocked cycles: `19`
- final inventory: `oak_log x1, oak_planks x4, stick x8`
- settlement checklist: crafting table, memory/judgment, and blocker summary
  satisfied; starter shelter and shared storage pending

Interpretation:

Gemini 3.1 Flash Lite completed the same 30-cycle lane only after explicit
request pacing. It produced a real early material chain: logs, planks/sticks,
and a placed crafting table. The later run mostly exposed harness friction:
movement blockers, table-crafting limitations, and generated-action/provider
contract rejection.

## Excluded Candidates

These candidates are recorded, but not added as completed model-comparison
lanes.

- `gemini-2.5-flash-lite`: blocked by the observed free-tier request/day policy
  during provider preflight.
- `gemma-4-31b-it`: request-budget feasible in preflight, but the actual
  provider call failed before cycle 1 with `INVALID_ARGUMENT`.
- `gemini-3.1-flash-lite` unpaced: stopped at cycle 6 on the Gemini free-tier
  `250k` input-token-per-minute limit.

## Artifacts

- Preflight:
  `preflight/gemini-runnable-lanes-30cycle-high-estimate.json`
- Completed run report:
  `reports/gemini-3.1-flash-lite-paced.json`
- Completed run review:
  `reports/gemini-3.1-flash-lite-paced-review-summary.json`
- Combined comparison:
  `combined-model-comparison-30cycle-analysis.json`
- Short index:
  `summary.json`
- Static HTML report:
  `../../project-docs/exports/static/no-regret-core-qwen-ambassador-report-2026-06-29.html`

## Combined Completed Lanes

After this extension, the report has four completed 30-cycle lanes:

| Lane | Provider | Verified progress | Blocked | No progress | Requests | Total tokens |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Qwen Plus | ModelScope | 12 | 8 | 10 | 38 | 1,129,990 |
| Qwen Max | ModelScope | 15 | 8 | 7 | 38 | 1,093,021 |
| GPT-5.4 mini | OpenAI | 8 | 9 | 13 | 204 | 1,115,823 |
| Gemini 3.1 Flash Lite paced | Gemini API | 11 | 19 | 0 | 67 | 1,709,204 |

`no_progress` is absent for Gemini because the cycle outcomes in this lane
collapsed into either verified progress or blocked results under the current
review classifier.

## Operational Rule

Do not run Gemini 3.1 Flash Lite unpaced for 30-cycle report-grade experiments.
The unpaced attempt failed on provider TPM, not on Minecraft behavior. Use
`GEMINI_MIN_REQUEST_INTERVAL_MS=15000` unless the quota policy or active
dashboard evidence changes.
