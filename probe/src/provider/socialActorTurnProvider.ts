import { randomUUID } from "node:crypto";
import path from "node:path";

import type { OpenAiJsonProviderConfig } from "./openaiApiJsonProvider.js";
import { callOpenAiJsonSchema } from "./openaiApiJsonProvider.js";
import type { GeminiJsonProviderConfig } from "./geminiApiJsonProvider.js";
import { callGeminiJsonSchema } from "./geminiApiJsonProvider.js";
import type { ActorTurnInput, ActorTurnOutput, JsonObject } from "../runtime/goals/actorEpisode/index.js";
import {
  resolveActorTurnOutputToActionIntent,
  validateActorTurnOutput,
  type ActionCardProjection
} from "../runtime/goals/actorEpisode/index.js";
import type { ActionIntent, SocialCycleProviderId } from "../runtime/goals/types.js";
import { writeActorGoalArtifact } from "../runtime/goals/goalJsonStore.js";
import type { JsonValue } from "./inputSnapshot.js";
import { normalizeOpenAiJsonPayload } from "./normalizeOpenAiJsonPayload.js";
import { writeProviderInputSnapshot } from "./providerInputStore.js";
import { writeProviderOutputSnapshot } from "./providerOutputStore.js";
import type { ProviderUsageRecord } from "./providerUsageTracker.js";

export const actorTurnProviderSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    actor_turn: {
      type: "object",
      additionalProperties: false,
      properties: {
        choice: {
          type: "string",
          enum: ["use_existing_action", "author_mineflayer_action"]
        },
        action_card_id: { type: "string" },
        parameters: { type: "object" },
        proposed_action_skill_id: { type: "string" },
        purpose: { type: "string" },
        input_schema: { type: "object" },
        source_language: { type: "string", enum: ["typescript"] },
        source: { type: "string" },
        helper_api_version: {
          type: "string",
          enum: ["mineflayer-action-skill-helper/v1"]
        },
        helper_allowlist: { type: "array", items: { type: "string" } },
        timeout_ms: { type: "number" },
        verifier: { type: "object" },
        known_failure_modes: { type: "array", items: { type: "string" } },
        promotion_policy: {
          type: "string",
          enum: ["promote_after_passed_trial"]
        },
        why_this_action: { type: "string" },
        expected_evidence: { type: "array", items: { type: "string" } },
        fallback_if_blocked: { type: "string" }
      },
      required: [
        "choice",
        "parameters",
        "why_this_action",
        "expected_evidence",
        "fallback_if_blocked"
      ]
    }
  },
  required: ["actor_turn"]
} as const;

