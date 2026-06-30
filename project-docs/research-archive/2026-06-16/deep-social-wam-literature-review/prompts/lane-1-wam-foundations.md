# Lane 1 - WAM Foundations and Game World Models

Read `prompts/00-shared-lane-contract.md` first. You are Lane 1 (N=1).

## Scope

The intellectual foundation: world models, World Action Models, action-conditioned
video/game models, model-based RL, Dreamer-style agents, and Minecraft/game world
models specifically. Your job is to nail down, from primary sources, what a WAM
*is*, how it differs from neighbors, what it predicts (pixels vs latent vs
symbolic vs reward vs trajectory), its data/training/eval requirements, and
whether existing weights are usable without training from scratch.

## Focus questions (answer with primary-source evidence)

- Input/output formulation per system; action representation; observation/state
  representation; does it predict pixels, latent state, symbolic state, rewards,
  futures, or trajectories?
- Data requirements, training objectives, evaluation methods, metrics.
- Can existing weights be used without training from scratch? (adapters, zero-shot)
- What transfers to a structured-state Minecraft WAM; what does NOT transfer.
- Is "WAM" the actuator, planner, evaluator, learned transition model,
  counterfactual simulator, or several at different layers? Use primary sources
  (e.g., the adaptive-execution / verifier papers) to answer precisely.
- Why pixel/video WAM is likely NOT the immediate path for this repo, and why a
  structured transition model is more feasible (ground this in cost/latency/data
  evidence from the papers, not opinion).

## Seed sources (already surfaced; verify + extend)

WAM core (download LaTeX, deep-read the survey first):
- 2605.12090 World Action Models survey (DOWNLOADED at papers/latex/2605.12090/;
  deep-read 020-def, 030-wm, 040-arch, 050-data, 060-eval, 070-oppo).
- 2602.15922 DreamZero (WAMs are Zero-shot Policies)
- 2603.22078 Do WAMs Generalize Better than VLAs? (robustness study)
- 2605.06222 When to Trust Imagination (adaptive WAM execution; WAM-as-verifier)
- 2604.25859 Privileged Foresight Distillation
- 2603.16666 Fast-WAM ; 2606.10040 Efficient-WAM ; 2603.17240 GigaWorld-Policy
- 2606.01027 tau_0-WM ; 2602.06508 World-VLA-Loop ; 2410.12822 AVID (adapt video
  diffusion weights to a world model - directly relevant to "use existing weights")

Game / Minecraft world models:
- 2602.22208 Solaris (multiplayer Minecraft video world model, 12.64M frames)
- 2604.18564 MultiWorld ; 2508.13009 Matrix-Game 2.0 ; 2603.23497 WildWorld
  (explicit STATE annotations - important contrast to pure pixels)
- 2511.09057 PAN (LLM latent dynamics + video decoder; hybrid) ; 2502.07825 DWS
- 2605.08567 ACWM-Phys (action-conditioned physical-interaction benchmark)

Find (named by user / canonical, not yet surfaced - search hf + web):
- MineWorld (Microsoft; interactive Minecraft world model, open-source) 
- Oasis (Decart/Etched; real-time generated Minecraft) 
- DreamerV3 (Hafner et al.; mastered Minecraft diamond) and Dreamer 4 / latest
- Genie / Genie 2/3 (DeepMind), GameNGen (DOOM), and any "neural game engine"
- NitroGen - the repo already has an analysis: Read
  `<repo>/project-docs/research-archive/2026-06-16/nitrogen-2601-02427-analysis.md`
  and arXiv 2601.02427; treat as future low-level substrate / contrast, not target.

## Owned deliverables (write these)

- `notes/by-theme/wam-foundations.md` - from first principles: the formal
  definition; Cascaded vs Joint; WAM vs VLA vs WM vs VAM vs Video Policy vs
  model-based RL vs simulator vs planner vs LLM tool-use agent vs Mineflayer
  runtime; what WAM predicts; the verifier/evaluator framing; existing-weights
  reuse; why structured > pixel for this repo (evidence-backed).
- `notes/by-theme/minecraft-world-models.md` - Solaris, MineWorld, Oasis,
  Matrix-Game, MultiWorld, WildWorld, Dreamer-in-Minecraft, Genie-family; what
  each predicts, data shape, whether weights/data are public, multiplayer/social
  capability, and the gap they leave (none predicts social-material state).
- `matrices/wam-vs-vla-vs-policy-vs-runtime.md` - table comparing WAM, VLA,
  visual policy, model-based RL agent, learned simulator, symbolic planner,
  LLM tool-use agent, and Mineflayer action-skill runtime across: predicts `o'`?
  selects `a`? authority over execution? observation type; action type; training
  data; advisory vs actuator; fit to this repo.
- by-paper notes for your primary sources; manifest + search-log fragments; brief.

Caution: the canonical WAM is robot-manipulation, pixel/video, very recent (2026).
Be precise that the project's "Social WAM" is an adaptation into the survey's
modality-independent / implicit-state branch, not the mainstream pixel WAM.
