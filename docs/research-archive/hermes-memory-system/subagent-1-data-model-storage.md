# Hermes Memory System: Data Model And Storage

Date: 2026-05-27

Subagent: 1

Scope: read-only inspection of Hermes memory data structures, storage paths, and provider boundaries. No files were modified and no tests were run by this subagent.

## Summary

Hermes does not treat memory as one blob. It separates memory into three layers:

1. a small curated built-in file memory;
2. a searchable session/history store;
3. optional external memory providers.

The reusable lesson for this Minecraft runtime is not to copy Hermes' personal-assistant profile model. The reusable part is its discipline around scoped storage, bounded writes, frozen prompt snapshots, explicit provider ownership, and failure isolation.

For this repo, actor memory should stay local, actor-owned, evidence-linked, and verifier-aware. Memory can summarize evidence, but it must not become proof of physical progress.

## Hermes Layers

### Built-In Curated Memory

Hermes keeps a small durable memory in profile files:

- `hermes-agent/tools/memory_tool.py`
- `hermes-agent/agent/builtin_memory_provider.py`

This memory is deliberately small and curated. It is not a raw transcript and not a task diary. Writes are add/replace/remove operations over durable facts, preferences, corrections, environment notes, and procedural knowledge.

Important traits:

- memory is loaded into a frozen prompt snapshot at session start;
- writes persist to disk but do not change the current active system prompt;
- duplicate exact entries are no-op success;
- replace/remove require unique matches;
- writes are guarded by injection screening and size limits;
- file writes are lock-protected and atomic.

Minecraft mapping: this is closest to actor-owned durable memory, but Minecraft should not use free-text profile memory as executable authority. It should keep structured records with evidence refs, confidence, status, and runtime scope.

### Searchable Session Store

Hermes also has a larger SQLite/FTS-backed history layer. The relevant code lives under paths such as:

- `hermes-agent/storage/*`
- `hermes-agent/plugins/memory/holographic/*`
- `hermes-agent/plugins/memory/honcho/*`

This layer is useful for recall, session search, history export, and external plugin-backed context. It is not always injected directly into the system prompt.

Minecraft mapping: SQLite/FTS may be useful later for long social-cycle runs, but the first migration should not start there. The current actor workspace JSON records are better as the canonical source because they are easier to audit against runtime artifacts.

### External Memory Providers

Hermes has a provider abstraction:

- `hermes-agent/agent/memory_provider.py`
- `hermes-agent/agent/memory_manager.py`

The key data-model rule is that built-in memory is always active and only one external provider may be active beside it. Providers can add context, tools, prefetch, sync, shutdown, and mirror memory writes.

Minecraft mapping: if this repo later adds a memory provider, it should be additive and best-effort. Actor workspace artifacts must remain canonical.

## Useful Storage Patterns To Reuse

Hermes has several patterns worth copying conceptually:

- profile or namespace isolation;
- frozen prompt snapshots;
- small curated memory plus larger searchable history;
- guarded mutation actions instead of ad hoc appends;
- atomic writes;
- exact duplicate handling;
- provider failure isolation;
- one-shot prefetch context;
- non-blocking sync/export;
- migration dry runs and no-overwrite defaults.

For Minecraft, these should become actor/workspace-scoped rather than user-profile-scoped.

## What Not To Copy Directly

Do not copy these Hermes concepts as-is:

- global `USER.md` as the main memory model;
- user/assistant peer split as the relationship model;
- free-text memories as runtime authority;
- external provider recall as proof of game progress;
- diary-style completed-task notes;
- substring-based mutation for structured runtime records.

Minecraft actor memory needs stronger guarantees:

- every physical-world memory must carry evidence refs;
- verifier-backed evidence outranks provider text;
- relationship memory must be directional actor-to-actor state;
- blocker memory must preserve exact structured action fingerprints;
- action-skill memory can propose candidates, but cannot promote executable behavior by itself.

## Proposed Minecraft Record Shape

The current repo already has `ActorMemoryRecord` in `probe/src/memory/actorMemory.ts`. The structure is directionally correct because it includes:

- `actor_id`;
- `layer`;
- `status`;
- `confidence`;
- `scope`;
- `summary`;
- `evidence_refs`;
- `index`;
- `content`.

The missing piece is a clearer domain kind. A future-compatible extension should distinguish:

- `cycle_judgment`;
- `world_observation`;
- `relationship_event`;
- `inventory_fact`;
- `action_skill_note`;
- `blocker`;
- `operator_note`.

The record should also preserve:

- `source_run_id`;
- `source_cycle_id`;
- `source_action_skill_id`;
- `supersedes`;
- `fingerprint`;
- `write_policy`.

This lets retrieval answer "why is this memory relevant?" without treating a vague summary as evidence.

## First Migration Slice

The smallest safe migration is:

1. keep actor workspace JSON as canonical storage;
2. add a memory IO contract that names memory inputs, outputs, and allowed write sources;
3. add record-level `kind` or equivalent structured classification;
4. add a sanitization/validation boundary for provider-proposed memory writes;
5. expose memory retrieval as a cycle-scoped context packet, not a permanent prompt overwrite.

SQLite/FTS can come later after the JSON record contract is stable.
