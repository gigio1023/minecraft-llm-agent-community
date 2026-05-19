# OpenCode Message And Memory Research

Date: 2026-05-19

## Scope

This report studies local `opencode` as a coding-agent system, but with one
 transferable question in mind: how should a long-running multi-agent Minecraft
 runtime manage messages, tool transcripts, compaction, and durable memory.

Local repo inspected:

- `../opencode`

## Files Inspected

- `packages/opencode/src/session/session.ts`
- `packages/opencode/src/session/message.ts`
- `packages/opencode/src/session/message-v2.ts`
- `packages/opencode/src/session/processor.ts`
- `packages/opencode/src/session/prompt.ts`
- `packages/opencode/src/session/compaction.ts`
- `packages/opencode/src/session/summary.ts`
- `packages/opencode/src/session/tools.ts`
- `packages/opencode/src/session/run-state.ts`
- `packages/opencode/src/session/todo.ts`
- `packages/opencode/src/session/projectors.ts`
- `packages/opencode/src/session/projectors-next.ts`
- `packages/core/src/session-event.ts`
- `packages/core/src/session-message.ts`
- `packages/core/src/session-message-updater.ts`
- `packages/opencode/src/storage/db.ts`
- `packages/opencode/src/storage/storage.ts`

## Main Takeaway

`opencode`'s strongest reusable idea is that long-running coherence depends on
 treating a conversation as structured durable parts, not as flat chat text.

The key design pattern is:

- canonical persisted message parts for replay;
- separate projected timeline for UI/API;
- explicit compaction messages and rolling summaries;
- durable tool lifecycle entries;
- child-session branching instead of one forever-growing thread.

## Message Lifecycle Lessons

### Assistant turns are incrementally durable

`session/processor.ts` streams text, reasoning, tool calls, tool results, and
 step lifecycle into persisted message parts while the turn is still running.

That matters for this repo because multi-agent Minecraft transcripts should also
 survive interruption, cancellation, or world-state races without losing the
 partial truth of what happened.

### Tool calls are first-class transcript entities

`opencode` does not hide tools behind opaque assistant text. Tool input, running
 state, output, and error are all durable structured parts. This is directly
 portable to a Minecraft runtime.

## Memory And Persistence Lessons

### Replay state and UI state should be separate

`message` + `part` are the replay source of truth. `session_message` is a derived
 projection for other surfaces. That separation is highly relevant for this repo.

For Minecraft, the parallel should be:

- canonical replay transcript per agent;
- derived debug/event timeline for dashboards;
- separate metadata index for sessions, costs, roles, links.

### Child sessions are a better long-run coherence tool than giant flat context

`fork()` and subagent support show that branching work into child sessions keeps
 parent context smaller and clearer. That maps well to:

- one NPC delegating a focused task;
- one simulation thread spawning a scout thread;
- background memory consolidation workers.

## Compaction Lessons

### Compaction should be explicit and replayable

`session/compaction.ts` writes a real compaction message plus a summary assistant
 message. Replay then uses a summary plus a bounded recent raw tail.

This is one of the best transferable patterns for this repo.

For Minecraft, compaction should preserve:

- current mission;
- role and constraints;
- known world anchors;
- resources and inventories;
- recent failures;
- recent commitments;
- next few planned actions.

### Old bulky tool outputs should be pruned without deleting the fact they ran

`opencode` prunes old tool output content while keeping the tool transcript item.
 The Minecraft equivalent is:

- keep that `scan_area` or `pathfind` or `observe_world` happened;
- prune huge raw payloads after compaction;
- retain compact semantic result instead.

## What To Port Into This Repo

### Highest priority

1. Part-based transcript model.
2. Explicit tool lifecycle records.
3. Explicit compaction entries.
4. Summary + recent raw tail replay strategy.
5. Parent/child agent-thread relationships.

### Strong secondary imports

- separate run-state from durable state;
- derived event timeline projection;
- persisted todo/plan artifacts per session.

## What Not To Port

- code/worktree-specific diff assumptions;
- dual-write transitional complexity as a target architecture;
- provider quirks leaking into canonical domain transcript.

## Repo-Specific Recommendation

Use `opencode` as the message/transcript architecture reference. It is the best
 local model for how this repo should handle:

- long-running session coherence;
- tool transcript durability;
- compaction checkpoints;
- subagent branching.
