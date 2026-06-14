# Qwen 60-Cycle Dual-Camera Review And Next Benchmark

Search token: `EXPERIMENT_2026_06_14_QWEN_60_REVIEW`.

Status: review completed after inspecting the run reports, runtime review
summaries, scenario manifest evidence, action distributions, and representative
screenshots.

## Verdict

Recording verdict: `DIAGNOSABLE_FAILURE`.

The artifacts are good enough to explain what happened: report refs resolved,
provider usage was recorded, per-cycle actions and verifier status are present,
and screenshots exist for first-person plus third-person views.

Experiment verdict: `PASSED_RUNTIME_BUT_BEHAVIOR_LOOP_WEAK`.

Both runs technically reached `wooden_pickaxe` inventory evidence, but the
experiment should not be treated as strong model evidence. The world was a flat
fixture, the target was too easy and over-shaped, and the visible behavior did
not look like competent natural Minecraft survival.

Visual evidence verdict: `VISUAL_EVIDENCE_WEAK`.

Screenshots were captured every cycle, but the final third-person examples are
not useful enough for human behavior review: the camera is too close to the
ground and mostly shows grass texture rather than the actor, worksite, or local
context.

## Findings

P1 - `harness-narrowing`: the world was a flat fixture, not a natural benchmark.

Evidence: both reports used `wooden-pickaxe-flat-benchmark-v1`,
`level_type=FLAT`, `fixture_dependency=true`, `generate_structures=false`, and
a placed oak-log rack. This is valid as a controlled probe, but it is not a
natural-world model benchmark.

Implication: the result mostly measures whether the model can operate inside a
small crafting harness. It does not measure ordinary terrain navigation,
resource discovery, or recovery from natural-world geometry.

Next fix: use `natural-safe-spawn-v1` with a fixed seed override and no resource
fixture for the next model comparison.

P1 - `loop-constriction`: both models collapsed into narrow loops after partial
progress.

Evidence:

- Qwen 3.7 Max used `collectLogs` 24 times in 60 cycles and did not mine useful
  stone or equip/use the pickaxe after crafting it.
- Qwen 3.7 Plus used `place_block` 20 times and `move_to` 15 times; 26 cycles
  were blocked and 15 had no progress.
- Both review summaries reported `cycles citing prior judgment in CycleGoal
  provider: 0`.

Implication: the run completed, but the behavior does not show good continuity.
The actor did not reliably pivot from "craft a tool" into a sensible next
physical use of that tool.

Next fix: score a target that requires using the crafted tool, not only
crafting it.

P1 - `product-objective-gap`: the primary target was too weak.

Evidence: final target scoring was `wooden_pickaxe` inventory. Both models
could satisfy the score without proving held/equipped item evidence, actual tool
use, stone mining, or durable worksite progress.

Implication: this makes weak behavior look better than it is. A benchmark for
this repo should require observable world or inventory change that follows from
the tool chain.

Next fix: make the next target `stone_pickaxe >= 1` in final inventory, with
separate milestone scoring for `wooden_pickaxe >= 1`, `cobblestone >= 3`, and a
reachable placed crafting table.

P2 - `visual-evidence-gap`: third-person capture exists but is not currently a
good review angle.

Evidence: representative final third-person screenshots from both runs mostly
show grass texture at close range. They do not show the actor body or worksite
context.

Implication: screenshots are present, but visual review still cannot answer
whether the NPC is behaving plausibly.

Next fix: keep first-person capture, but revise third-person camera offset to
show the actor and a small local area. Treat screenshots as review evidence
only; runtime block and inventory evidence remain scoring authority.

P2 - `benchmark-contract-gap`: `--benchmark-task` was configurable, but the
CycleGoal evidence text still mentioned `wooden_pickaxe`.

Evidence: `buildBenchmarkTaskCycleGoal` previously inserted a wooden-pickaxe
specific evidence requirement for every benchmark task.

Implication: changing the benchmark target would leave stale target wording in
the actor goal packet.

Next fix: done in this review pass. Benchmark evidence requirements are now
target-generic; target-specific scoring must be supplied by the report/scoring
manifest, not inferred from prose.

## Behavior Story

Qwen 3.7 Max made many verified low-level mutations, but much of that progress
was repeated log collection and repeated crafting. It reached
`wooden_pickaxe` late at cycle 53, then produced more pickaxes instead of
showing a strong transition into using the tool.

Qwen 3.7 Plus reached `wooden_pickaxe` earlier at cycle 25, but then spent much
of the remaining run trying to move around or place blocks near a crafting
table. The later cycles look like coordinate churn around a fixture rather than
purposeful Minecraft work.