export const actorTurnSystemPrompt = `You are choosing one Actor Turn inside an Active Episode.
Read decision_frame first. It is the runtime's compact priority view of current truth, completed work, open social requests, do-not-repeat constraints, parameter candidates, and top eligible Action Cards.
Use decision_frame and current_state before older Active Episode wording, then recent Evidence Trace, compact PlanBead hints, relationship context, runtime retry constraints, Action Cards, and Minecraft Basic Guide.
current_state is the live bounded projection of inventory, vitals, position, visible actors, nearby block hints, world scan, and settlement progress. Do not ignore it in favor of the Active Episode wording.
decision_frame is guidance, not executable authority: you still must choose a visible Action Card with schema-valid parameters, or author_mineflayer_action when no existing card can express the needed behavior.
If current_state inventory or settlement progress already satisfies a prerequisite or pivot trigger, choose the next useful action under the LifeGoal instead of repeating the same collection action.
When current_state.deposit_candidates contains a socially_requested entry and a Deposit Shared or handoff Action Card is visible, use that candidate to fill parameters.itemName and parameters.count unless a stronger current blocker says not to.
If shared_storage already has contribution evidence and no deposit_candidate is socially_requested, do not repeat a deposit for the same request. Choose the next useful physical, social, memory, or branch action instead.
If recent Evidence Trace shows observe produced no_progress and current_state already contains a world scan, do not ask to observe again. Use current_state to choose a physical, container, chat, relationship, movement-enabled, or authored action.
If current_state already records shared_chest=inspected, do not inspect the same chest again unless the episode requires a fresh container delta after another actor or inventory change.
Choose use_existing_action when an Action Card can make progress with schema-valid parameters. Select the card by description and parameter contract; do not output primitive_id or action_skill_id.
For Action Cards marked requires_current_state_check, do not choose the card unless current_state or recent runtime evidence satisfies its listed preconditions. If the precondition is missing, choose the nearest prerequisite action instead.
If runtime_retry_constraints mention an Actor Turn contract rejection, do not repeat the rejected card/parameters. Choose a prerequisite or different card that satisfies current_state.
Treat movement-only position_delta evidence as context, not durable progress. Use Move To only to reach a specific actionable target or to enable a fresh observation; after movement, prefer a world, inventory, container, chat, or relationship action that uses the new position.
Choose author_mineflayer_action only when no existing Action Card can do the needed Mineflayer behavior. Do not include action_card_id with author_mineflayer_action. Generated source must be TypeScript, helper-limited, schema-bound, timed, verifier-backed, and trialed by runtime before promotion.
Do not author generated code merely to probe shared chest/container openability, crafting-table reachability, or station availability when Inspect Chest, Craft With Table, Place Crafting Table, Craft Crafting Table, or current_state already expresses that boundary. Choose the existing Action Card or a prerequisite instead.
For author_mineflayer_action, promotion_policy must be promote_after_passed_trial; never use record_candidate_only. parameters must contain only runtime inputs declared in input_schema and read through params; never put source_language, source, helper_api_version, helper_allowlist, timeout_ms, verifier, known_failure_modes, or promotion_policy inside parameters.
For author_mineflayer_action, source must define export async function run(ctx, params) with no import, require, process, filesystem, network, eval, Function, while(true), or for(;;). Use only direct ctx helpers named in helper_allowlist, for example ctx.observe(...), ctx.wait(...), ctx.mineBlock(...), ctx.craftItem(...), ctx.placeBlock(...), or ctx.say(...). Do not use ctx.helpers, ctx.sharedStorage, ctx.bot, or ctx.mineflayer() as a function. Supported helper names are exactly: position, inventoryItems, observe, wait, collectLogs, mineBlock, craftItem, craftWithTable, consumeItem, placeBlock, buildPattern, say, mineflayer.
PlanBeads preserve work continuity but never supply executable parameters or proof of progress.
Do not treat observe, wait, memory notes, or provider prose as success. Runtime evidence decides what happened.
Prefer action over repeated observation after evidence already identifies the blocker. JSON only.`;

export type ActorTurnProviderPayload = {
  schemaName: "actor_turn";
  schema: typeof actorTurnProviderSchema;
  system: string;
  user: string;
  usageContext: {
    runId?: string;
    actorId: string;
    turnId: string;
    stage: "actor_turn";
  };
};

export function buildActorTurnProviderPayload(input: {
  actorTurnInput: ActorTurnInput;
  runId?: string;
}): ActorTurnProviderPayload {
  return {
    schemaName: "actor_turn",
    schema: actorTurnProviderSchema,
    system: actorTurnSystemPrompt,
    user: JSON.stringify(input.actorTurnInput satisfies JsonValue),
    usageContext: {
      runId: input.runId,
      actorId: input.actorTurnInput.active_episode.actor_id,
      turnId: input.actorTurnInput.turn_id,
      stage: "actor_turn"
    }
  };
}

