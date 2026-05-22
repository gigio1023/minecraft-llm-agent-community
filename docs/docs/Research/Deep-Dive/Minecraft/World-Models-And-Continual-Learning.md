# World Models and Continual Learning in Minecraft

Recent advancements in Minecraft AI have shifted away from standard RL and pure LLM wrappers towards **Interactive World Foundation Models**.

## The Rise of World Models

A World Model attempts to learn the underlying physics and dynamics of the environment, allowing the agent to "hallucinate" or simulate future trajectories without querying the actual game engine. 

### Key Papers and Architectures
1. **Dreamer 4 (2025):** 
   - **Mechanism:** Learns to solve control tasks by RL *inside* a fast world model. It achieves real-time interactive inference on a single GPU using a shortcut forcing objective and an efficient transformer architecture.
   - **Achievement:** The first agent to obtain diamonds purely from offline data (without environment interaction). It plans sequences of over 20,000 atomic actions in imagination.
2. **Matrix-Game (2025):**
   - **Mechanism:** A 17-billion parameter interactive world foundation model. Conditioned on reference images, motion context, and user actions (keyboard/mouse).
   - **Training:** Two-stage pipeline: (1) large-scale unlabeled pretraining for environment understanding, and (2) action-labeled training for interactive video generation.
3. **Solaris (2026):**
   - **Mechanism:** Expands world modeling into *multiplayer* multi-view consistency. Uses a bidirectional, causal, and Checkpointed Self-Forcing training pipeline to simulate interactions across multiple agents simultaneously.

## Continual Learning & Self-Evolving Agents

The "EvolvingAgent" paradigm bridges the static capabilities of foundation models with lifelong continuous adaptation. 
- **MINDSTORES (2025):** Replaces static skill libraries with an experience-augmented planning framework. It embeds tuples of `(state, task, plan, outcome)` into a persistent database. This allows the LLM planner to reason over past experiences to refine actions in novel states natively, without the catastrophic forgetting seen in Voyager.
- **Optimus-1 Hybrid Memory:** Transforms knowledge into a *Hierarchical Directed Knowledge Graph* and an *Abstracted Multimodal Experience Pool*, giving the agent rich references for in-context learning.

## Mathematical Formulation

In these modern World Models, the core dynamics are represented by a latent state-space formulation:

1. **Representation Model:** Encodes pixels $x_t$ into latent state $s_t$.
   $$ s_t \sim p(s_t | s_{t-1}, a_{t-1}, x_t) $$
2. **Transition Model (The Imagination):** Predicts future states based on actions.
   $$ \hat{s}_t \sim p(\hat{s}_t | s_{t-1}, a_{t-1}) $$
3. **Reward and Value Prediction:**
   $$ \hat{r}_t \sim p(r_t | s_t), \quad \hat{v}_t \sim p(v_t | s_t) $$

By simulating rollouts entirely in the latent space $\hat{s}$, the policy $\pi(a_t | s_t)$ is trained without the bottleneck of rendering the Minecraft environment.
