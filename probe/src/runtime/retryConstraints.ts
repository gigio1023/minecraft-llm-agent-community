import { createHash } from "node:crypto";

import type { JsonValue } from "../provider/inputSnapshot.js";
import type { ActionIntent, ActionIntentKind } from "./goals/types.js";

/**
 * Runtime retry constraints are exact retry gates, not planner strategy.
 *
 * @remarks They remember that a specific ActionIntent target plus structured
 * args hit the same blocker repeatedly. The executor can then block the next
 * identical attempt before Mineflayer work begins, while still leaving evidence
 * for provider context, review, and compaction.
 */
export const RUNTIME_RETRY_ATTEMPT_SCHEMA = "runtime-retry-attempt/v1" as const;
export const RUNTIME_RETRY_CONSTRAINT_SCHEMA = "runtime-retry-constraint/v1" as const;

export type RuntimeRetryTargetKind = "primitive" | "action_skill" | "control";

export type RuntimeRetryTarget = {
  kind: RuntimeRetryTargetKind;
  id: string;
  primitive_id?: string;
  action_skill_id?: string;
};

export type RuntimeRetryAttempt = {
  schema: typeof RUNTIME_RETRY_ATTEMPT_SCHEMA;
  actor_id: string;
  cycle_id: string;
  turn_id: string;
  action_index?: number;
  action_kind: ActionIntentKind;
  target: RuntimeRetryTarget;
  args_fingerprint: string;
  args_normalized: JsonValue;
  blocker_key: string;
  blocker_status: string;
  blocker_reason: string;
  evidence_refs: string[];
};

/** Provider-visible and executor-enforced prohibition for an exact retry shape. */
export type RuntimeRetryConstraint = {
  schema: typeof RUNTIME_RETRY_CONSTRAINT_SCHEMA;
  constraint_id: string;
  actor_id: string;
  action_kind: ActionIntentKind;
  target: RuntimeRetryTarget;
  args_fingerprint: string;
  args_normalized: JsonValue;
  blocker_key: string;
  blocker_status: string;
  blocker_reason: string;
  repeat_count: number;
  attempt_refs: string[];
  evidence_refs: string[];
  rule: {
    same_target_and_args_blocked: true;
    provider_must_pivot_or_repair_args: true;
    runtime_blocks_before_mineflayer: true;
  };
};

export type RuntimeRetryExecutionLike = {
  runtimeResult: JsonValue;
  evidenceRefs: readonly string[];
  verifierStatus?: "passed" | "failed" | "not_applicable";
  toolStatuses?: readonly { tool: string; status: string }[];
  postconditionResults?: readonly { status: string; reason?: string }[];
};

const BLOCKING_STATUSES = new Set(["blocked", "failed", "error", "timeout", "cancelled"]);
const NON_ARGS_KEYS = new Set(["why_this_action", "expected_evidence", "fallback_if_blocked"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeIdPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_:-]+/g, "_").replace(/^_+|_+$/g, "") || "unknown";
}

function readStatus(value: unknown) {
  return isRecord(value) && typeof value.status === "string" ? value.status : undefined;
}

function readReason(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }
  if (typeof value.reason === "string" && value.reason.trim().length > 0) {
    return value.reason.trim();
  }
  if (typeof value.why === "string" && value.why.trim().length > 0) {
    return value.why.trim();
  }
  if (typeof value.message === "string" && value.message.trim().length > 0) {
    return value.message.trim();
  }
  return undefined;
}

function normalizeTextKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[0-9a-f]{8,}/g, "id")
    .replace(/[-+]?\d+(?:\.\d+)?/g, "n")
    .replace(/[^a-z0-9_ ]+/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 1)
    .slice(0, 12)
    .join("_") || "unknown_blocker";
}

function normalizeJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonValue(entry));
  }
  if (isRecord(value)) {
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(value).sort()) {
      if (NON_ARGS_KEYS.has(key)) {
        continue;
      }
      const entry = value[key];
      if (entry === undefined || typeof entry === "function" || typeof entry === "symbol") {
        continue;
      }
      normalized[key] = normalizeJsonValue(entry);
    }
    return normalized;
  }
  return null;
}

/** Normalizes only structured args; rationale/prose never contributes to retry identity. */
export function normalizedActionIntentArgs(intent: Pick<ActionIntent, "args">): JsonValue {
  return normalizeJsonValue(intent.args ?? {});
}

/** Produces a stable short id for compact provider context and report diffs. */
export function fingerprintRuntimeRetryArgs(args: JsonValue) {
  return createHash("sha256").update(JSON.stringify(args)).digest("hex").slice(0, 16);
}

/** Separates the executable target from the broader ActionIntent envelope. */
export function runtimeRetryTargetFromIntent(intent: ActionIntent): RuntimeRetryTarget {
  if (intent.kind === "use_primitive") {
    const primitiveId = intent.primitive_id ?? "unknown_primitive";
    return {
      kind: "primitive",
      id: primitiveId,
      primitive_id: primitiveId
    };
  }
  if (intent.kind === "use_action_skill") {
    const actionSkillId = intent.action_skill_id ?? "unknown_action_skill";
    return {
      kind: "action_skill",
      id: actionSkillId,
      action_skill_id: actionSkillId
    };
  }
  return {
    kind: "control",
    id: intent.kind,
    primitive_id: intent.kind
  };
}

function blockingStatusFromToolStatuses(
  toolStatuses: readonly { tool: string; status: string }[] | undefined
) {
  return [...(toolStatuses ?? [])].reverse().find((entry) => BLOCKING_STATUSES.has(entry.status));
}

