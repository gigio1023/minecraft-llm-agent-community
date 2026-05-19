import type { AllowedTool, ToolProposal, ValidatedProposal } from "../tools/index.js";

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

type LastResult = {
  tool: AllowedTool;
  status: string;
};

type ObserveResult = {
  status: "ok";
  visibleActors: Array<{
    id: string;
    distance: number;
    busy: boolean;
  }>;
  memory: string[];
};

type ToolResult = {
  status: string;
  [key: string]: JsonValue;
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
    tool: AllowedTool;
    args?: Record<string, JsonValue>;
    result: JsonValue;
  }): void;
};

type Provider = {
  next(input: {
    observation: ObserveResult;
    lastResult: LastResult | null;
  }): ToolProposal;
};

export type AgentLoopTools<TActor extends RuntimeActor> = {
  validateProposal(proposal: ToolProposal): ValidatedProposal;
  observe(input: { actor: TActor; target: TActor }): Promise<ObserveResult> | ObserveResult;
  move_to(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  say(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  wait(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
  remember(input: ToolContext<TActor>): Promise<ToolResult> | ToolResult;
};

type AgentLoopArgs<TActor extends RuntimeActor> = {
  bots: {
    npc_a: TActor;
    npc_b: TActor;
  };
  provider: Provider;
  tools: AgentLoopTools<TActor>;
  transcript: TranscriptRecorder;
};

const MAX_STEPS = 6;

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
) {
  switch (validated.tool) {
    case "observe":
      return observation;
    case "move_to":
      return tools.move_to({ actor, target, args: validated.args });
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
  transcript
}: AgentLoopArgs<TActor>) {
  const actor = bots.npc_a;
  const target = bots.npc_b;
  let lastResult: LastResult | null = null;

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const observation = await tools.observe({ actor, target });
    const proposal = provider.next({ observation, lastResult });
    const validated = tools.validateProposal(proposal);
    const result = await executeTool(tools, validated, actor, target, observation);

    transcript.recordStep({
      actor: actor.username,
      observation,
      tool: validated.tool,
      args: Object.keys(validated.args).length > 0 ? toJsonRecord(validated.args) : undefined,
      result
    });

    lastResult = {
      tool: validated.tool,
      status: result.status
    };

    if (validated.tool === "remember") {
      return {
        status: "success" as const,
        why: "runtime-owned busy result changed the next action" as const
      };
    }
  }

  throw new Error(`Agent loop exhausted ${MAX_STEPS}-step budget without remember`);
}
