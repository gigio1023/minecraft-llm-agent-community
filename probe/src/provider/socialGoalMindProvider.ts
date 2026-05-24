import { randomUUID } from "node:crypto";

import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { ActorCycleGoal, StrategicGoal } from "../runtime/goals/types.js";
import { validateActorCycleGoal } from "../runtime/goals/types.js";
import {
  buildDeterministicCycleGoal,
  writeCycleGoal
} from "../runtime/goals/cycleGoalStore.js";
import {
  buildDeterministicStrategicGoal,
  writeStrategicGoal
} from "../runtime/goals/strategicGoalStore.js";
import { soulRef } from "../runtime/goals/actorSoulStore.js";
import { callOpenAiJsonSchema, type OpenAiJsonProviderConfig } from "./openaiApiJsonProvider.js";
import { callGeminiJsonSchema, type GeminiJsonProviderConfig } from "./geminiApiJsonProvider.js";
import { normalizeOpenAiJsonPayload } from "./normalizeOpenAiJsonPayload.js";
import { asStringArray } from "./llmJsonArrays.js";
import { writeProviderInputSnapshot } from "./providerInputStore.js";
import { writeProviderOutputSnapshot } from "./providerOutputStore.js";
import type { JsonValue } from "./inputSnapshot.js";
import { listActorMemoryRefs } from "../memory/actorMemory.js";

const cycleGoalProviderSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    strategic_goal_updates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          rationale: { type: "string" },
          success_direction: { type: "string" },
          current_blockers: { type: "array", items: { type: "string" } }
        },
        required: ["summary", "rationale", "success_direction", "current_blockers"]
      }
    },
    cycle_goal: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        rationale: { type: "string" },
        success_verifier: { type: "string" },
        evidence_required: { type: "array", items: { type: "string" } },
        stop_conditions: { type: "array", items: { type: "string" } },
        allowed_action_skill_ids: { type: "array", items: { type: "string" } },
        allowed_primitive_ids: { type: "array", items: { type: "string" } }
      },
      required: [
        "summary",
        "rationale",
        "success_verifier",
        "evidence_required",
        "stop_conditions",
        "allowed_action_skill_ids",
        "allowed_primitive_ids"
      ]
    }
  },
  required: ["strategic_goal_updates", "cycle_goal"]
} as const;

export type CycleGoalProviderResult =
  | {
      ok: true;
      strategicGoals: StrategicGoal[];
      cycleGoal: ActorCycleGoal;
      inputRef: string;
      outputRef: string;
      source: "llm_planner" | "runtime_rule";
    }
  | {
      ok: false;
      error: string;
      inputRef: string;
      outputRef: string;
    };

function normalizeCycleGoalFields(
  raw: Record<string, unknown>,
  context: SocialCycleContextPacket
) {
  const fallbackSummary =
    "Continue evidence-first survival and settlement work under the active LifeGoal.";
  return {
    summary:
      typeof raw.summary === "string" && raw.summary.trim().length > 0
        ? raw.summary.trim()
        : fallbackSummary,
    rationale:
      typeof raw.rationale === "string" && raw.rationale.trim().length > 0
        ? raw.rationale.trim()
        : "CycleGoal provider omitted rationale; filled minimal contract from LifeGoal.",
    success_verifier:
      typeof raw.success_verifier === "string" && raw.success_verifier.trim().length > 0
        ? raw.success_verifier.trim()
        : "runtime_primitive_or_evidence",
    evidence_required: asStringArray(raw.evidence_required),
    stop_conditions: asStringArray(raw.stop_conditions),
    allowed_action_skill_ids: context.owned_action_skills.map((skill) => skill.skill_id),
    allowed_primitive_ids: [...context.allowed_primitive_ids]
  };
}

