# Lane 2 — Minecraft Agent / VLA / Visual Policy / Benchmarks

Read `prompts/00-shared-lane-contract.md` first. You are Lane 2 (N=2).

## Scope

The Minecraft embodied-agent stack: VLA/visual policies, LLM planners, skill
libraries, task benchmarks, and multi-agent Minecraft collaboration. For each,
classify what kind of system it is (VLA, visual policy, planner, simulator,
benchmark, world model, WAM-like, or tool/action runtime), and what is
mechanically reusable vs what should not be copied.

## Focus questions

- Observation space; action space (camera/buttons vs symbolic vs Mineflayer
  high-level); benchmark/task setup; reset/record discipline.
- Is it VLA / visual policy / planner / simulator / benchmark / world model /
  WAM-like / tool runtime?
- Datasets, code, weights, logs, scripts available? reproducible vs claim-only?
- What can be adapted mechanically (manifest discipline, validators, dependency
  graphs, action interfaces); what should NOT be copied (command-fixtured tasks
  as natural-world evidence, VLM-scoring as truth, camera/buttons as authority).
- Where do these systems leave the social-material transition gap unfilled?

## Seed sources (verify + extend; download LaTeX for the ~10 most relevant)

Already surfaced:
- 2502.19902 Optimus-2 (GOAP) ; 2506.10357 Optimus-3 (MoE task experts)
- 2310.08367 MCU (task-centric eval, SkillForge) ; 2605.30931 MineExplorer
  (hidden multi-hop dependency graphs, rule milestones)
- 2601.05215 MineNPC-Task (memory-aware, machine-checkable validators,
  bounded-knowledge policy — closest to this repo's evidence stance; read closely)
- 2305.16291 Voyager ; 2311.05997 JARVIS-1 ; 2305.17144 GITM ; 2311.15209 STEVE
- 2604.05533 Echo (experience transfer) ; 2605.27762 PEAM (parametric memory)
- 2410.22194 ADAM (embodied causal agent; causal graph — relevant to transitions)
- 2507.23698 Scalable multi-task RL for spatial intelligence

Find (named by user / canonical): MineDojo (2206.08853), MineRL/BASALT, VPT
(2206.11795), STEVE-1 (2306.00937), GROOT, ROCKET-1/ROCKET-2, JARVIS-VLA, MCU,
Odyssey, Plancraft, MineLand, MCU/MineStudio (see existing repo analyses — Read
`<repo>/project-docs/research-archive/2026-06-16/minestudio-reference-check.md`
and `minestudio-implementation-analysis.md`; do NOT re-clone), CraftAssist,
MindCraft (architect/builder grounded dialogue), Collaborative Building in
Minecraft (Narayan-Chen). Multi-agent Minecraft: VillagerBench, TeamCraft,
MineCollab, CausalMACE, S-Agents, MindForge, HAS.

Use `hf datasets list --search minecraft`, `hf models list --search minecraft`,
`hf models list --search VPT`, etc., to record which weights/datasets are public.

## Owned deliverables

- `notes/by-theme/minecraft-vla-and-visual-policy.md` — VPT, STEVE-1, GROOT,
  ROCKET, JARVIS-VLA, Optimus-2/3: observation/action spaces, data, weights,
  what is a policy vs planner, what is reusable.
- `notes/by-theme/minecraft-agent-benchmarks.md` — MineDojo, MineRL/BASALT, MCU,
  MineExplorer, Plancraft, Odyssey, MineNPC-Task: task setup, validators,
  dependency graphs, milestone scoring; command-fixture caveat.
- `notes/by-theme/minecraft-multi-agent-social.md` — VillagerBench, TeamCraft,
  MineCollab, MindCraft, CausalMACE, S-Agents, MindForge, HAS, MineLand:
  coordination, communication bottlenecks, role/expertise asymmetry, resource
  sharing; how they score (task completion vs durable social consequence).
- `notes/by-theme/minestudio-positioning.md` — sharpen the existing repo analysis:
  what MineStudio/CraftJarvis offers (sim, callbacks, VPT/STEVE/GROOT/ROCKET,
  datasets, VLM review), and the exact boundary (visual-policy/MineRL layer vs
  this repo's Mineflayer/evidence/social layer).
- `matrices/action-space-comparison.md` — action spaces across MineRL camera/
  buttons, VPT, STEVE-1, Voyager code-skills, JARVIS, Mineflayer high-level,
  this repo's Action Cards + author_mineflayer_action + social actions.
- `matrices/observation-space-comparison.md` — pixels vs symbolic vs hybrid;
  partial observability; loaded-chunk limits; what each exposes.
- by-paper notes; manifest + search-log fragments; brief.

Caution: keep "competence gate" (boring physical ability) separate from "social
contribution." Do not let task-completion benchmarks read as the social target.
