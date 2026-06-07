# Hermes Memory System: Runtime Lifecycle And Retrieval

Date: 2026-05-27

Subagent: 2

Scope: read-only inspection of Hermes runtime memory lifecycle, retrieval, provider hooks, and comparison against the Minecraft runtime. No files were modified and no tests were run by this subagent.

## Summary

Hermes memory is strongest at lifecycle discipline. It does not simply "remember" when the model says something important. It controls when memory is loaded, when recall is prefetched, when turns are synced, when memory is flushed before compression/reset, and which contexts are allowed to write memory.

For this Minecraft runtime, that maps to a cycle-level actor memory lifecycle:

```text
runtime evidence -> memory proposal -> guarded write -> retrieval packet -> provider context
```

The provider should not be allowed to turn arbitrary prose into durable memory or action authority. Runtime artifacts and verifiers should decide what becomes durable.

## Hermes Lifecycle Hooks

Hermes defines a memory provider lifecycle around:

- initialization;
- system prompt block;
- prefetch;
- turn sync;
- tool schemas;
- tool handling;
- memory-write mirroring;
- pre-compression flush;
- session end;
- shutdown;
- delegation boundaries.

Relevant files:

- `hermes-agent/agent/memory_provider.py`
- `hermes-agent/agent/memory_manager.py`
- `hermes-agent/run_agent.py`
- `hermes-agent/gateway/run.py`

Important behavior:

- built-in memory is loaded separately from external recall;
- external recall can be prefetched and appended as current-turn context;
- memory providers should be fast or non-blocking;
- provider failures are isolated;
- subagents, cron, and forked contexts are treated carefully because they can corrupt durable memory if allowed to write freely.

## Hermes Write Paths

Hermes has three important write shapes:

1. direct built-in memory tool calls;
2. external provider tool calls routed through the memory manager;
3. background memory flush before compression, reset, or session expiry.

The strongest operational idea is the flush path: before context is compacted or a session is reset, Hermes gives the model a chance to write only durable memory, then strips the sentinel and avoids a user-visible response.

Minecraft mapping: this is useful, but the write source should not be the model alone. For this repo, memory flush should summarize evidence-backed artifacts and propose records. Runtime/verifier ownership should decide what is active.

## Current Minecraft Memory IO

Current implementation:

- `probe/src/memory/actorMemory.ts` defines `ActorMemoryRecord`, writer helpers, listing, scoring, and retrieval.
- `probe/src/runtime/socialCycleRunner.ts` writes `CycleJudgment.memory_writes` into actor memory.
- `probe/src/objectives/longObjective/memory.ts` and `probe/src/objectives/directGeneratedRunner.ts` write direct-generated objective memories.
- `probe/src/runtime/goals/cycleContextAssembler.ts` retrieves memory and injects it into social-cycle context.
- `probe/src/provider/actorProviderContext.ts` retrieves memory for provider packets.

Current inputs:

- verifier-backed direct-generated objective reports;
- provider-authored `CycleJudgment.memory_writes`;
- tests that seed memory records directly.

Current outputs:

- `actor-memory-retrieval/v1`;
- layer buckets: episodic, procedural, semantic, social, guardrail, belief;
- refs with `memory_id`, `summary`, `confidence`, `status`, `evidence_refs`, `reason`, and score.

What is missing:

- a named memory lifecycle boundary;
- clear write-source policy;
- explicit memory kind taxonomy;
- duplicate/fingerprint policy;
- injection/unsafe-text guard for provider-proposed summaries;
- relationship and blocker memory integration;
- cycle-scoped freeze/prefetch semantics.

## Retrieval Lessons

Hermes avoids putting every old turn into the prompt. Recall is selected, bounded, and sometimes one-shot.

Minecraft should keep retrieval deterministic first:

- retrieve by actor;
- exclude rejected, stale, and superseded records;
- rank by objective/category/item/action-skill/blocker fingerprint;
- return refs rather than full unbounded content;
- include evidence refs and confidence in every returned memory.

Semantic search can be added later, but it must not outrank exact evidence-linked retrieval for physical game state.

## Observation, Context, And Memory

Hermes separates durable memory from the current user prompt. Minecraft needs a related separation:

```text
raw observation -> evidence refs -> model interpretation -> CycleGoal -> ActionIntent
```

Observation is what the actor saw or what the runtime recorded. The runtime should preserve those facts, evidence refs, and limits, then let the model interpret what matters under ActorSoul, LifeGoal, role, relationships, obligations, scarcity, danger, or blockers.

Memory should preserve both sides carefully:

- observation memory stores what was seen, with evidence refs;
- interpretation memory stores why it mattered, with the source of interpretation;
- blocker memory stores exact failed target/args fingerprints;
- relationship memory stores directional events and derived relationship state.

## Action-Space Lessons

Hermes provider tools are additive: they extend what the agent can do but are mediated by a manager. Minecraft should use the same shape for Mineflayer affordances.

The current `action_surface` is too close to a small menu of seed action skills. The broader architecture should be:

```text
Mineflayer API capability substrate
-> bounded runtime primitive adapters
-> generated or seed action skill candidates
-> actor-owned action skill records
-> provider-visible action_surface
```

The `action_surface` should expose:

- what is executable now;
- what is deferred because a primitive/action skill is missing;
- what Mineflayer affordance could be opened by generating or validating a new adapter;
- why runtime verification is still required.

## Migration Recommendation

Adopt Hermes' lifecycle shape, not its personal-assistant memory semantics.

First implementation slice:

1. document current Minecraft memory inputs and outputs;
2. add a typed `ActorMemoryKind`;
3. require provider-proposed memory writes to pass a guard before becoming active records;
4. add explicit raw-observation versus model-interpretation wording in provider prompts/context;
5. expose Mineflayer expansion opportunities in `action_surface` without granting raw unchecked Mineflayer execution.

Later slices:

- actor-memory provider abstraction;
- compaction-time evidence summary;
- SQLite/FTS index for long social-cycle runs;
- migration tooling for legacy generated skill output;
- actor-owned action-skill promotion pipeline.
