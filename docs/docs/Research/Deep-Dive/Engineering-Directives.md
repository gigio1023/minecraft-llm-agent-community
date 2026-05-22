# Engineering Directives for the Headless Agent Loop

This document translates the exhaustive V2 Deep Literature Review into strict, actionable directives for our headless Minecraft runtime codebase (`gameplay/`, `runtime/`, `memory/`).

## 1. Deprecate Lossy RAG; Enforce "Transcript-in-Context"
*   **Literature Context**: The *Diagnostic Framework on Memory Bottlenecks* and *AMA-Bench* prove that lossy compression (summarization, extraction) and similarity-based Vector DBs fail catastrophically in continuous agent streams due to "causality blindness."
*   **Codebase Directive**: 
    *   Do **NOT** implement an episodic vector database for past gameplay events. 
    *   The `Live Transcript` must be maintained as uncompressed, chunked raw text (or structured logs) and fed directly into the massive context window of the modern LLM.
    *   Rely on the LLM's native attention mechanism to trace causality within the episode history.

## 2. The "Knowledge Layer" is the Actor Workspace
*   **Literature Context**: *The Missing Knowledge Layer in Cognitive Architectures* demonstrates the fatal category error of treating Facts and Experiences identically. Facts require "indefinite supersession" (true until explicitly updated by the environment).
*   **Codebase Directive**:
    *   The **Actor Workspace** (`runtime/state/`) must act as this strict Knowledge Layer. 
    *   Inventory ledgers, known locations, and `action skill` ownership must be strongly typed in TypeScript. The LLM must **never** be expected to hallucinate or recall the exact count of items from its episodic transcript.
    *   Every loop iteration must inject the strictly verified Actor Workspace state at the top of the prompt.

## 3. The Drama Manager (Global Planner) for Social Simulation
*   **Literature Context**: Papers like *HAMLET* and *Narrative Studio* show that rigid dialogue trees are obsolete. Narrative pacing is best handled by a "Planner" that manages state broadcasting and multi-trajectory planning, preventing "flag hacking" (skipping logical steps).
*   **Codebase Directive**:
    *   To achieve the "social simulation seed" (North Star), implement a slow-tick **Global Planner** in `runtime/orchestration/`.
    *   The Planner does not script dialogue. It injects **Role Pressure** (e.g., "The village is running out of fuel") into the Actor Workspace.
    *   The agent uses **Dialogue-as-Simulation** to naturally roleplay the resolution of this pressure, autonomously triggering low-level `action skills` like `collectLogs`.

## 4. Strict Action Skill Verification against Grounding Failures
*   **Literature Context**: Papers like *Optimus-1* explicitly note that even advanced LLMs struggle with low-level spatial grounding (e.g., placing blocks in complex recipes) without pure RL fine-tuning. MLLMs are also prone to visual hallucinations.
*   **Codebase Directive**:
    *   The runtime must never trust the LLM's assertion of task completion.
    *   `gameplay/seedSkills/verificationContracts.ts` must be treated as absolute ground truth.
    *   If Mineflayer API verification fails (e.g., the block is not in inventory), the runtime must enforce an atomic reset of the skill and feed the explicit error trace back to the LLM. Do not allow optimistic status text to masquerade as success.

---
**Summary Statement:**
Our codebase must strictly separate *ephemeral, long-context episodic reasoning* (handled entirely by the frontier LLM) from *factual, verified environmental truth* (handled entirely by our TypeScript runtime logic). 
