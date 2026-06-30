# Goal-Oriented Natural Village 30-Cycle Model Comparison

Status: completed on 2026-06-29.

This experiment replaces the earlier 1-cycle and 4-cycle smoke runs with a
minimum meaningful 30-cycle goal-oriented pilot. It now contains three completed
lanes: Qwen3.7 Plus, Qwen3.7 Max, and OpenAI `gpt-5.4-mini`.

It is still a pilot, not a Goldilocks decision and not a broad model
leaderboard. The comparison is about goal-oriented physical competence,
continuity, budget pressure, visual recording, and diagnosable runtime blockers
in a natural village-adjacent world.

## Objective

```text
From a fresh natural village-adjacent start, create durable runtime evidence for
a useful shared work point without artificial resource grants.
```

The task pushed the actor to make concrete Minecraft progress: collect logs,
craft planks/sticks/crafting table, place or use the crafting table near a safe
village-adjacent spot, move toward relevant affordances, and optionally inspect
or deposit into storage if an actual chest was found.

Useful evidence means inventory deltas, placed blocks, known positions, movement
with position delta, container mutation, or explicit blocker evidence. Prose was
not counted as progress.

## World And Capture

- Scenario: `natural-village-spawn-v1`
- Seed: `4167799982467607063`
- Fresh world per lane: yes
- Actor: `npc_b`
- Cycles: `30`
- Max actions per cycle: `1`
- Visual profile: `report`
- Server version required by report capture: `1.21.4`
- Camera modes: `first_person`, `third_person_follow`, `third_person_high`

All three completed lanes passed the visual evidence audit and captured 96
images each.

Visual caveat: Qwen Max `cycle-0030` `third_person_follow` and
`third_person_high` show a terrain cross-section because the current report
camera can clip near underground geometry. The bot was at approximately
`{x:13.3,y:103,z:15.37}` after mining local `stone`; runtime evidence for
`cycle-0030-action-01-mine_block.json` records `stone` at
`{x:14,y:103,z:15}`, `cobblestone` increasing from `4` to `6`, and
`blockRemoved:true`. Do not interpret those third-person pixels as model
perception, xray access, or block-identity evidence. Use the first-person frame
and same-cycle runtime evidence for that final state.

## Provider Feasibility

Preflight artifacts are in `preflight/`.

| Provider/model | 30-cycle feasibility | Reason |
| --- | --- | --- |
| `modelscope-api:Qwen-Ambassador/Qwen3.7-Plus` | allowed | Under Qwen Ambassador monthly API-call policy |
| `modelscope-api:Qwen-Ambassador/Qwen3.7-Max` | allowed | Under Qwen Ambassador monthly API-call policy |
| `openai-api:gpt-5.5` | blocked | Projected large-pool tokens exceeded 1M/day and local one-cycle cap request/month limits |
| `openai-api:gpt-5.4-mini` | allowed after dashboard check | Local ledger under cap; user dashboard usage confirmed low same-day input usage |
| `gemini-api:gemini-3.1-flash-lite` | allowed | Under local observed Gemini policy |
| `gemini-api:gemini-2.5-flash-lite` | blocked | Projected requests exceed observed 20 RPD free-tier cap |
| `gemini-api:gemma-4-31b-it` | allowed | Under local observed Gemma/Gemini request policy |

Actual Qwen usage was 38 provider records per 30-cycle lane. Future 30-cycle
Qwen preflights should estimate at least 40 requests per lane, not 35.

OpenAI dashboard check supplied by the user after the Qwen run:

- Total `Responses and Chat Completions` input usage: `98,664` tokens.
- `gpt-5_5-2026-04-23`: `71,568` input tokens.
- `gpt-5_4-mini-2026-03-17`: `27,096` input tokens.

This matched the local ledger scale. With this dashboard check treated as
operator approval, `gpt-5.4-mini` was run as the OpenAI 30-cycle comparison
candidate. `gpt-5.5` is still not a runnable 30-cycle lane because the projected
large-model pool total exceeds `1M/day`, and a reduced 16-request/500K estimate
is still blocked by the local `gpt-5.5` one-cycle cap.

