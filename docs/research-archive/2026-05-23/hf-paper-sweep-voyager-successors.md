# HF Paper Sweep: Voyager Successors And Project Fit

Date: 2026-05-23

Search token: `HF_PAPER_SWEEP_VOYAGER_SUCCESSORS`.

## Method

This note summarizes a targeted Hugging Face paper sweep using `hf papers
search` and `hf papers read`. The sweep focused on Minecraft LLM agents,
open-world skill libraries, objective curricula, embodied agent review loops,
and social simulation.

The goal is not to copy Voyager or any successor architecture. The goal is to
extract design pressure that fits this repo's bounded, observable, actor-owned
Minecraft runtime.

## High-Value References

| Reference | Useful Signal | Project Interpretation |
| --- | --- | --- |
| [Voyager](https://arxiv.org/abs/2305.16291) | Automatic curriculum, executable code skill library, iterative prompting with environment feedback, execution errors, and self-verification. | Keep code-as-action and objective-driven skill growth. Replace LLM self-verification as final truth with current-run runtime evidence. |
| [MineDojo](https://arxiv.org/abs/2206.08853) | Minecraft is useful because it has large task variety, internet-scale knowledge, and open-ended affordances. | Use Minecraft as an experiment accelerator, but keep the first task catalog small and verifier-backed. |
| [DEPS](https://arxiv.org/abs/2302.01560) | Describe, Explain, Plan, and Select. The selector ranks parallel subgoals by estimated completion cost and current feasibility. | Add an Objective Frontier that ranks goals by preconditions, current state, distance/cost, actor role, and previous evidence. |
| [Plan4MC](https://arxiv.org/abs/2303.16563) | Fine-grained skill graph with `consume`, `require`, and `obtain` relationships; planning walks the graph. | Represent objective prerequisites explicitly. Start with wood, crafting table, sticks, wooden pickaxe, cobblestone, furnace, fuel, and storage. |
| [GITM](https://arxiv.org/abs/2305.17144) | Long-horizon Minecraft goals become tractable when decomposed into subgoals, structured actions, and low-level controls. | Keep action skills as structured Mineflayer programs, but do not chase full tech-tree completion yet. |
| [Odyssey](https://arxiv.org/abs/2407.15325) | Separates primitive skills from compositional skills and evaluates long-term planning, dynamic-immediate planning, and autonomous exploration. | Split action skill memory into primitive helpers, compositional direct trials, and promoted active records. |
| [MINDcraft / MineCollab](https://arxiv.org/abs/2504.17950) | Multi-agent Minecraft collaboration fails largely on communication efficiency; tasks require delegation, resource sharing, and partial observability. | Social simulation should start from inventory/resource delegation tasks, not persona richness. Communication should be structured and evidence-backed. |
| [Generative Agents](https://arxiv.org/abs/2304.03442) | Memory stream, retrieval, reflection, and planning create believable social behavior. | Use reflection for social memory, but every relationship update needs durable evidence refs. |
| [Reflexion](https://arxiv.org/abs/2303.11366) | Feedback can be transformed into textual lessons in episodic memory without model fine-tuning. | Per-NPC reviewers should write short, actionable lessons from runtime artifacts. Do not let reflection override verifier truth. |
| [Steve-Evolving](https://arxiv.org/abs/2603.13131) | Structured experience tuple: pre-state, action, diagnosis, post-state; failures become guardrails and successes become skills. | This is the closest match for our actor workspace. Add diagnostic action-skill trials and guardrail candidates from failures. |
| [Plancraft](https://arxiv.org/abs/2412.21033) | Minecraft crafting evaluation should include unsolvable cases and explicit RAG/planner ablations. | Objective oracles should be able to return `blocked` or `unsatisfiable`, not only pass/fail. |
| [MineNPC-Task](https://huggingface.co/papers/2601.05215) | Memory-aware Minecraft tasks use explicit preconditions, dependency structure, validators, logs, and bounded-knowledge policy. | Align our objective reports with validators and logs; avoid shortcut success from old memory or out-of-world knowledge. |

## Main Architectural Insight

Voyager's useful insight is not "run raw code forever." It is that Minecraft
action can be represented as executable programs, and those programs can be
improved through environment feedback. The successor papers add a second
lesson: raw trajectory storage is not enough. Experience must be organized into
typed, retrievable, verifier-backed records.

For this repo, the right synthesis is:

```text
objective frontier
-> generated TypeScript direct trial
-> helper-call evidence and current-run verifier
-> structured experience document
-> per-actor reviewer diagnosis
-> candidate action skill or guardrail
-> actor-owned promotion gate
```

This keeps Voyager's propagation speed while preserving our runtime-owned truth
and actor-local ownership.

## Objective Frontier

Add an objective frontier instead of a free-form automatic curriculum.

Each objective should have:

- `id`: stable objective id, for example `craft_current_run_stone_axe_1`;
- `category`: `collect`, `craft`, `mine`, `smelt`, `store`, `equip`,
  `share`, `build`, `explore`, `recover`;
- `target`: item, block, entity, or social transfer target;
- `count`;
- `preconditions`: required inventory, nearby block, placed station, biome,
  tool tier, or relationship state;
- `effects`: expected inventory/world/social changes;
- `verifier`: current-run evidence rule;
- `cost_model`: estimated action count, travel distance, missing materials,
  and failure history;
- `social_pressure`: optional actor role or relationship reason to prefer it.

This is the bounded version of Voyager's automatic curriculum and DEPS's goal
selector.

## Experience Documents

Direct trials and runtime action attempts should converge toward one
structured experience shape:

```text
pre_state
action_or_generated_source
helper_events
diagnosis
post_state
verifier_result
reviewer_findings
candidate_outputs
```

The diagnosis should be more detailed than pass/fail:

- `missing_precondition`;
- `unsupported_action`;
- `navigation_stuck`;
- `target_not_found`;
- `wrong_tool_or_tier`;
- `inventory_no_delta`;
- `crafting_recipe_missing`;
- `container_or_gui_blocked`;
- `timeout`;
- `loop_or_stagnation`;
- `world_fixture_mismatch`;
- `provider_code_error`.

This turns failures such as "pretended to mine a tree and walked away" into
actionable guardrails and implementation fixes.

## Skill Memory

Use three layers:

1. Primitive helper surface
   - hand-owned Mineflayer helpers such as collect logs, mine block, craft item,
     place station, smelt, deposit, give item.
2. Actor-owned direct trials
   - generated TypeScript attempts with source, helper events, verifier output,
     and reviewer diagnosis.
3. Promoted action skills
   - smaller reusable action skills with preconditions, effects, verifier,
     proof refs, and owner.

Avoid a single global Voyager-style library as the source of truth. Shared
skills can exist later as a commons, but actor workspaces should remain the
canonical owner of active records.

## Social Simulation Implication

MINDcraft and Generative Agents point in different directions. MINDcraft says
social Minecraft agents need grounded resource coordination. Generative Agents
says believable behavior needs memory, reflection, and planning. The synthesis
for this repo is:

- start social tasks from resource pressure, not personality text;
- make communication structured enough to be efficient;
- log who requested, promised, transferred, stored, or consumed resources;
- update relationships only from evidence refs;
- let per-NPC reviewers summarize collaboration failures asynchronously.

Good first social objectives:

- `share_current_run_oak_log_with_actor_1`;
- `deposit_current_run_cobblestone_in_shared_chest_3`;
- `ask_actor_for_missing_stick_1`;
- `craft_current_run_tool_using_shared_materials_1`.

## Anti-Patterns To Avoid

- Treating LLM self-verification as final success.
- Letting reflection mutate runtime state directly.
- Injecting a giant skill library into every prompt.
- Retrying generated code without a current-run verifier.
- Promoting action skills without preconditions, timeout, and proof refs.
- Treating multi-agent chat volume as collaboration.
- Returning to long single-agent Voyager loops that block bounded NPC turns.

## Recommended Next Implementation Order

1. Add an `ObjectiveFrontier` module with objective metadata, cost scoring, and
   precondition/effect fields.
2. Expand direct trial reports into structured experience documents with
   enumerated diagnosis.
3. Add failure-to-guardrail candidate records under actor workspace.
4. Add a small objective ladder:
   - collect log;
   - craft planks/sticks;
   - craft crafting table;
   - craft wooden pickaxe;
   - mine cobblestone;
   - craft stone axe;
   - craft furnace;
   - smelt one item;
   - deposit item in chest.
5. Add one resource-sharing objective for two NPCs only after the single-actor
   ladder passes with current-run evidence.
