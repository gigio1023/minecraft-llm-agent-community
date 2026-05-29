import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOpenAiJsonPayload } from "../src/provider/normalizeOpenAiJsonPayload.js";
import { parseOpenAiJsonText } from "../src/provider/openaiApiJsonProvider.js";

test("unwraps schema-shaped OpenAI payloads", () => {
  const normalized = normalizeOpenAiJsonPayload({
    type: "object",
    properties: {
      cycle_goal: { summary: "observe settlement context" }
    }
  });

  const cycleGoal = (normalized as { cycle_goal?: { summary: string } }).cycle_goal;
  assert.equal(cycleGoal?.summary, "observe settlement context");
});

test("parses the first JSON value when a schema response duplicates the object", () => {
  const parsed = parseOpenAiJsonText<{ action_intent: { primitive_id: string } }>(
    '{"action_intent":{"primitive_id":"observe"}}\n{"action_intent":{"primitive_id":"wait"}}'
  );

  assert.equal(parsed.action_intent.primitive_id, "observe");
});
