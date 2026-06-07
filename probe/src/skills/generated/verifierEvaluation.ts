/**
 * Runtime evaluation for generated action skill trial verifiers.
 *
 * @remarks The provider may describe the verifier, but promotion authority comes
 * from current-run helper events and post-observation evidence written by
 * `run_mineflayer_program`.
 */
import type { JsonValue } from "../../provider/inputSnapshot.js";
import type { GeneratedActionSkillCandidate } from "../../runtime/goals/types.js";

type JsonRecord = Record<string, unknown>;

export type GeneratedActionSkillTrialVerifierResult = {
  schema: "generated-action-skill-trial-verifier-result/v1";
  status: "passed" | "failed";
  verifier_kind: string;
  reason: string;
  matched_helper_events: JsonValue[];
};

const progressHelperStatuses: Record<string, Set<string>> = {
  buildPattern: new Set(["built"]),
  collectLogs: new Set(["collected"]),
  consumeItem: new Set(["consumed"]),
  craftItem: new Set(["crafted"]),
  craftWithTable: new Set(["crafted"]),
  mineBlock: new Set(["mined"]),
  placeBlock: new Set(["placed", "already_present"]),
  say: new Set(["delivered"])
};

const helperProgressVerifierAliases = new Set([
  "runtime-evidence",
  "runtime_evidence",
  "runtime evidence",
  "runtime-progress",
  "runtime_progress",
  "runtime progress",
  "runtime_primitive_or_evidence",
  "physical-evidence",
  "physical_evidence",
  "physical evidence"
]);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJsonValue(value: unknown): JsonValue {
  try {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  } catch {
    return String(value) as JsonValue;
  }
}

function stringField(record: JsonRecord, keys: readonly string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function numberField(record: JsonRecord, keys: readonly string[], fallback: number) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return fallback;
}

function helperEventsFromRuntimeResult(runtimeResult: unknown): JsonRecord[] {
  if (!isRecord(runtimeResult) || !Array.isArray(runtimeResult.helperEvents)) {
    return [];
  }
  return runtimeResult.helperEvents.filter(isRecord);
}

function postObservationFromRuntimeResult(runtimeResult: unknown): JsonRecord | undefined {
  return isRecord(runtimeResult) && isRecord(runtimeResult.postObservation)
    ? runtimeResult.postObservation
    : undefined;
}

function helperEventResultStatus(event: JsonRecord) {
  return isRecord(event.result) && typeof event.result.status === "string"
    ? event.result.status
    : undefined;
}

function completedHelper(event: JsonRecord, helper?: string) {
  return event.status === "completed" &&
    typeof event.name === "string" &&
    (!helper || event.name === helper);
}

function helperResultStatusMatches(input: {
  events: JsonRecord[];
  helper: string;
  status: string;
}) {
  return input.events.filter((event) =>
    completedHelper(event, input.helper) &&
    helperEventResultStatus(event) === input.status
  );
}

function progressHelperEvents(events: JsonRecord[]) {
  return events.filter((event) => {
    if (!completedHelper(event)) {
      return false;
    }
    const helperName = typeof event.name === "string" ? event.name : "";
    const acceptedStatuses = progressHelperStatuses[helperName];
    const resultStatus = helperEventResultStatus(event);
    return Boolean(acceptedStatuses && resultStatus && acceptedStatuses.has(resultStatus));
  });
}

function normalizedVerifierKind(kind: string, events: JsonRecord[]) {
  if (helperProgressVerifierAliases.has(kind)) {
    return "helper_event_progress";
  }
  if (kind === "unknown" && progressHelperEvents(events).length > 0) {
    return "helper_event_progress";
  }
  return kind;
}

function inventoryCount(observation: JsonRecord | undefined, itemName: string) {
  const inventory = Array.isArray(observation?.inventory) ? observation.inventory : [];
  return inventory.filter(isRecord).reduce((total, item) => {
    return item.name === itemName && typeof item.count === "number"
      ? total + item.count
      : total;
  }, 0);
}

function pass(
  kind: string,
  reason: string,
  matched: JsonRecord[]
): GeneratedActionSkillTrialVerifierResult {
  return {
    schema: "generated-action-skill-trial-verifier-result/v1",
    status: "passed",
    verifier_kind: kind,
    reason,
    matched_helper_events: matched.map(toJsonValue)
  };
}

