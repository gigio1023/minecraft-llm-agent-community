# The world-model lineage: RL, latent dynamics, and learning in imagination

Lane 7 theme file (wave 2, pedagogical). This is the genealogy a newcomer needs in order to
understand a 2026 "World Action Model" (WAM): the "predict the world to act" story, from its
modern origin (2018) through the latent-dynamics agents that mastered Minecraft. Every term is
defined on first use. Source-backed throughout; primary-source facts are separated from
interpretation. It EXTENDS, does not duplicate, the wave-1 application-first treatment in
`wam-foundations.md` (which already has the formal `p(o',a|o,l)` definition, the Cascaded-vs-Joint
split, and the pixel-vs-structured argument). For the Minecraft pixel-world-model survey see
`minecraft-world-models.md`; for the offline Dreamer successor see `2509.24527-dreamer4.md`.

Deep by-paper notes for every cornerstone below live in `notes/by-paper/`:
`1803.10122-world-models-ha-schmidhuber.md`, `1811.04551-planet-rssm.md`, `1912.01603-dreamer-v1.md`,
`2010.02193-dreamer-v2.md`, `2301.04104-dreamer-v3.md`, `1911.08265-muzero.md`,
`2310.16828-td-mpc2.md`.

---

## 0. The vocabulary, defined once (read this first)

- **Reinforcement learning (RL)**: an agent learns to act by trial and error to maximize a reward
  signal over time. The agent observes a state, takes an action, gets a reward and a next state.
- **Model-free RL**: learn a policy (what to do) or a value (how good a state is) directly from
  experience, with no explicit model of how the world changes.
- **Model-based RL**: also learn a **model of the environment** (how states and rewards change when
  you act), and use it to plan or to imagine experience. The classic textbook ancestor is Sutton's
  **Dyna** (1991): interleave real experience with planning against a learned model. The promise:
  better **sample efficiency** (fewer real interactions to reach good behavior) because the model
  lets you reuse and extrapolate from experience.
- **World model**: a learned model of the environment's dynamics. Formally a transition model
  `p(o' | o, a)`: given the current observation `o` and an action `a`, predict the next observation
  `o'`. (This is the "WM" of the WAM survey; see `wam-foundations.md`.)
- **Latent / latent state**: a compact internal representation of the world, not the raw pixels.
  "Latent dynamics" means predicting forward in this compact space instead of in observation space.