export function parseActorTurnProviderOutput(value: unknown):
  | { ok: true; output: ActorTurnOutput }
  | { ok: false; errors: string[] } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, errors: ["Actor Turn provider output must be an object"] };
  }
  const record = value as Record<string, unknown>;
  const actorTurn = record.actor_turn;
  const body = typeof actorTurn === "object" && actorTurn !== null && !Array.isArray(actorTurn)
    ? { ...actorTurn as Record<string, unknown> }
    : { ...record };
  mergeSiblingActorTurnFields(body, record);
  delete body.actor_turn;
  delete body.type;
  fillNonAuthorityExplanationDefaults(body);
  if (body.choice === "author_mineflayer_action") {
    hoistAuthoringFieldsFromParameters(body);
    stripAuthoringMetadataFromParameters(body);
    normalizeAuthoringInputSchema(body);
    if (typeof body.proposed_action_skill_id !== "string" || body.proposed_action_skill_id.trim().length === 0) {
      body.proposed_action_skill_id = fallbackGeneratedActionSkillId(body);
    }
    body.promotion_policy = "promote_after_passed_trial";
    delete body.action_card_id;
    delete body.primitive_id;
    delete body.action_skill_id;
    delete body.runtime_mapping_ref;
    delete body.args;
  } else if (body.choice === "use_existing_action") {
    delete body.proposed_action_skill_id;
    delete body.purpose;
    delete body.input_schema;
    delete body.source_language;
    delete body.source;
    delete body.helper_api_version;
    delete body.helper_allowlist;
    delete body.timeout_ms;
    delete body.verifier;
    delete body.known_failure_modes;
    delete body.promotion_policy;
  }
  const candidate = {
    schema: "actor-turn-output/v1",
    ...body
  };
  const result = validateActorTurnOutput(candidate);
  return result.ok
    ? { ok: true, output: result.output }
    : { ok: false, errors: result.errors };
}

const actorTurnSiblingFieldNames = [
  "source_language",
  "source",
  "helper_api_version",
  "helper_allowlist",
  "timeout_ms",
  "verifier",
  "known_failure_modes",
  "promotion_policy",
  "why_this_action",
  "expected_evidence",
  "fallback_if_blocked"
] as const;

const authoringMetadataParameterFieldNames = [
  "source_language",
  "source",
  "helper_api_version",
  "helper_allowlist",
  "timeout_ms",
  "verifier",
  "known_failure_modes",
  "promotion_policy"
] as const;

function mergeSiblingActorTurnFields(
  body: Record<string, unknown>,
  record: Record<string, unknown>
) {
  if (body.choice !== "author_mineflayer_action" || !("actor_turn" in record)) {
    return;
  }
  for (const fieldName of actorTurnSiblingFieldNames) {
    if (body[fieldName] === undefined && record[fieldName] !== undefined) {
      body[fieldName] = record[fieldName];
    }
  }
}

function hoistAuthoringFieldsFromParameters(body: Record<string, unknown>) {
  const parameters = nestedParameters(body);
  for (const fieldName of authoringMetadataParameterFieldNames) {
    if (body[fieldName] === undefined && parameters[fieldName] !== undefined) {
      body[fieldName] = parameters[fieldName];
    }
  }
}

function stripAuthoringMetadataFromParameters(body: Record<string, unknown>) {
  const parameters = nestedParameters(body);
  for (const fieldName of authoringMetadataParameterFieldNames) {
    delete parameters[fieldName];
  }
  body.parameters = parameters;
}

function inferJsonSchemaForValue(value: unknown) {
  if (typeof value === "string") {
    return { type: "string" };
  }
  if (typeof value === "number") {
    return { type: Number.isInteger(value) ? "integer" : "number" };
  }
  if (typeof value === "boolean") {
    return { type: "boolean" };
  }
  if (Array.isArray(value)) {
    return { type: "array" };
  }
  if (typeof value === "object" && value !== null) {
    return { type: "object" };
  }
  return { type: "string" };
}

