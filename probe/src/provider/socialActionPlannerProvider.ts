import { randomUUID } from "node:crypto";
import path from "node:path";

import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { ActionIntent, ActorCycleGoal, GeneratedActionSkillCandidate } from "../runtime/goals/types.js";
import { actionIntentParameters, validateActionIntent } from "../runtime/goals/types.js";
import { validateDirectPrimitiveActionIntentArgs } from "../runtime/goals/actionIntentContracts.js";
import { callOpenAiJsonSchema, type OpenAiJsonProviderConfig } from "./openaiApiJsonProvider.js";
import { callGeminiJsonSchema, type GeminiJsonProviderConfig } from "./geminiApiJsonProvider.js";
import { normalizeOpenAiJsonPayload } from "./normalizeOpenAiJsonPayload.js";
import { asStringArray } from "./llmJsonArrays.js";
import { writeProviderInputSnapshot } from "./providerInputStore.js";
import { writeProviderOutputSnapshot } from "./providerOutputStore.js";
import type { JsonValue } from "./inputSnapshot.js";
import type { ProviderUsageRecord } from "./providerUsageTracker.js";
import { writeActorGoalArtifact } from "../runtime/goals/goalJsonStore.js";
import { isSocialExecutablePrimitive } from "../runtime/socialCycleExecution.js";
import { buildActionPlannerProviderInput } from "./socialCycleProviderInputs.js";
import { validateAuthorAndTrialActionSkillIntent } from "../skills/generated/authoringSchemas.js";

const generatedActionSkillCandidateSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    schema: { type: "string", enum: ["generated-action-skill-candidate/v1"] },
    proposed_skill_id: { type: "string" },
    purpose: { type: "string" },
    source_language: { type: "string", enum: ["typescript"] },
    source: { type: "string" },
    input_schema: { type: "object" },
    helper_api_version: { type: "string", enum: ["mineflayer-action-skill-helper/v1"] },
    helper_allowlist: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "position",
          "inventoryItems",
          "observe",
          "wait",
          "collectLogs",
          "mineBlock",
          "craftItem",
          "craftWithTable",
          "consumeItem",
          "placeBlock",
          "buildPattern",
          "say",
          "mineflayer"
        ]
      }
    },
    timeout_ms: { type: "number" },
    verifier: { type: "object" },
    promotion_policy: {
      type: "string",
      enum: ["record_candidate_only", "promote_after_passed_trial"]
    },
    known_failure_modes: { type: "array", items: { type: "string" } }
  },
  required: [
    "schema",
    "proposed_skill_id",
    "purpose",
    "source_language",
    "source",
    "input_schema",
    "helper_api_version",
    "helper_allowlist",
    "timeout_ms",
    "verifier",
    "promotion_policy",
    "known_failure_modes"
  ]
} as const;

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
          enum: [
            "use_action_skill",
            "use_primitive",
            "author_and_trial_action_skill",
            "wait",
            "remember"
          ]
        },
        action_skill_id: { type: "string" },
        primitive_id: { type: "string" },
        args: { type: "object" },
        parameters: { type: "object" },
        parameters_schema: { type: "object" },
        candidate: generatedActionSkillCandidateSchema,
        why_this_action: { type: "string" },
        expected_evidence: { type: "array", items: { type: "string" } },
        fallback_if_blocked: { type: "string" }
      },
      required: ["kind", "why_this_action", "expected_evidence", "fallback_if_blocked", "parameters"]
    }
  },
  required: ["action_intent"]
} as const;

export type ActionPlannerProviderResult =
  | { ok: true; intent: ActionIntent; intentRef: string; inputRef: string; outputRef: string }
  | { ok: false; error: string; inputRef: string; outputRef: string };

type ProviderActionIntentPayload = {
  kind: ActionIntent["kind"];
  action_skill_id?: string;
  primitive_id?: string;
  args?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  parameters_schema?: Record<string, unknown>;
  candidate?: GeneratedActionSkillCandidate;
  why_this_action: string;
  expected_evidence: string[];
  fallback_if_blocked: string;
};

function executableOwnedActionSkills(context: SocialCycleContextPacket) {
  const directPrimitiveIds = new Set(
    context.action_surface.direct_primitives.map((primitive) => primitive.primitive_id)
  );
  return context.owned_action_skills.filter((skill) =>
    skill.required_primitives.length > 0 &&
    skill.required_primitives.every((primitive) =>
      isSocialExecutablePrimitive(primitive) && directPrimitiveIds.has(primitive)
    )
  );
}

/**
 * Mirrors the direct action surface into CycleGoal fields kept for schema
 * compatibility. CycleGoal text guides intent, but the actor body comes from
 * action_surface plus runtime gates rather than an LLM-authored narrow allowlist.
 */
