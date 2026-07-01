# By-resource: Minecraft pixel/keyboard trajectory datasets (the contrast set)

This note records the public Minecraft data/weights checked as candidate "starting
consequence predictors", and why each is a **modality/scope mismatch** for a
structured social-material WAM. All facts from `hf datasets info/card` (2026-06-16)
or cited web/paper sources.

## VPT contractor + IDM-labeled data (OpenAI)

- Source: github.com/openai/Video-Pre-Training ; HF mirror
  `BarryFutureman/vpt_data_8.0_*` (LeRobot v2.1, Apache-2.0).
- Shape: video frames (RGB) + keyboard/mouse actions at 20 Hz. HF parts are parquet
  image+action, fps 20, ~3 GB/part (e.g. part_0 = 3 episodes / 14,238 frames).
- Original corpus: ~70k+ hours of web video pseudo-labeled by an IDM trained on
  ~2,000 h of $20/hr contractor data (~$90k-$160k total). See `by-paper/2206.11795-vpt.md`.
- Fit to structured WAM: NO. Pixel observation, low-level action. The label is
  "which key/mouse", not "which item moved to whom".

## MineStudio data (CraftJarvis)

- Source: `CraftJarvis/minestudio-data-{6,7,8,9,10}xx-{v106,v110}`, license MIT.
- Shape (`hf datasets info ...-10xx-v110`): one shard ≈ **168 GB**, stored as LMDB
  (`.mdb`) with channels `image/`, `action/`, `event/`, `meta_info/`, `motion/`,
  `segmentation/`. This is VPT-lineage contractor/web trajectory data repackaged for
  the MineStudio training toolkit.
- Fit to structured WAM: NO for observation (pixel image channel is primary). The
  `event/` channel (inventory/craft events) is the closest thing to structured
  signal, but it is keyed to pixel frames and to low-level actions, not to typed
  social-material claims. Useful only as contrast / as evidence that "event" labels
  exist but are not socially structured.

## STEVE-21K (See and Think, arXiv 2311.15209)

- Components (web source): 600 vision-environment pairs (first-person video + block
  entities in view + per-timestamp context) over 6 terrains; 20K QA pairs from
  Minecraft-Wiki + Reddit cleaned by GPT-3.5; a skill-code database.
- Fit to structured WAM: NO. The "structured" part is pixel video + knowledge QA
  text, not a transition record. No possession/obligation/social-event content.

## Optimus-2 MGOA (arXiv 2502.19902)

- `iLearn-Lab/Optimus-2-MGOA`, MIT, 10M-100M, webdataset. ~25k videos, 8 atomic
  gather/craft tasks. See `by-paper/2502.19902-optimus2-mgoa.md`.
- Fit: NO. Pixel + low-level action, single-actor, material-acquisition only.

## Oasis (Decart + Etched, 2024)

- Web source: autoregressive diffusion-transformer pixel **world model**, trained
  on "millions of hours" of Minecraft gameplay; generates 1 frame per keystroke at
  360-720p, 20 fps, on NVIDIA H100; only minutes of coherent gameplay at a time.
- Fit to structured WAM: it is the maximal opposite, a pure pixel WM `p(o'|o,a)`
  with no symbolic state, no inventory truth, no social semantics. Cited as the
  cost/compute anchor for "what a pixel Minecraft world model costs" (H100,
  real-time inference, drift after minutes).

## Minecraft text / chat / QA datasets (non-trajectory)

- `declip/Minecraft-Server-Chat` (CC0, 1M-10M JSON chat lines), raw multiplayer
  chat, no embodied state link.
- `naklecha/minecraft-question-answer-700k` (CC-BY-NC-SA-3.0, 100k-1M) and
  `Aiwensile2/Minecraft_QA-pairs_Instruction_Dataset`, game-knowledge QA.
- Fit: NO for a transition WAM, but `Minecraft-Server-Chat` could seed *surface
  realism* for chat-style action skills (how players phrase requests). Not a
  consequence predictor; possible style reference only, license CC0.

## Bottom line

Every public Minecraft trajectory dataset checked is pixel observation + low-level
keyboard/mouse action, single-actor, material-acquisition. **None** encodes typed
possession, material claims, obligations, or multi-actor social events as the unit
of record. There is no off-the-shelf structured social-material transition dataset
to fine-tune from. This is the gap the repo's runtime can fill cheaply.