function fail(
  kind: string,
  reason: string,
  matched: JsonRecord[] = []
): GeneratedActionSkillTrialVerifierResult {
  return {
    schema: "generated-action-skill-trial-verifier-result/v1",
    status: "failed",
    verifier_kind: kind,
    reason,
    matched_helper_events: matched.map(toJsonValue)
  };
}

export function evaluateGeneratedActionSkillTrialVerifier(input: {
  candidate: GeneratedActionSkillCandidate;
  runtimeResult: JsonValue;
}): GeneratedActionSkillTrialVerifierResult {
  const verifier = input.candidate.verifier;
  const rawKind = typeof verifier.kind === "string" ? verifier.kind : "unknown";
  const events = helperEventsFromRuntimeResult(input.runtimeResult);
  const kind = normalizedVerifierKind(rawKind, events);
  const observation = postObservationFromRuntimeResult(input.runtimeResult);
  const runtimeStatus = isRecord(input.runtimeResult) && typeof input.runtimeResult.status === "string"
    ? input.runtimeResult.status
    : "unknown";

  if (runtimeStatus !== "completed" && runtimeStatus !== "completed_with_evidence") {
    return fail(kind, `Generated program ended with ${runtimeStatus}; verifier was not evaluated as success.`);
  }

  if (kind === "helper_result_status") {
    const helper = stringField(verifier, ["helper"]);
    const status = stringField(verifier, ["status"]);
    if (!helper || !status) {
      return fail(kind, "helper_result_status verifier requires helper and status fields.");
    }
    const matched = helperResultStatusMatches({ events, helper, status });
    return matched.length > 0
      ? pass(kind, `Helper ${helper} produced result.status=${status}.`, matched)
      : fail(kind, `No completed helper ${helper} produced result.status=${status}.`);
  }

  if (kind === "helper_event") {
    const helper = stringField(verifier, ["helper"]);
    if (!helper) {
      return fail(kind, "helper_event verifier requires helper.");
    }
    const matched = events.filter((event) => completedHelper(event, helper));
    return matched.length > 0
      ? pass(kind, `Helper ${helper} completed.`, matched)
      : fail(kind, `No completed helper ${helper} event was recorded.`);
  }

  if (kind === "helper_event_progress" || kind === "block_or_inventory_delta") {
    const matched = progressHelperEvents(events);
    return matched.length > 0
      ? pass(
          kind,
          rawKind === kind
            ? "At least one helper produced verifier-classified progress evidence."
            : `Verifier kind ${rawKind} was treated as helper_event_progress because runtime helper evidence is the trial authority.`,
          matched
        )
      : fail(kind, "No helper produced verifier-classified progress evidence.");
  }

  if (kind === "inventory_delta" || kind === "inventory_contains" || kind === "inventory_count") {
    const itemName = stringField(verifier, ["itemName", "item_name", "item"]);
    if (!itemName) {
      return fail(kind, `${kind} verifier requires itemName, item_name, or item.`);
    }
    const count = numberField(verifier, ["count", "targetCount", "minimum", "min_count"], 1);
    const matched = progressHelperEvents(events);
    const observedCount = inventoryCount(observation, itemName);
    return matched.length > 0 && observedCount >= count
      ? pass(kind, `Post-observation inventory has ${observedCount} ${itemName} and helper progress evidence exists.`, matched)
      : fail(kind, `Post-observation inventory has ${observedCount}/${count} ${itemName} or helper progress evidence is missing.`, matched);
  }

  if (kind === "world_scan") {
    const matched = events.filter((event) => completedHelper(event, "observe"));
    return matched.length > 0 && isRecord(observation?.worldStateSummary)
      ? pass(kind, "Observe helper completed and post-observation includes a worldStateSummary.", matched)
      : fail(kind, "world_scan verifier requires observe helper completion plus post-observation worldStateSummary.", matched);
  }

  if (kind === "container_snapshot") {
    const matched = events.filter((event) => completedHelper(event, "observe"));
    return matched.length > 0 && isRecord(observation?.sharedChest)
      ? pass(kind, "Observe helper completed and post-observation includes sharedChest snapshot.", matched)
      : fail(kind, "container_snapshot verifier requires observe helper completion plus sharedChest post-observation.", matched);
  }

  return fail(kind, `Unsupported generated action skill verifier kind ${kind}.`);
}
