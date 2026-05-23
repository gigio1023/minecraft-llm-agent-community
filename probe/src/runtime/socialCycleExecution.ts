import { randomUUID } from "node:crypto";
import type { Bot } from "mineflayer";

import type { AllowedTool } from "../tools/index.js";
import { validateProposal } from "../tools/index.js";
import type { ActionIntent } from "./goals/types.js";
import type { ActorCycleGoal } from "./goals/types.js";
import {
  buildActiveActionSkillGate,
  checkActiveActionSkillPermission,
  type ActiveActionSkillGate
} from "./activeActionSkillGate.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";
import { writeActorEvidenceRecord } from "./evidence/actorEvidence.js";
import { createDialogueState } from "./dialogueState.js";
import { createMemory } from "./memory.js";
import { observe, type ObserveResult } from "../tools/observe.js";
import { wait } from "../tools/wait.js";
import { remember } from "../tools/remember.js";
import { collectLogs } from "../tools/collectLogs.js";
import { mineBlock } from "../tools/mineBlock.js";
import { say } from "../tools/say.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import { getActorWorkspacePaths } from "./actorWorkspacePaths.js";
import { compileAllowedPrimitiveIds } from "./intentToSkill.js";
import type { IntentKind } from "./pressureIntent.js";
import type { RoleId } from "../npc/roles/contracts.js";
import { deriveProgressVerifierStatus } from "./socialCycleProgress.js";

export type SocialCycleExecutionResult = {
  observation: ObserveResult | Record<string, unknown>;
  runtimeResult: JsonValue;
  evidenceRefs: string[];
  executedTools: string[];
  verifierStatus: "passed" | "failed" | "not_applicable";
  gateBlocked: boolean;
  actionSkillExecutionUnit: boolean;
};

function syntheticObservation(actorId: string): ObserveResult {
  return {
    status: "ok",
    observerId: actorId,
    visibleActors: [],
    memory: ["synthetic observation: no live world connection"],
    inventory: []
  };
}

function asObserveActor(bot: Bot) {
  return bot as unknown as Parameters<typeof observe>[0]["actor"];
}

export async function observeActorWorld(input: {
  actorId: string;
  bot?: Bot;
  targetBot?: Bot;
}): Promise<ObserveResult | Record<string, unknown>> {
  if (!input.bot) {
    return syntheticObservation(input.actorId);
  }

  const dialogueState = createDialogueState({ busyRepliesBeforeAvailable: 0 });
  const memory = createMemory(8);
  const target = input.targetBot ?? input.bot;
  return observe({
    actor: asObserveActor(input.bot),
    target: asObserveActor(target),
    dialogueState,
    memory
  });
}

export function evidenceRefFromPath(actorDir: string, evidencePath: string) {
  return evidencePath.startsWith(actorDir)
    ? evidencePath.slice(actorDir.length + 1)
    : evidencePath;
}

async function writeToolEvidence(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  evidenceId: string;
  tool: string;
  args: Record<string, unknown>;
  result: JsonValue;
  verifierReason: string;
}) {
  const paths = getActorWorkspacePaths(input.actorWorkspaceRootDir, input.actorId);
  const evidencePath = await writeActorEvidenceRecord(input.actorWorkspaceRootDir, {
    schema: "actor-evidence/v1",
    evidence_id: input.evidenceId,
    actor_id: input.actorId,
    category: "tool_attempt",
    created_at: new Date().toISOString(),
    turn_id: input.cycleId,
    tool_attempt: {
      tool: input.tool,
      args: JSON.parse(JSON.stringify(input.args)) as JsonValue,
      result: input.result
    },
    verifier_reason: input.verifierReason
  });
  return evidenceRefFromPath(paths.actorDir, evidencePath);
}

function readToolStatus(toolResult: JsonValue): string {
  if (
    typeof toolResult === "object" &&
    toolResult !== null &&
    !Array.isArray(toolResult) &&
    typeof (toolResult as { status?: unknown }).status === "string"
  ) {
    return String((toolResult as { status: string }).status);
  }
  return "unknown";
}

