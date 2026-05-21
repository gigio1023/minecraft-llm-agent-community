import type { AllowedTool, ToolProposal, ValidatedProposal } from "../tools/index.js";
import type { ToolResult } from "../mutual/types.js";
import type { ObserveResult } from "../tools/observe.js";
import { toToolResult } from "../mutual/tools/wrapper.js";
import { selectDeterministicTask } from "../gameplay/curriculum/deterministicCurriculum.js";
import { verifyTask, type TaskVerification } from "../gameplay/verification/verifyTask.js";
import { buildActorGoalStack } from "../npc/goals/goalStack.js";
import { getActorProfile } from "../npc/profiles.js";
import {
  applyRelationshipEvent,
  createRelationshipEventRef,
  type RelationshipEventKind
} from "../npc/relationships/relationshipLedger.js";
import {
  readRelationshipEdge,
  writeRelationshipEdge
} from "../npc/relationships/relationshipStore.js";
import { buildActorProviderContext } from "../provider/actorProviderContext.js";
import { writeProviderInputSnapshot } from "../provider/providerInputStore.js";
import {
  writeProviderOutputSnapshot,
  type ProviderOutputSnapshot
} from "../provider/providerOutputStore.js";
import { writeActorEvidenceRecord } from "./evidence/actorEvidence.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";
import {
  enqueueActorReviewJob,
  snapshotActiveActionSkills
} from "../reviewer/reviewerQueue.js";
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
    providerOutputRef?: string;
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
    actorProviderContext?: JsonValue;
  }): Promise<ToolProposal & { providerTrace?: ProviderTrace }> | ToolProposal;
};

type ProviderTrace = {
  provider_id: string;
  model: string;
  raw_output_text: string;
  parsed_output: JsonValue;
  proposal: JsonValue;
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
  maxActions?: number;
  artifacts?: {
    actorWorkspaceRootDir: string;
    providerInputSnapshots?: {
      provider_id: string;
      model: string;
    };
    providerOutputSnapshots?: {
      provider_id: string;
      model: string;
    };
  };
};

const DEFAULT_MAX_ACTIONS = 10;

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
    Object.entries(args)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toJsonValue(value)])
  );
}

