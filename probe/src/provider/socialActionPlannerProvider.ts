import { randomUUID } from "node:crypto";
import path from "node:path";

import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { ActionIntent, ActorCycleGoal } from "../runtime/goals/types.js";
import { validateActionIntent } from "../runtime/goals/types.js";
import { callOpenAiJsonSchema, type OpenAiJsonProviderConfig } from "./openaiApiJsonProvider.js";
import { normalizeOpenAiJsonPayload } from "./normalizeOpenAiJsonPayload.js";
import { asStringArray } from "./llmJsonArrays.js";
import { writeProviderInputSnapshot } from "./providerInputStore.js";
import { writeProviderOutputSnapshot } from "./providerOutputStore.js";
import type { JsonValue } from "./inputSnapshot.js";
import { writeActorGoalArtifact } from "../runtime/goals/goalJsonStore.js";

const actionPlannerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    action_intent: {
      type: "object",
      additionalProperties: false,
      properties: {
        kind: {
          type: "string",
          enum: ["use_action_skill", "use_primitive", "wait", "remember"]
        },
        action_skill_id: { type: "string" },
        primitive_id: { type: "string" },
        args: { type: "object" },
        why_this_action: { type: "string" },
        expected_evidence: { type: "array", items: { type: "string" } },
        fallback_if_blocked: { type: "string" }
      },
      required: ["kind", "why_this_action", "expected_evidence", "fallback_if_blocked", "args"]
    }
  },
  required: ["action_intent"]
} as const;

export type ActionPlannerProviderResult =
  | { ok: true; intent: ActionIntent; intentRef: string; inputRef: string; outputRef: string }
  | { ok: false; error: string; inputRef: string; outputRef: string };

export async function runSocialActionPlannerProvider(input: {
  providerId: "openai-api" | "deterministic-social";
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  cycleGoal: ActorCycleGoal;
  context: SocialCycleContextPacket;
  openAi?: OpenAiJsonProviderConfig;
  defaultPrimitive?: string;
}): Promise<ActionPlannerProviderResult> {
  const snapshotId = `action-planner-${input.cycleId}-${randomUUID()}`;
  const providerInput = {
    stage: "action_planner",
    ActorSoul: input.context.ActorSoul,
    ActorLifeGoal: input.context.ActorLifeGoal,
    cycle_goal: input.cycleGoal,
    observation: input.context.observation,
    owned_action_skills: input.context.owned_action_skills,
    allowed_primitive_ids: input.cycleGoal.allowed_primitive_ids,
    previous_cycle_judgments: input.context.previous_cycle_judgments
  } as JsonValue;

  const inputPath = await writeProviderInputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: snapshotId,
    actor_id: input.actorId,
    turn_id: input.cycleId,
    provider_id: input.providerId,
    model: input.openAi?.model ?? "deterministic-social",
    created_at: new Date().toISOString(),
    input: providerInput
  });

  let intent: ActionIntent;

  if (input.providerId === "deterministic-social") {
    const primitive = input.defaultPrimitive ?? "observe";
    intent = {
      schema: "action-intent/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      cycle_goal_id: input.cycleGoal.goal_id,
      kind: "use_primitive",
      primitive_id: primitive,
      args: primitive === "wait" ? { ticks: 20 } : primitive === "remember" ? { note: "cycle baseline" } : {},
      why_this_action: "Deterministic-social baseline observes before acting.",
      expected_evidence: ["tool_attempt"],
      fallback_if_blocked: "remember blockage with evidence"
    };
  } else {
    const result = await callOpenAiJsonSchema<{
      action_intent: {
        kind: ActionIntent["kind"];
        action_skill_id?: string;
        primitive_id?: string;
        args: Record<string, unknown>;
        why_this_action: string;
        expected_evidence: string[];
        fallback_if_blocked: string;
      };
    }>({
      config: input.openAi!,
      schemaName: "social_action_planner",
      schema: actionPlannerSchema,
      system: `You plan one bounded ActionIntent for the active CycleGoal.
ActorSoul and ActorLifeGoal are fixed context. use_action_skill executes every required_primitive in order as one bundle.
Prefer use_primitive when a single allowed primitive is enough. Do not pick an action skill if its primitives are not all allowed. JSON only.`,
      user: JSON.stringify(providerInput)
    });

    if (!result.ok) {
      const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
        schema: "provider-output-snapshot/v1",
        snapshot_id: `${snapshotId}-out`,
        actor_id: input.actorId,
        turn_id: input.cycleId,
        provider_id: input.providerId,
        model: result.model,
        created_at: new Date().toISOString(),
        raw_output_text: result.rawText ?? "",
        parsed_output: { error: result.message },
        proposal: { error: result.message }
      });
      return { ok: false, error: result.message, inputRef: inputPath, outputRef: outputPath };
    }

    const payload = normalizeOpenAiJsonPayload(result.parsed as Record<string, unknown>);
    const actionIntent = payload.action_intent as {
      kind: ActionIntent["kind"];
      action_skill_id?: string;
      primitive_id?: string;
      args: Record<string, unknown>;
      why_this_action: string;
      expected_evidence: string[];
      fallback_if_blocked: string;
    };
    intent = {
      schema: "action-intent/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      cycle_goal_id: input.cycleGoal.goal_id,
      kind: actionIntent.kind,
      action_skill_id: actionIntent.action_skill_id,
      primitive_id: actionIntent.primitive_id,
      args: actionIntent.args ?? {},
      why_this_action: actionIntent.why_this_action,
      expected_evidence: asStringArray(actionIntent.expected_evidence),
      fallback_if_blocked: actionIntent.fallback_if_blocked
    };
  }

  const validated = validateActionIntent(intent);
  if (!validated.ok) {
    return {
      ok: false,
      error: validated.errors.join("; "),
      inputRef: inputPath,
      outputRef: ""
    };
  }

  const { ref: intentRef, filePath } = await writeActorGoalArtifact(
    input.actorWorkspaceRootDir,
    input.actorId,
    path.join("goals", "cycle", "intents"),
    `${input.cycleId}-intent`,
    validated.intent
  );

  const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: input.cycleId,
    provider_id: input.providerId,
    model: input.openAi?.model ?? "deterministic-social",
    created_at: new Date().toISOString(),
    raw_output_text: JSON.stringify(validated.intent),
    parsed_output: validated.intent as unknown as JsonValue,
    proposal: { action_intent_ref: intentRef }
  });

  return {
    ok: true,
    intent: validated.intent,
    intentRef,
    inputRef: inputPath,
    outputRef: outputPath
  };
}