function readTicks(args: Record<string, unknown>) {
  return typeof args.ticks === "number" ? args.ticks : 20;
}

function readString(args: Record<string, unknown>, key: string, fallback: string) {
  return typeof args[key] === "string" ? args[key] : fallback;
}

function readOptionalCount(args: Record<string, unknown>) {
  return typeof args.targetCount === "number" ? args.targetCount : undefined;
}

async function runSocialPrimitive(input: {
  tool: AllowedTool;
  args: Record<string, unknown>;
  bot: Bot;
  targetBot?: Bot;
}): Promise<JsonValue> {
  const dialogueState = createDialogueState({ busyRepliesBeforeAvailable: 0 });
  const memory = createMemory(8);
  const actor = asObserveActor(input.bot);
  const target = asObserveActor(input.targetBot ?? input.bot);
  const proposal = validateProposal({ tool: input.tool, args: input.args });

  switch (proposal.tool) {
    case "observe": {
      const observed = await observe({ actor, target, dialogueState, memory });
      return observed as unknown as JsonValue;
    }
    case "wait":
      return (await wait({ ticks: readTicks(proposal.args) })) as unknown as JsonValue;
    case "remember":
      return remember({
        memory,
        note: readString(proposal.args, "note", "social cycle")
      }) as unknown as JsonValue;
    case "collect_logs":
      return (await collectLogs({
        bot: input.bot,
        targetCount: readOptionalCount(proposal.args)
      })) as unknown as JsonValue;
    case "mine_block":
      return (await mineBlock({
        bot: input.bot,
        blockName: readString(proposal.args, "blockName", "stone"),
        targetCount: readOptionalCount(proposal.args)
      })) as unknown as JsonValue;
    case "say":
      return (await say({
        actor: input.bot as unknown as Parameters<typeof say>[0]["actor"],
        target: (input.targetBot ?? input.bot) as unknown as Parameters<typeof say>[0]["target"],
        dialogueState,
        text: readString(proposal.args, "text", "acknowledged")
      })) as unknown as JsonValue;
    default:
      return { status: "error", why: `Unsupported primitive in social slice: ${proposal.tool}` };
  }
}

async function executePrimitiveWithEvidence(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  tool: AllowedTool;
  args: Record<string, unknown>;
  bot?: Bot;
  targetBot?: Bot;
  gate: ActiveActionSkillGate;
}): Promise<{
  toolResult: JsonValue;
  evidenceRef: string;
  gateBlocked: boolean;
  status: string;
}> {
  const permission = checkActiveActionSkillPermission(input.gate, input.tool);
  if (!permission.allowed) {
    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: input.cycleId,
      evidenceId: `${input.cycleId}-${input.tool}-gate-blocked`,
      tool: input.tool,
      args: input.args,
      result: { status: "blocked", reason: permission.reason },
      verifierReason: permission.reason
    });
    return { toolResult: { status: "blocked", reason: permission.reason }, evidenceRef: ref, gateBlocked: true, status: "blocked" };
  }

  if (!input.bot) {
    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: input.cycleId,
      evidenceId: `${input.cycleId}-${input.tool}-synthetic`,
      tool: input.tool,
      args: input.args,
      result: { status: "blocked", reason: "No live bot for primitive execution" },
      verifierReason: "no_bot"
    });
    return {
      toolResult: { status: "blocked", reason: "No live bot for primitive execution" },
      evidenceRef: ref,
      gateBlocked: true,
      status: "blocked"
    };
  }

  let toolResult: JsonValue;
  try {
    toolResult = await runSocialPrimitive({
      tool: input.tool,
      args: input.args,
      bot: input.bot,
      targetBot: input.targetBot
    });
  } catch (error) {
    toolResult = {
      status: "error",
      why: error instanceof Error ? error.message : String(error)
    };
  }

  const status = readToolStatus(toolResult);
  const ref = await writeToolEvidence({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    cycleId: input.cycleId,
    evidenceId: `${input.cycleId}-${input.tool}`,
    tool: input.tool,
    args: input.args,
    result: toolResult,
    verifierReason: status
  });
  return { toolResult, evidenceRef: ref, gateBlocked: false, status };
}

