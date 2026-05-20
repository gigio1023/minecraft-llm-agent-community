import type { AllowedTool, ToolProposal, ValidatedProposal } from "../tools/index.js";
import type { ToolResult } from "../mutual/types.js";
import type { ObserveResult } from "../tools/observe.js";
import { toToolResult } from "../mutual/tools/wrapper.js";
import { selectDeterministicTask } from "../gameplay/curriculum/deterministicCurriculum.js";
import { verifyTask, type TaskVerification } from "../gameplay/verification/verifyTask.js";
import { writeProviderInputSnapshot } from "../provider/providerInputStore.js";
import { writeActorEvidenceRecord } from "./evidence/actorEvidence.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";
import {
  buildActiveActionSkillGate,
  checkActiveActionSkillPermission,
  type ActiveActionSkillGate
} from "./activeActionSkillGate.js";
import { createAntiRepeatPolicy } from "./antiRepeat.js";
import { buildPressureIntentContext, type IntentRecord, type PressureIntentContext } from "./pressureIntent.js";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type RuntimeActor = {
  username: string;
};

type ToolContext<TActor extends RuntimeActor> = {
  actor: TActor;
  target: TActor;
  args: Record<string, unknown>;
};

type TranscriptRecorder = {
  recordStep(step: {
    actor: string;
    observation: JsonValue;
    task?: JsonValue;
    pressureContext?: JsonValue;
    tool: AllowedTool;
    args?: Record<string, JsonValue>;
    result: JsonValue;
    verification?: JsonValue;
  }): void;
};

type Provider = {
  next(input: {
    observation: ObserveResult;
    lastResult: ToolResult | null;
    currentTask?: ReturnType<typeof selectDeterministicTask>;
    activeActionSkillContext?: {
      activeSkillIds: string[];
      allowedPrimitives: AllowedTool[];
    };
  }): ToolProposal;
};

