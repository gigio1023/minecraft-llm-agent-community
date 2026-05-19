# mc-multimodal-agent Local Implementation Insights

Target: `../mc-multimodal-agent`

This implementation relies on a runtime-owned tool loop rather than LLM code generation. The LLM outputs structured JSON, and the runtime handles schema validation, execution, and memory. This aligns perfectly with our `/probe` architecture.

## Core Takeaways

### Post-Tool Observation
After specific actions (move, wait, craft), the agent loop immediately appends a new state observation (`postToolState`) to the tool result.
- **For `/probe`:** Extend our simple `{ tool, status }` results. After an action (like `move_to`), automatically attach the new position, visible actors, and recent chat to the result so the LLM understands *why* it succeeded or failed without wasting a turn on `observe`.

### Strict Tool Schema
The LLM interaction is constrained to specific JSON shapes (`tool_call`, `tool_calls`, `final`), forbidding prose-based action planning.
- **For `/probe`:** Enforce `oneToolPerTurn` via strict JSON parsing. If the LLM returns invalid JSON or hallucinates tools, return a structured parser error directly into the loop.

### Anti-Repeat Detection
The runtime hashes tool names and arguments. If the same arguments yield the same result repeatedly, it escalates from a warning to a critical failure, aborting the loop.
- **For `/probe`:** Implement a lightweight memory Map tracking the last 8 `{ tool, argsHash, resultStatus }` entries per actor. If repeated failures hit a threshold, inject a prompt warning; abort on critical thresholds.

### Skill Recording (Traces, Not Code)
Skills are saved as ordered atomic traces (`{ tool, arguments }`) with preconditions and success criteria, rather than raw JavaScript blobs.
- **For `/probe`:** Adopt this trace-based recording. Successful dialogue or movement sequences should be saved as JSON traces (`build/generated-skills/*.json`). Ignore replay functionality for now.

### Memory & Transcript Separation
Transcripts are append-only JSONL files (the ledger), while memory is a LevelDB store split into semantic, episodic, and working layers.
- **For `/probe`:** Maintain the append-only transcript as evidence. For memory, don't use a DB yet; just split the current `createMemory()` array into a `working` context and a short `episodic` list injected into the prompt.

### Goal & Task Planning
Goals are defined with explicit `successCriteria` and `blockers`. State updates (blocked/failed) are recorded to prevent looping.
- **For `/probe`:** Keep goal trees minimal. A scenario only needs 2-3 subgoals (e.g., `conversation`, `move`, `remember`), tracked simply by `status` and `successCriteria`. Discard complex material/crafting planners for now.

## Action Items for `/probe`

1. **Standardize Tool Results:** Enforce `{ ok: boolean, status: string, text: string, data?: JsonValue }`.
2. **Rich Action Feedback:** Append post-action observations to movement and social tool results.
3. **Anti-Repeat Loop:** Track action hashes and inject prompt warnings upon repeated failures.
4. **Memory Layering:** Separate `working` notes from `episodic` events in the prompt context.
5. **Trace-Based Skills:** Record successful sequences as JSON step traces, not code.
6. **Minimal Goals:** Define scenarios via simple `successCriteria` and `blockers`, avoiding deep planners.
7. **Defer Complexity:** Ignore vision models, subagents, and crafting trees for the initial headless proof.