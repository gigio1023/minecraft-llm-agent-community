# Cognitive Science Frameworks for AI Agents

## Overview
This document synthesizes recent literature on the application of Cognitive Science frameworks to AI Agents, examining architectures like CoALA, JEPA, and multi-agent theatrical systems (e.g., HAMLET, Drama Manager). A critical focus is placed on the necessity of these frameworks in the era of modern, high-capacity language models.

## 1. Human Cognitive Templates and Engineering Boundaries
Cognitive science provides valuable blueprints for structuring AI agents. A recurring theme in recent literature is the translation of human cognitive models—such as **Tulving's trichotomy of memory** (Episodic, Semantic, Procedural)—into engineered code boundaries.

### The Missing Knowledge Layer
According to *"The Missing Knowledge Layer in Cognitive Architectures for AI Agents" (arXiv:2604.11364)*, prominent cognitive frameworks like **CoALA** and **JEPA** suffer from a category error: they lack an explicit "Knowledge" layer with distinct persistence semantics. They often apply episodic update mechanics (like Ebbinghaus decay) to factual claims.

The paper proposes a four-layer decomposition, mapping cognitive analogies to strict engineering persistence semantics:
- **Knowledge (Semantic Memory):** Indefinite supersession (facts replace facts).
- **Memory (Episodic Memory):** Ebbinghaus decay (experiences fade unless reinforced).
- **Wisdom:** Evidence-gated revision.
- **Intelligence:** Ephemeral inference.

This distinction highlights that while cognitive science provides the *analogy* (Tulving's trichotomy), the *implementation* must be driven by strict software engineering requirements for persistence.

## 2. Social Simulation, Drama Managers, and Dialogue-as-Simulation
Creating believable social agents involves architectures that manage narrative pacing and character autonomy.

### Drama Manager and HAMLET
The paper *"HAMLET: Hyperadaptive Agent-based Modeling for Live Embodied Theatrics" (arXiv:2507.15518)* introduces a framework where a **Drama Manager (Director/Planner)** coordinates overall narrative structure above the individual LLM agents. 
- **Dialogue-as-Simulation:** Agents are not explicitly programmed with rigid dialogue trees; rather, society and interaction are simulated through prompt engineering and state tracking.
- **Role Pressure & Motivation:** Actors make independent decisions based on their background, while a "Planner" and "Advancer" ensure the plot progresses, preventing "flag hacking" or stalling.

Similarly, *"Dialogue as Discovery" (arXiv:2510.27410)* shifts agents from passive instruction followers to Socratic collaborators that actively probe for information to resolve uncertainty, simulating a more natural human intent discovery process.

## 3. The Modern Context Window: Re-evaluating Cognitive Wrappers
**CRITICAL EVALUATION:** How does the massive reasoning power and context-window gap between older LLMs and current modern models affect the necessity of complex cognitive wrappers?

Early cognitive architectures for language agents (like the original CoALA implementations) were heavily constrained by small context windows (e.g., 4k-8k tokens) and weaker zero-shot reasoning. This necessitated complex engineering wrappers:
1. **Elaborate Memory Retrieval:** Vector databases and relevance-scoring algorithms were required to fetch the top-k episodic memories.
2. **Explicit State Machines:** Rigid dialogue trees or state machines compensated for the model's inability to maintain long-term coherence.

### The Paradigm Shift
With modern models supporting context windows of 1M+ tokens and possessing advanced instruction-following capabilities, the necessity of these complex cognitive wrappers has fundamentally shifted:

*   **Context as Memory:** Instead of complex episodic memory retrieval (RAG-based vector lookups), agents can now ingest full, uncompressed transcripts of past interactions. The model's internal attention mechanism often outperforms external retrieval heuristics, rendering engineered "Episodic Ebbinghaus Decay" less critical for short-to-medium lifespan agents.
*   **Reduced Wrapper Complexity:** Complex routing and multi-step cognitive wrappers can introduce unnecessary latency and brittleness. Modern reasoning power allows for "flatter" architectures where the LLM natively handles planning, reflection, and acting in a single pass.
*   **Where Cognitive Science Still Matters:** While episodic retrieval wrappers may be deprecated by large contexts, **Semantic Knowledge management** remains vital. The "Knowledge Layer" (as discussed in 2604.11364) must still be explicitly engineered outside the LLM. An LLM cannot persistently update its internal weights on the fly, so factual state, skill ownership, and environment invariants must be maintained in a durable, external representation (e.g., the Actor Workspace in our Minecraft runtime).

## Conclusion
Cognitive science provides excellent conceptual boundaries (e.g., Semantic vs. Episodic, Drama Manager pacing vs. Actor autonomy). However, engineered implementations must not blindly mimic human cognitive limitations (like arbitrary memory decay) when modern LLM context windows natively solve those problems. The focus should shift from building complex episodic retrieval wrappers to building robust, verifiable **Knowledge and Skill memory systems** that ground the agent in a durable reality.

## References
- *The Missing Knowledge Layer in Cognitive Architectures for AI Agents* (arXiv:2604.11364)
- *Cognitive Models and AI Algorithms Provide Templates for Designing Language Agents* (arXiv:2602.22523)
- *HAMLET: Hyperadaptive Agent-based Modeling for Live Embodied Theatrics* (arXiv:2507.15518)
- *Dialogue as Discovery: Navigating Human Intent Through Principled Inquiry* (arXiv:2510.27410)
