/** Regression coverage for normalizing provider JSON payload envelopes. */
import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOpenAiJsonPayload } from "../src/provider/normalizeOpenAiJsonPayload.js";
import {
  buildOpenAiJsonSchemaResponseRequest,
  normalizeOpenAiReasoningEffort,
  parseOpenAiJsonText
} from "../src/provider/openaiApiJsonProvider.js";

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
  const parsed = parseOpenAiJsonText<{ selected_action: { primitive_id: string } }>(
    '{"selected_action":{"primitive_id":"observe"}}\n{"selected_action":{"primitive_id":"wait"}}'
  );

  assert.equal(parsed.selected_action.primitive_id, "observe");
});

test("OpenAI Responses JSON schema requests pass configured reasoning effort", () => {
  const request = buildOpenAiJsonSchemaResponseRequest({
    model: "gpt-5.4-nano",
    reasoning: "medium",
    background: true,
    schemaName: "tiny_schema",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean" }
      },
      required: ["ok"],
      additionalProperties: false
    },
    system: "Return JSON.",
    user: "Say ok."
  });

  assert.equal(request.reasoning?.effort, "medium");
  assert.equal(request.model, "gpt-5.4-nano");
  assert.equal(request.background, true);
  assert.equal(request.store, true);
  assert.deepEqual(request.text?.format, {
    type: "json_schema",
    name: "tiny_schema",
    strict: false,
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean" }
      },
      required: ["ok"],
      additionalProperties: false
    }
  });
});

test("OpenAI Responses JSON schema requests omit output cap", () => {
  const request = buildOpenAiJsonSchemaResponseRequest({
    model: "gpt-5.4-mini",
    reasoning: "low",
    background: false,
    schemaName: "tiny_schema",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean" }
      },
      required: ["ok"],
      additionalProperties: false
    },
    system: "Return JSON.",
    user: "Say ok."
  });

  assert.equal("max_output_tokens" in request, false);
});

test("OpenAI reasoning effort normalization rejects unknown values", () => {
  assert.equal(normalizeOpenAiReasoningEffort(" xhigh "), "xhigh");
  assert.equal(normalizeOpenAiReasoningEffort("ultra"), undefined);
});
