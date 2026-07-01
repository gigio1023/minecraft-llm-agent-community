# Social cycle review — npc_b

- run_id: `social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16`
- model: `gpt-5.4-mini`
- runtime_status: **passed**
- cycles in report: **30**
- cycles citing prior judgment in CycleGoal provider: **0**
- runtime retry constraints: **1**
- retry-constraint blocked attempts: **0**

## Outcome distribution

- verified_progress: 8
- blocked: 9
- no_progress: 13

## Primitive / skill usage

- move_to: 14
- collect_logs: 3
- craft_item: 3
- placeCraftingTable: 2
- craftPlanksAndSticks: 2
- observe: 2
- author_mineflayer_action: 2
- place_block: 1
- ?: 1

## Cycle timeline

| cycle/attempt | outcome | verifier | action | scan refs | move contract | retry gate | CycleGoal (short) | cites prior |
|---------------|---------|----------|--------|-----------|---------------|------------|-------------------|-------------|
| cycle-0001-action-01 | verified_progress | passed | use_primitive:collect_logs | 0 | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0002-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0003-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0004-action-01 | blocked | failed | use_action_skill:placeCraftingTable | 1 (world_state_summary:1, block_observations:1, block_name_counts:13, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0005-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0006-action-01 | blocked | failed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0007-action-01 | blocked | failed | use_primitive:place_block | 0 | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0008-action-01 | blocked | failed | use_action_skill:placeCraftingTable | 1 (world_state_summary:1, block_observations:1, block_name_counts:13, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0009-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0010-action-01 | verified_progress | passed | use_primitive:collect_logs | 0 | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0011-action-01 | verified_progress | passed | use_action_skill:craftPlanksAndSticks | 1 (world_state_summary:1, block_observations:1, block_name_counts:10, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0012-action-01 | verified_progress | passed | use_action_skill:craftPlanksAndSticks | 1 (world_state_summary:1, block_observations:1, block_name_counts:10, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0013-action-01 | blocked | failed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0014-action-01 | verified_progress | passed | use_primitive:craft_item | 0 | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0015-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0016-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0017-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0018-action-01 | verified_progress | passed | use_primitive:collect_logs | 0 | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0019-action-01 | no_progress | not_applicable | use_primitive:observe | 1 (world_state_summary:1, block_observations:1, block_name_counts:18, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0020-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0021-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0022-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0023-action-01 | no_progress | not_applicable | use_primitive:observe | 1 (world_state_summary:1, block_observations:1, block_name_counts:10, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1) | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0024-action-01 | blocked | failed | author_mineflayer_action:author_mineflayer_action | 2 (world_state_summary:2, block_observations:2, block_name_counts:20, nearest_examples:24, verified_blocks:512, truncated_block_observations:2, loaded_coverage:2, non_exhaustive_coverage:2, scan_metadata:2) | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0025-action-01 | blocked | failed | missing:? | 0 | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0026-action-01 | blocked | failed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0027-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0028-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0029-action-01 | blocked | failed | author_mineflayer_action:author_mineflayer_action | 2 (world_state_summary:2, block_observations:2, block_name_counts:20, nearest_examples:24, verified_blocks:512, truncated_block_observations:2, loaded_coverage:2, non_exhaustive_coverage:2, scan_metadata:2) | not_move_to | no | Village workbench foothold task: from a fresh natural villag | no |
| cycle-0030-action-01 | no_progress | passed | use_primitive:move_to | 0 | valid | no | Village workbench foothold task: from a fresh natural villag | no |

## Visual Evidence

These images are prismarine-viewer review evidence only. Do not use pixels as block identity authority; pair each suspicious image with same-cycle or neighboring observe/worldStateSummary/world-state-scan artifacts.

### cycle-0028 cycle_end

![cycle-0028 cycle_end](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0028-cycle-end-first-person.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0028-cycle-end-first-person.png`
- artifact_ref: `visual-evidence/cycle-0028-cycle-end-first-person.json`

### cycle-0028 cycle_end

![cycle-0028 cycle_end](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0028-cycle-end-third-person-follow.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0028-cycle-end-third-person-follow.png`
- artifact_ref: `visual-evidence/cycle-0028-cycle-end-third-person-follow.json`

### cycle-0028 cycle_end

![cycle-0028 cycle_end](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0028-cycle-end-third-person-high.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0028-cycle-end-third-person-high.png`
- artifact_ref: `visual-evidence/cycle-0028-cycle-end-third-person-high.json`

### cycle-0029 cycle_end

![cycle-0029 cycle_end](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0029-cycle-end-first-person.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0029-cycle-end-first-person.png`
- artifact_ref: `visual-evidence/cycle-0029-cycle-end-first-person.json`

### cycle-0029 cycle_end

![cycle-0029 cycle_end](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0029-cycle-end-third-person-follow.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0029-cycle-end-third-person-follow.png`
- artifact_ref: `visual-evidence/cycle-0029-cycle-end-third-person-follow.json`

### cycle-0029 cycle_end

![cycle-0029 cycle_end](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0029-cycle-end-third-person-high.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0029-cycle-end-third-person-high.png`
- artifact_ref: `visual-evidence/cycle-0029-cycle-end-third-person-high.json`

### cycle-0030 cycle_end

![cycle-0030 cycle_end](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0030-cycle-end-first-person.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0030-cycle-end-first-person.png`
- artifact_ref: `visual-evidence/cycle-0030-cycle-end-first-person.json`

### cycle-0030 cycle_end

![cycle-0030 cycle_end](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0030-cycle-end-third-person-follow.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0030-cycle-end-third-person-follow.png`
- artifact_ref: `visual-evidence/cycle-0030-cycle-end-third-person-follow.json`

### cycle-0030 cycle_end

![cycle-0030 cycle_end](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0030-cycle-end-third-person-high.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0030-cycle-end-third-person-high.png`
- artifact_ref: `visual-evidence/cycle-0030-cycle-end-third-person-high.json`

### cycle-0030 final

![cycle-0030 final](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0030-final-first-person.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0030-final-first-person.png`
- artifact_ref: `visual-evidence/cycle-0030-final-first-person.json`

### cycle-0030 final

![cycle-0030 final](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0030-final-third-person-follow.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0030-final-third-person-follow.png`
- artifact_ref: `visual-evidence/cycle-0030-final-third-person-follow.json`

### cycle-0030 final

![cycle-0030 final](data/actors/social-runs/social-cycle-6a25ac95-3499-4e7e-820e-24c8c7fb8a16/npc_b/visual-evidence/cycle-0030-final-third-person-high.png)

- renderer_trust: `review_only_not_block_identity`
- block_identity_authority: `runtime_world_state_scan_or_observe_evidence`
- image_ref: `visual-evidence/cycle-0030-final-third-person-high.png`
- artifact_ref: `visual-evidence/cycle-0030-final-third-person-high.json`


## World Scan Evidence

- cycle-0004: evidence/cycle-0004-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:13, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0008: evidence/cycle-0008-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:13, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0011: evidence/cycle-0011-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:10, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0012: evidence/cycle-0012-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:10, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0019: evidence/cycle-0019-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:18, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0023: evidence/cycle-0023-action-01-observe.json (world_state_summary:1, block_observations:1, block_name_counts:10, nearest_examples:12, verified_blocks:256, truncated_block_observations:1, loaded_coverage:1, non_exhaustive_coverage:1, scan_metadata:1)
- cycle-0024: evidence/cycle-0024-action-01-run_mineflayer_program.json, evidence/cycle-0024-action-01-generated-action-skill-trial-searchAndPlaceCraftingTableNearSupport.json (world_state_summary:2, block_observations:2, block_name_counts:20, nearest_examples:24, verified_blocks:512, truncated_block_observations:2, loaded_coverage:2, non_exhaustive_coverage:2, scan_metadata:2)
- cycle-0029: evidence/cycle-0029-action-01-run_mineflayer_program.json, evidence/cycle-0029-action-01-generated-action-skill-trial-searchAndPlaceCraftingTableNearby.json (world_state_summary:2, block_observations:2, block_name_counts:20, nearest_examples:24, verified_blocks:512, truncated_block_observations:2, loaded_coverage:2, non_exhaustive_coverage:2, scan_metadata:2)

## Last 5 judgments (detail)

### cycle-0026

Runtime classifier saw verifier=failed, tools=move_to, statuses=move_to:blocked. Outcome contract=blocked; expected=position_delta; observed=blocker_recorded.

### cycle-0027

Runtime classifier saw verifier=passed, tools=move_to, statuses=move_to:arrived. Outcome contract=satisfied; expected=position_delta; observed=position_delta.

### cycle-0028

Runtime classifier saw verifier=passed, tools=move_to, statuses=move_to:arrived. Outcome contract=satisfied; expected=position_delta; observed=position_delta.

### cycle-0029

Runtime classifier saw verifier=failed, tools=run_mineflayer_program, statuses=run_mineflayer_program:skill_error. Outcome contract=blocked; expected=world_block_delta; observed=none.

### cycle-0030

Runtime classifier saw verifier=passed, tools=move_to, statuses=move_to:arrived. Outcome contract=satisfied; expected=position_delta; observed=position_delta.