export async function executeSocialActionIntent(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  cycleGoal: ActorCycleGoal;
  intent: ActionIntent;
  activeActionSkills: readonly ActorActionSkillRecord[];
  bot?: Bot;
  targetBot?: Bot;
}): Promise<SocialCycleExecutionResult> {
  const observation = await observeActorWorld({
    actorId: input.actorId,
    bot: input.bot,
    targetBot: input.targetBot
  });

  const evidenceRefs: string[] = [];
  const executedTools: string[] = [];
  let gateBlocked = false;
  let actionSkillExecutionUnit = false;
  const memory = createMemory(8);

  if (input.intent.kind === "wait" || input.intent.kind === "remember") {
    if (!input.bot) {
      const ref = await writeToolEvidence({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        cycleId: input.cycleId,
        evidenceId: `synthetic-${input.cycleId}-${randomUUID()}`,
        tool: input.intent.kind,
        args: input.intent.args,
        result: { status: "ok", synthetic: true },
        verifierReason: `synthetic ${input.intent.kind}`
      });
      evidenceRefs.push(ref);
      executedTools.push(input.intent.kind);
      return {
        observation,
        runtimeResult: { status: "ok", synthetic: true, kind: input.intent.kind },
        evidenceRefs,
        executedTools,
        verifierStatus: "not_applicable",
        gateBlocked: false,
        actionSkillExecutionUnit: false
      };
    }

    const result =
      input.intent.kind === "wait"
        ? await wait({ ticks: readTicks(input.intent.args) })
        : remember({ memory, note: readString(input.intent.args, "note", "social cycle note") });

    const ref = await writeToolEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: input.cycleId,
      evidenceId: `${input.cycleId}-${input.intent.kind}`,
      tool: input.intent.kind,
      args: input.intent.args,
      result: result as unknown as JsonValue,
      verifierReason: "status" in result ? String(result.status) : "ok"
    });
    evidenceRefs.push(ref);
    executedTools.push(input.intent.kind);

    return {
      observation,
      runtimeResult: result as unknown as JsonValue,
      evidenceRefs,
      executedTools,
      verifierStatus: "not_applicable",
      gateBlocked: false,
      actionSkillExecutionUnit: false
    };
  }

  const resolved = resolvePrimitivesForSocialIntent(input.intent, input.activeActionSkills);
  let primitivesToRun = resolved.primitives;
  actionSkillExecutionUnit = resolved.actionSkillExecutionUnit;

  if (resolved.blockedReason) {
    return {
      observation,
      runtimeResult: { status: "blocked", reason: resolved.blockedReason },
      evidenceRefs,
      executedTools,
      verifierStatus: "not_applicable",
      gateBlocked: true,
      actionSkillExecutionUnit
    };
  }

  if (primitivesToRun.length === 0) {
    return {
      observation,
      runtimeResult: { status: "blocked", reason: "No primitive resolved for intent" },
      evidenceRefs,
      executedTools,
      verifierStatus: "not_applicable",
      gateBlocked: true,
      actionSkillExecutionUnit
    };
  }

  for (const primitive of primitivesToRun) {
    if (!input.cycleGoal.allowed_primitive_ids.includes(primitive)) {
      return {
        observation,
        runtimeResult: {
          status: "blocked",
          reason: `Primitive ${primitive} not allowed by CycleGoal`
        },
        evidenceRefs,
        executedTools,
        verifierStatus: "not_applicable",
        gateBlocked: true,
        actionSkillExecutionUnit
      };
    }
  }

  let gate: ActiveActionSkillGate;
  try {
    gate = buildActiveActionSkillGate({
      actorId: input.actorId,
      activeActionSkills: input.activeActionSkills
    });
  } catch (error) {
    return {
      observation,
      runtimeResult: {
        status: "blocked",
        reason: error instanceof Error ? error.message : String(error)
      },
      evidenceRefs,
      executedTools,
      verifierStatus: "not_applicable",
      gateBlocked: true,
      actionSkillExecutionUnit
    };
  }

  let lastToolResult: JsonValue = { status: "blocked", reason: "No primitives executed" };
  let lastStatus = "unknown";

  for (const primitive of primitivesToRun) {
    const step = await executePrimitiveWithEvidence({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      cycleId: input.cycleId,
      tool: primitive,
      args: input.intent.args,
      bot: input.bot,
      targetBot: input.targetBot,
      gate
    });
    evidenceRefs.push(step.evidenceRef);
    executedTools.push(primitive);
    lastToolResult = step.toolResult;
    lastStatus = step.status;

    if (step.gateBlocked || step.status === "error" || step.status === "blocked") {
      gateBlocked = step.gateBlocked;
      break;
    }
  }

  const verifierStatus = deriveProgressVerifierStatus({
    executedTools,
    lastToolStatus: lastStatus
  });

  return {
    observation,
    runtimeResult: {
      action_skill_execution_unit: actionSkillExecutionUnit,
      executed_tools: executedTools,
      last_tool_result: lastToolResult
    },
    evidenceRefs,
    executedTools,
    verifierStatus,
    gateBlocked,
    actionSkillExecutionUnit
  };
}

