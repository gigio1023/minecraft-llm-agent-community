# Lane 23 (H6): Autonomous experimentation and self-improving / discovered world models

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave4.md`. This brief layers scope on top.

## Area
Loops that autonomously improve or discover the WORLD MODEL (the dynamics) itself, not just the
policy: curiosity and intrinsic-motivation exploration to gather model-improving data,
active/experimental causal discovery, and LLM-agent world models that co-evolve with the policy.
Central question: can a system run its own experiments to learn or refine a predictive model of its
world?

## Seeds (verify ids before fetching)
- WebEvolver, Enhancing Web Agent Self-Improvement with a Coevolving World Model: 2504.21024. This
  is the cornerstone: an LLM world model predicts the next observation, serves both as a training-
  data generator AND as an inference-time look-ahead engine, and self-improves. Deep-read it.
- Curiosity / intrinsic motivation: ICM 1705.05363; RND 1810.12894; Plan2Explore 2005.05960
  (self-supervised model learning via expected information gain).
- Cite wave-2 lineage (`wam-lineage-rl-and-latent-dynamics`, the Dreamer line) for model-based
  learning; do not re-survey it.
- EXTEND wave-3 `research-area-affordances-and-causal-world-models`: cover the ACTIVE and
  EXPERIMENTAL discovery angle (intervene to learn dynamics) that it did not.
- Verify-then-add: WorldLLM, "learning to experiment", active/interventional causal discovery,
  model-based RL that self-improves its world model.

## Owned deliverables
- Theme: `notes/by-theme/research-area-autonomous-experimentation-and-world-model-discovery.md`.
- by-paper notes (at least WebEvolver, Plan2Explore, one curiosity method).
- `raw-search-results/lane-23-manifest.jsonl`, `raw-search-results/lane-23-search-log.md`,
  `notes/subagent-briefs/lane-23-autonomous-experimentation-world-model-discovery.md`.

## Deconflict
- H1 owns policy self-improvement loops; H5 owns the verifiable-reward signal. You own WORLD-MODEL
  improvement and discovery specifically.
- EXTEND, do not duplicate: wave-2 lineage themes, wave-3 `research-area-affordances-and-causal-
  world-models` and `research-area-structured-object-centric-world-models`.

## WAM tie + thesis
Most direct tie: this is autoresearch aimed at the WAM itself. WebEvolver is the clean precedent (an
LLM world model that self-improves and doubles as a look-ahead engine, exactly the advisory role
this repo wants). State how the repo could improve its advisory WAM by intervening in Minecraft (run
the action, let the verifier label the real `(state, action, next-state)`, correct the predictor),
and land the bound: curiosity / information-gain exploration in a social world risks anti-social
probing (for example taking others' items to "see what happens"), so exploration must respect the
repo's material-claim and weak-commons vocabulary. Advisory only: a discovered WM predicts, it never
executes.
