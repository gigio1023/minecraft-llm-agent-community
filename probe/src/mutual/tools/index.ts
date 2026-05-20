import { toToolResult, withActionWrapper } from "./wrapper.js";
import type { ProbeBots } from "../../runtime/createBots.js";
import {
  buildActiveActionSkillGate,
  checkActiveActionSkillPermission
} from "../../runtime/activeActionSkillGate.js";
import { createMemory } from "../../runtime/memory.js";
import type { ActorActionSkillRecord } from "../../runtime/actorWorkspaceStore.js";
import type { AllowedTool as RuntimeAllowedTool } from "../../tools/index.js";
import { moveTo } from "../../tools/moveTo.js";
import { remember } from "../../tools/remember.js";
import { wait } from "../../tools/wait.js";
import type { MutualRuntimeState } from "../runtimeState.js";
import type {
  JsonObject,
  MutualActorId,
  MutualJsonValue,
  MutualStepRecord,
  Proposal,
  ToolResult
} from "../types.js";
import { converse } from "./converse.js";
import { dropItem } from "./dropItem.js";
import { lookAtActor } from "./lookAtActor.js";
import { observeWorld } from "./observeWorld.js";
import { replyTo } from "./replyTo.js";

export const allowedMutualTools = [
  "converse",
  "observe_world",
  "move_to",
  "wait",
  "remember",
  "drop_item"
] as const;

export type AllowedMutualTool = (typeof allowedMutualTools)[number];

// Scenario-only tools are accepted by the deterministic dispatcher, but are not
// exposed as live provider affordances.
const mutualScenarioAllowedTools = [
  "observe_world",
  "move_to",
  "say",
  "wait",
  "reply_to",
  "look_at_actor",
  "drop_item",
  "remember"
] as const;

export type ValidatedProposal = {
  tool: AllowedMutualTool;
  args: Record<string, unknown>;
  why?: string;
};

type MutualActor = {
  username: string;
  chat(message: string): void;
};

type TranscriptRecorder = {
  recordStep(step: MutualStepRecord): void;
};

type ToolHandlerContext = {
  actor: MutualActor;
  runtimeState: MutualRuntimeState;
  args: Record<string, unknown>;
};

type ToolHandlers = Partial<
  Record<
    Exclude<AllowedMutualTool, "converse">,
    (context: ToolHandlerContext) => Promise<MutualJsonValue> | MutualJsonValue
  >
>;

type ExecuteMutualToolArgs = {
  proposal: Proposal;
  actor: MutualActor;
  runtimeState: MutualRuntimeState;
  observation: MutualJsonValue;
  transcript?: TranscriptRecorder;
  handlers?: ToolHandlers;
  activeActionSkills?: readonly ActorActionSkillRecord[];
};

function readStringArg(args: Record<string, unknown>, name: string) {
  const value = args[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected non-empty string arg: ${name}`);
  }

  return value;
}

function readOptionalStringArg(args: Record<string, unknown>, name: string) {
  const value = args[name];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected optional string arg: ${name}`);
  }

  return value;
}

function toJsonRecord(args: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(args)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toJsonValue(value)])
  );
}

function toJsonValue(value: unknown): MutualJsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toJsonValue(entry)])
    );
  }

  throw new Error(`Mutual tool values must be JSON-safe, received ${typeof value}`);
}

export function validateProposal(proposal: Proposal): ValidatedProposal {
  // Live provider output must stay within the narrow mutual action set before
  // any Mineflayer side effect is allowed.
  if (!allowedMutualTools.includes(proposal.tool as AllowedMutualTool)) {
    throw new Error(`Unsupported mutual tool: ${proposal.tool}`);
  }

  return {
    tool: proposal.tool as AllowedMutualTool,
    args: proposal.args ?? {},
    ...(proposal.why ? { why: proposal.why } : {})
  };
}

