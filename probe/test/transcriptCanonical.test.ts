import assert from "node:assert/strict";
import test from "node:test";

import { createCanonicalTranscript } from "../src/transcript/canonical/transcriptParts.js";
import { projectDebugTimeline } from "../src/transcript/projectors/debugTimeline.js";

test("canonical transcript appends durable parts in execution order and isolates later mutation", () => {
  const transcript = createCanonicalTranscript();
  const args = { target: "npc_b" };

  transcript.append({
    kind: "observation",
    threadId: "thread:npc_a",
    turn: 1,
    actorId: "npc_a",
    data: { visibleActors: [{ id: "npc_b", distance: 2 }] }
  });
  transcript.append({
    kind: "tool_call",
    threadId: "thread:npc_a",
    turn: 1,
    actorId: "npc_a",
    tool: "move_to",
    args
  });
  transcript.append({
    kind: "tool_result",
    threadId: "thread:npc_a",
    turn: 1,
    actorId: "npc_a",
    tool: "move_to",
    result: { status: "arrived" }
  });

  args.target = "mutated";

  const parts = transcript.list("thread:npc_a");
  assert.deepEqual(parts.map((part) => part.kind), ["observation", "tool_call", "tool_result"]);
  assert.deepEqual(parts[1], {
    kind: "tool_call",
    threadId: "thread:npc_a",
    turn: 1,
    actorId: "npc_a",
    tool: "move_to",
    args: { target: "npc_b" }
  });
  assert.deepEqual(projectDebugTimeline(parts), [
    "1:npc_a:observation",
    "1:npc_a:tool_call:move_to",
    "1:npc_a:tool_result:move_to"
  ]);
});
