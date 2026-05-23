import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOpenAiJsonPayload } from "../src/provider/normalizeOpenAiJsonPayload.js";

test("unwraps schema-shaped OpenAI payloads", () => {
  const normalized = normalizeOpenAiJsonPayload({
    type: "object",
    properties: {
      cycle_goal: { summary: "observe settlement pressure" }
    }
  });

  const cycleGoal = (normalized as { cycle_goal?: { summary: string } }).cycle_goal;
  assert.equal(cycleGoal?.summary, "observe settlement pressure");
});
