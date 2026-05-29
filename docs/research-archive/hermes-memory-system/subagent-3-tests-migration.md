# Hermes Memory System: Tests And Migration Lessons

Date: 2026-05-27

Subagent: 3

Scope: read-only inspection of Hermes memory tests, docs, and operational paths. No files were modified and no tests were run by this subagent.

## Summary

Hermes separates memory into two complementary layers:

- a small, curated built-in memory store in `MEMORY.md` and `USER.md`;
- optional external memory providers for larger recall, semantic search, session sync, and plugin tools.

The strongest architectural lesson for Minecraft NPC memory is not the exact storage backend. It is the contract discipline around memory: bounded writes, prompt-injection screening, frozen prompt snapshots, explicit provider lifecycle hooks, failure isolation, and tests that prevent memory from becoming an unverified diary.

For this Minecraft repo, memory should stay evidence-linked and actor-owned. Observation memory, relationship memory, blocker memory, and procedural/action-skill memory should support the runtime loop, not replace verifier-backed evidence. Hermes' personal-assistant profile concepts are useful as inspiration, but Minecraft memory needs stronger physical-world proof, per-actor ownership, relationship directionality, and action-surface gating.

## Hermes Invariants Protected By Tests

### Built-In Memory Store

Hermes treats local memory as curated durable context, not a complete activity log.

Relevant implementation:

- `hermes-agent/tools/memory_tool.py` defines `MEMORY.md` and `USER.md` as frozen-at-session-start prompt memory.
- `hermes-agent/tools/memory_tool.py` defines delimiters, per-file character limits, and supported actions.
- `hermes-agent/tools/memory_tool.py` trims additions, rejects empty entries, scans for unsafe text, reloads under lock, treats exact duplicates as success/no-op, and enforces capacity.
- `hermes-agent/tools/memory_tool.py` requires unique substring matches for replace/remove and rejects ambiguous edits.
- `hermes-agent/tools/memory_tool.py` returns the frozen system-prompt snapshot rather than live disk state.
- `hermes-agent/tools/memory_tool.py` writes atomically through a temp file plus replace.

Tests protect:

- prompt injection, exfiltration requests, invisible Unicode, role hijack, and system override blocking;
- add success, user-target writes, empty rejection, duplicate no-op success, over-limit rejection, and injection blocking;
- replace success, no-match errors, ambiguous substring errors, empty replacement rejection, and injection blocking;
- persistence roundtrip and deduplication on load;
- mid-session writes not appearing in the active prompt snapshot;
- dispatcher errors for missing store, invalid target, unknown action, and missing required fields.

The schema also encodes an important policy invariant: memory should not become a task diary. Durable facts, preferences, corrections, environment notes, and procedural knowledge belong in memory; task progress, session outcomes, completed-work logs, and temporary TODOs do not.

### Provider Management

Hermes keeps the built-in store always active and allows at most one external provider.

Relevant implementation:

- `hermes-agent/agent/memory_provider.py` states that external providers are additive and only one can be active.
- `hermes-agent/agent/memory_provider.py` defines provider lifecycle hooks: initialize, prompt block, prefetch, turn sync, tools, shutdown, session end, pre-compression, delegation, and memory-write mirroring.
- `hermes-agent/agent/memory_provider.py` requires prefetch and sync operations to be fast or non-blocking.
- `hermes-agent/agent/memory_manager.py` says one provider failure must not block other providers.
- `hermes-agent/agent/memory_manager.py` rejects a second external provider.
- `hermes-agent/agent/memory_manager.py` keeps the first provider tool on name conflict.
- `hermes-agent/agent/memory_manager.py` merges system prompt and prefetch context while isolating failures.
- `hermes-agent/agent/memory_manager.py` collects and routes provider tools with conflict handling and JSON error responses.
- `hermes-agent/agent/builtin_memory_provider.py` makes built-in memory always active while exposing no provider tool schema because the memory tool is intercepted by the agent loop.

Tests protect:

