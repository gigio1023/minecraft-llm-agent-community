# Qwen 3.8 Max: One Natural-Language Minecraft Goal

Recorded: 2026-07-30

## Recording verdict

The run is complete enough to review and publish. The social-cycle audit passed,
the readiness check passed with `--publishable`, and all 129 unique actor
workspace references resolved after archive relocation.

## Experiment verdict

`VALID_PROGRESS` for the requested Minecraft objective.

Qwen 3.8 Max crafted a wooden pickaxe at cycle 8 and retained one in the final
consolidated inventory. The overall run status is `failed` because the request
that would have started cycle 19 timed out. The timeout happened after the
target state had already been reached and does not invalidate the earlier
inventory mutation.

Visual evidence verdict: the captures are useful for run context but weak as
state evidence. The initial frame contains Prismarine Viewer texture artifacts.
The final frame is camera-obstructed. Item and completion claims come from
runtime evidence instead.

## Run identity

| Field | Value |
| --- | --- |
| Run ID | `social-cycle-9f443429-550b-40d4-ae46-ad3e12dc7862` |
| Actor | `npc_b` |
| Provider | `alibaba-model-studio-api` |
| Model | `qwen3.8-max-preview` |
| Reasoning | `xhigh` |
| Minecraft | `1.21.11` |
| Scenario | `natural-safe-spawn-v1` |
| Seed | `4167799982467607063` |
| World | fresh, natural generation, no progress fixture |
| Planned cycles | 20 |
| Completed cycles | 18 |
| Maximum actions per cycle | 1 |
| Visual profile | first-person, initial and final capture |

The actor-facing task was:

```text
Starting from an empty inventory in this fresh natural world, craft and retain
one wooden pickaxe. Choose the intermediate steps yourself. Count only inventory
or world-state changes as progress.
```

## Command

Run from `probe/`:

```bash
bun run probe:social-cycle -- \
  --provider alibaba-model-studio-api \
  --model qwen3.8-max-preview \
  --actor npc_b \
  --cycles 20 \
  --max-actions-per-cycle 1 \
  --fresh-world \
  --world-scenario natural-safe-spawn-v1 \
  --world-seed 4167799982467607063 \
  --benchmark-task "Starting from an empty inventory in this fresh natural world, craft and retain one wooden pickaxe. Choose the intermediate steps yourself. Count only inventory or world-state changes as progress." \
  --visual-evidence \
  --visual-evidence-interval 20 \
  --visual-evidence-camera first_person \
  --report ../project-docs/experiments/curated/2026-07-30/qwen38-natural-wooden-pickaxe/reports/qwen38-wooden-pickaxe-20cycle.json \
  --no-dashboard
```

## What happened

The actor followed a short material chain:

| Cycle | Action | Runtime result |
| ---: | --- | --- |
| 1 | `collect_logs` | verified inventory progress |
| 2 | `craftPlanksAndSticks` | verified inventory progress |
| 4 | `craftCraftingTable` | verified inventory progress |
| 7 | `placeCraftingTable` | crafting table verified at `(10, 111, -11)` |
| 8 | `craftWoodenPickaxe` | `wooden_pickaxe` increased from 0 to 1 |
| 13 | `mineCobblestone` | blocked by a mining timeout |
| 15 | `buildBasicShelter` | partial world mutation, local verifier still failed |
| 18 | `collect_logs` | verified inventory progress |
| 19 start | provider request | Alibaba Model Studio request timed out |

Outcome distribution across the 18 completed cycles:

| Outcome | Cycles |
| --- | ---: |
| `verified_progress` | 11 |
| `partial_verified_progress` | 1 |
| `no_progress` | 5 |
| `blocked` | 1 |

The final consolidated state recorded:

- `wooden_pickaxe x1`
- `oak_planks x4`
- `white_bed x1`
- `stick x2`
- `oak_log x2`
- a verified placed crafting table
- four placed shelter blocks, without a verified complete shelter

The last direct observe record at cycle 15 also showed the wooden pickaxe as the
held item. Later cycles did not consume it.

## Provider usage

The live main-lane preflight allowed at most 30 requests and 1,200,000 total
tokens. The run recorded:

| Metric | Main run |
| --- | ---: |
| Requests | 23 |
| Input tokens | 509,867 |
| Output tokens | 60,278 |
| Thinking tokens | 45,104 |
| Total tokens | 570,145 |

Thinking tokens are reported within the provider's completion accounting and
must not be added to total tokens a second time.

A separate one-cycle canary used one request and 17,420 tokens. It confirmed the
exact model, raw `reasoning_content`, provider-reported usage, and no retry.

The local policy recorded the model as within its 120 RPM and 500K TPM
guardrails. Preview billing status was not established by the local quota
policy, so the operator explicitly approved the bounded run before it started.

## Claim table

| Claim | Evidence |
| --- | --- |
| The target item was crafted | `evidence/cycle-0008-action-01-craft_with_table.json` records count `0 -> 1` |
| The target item was retained | final `settlement_state.inventory_counts` and the cycle 15 observe evidence contain `wooden_pickaxe x1` |
| A crafting table was placed | cycle 7 `place_block` evidence and settlement position refs |
| The world was natural and fresh | scenario manifest and natural-spawn validation refs in the report |
| The run stopped on a provider timeout | top-level `provider_error` and `runtime_status: failed` |
| Usage stayed within the approved estimate | main preflight plus report-local provider usage summary |
| Screenshots do not prove item identity | visual capture artifacts and the runtime review rule |

## What is not proven

- This is one model, one seed, one task, and one run.
- It is not a matched comparison with the June Qwen 3.7 or earlier Qwen runs.
- It does not establish model superiority or general Minecraft competence.
- It does not test social behavior.
- The final screenshot cannot prove that the pickaxe was retained because the
  camera points into nearby blocks.
- The 20-cycle lane did not complete. Eighteen cycles are recorded.
- The run continued after the cycle 8 target state because this lane had no
  target-predicate early stop.

## Next experiment

Repeat the same task with an explicit runtime stop as soon as a verifier confirms
`wooden_pickaxe >= 1`. That would isolate time and provider usage to the actual
goal instead of spending ten more cycles on equipment checks, mining, shelter
work, and surplus materials.

## Artifacts

- `preflight/approved.json`: combined bounded approval
- `preflight/canary-approved.json`: immediate canary approval
- `preflight/main-approved.json`: immediate main-lane approval
- `reports/qwen38-canary.json`: one-cycle provider canary
- `reports/qwen38-wooden-pickaxe-20cycle.json`: raw main report
- `reports/qwen38-audit.json`: social-cycle audit
- `reports/qwen38-review.md`: generated review summary
- `reports/qwen38-wooden-pickaxe-20cycle-review-summary.json`: review data
- `reports/report-archive-relocation.json`: SHA-256-bound archive relocation
- `runtime-artifacts/actor-workspace/`: archived actor workspace and captures