function normalizeAuthoringInputSchema(body: Record<string, unknown>) {
  const rawSchema = typeof body.input_schema === "object" &&
    body.input_schema !== null &&
    !Array.isArray(body.input_schema)
    ? { ...body.input_schema as Record<string, unknown> }
    : {};
  rawSchema.type = "object";
  const parameters = nestedParameters(body);
  const existingProperties = typeof rawSchema.properties === "object" &&
    rawSchema.properties !== null &&
    !Array.isArray(rawSchema.properties)
    ? { ...rawSchema.properties as Record<string, unknown> }
    : {};
  for (const [key, value] of Object.entries(parameters)) {
    if (existingProperties[key] === undefined) {
      existingProperties[key] = inferJsonSchemaForValue(value);
    }
  }
  rawSchema.properties = existingProperties;
  if (rawSchema.additionalProperties === undefined) {
    rawSchema.additionalProperties = false;
  }
  body.input_schema = rawSchema;
}

function nestedParameters(value: Record<string, unknown>) {
  return typeof value.parameters === "object" && value.parameters !== null && !Array.isArray(value.parameters)
    ? value.parameters as Record<string, unknown>
    : {};
}

function readNestedString(value: Record<string, unknown>, keys: readonly string[]) {
  const parameters = nestedParameters(value);
  for (const key of keys) {
    const bodyValue = value[key];
    if (typeof bodyValue === "string" && bodyValue.trim().length > 0) {
      return bodyValue;
    }
    const parameterValue = parameters[key];
    if (typeof parameterValue === "string" && parameterValue.trim().length > 0) {
      return parameterValue;
    }
  }
  return undefined;
}

function fillNonAuthorityExplanationDefaults(value: Record<string, unknown>) {
  if (typeof value.why_this_action !== "string" || value.why_this_action.trim().length === 0) {
    value.why_this_action = readNestedString(value, ["purpose", "expectedObservation", "expected_observation"]) ??
      "Use the selected Action Card with the supplied structured parameters.";
  }
  if (!Array.isArray(value.expected_evidence)) {
    const expected = readNestedString(value, [
      "expected_evidence",
      "expectedEvidence",
      "expectedObservation",
      "expected_observation"
    ]);
    value.expected_evidence = expected
      ? [expected]
      : ["runtime evidence from the selected Action Card"];
  }
  if (typeof value.fallback_if_blocked !== "string" || value.fallback_if_blocked.trim().length === 0) {
    value.fallback_if_blocked =
      "If blocked, record the runtime blocker and choose a valid prerequisite or different Action Card next turn.";
  }
}

function fallbackGeneratedActionSkillId(value: Record<string, unknown>) {
  const base = typeof value.purpose === "string" && value.purpose.trim().length > 0
    ? value.purpose
    : typeof value.why_this_action === "string" && value.why_this_action.trim().length > 0
      ? value.why_this_action
      : "actor turn generated action";
  const words = base
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
  const pascal = words
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join("");
  return `trial${pascal || "GeneratedAction"}`;
}

export type ActorTurnProviderResult =
  | {
      ok: true;
      actorTurn: ActorTurnOutput;
      intent: ActionIntent;
      intentRef: string;
      inputRef: string;
      outputRef: string;
    }
  | {
      ok: false;
      error: string;
      inputRef: string;
      outputRef: string;
    };

type ActorTurnProviderAttempt =
  | {
      ok: true;
      actorTurn: ActorTurnOutput;
      inputRef: string;
      snapshotId: string;
      model: string;
      rawText: string;
      usageRecord?: ProviderUsageRecord;
    }
  | {
      ok: false;
      error: string;
      inputRef: string;
      outputRef: string;
    };

function deterministicActorTurn(input: {
  actorTurnInput: ActorTurnInput;
  actionCardProjection: ActionCardProjection;
  defaultPrimitive?: string;
}): ActorTurnOutput {
  const preferredPrimitive = input.defaultPrimitive ?? "observe";
  const preferredMapping = input.actionCardProjection.runtime_mappings.find((mapping) =>
    mapping.kind === "use_primitive" && mapping.primitive_id === preferredPrimitive
  );
  const fallbackMapping =
    preferredMapping ??
    input.actionCardProjection.runtime_mappings.find((mapping) => mapping.kind === "use_primitive") ??
    input.actionCardProjection.runtime_mappings[0];
  const actionCardId =
    fallbackMapping?.action_card_id ?? input.actorTurnInput.action_cards[0]?.action_card_id ?? "missing-card";
  const parameters: JsonObject = preferredPrimitive === "wait"
    ? { ticks: 20 }
    : preferredPrimitive === "remember"
      ? { note: "actor turn deterministic baseline" }
      : {};

  return {
    schema: "actor-turn-output/v1",
    choice: "use_existing_action",
    action_card_id: actionCardId,
    parameters,
    why_this_action: "Deterministic Actor Turn baseline chooses one mapped Action Card.",
    expected_evidence: ["runtime evidence"],
    fallback_if_blocked: "choose another mapped Action Card"
  };
}

