import type { JsonValue } from "../../provider/inputSnapshot.js";
import type { AllowedTool } from "../../tools/index.js";
import type { ActiveActionSkillPermission } from "../activeActionSkillGate.js";
import type { PrimitiveSessionPreflight } from "./sessionPreflight.js";
import {
  isPartialMeaningfulToolStatus,
  isSuccessfulMeaningfulToolStatus
} from "../socialCycleProgress.js";

export type RuntimeActionHookRecord = {
  schema: "runtime-action-hook/v1";
  phase: "pre" | "post";
  hook_id: string;
  status: "allowed" | "blocked" | "observed";
  reason: string;
  progress_classification?: "verified" | "partial_verified" | "none";
};

export type PreActionHookResult = {
  allowed: boolean;
  blockedResult?: JsonValue;
  records: RuntimeActionHookRecord[];
};

function hookJson(record: RuntimeActionHookRecord): JsonValue {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  ) as JsonValue;
}

export function runtimeHookRecordsToJson(records: readonly RuntimeActionHookRecord[]): JsonValue[] {
  return records.map(hookJson);
}

/** Runs generic pre-action gates before a Mineflayer primitive can mutate world state. */
export function runPrimitivePreActionHooks(input: {
  tool: AllowedTool;
  permission: ActiveActionSkillPermission;
  hasLiveBot: boolean;
  sessionPreflight?: PrimitiveSessionPreflight;
}): PreActionHookResult {
  if (!input.permission.allowed) {
    const record: RuntimeActionHookRecord = {
      schema: "runtime-action-hook/v1",
      phase: "pre",
      hook_id: "active_action_skill_gate",
      status: "blocked",
      reason: input.permission.reason
    };
    return {
      allowed: false,
      blockedResult: { status: "blocked", reason: input.permission.reason },
      records: [record]
    };
  }

  if (input.sessionPreflight && input.sessionPreflight.status !== "ready") {
    const reason = input.sessionPreflight.reason;
    return {
      allowed: false,
      blockedResult: {
        status: "blocked",
        reason,
        session_preflight: input.sessionPreflight as unknown as JsonValue
      },
      records: [
        {
          schema: "runtime-action-hook/v1",
          phase: "pre",
          hook_id: "runtime_session_preflight",
          status: "blocked",
          reason
        }
      ]
    };
  }

  if (!input.hasLiveBot) {
    const reason = "No live bot for primitive execution";
    return {
      allowed: false,
      blockedResult: { status: "blocked", reason },
      records: [
        {
          schema: "runtime-action-hook/v1",
          phase: "pre",
          hook_id: "live_bot_required",
          status: "blocked",
          reason
        }
      ]
    };
  }

  return {
    allowed: true,
    records: [
      {
        schema: "runtime-action-hook/v1",
        phase: "pre",
        hook_id: "runtime_action_surface_gate",
        status: "allowed",
        reason: `${input.tool} is backed by active actor-owned action skills and a live bot`
      }
    ]
  };
}

/** Classifies the runtime-visible result without granting success to provider text. */
export function runPrimitivePostActionHooks(input: {
  tool: AllowedTool;
  status: string;
  result: JsonValue;
}): RuntimeActionHookRecord[] {
  const progress_classification = isSuccessfulMeaningfulToolStatus(input.tool, input.status)
    ? "verified"
    : isPartialMeaningfulToolStatus(input.tool, input.status)
      ? "partial_verified"
      : "none";

  return [
    {
      schema: "runtime-action-hook/v1",
      phase: "post",
      hook_id: "runtime_progress_classifier",
      status: "observed",
      progress_classification,
      reason:
        progress_classification === "verified"
          ? `${input.tool}:${input.status} satisfies the runtime progress classifier`
          : progress_classification === "partial_verified"
            ? `${input.tool}:${input.status} records current-run world mutation but not final success`
            : `${input.tool}:${input.status} does not satisfy a progress classifier`
    }
  ];
}

/** Embeds hook evidence into the tool result so artifacts explain runtime decisions. */
export function attachRuntimeHooksToResult(input: {
  result: JsonValue;
  hooks: readonly RuntimeActionHookRecord[];
}): JsonValue {
  const runtimeHooks = runtimeHookRecordsToJson(input.hooks);
  if (
    typeof input.result === "object" &&
    input.result !== null &&
    !Array.isArray(input.result)
  ) {
    return {
      ...input.result,
      runtime_hooks: runtimeHooks
    };
  }

  return {
    status: "observed",
    value: input.result,
    runtime_hooks: runtimeHooks
  };
}
