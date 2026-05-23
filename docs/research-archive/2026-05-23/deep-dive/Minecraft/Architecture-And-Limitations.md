# Architecture, Code-Loops, and Explicit Limitations

This document extracts specific architectural loops and explicitly stated limitations of both state-of-the-art RL/MLLM agents and interactive World Models in Minecraft.

## 1. Agent Code-Loops

### The Optimus-2 & 3 Action Loop
The Optimus framework utilizes a multi-level control loop:
* **High-Level MLLM Loop (e.g., 1Hz):** Takes in the user instruction $I$, a sequence of video frames, and history. It outputs a "behavior token" $\mathbf{b}_t$, which represents a coarse sub-goal or trajectory intent.
* **Low-Level GOAP Encoder Loop (e.g., 20Hz):** The Goal-Observation-Action Conditioned Policy takes the behavior token $\mathbf{b}_t$ and the immediate visual observation to predict atomic mouse and keyboard actions $a_t \sim \pi(a_t | o_t, \mathbf{b}_t)$.
* **Optimus-3 MoE Routing:** At the high level, a Mixture-of-Experts (MoE) router dynamically allocates network parameters based on the task type (e.g., combat, crafting, navigation) to prevent catastrophic interference between completely heterogeneous tasks.

### The DIP-RL / RL-GPT Loop
* **Slow Agent (Planner):** Analyzes states to determine if coding or RL is needed.
* **Fast Agent (RL/Executor):** For spatial tasks, standard RL policies take over. In DIP-RL, a reward model is trained concurrently using human preferences inferred from demonstrations.

## 2. Mathematical Formulations of Action Models

In **Numeric Safe Action Model Learning (NSAM)** and continuous RL architectures:
The policy gradient is often formulated with intrinsic rewards derived from LLM hints (as seen in *DLLM*):
$$ \nabla_\theta J(\theta) = \mathbb{E}_{\pi_\theta} \left[ \nabla_\theta \log \pi_\theta (a_t | s_t) (R_{ext} + \beta R_{int}) \right] $$
Where $R_{int}$ is elevated when the agent aligns with the semantic trajectory hypothesized by the LLM planner.

## 3. Explicit Limitations Extracted from Literature

Despite moving beyond text scaffolding, modern models still face significant hurdles:

1. **Long-Term Temporal Consistency (Matrix-Game):**
   * *Explicit Limitation:* World Models struggle to maintain coherence over extended video sequences. If a user turns 360 degrees, the world model often fails to regenerate the exact identical scene behind them, leading to shifting topography. Memory mechanisms (like Checkpointed Self Forcing in Solaris) mitigate, but do not solve, this.

2. **Low-Level Grounding Weaknesses (Optimus-1):**
   * *Explicit Limitation:* The low-level controller (e.g., STEVE-1) fails to generalize across highly complex tool manipulations. It executes well on "move to tree," but struggles with precise sequential crafting block placement unless strictly guided by pure RL fine-tuning.

3. **Hallucination Risks in MLLMs (Optimus-3):**
   * *Explicit Limitation:* The reliance on general-purpose MLLMs brings the risk of hallucinations. The agent might "perceive" a hostile mob that isn't there or misinterpret a complex recipe, breaking the GOAP loop.

4. **Multiplayer and Non-Stationary Dynamics (Solaris):**
   * *Explicit Limitation:* While Solaris introduces multi-agent modeling, the action spaces grow exponentially. Scaling the dataset accurately capturing synchronized multi-view behavior requires massive orchestration, limiting the amount of multi-agent offline data available compared to single-agent runs.
