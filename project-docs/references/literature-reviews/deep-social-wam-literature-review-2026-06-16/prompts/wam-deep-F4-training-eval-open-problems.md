# Lane 10 (F4): Training, Evaluation, and the Open Problems of World/Action Models

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum.md`
first. You are Lane 10. Manifest fragment: `raw-search-results/lane-10-manifest.jsonl`.

## Why this lane exists

A newcomer who has the lineage (lanes 7-9) still needs the cross-cutting craft: **how
these models are trained, how they are judged, and what is genuinely unsolved.** This
lane is the "what is hard and why" map. It is deliberately problem-organized, not paper-
organized.

## What to nail down (primary-source, taught plainly)

Training mechanics (define each, then give the canonical reference):
- Teacher forcing vs autoregressive rollout; **exposure bias**; **compounding error**
  (errors accumulate when a model consumes its own predictions over a long horizon),
  the central reason long rollouts drift. DAgger is the classic compounding-error
  reference for imitation; name the same phenomenon in world-model rollouts.
- Autoregressive-token vs diffusion training objectives for world models (contrast IRIS /
  MineWorld vs DIAMOND / Matrix-Game; cite lane-8 and existing notes, do not redo them).
- Latent-dynamics training and **representation collapse** (why JEPA-style methods need
  stop-gradient / EMA targets to avoid trivial solutions).
- Why action-state-state `(o, a, o')` triplet data is scarce and expensive, and the
  "unified data digestion" idea (mixing action-labeled and action-free video).

Evaluation (organize as: what is measured, with what metric, and the gap):
- Rollout/visual fidelity: PSNR, SSIM, LPIPS, FVD, DreamSim, DINO-similarity (define each
  in one line; note fidelity != usefulness).
- Physical-commonsense benchmarks: VideoPhy, Physics-IQ, WorldModelBench, PhyGenBench,
  VBench-2.0 (verify IDs; what each tests).
- Action plausibility / the **IDM Turing test** (run an inverse-dynamics model on
  generated video, execute the inferred actions, measure real success; many visually
  convincing models "collapse to near zero"), from the WAM survey, cite the existing
  `2605.12090-wam-survey.md`.
- Downstream control success on robot suites (name them briefly; LIBERO, MetaWorld,
  RLBench, ManiSkill) and the point that this, not fidelity, is the real test.
- The evaluation GAP the survey itself flags: no joint metric for causal consistency
  between the imagined future and the chosen action (it proposes Counterfactual
  Consistency, Foresight-Conditioned Success).

Open problems (the newcomer's "frontier" list, each one-paragraph, sourced):
1. Compounding error / long-horizon drift.
2. Hidden state not present in observations (cite existing `2603.23497-wildworld.md`).
3. Fidelity != control (cite `2603.22078-do-wams-generalize.md`,
   `2601.15533-actionable-simulators.md`).
4. Real-time inference cost of generative WAMs (cite DreamZero 7Hz, MineWorld token
   counts from existing notes).
5. Hierarchical world-action modeling (the survey names it an open challenge: connecting
   high-level semantic decomposition to low-level physical prediction).
6. Evaluation decoupling / the missing joint metric (above).

## Seed sources (verify IDs; many notes already exist - cite, do not overwrite)

- 2605.12090 WAM survey eval section (DOWNLOADED; re-read 060-eval, 070-oppo).
- VideoPhy (2406.03520, verify), Physics-IQ (2501.09038, verify), WorldModelBench
  (verify), PhyGenBench (verify), VBench-2.0 (verify), physics-commonsense eval.
- DAgger, "A Reduction of Imitation Learning..." (1011.0686, Ross et al., verify) for
  compounding error.
- Cite existing notes for WildWorld, Do-WAMs-Generalize, actionable-simulators, DreamZero,
  MineWorld, the WAM survey rather than re-fetching.

## Owned deliverables

- `notes/by-theme/wam-training-evaluation-and-open-problems.md`, three sections
  (Training mechanics; Evaluation landscape + the gap; Open problems), each definition-
  first and source-backed. Include one compact "metric -> what it measures -> what it
  misses" table and one "open problem -> why hard -> who flags it" table. This is the
  capstone "what is hard" reference; complements `benchmark-validity-and-evaluation.md`
  (which is social-benchmark-focused) and `data-and-training-feasibility.md` (repo-
  focused) - link to them, do not duplicate.
- New by-paper notes only for genuinely new sources you deep-read (e.g. a physics-
  commonsense benchmark, DAgger). Everything else: cite existing notes.
- Manifest + search-log fragments (lane 10); brief
  `notes/subagent-briefs/lane-10-training-eval-open-problems.md`.

Tag rows `validity`, `world-model`, `benchmark`, `data` as apt.
