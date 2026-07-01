# Lane 5 Search Log (Data and Training Feasibility)

All work 2026-06-16 (Asia/Seoul). Tooling: `hf` CLI 1.16.1 (auth user `naem1023`),
WebSearch/WebFetch, repo Read/Bash. No provider/API calls. No live benchmarks.

## Repo artifact grounding (Read, not run)

- `project-docs/runtime/evidence-and-verification/transcript-and-runtime-artifacts.md`, evidence
  contract: transcript steps, actor evidence files, provider snapshots, usage
  records. Rationale: ground ROW schema in real fields.
- `project-docs/runtime/actor-turn/context-projection-and-source-evidence.md`,
  `current_state` + `source_evidence_bundle` two-layer Actor Turn input.
- `project-docs/runtime/actor-turn/actor-turn-tool-calling-and-full-context-codegen.md`,
  function-tool selection, Action Card schema, codegen boundary.
- `project-docs/specification/runtime-evidence-and-action-skills.md`, verifier
  fake-progress rules, `settlement-state/v1`, world-scan schemas.
- `project-docs/specification/reference-adaptation-guide.md`, which references
  the repo already adopts (Voyager, MineDojo, Embodied Agent Interface, etc.).
- Real report JSON inspected (Bash + python json):
  - `tmp/social-cycle-...-20260607T152128Z.json`, `social-cycle-run-report`
    full shape (cycles[], settlement_state/v1, postcondition_results,
    plan_bead_operation_results, provider_usage).
  - `tmp/...-review-summary.json`, `social-cycle-review-summary/v1` with per-cycle
    `rows[]` (the closest existing thing to a transition ROW).
  - `project-docs/experiments/curated/2026-06-15/grounded-social-trajectory-smoke/report.json`
   , `grounded-social-trajectory-report/v1`: typed social `events[]`
    (request/promise/shared_deposit) + scored `dimensions[]`.
  - `project-docs/experiments/curated/2026-06-14/placed-furnace-natural-60/scored-summary.json`
   , `benchmark-score-bundle/v1`: milestone `evidence_rule` auto-label rules.
  - `project-docs/experiments/curated/2026-06-13/50-cycle-gpt55-medium-worksite/report-review-summary.json`
   , confirms row schema generalizes to craft/mine/build/author rows.

## HF dataset discovery (`hf datasets ...`)

- `hf datasets list --search minecraft --limit 25`, mostly text-QA + skins +
  text-to-image. Trajectory ones are pixel/video.
- `hf datasets list --search VPT`, `BarryFutureman/vpt_data_8.0_*` (LeRobot,
  image+action parquet). `rp-yu/VPT_Datasets` is NOT Minecraft (Visual Perception
  Token VQA; name collision, excluded).
- `hf datasets list --search minerl`, `irotem98/minerl*`, `Andemand11/minerl-navigate`
  (video).
- `hf datasets list --search minestudio`, `CraftJarvis/minestudio-data-6xx..10xx`
  (-v106 and -v110). MIT.
- `hf datasets info CraftJarvis/minestudio-data-10xx-v110`, 168 GB shard, LMDB
  (`.mdb`) channels: action/, image/, event/, meta_info/, motion/, segmentation/.
- `hf datasets info BarryFutureman/vpt_data_8.0_part_0`, LeRobot v2.1, fps 20,
  3 episodes / 14238 frames / 1 task per part, parquet image+action, ~3 GB/part.
- `hf datasets list --search STEVE`, no Minecraft STEVE-21K (it lives on GitHub).
- `hf datasets list --search basalt`, none.
- `hf datasets list --search "minecraft trajectory"` , 
  `zhwang4ai/minecraft-trajectory` (video, manual gate),
  `zhwang4ai/minecraft-language-trajectory`,
  `limuyu011/minecraft_trajectory_grounding_actions` (14 MB, single
  `samples_v1.zip`; small grounding-action sample, modality unconfirmed).
- `hf datasets list --search "minecraft dialogue"` / `"embodied social interaction"`
 , no results (no structured embodied-social Minecraft dataset on HF).
- `hf datasets list --search "optimus minecraft"` /  `"MGOA"` , 
  `iLearn-Lab/Optimus-2-MGOA` (MIT, 10M-100M, webdataset, arxiv 2502.19902).
- `hf datasets card iLearn-Lab/Optimus-2-MGOA`, Multimodal Goal-Observation-Action.

## HF papers (`hf papers search`)

- "latent action pretraining", LAPA (2410.11758), CLAP (2601.04061), Motus
  (2512.13030), JALA (2602.21736), VLA-JEPA (2602.10098), UniVLA (2505.06111).
- "video pretraining minecraft", VPT (2206.11795), STEVE-1 (2306.00937),
  Open-World Skill Discovery / SBD (2503.10684), BC-via-search (2212.13326).

## LaTeX downloaded (`scripts/fetch_arxiv_latex.sh`)

- 2206.11795 vpt (18 tex), method + contractor-data + data-scaling appendices.
- 2410.11758 lapa (2 tex), VQ-VAE latent action, >30x pretrain efficiency.
- 2306.00937 steve1 (15 tex), $60 instruction-tuning cost anchor.
- 2502.19902 optimus2 (41 tex), MGOA dataset paper.
- (2605.12090 WAM survey 050-data.tex already present; deep-read for data ecosystem.)

## Web (WebSearch)

- "STEVE-21K dataset", See and Think (2311.15209): 600 vision-env pairs +
  20K QA pairs (Wiki/Reddit, GPT-3.5 cleaned) + skill-code DB. Pixel + text.
- "Oasis Decart minecraft diffusion world model", autoregressive diffusion pixel
  WAM, millions of hours, 1 frame/keystroke, 360-720p @ 20fps on H100.

## Grep checks

- WAM survey eval (060-eval.tex) + oppo (070-oppo.tex): zero matches for
  "minecraft", "structured state", "symbolic". The canonical WAM literature is
  robotics/egocentric/sim pixel data; structured-state Minecraft is a gap.
