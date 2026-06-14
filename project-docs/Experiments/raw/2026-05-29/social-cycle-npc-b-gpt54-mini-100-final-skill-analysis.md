# NPC Social-Cycle Experiment Analysis

- report: `tmp/social-cycle-npc-b-gpt54-mini-100-final.json`
- generated summary: `tmp/social-cycle-npc-b-gpt54-mini-100-final-skill-summary.json`
- actor workspace: `data/actors/social-runs/social-cycle-c4d228b0-99fc-4367-aefa-8fd26fd13197/npc_b`
- run id: `social-cycle-c4d228b0-99fc-4367-aefa-8fd26fd13197`
- actor: `npc_b`
- model: `openai-api / gpt-5.4-mini / low`

## Verdict

Recording verdict: `ANALYZABLE_WITH_GAPS`

The run is well recorded at the artifact level: the report references 1,031
unique actor-workspace artifacts, and all of them resolve with no missing or
invalid JSON refs. The gap is not missing raw data. The gap is interpretation:
the current report audit still over-requires world-scan evidence for some
inventory/tool progress claims, while also correctly catching absolute absence
claims made from non-exhaustive observations.

Experiment verdict: `PASSED_RUNTIME_BUT_BEHAVIOR_LOOP_WEAK`

The runtime completed 100 cycles and produced verifier-backed gameplay progress,
but the NPC did not turn that activity into strong settlement progress. The run
mostly proves that the runtime can execute, record, block repeated failures, and
continue under provider load. It does not yet prove a strong social/settlement
agent loop.

## Findings

P1 - The runtime passed, but the settlement objective did not.

Evidence: `runtime_status` is `passed`, with 100 cycles and 100 action attempts.
Outcomes were 45 `verified_progress`, 50 `no_progress`, and 5 `blocked`.
The settlement checklist still has `crafting_table_known_or_placed`,
`starter_shelter_verified`, and `shared_storage_contribution` as `pending`.
Only memory/judgment persistence and blocker summarization are satisfied.

Implication: the bot can mutate inventory/world state, but the higher-level
founder objective is not closing. It loops around local wood/crafting actions
instead of reliably establishing a known station, shelter, or shared-storage
contribution.

Next fix: make the settlement state/checklist consume primitive evidence, not
only action-skill postconditions. `place_block` verified `crafting_table` at
cycles 13, 45, 55, and 82, and cycle 85 saw `already_present`, but the checklist
still says no crafting table evidence is known.

P1 - Provider budget is nearly exhausted for the local guard.

Evidence: the successful 100-cycle run used 300 provider records and 7,611,068
tokens. Including earlier attempts, the projected day total is 8,792,282 of the
9,000,000 local cap, leaving 207,718 tokens.

Implication: more OpenAI live experiments today can accidentally cross the
guard. The current artifact is enough for analysis; use deterministic or shorter
Gemini/Gemma checks until the budget state is reset or deliberately changed.

Next fix: stop long OpenAI runs under this cap today. Add a preflight report
that prints projected remaining tokens before long social-cycle commands.

P2 - The NPC is action-capable but narrow.

Evidence: direct primitives dominated the run: 84 `use_primitive` actions versus
16 `use_action_skill` actions. The most common action intents were `craft_item`
27, `observe` 16, `collect_logs` 11, `place_block` 10, `runtimeObserveAndRemember`
10, and `craft_with_table` 9. `collect_logs` was reliable: 11 attempts, 11
verified progress outcomes. `craft_item` was mixed: 15 verified, 10 failed, 2
runtime-blocked.

Implication: the bot is not frozen, but it escapes uncertainty by returning to
the few operations that work. This is closer to a bounded resource/crafting loop
than a free NPC perspective loop over Mineflayer's broader action space.

Next fix: give the planner a stronger "choose from raw observation + action
surface" contract that rewards novel verified use of Mineflayer-backed actions
when the current checklist item is stale, instead of repeatedly converting the
same local wood/station context.

P2 - Retry constraints are doing useful runtime work.

