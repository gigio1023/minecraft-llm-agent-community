# Lane 10 search log (training, evaluation, open problems)

All searches run 2026-06-16. Lane 10 is problem-organized; most synthesis reuses the
already-downloaded WAM survey (2605.12090) eval/oppo sections and existing wave-1 by-paper
notes, so the search effort focused on (a) verifying seed arXiv IDs and (b) deep-reading three
genuinely new sources.

## ID verification (seed brief said "verify first")

1. `hf papers info 2406.03520` -> VERIFIED. VideoPhy: Evaluating Physical Commonsense for Video
   Generation (Bansal et al., 2024). Matches survey `bansal2024videophy`. Best model CogVideoX-5B
   = 39.6%.
2. `hf papers info 1011.0686` -> NOT on HF Hub ("Paper not found"). Expected: HF papers only
   indexes papers that have a HF page; DAgger predates that. Verified instead via WebSearch:
   "A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning",
   Ross, Gordon, Bagnell, AISTATS 2011, arXiv 1011.0686 (PMLR v15 ross11a). ID CORRECT.
3. `hf papers info 2501.09038` -> VERIFIED. Physics-IQ. Note: the paper's TITLE is "Do generative
   video models learn physical principles from watching videos?" (Motamed et al., Google DeepMind,
   2025); "Physics-IQ" is the benchmark name. Matches survey `motamed2026physicsiq` (survey lists
   year 2026; arXiv submitted Jan 2025). Code github.com/google-deepmind/physics-IQ-benchmark.
4. `hf papers search "WorldModelBench world model benchmark physics"` -> FOUND ID (seed brief had
   none). WorldModelBench = arXiv 2502.20694, "Judging Video Generation Models As World Models"
   (Li et al., 2025). 67K human labels, fine-tuned judger. Matches survey `li2025worldmodelbench`.
5. `hf papers search "PhyGenBench physical commonsense text-to-video"` -> FOUND ID. PhyGenBench =
   arXiv 2410.05363, "Towards World Simulator: Crafting Physical Commonsense-Based Benchmark for
   Video Generation" (Meng et al., 2024). 160 prompts, 27 laws, PhyGenEval. Matches survey
   `meng2024phygenbench`.
6. `hf papers search "VBench-2.0 intrinsic faithfulness video generation"` -> FOUND ID.
   VBench-2.0 = arXiv 2503.21755 (Zheng et al., 2025). Five dimensions incl. Physics + Commonsense.
   Matches survey `zheng2025vbench`.
7. `hf papers search "world model video generation inverse dynamics Turing test executable
   actions"` -> FOUND ID for the survey's `fan2026wow` (seed brief gave no arXiv id). "Wow, wo,
   val! A Comprehensive Embodied World Model Evaluation Turing Test" = arXiv 2601.04137 (Fan et
   al., 2026). 609 robot samples, 22 metrics, IDM Turing Test. CORRECTION/ADDITION: the survey
   cites it only as `fan2026wow`; arXiv id 2601.04137 established here.

CORRECTIONS RECORDED: none of the three IDs the seed brief actually printed (2406.03520,
2501.09038, 1011.0686) were wrong. The brief left WorldModelBench / PhyGenBench / VBench-2.0 / Wow
without IDs; all four resolved above. Physics-IQ's title differs from its benchmark name (noted so
a reader is not confused).

## LaTeX deep-read fetches (new sources, via scripts/fetch_arxiv_latex.sh; script sleeps 3s/call)

- `bash scripts/fetch_arxiv_latex.sh 1011.0686 dagger` -> tarball_extracted, 1 tex
  (`noregret.tex`). Deep-read intro + PRELIMINARIES (T^2 epsilon compounding-error result, tight
  bound) + DAGGER algorithm + Theorem 3.x.
- `bash scripts/fetch_arxiv_latex.sh 2601.04137 wow-wo-val-idm-turing` -> tarball_extracted, 9 tex
  (sec/0..6). Deep-read 1_intro, 3_method, 4_experiments (IDM Turing numbers: Kling 9.88%, Hailuo
  2.47%, near-0% open-source, WoW-wan 40.74%, WoW-cosmos2 18.52%; planning best 17.27; physical-law
  best 68.02; human deceive-ratio r=0.874 video-quality), 5_conclusion.
- `bash scripts/fetch_arxiv_latex.sh 2406.03520 videophy` -> tarball_extracted, 11 tex
  (sections/*). Deep-read introduction (688 prompts, 12 models, best 39.6%, worst solid-solid,
  VideoCon-Physics auto-eval, simulator-as-ground-truth is itself unsolved).

## Re-read of already-downloaded survey (no new fetch)

- `papers/latex/2605.12090/060-eval.tex` (eval taxonomy: visual fidelity metrics with equations;
  physics-commonsense benchmark table with cite keys; action-plausibility incl. IDM Turing;
  40+ action-policy benchmarks table) and `070-oppo.tex` (six open challenges, incl. latency tax
  DreamZero 7Hz vs 50Hz, and the missing joint metric proposing Counterfactual Consistency +
  Foresight-Conditioned Success).

## Targeted web verification (mechanism grounding)

- WebSearch: "JEPA self-supervised representation collapse stop-gradient EMA target encoder ...
  I-JEPA". Confirmed the representation-collapse mechanism: trivial solution = both encoders map
  every input to a constant; stop-gradient (target embeddings fixed, no gradient through target
  encoder) + EMA target encoder (momentum ~0.996->1.0) create a moving teacher the predictor
  chases; caveat that EMA alone does not guarantee non-collapse (some methods add VICReg-style
  variance-covariance regularization). Used to ground Section 1.4 of the theme file.

## Breadth sources discovered while searching (abstract-level, logged in manifest, NOT deep-read)

- WorldBench 2601.21282 (disentangled per-concept physics eval).
- WorldReasonBench 2605.10434 (reframes video-gen eval as world-state prediction across physical /
  social / logical / informational consistency; one of few that names a social dimension).
- PhyWorldBench 2507.13428 (adds an "anti-physics" instruction-following category).
- EVA 2603.17808 (names the "executability gap"; turns IDM mismatch into a training reward).
- Dream.exe 2606.04811 (video-to-execution benchmark; "visual quality a poor predictor of
  executability").
- Video Generation Models in Robotics survey 2601.07823 (challenges: poor instruction following,
  physics hallucination, data/training/inference cost).

These corroborate the lane's "fidelity != control" and physics-eval themes; deep-read deferred as
the survey + three deep-reads already establish every claim.

## Notes on scope discipline

- Did NOT re-survey the Minecraft pixel-WM family (MineWorld/Oasis/Solaris/Matrix-Game): owned by
  `minecraft-world-models.md` (wave 1). Only cited MineWorld's token-cost number for the AR-vs-
  diffusion contrast.
- Did NOT re-derive the social-fidelity validity literature (SimBench, LLM-judge): owned by
  `benchmark-validity-and-evaluation.md` (lane 3). Linked, not duplicated.
- Did NOT re-derive the repo's build options / dataset ROW schema: owned by
  `data-and-training-feasibility.md` (lane 5). Linked, with one-line repo-relevance pointers only.
