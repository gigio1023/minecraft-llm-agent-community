import type { AllowedTool, ToolProposal, ValidatedProposal } from "../tools/index.js";
import type { ToolResult } from "../mutual/types.js";
import type { ObserveResult } from "../tools/observe.js";
import { toToolResult } from "../mutual/tools/wrapper.js";
import { selectDeterministicTask } from "../gameplay/curriculum/deterministicCurriculum.js";
import { verifyTask, type TaskVerification } from "../gameplay/verification/verifyTask.js";
import { createAntiRepeatPolicy } from "./antiRepeat.js";

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
  provider: Provider;
  tools: AgentLoopTools<TActor>;
  transcript: TranscriptRecorder;
  initialCompletedTaskIds?: string[];
};

const MAX_STEPS = 8;

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
  provider,
  tools,
  transcript,
  initialCompletedTaskIds = []
}: AgentLoopArgs<TActor>) {
  const actor = bots.actor;
  const target = bots.target;
  let lastResult: ToolResult | null = null;
  const antiRepeat = createAntiRepeatPolicy();
  const completedTaskIds = new Set<string>(initialCompletedTaskIds);

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const observation = await tools.observe({ actor, target });
    const currentTask = selectDeterministicTask({
      visibleActors: observation.visibleActors.map((visibleActor) => ({
        id: visibleActor.id,
        distance: visibleActor.distance
      })),
      ...(observation.inventory ? { inventory: observation.inventory } : {}),
      ...(observation.sharedChest ? { sharedChest: observation.sharedChest } : {}),
      completedTaskIds: [...completedTaskIds]
    });
    const proposal = provider.next({ observation, lastResult, currentTask });
    const validated = tools.validateProposal(proposal);
    const result = await executePhaseOneTool({
      tools,
      validated,
      actor,
      target,
      observation,
      currentTask,
      actorId: actor.username,
      antiRepeat
    });
    const verification = readVerification(result);

    transcript.recordStep({
      actor: actor.username,
      observation: toJsonValue(observation),
      ...(currentTask ? { task: toJsonValue(currentTask) } : {}),
      tool: validated.tool,
      args: Object.keys(validated.args).length > 0 ? toJsonRecord(validated.args) : undefined,
      result: toJsonValue(result),
      ...(verification ? { verification: toJsonValue(verification) } : {})
    });

    lastResult = toToolResult(result, validated.tool);

    if (currentTask && verification?.status === "passed") {
      completedTaskIds.add(currentTask.id);
    }

    if (validated.tool === "remember") {
      return {
        status: "success" as const,
        why:
          typeof result.note === "string"
            ? result.note
            : "runtime-owned curriculum reached a terminal note"
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
  antiRepeat: ReturnType<typeof createAntiRepeatPolicy>;
}) {
  const {
    tools,
    validated,
    actor,
    target,
    observation,
    currentTask,
    actorId,
    antiRepeat
  } = input;

  if (currentTask && !currentTask.primitiveIds.includes(validated.tool)) {
    if (validated.tool === "remember") {
      return executeTool(tools, validated, actor, target, observation);
    }

    return {
      tool: validated.tool,
      ok: false,
      status: "invalid",
      message: `Task ${currentTask.id} does not allow ${validated.tool}`
    } satisfies ToolResult;
  }

  const shouldVerifyCurrentTask =
    currentTask !== null &&
    currentTask !== undefined &&
    validated.tool !== "observe" &&
    validated.tool !== "wait" &&
    validated.tool !== "remember";

  if (
    shouldVerifyCurrentTask &&
    antiRepeat.shouldBlock({
      actorId,
      tool: validated.tool,
      args: validated.args
    })
  ) {
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
      tool: validated.tool,
      ok: false,
      status: "blocked",
      message: `Repeated failed ${validated.tool} attempt blocked by runtime policy`,
      verification
    } satisfies ToolResult;
  }

  const result = await executeTool(tools, validated, actor, target, observation);

  if (!shouldVerifyCurrentTask || !currentTask) {
    return result;
  }

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
    ...result,
    verification
  } satisfies ToolResult;
}
