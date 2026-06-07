# yearn_for_mines Local Implementation Insights

Target: `yearn_for_mines`
Goal: Extract implementation patterns to improve our small `/probe` Minecraft LLM agent.

## Core Takeaways

`yearn_for_mines` wraps Minecraft actions in MCP tools within a `perceive -> plan -> execute -> verify -> remember` loop. While the full implementation (MemPalace, extensive toolsets) is too heavy for our dialogue probe, three patterns are highly relevant:

- **Observation Post-Tool:** The result of a tool execution immediately becomes part of the next observation.
- **Error Stratification:** The runtime strictly separates transient/system errors from actual game logic errors.
- **Macro Tools:** Grouping repetitive, error-prone micro-steps into a single, safe runtime command.

## Agent Loop & Observation

The agent loop explicitly defines execution phases. The observation builder compresses bot status, inventory, and nearby entities into a `ContextFrame`, formatting it into readable sections (`=== Outcome ===`, `=== Vital Stats ===`, etc.).

- **What works:** The next LLM turn doesn't need to wait for a separate "observe" action; the previous tool's outcome and the new world state are immediately available.
- **For `/probe`:** Keep the context bundle compact. We only need actor status, visible actors (with distance and busy states), recent conversation (4-8 utterances), recent memory notes, and allowed tools.

## MCP / Tool Boundaries

Tools wrap Mineflayer APIs, exposing high-level intents (`gather_materials`, `interact`) to the LLM.

- **Good Boundaries:** The runtime owns the complex execution (pathfinding, block validation). Failures return context so the LLM can adjust its plan.
- **Danger Zone:** In `yearn_for_mines`, many gameplay failures (pathfinding failed, missing blocks) return `isError: false` text results. This breaks retry logic.
- **For `/probe`:** Tool results MUST be strictly structured (e.g., `{ ok: boolean, status: "blocked" | "invalid" | "transient", message: string }`). `ok: false` must be used for game failures to enable proper retry/alternative routing.

## Macro Tools

Tools like `craft_macro` bundle multiple steps (find table, place, craft, cleanup).

- **For `/probe`:** We don't need crafting macros yet, but we *do* need social macros. An `approach_and_converse(target, text)` macro—which handles distance checks, movement, and chat delivery in one validated step—will drastically reduce LLM failure rates.

## Retry & Alternative Behavior

If the agent fails the same tool call 3 times, `yearn_for_mines` injects a system prompt demanding a different strategy.

- **For `/probe`:** Adopt a simpler version. If an actor receives `blocked` for the same tool/args twice, inject an instruction: `Do not repeat the same action; choose wait, move_to, or a different utterance.`

## Memory & Verification

`yearn_for_mines` uses a complex MemPalace for long-term knowledge and relies on the LLM to verify goal completion.

- **For `/probe`:** Avoid external DBs. Use short episodic memory (recent heard chats, target actor notes, last failed action). Verification must be deterministic and runtime-owned (e.g., "4 turns completed, both actors spoke").

## Action Items for `/probe`

1. **Structured Tool Results:** Enforce strict success/failure statuses.
2. **Compact Context:** Focus only on dialogue-relevant observations.
3. **First-Class `converse` Tool:** Must handle target validation, distance, and availability, returning `blocked` if the target is busy.
4. **Social Macros:** Implement `approach_and_converse`.
5. **Anti-Repeat Prompts:** Detect repeated failures and force alternative actions via prompt injection.
6. **Runtime Verification:** Hardcode success conditions for the initial proof.
7. **File-Based Memory:** Stick to JSON snapshots alongside transcripts.
8. **Error Separation:** Treat `bot_connect` failures differently from `target_too_far`.