Evidence: 5 retry constraints were created. Two later attempts were blocked
before Mineflayer execution. Captured blockers include repeated
`buildBasicShelter`, `craft_item oak_planks`, `craft_item leaf_litter`, and
`craft_item stick`.

Implication: the runtime is no longer blindly re-executing the same exact failed
target/args. That is a healthy substrate behavior. The planner still needs to
pivot earlier, before a gate has to stop it.

Next fix: feed retry-constraint summaries into the action planner in a sharper
form: "same target+args is closed unless args/world evidence changed."

P2 - Observation recording improved and stayed observation-first.

Evidence: 32 observe evidence refs exist. All 32 include vitals, all 32 include
world-state summaries, and all 32 scans are explicitly non-exhaustive. Final
observed vitals were health 20, food 20, saturation 5, with no food candidates.

Implication: `consume_item` did not fire because the run did not present a valid
hunger/food situation. That is correct behavior: the runtime exposed raw vitals
and food candidates without forcing an eating action.

Next fix: run a separate focused hunger fixture for `eatFoodWhenHungry`; do not
expect this full social-cycle run to prove it.

P2 - Provider judgment reliability still needs a clamp/prompt fix.

Evidence: cycle 70 provider output was malformed. It returned a schema-like
payload instead of a valid `cycle-judgment/v1`. The runtime wrote a fallback
judgment and continued. The report audit produced 71 warning lines, mostly
because judgments made progress claims without world-scan evidence or absence
claims from non-exhaustive scans.

Implication: the fallback prevented a long-run failure, which is good. But the
provider still needs stricter output handling, and the audit needs to distinguish
inventory/tool verifier evidence from world-state-scan evidence.

Next fix: split the audit checks into inventory/tool/container progress claims
versus world absence claims. Tighten judgment prompting so absence language says
"not observed in the sampled scan" unless the scan is exhaustive.

## Behavior Story

Cycles 1-20: bootstrapping and first settlement attempts. The NPC observed,
checked storage, collected logs, crafted planks/sticks/crafting table, then hit
placement, table-crafting, and shelter failures. It made 8 verified progress
cycles, but also 10 no-progress cycles and 2 blocked cycles.

Cycles 21-40: repeated gather/craft attempts with some recovery. The NPC gathered
logs, crafted, attempted shelter again, mined, and inspected a chest. It reached
10 verified progress cycles, but shelter and several craft/table attempts still
failed.

Cycles 41-60: best local mutation window. It produced 11 verified progress
cycles, mostly through crafting, placement, movement, and log collection. This
shows the runtime can sustain state-changing actions when the target is local and
well supported.

Cycles 61-80: weaker pivot behavior. Verified progress dropped to 6 cycles, with
11 no-progress and 3 blocked. Retry constraints caught repeated invalid craft
attempts. Cycle 70 needed runtime fallback judgment after malformed provider
output.

Cycles 81-100: more observation plus bounded action-skill use. The NPC used
`craftPlanksAndSticks`, `craftWoodenPickaxe`, attempted `mineCobblestone`, mined
stone successfully with direct `mine_block`, and ended by collecting a log. This
closed the runtime run cleanly, but still did not satisfy settlement checklist
items.

## What Was Recorded

The report records enough to reconstruct the run:

- 300 provider input refs and 600 provider output refs;
- 262 evidence refs;
- 208 judgment refs;
- 308 goal/intent refs;
- provider usage, budget decisions, retry constraints, settlement state,
  postconditions, and memory reuse;
- no missing or invalid referenced artifacts.

The main missing layer is not data capture. It is semantic consolidation:
settlement state/checklist and audit policy do not yet fully agree with the raw
runtime evidence.

## Next Experiment

Do not run another 100-cycle OpenAI experiment immediately. The next useful slice
is shorter and more diagnostic:

1. Fix settlement checklist ingestion for primitive evidence such as
   `place_block crafting_table`.
2. Fix audit semantics for inventory/tool evidence versus world absence claims.
3. Run a 20-cycle deterministic or low-cost provider experiment with a success
   target: "crafting table known or placed must become satisfied from primitive
   evidence."
4. Separately run the hunger fixture for `eatFoodWhenHungry`, because this run
   correctly had full food and no food candidates.
