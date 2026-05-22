# Dialogue as Simulation and Cognitive Boundaries

The application of Large Language Models (LLMs) to multi-turn dialogue simulation represents a shift from simple chatbot interactions to the emulation of complex, stable personas within a synthetic society. "Dialogue as simulation" treats the conversation not just as text generation, but as the observable output of an underlying cognitive state.

## The Challenge of Multi-Turn Agent Simulation

When LLMs simulate dialogue over long horizons, particularly in LLM-to-LLM interactions, they are prone to severe identity-related failures:
1.  **Persona Drift:** The agent gradually forgets or shifts its assigned demographics, emotional state, or goals.
2.  **Role Confusion:** The agent loses track of who it is versus who it is speaking to.
3.  **Echoing:** A phenomenon where one agent gradually mirrors its conversational partner, adopting their tone, objectives, or perspective.

These failures occur because standard LLM architectures process conversation history as a flat, concatenated transcript. The model's attention mechanisms can easily blend the prompt's persona instructions with the partner's generated text, blurring the cognitive boundaries between agents.

## Cognitive Boundary Engineering: Egocentric Context Projection

To solve these identity failures without altering model weights, we must engineer strict cognitive boundaries at the system level. A primary solution is **Egocentric Context Projection (ECP)** (as introduced in the SPASM framework).

### Perspective-Agnostic Storage
Instead of storing dialogue history as a raw textual transcript (e.g., "Alice: Hi \n Bob: Hello"), the system stores the history in a structured, perspective-agnostic representation. The conversation is an objective log of events and utterances.

### Deterministic Egocentric Projection
Before passing the context to an agent for generation, the history is deterministically projected into the agent's *egocentric view*. This means the prompt is dynamically constructed to frame the history entirely from the perspective of the acting agent. 

By strictly segregating the agent's internal persona schema (demographics, emotional state, domain context, behavioral traits) from the egocentrically filtered history, the system enforces a cognitive boundary. The LLM is forced to process the interaction strictly as "Self" responding to "Other," effectively eliminating echoing and significantly reducing persona drift.

## Given-Circumstance Acting Methodology

Beyond structural boundaries, high-fidelity dialogue simulation requires deep persona grounding. Frameworks like **CoSER** (Coordinating LLM-Based Persona Simulation of Established Roles) draw heavily from theatrical acting methodology—specifically, *given-circumstance acting*.

In this paradigm, agents are not merely prompted with a static personality description. They are initialized with:
*   **Conversation Setups:** The immediate physical and social context of the scene.
*   **Character Experiences:** Historical events that shape the character's current worldview.
*   **Internal Thoughts:** The hidden, unspoken motivations running parallel to the dialogue.

By decoupling the *internal thought process* from the *expressed dialogue*, the simulation allows agents to exhibit nuanced behaviors like subtext, deception, or politeness masking. 

## Conclusion
Treating dialogue as simulation requires robust cognitive boundary engineering. Simple prompt concatenation is insufficient for stable, long-horizon multi-agent interaction. By implementing Egocentric Context Projection and adopting given-circumstance acting frameworks, we can build stable, persona-driven agents that maintain their distinct identities, opening the door for complex social simulation without destructive persona drift.
