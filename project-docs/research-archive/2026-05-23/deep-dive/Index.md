# Exhaustive Deep-Dive Literature Review

This directory houses the V2 exhaustive literature review. Unlike standard summaries, the sub-directories here contain granular, algorithmic, and architectural deep-dives into modern AI agent paradigms, rigorously evaluated against the performance context of modern LLMs.

## 🗂️ Domains

### 1. [Minecraft Agent Architectures](./Minecraft/)
*Focus: Code-generation loops, World Models, Prompting Strategies.*
Deep dives into Voyager, GITM, Odyssey, Optimus-3, and EvolvingAgent. Explores the shift from rigid text scaffolding to multimodal continuous world models.

### 2. [Memory System Mechanics](./Memory/)
*Focus: Retrieval algorithms, Persistence Semantics, Causality Graphs.*
Extracts exact algorithmic logic from xMemory, AMA-Bench, and Hindsight. Analyzes how infinite context windows shift the burden from "compression" to "epistemic clarity."

### 3. [Cognitive Science Implementations](./Cognitive-Science/)
*Focus: Drama Managers, Dialogue as Simulation, State Machines.*
Breaks down Tulving's trichotomy into engineering bounds. Investigates narrative pacing in HAMLET and the deprecated nature of rigid dialogue trees.

---

## 🛠️ [Engineering Directives](./Engineering-Directives.md)
The ultimate output of this research: strict, actionable code directives for modifying our headless Minecraft runtime to leverage these frontier paradigms.
