/** Regression coverage for Actor Turn generated action skill authoring contracts. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  validateAuthorAndTrialActionSkillRequest,
  validateGeneratedActionSkillCandidate
} from "../src/skills/generated/authoringSchemas.js";
import { evaluateGeneratedActionSkillTrialVerifier } from "../src/skills/generated/verifierEvaluation.js";
import type { LegacyPlannerAction, GeneratedActionSkillCandidate } from "../src/runtime/goals/types.js";

function candidate(overrides: Partial<GeneratedActionSkillCandidate> = {}): GeneratedActionSkillCandidate {
  return {
    schema: "generated-action-skill-candidate/v1",
    proposed_skill_id: "saySharedStorageDone",
    purpose: "Say a concrete shared-storage completion message.",
    source_language: "typescript",
    source: "export async function run(ctx, params) { await ctx.say(params.text); return { status: 'said' }; }",
    input_schema: {
      type: "object",
      required: ["text"],
      additionalProperties: false,
      properties: { text: { type: "string" } }
    },
    helper_api_version: "mineflayer-action-skill-helper/v1",
    helper_allowlist: ["say"],
    timeout_ms: 5000,
    verifier: { kind: "helper_result_status", helper: "say", status: "delivered" },
    promotion_policy: "promote_after_passed_trial",
    known_failure_modes: ["chat helper unavailable"],
    ...overrides
  };
}

test("generated candidate accepts exact helper allowlist and schema-bound params", () => {
  const result = validateGeneratedActionSkillCandidate(candidate());

  assert.equal(result.ok, true);
});

test("generated candidate rejects unused helper allowlist entries", () => {
  const result = validateGeneratedActionSkillCandidate(
    candidate({ helper_allowlist: ["say", "observe"] })
  );

  assert.equal(result.ok, false);
  assert.ok(
    !result.ok &&
      result.errors.some((error) => error.includes("unused helper observe"))
  );
});

test("generated candidate rejects helper calls missing from allowlist", () => {
  const result = validateGeneratedActionSkillCandidate(
    candidate({
      source: "export async function run(ctx, params) { await ctx.say(params.text); await ctx.observe({}); return {}; }"
    })
  );

  assert.equal(result.ok, false);
  assert.ok(
    !result.ok &&
      result.errors.some((error) => error.includes("ctx.observe") && error.includes("helper_allowlist"))
  );
});

test("generated candidate rejects dummy input_schema parameters not read by source", () => {
  const result = validateGeneratedActionSkillCandidate(
    candidate({
      source: "export async function run(ctx, params) { await ctx.observe({}); return { status: 'checked' }; }",
      input_schema: {
        type: "object",
        required: ["dummy"],
        additionalProperties: false,
        properties: { dummy: { type: "integer" } }
      },
      helper_allowlist: ["observe"]
    })
  );

  assert.equal(result.ok, false);
  assert.ok(
    !result.ok &&
      result.errors.some((error) => error.includes("properties.dummy") && error.includes("not read"))
  );
});

test("author-and-trial intent rejects source reads for undeclared params", () => {
  const intent: LegacyPlannerAction = {
    schema: "legacy-planner-action/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    kind: "author_and_trial_action_skill",
    args: { text: "done" },
    parameters: { text: "done" },
    candidate: candidate({
      input_schema: {
        type: "object",
        required: [],
        additionalProperties: false,
        properties: {}
      }
    }),
    why_this_action: "Trial bounded chat helper.",
    expected_evidence: ["say helper event"],
    fallback_if_blocked: "record chat blocker"
  };

  const result = validateAuthorAndTrialActionSkillRequest(intent);

  assert.equal(result.ok, false);
  assert.ok(
    !result.ok &&
      result.errors.some((error) => error.includes("params.text") && error.includes("missing"))
  );
}
);

test("generated candidate rejects source reads for params omitted from required schema", () => {
  const result = validateGeneratedActionSkillCandidate(
    candidate({
      input_schema: {
        type: "object",
        required: [],
        additionalProperties: false,
        properties: { text: { type: "string" } }
      }
    })
  );

  assert.equal(result.ok, false);
  assert.ok(
    !result.ok &&
      result.errors.some((error) => error.includes("params.text") && error.includes("required"))
  );
});

test("generated verifier fails when helper result status does not match declaration", () => {
  const result = evaluateGeneratedActionSkillTrialVerifier({
    candidate: candidate({
      verifier: { kind: "helper_result_status", helper: "say", status: "stored" }
    }),
    runtimeResult: {
      status: "completed_with_evidence",
      helperEvents: [
        {
          name: "say",
          args: ["done"],
          status: "completed",
          result: { status: "delivered", text: "done" }
        }
      ],
      postObservation: { status: "ok", inventory: [] }
    }
  });

  assert.equal(result.status, "failed");
  assert.match(result.reason, /No completed helper say produced result.status=stored/);
});

test("generated verifier normalizes runtime-evidence alias only when helper progress exists", () => {
  const result = evaluateGeneratedActionSkillTrialVerifier({
    candidate: candidate({
      verifier: { kind: "runtime-evidence" }
    }),
    runtimeResult: {
      status: "completed_with_evidence",
      helperEvents: [
        {
          name: "placeBlock",
          status: "completed",
          result: { status: "placed", itemName: "oak_planks" }
        }
      ],
      postObservation: { status: "ok", inventory: [] }
    }
  });

  assert.equal(result.status, "passed");
  assert.equal(result.verifier_kind, "helper_event_progress");
  assert.match(result.reason, /runtime-evidence/);
});

test("generated verifier does not let unknown kind pass without helper progress", () => {
  const result = evaluateGeneratedActionSkillTrialVerifier({
    candidate: candidate({
      verifier: { kind: "unknown" }
    }),
    runtimeResult: {
      status: "completed_with_evidence",
      helperEvents: [
        {
          name: "observe",
          status: "completed",
          result: { status: "ok" }
        }
      ],
      postObservation: { status: "ok", inventory: [] }
    }
  });

  assert.equal(result.status, "failed");
  assert.equal(result.verifier_kind, "unknown");
  assert.match(result.reason, /Unsupported generated action skill verifier kind unknown/);
});