async function writeFailureOutput(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  turnId: string;
  providerId: SocialCycleProviderId;
  model: string;
  snapshotId: string;
  rawText?: string;
  error: string;
  usageRecord?: ProviderUsageRecord;
}) {
  return writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${input.snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: input.turnId,
    provider_id: input.providerId,
    model: input.model,
    created_at: new Date().toISOString(),
    raw_output_text: input.rawText ?? "",
    parsed_output: { error: input.error },
    proposal: { error: input.error },
    usage: input.usageRecord
  });
}

async function writeActorTurnAttemptSnapshot(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  actorTurnInput: ActorTurnInput;
  providerId: SocialCycleProviderId;
  model: string;
  snapshotId: string;
}) {
  return writeProviderInputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: input.snapshotId,
    actor_id: input.actorId,
    turn_id: input.actorTurnInput.turn_id,
    provider_id: input.providerId,
    model: input.model,
    created_at: new Date().toISOString(),
    input: input.actorTurnInput as unknown as JsonValue
  });
}

function buildRepairActorTurnInput(input: {
  actorTurnInput: ActorTurnInput;
  rejectedOutput: ActorTurnOutput;
  errors: string[];
}): ActorTurnInput {
  const target = input.rejectedOutput.choice === "use_existing_action"
    ? `Action Card ${input.rejectedOutput.action_card_id}`
    : `generated action skill ${input.rejectedOutput.proposed_action_skill_id}`;
  const rejectedActionCardId = input.rejectedOutput.choice === "use_existing_action"
    ? input.rejectedOutput.action_card_id
    : undefined;
  const actionCards = rejectedActionCardId && input.actorTurnInput.action_cards.length > 1
    ? input.actorTurnInput.action_cards.filter((card) => card.action_card_id !== rejectedActionCardId)
    : input.actorTurnInput.action_cards;
  return {
    ...input.actorTurnInput,
    action_cards: actionCards,
    runtime_retry_constraints: [
      {
        constraint_id:
          `actor-turn-contract-rejection-${input.actorTurnInput.turn_id}-${input.actorTurnInput.runtime_retry_constraints.length + 1}`,
        target_summary: `${target} rejected before execution`,
        blocked_reason: input.errors.join("; "),
        repeat_count: 1,
        evidence_refs: []
      },
      ...input.actorTurnInput.runtime_retry_constraints
    ]
  };
}

function buildMalformedOutputRepairActorTurnInput(input: {
  actorTurnInput: ActorTurnInput;
  error: string;
}): ActorTurnInput {
  return {
    ...input.actorTurnInput,
    runtime_retry_constraints: [
      {
        constraint_id:
          `actor-turn-malformed-output-${input.actorTurnInput.turn_id}-${input.actorTurnInput.runtime_retry_constraints.length + 1}`,
        target_summary: "provider output rejected before ActionIntent resolution",
        blocked_reason:
          `${input.error}. Return an actor_turn object, not the JSON schema. choice must be use_existing_action or author_mineflayer_action, and parameters must be an object.`,
        repeat_count: 1,
        evidence_refs: []
      },
      ...input.actorTurnInput.runtime_retry_constraints
    ],
    decision_frame: {
      ...input.actorTurnInput.decision_frame,
      next_action_guidance: [
        "previous provider output was malformed; return a concrete actor_turn decision object, not the schema definition",
        ...input.actorTurnInput.decision_frame.next_action_guidance
      ]
    }
  };
}

