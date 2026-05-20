# mindcraft-ce Local Implementation Insights

Target: `mindcraft-ce`

`mindcraft-ce` is a massive benchmark and evaluation framework. Our `/probe` is a tiny, headless NPC dialogue loop. Therefore, we must aggressively filter out the benchmarking infrastructure, command surface, and code generation, keeping only the strict operational rules for tool execution and multi-agent conversation.

## Core Takeaways

### ActionManager: Timeouts & Interrupts
All long-running tasks are wrapped with timeouts and explicit interrupt checks (`requestInterrupt()`, `bot.interrupt_code`). Concurrent actions are blocked by an `executing` gate.
- **For `/probe`:** Implement an `ActionRunner` that strictly enforces one active tool at a time. Long tools must check an `AbortController` or shared flag. Tool results must always return a structured `{ ok, status, message, durationMs }` to the transcript.

### Separation of World vs. Action Skills
The repo cleanly divides read-only world observation helpers (`world.js`) from mutation/action helpers (`skills.js`).
- **For `/probe`:** Adopt this boundary. `observeWorld(bot)` returns pure state (position, nearby actors, inventory). `tools/moveToActor`, `tools/say`, etc., handle state changes. Avoid porting the massive 2k+ line action skill files.

### History Compaction
Old chat context is chunked, summarized, and moved to a ledger while keeping the active prompt small.
- **For `/probe`:** We don't need LLM-driven summarization yet. Just keep the prompt context limited to the last N events, write the full uncompressed transcript to a file (`data/evidence`), and use a simple `remember(note)` array for memory.

### NPC & Multi-Agent Collaboration
This is the most valuable part. `mindcraft-ce` enforces single active conversations and manages response latency based on `busy` states.
- **For `/probe`:**
  - Inject `busyUntil` or `currentAction` into the observation.
  - A `say` action targeting a busy bot must fail with a `blocked_busy` status.
  - Force the LLM to handle the `blocked` result by choosing `wait` or a shorter retry.
  - Reject concurrent conversation requests.
  - Tag incoming messages with `(FROM OTHER BOT)` to prevent hallucination.

### Task System as Scenario Spec
Tasks define initial conditions, blocked actions, and completion criteria.
- **For `/probe`:** Use this pattern to define dialogue scenarios (e.g., "npc_a wants X, npc_b starts busy"). Validation should be simple runtime checks (e.g., "3+ turns, both spoke"), not complex voxel blueprint matching.

## What to Discard

- **Generated Code (`coder.js`):** Absolutely no dynamic JS execution or SES compartments. LLM output must be strictly typed JSON matching our tool schema.
- **Large Action Surface:** Ignore cooking, crafting, combat, and building.
- **Cheat Orchestration:** Do not intertwine `/give`, `/tp`, `/fill` commands with the main agent loop (use only for test fixtures).
- **Heavy Infrastructure:** Ignore the tmux wrappers, embedding-based action skill retrieval, and benchmarking workflows.

## Action Items for `/probe`

1. **ActionRunner:** Enforce single-execution limits and strict timeouts.
2. **Read/Write Separation:** Keep `observeWorld` read-only; use distinct tool handlers for mutations.
3. **Event Ledger:** Store full history on disk, but feed only the last 5-10 events to the prompt.
4. **Busy/Available Gates:** Implement `busyUntil` state and `blocked_busy` tool results for social interactions.
5. **Scenario Specs:** Define task success via simple runtime invariants, not external evaluators.
6. **No Code Gen:** Restrict the LLM to returning `AgentProposal` JSON.
