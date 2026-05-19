# Codex Message And Memory Research

Date: 2026-05-19

## Scope

This report studies local `codex` as a second reference for long-running LLM
 session architecture, especially around turn state, compaction, thread storage,
 event persistence, and durable reconstruction.

Local repo inspected:

- `/Users/naem1023/git/codex`

## Files Inspected

- `codex-rs/core/src/session/session.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/turn_context.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/multi_agents.rs`
- `codex-rs/core/src/state/session.rs`
- `codex-rs/core/src/state/auto_compact_window.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/thread-store/src/store.rs`
- `codex-rs/thread-store/src/live_thread.rs`
- `codex-rs/thread-store/src/local/live_writer.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/message-history/src/lib.rs`
- `codex-rs/state/src/model/memories.rs`
- `codex-rs/state/src/runtime/memories.rs`

## Main Takeaway

`codex` is the strongest local reference for compaction-aware durable thread
 reconstruction. The key transferable pattern is:

- canonical in-memory transcript for active reasoning;
- append-oriented durable rollout items for replay/resume;
- explicit compaction checkpoints with replacement history;
- separate metadata DB and optional memory extraction pipeline;
- mailbox-aware multi-agent turn semantics.

## Message Lifecycle Lessons

### Transcript updates are semantic and incremental

Completed response items and tool items are recorded as they happen. Streaming UI
 deltas are not the canonical history. This is the right tradeoff for a
 simulation runtime as well.

### Multi-agent mail should obey turn phases

`codex` has mailbox-delivery phase handling so late messages do not mutate an
 already committed visible answer. This is a very strong idea for multi-NPC
 Minecraft simulation.

For this repo, mailbox timing should ensure:

- same-turn reactions are possible while the agent is still reasoning;
- late incoming social/world messages are queued for the next turn once the
  current action/utterance is committed.

## Memory And Persistence Lessons

### Use distinct layers for transcript, metadata, and long-term memory

`codex` splits:

- active transcript history;
- rollout persistence;
- searchable thread metadata;
- optional long-term memory extraction.

That is a very good blueprint for this repo.

### Thread storage is a better abstraction than one giant simulation log

The `ThreadStore` boundary is reusable. This repo should likely have:

- one thread per NPC;
- optional shared settlement thread;
- optional observer/reporter thread;
- optional memory worker thread.

## Compaction Lessons

### Replacement history is better than summary-only compaction

`compact.rs` and reconstruction logic treat compaction as a real durable change to
 the thread, not as an informal note. That is one of the most important insights
 from this repo.

For Minecraft, compaction should similarly produce a canonical replacement
 history/checkpoint that resume and fork can trust.

### Keep per-turn context baselines

`TurnContextItem` and context-reference handling show that a system can reinject
 only diffs after a stable baseline exists. This is very attractive for Minecraft
 world-state prompts, where repeating the full state every turn is wasteful.

## What To Port Into This Repo

### Highest priority

1. Thread-store style abstraction for agent sessions.
2. Append-oriented rollout/event persistence.
3. Replacement-history compaction checkpoints.
4. Turn-context baselines with diff reinjection.
5. Mailbox delivery phases for multi-agent coordination.
6. Separate transcript persistence from offline memory extraction.

### Strong secondary imports

- persistence modes such as limited vs extended event storage;
- spawn-edge tracking between parent and child threads.

## What Not To Port

- coding-assistant assumptions that transcript alone can stand in for world model;
- provider-specific remote compaction as a first dependency;
- oversized central session objects owning too many responsibilities.

## Repo-Specific Recommendation

Use `codex` as the reconstruction and thread-lifecycle reference. It is the best
 local source for:

- durable resume/fork semantics;
- compaction-aware reconstruction;
- mailbox-safe multi-agent turns;
- layered persistence.
