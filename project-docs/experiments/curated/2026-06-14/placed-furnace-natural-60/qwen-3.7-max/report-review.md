# Social cycle review — npc_b

- run_id: `social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0`
- model: `Qwen-Ambassador/Qwen3.7-Max`
- runtime_status: **passed**
- cycles in report: **60**
- cycles citing prior judgment in CycleGoal provider: **0**
- runtime retry constraints: **5**
- retry-constraint blocked attempts: **12**

## Outcome distribution

- verified_progress: 19
- blocked: 16
- no_progress: 25

## Primitive / skill usage

- craft_item: 10
- craftWoodenPickaxe: 9
- craft_with_table: 9
- remember: 8
- craftPlanksAndSticks: 6
- mine_block: 6
- observe: 4
- collectLogs: 3
- craftCraftingTable: 1
- placeCraftingTable: 1
- move_to: 1
- author_mineflayer_action: 1
- place_block: 1

## Cycle timeline

| cycle/attempt | outcome | verifier | action | scan refs | move contract | retry gate | CycleGoal (short) | cites prior |
|---------------|---------|----------|--------|-----------|---------------|------------|-------------------|-------------|
| cycle-0001-action-01 | verified_progress | passed | use_action_skill:collectLogs | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Obtain and place one furnace block in the world from empty i | no |
| cycle-0002-action-01 | verified_progress | passed | use_action_skill:craftPlanksAndSticks | 1 (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Obtain and place one furnace block in the world from empty i | no |
| cycle-0003-action-01 | verified_progress | passed | use_action_skill:craftCraftingTable | 1 (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Obtain and place one furnace block in the world from empty i | no |
| cycle-0004-action-01 | verified_progress | passed | use_action_skill:placeCraftingTable | 1 (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Obtain and place one furnace block in the world from empty i | no |
| cycle-0005-action-01 | verified_progress | passed | use_action_skill:craftPlanksAndSticks | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Obtain and place one furnace block in the world from empty i | no |
| cycle-0006-action-01 | blocked | failed | use_action_skill:craftWoodenPickaxe | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Obtain and place one furnace block in the world from empty i | no |
| cycle-0007-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | Craft sticks from spruce_planks in inventory, then use the p | no |
| cycle-0008-action-01 | blocked | failed | use_action_skill:craftWoodenPickaxe | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Craft sticks from spruce_planks in inventory, then use the p | no |
| cycle-0009-action-01 | no_progress | not_applicable | use_action_skill:craftWoodenPickaxe | 0 | not_move_to | blocked | Craft wooden_pickaxe at the placed crafting_table using curr | no |
| cycle-0010-action-01 | blocked | failed | use_primitive:craft_with_table | 0 | not_move_to | no | Craft wooden_pickaxe at the placed crafting_table using curr | no |
| cycle-0011-action-01 | blocked | failed | use_primitive:craft_with_table | 0 | not_move_to | no | Craft wooden_pickaxe at the placed crafting_table using curr | no |
| cycle-0012-action-01 | no_progress | not_applicable | use_primitive:observe | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Interact with crafting_table at (333,63,468) to inspect GUI  | no |
| cycle-0013-action-01 | no_progress | not_applicable | use_primitive:remember | 0 | not_move_to | no | Interact with crafting_table at (333,63,468) to inspect GUI  | no |
| cycle-0014-action-01 | no_progress | not_applicable | use_action_skill:craftWoodenPickaxe | 0 | not_move_to | blocked | Interact with crafting_table at (333,63,468) to inspect GUI  | no |
| cycle-0015-action-01 | no_progress | not_applicable | use_primitive:observe | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Inspect current inventory or observe environment to confirm  | no |
| cycle-0016-action-01 | no_progress | not_applicable | use_primitive:craft_with_table | 0 | not_move_to | blocked | Inspect current inventory or observe environment to confirm  | no |
| cycle-0017-action-01 | blocked | failed | use_primitive:craft_item | 0 | not_move_to | no | Inspect current inventory or observe environment to confirm  | no |
| cycle-0018-action-01 | blocked | failed | use_primitive:mine_block | 0 | not_move_to | no | 1. Harvest the spruce_log at (334,63,466). 2. Craft spruce_p | no |
| cycle-0019-action-01 | verified_progress | passed | use_action_skill:collectLogs | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | 1. Approach and interact with spruce_log at (334,63,466) usi | no |
| cycle-0020-action-01 | verified_progress | passed | use_action_skill:craftPlanksAndSticks | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | 1. Approach and interact with spruce_log at (334,63,466) usi | no |
| cycle-0021-action-01 | no_progress | not_applicable | use_action_skill:craftWoodenPickaxe | 0 | not_move_to | blocked | 1. Approach and interact with spruce_log at (334,63,466) usi | no |
| cycle-0022-action-01 | blocked | failed | use_primitive:craft_with_table | 0 | not_move_to | no | 1. Approach and interact with spruce_log at (334,63,466) usi | no |
| cycle-0023-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | 1. Move within interaction range of crafting_table at (333,6 | no |
| cycle-0024-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | 1. Move within interaction range of crafting_table at (333,6 | no |
| cycle-0025-action-01 | no_progress | not_applicable | use_primitive:craft_with_table | 0 | not_move_to | blocked | 1. Move within interaction range of crafting_table at (333,6 | no |
| cycle-0026-action-01 | no_progress | not_applicable | use_primitive:remember | 0 | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0027-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0028-action-01 | no_progress | not_applicable | use_primitive:observe | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0029-action-01 | no_progress | not_applicable | use_primitive:remember | 0 | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0030-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0031-action-01 | no_progress | not_applicable | use_primitive:remember | 0 | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0032-action-01 | no_progress | not_applicable | use_primitive:remember | 0 | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0033-action-01 | no_progress | not_applicable | use_primitive:observe | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0034-action-01 | no_progress | not_applicable | use_primitive:remember | 0 | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0035-action-01 | blocked | failed | author_mineflayer_action:author_mineflayer_action | 2 (world_state_summary:2, block_observations:2, block_name_counts:16, nearest_examples:24, verified_blocks:512, truncated_block_observations:2, loaded_coverage:2, non_exhaustive_coverage:2, scan_metadata:2) | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0036-action-01 | blocked | failed | use_primitive:mine_block | 0 | not_move_to | no | 1. Confirm proximity to crafting_table at (333,63,468). 2. U | no |
| cycle-0037-action-01 | verified_progress | passed | use_action_skill:collectLogs | 1 (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | 1. Navigate to spruce_log at (334,63,466). 2. Attempt acquis | no |
| cycle-0038-action-01 | verified_progress | passed | use_action_skill:craftPlanksAndSticks | 1 (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | 1. Navigate to spruce_log at (334,63,466). 2. Attempt acquis | no |
| cycle-0039-action-01 | verified_progress | passed | use_action_skill:craftPlanksAndSticks | 1 (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | 1. Navigate to spruce_log at (334,63,466). 2. Attempt acquis | no |
| cycle-0040-action-01 | no_progress | not_applicable | use_action_skill:craftWoodenPickaxe | 0 | not_move_to | blocked | 1. Navigate to spruce_log at (334,63,466). 2. Attempt acquis | no |
| cycle-0041-action-01 | blocked | failed | use_primitive:craft_with_table | 0 | not_move_to | no | 1. Verify crafting_table at (333,63,468) is still reachable. | no |
| cycle-0042-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | 1. Verify crafting_table at (333,63,468) is still reachable. | no |
| cycle-0043-action-01 | no_progress | not_applicable | use_primitive:remember | 0 | not_move_to | no | 1. Verify crafting_table at (333,63,468) is still reachable. | no |
| cycle-0044-action-01 | no_progress | not_applicable | use_primitive:craft_with_table | 0 | not_move_to | blocked | 1. Verify crafting_table at (333,63,468) is still reachable. | no |
| cycle-0045-action-01 | no_progress | not_applicable | use_primitive:craft_with_table | 0 | not_move_to | blocked | 1. Verify crafting_table at (333,63,468) is still reachable. | no |
| cycle-0046-action-01 | blocked | failed | use_primitive:craft_item | 0 | not_move_to | no | 1. Acknowledge stick supply is sufficient (20 count). 2. Att | no |
| cycle-0047-action-01 | no_progress | not_applicable | use_action_skill:craftWoodenPickaxe | 0 | not_move_to | blocked | 1. Acknowledge stick supply is sufficient (20 count). 2. Att | no |
| cycle-0048-action-01 | verified_progress | passed | use_action_skill:craftPlanksAndSticks | 1 (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | 1. Acknowledge stick supply is sufficient (20 count). 2. Att | no |
| cycle-0049-action-01 | no_progress | not_applicable | use_primitive:remember | 0 | not_move_to | no | 1. Acknowledge stick supply is sufficient (20 count). 2. Att | no |
| cycle-0050-action-01 | no_progress | not_applicable | use_primitive:craft_with_table | 0 | not_move_to | blocked | 1. Acknowledge stick supply is sufficient (20 count). 2. Att | no |
| cycle-0051-action-01 | blocked | failed | use_primitive:mine_block | 0 | not_move_to | no | 1. Acknowledge stick supply is sufficient (20 count). 2. Att | no |
| cycle-0052-action-01 | blocked | failed | use_primitive:mine_block | 0 | not_move_to | no | 1. Prioritize mining 'dirt' or 'grass_block' at known nearby | no |
| cycle-0053-action-01 | blocked | failed | use_primitive:mine_block | 0 | not_move_to | no | 1. Prioritize mining 'dirt' or 'grass_block' at known nearby | no |
| cycle-0054-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | 1. Move adjacent to crafting_table at (333,63,468). 2. Use ' | no |
| cycle-0055-action-01 | blocked | failed | use_primitive:craft_item | 0 | not_move_to | no | 1. Move adjacent to crafting_table at (333,63,468). 2. Use ' | no |
| cycle-0056-action-01 | blocked | failed | use_primitive:mine_block | 0 | not_move_to | no | 1. Move adjacent to crafting_table at (333,63,468). 2. Use ' | no |
| cycle-0057-action-01 | no_progress | not_applicable | use_action_skill:craftWoodenPickaxe | 0 | not_move_to | blocked | 1. Move adjacent to crafting_table at (333,63,468). 2. Use ' | no |
| cycle-0058-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | 1. Move adjacent to crafting_table at (333,63,468). 2. Use ' | no |
| cycle-0059-action-01 | verified_progress | passed | use_primitive:place_block | 0 | not_move_to | no | 1. Move adjacent to crafting_table at (333,63,468). 2. Use ' | no |
| cycle-0060-action-01 | no_progress | not_applicable | use_action_skill:craftWoodenPickaxe | 0 | not_move_to | blocked | 1. Move adjacent to crafting_table at (333,63,468). 2. Use ' | no |

## Visual Evidence

### cycle-0056 cycle_end

![cycle-0056 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0056-cycle-end-first-person.png)

- image_ref: `visual-evidence/cycle-0056-cycle-end-first-person.png`
- artifact_ref: `visual-evidence/cycle-0056-cycle-end-first-person.json`

### cycle-0056 cycle_end

![cycle-0056 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0056-cycle-end-third-person.png)

- image_ref: `visual-evidence/cycle-0056-cycle-end-third-person.png`
- artifact_ref: `visual-evidence/cycle-0056-cycle-end-third-person.json`

### cycle-0057 cycle_end

![cycle-0057 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0057-cycle-end-first-person.png)

- image_ref: `visual-evidence/cycle-0057-cycle-end-first-person.png`
- artifact_ref: `visual-evidence/cycle-0057-cycle-end-first-person.json`

### cycle-0057 cycle_end

![cycle-0057 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0057-cycle-end-third-person.png)

- image_ref: `visual-evidence/cycle-0057-cycle-end-third-person.png`
- artifact_ref: `visual-evidence/cycle-0057-cycle-end-third-person.json`

### cycle-0058 cycle_end

![cycle-0058 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0058-cycle-end-first-person.png)

- image_ref: `visual-evidence/cycle-0058-cycle-end-first-person.png`
- artifact_ref: `visual-evidence/cycle-0058-cycle-end-first-person.json`

### cycle-0058 cycle_end

![cycle-0058 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0058-cycle-end-third-person.png)

- image_ref: `visual-evidence/cycle-0058-cycle-end-third-person.png`
- artifact_ref: `visual-evidence/cycle-0058-cycle-end-third-person.json`

### cycle-0059 cycle_end

![cycle-0059 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0059-cycle-end-first-person.png)

- image_ref: `visual-evidence/cycle-0059-cycle-end-first-person.png`
- artifact_ref: `visual-evidence/cycle-0059-cycle-end-first-person.json`

### cycle-0059 cycle_end

![cycle-0059 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0059-cycle-end-third-person.png)

- image_ref: `visual-evidence/cycle-0059-cycle-end-third-person.png`
- artifact_ref: `visual-evidence/cycle-0059-cycle-end-third-person.json`

### cycle-0060 cycle_end

![cycle-0060 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0060-cycle-end-first-person.png)

- image_ref: `visual-evidence/cycle-0060-cycle-end-first-person.png`
- artifact_ref: `visual-evidence/cycle-0060-cycle-end-first-person.json`

### cycle-0060 cycle_end

![cycle-0060 cycle_end](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0060-cycle-end-third-person.png)

- image_ref: `visual-evidence/cycle-0060-cycle-end-third-person.png`
- artifact_ref: `visual-evidence/cycle-0060-cycle-end-third-person.json`

### cycle-0060 final

![cycle-0060 final](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0060-final-first-person.png)

- image_ref: `visual-evidence/cycle-0060-final-first-person.png`
- artifact_ref: `visual-evidence/cycle-0060-final-first-person.json`

### cycle-0060 final

![cycle-0060 final](/Users/naem1023/git/minecraft-llm-agent-community/data/actors/social-runs/social-cycle-9ba01b95-52b6-4639-9d00-008550495fc0/npc_b/visual-evidence/cycle-0060-final-third-person.png)

- image_ref: `visual-evidence/cycle-0060-final-third-person.png`
- artifact_ref: `visual-evidence/cycle-0060-final-third-person.json`


## World Scan Evidence

- cycle-0001: evidence/cycle-0001-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0002: evidence/cycle-0002-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0003: evidence/cycle-0003-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0004: evidence/cycle-0004-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0005: evidence/cycle-0005-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0006: evidence/cycle-0006-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0008: evidence/cycle-0008-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0012: evidence/cycle-0012-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0015: evidence/cycle-0015-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0019: evidence/cycle-0019-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0020: evidence/cycle-0020-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0028: evidence/cycle-0028-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0033: evidence/cycle-0033-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0035: evidence/cycle-0035-action-01-run_mineflayer_program.json, evidence/cycle-0035-action-01-generated-action-skill-trial-diagnoseTableCraftStick.json (world_state_summary:2, block_observations:2, block_name_counts:16, nearest_examples:24, verified_blocks:512, truncated_block_observations:2, loaded_coverage:2, non_exhaustive_coverage:2, scan_metadata:2)
- cycle-0037: evidence/cycle-0037-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:8, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0038: evidence/cycle-0038-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0039: evidence/cycle-0039-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0048: evidence/cycle-0048-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:7, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)

## Last 5 judgments (detail)

### cycle-0056

Runtime classifier saw verifier=failed, tools=mine_block, statuses=mine_block:failed. Outcome contract=blocked; expected=inventory_delta; observed=blocker_recorded.

### cycle-0057

Runtime classifier saw verifier=not_applicable, tools=none. Outcome contract=unsatisfied; expected=inventory_delta; observed=none.

### cycle-0058

Runtime classifier saw verifier=passed, tools=craft_item, statuses=craft_item:crafted. Outcome contract=satisfied; expected=inventory_delta; observed=inventory_delta.

### cycle-0059

Runtime classifier saw verifier=passed, tools=place_block, statuses=place_block:placed. Outcome contract=satisfied; expected=world_block_delta; observed=world_block_delta.

### cycle-0060

Runtime classifier saw verifier=not_applicable, tools=none. Outcome contract=unsatisfied; expected=inventory_delta; observed=none.
