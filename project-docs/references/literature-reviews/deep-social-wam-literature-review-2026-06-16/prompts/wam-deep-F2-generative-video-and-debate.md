# Lane 8 (F2): Generative & Video World Models, and the "is video a world model?" debate

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum.md`
first. You are Lane 8. Manifest fragment: `raw-search-results/lane-8-manifest.jsonl`.

## Why this lane exists

The most visible branch of the field generates the world as **pixels/video** (Sora,
Genie, GameNGen, driving and game world models). A newcomer needs (a) this lineage and
(b) the field's biggest live argument: **does generating realistic video mean a model
"understands" the world?** The counter-camp (JEPA / non-generative, predict latents not
pixels) must be presented fairly. This is the conceptual fault line under "what should a
world model predict."

## What to nail down (primary-source, taught plainly)

- The video-world-model lineage: early action-conditioned video prediction -> token /
  transformer world models -> diffusion world models -> "neural game engines" -> general
  foundation world models with learned/latent actions.
- Define: autoregressive vs diffusion generation; "latent action model" (inferring action
  controls from unlabeled video, Genie's trick); "world simulator" (the Sora framing).
- The debate, both sides:
  - Pro-generative / "video models are world simulators" (Sora technical report's claim).
  - The critique: visual fidelity does not imply physical or causal understanding
    ("visual conflation"; physics-violation findings). Cite the existing
    `2601.15533-actionable-simulators.md` rather than redoing it.
  - The non-generative counter-position: JEPA / V-JEPA (LeCun), predict in
    representation space, not pixels, to avoid wasting capacity on un-predictable detail.
- One short bridge to Minecraft pixel WMs (Oasis/Matrix-Game/MineWorld/Solaris) that wave
  1 already covered: reference `minecraft-world-models.md`, do not redo it.

## Seed sources (verify IDs before fetching)

Cornerstones (LaTeX deep-read where available; some are blogs/tech-reports = docs-level):
- 2402.15391 Genie, "Generative Interactive Environments" (DeepMind), latent action
  model from unlabeled video; foundation world model. Genie 2 / Genie 3: blog/docs-level,
  mark as such.
- 2408.14837 GameNGen, "Diffusion Models Are Real-Time Game Engines" (DOOM at ~20fps).
- 2405.12399 DIAMOND, "Diffusion for World Modeling: Visual Details Matter in Atari."
- 2209.00588 IRIS, "Transformers are Sample-Efficient World Models" (discrete tokens).
- 2309.17080 GAIA-1 (Wayve), generative driving world model. GAIA-2: docs-level.
- Sora technical report, "Video generation models as world simulators" (OpenAI, 2024),
  no arXiv; fetch the OpenAI tech-report page via web; treat its world-simulator claim as
  a primary *claim* to be examined, not settled fact.
- 2301.08243 I-JEPA and 2506.09985 V-JEPA 2 (verify), non-generative, latent-prediction
  world models. LeCun, "A Path Towards Autonomous Machine Intelligence" (2022, OpenReview
  position paper), docs-level; the manifesto for the non-generative camp.

Breadth / early roots (abstract fine):
- 1507.08750 Oh et al., action-conditional video prediction in Atari (verify).
- 1605.07157 Finn et al., unsupervised physical-interaction video prediction / CDNA
  (verify). SV2P (1710.11252, verify).
- Physics-commonsense benchmarks (hand the deep eval treatment to Lane 10, just name
  them): VideoPhy, Physics-IQ, WorldModelBench, PhyGenBench, VBench-2.0.

## Owned deliverables

- `notes/by-theme/wam-generative-video-and-the-world-model-debate.md`, the video-WM
  lineage as a teachable story + a balanced two-column treatment of the generative vs
  non-generative (JEPA) debate, with the explicit takeaway a newcomer needs: "high
  visual fidelity != a usable world model for control," sourced. Small timeline table.
- New by-paper notes for cornerstones with no note yet: Genie, GameNGen, DIAMOND, IRIS,
  GAIA-1, I-JEPA / V-JEPA 2, and a docs-level note for the Sora tech report.
- Manifest + search-log fragments (lane 8); brief
  `notes/subagent-briefs/lane-8-generative-video-and-debate.md`.

Tag rows `world-model`, `validity` (for the debate sources), `minecraft` where apt.