- **Encoder**: a network that maps a raw observation (e.g., an image) into a latent.
- **Imagination / rollout / dreaming**: using the world model to predict a sequence of future
  states (and rewards, and the policy's actions) without touching the real environment. Training a
  policy on these predicted trajectories is "learning in imagination."
- **Policy**: the agent's action-choosing function. **Value function**: the expected long-run
  return from a state. **Actor-critic**: an architecture with an actor (the policy) and a critic
  (the value), which improve each other.
- **Planning**: searching over imagined action sequences to pick a good one, often by
  **model-predictive control (MPC)**: plan a short sequence, execute the first action, replan.
- **Compounding error (a.k.a. accumulating multi-step error)**: a one-step prediction has a small
  error; chaining many steps lets errors accumulate, so long imagined rollouts drift away from
  reality. The closely related **model exploitation** failure is when a policy, optimized against an
  imperfect model, finds actions that look great *in the model* but fail in reality, usually by
  visiting states the model got wrong because they are off the training distribution. This whole
  failure family is defined here and handed to Lane 10 for the deep treatment.
- **Reconstruction**: decoding the latent back into the observation (pixels). A model can be trained
  to reconstruct ("explicit"/decoder-based) or to predict only abstract quantities and never
  reconstruct ("implicit"/decoder-free).
- **Value equivalence**: a model is value-equivalent if planning in it yields the same returns as
  planning in reality, even if its internal states look nothing like real states. Such a model only
  needs to predict what matters for acting (reward, value, policy), not the full observation.

## 1. The problem a world model solves for a decision-making agent

A decision-making agent needs two things: a good representation of where it is, and a way to predict
what its actions will do. Model-free RL learns to act purely by trial and error; it is general but
data-hungry, because every bit of competence has to be squeezed out of real interactions. A world
model offers a shortcut: if the agent can predict the consequences of actions, it can plan, or it can
generate cheap imagined experience to learn from, instead of paying for every lesson in the real
environment.

The payoff is **sample efficiency**, and it is real: PlaNet reported solving visual control tasks with
roughly 200x less environment interaction than the model-free A3C baseline (PlaNet, 1811.04551). But
the payoff has a catch, stated in this lineage from the very beginning: the policy is only as good as
the model, and an imperfect model can be exploited (Ha and Schmidhuber, 1803.10122) and accumulates
multi-step error (PlaNet's intro names "accumulating errors of multi-step predictions" and
"overconfident predictions outside of the training distribution"). So model-based RL beats model-free
on sample efficiency *when the model is good enough for the use*, and the whole genealogy below is, in
large part, the story of making the model good enough and the use safe.

## 2. The architectural arc (the spine of the story)

The lineage refines one skeleton: encoder -> latent dynamics -> policy/planner. Each milestone changes
one part and fixes the previous step's limitation.

1. **VAE + RNN controller (Ha and Schmidhuber, 2018, World Models, 1803.10122)**. Split the agent into
   V (a Variational Autoencoder that compresses each frame into a latent), M (a recurrent network with
   a mixture-density output, MDN-RNN, that predicts the next latent given the action), and C (a tiny
   linear controller). Train V and M by self-supervised prediction, then optimize the tiny C with a
   gradient-free evolutionary optimizer (CMA-ES). The famous demonstration: train C **entirely inside
   M's hallucinated dream** and transfer it back to the real VizDoom game.
   - What it introduced: the modern "encoder + latent dynamics + controller" decomposition, and a
     working recipe for learning a policy inside a learned model.
   - Why it mattered: it put the agent's capacity in a cheap self-supervised world model and kept the
     decision-maker tiny, dodging the RL credit-assignment problem.
   - It also stated the **model-exploitation** failure first: the controller learned to make dream
     monsters never fire (an exploit absent in the real game), and the mitigation was to inject
     stochasticity via a "temperature" knob so the model is less exploitable. (Note:
     `1803.10122-world-models-ha-schmidhuber.md`.)

2. **Recurrent State-Space Model (PlaNet, Hafner et al., 2018, 1811.04551)**. Make the latent dynamics
   model good enough to plan against from pixels. The key architecture, the **RSSM**, splits the latent
   state into a **deterministic** path `h_t = f(h_{t-1}, s_{t-1}, a_{t-1})` (an RNN that reliably carries
   information) and a **stochastic** path `s_t ~ p(s_t | h_t)` (which represents uncertainty and multiple
   futures). PlaNet plans by **cross-entropy-method (CEM)** MPC purely in latent space (no pixels decoded
   during planning; the decoder is just a training signal).
   - What it fixed from Ha and Schmidhuber: a single, jointly usable latent dynamics model strong enough
     to *plan* hard continuous control from pixels, with both deterministic memory and stochastic
     uncertainty (the paper shows both paths are necessary).
   - Why it mattered: ~200x less environment interaction than model-free A3C. RSSM became the backbone
     every later Dreamer reuses. (Note: `1811.04551-planet-rssm.md`.)

3. **Actor-critic in imagination (Dreamer v1, Hafner et al., 2019, "Dream to Control", 1912.01603)**.
   Replace PlaNet's expensive, shortsighted online search with a learned policy. Dreamer keeps PlaNet's
   RSSM but trains an **actor and a critic inside imagined latent rollouts**, and crucially
   **backpropagates analytic value gradients straight through the imagined dynamics** to update the
   actor. A **lambda-return** value estimate lets it value rewards beyond the imagination horizon.
   - What it fixed from PlaNet: CEM replanning every step was slow and only looked a fixed horizon ahead
     (shortsighted). A learned actor is fast and reactive; the critic/lambda-return handles the long
     horizon.
   - Why it mattered: beat prior model-based and model-free agents on 20 visual control tasks in
     data-efficiency, compute, and final performance. "Learn the policy inside the dream by gradients"
     became the dominant pattern. (Note: `1912.01603-dreamer-v1.md`.)

4. **Discrete latents (DreamerV2, Hafner et al., 2020, "Mastering Atari with Discrete World Models",
   2010.02193)**. Change the stochastic latent from continuous (Gaussian) to a vector of **categorical
   (discrete) variables**, trained with **straight-through gradients** (a trick to backpropagate through a
   discrete sample), plus **KL balancing** for stable training.
   - What it fixed from Dreamer v1: the Gaussian latent was the limiter on the discrete, multi-modal Atari
     domain. Categorical latents fit it better.
   - Why it mattered: **first RL agent to reach human-level Atari purely by learning behaviors inside a
     separately learned world model**, on a single GPU. Proof the latent model was accurate enough to learn
     in. (Note: `2010.02193-dreamer-v2.md`.)

5. **Robustness and Minecraft (DreamerV3, Hafner et al., 2023, "Mastering Diverse Domains through World
   Models", 2301.04104; Minecraft result in Nature 2025)**. Same RSSM + categorical latents + actor-critic,
   but engineered to work with **one fixed hyperparameter set across 150+ tasks**, via normalization and
   balancing tricks (**symlog** to handle very different reward magnitudes, **free bits** to avoid
   degenerate dynamics, return normalization, KL balancing).
   - What it fixed from DreamerV2: per-domain tuning. DreamerV3 is plug-and-play across domains.
   - Why it mattered: **first algorithm to collect diamonds in Minecraft from scratch with no human data
     and no curriculum**, a recognized grand challenge (sparse reward, hard exploration, long horizon,
     procedural variety). Crucially, it uses **structured inventory state alongside pixels** and a latent
     (not pixel-reconstruction-primary) representation: the central evidence that "latent + structured
     state" is the feasible Minecraft path. (Note: `2301.04104-dreamer-v3.md`. Offline successor Dreamer 4,
     2509.24527, extends to offline-only data; see its existing note, do not re-derive.)

This branch (World Models -> PlaNet -> Dreamer v1 -> V2 -> V3 -> Dreamer 4) is the **reconstruction-based
latent-dynamics** line: it decodes observations at least as a training signal, and learns the policy in
imagination.

## 3. The other branch: value equivalence (predict only what matters for acting)

Running in parallel, a second branch asked a sharper question: to plan well, do you need to predict the
observation at all?

- **MuZero (Schrittwieser et al., 2019, "Mastering Atari, Go, Chess and Shogi by Planning with a Learned
  Model", 1911.08265; Nature 2020)**. Learn a model that predicts only the **reward, value, and policy**,
  never reconstructs the observation, and whose hidden state has "no semantics of environment state
  attached to it." Plan with **Monte-Carlo Tree Search (MCTS)** over this learned model. This is
  **value equivalence**: the model is judged only by whether planning in it produces correct returns.
  - What it introduced: the value-equivalence principle (building on the Predictron, Value Prediction
    Networks), made to work with MCTS at scale.
  - Why it mattered: matched AlphaZero on Go, chess, and shogi **without being told the rules**, and set a
    new state of the art on Atari. Proof you can plan superhumanly with a model that never reconstructs
    what it sees. (Note: `1911.08265-muzero.md`.)
- **TD-MPC2 (Hansen, Su, Wang, 2023, 2310.16828; ICLR 2024)**. The scalable, open realization of value
  equivalence for continuous control: an **implicit, decoder-free** latent model trained by
  joint-embedding latent prediction + reward prediction + TD value learning (no reconstruction), planned by
  sampling-based MPC (MPPI) with a learned policy prior. One hyperparameter set across 104 tasks; a single
  317M-param model spanning 80 tasks and multiple robot embodiments; 300+ public checkpoints.
  - What it fixed from MuZero: MuZero was high-compute and not publicly implemented; TD-MPC2 is scalable,
    robust to naive scaling, and open. It even imports DreamerV3's log-space prediction trick, so the two
    branches cross-pollinate.
  - Why it mattered: cleanest large-scale evidence that "predict outcomes, not observations" works
    robustly at scale. (Note: `2310.16828-td-mpc2.md`.)

So the genealogy is **two converging branches**, not one line: reconstruction-based latent imagination
(Dreamer family) and value-equivalent/decoder-free planning (MuZero, TD-MPC2). DreamerV2 and MuZero reached
Atari competence around the same time from opposite design philosophies.

## 4. A useful contrast at the edge: sequence-modeling "RL" with no forward model

- **Decision Transformer (Chen et al., 2021, 2106.01345)**. Casts RL as **return-conditioned sequence
  modeling**: a causally-masked Transformer is conditioned on a desired return plus past states and actions,
  and simply outputs the next action. It fits no value function, computes no policy gradients, and learns
  **no explicit forward model** `p(o'|o,a)`, yet it "models" trajectories well enough to match offline-RL
  baselines.
  - Why it is here (interpretation): it shows that "modeling" experience and "predicting the next
    observation" are different things. Decision Transformer is the clarifying counter-example to the
    intuition "to act well you must forecast the world." A WAM's defining commitment (per the survey,
    `wam-foundations.md`) is an explicit predictive commitment to `o'`; Decision Transformer deliberately
    has none, which is exactly what makes it a clean boundary case for a newcomer.

## 5. Why latent (not pixel) world modeling is what actually did hard Minecraft control

Primary-source fact: the agents that did hard, long-horizon, open-world Minecraft control are
**latent / structured-state** agents, not pixel-primary generators. DreamerV3 collected Minecraft diamonds
from scratch (Nature 2025) using a latent RSSM with **structured inventory state** as input; Dreamer 4
(2509.24527) extended this to offline-only data with real-time single-GPU inference, again using
"low-resolution images and inventory states." By contrast, the pixel/video Minecraft world models
(MineWorld, Oasis, Matrix-Game, Solaris; see `minecraft-world-models.md`) are impressive generators but are
not the systems that achieve hard control, and per Dreamer 4 the Genie-3-style video models "struggle to
learn precise physics of object interactions and game mechanics" and often need many GPUs to simulate one
scene.

Interpretation (evidence-grounded, flagged as such): predicting pixels is an expensive and partly
unnecessary objective for control. This branch's whole arc, from PlaNet planning in latent space (decoder is
only a training signal), to MuZero and TD-MPC2 dropping reconstruction entirely, to DreamerV3/Dreamer 4
mixing latents with structured inventory state, is repeated evidence that for control the useful thing to
predict is a compact state and its consequences, not rendered frames. This is the same conclusion the
wave-1 `wam-foundations.md` reaches from the survey side (sections 3, 6, 7); the lineage supplies the
historical and architectural backing.