function isRepairableActorTurnProviderError(error: string) {
  return /\bActorTurnOutput\b|Actor Turn provider output|actor_turn object|parameters must be an object/i
    .test(error);
}

function projectionForActorTurnInput(
  projection: ActionCardProjection,
  actorTurnInput: ActorTurnInput
): ActionCardProjection {
  const visibleIds = new Set(actorTurnInput.action_cards.map((card) => card.action_card_id));
  return {
    ...projection,
    action_cards: projection.action_cards.filter((card) => visibleIds.has(card.action_card_id)),
    runtime_mappings: projection.runtime_mappings.filter((mapping) =>
      visibleIds.has(mapping.action_card_id)
    )
  };
}

async function requestActorTurn(input: {
  providerId: SocialCycleProviderId;
  actorWorkspaceRootDir: string;
  actorId: string;
  actorTurnInput: ActorTurnInput;
  actionCardProjection: ActionCardProjection;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  defaultPrimitive?: string;
  runId?: string;
  snapshotId: string;
  model: string;
}): Promise<ActorTurnProviderAttempt> {
  const inputPath = await writeActorTurnAttemptSnapshot({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    actorTurnInput: input.actorTurnInput,
    providerId: input.providerId,
    model: input.model,
    snapshotId: input.snapshotId
  });

  if (input.providerId === "deterministic-social") {
    const actorTurn = deterministicActorTurn({
      actorTurnInput: input.actorTurnInput,
      actionCardProjection: input.actionCardProjection,
      defaultPrimitive: input.defaultPrimitive
    });
    return {
      ok: true,
      actorTurn,
      inputRef: inputPath,
      snapshotId: input.snapshotId,
      model: input.model,
      rawText: JSON.stringify({ actor_turn: actorTurn })
    };
  }

  const payload = buildActorTurnProviderPayload({
    actorTurnInput: input.actorTurnInput,
    runId: input.runId
  });
  const result = input.providerId === "gemini-api"
    ? await callGeminiJsonSchema<{ actor_turn: unknown }>({
        config: input.gemini!,
        ...payload
      })
    : await callOpenAiJsonSchema<{ actor_turn: unknown }>({
        config: input.openAi!,
        ...payload
      });
  const rawText = result.rawText ?? "";
  if (!result.ok) {
    const outputRef = await writeFailureOutput({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      turnId: input.actorTurnInput.turn_id,
      providerId: input.providerId,
      model: result.model,
      snapshotId: input.snapshotId,
      rawText,
      error: result.message,
      usageRecord: result.usageRecord
    });
    return { ok: false, error: result.message, inputRef: inputPath, outputRef };
  }

  const parsed = parseActorTurnProviderOutput(
    normalizeOpenAiJsonPayload(result.parsed as Record<string, unknown>)
  );
  if (!parsed.ok) {
    const error = parsed.errors.join("; ");
    const outputRef = await writeFailureOutput({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      turnId: input.actorTurnInput.turn_id,
      providerId: input.providerId,
      model: result.model,
      snapshotId: input.snapshotId,
      rawText,
      error,
      usageRecord: result.usageRecord
    });
    return { ok: false, error, inputRef: inputPath, outputRef };
  }
  return {
    ok: true,
    actorTurn: parsed.output,
    inputRef: inputPath,
    snapshotId: input.snapshotId,
    model: result.model,
    rawText,
    usageRecord: result.usageRecord
  };
}