## Max Versus Plus Interpretation

Do not conclude that Max is broadly better from this run.

The clearest primary-target metric favors Plus: it reached `wooden_pickaxe`
inventory evidence at cycle 25, while Max reached it at cycle 53. The apparent
Max advantage comes from post-target scoring noise:

| Model | Target cycle | Pre-target outcomes | Post-target outcomes | Main post-target behavior |
| --- | ---: | --- | --- | --- |
| Qwen 3.7 Max | 53 | 38 verified, 12 blocked, 3 no-progress | 6 verified, 1 no-progress | more plank/stick/pickaxe crafting |
| Qwen 3.7 Plus | 25 | 14 verified, 5 blocked, 6 no-progress | 5 verified, 21 blocked, 9 no-progress | table-adjacent move/place loop |

This means the previous headline table mixed two different things:

1. time to the primary target; and
2. behavior after the primary target had already been reached.

Plus was faster at the target, then collapsed into a harder and poorly bounded
post-target placement loop. Max was slower, then kept producing easier
inventory deltas. The run therefore cannot support a simple "Max beat Plus" or
"Plus beat Max" claim.

Additional confounders:

- The scenario supplied a context-only wooden-pickaxe task through the world
  event, but the run did not stop when `wooden_pickaxe` was first verified.
- The scoring report rewarded repeated verified inventory deltas even when they
  did not advance the intended target.
- Plus accumulated 20 open/ready PlanBeads by the end of the run, while Max had
  0. That is not proof of better behavior; here it mostly records unresolved
  placement/movement work.
- Both runs used a flat fixture and should not be treated as natural-world
  survival evidence.

## Next Benchmark

Use a natural world:

```bash
--world-scenario natural-safe-spawn-v1 \
--world-seed 9137002542963915989 \
--fresh-world \
--isolate-workspace
```

Seed note: `9137002542963915989` passed a provider-free smoke on
2026-06-14 with a mixed forest spawn, nearby spruce logs at about 6.3 blocks,
`level_type=default`, and `fixture_dependency=false`. The earlier seed
`natural-stone-tool-benchmark-v1` also passed validation but spawned in a dense
bamboo jungle and should not be used as the default benchmark seed.

Use a stronger target:

```text
From empty inventory in a fresh natural survival world, obtain one stone_pickaxe.
Milestones are wood/log acquisition, crafting_table availability,
wooden_pickaxe inventory, cobblestone inventory >= 3, and final stone_pickaxe
inventory >= 1. Final success requires runtime inventory evidence for
stone_pickaxe; provider prose and setup evidence do not count.
```

Suggested run shape:

- models: Qwen 3.7 Max and Qwen 3.7 Plus only, unless OpenAI use is explicitly
  approved after quota and projected-token preflight;
- cycles: 60 for the next calibration run; increase only after the target and
  scoring logic stop producing post-target noise;
- max actions per cycle: keep 1 for clean model-action attribution;
- screenshots: first-person plus fixed third-person every cycle;
- scoring: final item target, milestone cycle numbers, blocked/no-progress
  distribution, API calls, latency if available, visual capture failures, and
  quota ledger after run.

Do not score tool schema compliance. It can be analyzed after the run, but it is
not a benchmark target.

## 60-Cycle Single-Target Recommendation

Use exactly one objective:

```text
Obtain one stone_pickaxe in final inventory from a fresh natural survival world.
```

This is stronger than `wooden_pickaxe` because it requires the actor to use the
wooden tool chain to mine stone and then craft a stone tool. It is still bounded
enough for a 60-cycle calibration run because the runtime already has these
implemented primitives or seed action skills:

- `collect_logs`
- `craft_item`
- `place_block` for crafting-table placement
- `craft_with_table`
- `mine_block` for `stone -> cobblestone`
- `mineCobblestone`

Milestones should be reported for diagnosis only, not as separate goals:

- first log/plank evidence;
- first placed or reachable crafting table evidence;
- first `wooden_pickaxe`;
- first `cobblestone >= 3`;
- final `stone_pickaxe >= 1`.

House-building is not the right next 60-cycle target. "Make tools and build a
house" combines tech progression, material gathering, site choice, block
placement, navigation, and structure scoring. The previous Plus run already
shows that placement goals can collapse into coordinate churn. A house target
should come after the stone-tool target, or be isolated as a separate construction
benchmark with a very small scoring contract such as "place a 2x2 low wall of at
least 6 verified blocks near spawn."