export async function executeMutualTool({
  proposal,
  actor,
  runtimeState,
  observation,
  transcript,
  handlers = {},
  activeActionSkills
}: ExecuteMutualToolArgs): Promise<ToolResult> {
  return withActionWrapper(async () => {
    const validated = validateProposal(proposal);
    const permission = checkMutualActionSkillPermission(actor.username, validated.tool, activeActionSkills);
    if (!permission.allowed) {
      const blockedResult = {
        tool: validated.tool,
        ok: false,
        status: "blocked",
        message: permission.reason,
        active_action_skill_gate: {
          active_skill_ids: permission.activeSkillIds,
          allowed_primitives: permission.allowedPrimitives
        }
      };
      transcript?.recordStep({
        actor: actor.username,
        observation: toJsonValue(observation),
        actorAction: { tool: validated.tool },
        result: toJsonValue(blockedResult)
      });
      return blockedResult;
    }

    const actorArgs = toOptionalJsonRecord(validated.args);
    const actionResult =
      validated.tool === "converse"
        ? await converse({
            actor,
            runtimeState,
            utterance: readStringArg(validated.args, "utterance"),
            targetId: readOptionalStringArg(validated.args, "target")
          })
        : await executeHandler(validated.tool, handlers, {
            actor,
            runtimeState,
            args: validated.args
          });
    const memoryNote = readMemoryNote(validated.tool, actionResult as MutualJsonValue);

    // Runtime state updates happen before transcript write so the same step can
    // include action result plus derived thread/social context.
    runtimeState.recordToolResult?.(
      actor.username as MutualActorId,
      toToolResult(actionResult as Record<string, unknown>, validated.tool)
    );
    if (memoryNote) {
      runtimeState.rememberPrivateEvent?.(actor.username as MutualActorId, memoryNote.note);
    }

    const threadState = runtimeState.threadSnapshot?.(actor.username as MutualActorId);
    const sharedContext = runtimeState.socialContext?.(actor.username as MutualActorId);

    transcript?.recordStep({
      actor: actor.username,
      observation: toJsonValue(observation),
      ...(threadState ? { threadState: toJsonValue(threadState) as JsonObject } : {}),
      ...(sharedContext ? { sharedContext: toJsonValue(sharedContext) as JsonObject } : {}),
      actorAction: { tool: validated.tool },
      ...(actorArgs ? { actorArgs } : {}),
      ...(memoryNote ? { memoryNote } : {}),
      ...(validated.why ? { providerMeta: { why: validated.why } } : {}),
      result: toJsonValue(actionResult)
    });

    return actionResult;
  }, { tool: proposal.tool });
}

function mapMutualToolToRuntimePrimitive(tool: string): RuntimeAllowedTool | undefined {
  switch (tool) {
    case "converse":
    case "say":
    case "reply_to":
      return "say";
    case "observe_world":
      return "observe";
    case "move_to":
    case "look_at_actor":
      return "move_to";
    case "wait":
      return "wait";
    case "remember":
      return "remember";
    case "drop_item":
      // Legacy mutual marker handoff is a material-transfer action. Until
      // drop/pickup primitives exist, gate it through shared-deposit ownership.
      return "deposit_shared";
  }
}

function checkMutualActionSkillPermission(
  actorId: string,
  tool: string,
  activeActionSkills: readonly ActorActionSkillRecord[] | undefined
) {
  if (!activeActionSkills) {
    return { allowed: true as const };
  }

  const gate = buildActiveActionSkillGate({ actorId, activeActionSkills });
  const runtimePrimitive = mapMutualToolToRuntimePrimitive(tool);
  if (!runtimePrimitive) {
    return {
      allowed: false as const,
      reason: `Mutual tool ${tool} has no runtime primitive mapping for ${actorId}`,
      activeSkillIds: [...gate.activeSkillIds],
      allowedPrimitives: [...gate.allowedPrimitives]
    };
  }

  return checkActiveActionSkillPermission(gate, runtimePrimitive);
}

async function executeHandler(
  tool: Exclude<AllowedMutualTool, "converse">,
  handlers: ToolHandlers,
  context: ToolHandlerContext
) {
  const handler = handlers[tool];

  if (!handler) {
    // Provider drift is a runtime failure, not a silent no-op.
    throw new Error(`Tool not implemented: ${tool}`);
  }

  return handler(context);
}

function toOptionalJsonRecord(args: Record<string, unknown> | undefined) {
  if (!args) {
    return undefined;
  }

  const jsonArgs = toJsonRecord(args);
  return Object.keys(jsonArgs).length > 0 ? jsonArgs : undefined;
}

function readMemoryNote(tool: AllowedMutualTool, result: MutualJsonValue) {
  if (tool !== "remember" || !isJsonRecord(result) || typeof result.note !== "string") {
    return undefined;
  }

  return { note: result.note };
}

function isJsonRecord(value: MutualJsonValue): value is Record<string, MutualJsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateMutualProposal(proposal: Proposal): Proposal {
  // Deterministic scenario validation allows extra scripted tools used to prove
  // causal categories that live dialogue does not expose yet.
  if (
    !mutualScenarioAllowedTools.includes(
      proposal.tool as (typeof mutualScenarioAllowedTools)[number]
    )
  ) {
    throw new Error(`Unsupported mutual tool: ${proposal.tool}`);
  }

  return {
    tool: proposal.tool,
    args: proposal.args ?? {}
  };
}

type CreateMutualToolsArgs = {
  runtimeState: MutualRuntimeState;
  memories: Record<MutualActorId, ReturnType<typeof createMemory>>;
  activeActionSkillsByActor?: Partial<Record<MutualActorId, readonly ActorActionSkillRecord[]>>;
};

type ObserveWorldToolArgs = {
  actorId: MutualActorId;
  actor: ProbeBots[MutualActorId];
  targetId: MutualActorId;
  target: ProbeBots[MutualActorId];
};

