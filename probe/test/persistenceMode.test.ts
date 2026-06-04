/** Regression coverage for persistence-mode configuration semantics. */
import assert from "node:assert/strict";
import test from "node:test";

import { filterPartsForPersistence } from "../src/transcript/persistence/jsonTranscriptStore.js";
import type { CanonicalTranscriptPart } from "../src/transcript/canonical/transcriptParts.js";

const sampleParts: CanonicalTranscriptPart[] = [
  { kind: "observation", threadId: "thread:npc_a", turn: 1, actorId: "npc_a", data: { status: "ok" } },
  { kind: "tool_call", threadId: "thread:npc_a", turn: 1, actorId: "npc_a", tool: "collect_logs", args: {} },
  { kind: "tool_result", threadId: "thread:npc_a", turn: 1, actorId: "npc_a", tool: "collect_logs", result: { ok: true } },
  { kind: "chat_utterance", threadId: "thread:npc_a", turn: 1, actorId: "npc_a", text: "hello" },
  { kind: "checkpoint", threadId: "system", turn: 1, actorId: "system", summary: {} },
  { kind: "turn_context", threadId: "thread:npc_a", turn: 1, actorId: "npc_a", data: { lifecycleMode: "bootstrap" } }
];

test("extended persistence mode keeps all parts", () => {
  const filtered = filterPartsForPersistence(sampleParts, "extended");
  assert.equal(filtered.length, sampleParts.length);
});

test("limited persistence mode filters out raw observations", () => {
  const filtered = filterPartsForPersistence(sampleParts, "limited");
  assert.ok(filtered.length < sampleParts.length, "limited should filter some parts");
  assert.ok(!filtered.some((p) => p.kind === "observation"), "observations should be filtered in limited mode");
  assert.ok(filtered.some((p) => p.kind === "tool_call"), "tool_call should remain");
  assert.ok(filtered.some((p) => p.kind === "tool_result"), "tool_result should remain");
  assert.ok(filtered.some((p) => p.kind === "checkpoint"), "checkpoint should remain");
  assert.ok(filtered.some((p) => p.kind === "turn_context"), "turn_context should remain");
  assert.ok(filtered.some((p) => p.kind === "chat_utterance"), "chat should remain");
});
