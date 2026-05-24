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

function executableOwnedActionSkills(
  context: SocialCycleContextPacket,
  cycleGoal: ActorCycleGoal
) {
  const allowedPrimitiveIds = new Set(cycleGoal.allowed_primitive_ids);
  return context.owned_action_skills.filter((skill) =>
    skill.required_primitives.length > 0 &&
    skill.required_primitives.every((primitive) =>
      isSocialExecutablePrimitive(primitive) && allowedPrimitiveIds.has(primitive)
    )
  );
}

function constrainCycleGoalForSocialExecutor(
  cycleGoal: ActorCycleGoal,
  context: SocialCycleContextPacket
): ActorCycleGoal {
  const allowedPrimitiveIds = cycleGoal.allowed_primitive_ids.filter(isSocialExecutablePrimitive);
  const cycleGoalWithExecutablePrimitives = {
    ...cycleGoal,
    allowed_primitive_ids: allowedPrimitiveIds
  };
  const ownedSkillIds = new Set(
    executableOwnedActionSkills(context, cycleGoalWithExecutablePrimitives).map((skill) => skill.skill_id)
  );
  return {
    ...cycleGoalWithExecutablePrimitives,
    allowed_action_skill_ids: cycleGoal.allowed_action_skill_ids.filter((skillId) =>
      ownedSkillIds.has(skillId)
    )
  };
}

function validateExecutableIntent(
  intent: ActionIntent,
  cycleGoal: ActorCycleGoal
): string | null {
  if (intent.kind === "use_primitive") {
    if (!intent.primitive_id || !cycleGoal.allowed_primitive_ids.includes(intent.primitive_id)) {
      return `Primitive ${intent.primitive_id ?? "<missing>"} is not executable in this social cycle`;
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

function runtimeAffordanceDescriptions(primitiveIds: readonly string[]) {
  const descriptions: Record<string, string> = {
    observe: "Refresh live inventory, nearby blocks, actors, and memory-facing state.",
    move_to: "Move to a bounded scouting waypoint or an observed resource position. Args may use {target:\"scout\", direction:\"north|east|south|west\", distance:2..12}, explicit x/y/z, or position:{x,y,z}.",
    collect_logs: "Try to gather reachable low log blocks; success requires log inventory increase. If blocked, runtime evidence may include nearbyLogHints for later movement or observation.",
    mine_block: "Mine a specific blockName such as stone when tool prerequisites exist; success requires inventory increase.",
    craft_item: "Craft an inventory recipe by itemName when ingredients exist.",
    craft_with_table: "Craft a table-bound recipe by itemName when a crafting table is nearby.",
    inspect_chest: "Inspect a nearby shared chest when settlement inventory matters.",
    deposit_shared: "Deposit a chosen itemName/count, or let runtime choose a useful surplus item, into a nearby shared chest.",
    withdraw_shared: "Withdraw a specific itemName/count from a nearby shared chest when that enables the next survival or settlement task.",
    say: "Speak when communication matters for this actor or relationship context.",
    wait: "Wait briefly when the world needs time or no better physical action is justified.",
    remember: "Record a blocker, observation, or decision when action would otherwise repeat blindly."
  };

  return primitiveIds.map((primitiveId) => ({
    primitive_id: primitiveId,
    description: descriptions[primitiveId] ?? "Runtime primitive"
  }));
}

export async function runSocialActionPlannerProvider(input: {
  providerId: "openai-api" | "deterministic-social";
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  cycleGoal: ActorCycleGoal;
  context: SocialCycleContextPacket;
  openAi?: OpenAiJsonProviderConfig;
  defaultPrimitive?: string;
  turnId?: string;
  actionIndex?: number;
  recentActionAttempts?: JsonValue;
}): Promise<ActionPlannerProviderResult> {
  const turnId = input.turnId ?? input.cycleId;
  const snapshotId = `action-planner-${turnId}-${randomUUID()}`;
  const plannerCycleGoal = constrainCycleGoalForSocialExecutor(input.cycleGoal, input.context);
  const ownedActionSkills = executableOwnedActionSkills(input.context, plannerCycleGoal);
  const providerInput = {
    stage: "action_planner",
    turn_id: turnId,
    action_index: input.actionIndex,
    ActorSoul: input.context.ActorSoul,
    ActorLifeGoal: input.context.ActorLifeGoal,
    cycle_goal: plannerCycleGoal,
    observation: input.context.observation,
    owned_action_skills: ownedActionSkills,
    allowed_primitive_ids: plannerCycleGoal.allowed_primitive_ids,
    runtime_affordances: runtimeAffordanceDescriptions(plannerCycleGoal.allowed_primitive_ids),
    previous_cycle_judgments: input.context.previous_cycle_judgments,
    recent_action_attempts: input.recentActionAttempts ?? []
  } as JsonValue;

  const inputPath = await writeProviderInputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: snapshotId,
    actor_id: input.actorId,
    turn_id: turnId,
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
      cycle_goal_id: plannerCycleGoal.goal_id,
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
ActorSoul and ActorLifeGoal are fixed context. The actor cares about social consequences according to its soul and relationships, but ordinary Minecraft actions do not need forced social framing.
Choose freely from runtime_affordances based on live observation, nearbyResources, memory, previous judgments, and recent attempts. If a physical action just failed, inspect its runtime_result and do not repeat it blindly; choose a different plausible affordance such as movement toward an observed resource hint, observation, another resource action, speech, or memory.
For a survival/settlement LifeGoal, repeated surplus of one material is weaker than broadening into tools, stone, storage, safer positioning, or scouting once inventory evidence shows the material is already stocked.
If craft_with_table is blocked because a crafting_table is far away or tablePosition is reported, move_to that position or observe current position before retrying table crafting. Do not retry the same table craft repeatedly from outside interaction range.
use_action_skill executes every required_primitive in order as one bundle; prefer use_primitive when a single runtime affordance is enough.
Do not claim success through text. Pick actions whose evidence can be verified by runtime outputs. JSON only.`,
      user: JSON.stringify(providerInput)
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
    return {
      ok: false,
      error: validated.errors.join("; "),
      inputRef: inputPath,
      outputRef: ""
    };
  }

  const executableError = validateExecutableIntent(validated.intent, plannerCycleGoal);
  if (executableError) {
    return {
      ok: false,
      error: executableError,
      inputRef: inputPath,
      outputRef: ""
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
