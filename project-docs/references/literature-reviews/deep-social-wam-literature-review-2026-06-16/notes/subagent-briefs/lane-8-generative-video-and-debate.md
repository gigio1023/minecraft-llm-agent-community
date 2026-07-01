# Lane 8 brief: Generative & Video World Models, and the world-model debate

Wave-2 lane, taught for a newcomer. Punctuation ASCII only.

## Lane name

Generative & Video World Models, and the "is video a world model?" debate (the
generative-vs-non-generative / JEPA fault line).

## Sources reviewed (count + list)

13 manifest rows. 7 deep-read from LaTeX, 1 docs-level with verbatim claims captured,
1 docs-level position paper (cited, not line-read), 4 abstract-level breadth.

Cornerstones, LaTeX deep-read (7), each with a new by-paper note:
- 2402.15391 Genie (latent action model; foundation world model from unlabeled video)
- 2408.14837 GameNGen (DOOM as a real-time neural game engine)
- 2405.12399 DIAMOND (diffusion world model; visual details matter)
- 2209.00588 IRIS (token world model; dynamics as language modeling)
- 2309.17080 GAIA-1 (token WM + diffusion decoder for driving)
- 2301.08243 I-JEPA (non-generative; predict image-block features, not pixels)
- 2506.09985 V-JEPA 2 / V-JEPA 2-AC (non-generative latent WM that plans robot control)

Docs-level (no arXiv):
- Sora technical report "Video generation models as world simulators" (OpenAI, Feb 2024).
  New by-paper note `sora-world-simulators.md`. Official page blocked automated fetch (403);
  load-bearing claims + limitations captured verbatim via web search.
- LeCun 2022 "A Path Towards Autonomous Machine Intelligence" (OpenReview, JEPA manifesto).
  PDF saved; not line-read (binary render failed); JEPA argument captured via I-JEPA and
  V-JEPA 2, which cite and instantiate it.

Abstract-level breadth (4):
- 2407.10311 Zhang, "Sora and V-JEPA Have Not Learned The Complete Real World Model" (the
  balanced both-camps-fall-short critique).
- 1507.08750 Oh et al. (action-conditional Atari video prediction, root).
- 1605.07157 Finn et al. CDNA (unsupervised physical-interaction prediction, root).
- 1710.11252 SV2P (stochastic, multi-modal futures, root).

Owned deliverables written:
- `notes/by-theme/wam-generative-video-and-the-world-model-debate.md` (lineage story +
  two-column generative-vs-JEPA treatment + timeline table + the takeaway + Minecraft bridge)
- 8 by-paper notes (above)
- `raw-search-results/lane-8-manifest.jsonl` (13 rows, validated)
- `raw-search-results/lane-8-search-log.md`
- this brief

## Strongest findings (source-backed)

1. The debate's strongest single point is convergent, not one-sided: "high visual fidelity is
   not a usable world model for control." Evidence comes from independent directions, including
   the generative camp's own flagship. The Sora report admits, verbatim, that it "does not
   accurately model the physics of many basic interactions, like glass shattering" and "may not
   understand specific instances of cause and effect," while claiming video scaling is "a
   promising path towards building general purpose simulators of the physical world." Near-
   photoreal video and wrong physical state transitions coexist in the same model.
2. The non-generative camp has closed the loop to real control without pixels: V-JEPA 2-AC
   (2506.09985) plans on a real Franka arm zero-shot (Grasp, Pick-and-Place, novel objects, new
   labs, no reward) using ~62 hours of robot data on top of a frozen video encoder, by minimizing
   L1 distance to a goal in latent space (CEM/MPC). Its own argument: generative video
   "emphasizes ... faithfulness ... and visual quality instead of planning capabilities," and
   JEPA "ignores unpredictable details that generative objectives emphasize (e.g., the precise
   location of each blade of grass ... or each leaf on a tree)." This is the sharpest verbatim
   statement of the fault line, from LeCun's group.
3. The lineage has a clear internal logic a newcomer can follow: roots (action+frame->frame,
   2015-2017) -> token WMs borrow the LM recipe (IRIS 2022) -> diffusion WMs keep visual detail
   IRIS discarded (DIAMOND 2024) -> neural game engines (GameNGen 2024) -> foundation WM with
   latent actions from unlabeled video (Genie 2024). Genie's own taxonomy (World Models = Video
   + Actions/frame-level; Video Models = Video + Text/video-level; Genie = Video-only/frame-
   level) cleanly places Sora as a "Video Model," so calling it a "world simulator" stretches
   the term without a frame-level controllable commitment to the next state.

## Weak or uncertain claims (could not fully verify)

- Sora's primary text: the official OpenAI page returned HTTP 403 to automated fetch, so the
  quotes (the "general purpose simulators" claim and the glass/food/cause-effect limitations)
  were captured via web search of the page and corroborating reviews, not by reading the page
  directly. The quotes are widely and consistently reported, but I did not render the source
  page myself. This is the biggest unverified item.
- LeCun's manifesto was not line-read (binary PDF render failed); its JEPA argument is reported
  second-hand via I-JEPA and V-JEPA 2 (which cite and build on it). Low risk (the papers
  instantiate it faithfully), but flagged.
- Emergent-physics claims in generative papers (Genie's "bags of chips" / parallax, GAIA-1's
  give-way reactions) are qualitative, curated examples from the authors, not measured causal
  correctness. I report them as "locally plausible generated video," not validated understanding.
- Reproducibility tags reflect released code: DIAMOND, IRIS, I-JEPA have public code (tagged
  reproducible); V-JEPA 2 has code but the robot-planning result is hardware-dependent (partial);
  Genie, GAIA-1, Sora are closed (claim-only / docs).

## Implications for this repo (one line each, wave-1 owns the full argument)

- Mechanically useful: compounding-error fixes (GameNGen noise-augmentation); the "freeze a
  representation, train a small action-conditioned predictor, plan against a goal in that space"
  pattern (V-JEPA 2-AC) as an advisory, never-controller analog; "structured dynamics + detachable
  appearance decoder" (GAIA-1) to justify keeping predictions in typed state with pixels as an
  optional sidecar; two-phase "scripted agents generate episodes, then train the predictor"
  (GameNGen, Genie) as a social-fixture pattern.
- Research contribution / overclaim to avoid: do not build a Minecraft video WM; do not cite
  generative-video fidelity as physical/causal understanding (sources disclaim it); do not adopt
  RL-in-imagination or MPC latent planning as runtime authority (WAM stays advisory); do not
  present JEPA's ImageNet/robot wins as proof a social WAM works (borrow the principle, not the
  numbers).

## Recommended next questions

1. Physics-commonsense benchmarks (VideoPhy, Physics-IQ, WorldModelBench, PhyGenBench,
   VBench-2.0) are the empirical core of the "fidelity != understanding" claim. I only named
   them; Lane 10 should deep-read them and quantify how badly high-FVD models fail physics.
2. For a structured social WAM, what is the analog of V-JEPA 2's honest limitations (compounding
   error, exponential search, image-only goals) when the state is typed social-material facts and
   the horizon is one or two advisory steps? Worth a focused note tying these limits to the repo's
   short-horizon advisory design.
3. Does any work predict structured (non-pixel, non-generic-latent) state transitions in an
   interactive world with explicit per-step state annotations (WildWorld is the closest, video +
   state)? That is the empty cell nearest the project; worth a targeted search.
