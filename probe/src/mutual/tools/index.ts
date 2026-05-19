import type { MutualRuntimeState } from "../runtimeState.js";
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
  try {
    const validated = validateProposal(proposal);
    const actorArgs = toOptionalJsonRecord(validated.args);
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
    const memoryNote = readMemoryNote(validated.tool, result);

    transcript?.recordStep({
      actor: actor.username,
      observation: toJsonValue(observation),
      actorAction: { tool: validated.tool },
      ...(actorArgs ? { actorArgs } : {}),
      ...(memoryNote ? { memoryNote } : {}),
      ...(validated.why ? { providerMeta: { why: validated.why } } : {}),
      result: toJsonValue(result)
    });

    return result;
  } catch (error) {
    const actorArgs = toOptionalJsonRecord(proposal.args);

    transcript?.recordStep({
      actor: actor.username,
      observation: toJsonValue(observation),
      actorAction: { tool: proposal.tool },
      ...(actorArgs ? { actorArgs } : {}),
      ...(proposal.why ? { providerMeta: { why: proposal.why } } : {}),
      failure: { message: error instanceof Error ? error.message : String(error) },
      result: {
        status: "failed"
      }
    });

    throw error;
  }
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
