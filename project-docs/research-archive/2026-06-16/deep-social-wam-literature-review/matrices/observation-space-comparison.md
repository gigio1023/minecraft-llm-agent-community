# Observation-Space Comparison — Minecraft Agents vs This Repo

Lane 2. Compares what each system *perceives*: pixels vs symbolic/typed state vs
hybrid; degree of partial observability; loaded-chunk limits; and what is exposed
to the decision-maker vs only recorded.

Why this matters for the WAM hierarchy: a **structured-state** observation
(typed inventory, container snapshots, positions, social ledger) is the branch of
the canonical WAM definition this repo bets on (`o` = typed Minecraft+social
state). A **pixel** observation forces any predictive model to forecast images.
The project wants to know which instantiation is feasible — the matrix shows the
field is overwhelmingly pixel-based for *policies* and symbolic for *LLM agents*.

## Matrix

| System (id) | Obs modality | Resolution / fields | Partial observability | Inventory/containers exposed to decider? | World-state access | Other-actor state? |
| --- | --- | --- | --- | --- | --- | --- |
| MineRL/Malmo | pixels (+ optional compass/inventory wrappers) | 64×64 typical | yes (first-person) | wrapper-dependent | limited voxel via wrapper | no |
| VPT (2206.11795) | **pure pixels** | **128×128×3**, FOV 70°, overlays kept (hotbar/health/hand); cursor sprite in GUI | yes (first-person only) | **no** (inventory recorded for diagnostics, NOT fed to model) | none to model | no |
| STEVE-1 (2306.00937) | pixels + goal embedding | 128×128×3 + MineCLIP `z_goal` | yes | no | none | no |
| GROOT (2310.08235) | pixels + reference-video goal | 128×128×3 + video latent | yes | no | none | no |
| ROCKET-1 (2410.17856) | pixels + **segmentation mask** + interaction id | 4-channel (RGB+mask) | yes; SAM-2 tracks objects through occlusion | no | none (object-level via mask) | no |
| JARVIS-VLA (2503.16365) | pixels (**history of frames**) + language | multi-image prompt; **non-Markovian** | yes; history mitigates | no (visual only) | none | no |
| Optimus-2 (2502.19902) | pixels + behavior tokens + language | image + consolidated obs-action **behavior tokens** | yes | no | none | no |
| MineDojo (2206.08853) | pixels + **rich symbolic** (compass, GPS, voxels, lidar, inventory, life stats) | configurable | yes (but more sensors than VPT) | **optionally yes** (inventory/stats wrappers) | voxel/lidar option | no |
| Voyager (2305.16291) | **symbolic** (Mineflayer state) + chat-style env feedback | inventory, nearby blocks/entities, biome, time, health/hunger as text | partial (Mineflayer `bot` view + nearby query) | **yes** (textualized inventory) | n/a (single agent) | no |
| GITM (2305.17144) | **symbolic/text** | structured observation summaries | partial | yes (text) | none | no |
| Plancraft (2412.21033) | **symbolic GUI** (+ optional image of GUI) | crafting-grid contents as structured state; multimodal variant adds the GUI image | crafting GUI only (no world) | **yes** (the task is inventory→target) | n/a (crafting only) | no |
| MINDcraft/MineCollab (2504.17950) | **symbolic** (Mineflayer queries) + chat | inventory, nearby blocks/entities, other agents' chat | partial; **pairwise comms** to fill gaps | **yes** (inventory queries) | partial — via **chat only** (no direct read of others' inventory) | **yes (chat)** |
| VillagerAgent (2406.05720) | symbolic (Mineflayer) | state manager tracks env + agent data | partial | yes | central **state manager** tracks agents | **yes (shared state mgr)** |
| MineLand (2403.19267) | **deliberately limited** multimodal | **low-resolution vision + audio**; physical-need signals (hunger) | **strong** — limited senses by design force communication | partial | local only | **yes — must communicate to learn others' state** |
| Odyssey (2407.15325) | symbolic (Mineflayer) + Wiki RAG | inventory, nearby state + retrieved knowledge | partial | yes | nearby | no |
| Narayan-Chen MDC (P19-1537) | **voxel world + dialogue** | 11×9×11 voxel grid, 6 block colors; architect sees builder | architect/builder asymmetry (architect can't place) | n/a (blocks only) | full voxel (small world) | **yes (the other human)** |
| **THIS REPO** | **typed structured state** (`current_state`) + `source_evidence_bundle` cards; screenshots as *support* | typed facts: movement/position, inventory deltas, container snapshots, crafting, health/hunger/status, tool durability; **social ledger**: obligations/credits, material claims, public affordances, memory | **explicit & bounded** — loaded-chunk limits surfaced as typed facts, not hidden | **yes — typed inventory + container snapshots, NOT pre-selected hints** | world-state scans with **loaded-world limits made explicit** | **yes — typed: relationships, obligations, others' material claims, memory commitments** |

## Reading the matrix (interpretation)

1. **Policies see pixels; LLM agents see symbols.** The entire learned-policy
   cluster (VPT→JARVIS-VLA) perceives **128×128 pixels and nothing else** — they
   do not even see their own inventory as structured input (VPT explicitly records
   inventory for diagnostics but withholds it from the model). The LLM-agent
   cluster (Voyager, GITM, MINDcraft, Odyssey) perceives **textualized symbolic
   state**. This repo is squarely in the symbolic cluster, and goes further by
   adding a **typed social ledger** (obligations, claims, relationships) that no
   other system exposes as first-class observation.
2. **The structured-state WAM branch is feasible and under-explored.** The
   canonical WAM definition allows `o'` to be a non-pixel latent / structured
   state. Every Minecraft *world model* in the broader review (Solaris, Matrix-
   Game, WildWorld — Lane 1/3) predicts **pixels**. No surveyed Minecraft system
   predicts **typed social-material deltas**. So a structured-state Minecraft WAM
   is inside the definition yet absent from the literature — the project's bet is
   defensible as a *gap*, not a contradiction.
3. **Partial observability is handled three ways**: history-in-prompt (JARVIS-VLA),
   object tracking through occlusion (ROCKET-1 + SAM-2), and *designed* sensory
   limits that force communication (MineLand). This repo handles it by surfacing
   **loaded-chunk limits as typed facts** rather than hiding them — closest in
   spirit to MineLand's "limited senses are explicit," but symbolic.
4. **Other-actor state is the divider.** Single-agent policies: none. Multi-agent
   LLM systems expose others only via **chat** (MINDcraft, MineLand) or a
   **central shared state manager** (VillagerAgent). This repo exposes others as
   **typed social facts** (their claims, the obligations between us, memory of
   past interactions) — which is exactly the Social/Institutional WAM input the
   field lacks.

## Mechanically reusable vs avoid (for this repo)

- **Reusable**: MineDojo's optional symbolic sensors (inventory/voxel) as a
  reference for what typed fields to expose; MineLand's "limited senses are
  explicit" stance; VillagerAgent's state-manager as a *recording* structure (not
  as a hidden planner).
- **Avoid**: feeding pre-selected hints into observation (the repo's own rule —
  no `deposit_candidates`, `nearby_block_hints`, etc.); treating pixels/screenshots
  as decision authority (they are support evidence); a central omniscient state
  manager that lets an actor *read* others' inventories directly (breaks the
  "communication/observation has a cost" social premise — MineLand and MineCollab
  both make others' state cost something to learn).
