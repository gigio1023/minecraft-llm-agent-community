import assert from "node:assert/strict";
import { test } from "bun:test";

import { createCanonicalTranscript } from "../src/transcript/canonical/transcriptParts.js";
import { projectDebugTimeline } from "../src/transcript/projectors/debugTimeline.js";

test("canonical transcript projects turn_context parts in execution order", () => {
  const transcript = createCanonicalTranscript();

  transcript.append({
    kind: "observation",
    threadId: "thread:npc_a",
    turn: 1,
    actorId: "npc_a",
    data: { visibleActors: [{ id: "npc_b", distance: 2 }] }
  });
  transcript.append({
    kind: "turn_context",
    threadId: "thread:npc_a",
    turn: 1,
    actorId: "npc_a",
    data: {
      lifecycleMode: "bootstrap",
      selectedIntent: {
        id: "intent-1",
        kind: "bootstrap_progress",
        summary: "gather the first logs"
      }
    }
  });
  transcript.append({
    kind: "tool_call",
    threadId: "thread:npc_a",
    turn: 1,
    actorId: "npc_a",
    tool: "collect_logs",
    args: { targetCount: 4 }
  });

  assert.deepEqual(projectDebugTimeline(transcript.list("thread:npc_a")), [
    "1:npc_a:observation",
    "1:npc_a:turn_context",
    "1:npc_a:tool_call:collect_logs"
  ]);
});
