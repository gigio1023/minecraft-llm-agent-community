import type { ActionIntent } from "./types.js";

export const ACTION_INTENT_PRIMITIVE_ARGS_CONTRACT_VERSION =
  "action-intent-primitive-args/v1" as const;

export type ActionIntentPrimitiveArgsContractVersion =
  typeof ACTION_INTENT_PRIMITIVE_ARGS_CONTRACT_VERSION;

export type ActionIntentPosition = {
  x: number;
  y: number;
  z: number;
};

export type ScoutDirection = "north" | "south" | "east" | "west";

export type MoveToPositionTargetSource = "args" | "position" | "targetPosition" | "target_position";

export type MoveToTargetMetadata =
  | {
      kind: "position";
      source: MoveToPositionTargetSource;
      position: ActionIntentPosition;
    }
  | {
      kind: "scout";
      source: "direction_distance";
      direction: ScoutDirection;
      distance: number;
    };

export type ActionIntentPrimitiveArgsContractResult =
  | {
      ok: true;
      primitiveId: string;
      contractVersion: ActionIntentPrimitiveArgsContractVersion;
      target?: MoveToTargetMetadata;
    }
  | {
      ok: false;
      primitiveId: string;
      contractVersion: ActionIntentPrimitiveArgsContractVersion;
      error: string;
      target?: MoveToTargetMetadata;
    };

export type ActionIntentPrimitiveArgsInput = {
  primitiveId: string;
  args?: Record<string, unknown>;
  actionSkillId?: string;
};

export type PrimitiveArgsContractSummary = {
  schema: ActionIntentPrimitiveArgsContractVersion;
  primitive_id: string;
  required_structured_args: string[];
  accepted_forms: string[];
  hidden_defaults_allowed: false;
  prose_fields_are_authority: false;
};

const scoutDirections = new Set<ScoutDirection>(["north", "south", "east", "west"]);

function passed(input: {
  primitiveId: string;
  target?: MoveToTargetMetadata;
}): ActionIntentPrimitiveArgsContractResult {
  return {
    ok: true,
    primitiveId: input.primitiveId,
    contractVersion: ACTION_INTENT_PRIMITIVE_ARGS_CONTRACT_VERSION,
    target: input.target
  };
}