export type AgentLoopTools<TActor extends RuntimeActor> = {
  validateProposal(proposal: ToolProposal): ValidatedProposal;
  observe(input: { actor: TActor; target: TActor }): Promise<ObserveResult> | ObserveResult;
  move_to(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  collect_logs(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  craft_item(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  inspect_chest(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  deposit_shared(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  withdraw_shared(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  say(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  wait(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  remember(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
};

type AgentLoopArgs<TActor extends RuntimeActor> = {
  bots: {
    actor: TActor;
    target: TActor;
  };
  roleId?: string;
  provider: Provider;
  tools: AgentLoopTools<TActor>;
  transcript: TranscriptRecorder;
  initialCompletedTaskIds?: string[];
  activeActionSkills: readonly ActorActionSkillRecord[];
  stepDelayMs?: number;
  artifacts?: {
    actorWorkspaceRootDir: string;
    providerInputSnapshots?: {
      provider_id: string;
      model: string;
    };
  };
};

const MAX_STEPS = 10;

// Terminal notes are the current probe's human-readable stop condition. Keep
// the classifier conservative so a blocked/stalled transcript is never reported
// as success only because the provider chose the remember tool.
function classifyTerminalNote(note: string) {
  return /blocked repeatedly|failed|stalled|timeout/i.test(note)
    ? "failed"
    : "success";
}

function toJsonRecord(args: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => [key, toJsonValue(value)])
  );
}

function toJsonValue(value: unknown): JsonValue {
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

  throw new Error(`Tool args must be JSON-safe, received ${typeof value}`);
}

function shouldVerifyTaskProgress(
  currentTask: ReturnType<typeof selectDeterministicTask>,
  tool: AllowedTool
) {
  return (
    currentTask !== null &&
    currentTask !== undefined &&
    tool !== "observe" &&
    tool !== "wait" &&
    tool !== "remember"
  );
}

async function executeTool<TActor extends RuntimeActor>(
  tools: AgentLoopTools<TActor>,
  validated: ValidatedProposal,
  actor: TActor,
  target: TActor,
  observation: ObserveResult
): Promise<ToolResult> {
  switch (validated.tool) {
    case "observe":
      return {
        tool: "observe",
        ok: true,
        status: observation.status,
        observation
      };
    case "move_to":
      return tools.move_to({ actor, target, args: validated.args });
    case "collect_logs":
      return tools.collect_logs({ actor, target, args: validated.args });
    case "craft_item":
      return tools.craft_item({ actor, target, args: validated.args });
    case "inspect_chest":
      return tools.inspect_chest({ actor, target, args: validated.args });
    case "deposit_shared":
      return tools.deposit_shared({ actor, target, args: validated.args });
    case "withdraw_shared":
      return tools.withdraw_shared({ actor, target, args: validated.args });
    case "say":
      return tools.say({ actor, target, args: validated.args });
    case "wait":
      return tools.wait({ actor, target, args: validated.args });
    case "remember":
      return tools.remember({ actor, target, args: validated.args });
  }
}

export async function runAgentLoop<TActor extends RuntimeActor>({
  bots,
  roleId,
  provider,
  tools,
  transcript,
  initialCompletedTaskIds = [],
  activeActionSkills,
  stepDelayMs = 1000,
  artifacts
}: AgentLoopArgs<TActor>) {
  const actor = bots.actor;
  const target = bots.target;
  let lastResult: ToolResult | null = null;
  let previousIntent: IntentRecord | undefined;
  const antiRepeat = createAntiRepeatPolicy();
  const completedTaskIds = new Set<string>(initialCompletedTaskIds);
  const activeActionSkillGate = buildActiveActionSkillGate({
    actorId: actor.username,
    activeActionSkills
  });
  const activeActionSkillContext = {
    activeSkillIds: activeActionSkillGate.activeSkillIds,
    allowedPrimitives: activeActionSkillGate.allowedPrimitives
  };

  for (let step = 0; step < MAX_STEPS; step += 1) {
    // Every turn starts from Mineflayer-observed state. The provider can choose
    // a primitive, but it cannot invent progress or carry stale inventory state.
    const observation = await tools.observe({ actor, target });
    const selectedTask = selectDeterministicTask({
      visibleActors: observation.visibleActors.map((visibleActor) => ({
        id: visibleActor.id,
        distance: visibleActor.distance
      })),
      ...(observation.inventory ? { inventory: observation.inventory } : {}),
      ...(observation.sharedChest ? { sharedChest: observation.sharedChest } : {}),
      completedTaskIds: [...completedTaskIds]
    });
    const currentTask =
      selectedTask && roleId && !selectedTask.preferredActorRoles.includes(roleId)
        ? null
        : selectedTask;

    // Pressure/intent context is recorded even while the provider remains
    // deterministic so future agent-loop changes can explain why a primitive
    // was allowed, continued, or interrupted.
    const pressureContext = buildPressureIntentContext({
      actorId: actor.username,
      turn: step + 1,
      observation,
      currentTask,
      completedTaskIds: [...completedTaskIds],
      previousIntent
    });
    previousIntent = pressureContext.currentIntent;

    const turnId = `turn-${String(step + 1).padStart(4, "0")}`;
    const providerInput = {
      observation,
      lastResult,
      currentTask,
      activeActionSkillContext
    };
    await recordProviderInputSnapshotIfRequested({
      artifacts,
      actorId: actor.username,
      turnId,
      providerInput: toJsonValue(providerInput)
    });

    const proposal = provider.next(providerInput);
    const validated = tools.validateProposal(proposal);
    const execution = await executePhaseOneTool({
      tools,
      validated,
      actor,
      target,
      observation,
      currentTask,
      actorId: actor.username,
      activeActionSkillGate,
      antiRepeat
    });
    const result = execution.result;
    const verification = execution.verification ?? readVerification(result);

    await recordVerificationEvidenceIfNeeded({
      artifacts,
      actor,
      turnId,
      currentTask,
      pressureContext,
      tool: validated.tool,
      args: validated.args,
      before: observation,
      after: execution.postObservation,
      result,
      verification
    });

    transcript.recordStep({
      actor: actor.username,
      observation: toJsonValue(observation),
      ...(currentTask ? { task: toJsonValue(currentTask) } : {}),
      pressureContext: toJsonValue(pressureContext),
      tool: validated.tool,
      args: Object.keys(validated.args).length > 0 ? toJsonRecord(validated.args) : undefined,
      result: toJsonValue(result),
      ...(verification ? { verification: toJsonValue(verification) } : {})
    });

    lastResult = toToolResult(result, validated.tool);

    if (currentTask && verification?.status === "passed") {
      completedTaskIds.add(currentTask.id);
    }

    // Keep probe turns visually separable in live logs without using delay as a
    // success signal; verification above is the only task-completion gate.
    if (stepDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, stepDelayMs));
    }

    if (validated.tool === "remember") {
      const note =
        typeof result.note === "string"
          ? result.note
          : "runtime-owned curriculum reached a terminal note";

      return {
        status: classifyTerminalNote(note),
        why: note
      };
    }
  }

  throw new Error(`Agent loop exhausted ${MAX_STEPS}-step budget without remember`);
}

function readVerification(result: ToolResult) {
  if (typeof result.verification !== "object" || result.verification === null) {
    return undefined;
  }

  return result.verification as TaskVerification;
}

async function executePhaseOneTool<TActor extends RuntimeActor>(input: {
  tools: AgentLoopTools<TActor>;
  validated: ValidatedProposal;
  actor: TActor;
  target: TActor;
  observation: ObserveResult;
  currentTask: ReturnType<typeof selectDeterministicTask>;
  actorId: string;
  activeActionSkillGate: ActiveActionSkillGate;
  antiRepeat: ReturnType<typeof createAntiRepeatPolicy>;
}): Promise<{
  result: ToolResult;
  verification?: TaskVerification;
  postObservation?: ObserveResult;
}> {
  const {
    tools,
    validated,
    actor,
    target,
    observation,
    currentTask,
    actorId,
    activeActionSkillGate,
    antiRepeat
  } = input;

  const shouldVerifyCurrentTask = shouldVerifyTaskProgress(currentTask, validated.tool);

  const permission = checkActiveActionSkillPermission(activeActionSkillGate, validated.tool);

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
    } satisfies ToolResult;
    const verification =
      shouldVerifyCurrentTask && currentTask
        ? verifyTask(currentTask, {
            before: observation,
            after: observation,
            result: blockedResult
          })
        : undefined;

    return {
      result: verification
        ? ({
            ...blockedResult,
            verification
          } satisfies ToolResult)
        : blockedResult,
      verification,
      postObservation: observation
    };
  }

  if (currentTask && !currentTask.primitiveIds.includes(validated.tool)) {
    // The runtime owns curriculum boundaries; provider proposals cannot expand
    // the current task's allowed action-skill primitives.
    if (validated.tool === "remember") {
      // remember is always permitted as an explicit terminal/status artifact,
      // even when the current task would not allow it as gameplay progress.
      return { result: await executeTool(tools, validated, actor, target, observation) };
    }

    return {
      result: {
        tool: validated.tool,
        ok: false,
        status: "invalid",
        message: `Task ${currentTask.id} does not allow ${validated.tool}`
      } satisfies ToolResult
    };
  }

  if (
    shouldVerifyCurrentTask &&
    currentTask &&
    antiRepeat.shouldBlock({
      actorId,
      tool: validated.tool,
      args: validated.args
    })
  ) {
    // Repeated identical failures are recorded as runtime blocks, not hidden
    // retries, so transcripts explain stalls without another live reproduction.
    const verification = verifyTask(currentTask, {
      before: observation,
      after: observation,
      result: {
        tool: validated.tool,
        ok: false,
        status: "blocked"
      }
    });

    return {
      result: {
        tool: validated.tool,
        ok: false,
        status: "blocked",
        message: `Repeated failed ${validated.tool} attempt blocked by runtime policy`,
        verification
      } satisfies ToolResult,
      verification,
      postObservation: observation
    };
  }

  const result = await executeTool(tools, validated, actor, target, observation);

  if (!shouldVerifyCurrentTask || !currentTask) {
    return { result };
  }

  // Verify against a fresh post-action observation; movement or animation alone
  // is not accepted as task progress. This is the main fake-progress rejection
  // boundary between provider text and Minecraft state.
  const after = await tools.observe({ actor, target });
  const verification = verifyTask(currentTask, {
    before: observation,
    after,
    result
  });

  antiRepeat.record({
    actorId,
    tool: validated.tool,
    args: validated.args,
    verificationStatus: verification.status
  });

  return {
    result: {
      ...result,
      verification
    } satisfies ToolResult,
    verification,
    postObservation: after
  };
}

async function recordProviderInputSnapshotIfRequested(input: {
  artifacts: AgentLoopArgs<RuntimeActor>["artifacts"] | undefined;
  actorId: string;
  turnId: string;
  providerInput: JsonValue;
}) {
  const snapshotConfig = input.artifacts?.providerInputSnapshots;

  if (!input.artifacts || !snapshotConfig) {
    return;
  }

  await writeProviderInputSnapshot(input.artifacts.actorWorkspaceRootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: input.turnId,
    actor_id: input.actorId,
    turn_id: input.turnId,
    provider_id: snapshotConfig.provider_id,
    model: snapshotConfig.model,
    created_at: new Date().toISOString(),
    input: input.providerInput
  });
}

function readActorPosition(actor: RuntimeActor) {
  const maybePosition = (actor as {
    entity?: { position?: { x?: unknown; y?: unknown; z?: unknown } };
  }).entity?.position;

  if (
    typeof maybePosition?.x !== "number" ||
    typeof maybePosition.y !== "number" ||
    typeof maybePosition.z !== "number"
  ) {
    return undefined;
  }

  return {
    x: maybePosition.x,
    y: maybePosition.y,
    z: maybePosition.z
  };
}

function isFakeProgressFailure(result: ToolResult, verification: TaskVerification) {
  return verification.status === "failed" && result.ok !== false;
}

async function recordVerificationEvidenceIfNeeded<TActor extends RuntimeActor>(input: {
  artifacts: AgentLoopArgs<TActor>["artifacts"] | undefined;
  actor: TActor;
  turnId: string;
  currentTask: ReturnType<typeof selectDeterministicTask>;
  pressureContext: PressureIntentContext;
  tool: AllowedTool;
  args: Record<string, unknown>;
  before: ObserveResult;
  after?: ObserveResult;
  result: ToolResult;
  verification?: TaskVerification;
}) {
  if (!input.artifacts || !input.verification || input.verification.status !== "failed") {
    return;
  }

  const category = isFakeProgressFailure(input.result, input.verification)
    ? "fake_progress_rejection"
    : "verification_failure";
  const idPrefix = category === "fake_progress_rejection" ? "fake-progress" : "verification-failure";

  await writeActorEvidenceRecord(input.artifacts.actorWorkspaceRootDir, {
    schema: "actor-evidence/v1",
    evidence_id: `${idPrefix}-${input.turnId}-${input.tool}`,
    actor_id: input.actor.username,
    category,
    created_at: new Date().toISOString(),
    turn_id: input.turnId,
    target:
      input.currentTask && "targetId" in input.currentTask
        ? input.currentTask.targetId
        : input.currentTask?.id,
    pre_position: toJsonValue(readActorPosition(input.actor) ?? null),
    post_position: toJsonValue(readActorPosition(input.actor) ?? null),
    tool_attempt: toJsonValue({
      tool: input.tool,
      args: toJsonRecord(input.args),
      result: input.result
    }),
    verifier_reason: input.verification.reason,
    missing_delta: toJsonValue(input.verification.progress),
    data: toJsonValue({
      task: input.currentTask,
      pressureContext: input.pressureContext,
      tool: input.tool,
      args: toJsonRecord(input.args),
      before: input.before,
      after: input.after ?? null,
      result: input.result,
      verification: input.verification
    })
  });
}