Important budget lesson: the `gpt-5.4-mini` pre-run preflight estimated 40
requests and 1.3M total tokens. The completed run used 204 provider records and
1,115,823 total tokens. Tokens stayed under the local mini-pool guard, but the
request estimate was wrong. Future OpenAI mini 30-cycle preflights should
estimate at least 220 requests, not 40.

## Main Results

| Lane | Status | Review outcomes | Verifier counts | Final inventory | Main material milestones | Main blockers |
| --- | --- | --- | --- | --- | --- | --- |
| Qwen3.7 Plus | passed | `verified_progress:12`, `blocked:8`, `no_progress:10` | `passed:20`, `failed:8`, `not_applicable:2` | `cherry_planks:2`, `oak_planks:1`, `oak_log:3`, `stick:2`, `wooden_pickaxe:1` | crafting table placed/known; wooden pickaxe crafted; later recovered to more log collection | repeated `move_to` path failures; failed stone/log mine mappings; no nearby shared chest |
| Qwen3.7 Max | passed | `verified_progress:15`, `blocked:8`, `no_progress:7` | `passed:16`, `failed:8`, `not_applicable:6` | `wooden_pickaxe:1`, `stick:6`, `cherry_planks:1`, `dirt:4`, `cobblestone:6` | crafting table placed/known; wooden pickaxe crafted; late cobblestone/dirt collection | repeated table-crafting recipe failures; repeated `move_to` path failures |
| GPT-5.4 mini | passed | `verified_progress:8`, `blocked:9`, `no_progress:13` | `passed:19`, `failed:9`, `not_applicable:2` | `crafting_table:1`, `oak_planks:6`, `stick:4`, `dirt:3`, `pink_petals:2`, `oak_stairs:1`, `oak_log:3` | completed 30 cycles and held a crafting table, but did not satisfy `crafting_table_known_or_placed`; attempted generated placement skills | repeated crafting-table placement failures; movement timeouts; generated Mineflayer schema/tool friction; high request count |

Qwen Plus and Qwen Max satisfied:

- `crafting_table_known_or_placed`
- `memory_or_judgment_persisted`
- `recent_blockers_summarized`

GPT-5.4 mini satisfied:

- `memory_or_judgment_persisted`
- `recent_blockers_summarized`

All three runs did not satisfy:

- `starter_shelter_verified`
- `shared_storage_contribution`

## Interpretation

The 30-cycle horizon was justified. The first few cycles only show the obvious
wood-to-table chain. The later cycles expose the real behavior: recovery after
crafting failure, movement friction in natural terrain, weak chest/storage
discovery, and whether the model pivots from blocked plans.

In this comparison:

- Qwen Plus showed cleaner early tool-chain closure and strong verifier-passed
  count.
- Qwen Max showed the strongest review-level verified progress and the best late
  material continuation through cobblestone/dirt.
- GPT-5.4 mini completed the same 30-cycle horizon, but its main signal was
  diagnostic: it retained useful inventory items, tried generated placement
  actions, and exposed placement/codegen friction instead of closing the shared
  work point.
- No lane produced social/storage progress. This is still mainly a single-actor
  physical competence and continuity pilot.

## Artifacts

- Machine summary: `summary.json`
- Aggregate model comparison: `model-comparison-30cycle-analysis.json`
- Qwen Plus report: `reports/qwen-3.7-plus.json`
- Qwen Plus review: `reports/qwen-3.7-plus-review.md`
- Qwen Max report: `reports/qwen-3.7-max.json`
- Qwen Max review: `reports/qwen-3.7-max-review.md`
- GPT-5.4 mini report: `reports/gpt-5.4-mini.json`
- GPT-5.4 mini review: `reports/gpt-5.4-mini-review.md`
- Raw logs: `logs/`
- Provider preflights: `preflight/`
- Static HTML report:
  `project-docs/static-exports/no-regret-core-qwen-ambassador-report-2026-06-29.html`

The files `qwen-3.7-plus-interrupted.*` and `qwen-3.7-plus-env-failed.*` are
preserved as operational evidence. They are not part of the main comparison.