- empty managers, adding providers, built-in plus external, and second-external rejection;
- prompt and prefetch merging/skipping;
- queue and sync failure isolation;
- tool schemas, tool-name conflicts, unknown tools, and routing;
- lifecycle hooks, memory-write mirroring, and reverse-order shutdown;
- built-in provider behavior;
- real SQLite/FTS plugin lifecycle without external services.

### Operational Flush And Session Behavior

Hermes has explicit memory-flush paths at compression, reset, and session expiry.

Relevant implementation:

- `hermes-agent/run_agent.py` runs one model turn before compression/reset/exit, appends a sentinel, strips it afterward, and executes only memory tool calls.
- `hermes-agent/run_agent.py` intercepts memory tool calls at the agent loop and notifies external providers on add/replace.
- `hermes-agent/run_agent.py` prefetches external memory once using the clean original user message, then reuses that context across tool iterations.
- `hermes-agent/run_agent.py` syncs a completed turn and queues the next prefetch.
- `hermes-agent/gateway/session.py` persists `memory_flushed`, defaulting legacy sessions to false.
- `hermes-agent/gateway/run.py` skips cron sessions, requires enough transcript and API key, creates a temporary flush agent with memory and agent-skill tools, and injects current memory files to avoid stale overwrites.
- `hermes-agent/gateway/run.py` flushes expired sessions asynchronously, shuts cached providers down, and marks `memory_flushed`.

Tests protect:

- auxiliary-client preference, main-client fallback, execution of memory tool calls, and sentinel stripping;
- the Responses path when no auxiliary client exists;
- expiry behavior, disabled mode, active background process protection, and daily reset logic;
- `memory_flushed` persistence and legacy default behavior;
- cron sessions bypassing flush;
- current memory file contents being injected into the flush prompt;
- the temporary flush agent being silenced;
- flush prompts asking for durable facts and possible agent-skill creation, not a user response.

### Honcho Plugin

Honcho is the clearest external provider example.

Relevant implementation:

- `hermes-agent/plugins/memory/honcho/client.py` resolves config across Hermes profile, global Honcho config, and environment.
- `hermes-agent/plugins/memory/honcho/client.py` parses memory mode, peer memory modes, write frequency, recall mode, observation mode, session strategy, and explicit config.
- `hermes-agent/plugins/memory/honcho/session.py` flushes unsynced messages and only marks them synced on success.
- `hermes-agent/plugins/memory/honcho/session.py` has an async writer that retries once, then drops the batch after repeated failure.
- `hermes-agent/plugins/memory/honcho/session.py` builds prefetch context for user and AI peers without using the raw message as the logged search query.
- `hermes-agent/plugins/memory/honcho/session.py` migrates `MEMORY.md`, `USER.md`, and `SOUL.md`, targeting user memories to the user peer and assistant identity to the assistant peer.
- `hermes-agent/plugins/memory/honcho/__init__.py` bakes first-turn context into the system prompt and switches behavior by recall mode.
- `hermes-agent/plugins/memory/honcho/__init__.py` queues prefetch based on cadence.
- `hermes-agent/plugins/memory/honcho/__init__.py` truncates synced user and assistant messages.
- `hermes-agent/plugins/memory/honcho/__init__.py` mirrors only built-in `add` writes targeting `user` as Honcho conclusions.
- `hermes-agent/plugins/memory/honcho/__init__.py` hides plugin tools in context-only recall mode.

Tests protect:

- write-frequency parsing;
- memory-mode parsing and host override behavior;
- session-name resolution;
- save routing for turn/session/async/N modes;
- flush-all and async thread lifecycle;
- retry behavior and drop-after-retry failure;
- migration targets for user memory versus assistant identity;
- one-shot prefetch cache consumption.

## Edge Cases And Migration Risks