function cycleGoalFromLlm(input: {
  context: SocialCycleContextPacket;
  cycleId: string;
  strategicGoals: StrategicGoal[];
  parsed: {
    cycle_goal: ReturnType<typeof normalizeCycleGoalFields>;
  };
}): ActorCycleGoal {
  const judgmentRefs = input.context.previous_cycle_judgments.map((entry) => entry.ref);
  const worldEventRefs = input.context.world_events.map((event) => `world-events/${event.event_id}.json`);
  const memoryRefs = listActorMemoryRefs(input.context.memory_packet).map((ref) => ref.memory_id);
  const cg = input.parsed.cycle_goal;
  return {
    schema: "actor-cycle-goal/v1",
    actor_id: input.context.ActorSoul.actor_id,
    goal_id: `cycle-goal-${randomUUID()}`,
    life_goal_id: input.context.ActorLifeGoal.goal_id,
    cycle_id: input.cycleId,
    status: "active",
    source: "llm_planner",
    summary: cg.summary,
    rationale: cg.rationale,
    derived_from: {
      soul_ref: soulRef(input.context.ActorSoul.actor_id),
      observation_refs: [],
      world_event_refs: worldEventRefs,
      memory_refs: memoryRefs,
      relationship_refs: [],
      previous_cycle_judgment_refs: judgmentRefs
    },
    success_condition: {
      verifier: cg.success_verifier,
      evidence_required: cg.evidence_required
    },
    allowed_action_skill_ids:
      cg.allowed_action_skill_ids.length > 0
        ? cg.allowed_action_skill_ids
        : [...input.context.owned_action_skills.map((s) => s.skill_id)],
    allowed_primitive_ids:
      cg.allowed_primitive_ids.length > 0
        ? cg.allowed_primitive_ids
        : [...input.context.allowed_primitive_ids],
    stop_conditions: cg.stop_conditions
  };
}

/**
 * Produces the next bounded CycleGoal without granting domain strategy authority.
 *
 * @remarks The provider may prioritize shelter, storage, movement, or speech,
 * but only as pressure interpreted under ActorSoul/LifeGoal and the current
 * action surface.
 */