function toJsonValue(value: unknown): JsonValue {
  if (value === undefined) {
    return null;
  }

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
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, toJsonValue(entry)])
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
  maxActions = DEFAULT_MAX_ACTIONS,
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

  for (let step = 0; step < maxActions; step += 1) {
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
    const recentFailure =
      lastResult?.ok === false ||
      ["blocked", "failed", "timeout", "cancelled"].includes(String(lastResult?.status ?? ""));
    const goalStack = buildActorGoalStack({
      actorProfile: getActorProfile(actor.username),
      currentTask,
      recentFailure
    });

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
      goalStack,
      activeActionSkillContext,
      ...(artifacts
        ? {
            actorProviderContext: await buildActorProviderContext({
              actorWorkspaceRootDir: artifacts.actorWorkspaceRootDir,
              actorId: actor.username,
              activeActionSkills,
              memory: observation.memory,
              goalStack: toJsonValue(goalStack)
            })
          }
        : {})
    };
    const providerSnapshotPath = await recordProviderInputSnapshotIfRequested({
      artifacts,
      actorId: actor.username,
      turnId,
      providerInput: toJsonValue(providerInput)
    });

    const proposal = await provider.next(providerInput);
    const providerOutputSnapshotPath = await recordProviderOutputSnapshotIfRequested({
      artifacts,
      actorId: actor.username,
      turnId,
      proposal
    });
    const validated = tools.validateProposal(proposal);
    const preActionPosition = readActorPosition(actor);
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
    const postActionPosition = readActorPosition(actor);
    const result = execution.result;
    const verification = execution.verification ?? readVerification(result);

    const evidenceRefs = await recordTurnAndAttemptEvidenceIfRequested({
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
      verification,
      preActionPosition,
      postActionPosition
    });

    const failureEvidencePath = await recordVerificationEvidenceIfNeeded({
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
      verification,
      preActionPosition,
      postActionPosition,
      providerSnapshotPath,
      activeActionSkills
    });

    await recordRelationshipEventIfRequested({
      artifacts,
      actorId: actor.username,
      observerActorId: target.username,
      turnId,
      currentTask,
      verification,
      failureEvidencePath,
      toolAttemptEvidencePath: evidenceRefs?.toolAttemptEvidencePath
    });

    transcript.recordStep({
      actor: actor.username,
      observation: toJsonValue(observation),
      ...(currentTask ? { task: toJsonValue(currentTask) } : {}),
      pressureContext: toJsonValue(pressureContext),
      tool: validated.tool,
      args: Object.keys(validated.args).length > 0 ? toJsonRecord(validated.args) : undefined,
      ...(providerOutputSnapshotPath
        ? { providerOutputRef: providerOutputSnapshotPath }
        : {}),
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

  throw new Error(`Agent loop exhausted ${maxActions}-action budget without remember`);
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
}): Promise<string | undefined> {
  const snapshotConfig = input.artifacts?.providerInputSnapshots;

  if (!input.artifacts || !snapshotConfig) {
    return undefined;
  }

  return writeProviderInputSnapshot(input.artifacts.actorWorkspaceRootDir, {
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

async function recordProviderOutputSnapshotIfRequested(input: {
  artifacts: AgentLoopArgs<RuntimeActor>["artifacts"] | undefined;
  actorId: string;
  turnId: string;
  proposal: ToolProposal & { providerTrace?: ProviderTrace };
}): Promise<string | undefined> {
  const trace = input.proposal.providerTrace;
  const snapshotConfig = input.artifacts?.providerOutputSnapshots;

  if (!input.artifacts || !snapshotConfig || !trace) {
    return undefined;
  }

  const snapshot: ProviderOutputSnapshot = {
    schema: "provider-output-snapshot/v1",
    snapshot_id: input.turnId,
    actor_id: input.actorId,
    turn_id: input.turnId,
    provider_id: trace.provider_id || snapshotConfig.provider_id,
    model: trace.model || snapshotConfig.model,
    created_at: new Date().toISOString(),
    raw_output_text: trace.raw_output_text,
    parsed_output: trace.parsed_output,
    proposal: trace.proposal
  };

  return writeProviderOutputSnapshot(input.artifacts.actorWorkspaceRootDir, snapshot);
}

async function recordTurnAndAttemptEvidenceIfRequested<TActor extends RuntimeActor>(input: {
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
  preActionPosition?: ReturnType<typeof readActorPosition>;
  postActionPosition?: ReturnType<typeof readActorPosition>;
}) {
  if (!input.artifacts) {
    return undefined;
  }

  const target =
    input.currentTask && "targetId" in input.currentTask
      ? input.currentTask.targetId
      : input.currentTask?.id;
  const data = toJsonValue({
    task: input.currentTask,
    pressureContext: input.pressureContext,
    tool: input.tool,
    args: toJsonRecord(input.args),
    before: input.before,
    after: input.after ?? null,
    result: input.result,
    verification: input.verification ?? null
  });

  const turnEvidencePath = await writeActorEvidenceRecord(input.artifacts.actorWorkspaceRootDir, {
    schema: "actor-evidence/v1",
    evidence_id: `turn-${input.turnId}`,
    actor_id: input.actor.username,
    category: "turn",
    created_at: new Date().toISOString(),
    turn_id: input.turnId,
    ...(target ? { target } : {}),
    pre_position: toJsonValue(input.preActionPosition ?? null),
    post_position: toJsonValue(input.postActionPosition ?? null),
    data
  });

  const toolAttemptEvidencePath = await writeActorEvidenceRecord(input.artifacts.actorWorkspaceRootDir, {
    schema: "actor-evidence/v1",
    evidence_id: `tool-attempt-${input.turnId}-${input.tool}`,
    actor_id: input.actor.username,
    category: "tool_attempt",
    created_at: new Date().toISOString(),
    turn_id: input.turnId,
    ...(target ? { target } : {}),
    pre_position: toJsonValue(input.preActionPosition ?? null),
    post_position: toJsonValue(input.postActionPosition ?? null),
    tool_attempt: toJsonValue({
      tool: input.tool,
      args: toJsonRecord(input.args),
      result: input.result
    }),
    verifier_reason: input.verification?.reason,
    missing_delta: toJsonValue(input.verification?.progress ?? null),
    data
  });

  return {
    turnEvidencePath,
    toolAttemptEvidencePath
  };
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
  preActionPosition?: ReturnType<typeof readActorPosition>;
  postActionPosition?: ReturnType<typeof readActorPosition>;
  providerSnapshotPath?: string;
  activeActionSkills: readonly ActorActionSkillRecord[];
}) {
  if (!input.artifacts || !input.verification || input.verification.status !== "failed") {
    return undefined;
  }

  const category = isFakeProgressFailure(input.result, input.verification)
    ? "fake_progress_rejection"
    : "verification_failure";
  const idPrefix = category === "fake_progress_rejection" ? "fake-progress" : "verification-failure";

  const evidenceId = `${idPrefix}-${input.turnId}-${input.tool}`;
  const evidencePath = await writeActorEvidenceRecord(input.artifacts.actorWorkspaceRootDir, {
    schema: "actor-evidence/v1",
    evidence_id: evidenceId,
    actor_id: input.actor.username,
    category,
    created_at: new Date().toISOString(),
    turn_id: input.turnId,
    target:
      input.currentTask && "targetId" in input.currentTask
        ? input.currentTask.targetId
        : input.currentTask?.id,
    pre_position: toJsonValue(input.preActionPosition ?? null),
    post_position: toJsonValue(input.postActionPosition ?? null),
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

  await enqueueActorReviewJob(input.artifacts.actorWorkspaceRootDir, {
    schema: "actor-review-job/v1",
    job_id: evidenceId,
    actor_id: input.actor.username,
    reason: category,
    created_at: new Date().toISOString(),
    input_refs: [
      { kind: "evidence", ref: evidencePath },
      ...(input.providerSnapshotPath
        ? [{ kind: "provider_input" as const, ref: input.providerSnapshotPath }]
        : [])
    ],
    active_action_skill_snapshot: snapshotActiveActionSkills(input.activeActionSkills)
  });

  return evidencePath;
}

function relationshipEventKindForVerification(input: {
  currentTask: ReturnType<typeof selectDeterministicTask>;
  verification?: TaskVerification;
  failureEvidencePath?: string;
}): RelationshipEventKind | null {
  if (!input.currentTask || !input.verification) {
    return null;
  }

  if (input.verification.status === "failed") {
    return input.failureEvidencePath?.includes("fake-progress")
      ? "fake_progress_rejected"
      : "verification_failed";
  }

  if (input.verification.status !== "passed") {
    return null;
  }

  switch (input.currentTask.id) {
    case "deposit_shared_materials":
      return "shared_storage_updated";
  }

  return null;
}

async function recordRelationshipEventIfRequested<TActor extends RuntimeActor>(input: {
  artifacts: AgentLoopArgs<TActor>["artifacts"] | undefined;
  actorId: string;
  observerActorId: string;
  turnId: string;
  currentTask: ReturnType<typeof selectDeterministicTask>;
  verification?: TaskVerification;
  failureEvidencePath?: string;
  toolAttemptEvidencePath?: string;
}) {
  if (!input.artifacts || input.actorId === input.observerActorId) {
    return;
  }

  const eventKind = relationshipEventKindForVerification(input);
  if (!eventKind) {
    return;
  }

  const evidenceRef = input.failureEvidencePath ?? input.toolAttemptEvidencePath;
  if (!evidenceRef) {
    return;
  }

  const currentEdge = await readRelationshipEdge(
    input.artifacts.actorWorkspaceRootDir,
    input.observerActorId,
    input.actorId
  );
  const nextEdge = applyRelationshipEvent(
    currentEdge,
    createRelationshipEventRef({
      id: `${eventKind}-${input.turnId}-${input.actorId}`,
      kind: eventKind,
      summary: `${input.actorId} ${eventKind} during ${input.currentTask?.id ?? "runtime turn"}`,
      evidence_refs: [evidenceRef],
      turn: Number(input.turnId.replace(/^turn-/, ""))
    })
  );

  await writeRelationshipEdge(input.artifacts.actorWorkspaceRootDir, nextEdge);
}