function cycleGoalWithOpenActionBody(
  cycleGoal: ActorCycleGoal,
  context: SocialCycleContextPacket
): ActorCycleGoal {
  const allowedPrimitiveIds = context.action_surface.direct_primitives
    .map((primitive) => primitive.primitive_id)
    .filter(isSocialExecutablePrimitive);
  const ownedSkillIds = executableOwnedActionSkills(context).map((skill) => skill.skill_id);
  return {
    ...cycleGoal,
    allowed_primitive_ids: allowedPrimitiveIds,
    allowed_action_skill_ids: ownedSkillIds
  };
}

function directActionSkillSurface(
  context: SocialCycleContextPacket,
  ownedActionSkills: readonly { skill_id: string }[]
) {
  const ownedSkillIds = new Set(ownedActionSkills.map((skill) => skill.skill_id));
  return context.action_surface.direct_action_skills.filter((skill) =>
    ownedSkillIds.has(skill.action_skill_id)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasDirectPrimitiveActionSkillFallback(intent: ActionIntent) {
  const parameters = actionIntentParameters(intent);
  return Boolean(
    intent.action_skill_id ||
      (typeof parameters.actionSkillId === "string" && parameters.actionSkillId.trim()) ||
      (typeof parameters.action_skill_id === "string" && parameters.action_skill_id.trim())
  );
}

/** Performs the final provider-output guard before an intent is persisted. */
function validateExecutableIntent(
  intent: ActionIntent,
  cycleGoal: ActorCycleGoal
): string | null {
  if (intent.kind === "use_primitive") {
    if (!intent.primitive_id || !cycleGoal.allowed_primitive_ids.includes(intent.primitive_id)) {
      return `Primitive ${intent.primitive_id ?? "<missing>"} is not executable in this social cycle`;
    }
    if (hasDirectPrimitiveActionSkillFallback(intent)) {
      return "Direct primitive intents cannot carry action_skill_id or args.actionSkillId; use use_action_skill for actor-owned action skill execution";
    }
    const argsContract = validateDirectPrimitiveActionIntentArgs(intent);
    if (!argsContract.ok) {
      return `ActionIntent parameters contract failed: ${argsContract.error}`;
    }
  }

  if (intent.kind === "use_action_skill") {
    if (
      !intent.action_skill_id ||
      !cycleGoal.allowed_action_skill_ids.includes(intent.action_skill_id)
    ) {
      return `Action skill ${intent.action_skill_id ?? "<missing>"} is not executable in this social cycle`;
    }
  }

  if (intent.kind === "author_and_trial_action_skill") {
    if (!cycleGoal.allowed_primitive_ids.includes("run_mineflayer_program")) {
      return "author_and_trial_action_skill requires run_mineflayer_program in the executable action surface";
    }
    const candidateContract = validateAuthorAndTrialActionSkillIntent(intent);
    if (!candidateContract.ok) {
      return `Generated action skill candidate contract failed: ${candidateContract.errors.join("; ")}`;
    }
  }

  return null;
}

/**
 * Produces one bounded ActionIntent and stores both provider input and output.
 *
 * @remarks The provider sees the action surface, but runtime verification and
 * active action skill gates still decide what can execute.
 */
export async function runSocialActionPlannerProvider(input: {
  providerId: "openai-api" | "gemini-api" | "deterministic-social";
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  cycleGoal: ActorCycleGoal;
  context: SocialCycleContextPacket;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  defaultPrimitive?: string;
  turnId?: string;
  actionIndex?: number;
  recentActionAttempts?: JsonValue;
  runId?: string;
}): Promise<ActionPlannerProviderResult> {
  const turnId = input.turnId ?? input.cycleId;
  const snapshotId = `action-planner-${turnId}-${randomUUID()}`;
  const plannerCycleGoal = cycleGoalWithOpenActionBody(input.cycleGoal, input.context);
  const ownedActionSkills = executableOwnedActionSkills(input.context);
  const directActionSkills = directActionSkillSurface(input.context, ownedActionSkills);
  const runtimeAffordances = input.context.action_surface.direct_primitives
    .filter((primitive) =>
      plannerCycleGoal.allowed_primitive_ids.includes(primitive.primitive_id)
    )
    .map((primitive) => ({
      primitive_id: primitive.primitive_id,
      description: primitive.description,
      args_contract: primitive.args_contract
    }));
  const providerInput = buildActionPlannerProviderInput({
    context: input.context,
    turnId,
    actionIndex: input.actionIndex,
    cycleGoal: input.cycleGoal,
    plannerCycleGoal,
    directActionSkills: directActionSkills as unknown as JsonValue,
    runtimeAffordances: runtimeAffordances as unknown as JsonValue,
    recentActionAttempts: input.recentActionAttempts
  });

  const inputPath = await writeProviderInputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: snapshotId,
    actor_id: input.actorId,
    turn_id: turnId,
    provider_id: input.providerId,
    model: input.openAi?.model ?? input.gemini?.model ?? "deterministic-social",
    created_at: new Date().toISOString(),
    input: providerInput
  });

  let intent: ActionIntent;
  let usageRecord: ProviderUsageRecord | undefined;

  if (input.providerId === "deterministic-social") {
    const primitive = input.defaultPrimitive ?? "observe";
    const parameters = primitive === "wait"
      ? { ticks: 20 }
      : primitive === "remember"
        ? { note: "cycle baseline" }
        : {};
    intent = {
      schema: "action-intent/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      cycle_goal_id: plannerCycleGoal.goal_id,
      kind: "use_primitive",
      primitive_id: primitive,
      args: parameters,
      parameters,
      why_this_action: "Deterministic-social baseline observes before acting.",
      expected_evidence: ["tool_attempt"],
      fallback_if_blocked: "remember blockage with evidence"
    };
  } else {
    const providerCall = {
      schemaName: "social_action_planner",
      schema: actionPlannerSchema,
      system: `You plan one bounded ActionIntent for the active CycleGoal.
ActorSoul and ActorLifeGoal are fixed context. The actor cares about social consequences according to its soul and relationships, but ordinary Minecraft actions do not need forced social framing.
Select from runtime_affordances and direct_action_skills based on live observation, query-neutral world-state evidence, memory_packet, relationship_context, world_events, previous judgments, and recent attempts. action_surface_summary explains the actor's current body shape; it is not a strategy checklist.
plan_bead_packet is read-only work-state context for continuity. If ready or in_progress beads exist, use them to avoid forgetting unfinished work, but current observation, action_surface_summary, runtime_retry_constraints, and ActorLifeGoal can still justify a pivot. PlanBeads never add executable args, action permissions, physical success, or a requirement to follow a checklist.
Observation is raw evidence. Decide what matters from those facts yourself; do not treat every visible fact as a command.
Vitals and food candidates are observation fields, not runtime priorities. If consuming food is useful, choose consume_item with an explicit itemName from inventory evidence.
Deferred primitives or action skills explain missing affordances; do not choose them in this ActionIntent. Direct primitives and direct action skills are the executable body for this turn.
Mineflayer expansion opportunities show where the actor body can grow through bounded runtime adapters or action skill candidates. They are not ordinary executable actions until the selected ActionIntent is author_and_trial_action_skill.
Use author_and_trial_action_skill when the best next step needs a new actor-owned generated action skill candidate. This is the only social-cycle stage that may originate a new generated action skill candidate. Put executable inputs in parameters, define candidate.input_schema as a JSON object schema for those parameters, and put the complete TypeScript source in candidate.source. The source must export async function run(ctx, params) and use the helper API declared in candidate.helper_allowlist. Keep helper code active and concrete; prefer actual Mineflayer helper calls over returning descriptive text.
Do not create generated candidates from judgment, PlanBeads, memory, or reviewer text. Those surfaces may review, patch, retry, retire, or promote an existing candidate, but origin authority belongs to this ActionIntent.
Use use_primitive run_mineflayer_program only for legacy one-off direct program execution when you are not trying to create an actor-owned candidate. For reusable behavior, choose author_and_trial_action_skill instead.
Treat CycleGoal allowed_* lists as compatibility mirrors/advisory context. They must not shrink the action surface; runtime_affordances and direct_action_skills define what can be selected.
If a physical action just failed, inspect its runtime_result and do not repeat it blindly; choose a different valid affordance based on the current action surface and evidence.
runtime_retry_constraints are hard runtime suppressions over exact target plus structured args. Do not choose an ActionIntent that matches one; pivot to a different valid affordance, repair the structured args, observe current state, or record a truthful blocker.
Do not treat fixed material families, stations, construction readiness, or any other gameplay taxonomy as mandatory planning headings. Use raw observed Minecraft names and runtime evidence; decide relevance from the current CycleGoal.
Use settlement_state and blocker_histogram as observation/evidence/context packets before choosing an action. They are not a mandatory single-domain strategy.
If blocker_histogram shows the same blocked reason repeatedly, pivot to a different action skill, movement, observation, or a truthful memory/judgment instead of repeating the same primitive.
If a ready PlanBead points at a blocker or action-skill followup, choose an executable affordance that repairs or investigates it; if no such affordance is currently valid, pick observe, movement, or a truthful memory action instead of pretending the bead is executable.
remember is a continuity tool, not a substitute for acting. After a blocker has already been remembered once, do not keep selecting remember for the same blocker; choose fresh observation, a different reachable target, another useful action, or let judgment defer/update the PlanBead.
If a primitive reports a concrete required position in runtime_result, use structured move_to toward that explicit position or observe current state before retrying. Do not retry the same primitive from outside its reported interaction range.
Building primitives such as build_pattern are ordinary affordances. Use them only when the current CycleGoal, WorldEvents, observation, or memory makes building relevant; never treat a construction target as always-on architecture.
use_action_skill executes every required_primitive in order as one verifier-checked bundle; prefer use_primitive when a single runtime affordance is enough. Prefer author_and_trial_action_skill when code generation should become an actor-owned candidate with source, schema, parameters, helper events, result, and post-observation attached to actor workspace artifacts.
Do not claim success through text. Pick actions whose evidence can be verified by runtime outputs. JSON only.`,
      user: JSON.stringify(providerInput),
      usageContext: {
        runId: input.runId,
        actorId: input.actorId,
        turnId,
        stage: "action_planner"
      }
    };
    const result = input.providerId === "gemini-api" ? await callGeminiJsonSchema<{
      action_intent: ProviderActionIntentPayload;
    }>({
      config: input.gemini!,
      ...providerCall
    }) : await callOpenAiJsonSchema<{
      action_intent: ProviderActionIntentPayload;
    }>({
      config: input.openAi!,
      ...providerCall
    });

    if (!result.ok) {
      const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
        schema: "provider-output-snapshot/v1",
        snapshot_id: `${snapshotId}-out`,
        actor_id: input.actorId,
        turn_id: turnId,
        provider_id: input.providerId,
        model: result.model,
        created_at: new Date().toISOString(),
        raw_output_text: result.rawText ?? "",
        parsed_output: {
          error: result.message,
          error_kind: result.errorKind,
          budget_decision: result.budgetDecision as unknown as JsonValue
        },
        proposal: { error: result.message },
        usage: result.usageRecord
      });
      return { ok: false, error: result.message, inputRef: inputPath, outputRef: outputPath };
    }

    const payload = normalizeOpenAiJsonPayload(result.parsed as Record<string, unknown>);
    usageRecord = result.usageRecord;
    const actionIntent = payload.action_intent as ProviderActionIntentPayload;
    const parameters = isRecord(actionIntent.parameters)
      ? actionIntent.parameters
      : isRecord(actionIntent.args)
        ? actionIntent.args
        : {};
    intent = {
      schema: "action-intent/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      cycle_goal_id: plannerCycleGoal.goal_id,
      kind: actionIntent.kind,
      action_skill_id: actionIntent.action_skill_id,
      primitive_id: actionIntent.primitive_id,
      args: parameters,
      parameters,
      ...(isRecord(actionIntent.parameters_schema)
        ? { parameters_schema: actionIntent.parameters_schema }
        : {}),
      ...(isRecord(actionIntent.candidate) ? { candidate: actionIntent.candidate } : {}),
      why_this_action: actionIntent.why_this_action,
      expected_evidence: asStringArray(actionIntent.expected_evidence),
      fallback_if_blocked: actionIntent.fallback_if_blocked
    };
  }

  const validated = validateActionIntent(intent);
  if (!validated.ok) {
    const error = validated.errors.join("; ");
    const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: turnId,
      provider_id: input.providerId,
      model: input.openAi?.model ?? input.gemini?.model ?? "deterministic-social",
      created_at: new Date().toISOString(),
      raw_output_text: JSON.stringify(intent),
      parsed_output: {
        error,
        candidate_intent: intent as unknown as JsonValue
      },
      proposal: { error },
      usage: usageRecord
    });
    return {
      ok: false,
      error,
      inputRef: inputPath,
      outputRef: outputPath
    };
  }

  const executableError = validateExecutableIntent(validated.intent, plannerCycleGoal);
  if (executableError) {
    const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: turnId,
      provider_id: input.providerId,
      model: input.openAi?.model ?? input.gemini?.model ?? "deterministic-social",
      created_at: new Date().toISOString(),
      raw_output_text: JSON.stringify(validated.intent),
      parsed_output: {
        error: executableError,
        candidate_intent: validated.intent as unknown as JsonValue
      },
      proposal: { error: executableError },
      usage: usageRecord
    });
    return {
      ok: false,
      error: executableError,
      inputRef: inputPath,
      outputRef: outputPath
    };
  }

  const { ref: intentRef } = await writeActorGoalArtifact(
    input.actorWorkspaceRootDir,
    input.actorId,
    path.join("goals", "cycle", "intents"),
    `${turnId}-intent`,
    validated.intent
  );

  const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: turnId,
    provider_id: input.providerId,
    model: input.openAi?.model ?? input.gemini?.model ?? "deterministic-social",
    created_at: new Date().toISOString(),
    raw_output_text: JSON.stringify(validated.intent),
    parsed_output: validated.intent as unknown as JsonValue,
    proposal: { action_intent_ref: intentRef },
    usage: usageRecord
  });

  return {
    ok: true,
    intent: validated.intent,
    intentRef,
    inputRef: inputPath,
    outputRef: outputPath
  };
}
