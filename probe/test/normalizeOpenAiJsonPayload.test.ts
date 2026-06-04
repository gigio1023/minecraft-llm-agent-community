/** Regression coverage for normalizing provider JSON payload envelopes. */
import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOpenAiJsonPayload } from "../src/provider/normalizeOpenAiJsonPayload.js";
import {
  buildOpenAiJsonSchemaResponseRequest,
  normalizeOpenAiReasoningEffort,
  parseOpenAiJsonText
} from "../src/provider/openaiApiJsonProvider.js";
import {
  buildCycleJudgmentBodyFromPayload,
  extractCycleJudgmentPayload
} from "../src/provider/socialCycleJudgmentProvider.js";

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
    maxCompletionTokens: 32,
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

test("OpenAI reasoning effort normalization rejects unknown values", () => {
  assert.equal(normalizeOpenAiReasoningEffort(" xhigh "), "xhigh");
  assert.equal(normalizeOpenAiReasoningEffort("ultra"), undefined);
});

test("cycle judgment payload extraction accepts direct judgment objects", () => {
  const raw = extractCycleJudgmentPayload({
    outcome: "blocked",
    what_happened: "collect_logs timed out without inventory progress",
    why_it_mattered_for_life_goal: "The actor needs a truthful blocker before choosing the next step."
  });

  assert.equal(raw.outcome, "blocked");
  assert.equal(raw.what_happened, "collect_logs timed out without inventory progress");
});

test("cycle judgment payload preserves live provider PlanBead operation proposals", () => {
  const body = buildCycleJudgmentBodyFromPayload({
    outcome: "partial_verified_progress",
    what_happened: "The actor found logs but did not complete the full gather step.",
    why_it_mattered_for_life_goal: "The actor can continue from an evidence-backed blocker.",
    memory_writes: [],
    relationship_event_proposals: [],
    bead_op_proposals: [
      {
        schema: "plan-bead-operation/v1",
        actor_id: "npc_b",
        op: "set_status",
        bead_id: "bead-log-search",
        rationale: "The selected work item is now in active context.",
        evidence_refs: ["evidence/cycle-0001-observe.json"],
        confidence: "observed",
        patch: {
          status: "in_progress"
        }
      }
    ],
    next_goal_context: ["Continue from the selected work item."]
  }, "failed");

  const proposal = body.bead_op_proposals?.[0] as { op?: string; bead_id?: string } | undefined;
  assert.equal(body.verifier_status, "failed");
  assert.equal(proposal?.op, "set_status");
  assert.equal(proposal?.bead_id, "bead-log-search");
});
