# Minecraft as an AI Environment: A Deep Literature Review

Minecraft has rapidly emerged as a premier testing ground for embodied AI agents, offering an open-world environment with complex tech trees, sparse rewards, and near-infinite procedural generation. Over the past few years, the approach to solving Minecraft with AI has shifted dramatically from rigid Reinforcement Learning (RL) baselines to LLM-orchestrated planners, and increasingly toward unified Multimodal Large Language Models (MLLMs) and advanced World Models.

This review synthesizes key papers that define this trajectory, with a critical focus on how the massive performance, reasoning, and context-window gap between older LLMs (e.g., GPT-3.5) and current modern models has shaped agent architectures.

---

## 1. The Early LLM Era: Prompting and Scaffolding (2023)

In early 2023, purely RL-based approaches like VPT (Video PreTraining) and DreamerV3 struggled with long-horizon tasks due to the sheer size of the Minecraft action space and the inability to generalize without hard-coded rewards. To bridge this gap, researchers introduced LLMs as high-level planners.

### [Voyager: An Open-Ended Embodied Agent with Large Language Models (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291)
Voyager was the first major LLM-powered embodied agent in Minecraft. It bypasses parameter fine-tuning by interacting with GPT-4 via black-box queries. 
- **Key Mechanics**: It uses an automatic curriculum, a code-based skill library, and an iterative prompting mechanism. Voyager writes executable Javascript code (using the Mineflayer API) to interact with the world, storing successful scripts in a vector database for later retrieval.
- **Architectural Context**: Because GPT-4 could not easily process high-frequency pixel streams or maintain a boundless context window, Voyager delegated low-level execution entirely to generated code. It relied on extensive textual feedback (e.g., inventory dumps, error traces) to self-correct.

### [Ghost in the Minecraft (GITM) (arXiv:2305.17144)](https://arxiv.org/abs/2305.17144)
GITM similarly tackles the "ObtainDiamond" challenge by combining LLMs with text-based knowledge and memory.
- **Key Mechanics**: It uses hand-written scripts for low-level structured actions and relies on an LLM to decompose tasks into sub-goals. Crucially, GITM implements a "text-based memory" where the LLM explicitly summarizes successful execution paths to be retrieved as reference plans for future tasks.
- **Architectural Context**: GITM explicitly compensates for the LLM's limited reasoning by enforcing strict task decomposition and utilizing summarization loops to save context space. 

---

## 2. Transition to Fine-Tuned and Open-World Capable Agents (2024)

As open-source LLMs became more capable, architectures moved away from expensive, generalized black-box API calls toward specialized, fine-tuned models designed specifically for Minecraft's diverse gameplay.

### [Odyssey: Empowering Agents with Open-World Skills (arXiv:2407.15325)](https://arxiv.org/abs/2407.15325)
Odyssey addresses the limitation of earlier frameworks that treated "ObtainDiamond" as the ultimate goal, focusing instead on diverse, open-world exploration.
- **Key Mechanics**: It features a vast open-world skill library (40 primitive and 183 compositional skills) and introduces **MineMA**, a fine-tuned LLaMA-3 model trained on over 390k Minecraft instruction entries.
- **Architectural Context**: Odyssey proves that an open-source model (LLaMA-3), when efficiently fine-tuned using LoRA on domain-specific data, can handle complex dynamic-immediate planning and autonomous exploration without the exorbitant inference costs and prompt-engineering bloat associated with early GPT-4 frameworks.

---

## 3. The Modern Era: Multimodal Generalists and Continual World Models (2025-2026)

Current state-of-the-art models bypass the rigid text-based interfaces and code-generation bottlenecks by processing visual inputs natively, maintaining long horizons, and leveraging sophisticated world models.