## 6. Timeline (the genealogy at a glance)

The "What it predicts" and "Representation" columns are the two axes that matter for a newcomer:
what quantity the model forecasts, and whether it lives in pixels, latents, or only value-relevant
quantities.

| Year | System (arXiv) | Branch | Key idea introduced | What it predicts | Representation | What it fixed from the prior step |
|---|---|---|---|---|---|---|
| 1991 | Dyna (Sutton; textbook) | model-based RL root | interleave real experience with planning against a learned model | next state + reward (tabular/simple) | symbolic/tabular | establishes model-based RL as a sample-efficiency idea |
| 2018 | World Models (1803.10122) | reconstruction/latent | VAE encoder + MDN-RNN dynamics + tiny controller; train controller inside the "dream" | next latent (reconstructs pixels) | latent (pixel-reconstructive) + RNN | first modern working "learn a model, act inside it"; names model exploitation |
| 2018 | PlaNet (1811.04551) | reconstruction/latent | RSSM (deterministic + stochastic latent); plan by CEM in latent space | next latent + reward (decode = training signal only) | latent (RSSM) | a latent model strong enough to plan hard control from pixels; ~200x data efficiency vs A3C |
| 2019 | Dreamer v1 (1912.01603) | reconstruction/latent | actor-critic learned by backprop through imagined latent rollouts; lambda-return | next latent + reward + value | latent (RSSM) | replaced slow, shortsighted online CEM with a fast learned policy |
| 2019 | MuZero (1911.08265) | value-equivalent | predict only reward/value/policy, no reconstruction; plan with MCTS | reward + value + policy (no observation) | abstract value-equivalent state | proved you can plan superhumanly without reconstructing the world; rules-free |
| 2020 | DreamerV2 (2010.02193) | reconstruction/latent | discrete (categorical) latents + straight-through gradients + KL balancing | next latent + reward + value + discount | latent (categorical RSSM) | Gaussian latent limited discrete domains; first human-level Atari purely in a world model |
| 2023 | DreamerV3 (2301.04104) | reconstruction/latent | one fixed config across 150+ tasks via symlog/free-bits/balancing | next latent + reward + value + continue | latent (categorical RSSM) + structured inventory | removed per-domain tuning; first Minecraft diamonds from scratch (Nature 2025) |
| 2023 | TD-MPC2 (2310.16828) | value-equivalent | scalable decoder-free latent model (JEPA + reward + TD); MPPI planning; one config across 104 tasks | future latent + reward + return (no observation) | implicit/decoder-free latent | made value equivalence scalable, robust to scaling, and open (300+ checkpoints) |
| 2021 | Decision Transformer (2106.01345) | contrast (no forward model) | RL as return-conditioned sequence modeling | next action (no explicit `o'` forecast) | token sequence | clarifies that "modeling trajectories" is not the same as forecasting the world |
| 2025 | Dreamer 4 (2509.24527) | reconstruction/latent | RL in imagination inside a scalable tokenizer/transformer world model; offline-only | next latent (tokenized) + reward + value | latent (transformer) + structured inventory | offline Minecraft diamonds, 100x less data than VPT; real-time single GPU (see existing note) |

