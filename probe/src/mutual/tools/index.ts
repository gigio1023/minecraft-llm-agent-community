import { createMutualRuntimeState } from "../runtimeState.js";
import type { MutualJsonValue, MutualStepRecord, Proposal } from "../types.js";
import { converse } from "./converse.js";

export const allowedMutualTools = [
  "converse",
  "observe_world",
  "move_to",
  "wait",
  "remember",
  "drop_item"
] as const;

export type AllowedMutualTool = (typeof allowedMutualTools)[number];

export type ValidatedProposal = {
  tool: AllowedMutualTool;
  args: Record<string, unknown>;
  why?: string;
};

type MutualActor = {
  username: string;
  chat(message: string): void;
};

type MutualRuntimeState = ReturnType<typeof createMutualRuntimeState>;

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
    Object.entries(args).map(([key, value]) => [key, toJsonValue(value)])
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
  handlers = {}
}: ExecuteMutualToolArgs) {
  const validated = validateProposal(proposal);

  const result =
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

  transcript?.recordStep({
    actor: actor.username,
    observation: toJsonValue(observation),
    actorAction: { tool: validated.tool },
    actorArgs:
      Object.keys(validated.args).length > 0 ? toJsonRecord({ ...validated.args }) : undefined,
    providerMeta: validated.why ? { why: validated.why } : undefined,
    result: toJsonValue(result)
  });

  return result;
}

async function executeHandler(
  tool: Exclude<AllowedMutualTool, "converse">,
  handlers: ToolHandlers,
  context: ToolHandlerContext
) {
  const handler = handlers[tool];

  if (!handler) {
    throw new Error(`Tool not implemented: ${tool}`);
  }

  return handler(context);
}