### [Optimus-3: Towards Generalist Multimodal Minecraft Agents (arXiv:2506.10357)](https://arxiv.org/abs/2506.10357)
Optimus-3 is a generalist agent designed to handle perception, planning, and action directly in the open world using Multimodal Large Language Models (MLLMs).
- **Key Mechanics**: It introduces a Mixture-of-Experts (MoE) architecture with task-level routing to prevent interference among heterogeneous tasks. It also employs Multimodal Reasoning-Augmented RL to enhance reasoning over visual diversity.
- **Architectural Context**: Optimus-3 eliminates the need for intermediate text translation (like inventory dumps) or rigid Mineflayer scripts. It natively understands raw pixels and outputs actions, relying on the immense multimodal reasoning power of modern models.

### [Dreamer 4: Training Agents Inside of Scalable World Models (arXiv:2509.24527)](https://arxiv.org/abs/2509.24527)
While not strictly an LLM agent, Dreamer 4 represents the zenith of World Models in Minecraft.
- **Key Mechanics**: It learns to solve control tasks entirely via RL inside of a fast, highly accurate world model. It successfully obtained diamonds from purely offline data, without ever interacting with the live environment during training.
- **Architectural Context**: The capacity of Dreamer 4's world model is vast enough to simulate game mechanics perfectly. It hints at a future where LLM agents might plan inside simulated internal world models before executing actions in the real game engine.

### [EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model (arXiv:2502.05907)](https://arxiv.org/abs/2502.05907)
EvolvingAgent tackles catastrophic forgetting and the inability of older models to update their knowledge bases autonomously.
- **Key Mechanics**: It uses an LLM-driven task planner coupled with a Continual World Model (WM) for low-level action generation. A curriculum-learning reflector selects multimodal experiences to autonomously update the world model.
- **Architectural Context**: Rather than relying on static vector databases for memory (like Voyager or GITM), EvolvingAgent organically updates its multimodal understanding of the world, creating a closed-loop system of self-planning, control, and reflection.

---

## 4. Critical Analysis: The Performance and Context-Window Gap

Evaluating the progression of these papers reveals a stark contrast between how architectures were designed in 2023 versus today. The evolution is defined by a shift from **over-engineered scaffolding** to **native, multimodal reasoning**.

### The Scaffolding of the Past (GPT-3.5 Era)
Older architectures like **Voyager** and **GITM** were deeply constrained by high latency, small context windows, and weak spatial reasoning. 
1. **Delegation to Code**: Because LLMs could not directly output control sequences reliably, Voyager was forced to write JavaScript functions for Mineflayer to execute. 
2. **Textual Bottlenecks**: GITM had to translate the entire 3D world into textual feedback. 
3. **External Memory Crutches**: Both models relied heavily on rigid vector databases or strict text-summarization pipelines to avoid exceeding context limits. They were over-engineered to compensate for the LLM's inability to retain long-term memory or intuitively understand the game state.

### Bypassing Limits with Modern Models
Current models (like those powering **Optimus-3** and **EvolvingAgent**) operate under vastly different constraints:
1. **Massive Context Windows**: Modern models can ingest hundreds of thousands of tokens. They no longer require complex summarization loops (like GITM's text-based memory) because they can keep the entire episode history, including past code executions and visual frames, in context.
2. **Native Multimodality**: Models no longer need the environment state translated into strict text JSON. They can look directly at the screen (Optimus-3), understand spatial relationships, and make dynamic, immediate decisions, bypassing the brittle nature of rigid scripted skills.
3. **End-to-End Reasoning**: With enhanced reasoning capabilities, modern models can predict the outcome of their actions internally (or through Continual World Models like EvolvingAgent/Dreamer 4) without needing explicit self-correction loops after every minor failure.

### Conclusion
The trajectory of Minecraft AI research proves that as foundational models improve in context size, reasoning, and multimodality, the need for complex, brittle agent frameworks diminishes. While early systems were monumental proofs-of-concept, modern agents achieve far greater generalization by interacting with the environment natively, pointing toward a future of true, open-world autonomy.