## 7. How this feeds into WAM (closing)

A World Action Model (WAM), per the survey (arXiv 2605.12090, deep-read in `wam-foundations.md`), jointly
models the future state and the action, `p(o', a | o, l)`, with two commitments: forward predictive
modeling (forecast `o'`, explicitly as pixels OR implicitly as physics-grounded latents) and coupled action
generation (actions aligned to the anticipated `o'`). The survey explicitly treats the **Dreamer-line
agents as model-based-RL neighbors of WAM**: a Dreamer learns a world model `p(o'|o,a)` and trains a policy
*inside* it by RL, rather than producing a per-step joint `p(o', a)`. So this lineage is not "the same as"
WAM; it is the family WAM grew out of and is benchmarked against.

The lineage hands the WAM idea three things a newcomer should carry forward:

1. **The implicit / latent branch is legitimate and powerful.** WAM's definition is explicitly
   modality-independent: future state can be predicted "implicitly as physics-grounded latents," not only as
   pixels. The entire latent-dynamics line (RSSM, Dreamer, and especially the decoder-free MuZero/TD-MPC2) is
   the existence proof that predicting a compact state, or only the value-relevant consequences, is enough to
   act well. This is exactly the branch a structured-state Minecraft WAM would sit in (the social-material
   argument is wave 1's; `wam-foundations.md` section 7).
2. **Value equivalence is the discipline against bloat.** MuZero and TD-MPC2 say: predict only what matters
   for the decision, not a full reconstruction of the world. For any advisory predictor, that argues for a
   lean, outcome-focused model (predict the consequences and their costs), not a heavy generative simulator.
3. **The failure mode is older than the field's name for it.** Model exploitation and compounding error were
   named in 2018 (World Models) and 2018 (PlaNet's intro). A policy optimized against an imperfect model
   drifts into states the model got wrong. Mitigations along the lineage include injecting stochasticity
   (temperature), keeping both deterministic and stochastic latent paths (RSSM), and bootstrapping with a
   learned value beyond a short horizon. Lane 10 owns the deep treatment; the lineage establishes that any
   system that acts on imagined futures must treat the model's confidence as suspect, which is precisely why
   a WAM in a runtime that "owns physical truth" should stay advisory (predict and evaluate, never fill args,
   mark progress, or override verifiers).

Mechanically useful vs research contribution (summary for this lineage): the **mechanically useful** borrows
are the architectural shapes (encoder + latent dynamics + advisory predictor), the value-equivalence
discipline (predict consequences, not pixels), and the stabilization tricks (symlog/return normalization,
KL balancing, SimNorm). The **research contributions** of this lineage, training a policy by RL inside the
dream and planning with MCTS/MPPI over a learned model, are out of scope for this repo's advisory-WAM rule
and should be cited as contrast, not adopted as runtime authority.