const SOCIAL_RESOURCE_PRESSURE_INTENTS: IntentKind[] = [
  "bootstrap_progress",
  "resupply_shared_storage",
  "recover_basic_tools"
];

function socialIntentKindsForRole(roleId: RoleId): IntentKind[] {
  switch (roleId) {
    case "gatherer":
      return ["bootstrap_progress", "resupply_shared_storage"];
    case "crafter":
      return ["bootstrap_progress", "recover_basic_tools"];
    case "quartermaster":
      return ["bootstrap_progress", "resupply_shared_storage", "inspect_settlement_state"];
    default:
      return ["bootstrap_progress"];
  }
}

export function resolvePrimitivesForSocialIntent(
  intent: ActionIntent,
  activeActionSkills: readonly ActorActionSkillRecord[]
): {
  primitives: AllowedTool[];
  actionSkillExecutionUnit: boolean;
  blockedReason?: string;
} {
  if (intent.kind === "use_primitive" && intent.primitive_id) {
    return {
      primitives: [intent.primitive_id as AllowedTool],
      actionSkillExecutionUnit: false
    };
  }

  if (intent.kind === "use_action_skill" && intent.action_skill_id) {
    const owned = activeActionSkills.find((skill) => skill.skill_id === intent.action_skill_id);
    if (!owned || owned.required_primitives.length === 0) {
      return {
        primitives: [],
        actionSkillExecutionUnit: false,
        blockedReason: "No owned action skill primitives for intent"
      };
    }
    return {
      primitives: owned.required_primitives.map((primitive) => primitive as AllowedTool),
      actionSkillExecutionUnit: true
    };
  }

  return {
    primitives: [],
    actionSkillExecutionUnit: false,
    blockedReason: "No primitive resolved for intent"
  };
}

/** Resource-pressure allowlist for social cycles; not the generic nearby-opportunity compile path. */
export function compileSocialAllowedPrimitives(roleId: string) {
  const primitiveIds = new Set<string>();
  for (const intentKind of socialIntentKindsForRole(roleId as RoleId)) {
    for (const primitiveId of compileAllowedPrimitiveIds({
      intentKind,
      roleId: roleId as RoleId,
      lifecycleMode: "normal"
    })) {
      primitiveIds.add(primitiveId);
    }
  }
  return [...primitiveIds];
}