type ExecuteScenarioToolArgs = ObserveWorldToolArgs & {
  proposal: Proposal;
  observation: JsonObject;
};

async function executeScenarioTool({
  actorId,
  actor,
  targetId,
  target,
  proposal,
  observation,
  runtimeState,
  memories,
  activeActionSkillsByActor
}: ExecuteScenarioToolArgs & CreateMutualToolsArgs): Promise<MutualStepRecord> {
  const permission = checkMutualActionSkillPermission(
    actorId,
    proposal.tool,
    activeActionSkillsByActor?.[actorId]
  );
  if (!permission.allowed) {
    return {
      category: "conversationTurnState",
      actorAction: { actor: actorId, tool: proposal.tool, result: "blocked" },
      targetObservation: observation,
      worldStateChange: {
        tool: proposal.tool,
        ok: false,
        status: "blocked",
        message: permission.reason,
        active_action_skill_gate: {
          active_skill_ids: permission.activeSkillIds,
          allowed_primitives: permission.allowedPrimitives
        }
      }
    };
  }

  // Each branch returns a transcript step with explicit category evidence, so
  // acceptance does not depend on the provider claiming the scenario succeeded.
  switch (proposal.tool) {
    case "observe_world":
      return {
        category: "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: "observed" }
      };
    case "move_to": {
      const result = await moveTo({ actor, target, targetId });
      return {
        category: "spatialAttentionApproach",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        worldStateChange: result
      };
    }
    case "say": {
      const text = String(proposal.args?.text ?? "");
      actor.chat(text);
      runtimeState.recordHeardMessage(targetId, {
        from: actorId,
        text
      });
      return {
        category: "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: "said" },
        targetObservation: observation,
        causedNext: { actor: targetId, tool: "reply_to" }
      };
    }
    case "wait": {
      const result = await wait({
        ticks: typeof proposal.args?.ticks === "number" ? proposal.args.ticks : 20
      });
      return {
        category: "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        worldStateChange: result
      };
    }
    case "reply_to": {
      const result = await replyTo({
        actor,
        source: target,
        runtimeState,
        text: String(proposal.args?.text ?? "")
      });
      return {
        category:
          observation.markerEntitySeen === true
            ? "materialEnvironmentHandoff"
            : "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        targetObservation: observation,
        targetResponse: {
          actor: actorId,
          tool: proposal.tool,
          result: result.status
        },
        causedNext: { actor: actorId, tool: proposal.tool }
      };
    }
    case "look_at_actor": {
      const result = await lookAtActor({ actor, target });
      return {
        category: "spatialAttentionApproach",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        worldStateChange: result
      };
    }
    case "drop_item": {
      const result = await dropItem({
        actor,
        runtimeState,
        itemName: String(proposal.args?.itemName ?? "paper"),
        count: typeof proposal.args?.count === "number" ? proposal.args.count : 1
      });
      return {
        category: "materialEnvironmentHandoff",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        worldStateChange: result
      };
    }
    case "remember": {
      const note = String(proposal.args?.note ?? "");
      const result = remember({
        memory: memories[actorId],
        note
      });
      return {
        category: runtimeState.hasDroppedMarker()
          ? "materialEnvironmentHandoff"
          : "conversationTurnState",
        actorAction: { actor: actorId, tool: proposal.tool, result: result.status },
        memoryNote: {
          actor: actorId,
          note
        }
      };
    }
    default:
      throw new Error(`Unsupported mutual tool: ${proposal.tool}`);
  }
}

export function createMutualTools({
  runtimeState,
  memories,
  activeActionSkillsByActor
}: CreateMutualToolsArgs) {
  return {
    lastResult(actorId: MutualActorId) {
      return runtimeState.lastResult(actorId);
    },
    validateProposal: validateMutualProposal,
    observe_world({ actor, target }: ObserveWorldToolArgs) {
      return observeWorld({
        actor,
        target,
        runtimeState,
        memory: memories[actor.username as MutualActorId]
      });
    },
    async execute(input: ExecuteScenarioToolArgs) {
      const step = await executeScenarioTool({
        ...input,
        runtimeState,
        memories,
        activeActionSkillsByActor
      });
      runtimeState.recordToolResult(
        input.actorId,
        toToolResult(
          {
            tool: input.proposal.tool,
            status: step.targetResponse?.result ?? step.actorAction.result ?? "unknown"
          },
          input.proposal.tool
        )
      );

      const threadState = runtimeState.threadSnapshot?.(input.actorId);
      const sharedContext = runtimeState.socialContext?.(input.actorId);

      // Enrich the step after recording the result so thread/social snapshots
      // reflect the just-executed action.
      return {
        ...step,
        ...(threadState ? { threadState: toJsonValue(threadState) as JsonObject } : {}),
        ...(sharedContext ? { sharedContext: toJsonValue(sharedContext) as JsonObject } : {})
      };
    }
  };
}
