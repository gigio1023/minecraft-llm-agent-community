# Minecraft and Game World Models: what they predict, and the social gap they leave

Lane 1 theme file. Source-backed; jargon defined on first use. Covers the Minecraft
and game world-model frontier and shows that none predicts social-material state.

Deep-read primary sources: Solaris (2602.22208), MineWorld (2504.08388), WildWorld
(2603.23497, ARPG not Minecraft but the key explicit-state contrast), Dreamer 4
(2509.24527). Breadth (abstract/card-level): Matrix-Game (2506.18701 / 2508.13009),
Oasis, Genie family, GameNGen, DreamerV3 (2301.04104), iVideoGPT (2405.15223), PAN
(2511.09057). See per-paper notes and `game-world-models-family.md`.

---

## 1. The landscape at a glance

| System | What it predicts | Action input | Data shape | Weights / data public? | Multiplayer? | Social-material state? |
|---|---|---|---|---|---|---|
| **MineWorld** (Microsoft) | next **pixel frame** `p(x_{i+1}\|x_{<i},a_i)` (pure WM) | mouse+keyboard (tokenized) | Minecraft gameplay video + action; VQ-VAE tokens | code+weights (paper) | No | No |
| **Oasis** (Decart/Etched) | next **pixel frame**, playable generated Minecraft | keyboard+mouse | gameplay video | `Etched/oasis-500m` MIT | No | No |
| **Matrix-Game / 2.0** (Skywork) | **pixel video**, image-to-world | keyboard+mouse, frame-level | Matrix-Game-MC 3,700h Minecraft (+ Unreal/GTA5) | `Skywork/Matrix-Game(-2.0)` MIT | No | No |
| **Solaris** (NYU VisionX) | **multi-player pixel video** (each player's view) | WASD+mouse+place/dig | 12.64M bot frames, synchronized multi-view | engine+model+data public (apache-2.0) | **Yes (visual)** | No |
| **Genie 3** (DeepMind) | **pixel video**, general worlds from text/image | latent / control inputs | internet video | No (closed) | No | No |
| **GameNGen** (Google) | **pixel frame**, DOOM at 20fps | game actions | agent-play frames+actions | No | No | No |
| **DreamerV3** (DeepMind) | **latent** state + reward; actor-critic in imagination | env actions | online RL experience | code public | No | No |
| **Dreamer 4** (DeepMind) | **latent** state; RL in imagination; offline | mouse+keyboard+crafting | offline video + inventory state | (paper) | No | No |
| **WildWorld** (Shanda) | **pixel video + explicit state annotations** (ARPG) | 450+ ARPG actions | 108M frames + per-frame world state | dataset (project page) | No | No (combat state, not social) |

Two key columns: **every system predicts pixels or latent visual state** (Dreamer is
latent but still physical/task), and **the social-material column is empty across the
board.**

## 2. What each predicts, and the architecture split

**Pixel / video world models** (the bulk):
- *Autoregressive-token*: MineWorld interleaves discrete visual tokens (VQ-VAE, 16x
  compression) and action tokens, trained with next-token prediction; Genie likewise
  tokenizes video + infers **latent actions** from unlabeled video.
- *Diffusion / flow*: Matrix-Game, Solaris, DreamZero(robot) use video-diffusion
  backbones; Matrix-Game 2.0 and Solaris use autoregressive diffusion + distillation /
  Self Forcing for streaming, real-time generation.
- These are **learned simulators** `p(o'|o,a)` (predict the next frame). They do **not**
  select actions — to act, you wrap planning/search around their rollouts.

**Latent world-model agents** (the Dreamer line):
- DreamerV3 / Dreamer 4 learn a **latent dynamics model** (RSSM -> transformer) and
  train an **actor-critic in imagination**. Dreamer 4's inputs are "low-resolution
  images **and inventory states**" — i.e., structured state alongside pixels, not
  pixels alone. This is the closest existing thing to a capable Minecraft WAM, and it is
  latent + partly structured, not pixel-primary.

**State-aware video** (the explicit-state contrast):
- WildWorld keeps video output but adds **explicit per-frame world-state annotations**
  and a **State Alignment** metric, on the explicit argument that actions act through
  hidden state not visible in pixels.

## 3. Capability and efficiency facts (primary-source)

- **Real-time pixel generation is hard-won**: MineWorld 4–7 fps only with a custom
  parallel decoder (40k–160k tokens/16 frames otherwise); Matrix-Game 2.0 25 fps via
  few-step distillation; Genie 3 720p/24fps but "many GPUs to simulate a single scene"
  (per Dreamer 4); Oasis has well-known long-horizon drift.
- **Latent is cheaper and more capable for control**: DreamerV3 is first to get diamonds
  in Minecraft **from scratch without human data** (Nature 2025); Dreamer 4 is first to
  get diamonds **from offline data only**, 100x less data than VPT, **real-time on a
  single GPU**. Latent dynamics + structured inventory state, not pixel reconstruction,
  is what does the hard long-horizon work.

## 4. The closest-to-social system: Solaris, and exactly why it is not social

Solaris is the only **multiplayer** Minecraft world model, so it deserves precise
treatment. It simulates **consistent multi-view pixel observations** — what each of
several players *sees* — and evaluates Movement, Grounding, **Memory**, **Building**,
Consistency via FID + a VLM-as-judge answering verifiable visual questions.

What "multiplayer" means here is **visual co-presence and cross-view consistency**: if
two players look at the same region they should see the same thing; if a builder places
blocks the observer should pixel-see them. The data is **pre-programmed bots**
(mining/attacking/building), not humans engaged in social exchange.

What Solaris does **not** model (the gap):
- **possession** (who owns/holds an item), **material claim** (who controls a chest /
  station / place), **borrow/lend/return**, **obligation/credit**;
- **request / promise / refusal / acceptance / repair**, **trust / reputation /
  relationship expectation**;
- **memory of commitments** (its "Memory" is visual object persistence, not
  obligation memory); **post-goal continuation**.

So the most "social-looking" Minecraft world model is, on inspection, a multi-view
*visual* model with no social-material state. This is the sharpest single piece of
evidence for the project's open niche.

## 5. The gap (interpretation, evidence-grounded)

- **No surveyed Minecraft/game world model predicts social-material state.** They
  predict pixels (MineWorld, Oasis, Matrix-Game, Solaris, Genie, GameNGen) or latent
  physical state for task control (DreamerV3, Dreamer 4), or add geometric/combat state
  annotations (WildWorld). The economic/social layer — possession, claims, obligations,
  trust, public affordances, weak commons — is absent everywhere.
- **The structured-state argument is externally validated by WildWorld**: actions act
  through hidden state not in the pixels. Social actions are the paradigm case
  (`lend_item` changes possession + obligation, invisible in any frame).
- **Reusable Minecraft weights are visual.** Oasis, Matrix-Game, Solaris, MineWorld
  ship weights, but all output pixels. They could serve as a *visual sidecar* (e.g.,
  render a Minecraft scene for human review) but cannot be the project's structured
  social predictor or runtime authority (which the repo rules forbid anyway).

## 6. Mechanically useful vs research contribution

- **Mechanically useful**:
  - Solaris's **multiplayer bot data-collection engine** as a pattern for generating
    social-scenario fixtures (request/lend/return episodes); its **verifiable-question
    eval** idea (but prefer structured verifier evidence over VLM-judge for physical
    truth).
  - WildWorld's **State Alignment** metric as the template for "social-material
    transition prediction accuracy," and its per-frame structured-annotation data design
    for logging typed social-material state alongside actions.
  - Dreamer 4's **structured inventory state as model input** as a parallel for feeding
    typed Minecraft state to a social predictor; latent-WM efficiency as feasibility.
  - Public pixel weights (Oasis/Matrix-Game/Solaris/MineWorld) as optional visual
    sidecars only.
- **NOT the research contribution / overclaim to avoid**:
  - Do not build "another Minecraft video world model" — that frontier is crowded and
    pixel-centric, and the repo's runtime is Mineflayer, not pixel control.
  - Do not call Solaris (or any of these) social; none models social-material state.
  - Do not pivot to RL-in-imagination policies (Dreamer) as runtime authority — conflicts
    with "LLM proposes, runtime owns truth, WAM stays advisory."
  - The defensible contribution is **action-conditioned social-material transition
    modeling in Minecraft**, the empty cell in the table above.
