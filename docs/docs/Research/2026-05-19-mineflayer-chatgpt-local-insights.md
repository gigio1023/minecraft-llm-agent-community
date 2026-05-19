# mineflayer-chatgpt Local Implementation Insights

Target: `../mineflayer-chatgpt`

While this repo focuses on a long-living, streaming-oriented survival bot, several architectural choices map perfectly to our small headless `/probe`. We want its event-driven brain, prompt separation, and team bulletin, but we must strictly avoid its dynamic JavaScript execution model.

## Core Observations

### Event-Driven Brain
Instead of a rigid 500ms polling loop, the brain relies on prioritized events (`strategic`, `reactive`, `chat`, `critic`). 
- **For `/probe`:** Adopt a simplified event queue. Only trigger LLM decisions on specific state changes: `spawned`, `chat_received`, `tool_result`, `idle_timeout`, or `blocked`. Prevent concurrent decisions per actor.

### Prompt Separation
Prompts are split by purpose: strategic planning, reactive survival, critic evaluation, and chat response.
- **For `/probe`:** Split the provider prompt into `strategic` (choosing the next tool/utterance) and `critic` (evaluating if the last result requires a re-plan).

### Execution Layers & Action Gates
All actions route through a central `executeAction` function. The brain checks `allowedActions` based on the bot's role before execution.
- **For `/probe`:** This perfectly aligns with our design. The LLM outputs an intent, and the runtime validates it against the tool schema, distance, target, and busy state before executing the Mineflayer API.

### Team Bulletin
Bots share state via a singleton Map in the Node process, updating their status (`action`, `position`, `thought`) after every move.
- **For `/probe`:** Essential for multi-bot social scenarios. Share a minimal, stale-aware bulletin: `{ actorId, position, busyUntil, lastIntent, lastUtterance, lastToolResult }`.

### Roles & Social Behavior
Different personalities and allowed actions create emergent social behavior without deep simulation.
- **For `/probe`:** Keep it simple. Define `npc_a` (requester) and `npc_b` (responder) with different `allowedTools` and `initialBusyState`. This is the cheapest way to prove multi-bot interaction.

### Failure Blacklists
The bot categorizes failures into precondition failures (e.g., missing items) and real failures (broken skills), preventing immediate retries.
- **For `/probe`:** Implement short-lived failure blacklists. If `say:npc_b` is blocked by `target_busy`, ban that specific action for 1 turn, forcing a `wait` or `rephrase`.

## What to Discard

- **Dynamic JavaScript Loader:** The repo ports Voyager's seed skills and runs them via `vm`. This violates our core safety principle. Do not execute LLM-generated code.
- **Heavy Systems:** Ignore the hostile scanner, overlay, TTS, complex job roles, and long-running static macros (like building farms).

## Action Items for `/probe`

1. **Event Queue:** Trigger turns only on `start`, `tool_result`, `chat_received`, `idle_timeout`, and `blocked`.
2. **Split Prompts:** Separate `strategic` and `critic` LLM calls.
3. **Typed Registry:** Use a strictly typed tool registry (`observe`, `move_to`, `say`, `wait`, `remember`) instead of string-based routers.
4. **Social Validation:** Ensure `say` checks distance and target availability, returning `blocked` if necessary.
5. **Team Bulletin:** Implement a lightweight, shared state object across NPC instances.
6. **Role Restrictions:** Use `allowedTools` to differentiate NPC behavior.
7. **Anti-Repeat:** Implement a 1-turn blacklist for `blocked` actions.
8. **Local Memory:** Store notes only in the current run's context; defer persistent memory.
9. **Detroit-Style Tests:** Mock the action router and provider parser heavily before spinning up Mineflayer.