1. Documentation can drift from tested behavior. Hermes tests say memory is not a diary; some user docs are looser. Minecraft should follow the stricter tested invariant.
2. Frozen snapshots are deliberate. Mid-session writes persist but do not become immediate current-turn authority. Minecraft should mirror this at cycle boundaries.
3. Substring mutation is too fragile for actor memory. Minecraft should use record IDs, evidence refs, status fields, supersession links, and fingerprints.
4. Exact duplicate detection is not enough for structured blocker/action-skill memory. Minecraft should use structured fingerprints.
5. Async external writes can fail. Minecraft evidence memory must not depend on best-effort external export.
6. Personal-assistant peer concepts do not map directly to NPC society. Minecraft needs directional relationship memory and shared/private actor state.

## Mapping To Minecraft NPC Memory

### Observation And Evidence Memory

Observation memory may summarize evidence, but it must carry evidence refs and must never be treated as proof of physical success.

Relevant Minecraft anchors:

- `docs/blog-doc/Specification/Runtime-Evidence-And-Action-Skills.md`;
- `probe/src/transcript/canonical/transcriptParts.ts`;
- `probe/src/memory/actorMemory.ts`.

### Relationship Memory

Hermes' user/assistant peer split is useful mechanically, but Minecraft needs actor-to-actor relationship ledgers.

Relevant Minecraft anchors:

- `docs/blog-doc/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`;
- `probe/src/npc/relationships/relationshipLedger.ts`;
- `probe/test/relationshipLedger.test.ts`.

Recommended invariant: relationship memory should be directional, event-backed, and bounded. A relationship update should point to chat, delivery, failure, conflict, or shared-task evidence. It should not be inferred from generic provider tone.

### Blocker Memory

Hermes prevents bad memory writes and stale overwrites. Minecraft needs the same discipline for repeated failed actions.

Relevant Minecraft anchors:

- `docs/blog-doc/Specification/Runtime-Evidence-And-Action-Skills.md`;
- `probe/src/runtime/retryConstraints.ts`;
- `probe/test/socialCycleExecution.test.ts`.

Recommended invariant: blocker memory should preserve exact structured target/args fingerprints and evidence refs. It should be exposed through recent blockers and guardrail memory, but it should not become broad domain advice like "never mine wood here."

### Procedural And Action-Skill Memory

Hermes treats agent-managed skills as procedural memory, but Minecraft action skills need stricter gates because they affect a live game world.

Relevant Minecraft anchors:

- `docs/blog-doc/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`;
- `probe/src/runtime/actorWorkspaceStore.ts`.

Recommended invariant: procedural memory can suggest candidates, but only actor-owned action skill records with primitive contracts, preconditions, verifiers, evidence, and lifecycle status may expand executable behavior.

### Action-Space Expansion

Hermes provider tools are additive and conflict-isolated. Minecraft should apply that lesson through the action surface, not by handing providers broad runtime authority.

Relevant Minecraft anchors:

- `probe/src/runtime/actionSurface.ts`;
- `docs/blog-doc/Specification/Runtime-Evidence-And-Action-Skills.md`.

Recommended invariant: memory may propose missing affordances or candidate action skills, but the runtime action surface decides what is executable now. Direct `use_primitive` intents must not spoof action-skill fallback authority.

## Proposed Adoption Checks

1. Actor memory records require evidence refs for observation, relationship, blocker, and procedural/action-skill candidate records.
2. Memory retrieval packets may provide context, but verifier-backed current-run evidence remains required for physical success.
3. Relationship events require evidence refs and update typed relationship categories, not arbitrary sentiment values.
4. Repeated blocker memory fingerprints only structured target/args and ignores prose rationale.
5. Action-skill candidate memory cannot become active without recipe validation, live trial evidence, verifier results, and actor workspace status promotion.
6. Compaction preserves evidence refs, recent blockers, relationship state, inventory/container snapshots, world-state diagnostic refs, and action-surface contracts, while dropping repeated observe/wait chatter and unverified provider claims.
7. Any async external memory export is best-effort only; local actor workspace artifacts remain canonical.
8. Migration from generated or exploratory outputs must be dry-run capable, no-overwrite by default, and report overflow/rejected records explicitly.
9. Documentation should avoid diary-style memory examples. Durable memory should store evidence-linked facts, constraints, relationship state, and procedure candidates, not unverified completion claims.
