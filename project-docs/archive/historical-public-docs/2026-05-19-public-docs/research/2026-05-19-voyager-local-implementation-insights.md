# Voyager Local Implementation Insights

Target: [Voyager](https://github.com/MineDojo/Voyager).
Goal: Extract usable concepts for our small headless Minecraft NPC tool-loop (`/probe`) and discard approaches that misalign with our goals.

## The Core Loop

Voyager's strength is its observation pipeline and failure feedback loop. However, its core execution model—where the LLM generates raw JavaScript and runs it via `eval()`—is completely unacceptable for our repo's safety and design principles. We must own the execution via strict tool schemas and runtime validation.

- **What we keep:** Compressing Minecraft state into practical text observations, feeding failure reasons back as the next LLM input, and simple sequential curriculums.
- **What we discard:** LLM-generated JavaScript, `eval()` runtimes, and the Chroma-based generated action skill database.

## Prompts & Curriculum

Voyager strictly scopes tasks to a single verifyable action (e.g., "Mine 3 wood logs").

- **What works:** Deterministic first tasks, single goals, clear completion criteria, and forcing cleanup tasks when the inventory is full.
- **What we drop:** Broad QA caching, infinite open-ended exploration, and heavy screen-verification (unsuited for our headless social NPC probe).

## Observation Pipeline

Voyager's `bot.observe()` aggregates events and current state into a JSON string. The surrounding voxel scan (`8x2x8`) is small and highly practical.

For `/probe`, we will use an even smaller subset:
- `actor`, `position`, `visibleActors`, `recentChat`, `busy/available`, `nearbyBlocks`, `inventory`, `lastToolResult`, and `memory`.
- For social interactions, prioritize actor ID, distance, line-of-sight, and busy status over raw mob counts.

## Tool Primitives & Failure Feedback

Voyager provides excellent examples of wrapping raw Mineflayer APIs into high-level primitives (e.g., `mineBlock`, `exploreUntil`). Importantly, it catches missing preconditions (like distance or missing recipes) and returns explicit error messages instead of silently failing.

For `/probe`, we need structured results, not just chat strings:
```ts
type ToolResult =
  | { ok: true; code: "arrived" | "said" | "waited" | "remembered"; observationPatch?: object }
  | { ok: false; code: "not_found" | "too_far" | "busy" | "timeout" | "invalid_args" | "missing_item"; message: string };
```

## Safety & Error Handling

Voyager uses aggressive recovery tactics (teleportation, `/clear`, `/kill`) and broad timeouts.
- **For `/probe`:** Do not use cheat commands to fix agent loops; only use them for fixture setup. Keep tool timeouts small. Surface retries explicitly in the transcript rather than hiding them in the runtime.

## Action Items for `/probe`

1. **Curriculum:** Start with a deterministic seed sequence: `observe -> move_to(npc_b) -> say -> wait/rephrase -> remember`.
2. **Tool Schema:** Keep tools small, high-level, and heavily validated at runtime (`observe`, `move_to`, `say`, `wait`, `remember`).
3. **Observations:** Strip down to the essentials (position, nearby blocks, visible actors, chat, inventory, tool result).
4. **Structured Feedback:** Use explicit error codes (`busy`, `too_far`, etc.) instead of raw strings.
5. **Transcripts:** Maintain a step-by-step event ledger.
6. **No LLM Critic:** Use deterministic runtime verification for acceptance criteria first.
7. **No Gen-Code:** Use hand-written runtime tools, not LLM-generated JavaScript.