export async function runSocialActorTurnProvider(input: {
  providerId: SocialCycleProviderId;
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  cycleGoalId: string;
  actorTurnInput: ActorTurnInput;
  actionCardProjection: ActionCardProjection;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  defaultPrimitive?: string;
  runId?: string;
}): Promise<ActorTurnProviderResult> {
  const snapshotId = `actor-turn-${input.actorTurnInput.turn_id}-${randomUUID()}`;
  const model = input.openAi?.model ?? input.gemini?.model ?? "deterministic-social";
  let actorTurnInput = input.actorTurnInput;
  let actionCardProjection = projectionForActorTurnInput(input.actionCardProjection, actorTurnInput);
  let attempt = await requestActorTurn({
    ...input,
    actorTurnInput,
    actionCardProjection,
    snapshotId,
    model
  });
  if (!attempt.ok) {
    if (!isRepairableActorTurnProviderError(attempt.error)) {
      return attempt;
    }
    actorTurnInput = buildMalformedOutputRepairActorTurnInput({
      actorTurnInput,
      error: attempt.error
    });
    actionCardProjection = projectionForActorTurnInput(input.actionCardProjection, actorTurnInput);
    attempt = await requestActorTurn({
      ...input,
      actorTurnInput,
      actionCardProjection,
      snapshotId: `${snapshotId}-malformed-repair-1`,
      model
    });
    if (!attempt.ok) {
      return attempt;
    }
  }

  let resolution = resolveActorTurnOutputToActionIntent({
    actorId: input.actorId,
    cycleId: input.cycleId,
    cycleGoalId: input.cycleGoalId,
    output: attempt.actorTurn,
    actionCardProjection,
    currentState: actorTurnInput.current_state
  });
  if (!resolution.ok) {
    const rejectionRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${attempt.snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: actorTurnInput.turn_id,
      provider_id: input.providerId,
      model: attempt.model,
      created_at: new Date().toISOString(),
      raw_output_text: attempt.rawText,
      parsed_output: attempt.actorTurn as unknown as JsonValue,
      proposal: {
        actor_turn_output: attempt.actorTurn as unknown as JsonValue,
        action_intent_ref: null,
        resolution_errors: resolution.errors,
        repair_requested: true
      },
      usage: attempt.usageRecord
    });
    actorTurnInput = buildRepairActorTurnInput({
      actorTurnInput,
      rejectedOutput: attempt.actorTurn,
      errors: resolution.errors
    });
    actionCardProjection = projectionForActorTurnInput(input.actionCardProjection, actorTurnInput);
    attempt = await requestActorTurn({
      ...input,
      actorTurnInput,
      actionCardProjection,
      snapshotId: `${snapshotId}-repair-1`,
      model
    });
    if (!attempt.ok) {
      return attempt;
    }
    resolution = resolveActorTurnOutputToActionIntent({
      actorId: input.actorId,
      cycleId: input.cycleId,
      cycleGoalId: input.cycleGoalId,
      output: attempt.actorTurn,
      actionCardProjection,
      currentState: actorTurnInput.current_state
    });
    if (!resolution.ok) {
      const error = resolution.errors.join("; ");
      const outputRef = await writeFailureOutput({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        turnId: actorTurnInput.turn_id,
        providerId: input.providerId,
        model: attempt.model,
        snapshotId: attempt.snapshotId,
        rawText: attempt.rawText,
        error: `${error}; previous_contract_rejection_ref=${rejectionRef}`,
        usageRecord: attempt.usageRecord
      });
      return { ok: false, error, inputRef: attempt.inputRef, outputRef };
    }
  }

  const { ref: intentRef } = await writeActorGoalArtifact(
    input.actorWorkspaceRootDir,
    input.actorId,
    path.join("goals", "cycle", "intents"),
    `${actorTurnInput.turn_id}-intent`,
    resolution.intent
  );

  const outputRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${attempt.snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: actorTurnInput.turn_id,
    provider_id: input.providerId,
    model: attempt.model,
    created_at: new Date().toISOString(),
    raw_output_text: attempt.rawText,
    parsed_output: attempt.actorTurn as unknown as JsonValue,
    proposal: {
      actor_turn_output: attempt.actorTurn as unknown as JsonValue,
      action_intent_ref: intentRef
    },
    usage: attempt.usageRecord
  });

  return {
    ok: true,
    actorTurn: attempt.actorTurn,
    intent: resolution.intent,
    intentRef,
    inputRef: attempt.inputRef,
    outputRef
  };
}
