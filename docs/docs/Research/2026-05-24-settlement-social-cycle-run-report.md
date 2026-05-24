# Settlement Social Cycle Run Report

Date: 2026-05-24

## Summary

The previous long run showed that `npc_b` treated log collection as the whole
objective. The root cause was not one movement bug. The actor profile and role
contract still described Jun as a gatherer, the social-cycle runtime did not
dispatch storage primitives, and table-bound crafting depended on returning to
one prepared crafting table across rough terrain.

This pass changes Jun's goal surface to survival and settlement building while
keeping the LLM free to choose actions from observed context. The runtime now
gives the LLM more useful embodied affordances instead of a fixed strategy.

## Implementation

- Added the `settler` role with movement, collection, crafting, table crafting,
  mining, storage, speech, wait, and memory affordances.
- Updated `npc_b`/Jun from narrow gatherer to practical settlement founder.
- Let social-cycle execution dispatch `inspect_chest`, `deposit_shared`, and
  `withdraw_shared`.
- Added fresh-world spawn access preparation: world spawn, cleared platform,
  nearby chest, and crafting table.
- Made craft planning more tolerant of natural LLM names such as
  `planks_and_sticks`.
- Changed unavailable inventory recipes from runtime `error` to truthful
  `blocked` evidence.
- Expanded `craft_with_table` so it can move toward an existing table and place
  a local crafting table when the actor has one.
- Added prompt guidance that repeated surplus of one resource is weaker than
  diversified survival/settlement progress.
- Added a 2026-05-24 Hugging Face CLI memory-paper refresh to the memory plan.

## 60-Cycle Result

Report:

```text
tmp/live-social-cycle-openai-api-60cycle-settlement-fresh-seed-2048005618087379093-final3-20260524.json
```

Review:

```text
tmp/live-social-cycle-openai-api-60cycle-settlement-fresh-seed-2048005618087379093-final3-20260524-review.md
```

Run configuration:

- model: `gpt-5.4-mini`
- provider: `openai-api`
- cycles: `60`
- fresh world: `true`
- seed: `2048005618087379093`
- Minecraft version: `1.21.11`
- spawn access prepared: `true`
- fixture dependency: `false`

Outcome:

- `runtime_status: passed`
- `provider_error: null`
- report audit: passed
- `gameplay_progress_verified: true`
- `builtin_goal_authority: false`

Tool evidence summary:

| Tool status | Count |
| --- | ---: |
| `collect_logs=collected` | 5 |
| `collect_logs=blocked` | 1 |
| `craft_item=crafted` | 11 |
| `craft_with_table=crafted` | 2 |
| `craft_with_table=blocked` | 12 |
| `mine_block=blocked` | 2 |
| `move_to=arrived` | 8 |
| `move_to=moved` | 4 |
| `move_to=blocked` | 11 |
| `observe=ok` | 61 |
| `remember=remembered` | 20 |
| `wait=waited` | 32 |

Important concrete evidence:

- The old `collect_logs` loop did not recur. Collection succeeded five times
  across 60 cycles, not 31 times.
- The actor moved repeatedly and had verified movement: `arrived=8`,
  `moved=4`.
- Inventory crafting succeeded eleven times, including planks, sticks, and
  crafting tables.
- Table-bound crafting succeeded twice, producing `wooden_pickaxe`:
  - `cycle-0029-action-01-craft_with_table`
  - `cycle-0033-action-01-craft_with_table`
- The actor attempted stone progression twice. Both were truthful blocks:
  no reachable stone within 12 blocks.

## Interpretation

The run now demonstrates a broader settlement-oriented loop:

```text
observe -> move/explore -> collect starter wood -> craft materials ->
establish/use crafting table -> craft wooden pickaxe -> attempt stone
```

This is a meaningful improvement over a gatherer-only resource loop. The LLM
still makes imperfect choices, but failures are grounded in runtime evidence
and the loop continues instead of fabricating progress.

## Remaining Gaps

- Finished shelter construction is still not proven in an OpenAI long-horizon
  run. The later 100-cycle home-base stress test did reach
  `build_pattern:progressing` and placed partial shelter shell blocks, but the
  shelter verifier correctly rejected the incomplete shell.
- `mine_block` needs better stone discovery or bounded excavation support; the
  60-cycle run found no reachable stone within the current 12-block scan.
- Table-bound crafting still receives repeated blocked attempts when inputs are
  unavailable. This is truthful, but the planner should learn to pivot faster.
- Storage was wired into the social executor, but the final 60-cycle run did
  not choose a successful deposit. The prepared chest and primitive are present;
  public-storage behavior needs stronger observation/retrieval pressure.

## 100-Cycle Home-Base Follow-Up

A later one-actor OpenAI run used a fresh world and a long-horizon WorldEvent to
make a small believable home base:

```text
tmp/live-social-cycle-openai-home-100.json
```

The run requested 100 cycles and recorded 54 cycles before cleanup hit a
host-side file-permission blocker. The report audit passed. The run used
OpenAI provider authority rather than builtin fallback, reused previous
judgment and memory, collected logs, crafted planks, and placed partial shelter
shell blocks.

The important result is not "home complete." The important result is that the
runtime produced diagnosable partial progress and did not claim completion
without shelter verification.

Future-work follow-ups are tracked in
`docs/docs/Architecture/Future-Works.md`.

## Validation

Commands run:

```text
cd probe && bun run typecheck
bun test probe/test/craftItem.test.ts probe/test/craftWithTable.test.ts probe/test/socialCycleExecution.test.ts
bun test probe/test/socialCycleExecution.test.ts probe/test/skillOwnership.test.ts probe/test/actorProfiles.test.ts probe/test/actorWorkspace.test.ts
bun run probe:social-cycle -- --actor npc_b --provider openai-api --model gpt-5.4-mini --cycles 60 --max-actions-per-cycle 3 --isolate-workspace --fresh-world --world-seed 2048005618087379093 --prepare-spawn-access --world-event "Jun's life goal is to survive and build a small settlement. Treat the spawn access point as the home base, use nearby wood only as a starter resource, broaden into crafting, stone/tool progression, scouting, and shared storage when evidence supports it, and avoid repeating one stocked material as the whole goal." --report tmp/live-social-cycle-openai-api-60cycle-settlement-fresh-seed-2048005618087379093-final3-20260524.json --no-dashboard
bun run src/runtime/goals/socialCycleReportAuditCli.ts tmp/live-social-cycle-openai-api-60cycle-settlement-fresh-seed-2048005618087379093-final3-20260524.json
git diff --check
```
