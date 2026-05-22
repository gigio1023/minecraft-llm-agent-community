# History and Scaffolding in Minecraft Agents

The evolution of Minecraft LLM agents represents a shift from brittle text-based scaffolding to native multi-modal architectures. This document analyzes the contrast between early frameworks and modern methodologies.

## Early Frameworks: The Over-Engineered Text Scaffolding Era

Early breakthroughs in Minecraft autonomy, most notably **Voyager** (Wang et al., 2023), **GITM** (Ghost in the Minecraft), and **Plan4MC**, heavily relied on mapping the high-dimensional 3D Minecraft environment into 1D text representations. 

### Characteristics of Early Architectures
1. **Text-as-Observation:** The 3D world was flattened into JSON or text strings. For example, Voyager extracted the agent's inventory, nearby entities, and blocks, feeding them as a massive string prompt into GPT-3.5 or GPT-4.
2. **Code-Generation Loops:** Rather than predicting atomic actions (e.g., mouse delta or keypresses), these agents generated JavaScript macros using the Mineflayer API. 
3. **Iterative Self-Correction:** When a macro failed, the error logs were passed back to the LLM to rewrite the code.

### The "Over-Engineering" Problem
While impressive for obtaining specific items, this text scaffolding was inherently over-engineered and fundamentally limited:
- **Spatial Blindness:** Text cannot capture complex spatial heuristics like terrain topology or trajectory paths. 
- **Latency & Cost:** The read-eval-print-loop (REPL) involved querying large context windows with massive prompt prefixes for every macro, making real-time control impossible.
- **Skill Library Bloat:** Voyager saved successful scripts into a vector database. Over time, the library grew bloated with overly specific heuristic code, failing to achieve true zero-shot generalization.

## The Paradigm Shift: Native Huge Contexts and Visual Policies

Modern agent frameworks (e.g., **Optimus-3**, **Matrix-Game**, and the emerging **EvolvingAgent** paradigm) discard the heavy Mineflayer text wrapper.

1. **Pixel-to-Action:** These frameworks rely on raw visual inputs (pixels) rather than API-extracted semantic text. Agents like Optimus-3 use Multimodal Large Language Models (MLLMs) to process images directly.
2. **Goal-Observation-Action (GOA):** Instead of generating code, frameworks like Optimus-2 use a Goal-Observation-Action Conditioned Policy (GOAP). The MLLM handles high-level planning, while a low-level encoder (predicting 20Hz keyboard/mouse actions) handles spatial navigation.
3. **Huge Context Windows:** With modern transformer architectures capable of handling 128k+ tokens, entire video histories are passed into the context window, eliminating the need for rigid vector-DB text-skill retrievals.

### Key Contrast Summary
* **Representation:** Text API (Early) vs. Raw Pixels/Latent States (Modern)
* **Action Space:** Mineflayer JS Macros (Early) vs. 20Hz Keyboard/Mouse (Modern)
* **Adaptation Loop:** Error string parsing (Early) vs. In-context reinforcement and Video-based World Models (Modern).