function blockingPostcondition(
  postconditionResults: readonly { status: string; reason?: string }[] | undefined
) {
  return [...(postconditionResults ?? [])].reverse().find((entry) => entry.status === "failed");
}

function blockerFromExecution(input: RuntimeRetryExecutionLike): {
  status: string;
  reason: string;
} | null {
  const directStatus = readStatus(input.runtimeResult);
  if (directStatus && BLOCKING_STATUSES.has(directStatus)) {
    return {
      status: directStatus,
      reason: readReason(input.runtimeResult) ?? directStatus
    };
  }

  const lastToolResult = isRecord(input.runtimeResult) ? input.runtimeResult.last_tool_result : undefined;
  const lastToolStatus = readStatus(lastToolResult);
  if (lastToolStatus && BLOCKING_STATUSES.has(lastToolStatus)) {
    return {
      status: lastToolStatus,
      reason: readReason(lastToolResult) ?? lastToolStatus
    };
  }

  const failedPostcondition = blockingPostcondition(input.postconditionResults);
  if (failedPostcondition) {
    return {
      status: "failed",
      reason: failedPostcondition.reason ?? "action-skill postcondition failed"
    };
  }

  const failedToolStatus = blockingStatusFromToolStatuses(input.toolStatuses);
  if (failedToolStatus) {
    return {
      status: failedToolStatus.status,
      reason: readReason(lastToolResult) ?? `${failedToolStatus.tool}:${failedToolStatus.status}`
    };
  }

  if (input.verifierStatus === "failed") {
    return {
      status: "failed",
      reason: "verifier failed without a more specific blocker"
    };
  }

  return null;
}

/** Converts one failed execution into retry evidence when there is a real blocker. */
export function buildRuntimeRetryAttempt(input: {
  actorId: string;
  cycleId: string;
  turnId: string;
  actionIndex?: number;
  intent: ActionIntent;
  execution: RuntimeRetryExecutionLike;
}): RuntimeRetryAttempt | null {
  const blocker = blockerFromExecution(input.execution);
  if (!blocker) {
    return null;
  }
  const args = normalizedActionIntentArgs(input.intent);
  return {
    schema: RUNTIME_RETRY_ATTEMPT_SCHEMA,
    actor_id: input.actorId,
    cycle_id: input.cycleId,
    turn_id: input.turnId,
    action_index: input.actionIndex,
    action_kind: input.intent.kind,
    target: runtimeRetryTargetFromIntent(input.intent),
    args_fingerprint: fingerprintRuntimeRetryArgs(args),
    args_normalized: args,
    blocker_key: `${blocker.status}:${normalizeTextKey(blocker.reason)}`,
    blocker_status: blocker.status,
    blocker_reason: blocker.reason,
    evidence_refs: [...input.execution.evidenceRefs]
  };
}

function constraintKey(attempt: RuntimeRetryAttempt) {
  return [
    attempt.target.kind,
    attempt.target.id,
    attempt.args_fingerprint,
    attempt.blocker_key
  ].join("|");
}

/** Groups recent retry attempts into exact gates after the repeat threshold. */
export function deriveRuntimeRetryConstraints(input: {
  actorId: string;
  attempts: readonly RuntimeRetryAttempt[];
  minRepeatCount?: number;
  recentAttemptLimit?: number;
}): RuntimeRetryConstraint[] {
  const minRepeatCount = input.minRepeatCount ?? 2;
  const recent = input.attempts
    .filter((attempt) => attempt.actor_id === input.actorId)
    .slice(-(input.recentAttemptLimit ?? 24));
  const groups = new Map<string, RuntimeRetryAttempt[]>();

  for (const attempt of recent) {
    const key = constraintKey(attempt);
    groups.set(key, [...(groups.get(key) ?? []), attempt]);
  }

  return [...groups.values()]
    .filter((attempts) => attempts.length >= minRepeatCount)
    .map((attempts) => {
      const latest = attempts[attempts.length - 1]!;
      return {
        schema: RUNTIME_RETRY_CONSTRAINT_SCHEMA,
        constraint_id: [
          "retry",
          sanitizeIdPart(latest.target.kind),
          sanitizeIdPart(latest.target.id),
          latest.args_fingerprint,
          sanitizeIdPart(latest.blocker_key)
        ].join("-"),
        actor_id: input.actorId,
        action_kind: latest.action_kind,
        target: latest.target,
        args_fingerprint: latest.args_fingerprint,
        args_normalized: latest.args_normalized,
        blocker_key: latest.blocker_key,
        blocker_status: latest.blocker_status,
        blocker_reason: latest.blocker_reason,
        repeat_count: attempts.length,
        attempt_refs: attempts.map((attempt) => attempt.turn_id),
        evidence_refs: [...new Set(attempts.flatMap((attempt) => attempt.evidence_refs))],
        rule: {
          same_target_and_args_blocked: true,
          provider_must_pivot_or_repair_args: true,
          runtime_blocks_before_mineflayer: true
        } as const
      };
    })
    .sort((left, right) =>
      right.repeat_count - left.repeat_count ||
      left.constraint_id.localeCompare(right.constraint_id)
    );
}

/** Finds the first hard retry gate that would make this intent a known no-op. */
export function findMatchingRuntimeRetryConstraint(
  intent: ActionIntent,
  constraints: readonly RuntimeRetryConstraint[]
): RuntimeRetryConstraint | null {
  const target = runtimeRetryTargetFromIntent(intent);
  const args = normalizedActionIntentArgs(intent);
  const argsFingerprint = fingerprintRuntimeRetryArgs(args);
  return constraints.find((constraint) =>
    constraint.target.kind === target.kind &&
    constraint.target.id === target.id &&
    constraint.args_fingerprint === argsFingerprint
  ) ?? null;
}
