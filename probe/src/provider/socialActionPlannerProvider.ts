import { randomUUID } from "node:crypto";
import path from "node:path";

import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { LegacyPlannerAction, ActorCycleGoal, GeneratedActionSkillCandidate } from "../runtime/goals/types.js";
import { legacyPlannerActionParameters, validateLegacyPlannerAction } from "../runtime/goals/types.js";
import { validateDirectPrimitiveLegacyPlannerActionParameters } from "../runtime/goals/actionParameterContracts.js";
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
import { validateAuthorAndTrialActionSkillRequest } from "../skills/generated/authoringSchemas.js";

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
      enum: ["promote_after_passed_trial"]
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

const MAX_LEGACY_PLANNER_ACTION_REGENERATION_ATTEMPTS = 2;
const DEFAULT_ACTION_PLANNER_MAX_COMPLETION_TOKENS = 4096;

const REPAIRABLE_LEGACY_PLANNER_ACTION_METADATA_ERRORS = new Set([
  "why_this_action must be a non-empty string",
  "fallback_if_blocked must be a non-empty string"
]);

const actionPlannerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    legacy_planner_action: {
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
  required: ["legacy_planner_action"]
} as const;

export type ActionPlannerProviderResult =
  | {
      ok: true;
      legacyPlannerAction: LegacyPlannerAction;
      legacyPlannerActionRef: string;
      inputRef: string;
      outputRef: string;
    }
  | { ok: false; error: string; inputRef: string; outputRef: string };