export async function runSocialCycleGoalProvider(input: {
  providerId: "openai-api" | "gemini-api" | "deterministic-social";
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  context: SocialCycleContextPacket;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  allowedActionSkillIds: string[];
  allowedPrimitiveIds: string[];
  runId?: string;
}): Promise<CycleGoalProviderResult> {
  const snapshotId = `goal-mind-${input.cycleId}-${randomUUID()}`;
  const turnId = input.cycleId;
  const providerInput = {
    stage: "goal_mind",
    ...input.context
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

  if (input.providerId === "deterministic-social") {
    const strategic = buildDeterministicStrategicGoal({
      soul: input.context.ActorSoul,
      lifeGoal: input.context.ActorLifeGoal,
      worldEventRefs: input.context.world_events.map((e) => `world-events/${e.event_id}.json`),
      judgmentRefs: input.context.previous_cycle_judgments.map((j) => j.ref)
    });
    const memoryRefs = listActorMemoryRefs(input.context.memory_packet).map((ref) => ref.memory_id);
    const cycleGoal = buildDeterministicCycleGoal({
      soul: input.context.ActorSoul,
      lifeGoal: input.context.ActorLifeGoal,
      cycleId: input.cycleId,
      strategicGoal: strategic,
      observationRefs: [],
      worldEventRefs: input.context.world_events.map((e) => `world-events/${e.event_id}.json`),
      memoryRefs,
      relationshipRefs: [],
      judgmentRefs: input.context.previous_cycle_judgments.map((j) => j.ref),
      allowedActionSkillIds: input.allowedActionSkillIds,
      allowedPrimitiveIds: input.allowedPrimitiveIds,
      source: "runtime_rule"
    });
    await writeStrategicGoal(input.actorWorkspaceRootDir, input.actorId, strategic);
    const { ref: cycleGoalRef } = await writeCycleGoal(
      input.actorWorkspaceRootDir,
      input.actorId,
      cycleGoal
    );
    const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: turnId,
      provider_id: input.providerId,
      model: "deterministic-social",
      created_at: new Date().toISOString(),
      raw_output_text: JSON.stringify({ strategic, cycleGoal }),
      parsed_output: { strategic, cycleGoal },
      proposal: { cycle_goal_ref: cycleGoalRef }
    });
    return {
      ok: true,
      strategicGoals: [strategic],
      cycleGoal,
      inputRef: inputPath,
      outputRef: outputPath,
      source: "runtime_rule"
    };
  }

  const system = `You are the cycle goal provider for a Minecraft social simulation actor.
ActorSoul and ActorLifeGoal are constitutional; never replace LifeGoal with a WorldEvent summary.
WorldEvents are pressure only. The word social means the actor has ActorSoul, an actor profile, and relationships; it does not mean every action must be chat or coordination.
Choose an ordinary Minecraft CycleGoal when the situation calls for it. Collecting logs is just collecting logs unless observation, memory, or relationships make it socially relevant.
The runtime provides the executable affordance surface separately; do not narrow the actor's body to a hand-coded strategy. Use the goal text, evidence requirements, and stop conditions to express priorities and blockers.
Use action_surface as the current actor body and affordance catalog. Direct entries are usable now; deferred entries are diagnostics about missing or non-exposed affordances.
For survival and settlement goals, value evidence of diversified progress: safe positioning, resource discovery, enough starter wood, crafting, stone/tool progression, and shared storage. Do not make surplus collection of one stocked material the continuing goal unless live evidence shows it is still the best need.
Use settlement_state and settlement_checklist as runtime-owned pressure/evidence about what is already complete, blocked, or pending. They are compatibility packets, not a universal home-building plan. Do not turn a satisfied checklist item into the next CycleGoal unless new evidence makes it relevant again.
Do not make shelter, home, base, or structure construction an always-on CycleGoal. Building is one possible social pressure among many, selected only when ActorSoul/LifeGoal, WorldEvent pressure, memory, or observation makes it relevant.
If blocker_histogram shows repeated blockers, select a CycleGoal that pivots or repairs the blocker rather than repeating the same failed primitive.
If observation includes nearbyResources or previous judgments include blocked evidence, use that context when setting the next CycleGoal, but do not force a fixed strategy. Choose a different plausible next direction such as movement, observation, gathering, crafting, speech, or memory based on the live context. Output JSON only.`;

  const user = JSON.stringify(providerInput);
  const providerCall = {
    schemaName: "social_goal_mind",
    schema: cycleGoalProviderSchema,
    system,
    user,
    usageContext: {
      runId: input.runId,
      actorId: input.actorId,
      turnId,
      stage: "goal_mind"
    }
  };
  const result = input.providerId === "gemini-api" ? await callGeminiJsonSchema<{
    strategic_goal_updates: Array<{
      summary: string;
      rationale: string;
      success_direction: string;
      current_blockers: string[];
    }>;
    cycle_goal: {
      summary: string;
      rationale: string;
      success_verifier: string;
      evidence_required: string[];
      stop_conditions: string[];
      allowed_action_skill_ids: string[];
      allowed_primitive_ids: string[];
    };
  }>({
    config: input.gemini!,
    ...providerCall
  }) : await callOpenAiJsonSchema<{
    strategic_goal_updates: Array<{
      summary: string;
      rationale: string;
      success_direction: string;
      current_blockers: string[];
    }>;
    cycle_goal: {
      summary: string;
      rationale: string;
      success_verifier: string;
      evidence_required: string[];
      stop_conditions: string[];
      allowed_action_skill_ids: string[];
      allowed_primitive_ids: string[];
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

  const payload = normalizeOpenAiJsonPayload(
    result.parsed as Record<string, unknown> & {
      strategic_goal_updates?: unknown;
      cycle_goal?: unknown;
    }
  );
  const updates = Array.isArray(payload.strategic_goal_updates)
    ? (payload.strategic_goal_updates as Array<{
        summary: string;
        rationale: string;
        success_direction: string;
        current_blockers: string[];
      }>)
    : [];
  if (!payload.cycle_goal) {
    const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: turnId,
      provider_id: input.providerId,
      model: result.model,
      created_at: new Date().toISOString(),
      raw_output_text: result.rawText,
      parsed_output: result.parsed as unknown as JsonValue,
      proposal: { error: "missing_cycle_goal" },
      usage: result.usageRecord
    });
    return {
      ok: false,
      error: "CycleGoal provider output missing cycle_goal",
      inputRef: inputPath,
      outputRef: outputPath
    };
  }

  const now = new Date().toISOString();
  const strategicGoals: StrategicGoal[] = updates.map((update) => ({
    schema: "actor-strategic-goal/v1",
    actor_id: input.actorId,
    strategic_goal_id: `strategic-${randomUUID()}`,
    life_goal_id: input.context.ActorLifeGoal.goal_id,
    status: "active",
    summary:
      typeof update.summary === "string" && update.summary.trim().length > 0
        ? update.summary.trim()
        : "Strategic pressure from LifeGoal and world state",
    rationale:
      typeof update.rationale === "string" && update.rationale.trim().length > 0
        ? update.rationale.trim()
        : "CycleGoal provider strategic update",
    derived_from: {
      soul_ref: soulRef(input.actorId),
      world_event_refs: input.context.world_events.map((e) => `world-events/${e.event_id}.json`),
      memory_refs: [],
      relationship_refs: [],
      previous_cycle_judgment_refs: input.context.previous_cycle_judgments.map((j) => j.ref)
    },
    success_direction: update.success_direction,
    current_blockers: asStringArray(update.current_blockers),
    updated_at: now
  }));

  for (const strategic of strategicGoals) {
    await writeStrategicGoal(input.actorWorkspaceRootDir, input.actorId, strategic);
  }

  const cycleGoal = cycleGoalFromLlm({
    context: input.context,
    cycleId: input.cycleId,
    strategicGoals,
    parsed: {
      cycle_goal: normalizeCycleGoalFields(
        (payload.cycle_goal ?? {}) as Record<string, unknown>,
        input.context
      )
    }
  });
  const validated = validateActorCycleGoal(cycleGoal);
  if (!validated.ok) {
    const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: turnId,
      provider_id: input.providerId,
      model: result.model,
      created_at: new Date().toISOString(),
      raw_output_text: result.rawText,
      parsed_output: { validation_errors: validated.errors },
      proposal: { error: "invalid_cycle_goal" },
      usage: result.usageRecord
    });
    return {
      ok: false,
      error: validated.errors.join("; "),
      inputRef: inputPath,
      outputRef: outputPath
    };
  }

  const { ref: cycleGoalRef } = await writeCycleGoal(
    input.actorWorkspaceRootDir,
    input.actorId,
    validated.cycleGoal
  );
  const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: turnId,
    provider_id: input.providerId,
    model: result.model,
    created_at: new Date().toISOString(),
    raw_output_text: result.rawText,
    parsed_output: result.parsed as unknown as JsonValue,
    proposal: { cycle_goal_ref: cycleGoalRef },
    usage: result.usageRecord
  });

  return {
    ok: true,
    strategicGoals,
    cycleGoal: validated.cycleGoal,
    inputRef: inputPath,
    outputRef: outputPath,
    source: "llm_planner"
  };
}

/** @deprecated Use runSocialCycleGoalProvider for new code. */
export async function runSocialGoalMindProvider(
  input: Parameters<typeof runSocialCycleGoalProvider>[0]
): Promise<CycleGoalProviderResult> {
  return runSocialCycleGoalProvider(input);
}
