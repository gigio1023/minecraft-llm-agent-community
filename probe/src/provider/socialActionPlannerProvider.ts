import { randomUUID } from "node:crypto";
import path from "node:path";

import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { ActionIntent, ActorCycleGoal } from "../runtime/goals/types.js";
import { validateActionIntent } from "../runtime/goals/types.js";
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

function hasDirectPrimitiveActionSkillFallback(intent: ActionIntent) {
  return Boolean(
    intent.action_skill_id ||
      (typeof intent.args.actionSkillId === "string" && intent.args.actionSkillId.trim()) ||
      (typeof intent.args.action_skill_id === "string" && intent.args.action_skill_id.trim())
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
  }

  if (intent.kind === "use_action_skill") {
    if (
      !intent.action_skill_id ||
      !cycleGoal.allowed_action_skill_ids.includes(intent.action_skill_id)
    ) {
      return `Action skill ${intent.action_skill_id ?? "<missing>"} is not executable in this social cycle`;
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
  const providerInput = {
    stage: "action_planner",
    turn_id: turnId,
    action_index: input.actionIndex,
    ActorSoul: input.context.ActorSoul,
    ActorLifeGoal: input.context.ActorLifeGoal,
    cycle_goal: plannerCycleGoal,
    observation: input.context.observation,
    owned_action_skills: ownedActionSkills,
    action_surface: input.context.action_surface,
    direct_action_skills: directActionSkills,
    allowed_primitive_ids: plannerCycleGoal.allowed_primitive_ids,
    cycle_goal_allowed_primitive_ids_as_advisory: input.cycleGoal.allowed_primitive_ids,
    cycle_goal_allowed_action_skill_ids_as_advisory: input.cycleGoal.allowed_action_skill_ids,
    runtime_affordances: runtimeAffordances,
    world_events: input.context.world_events,
    relationship_context: input.context.relationship_context,
    memory_packet: input.context.memory_packet,
    settlement_state: input.context.settlement_state,
    settlement_checklist: input.context.settlement_state.checklist,
    blocker_histogram: input.context.settlement_state.blocker_histogram,
    runtime_retry_constraints: input.context.runtime_retry_constraints,
    previous_cycle_judgments: input.context.previous_cycle_judgments,
    recent_action_attempts: input.recentActionAttempts ?? []
  } as JsonValue;

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
    intent = {
      schema: "action-intent/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      cycle_goal_id: plannerCycleGoal.goal_id,
      kind: "use_primitive",
      primitive_id: primitive,
      args: primitive === "wait" ? { ticks: 20 } : primitive === "remember" ? { note: "cycle baseline" } : {},
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
Select from action_surface and runtime_affordances based on live observation, query-neutral world-state evidence, memory_packet, relationship_context, world_events, previous judgments, and recent attempts. action_surface is the actor's current body, not a strategy checklist.
Observation is raw evidence. Decide what matters from those facts yourself; do not treat every visible fact as a command.
Vitals and food candidates are observation fields, not runtime priorities. If consuming food is useful, choose consume_item with an explicit itemName from inventory evidence.
Deferred primitives or action skills explain missing affordances; do not choose them in this ActionIntent. Direct primitives and direct action skills are the executable body for this turn.
Mineflayer expansion opportunities show where the actor body can grow through bounded runtime adapters or action skill candidates. They are not executable in this ActionIntent until exposed as direct primitives or direct action skills.
When run_mineflayer_program is direct, you may generate a short TypeScript program for a situation that is better expressed as Mineflayer helper code. Its args.source must export async function run(ctx) and use ctx helper calls such as observe, inventoryItems, collectLogs, mineBlock, craftItem, craftWithTable, consumeItem, placeBlock, buildPattern, say, wait, or mineflayer(method,args). Keep expected_evidence tied to helper results and post-observation, not to the returned text alone.
Treat CycleGoal allowed_* lists as compatibility mirrors/advisory context. They must not shrink the action surface; runtime_affordances and direct_action_skills define what can be selected.
If a physical action just failed, inspect its runtime_result and do not repeat it blindly; choose a different valid affordance based on the current action surface and evidence.
runtime_retry_constraints are hard runtime suppressions over exact target plus structured args. Do not choose an ActionIntent that matches one; pivot to a different valid affordance, repair the structured args, observe current state, or record a truthful blocker.
Do not treat fixed material families, stations, construction readiness, or any other gameplay taxonomy as mandatory planning headings. Use raw observed Minecraft names and runtime evidence; decide relevance from the current CycleGoal.
Use settlement_state, settlement_checklist, and blocker_histogram as observation/evidence/context packets before choosing an action. They are not a mandatory single-domain strategy.
If blocker_histogram shows the same blocked reason repeatedly, pivot to a different action skill, movement, observation, or a truthful memory/judgment instead of repeating the same primitive.
If a primitive reports a concrete required position in runtime_result, use structured move_to toward that explicit position or observe current state before retrying. Do not retry the same primitive from outside its reported interaction range.
Building primitives such as build_pattern are ordinary affordances. Use them only when the current CycleGoal, WorldEvents, observation, or memory makes building relevant; never treat a construction target as always-on architecture.
use_action_skill executes every required_primitive in order as one verifier-checked bundle; prefer use_primitive when a single runtime affordance is enough. For a generated Mineflayer program, prefer a single use_primitive run_mineflayer_program intent so the source, helper events, result, and post-observation stay attached to one artifact.
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
      config: input.gemini!,
      ...providerCall
    }) : await callOpenAiJsonSchema<{
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
      cycle_goal_id: plannerCycleGoal.goal_id,
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