type ProviderLegacyPlannerActionPayload = {
  kind: LegacyPlannerAction["kind"];
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

function optionalPositiveInteger(value: string | undefined) {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function openAiConfigForActionPlanner(config: OpenAiJsonProviderConfig) {
  const stageCap =
    optionalPositiveInteger(process.env.SOCIAL_ACTION_PLANNER_MAX_COMPLETION_TOKENS) ??
    DEFAULT_ACTION_PLANNER_MAX_COMPLETION_TOKENS;
  return {
    ...config,
    maxCompletionTokens: Math.max(config.maxCompletionTokens ?? 0, stageCap)
  };
}

function hasDirectPrimitiveActionSkillFallback(intent: LegacyPlannerAction) {
  const parameters = legacyPlannerActionParameters(intent);
  return Boolean(
    intent.action_skill_id ||
      (typeof parameters.actionSkillId === "string" && parameters.actionSkillId.trim()) ||
      (typeof parameters.action_skill_id === "string" && parameters.action_skill_id.trim())
  );
}

function legacyPlannerActionTargetLabel(intent: LegacyPlannerAction) {
  if (intent.kind === "use_primitive") {
    return `primitive ${intent.primitive_id ?? "<missing>"}`;
  }
  if (intent.kind === "use_action_skill") {
    return `action skill ${intent.action_skill_id ?? "<missing>"}`;
  }
  if (intent.kind === "author_and_trial_action_skill") {
    return "generated action skill trial";
  }
  return intent.kind;
}

export function repairNonExecutableLegacyPlannerActionMetadata(input: {
  intent: LegacyPlannerAction;
  errors: readonly string[];
}): { intent: LegacyPlannerAction; repairs: JsonValue[] } | null {
  if (
    input.errors.length === 0 ||
    !input.errors.every((error) => REPAIRABLE_LEGACY_PLANNER_ACTION_METADATA_ERRORS.has(error))
  ) {
    return null;
  }

  const repairs: JsonValue[] = [];
  const intent = { ...input.intent };
  const target = legacyPlannerActionTargetLabel(intent);

  if (typeof intent.why_this_action !== "string" || intent.why_this_action.trim().length === 0) {
    intent.why_this_action =
      `Provider omitted why_this_action after guided regeneration; continuing with structured ${target} intent because runtime args and gates still validate.`;
    repairs.push({
      field: "why_this_action",
      reason: "provider omitted non-executable metadata after guided regeneration",
      value: intent.why_this_action
    });
  }

  if (
    typeof intent.fallback_if_blocked !== "string" ||
    intent.fallback_if_blocked.trim().length === 0
  ) {
    intent.fallback_if_blocked =
      "If blocked, record the runtime blocker and let the next cycle choose from fresh evidence.";
    repairs.push({
      field: "fallback_if_blocked",
      reason: "provider omitted non-executable metadata after guided regeneration",
      value: intent.fallback_if_blocked
    });
  }

  return repairs.length > 0 ? { intent, repairs } : null;
}

/** Performs the final provider-output guard before an intent is persisted. */
function validateExecutableIntent(
  intent: LegacyPlannerAction,
  cycleGoal: ActorCycleGoal
): string | null {
  if (intent.kind === "use_primitive") {
    if (!intent.primitive_id || !cycleGoal.allowed_primitive_ids.includes(intent.primitive_id)) {
      return `Primitive ${intent.primitive_id ?? "<missing>"} is not executable in this social cycle`;
    }
    if (hasDirectPrimitiveActionSkillFallback(intent)) {
      return "Direct primitive intents cannot carry action_skill_id or args.actionSkillId; use use_action_skill for actor-owned action skill execution";
    }
    const argsContract = validateDirectPrimitiveLegacyPlannerActionParameters(intent);
    if (!argsContract.ok) {
      return `LegacyPlannerAction parameters contract failed: ${argsContract.error}`;
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
    const candidateContract = validateAuthorAndTrialActionSkillRequest(intent);
    if (!candidateContract.ok) {
      return `Generated action skill candidate contract failed: ${candidateContract.errors.join("; ")}`;
    }
  }

  return null;
}

export function shouldRegenerateLegacyPlannerAction(intent: LegacyPlannerAction, error: string) {
  if (
    error.includes("why_this_action") ||
    error.includes("fallback_if_blocked") ||
    error.includes("expected_evidence")
  ) {
    return true;
  }

  if (
    intent.kind === "author_and_trial_action_skill" &&
    error.startsWith("Generated action skill candidate contract failed:")
  ) {
    return true;
  }

  return (
    intent.kind === "use_primitive" &&
    error.startsWith("LegacyPlannerAction parameters contract failed:")
  ) ||
    error.startsWith("Primitive ") ||
    error.startsWith("Action skill ");
}

export function buildLegacyPlannerActionRegenerationGuidance(input: {
  error: string;
  rejectedIntent: LegacyPlannerAction;
}) {
  return {
    schema: "action-planner-regeneration-guidance/v1",
    reason:
      "The previous LegacyPlannerAction was rejected before execution. Generate one corrected replacement LegacyPlannerAction now.",
    rejected_error: input.error,
    rejected_intent: input.rejectedIntent as unknown as JsonValue,
    rules: {
      fix_the_reported_error_directly: true,
      use_runtime_affordance_args_contract: true,
      parameters_must_satisfy_selected_action_contract: true,
      do_not_repeat_blocked_source_or_helper_shape: true,
      source_must_export_async_run_ctx_params: true,
      source_must_not_use_import_require_process_eval_function_fs_net_http_or_obvious_infinite_loops: true,
      helper_allowlist_must_include_every_ctx_helper_called_by_source: true,
      parameters_must_match_candidate_input_schema: true,
      promotion_policy_must_be_promote_after_passed_trial: true
    }
  };
}

/**
 * Produces one bounded LegacyPlannerAction and stores both provider input and output.
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
  regenerationAttempt?: number;
  regenerationGuidance?: JsonValue;
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
  const baseProviderInput = buildActionPlannerProviderInput({
    context: input.context,
    turnId,
    actionIndex: input.actionIndex,
    cycleGoal: input.cycleGoal,
    plannerCycleGoal,
    directActionSkills: directActionSkills as unknown as JsonValue,
    runtimeAffordances: runtimeAffordances as unknown as JsonValue,
    recentActionAttempts: input.recentActionAttempts
  });
  const providerInput =
    input.regenerationGuidance &&
    typeof baseProviderInput === "object" &&
    baseProviderInput !== null &&
    !Array.isArray(baseProviderInput)
      ? ({
          ...baseProviderInput,
          regeneration_guidance: input.regenerationGuidance
        } as JsonValue)
      : baseProviderInput;

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

  let intent: LegacyPlannerAction;
  let usageRecord: ProviderUsageRecord | undefined;

  if (input.providerId === "deterministic-social") {
    const primitive = input.defaultPrimitive ?? "observe";
    const parameters = primitive === "wait"
      ? { ticks: 20 }
      : primitive === "remember"
        ? { note: "cycle baseline" }
        : {};
    intent = {
      schema: "legacy-planner-action/v1",
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
      system: `You plan one bounded LegacyPlannerAction for the active CycleGoal.
ActorSoul and ActorLifeGoal are fixed context. The actor cares about social consequences according to its soul and relationships, but ordinary Minecraft actions do not need forced social framing.
Select from runtime_affordances and direct_action_skills based on live observation, query-neutral world-state evidence, memory_packet, relationship_context, world_events, previous judgments, candidate_action_skill_search, and recent attempts. action_surface_summary explains the actor's current body shape; it is not a strategy checklist.
plan_bead_packet is read-only work-state context for continuity. If ready or in_progress beads exist, use them to avoid forgetting unfinished work, but current observation, action_surface_summary, runtime_retry_constraints, and ActorLifeGoal can still justify a pivot. PlanBeads never add executable args, action permissions, physical success, or a requirement to follow a checklist.
Observation is raw evidence. Decide what matters from those facts yourself; do not treat every visible fact as a command.
minecraft_basic_guide is an always-visible Minecraft mechanics guide. Follow the full packet when choosing structured parameters: known_item_flows name concrete prerequisite chains, station_requirements define when inventory crafting is insufficient, blocked_recovery_guides map runtime blocker text to the next executable repair, observe_stop_guides limit repeated observation, coordinates are block cells, scans are bounded loaded-world evidence, and place_block targetPosition is the cell to occupy, not the solid floor block.
Vitals and food candidates are observation fields, not runtime priorities. If consuming food is useful, choose consume_item with an explicit itemName from inventory evidence.
Deferred primitives or action skills explain missing affordances; do not choose them in this LegacyPlannerAction. Direct primitives and direct action skills are the executable body for this turn.
Mineflayer expansion opportunities show where the actor body can grow through bounded runtime adapters or action skill candidates. They are not ordinary executable actions until the selected LegacyPlannerAction is author_and_trial_action_skill.
candidate_action_skill_search is read-only history for prior generated candidates; it can inform whether to reuse an active skill, author a better candidate, or avoid repeating a failed shape. It is visible only in this action-selection stage.
Use author_and_trial_action_skill when the best next step needs a new actor-owned generated action skill. This is the only social-cycle stage that may originate a new generated action skill candidate. Put executable inputs in parameters, define candidate.input_schema as a JSON object schema for those parameters, and put the complete TypeScript source in candidate.source. The source must export async function run(ctx, params) and use the helper API declared in candidate.helper_allowlist. Set candidate.promotion_policy to promote_after_passed_trial. A passed trial is stored as an active actor-owned action skill for later use_action_skill turns; a failed trial remains candidate evidence. Keep helper code active and concrete; prefer actual Mineflayer helper calls over returning descriptive text.
If regeneration_guidance is present, the previous LegacyPlannerAction was rejected by runtime validation. Fix the reported reason directly, use the selected affordance's args_contract for structured parameters, do not repeat the rejected shape, and return one corrected LegacyPlannerAction.
Do not create generated candidates from judgment, PlanBeads, memory, or reviewer text. Those surfaces may review, patch, retry, retire, or promote an existing candidate, but origin authority belongs to this LegacyPlannerAction.
Use use_primitive run_mineflayer_program only for legacy one-off direct program execution when you are not trying to create an actor-owned candidate. For reusable behavior, choose author_and_trial_action_skill instead.
Treat CycleGoal allowed_* lists as compatibility mirrors/advisory context. They must not shrink the action surface; runtime_affordances and direct_action_skills define what can be selected.
If a physical action just failed, inspect its runtime_result and do not repeat it blindly; choose a different valid affordance based on the current action surface and evidence.
runtime_retry_constraints are hard runtime suppressions over exact target plus structured args. Do not choose an LegacyPlannerAction that matches one; pivot to a different valid affordance, repair the structured args, observe current state, or record a truthful blocker.
Do not treat fixed material families, stations, construction readiness, or any other gameplay taxonomy as mandatory planning headings. Use raw observed Minecraft names and runtime evidence; decide relevance from the current CycleGoal.
Use settlement_state and blocker_histogram as observation/evidence/context packets before choosing an action. They are not a mandatory single-domain strategy.
If blocker_histogram shows the same blocked reason repeatedly, pivot to a different action skill, movement, observation, or a truthful memory/judgment instead of repeating the same primitive.
If a blocked table/crafting attempt reports missing crafting_table inventory, missing planks/sticks, or unreachable table, apply minecraft_basic_guide.blocked_recovery_guides and repair the prerequisite directly. Do not keep selecting observe when the available evidence already names the missing prerequisite.
If a ready PlanBead points at a blocker or action-skill followup, choose an executable affordance that repairs or investigates it; if no such affordance is currently valid, pick observe, movement, or a truthful memory action instead of pretending the bead is executable.
remember is a continuity tool, not a substitute for acting. After a blocker has already been remembered once, do not keep selecting remember for the same blocker; choose fresh observation, a different reachable target, another useful action, or let judgment defer/update the PlanBead.
If a primitive reports a concrete required position in runtime_result, use structured move_to toward that explicit position or observe current state before retrying. Do not retry the same primitive from outside its reported interaction range.
Building primitives such as build_pattern are ordinary affordances. Use them only when the current CycleGoal, WorldEvents, observation, or memory makes building relevant; never treat a construction target as always-on architecture.
use_action_skill executes seed/recipe bundles through their required primitives; generated Mineflayer action skills execute their stored source through run_mineflayer_program with current parameters. Prefer use_primitive when a single runtime affordance is enough. Prefer author_and_trial_action_skill when code generation should become an actor-owned action skill with source, schema, parameters, helper events, result, post-observation, and active record attached to actor workspace artifacts.
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
      legacy_planner_action: ProviderLegacyPlannerActionPayload;
    }>({
      config: input.gemini!,
      ...providerCall
    }) : await callOpenAiJsonSchema<{
      legacy_planner_action: ProviderLegacyPlannerActionPayload;
    }>({
      config: openAiConfigForActionPlanner(input.openAi!),
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
    const legacyPlannerActionPayload = payload.legacy_planner_action as ProviderLegacyPlannerActionPayload;
    const parameters = isRecord(legacyPlannerActionPayload.parameters)
      ? legacyPlannerActionPayload.parameters
      : isRecord(legacyPlannerActionPayload.args)
        ? legacyPlannerActionPayload.args
        : {};
    intent = {
      schema: "legacy-planner-action/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      cycle_goal_id: plannerCycleGoal.goal_id,
      kind: legacyPlannerActionPayload.kind,
      action_skill_id: legacyPlannerActionPayload.action_skill_id,
      primitive_id: legacyPlannerActionPayload.primitive_id,
      args: parameters,
      parameters,
      ...(isRecord(legacyPlannerActionPayload.parameters_schema)
        ? { parameters_schema: legacyPlannerActionPayload.parameters_schema }
        : {}),
      ...(isRecord(legacyPlannerActionPayload.candidate) ? { candidate: legacyPlannerActionPayload.candidate } : {}),
      why_this_action: legacyPlannerActionPayload.why_this_action,
      expected_evidence: asStringArray(legacyPlannerActionPayload.expected_evidence),
      fallback_if_blocked: legacyPlannerActionPayload.fallback_if_blocked
    };
  }

  const metadataRepairs: JsonValue[] = [];
  let validated = validateLegacyPlannerAction(intent);
  if (!validated.ok) {
    const validationErrors = validated.errors;
    const error = validationErrors.join("; ");
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
    if (
      input.providerId !== "deterministic-social" &&
      (input.regenerationAttempt ?? 0) < MAX_LEGACY_PLANNER_ACTION_REGENERATION_ATTEMPTS
    ) {
      return runSocialActionPlannerProvider({
        ...input,
        regenerationAttempt: (input.regenerationAttempt ?? 0) + 1,
        regenerationGuidance: buildLegacyPlannerActionRegenerationGuidance({
          error,
          rejectedIntent: intent
        }) as unknown as JsonValue
      });
    }
    const repair = repairNonExecutableLegacyPlannerActionMetadata({
      intent,
      errors: validationErrors
    });
    if (repair) {
      intent = repair.intent;
      metadataRepairs.push(...repair.repairs);
      validated = validateLegacyPlannerAction(intent);
      if (validated.ok) {
        // Continue into executable validation. The repair is metadata-only and
        // is recorded on the accepted output snapshot below.
      } else {
        return {
          ok: false,
          error: validated.errors.join("; "),
          inputRef: inputPath,
          outputRef: outputPath
        };
      }
    } else {
      return {
        ok: false,
        error,
        inputRef: inputPath,
        outputRef: outputPath
      };
    }
  }

  if (!validated.ok) {
    throw new Error("LegacyPlannerAction validation remained invalid after metadata repair guard");
  }

  const executableError = validateExecutableIntent(validated.action, plannerCycleGoal);
  if (executableError) {
    const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: turnId,
      provider_id: input.providerId,
      model: input.openAi?.model ?? input.gemini?.model ?? "deterministic-social",
      created_at: new Date().toISOString(),
      raw_output_text: JSON.stringify(validated.action),
      parsed_output: {
        error: executableError,
        candidate_action: validated.action as unknown as JsonValue
      },
      proposal: { error: executableError },
      usage: usageRecord
    });
    if (
      input.providerId !== "deterministic-social" &&
      (input.regenerationAttempt ?? 0) < MAX_LEGACY_PLANNER_ACTION_REGENERATION_ATTEMPTS
    ) {
      return runSocialActionPlannerProvider({
        ...input,
        regenerationAttempt: (input.regenerationAttempt ?? 0) + 1,
        regenerationGuidance: buildLegacyPlannerActionRegenerationGuidance({
          error: executableError,
          rejectedIntent: validated.action
        }) as unknown as JsonValue
      });
    }
    return {
      ok: false,
      error: executableError,
      inputRef: inputPath,
      outputRef: outputPath
    };
  }

  const { ref: legacyPlannerActionRef } = await writeActorGoalArtifact(
    input.actorWorkspaceRootDir,
    input.actorId,
    path.join("goals", "cycle", "legacy-planner-actions"),
    `${turnId}-legacy-planner-action`,
    validated.action
  );

  const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: turnId,
    provider_id: input.providerId,
    model: input.openAi?.model ?? input.gemini?.model ?? "deterministic-social",
    created_at: new Date().toISOString(),
    raw_output_text: JSON.stringify(validated.action),
    parsed_output: validated.action as unknown as JsonValue,
    proposal: {
      action_ref: legacyPlannerActionRef,
      ...(metadataRepairs.length > 0 ? { metadata_repairs: metadataRepairs } : {})
    },
    usage: usageRecord
  });

  return {
    ok: true,
    legacyPlannerAction: validated.action,
    legacyPlannerActionRef,
    inputRef: inputPath,
    outputRef: outputPath
  };
}