function failed(input: {
  primitiveId: string;
  error: string;
  target?: MoveToTargetMetadata;
}): ActionIntentPrimitiveArgsContractResult {
  return {
    ok: false,
    primitiveId: input.primitiveId,
    contractVersion: ACTION_INTENT_PRIMITIVE_ARGS_CONTRACT_VERSION,
    error: input.error,
    target: input.target
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNonEmptyArg(args: Record<string, unknown>, key: string) {
  return nonEmptyString(args[key]);
}

function hasAnyNonEmptyArg(args: Record<string, unknown>, keys: readonly string[]) {
  return keys.some((key) => hasNonEmptyArg(args, key));
}

function hasPositiveCountArg(args: Record<string, unknown>, keys: readonly string[]) {
  return keys.some((key) => {
    const value = args[key];
    return typeof value === "number" && Number.isFinite(value) && value > 0;
  });
}

function readPosition(
  source: MoveToPositionTargetSource,
  value: unknown
): MoveToTargetMetadata | null {
  if (!isRecord(value)) {
    return null;
  }
  if (!finiteNumber(value.x) || !finiteNumber(value.y) || !finiteNumber(value.z)) {
    return null;
  }
  return {
    kind: "position",
    source,
    position: { x: value.x, y: value.y, z: value.z }
  };
}

function firstExplicitMoveTarget(args: Record<string, unknown>) {
  return (
    readPosition("position", args.position) ??
    readPosition("targetPosition", args.targetPosition) ??
    readPosition("target_position", args.target_position) ??
    readPosition("args", args)
  );
}

function readScoutTarget(args: Record<string, unknown>): MoveToTargetMetadata | null {
  if (!nonEmptyString(args.direction) || !finiteNumber(args.distance)) {
    return null;
  }
  const direction = args.direction.toLowerCase();
  if (!scoutDirections.has(direction as ScoutDirection)) {
    return null;
  }
  if (args.distance < 2 || args.distance > 12) {
    return null;
  }
  return {
    kind: "scout",
    source: "direction_distance",
    direction: direction as ScoutDirection,
    distance: args.distance
  };
}

function validateMoveToArgs(
  primitiveId: string,
  args: Record<string, unknown>
): ActionIntentPrimitiveArgsContractResult {
  const explicitTarget = firstExplicitMoveTarget(args);
  if (explicitTarget) {
    return passed({ primitiveId, target: explicitTarget });
  }

  const scoutTarget = readScoutTarget(args);
  if (scoutTarget) {
    return passed({ primitiveId, target: scoutTarget });
  }

  return failed({
    primitiveId,
    error:
      "move_to requires structured args with x/y/z, position, targetPosition, target_position, or explicit scout direction and distance 2..12"
  });
}

function hasPositionAt(args: Record<string, unknown>, keys: readonly string[]) {
  return keys.some((key) => readPosition("position", args[key]));
}

function hasActionSkillFallback(input: ActionIntentPrimitiveArgsInput, args: Record<string, unknown>) {
  return nonEmptyString(input.actionSkillId) || nonEmptyString(args.actionSkillId);
}

function validateSharedTransferArgs(
  input: ActionIntentPrimitiveArgsInput,
  args: Record<string, unknown>
) {
  // Shared storage is social evidence, so direct provider calls must name the
  // item and amount. Actor-owned action skills may resolve those locally after
  // the runtime has granted action-skill fallback authority.
  const hasFallback = hasActionSkillFallback(input, args);
  if (!hasNonEmptyArg(args, "itemName") && !hasFallback) {
    return failed({
      primitiveId: input.primitiveId,
      error: `${input.primitiveId} requires itemName unless an actionSkillId fallback is present`
    });
  }
  if (!hasFallback && !hasPositiveCountArg(args, ["count", "targetCount"])) {
    return failed({
      primitiveId: input.primitiveId,
      error: `${input.primitiveId} requires count or targetCount unless an actionSkillId fallback is present`
    });
  }
  return passed({ primitiveId: input.primitiveId });
}

function validatePhysicalPrimitiveArgs(
  input: ActionIntentPrimitiveArgsInput,
  args: Record<string, unknown>
): ActionIntentPrimitiveArgsContractResult {
  switch (input.primitiveId) {
    case "move_to":
      return validateMoveToArgs(input.primitiveId, args);
    case "place_block": {
      const hasFallback = hasActionSkillFallback(input, args);
      if (!hasFallback && !hasNonEmptyArg(args, "itemName") && !hasNonEmptyArg(args, "blockName")) {
        return failed({
          primitiveId: input.primitiveId,
          error: "place_block requires itemName or blockName in structured args"
        });
      }
      if (
        !hasFallback &&
        !hasPositionAt(args, ["targetPosition", "target_position", "position"]) &&
        !readPosition("args", args)
      ) {
        return failed({
          primitiveId: input.primitiveId,
          error: "place_block requires an explicit target position in structured args"
        });
      }
      return passed({ primitiveId: input.primitiveId });
    }
    case "build_pattern": {
      if (!hasActionSkillFallback(input, args) && !hasPositionAt(args, ["anchor", "position", "targetPosition"])) {
        return failed({
          primitiveId: input.primitiveId,
          error: "build_pattern requires an explicit anchor, position, or targetPosition"
        });
      }
      return passed({ primitiveId: input.primitiveId });
    }
    case "mine_block":
      return hasAnyNonEmptyArg(args, ["blockName", "targetBlock"]) || hasActionSkillFallback(input, args)
        ? passed({ primitiveId: input.primitiveId })
        : failed({ primitiveId: input.primitiveId, error: "mine_block requires blockName or targetBlock unless an actionSkillId fallback is present" });
    case "craft_item":
    case "craft_with_table":
      return hasNonEmptyArg(args, "itemName") || hasActionSkillFallback(input, args)
        ? passed({ primitiveId: input.primitiveId })
        : failed({
            primitiveId: input.primitiveId,
            error: `${input.primitiveId} requires itemName unless an actionSkillId fallback is present`
          });
    case "consume_item":
      return hasNonEmptyArg(args, "itemName") || hasActionSkillFallback(input, args)
        ? passed({ primitiveId: input.primitiveId })
        : failed({
            primitiveId: input.primitiveId,
            error: "consume_item requires itemName unless an actionSkillId fallback is present"
          });
    case "run_mineflayer_program":
      return hasNonEmptyArg(args, "source")
        ? passed({ primitiveId: input.primitiveId })
        : failed({
            primitiveId: input.primitiveId,
            error: "run_mineflayer_program requires generated source with export async function run(ctx)"
          });
    case "deposit_shared":
    case "withdraw_shared":
      return validateSharedTransferArgs(input, args);
    case "say":
      return hasNonEmptyArg(args, "text")
        ? passed({ primitiveId: input.primitiveId })
        : failed({ primitiveId: input.primitiveId, error: "say requires text" });
    case "wait":
    case "remember":
      return passed({ primitiveId: input.primitiveId });
    default:
      return passed({ primitiveId: input.primitiveId });
  }
}

/**
 * Exposes argument requirements as provider context without embedding a
 * Minecraft strategy. The summary names shapes, not preferred materials or
 * objectives, so the model receives a contract rather than a checklist.
 */
export function primitiveArgsContractSummary(primitiveId: string): PrimitiveArgsContractSummary {
  const base = {
    schema: ACTION_INTENT_PRIMITIVE_ARGS_CONTRACT_VERSION,
    primitive_id: primitiveId,
    hidden_defaults_allowed: false,
    prose_fields_are_authority: false
  } as const;

  switch (primitiveId) {
    case "move_to":
      return {
        ...base,
        required_structured_args: ["target position or scout direction/distance"],
        accepted_forms: [
          "{x:number,y:number,z:number}",
          "{position:{x:number,y:number,z:number}}",
          "{targetPosition:{x:number,y:number,z:number}}",
          "{target_position:{x:number,y:number,z:number}}",
          "{direction:north|south|east|west,distance:number 2..12}"
        ]
      };
    case "place_block":
      return {
        ...base,
        required_structured_args: ["itemName or blockName", "target position"],
        accepted_forms: [
          "{itemName:string,targetPosition:{x:number,y:number,z:number}}",
          "{blockName:string,position:{x:number,y:number,z:number}}",
          "resolved actor-owned action skill primitive args"
        ]
      };
    case "build_pattern":
      return {
        ...base,
        required_structured_args: ["anchor or target position"],
        accepted_forms: [
          "{anchor:{x:number,y:number,z:number}}",
          "{position:{x:number,y:number,z:number}}",
          "{targetPosition:{x:number,y:number,z:number}}",
          "resolved actor-owned action skill primitive args"
        ]
      };
    case "mine_block":
      return {
        ...base,
        required_structured_args: ["blockName or targetBlock"],
        accepted_forms: [
          "{blockName:string,targetCount?:number,searchDistance?:number}",
          "{targetBlock:string,targetCount?:number,searchDistance?:number}",
          "resolved actor-owned action skill primitive args"
        ]
      };
    case "craft_item":
    case "craft_with_table":
      return {
        ...base,
        required_structured_args: ["itemName"],
        accepted_forms: [
          "{itemName:string}",
          "resolved actor-owned action skill primitive args"
        ]
      };
    case "deposit_shared":
    case "withdraw_shared":
      return {
        ...base,
        required_structured_args: ["itemName", "count or targetCount"],
        accepted_forms: [
          "{itemName:string,count:number,currentTask?:string}",
          "{itemName:string,targetCount:number,currentTask?:string}",
          "resolved actor-owned action skill primitive args"
        ]
      };
    case "say":
      return {
        ...base,
        required_structured_args: ["text"],
        accepted_forms: ["{text:string}"]
      };
    case "consume_item":
      return {
        ...base,
        required_structured_args: ["itemName"],
        accepted_forms: [
          "{itemName:string}",
          "resolved actor-owned action skill primitive args"
        ]
      };
    case "run_mineflayer_program":
      return {
        ...base,
        required_structured_args: ["source"],
        accepted_forms: [
          "{source:string,purpose?:string,expectedObservation?:string,timeoutMs?:number}",
          "source must export async function run(ctx) and use runtime helper calls for evidence"
        ]
      };
    default:
      return {
        ...base,
        required_structured_args: [],
        accepted_forms: ["{}"]
      };
  }
}

/**
 * Validates the structured args contract before Mineflayer receives a physical
 * primitive. Provider rationale such as `why_this_action` is intentionally not
 * read here: prose may explain intent, but it must not become hidden movement,
 * placement, mining, or chat authority.
 */
export function validatePrimitiveActionIntentArgs(
  input: ActionIntentPrimitiveArgsInput
): ActionIntentPrimitiveArgsContractResult {
  const args = input.args ?? {};
  if (!isRecord(args)) {
    return failed({
      primitiveId: input.primitiveId,
      error: "primitive args must be a structured object"
    });
  }

  return validatePhysicalPrimitiveArgs(input, args);
}

/**
 * Convenience wrapper for provider-direct ActionIntent validation. Owned action
 * skills should be resolved to their primitive calls first, because the
 * action-skill id can be a documented fallback only at that resolved boundary.
 */
export function validateDirectPrimitiveActionIntentArgs(
  intent: Pick<ActionIntent, "kind" | "primitive_id" | "action_skill_id" | "args">
): ActionIntentPrimitiveArgsContractResult {
  if (intent.kind === "wait" || intent.kind === "remember") {
    return validatePrimitiveActionIntentArgs({
      primitiveId: intent.kind,
      args: intent.args,
      actionSkillId: intent.action_skill_id
    });
  }

  if (intent.kind !== "use_primitive" || !intent.primitive_id) {
    return failed({
      primitiveId: intent.primitive_id ?? intent.kind,
      error: "ActionIntent must resolve to one primitive before primitive args validation"
    });
  }

  const argsWithoutActionSkillFallback = isRecord(intent.args)
    ? Object.fromEntries(
        Object.entries(intent.args).filter(([key]) => key !== "actionSkillId")
      )
    : intent.args;

  return validatePrimitiveActionIntentArgs({
    primitiveId: intent.primitive_id,
    args: argsWithoutActionSkillFallback
  });
}
