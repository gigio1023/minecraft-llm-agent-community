import type { CycleJudgmentOutcome } from "../types.js";
import type { SocialPrimitiveAttemptStatus } from "../../socialCycleProgress.js";
import type {
  ActorTurnExpectedOutcome,
  ActorTurnResolvedAction,
  JsonValue
} from "./types.js";

export type ObservedEvidenceDeltaKind =
  | "world_block_delta"
  | "inventory_delta"
  | "equipment_delta"
  | "position_delta"
  | "social_delta"
  | "diagnostic_delta"
  | "blocker_recorded";

export type ActorTurnOutcomeContractEvaluation = {
  schema: "actor-turn-outcome-contract-evaluation/v1";
  expected_outcome: ActorTurnExpectedOutcome;
  observed_deltas: ObservedEvidenceDeltaKind[];
  status: "satisfied" | "diagnostic_only" | "recorded" | "blocked" | "unsatisfied";
  outcome_override?: CycleJudgmentOutcome;
  branch_recommended: boolean;
  reason: string;
};

type HelperEvent = {
  name?: unknown;
  status?: unknown;
  result?: unknown;
};

const worldBlockDeltaToolStatuses = new Set([
  "mine_block:mined",
  "place_block:placed",
  "place_block:already_present",
  "build_pattern:built",
  "build_pattern:progressing"
]);

const inventoryDeltaToolStatuses = new Set([
  "collect_logs:collected",
  "mine_block:mined",
  "craft_item:crafted",
  "craft_with_table:crafted",
  "consume_item:consumed",
  "deposit_shared:deposited",
  "withdraw_shared:withdrawn"
]);

const equipmentDeltaToolStatuses = new Set([
  "equip_item:equipped",
  "equip_item:already_equipped"
]);

const positionDeltaToolStatuses = new Set([
  "move_to:arrived",
  "move_to:moved"
]);

const socialDeltaToolStatuses = new Set([
  "say:delivered",
  "deposit_shared:deposited",
  "withdraw_shared:withdrawn"
]);

const diagnosticToolNames = new Set([
  "observe",
  "inspect_chest",
  "remember",
  "wait"
]);

function addDelta(deltas: Set<ObservedEvidenceDeltaKind>, delta: ObservedEvidenceDeltaKind) {
  deltas.add(delta);
}

function statusKey(entry: SocialPrimitiveAttemptStatus) {
  return `${entry.tool}:${entry.status}`;
}

function helperResultStatus(event: HelperEvent) {
  const result = event.result;
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return "";
  }
  const status = (result as { status?: unknown }).status;
  return typeof status === "string" ? status : "";
}

function helperDeltaKind(event: HelperEvent): ObservedEvidenceDeltaKind | null {
  if (event.status !== "completed" || typeof event.name !== "string") {
    return null;
  }
  const status = helperResultStatus(event);
  switch (event.name) {
    case "mineBlock":
      return status === "mined" ? "world_block_delta" : null;
    case "placeBlock":
      return status === "placed" || status === "already_present" ? "world_block_delta" : null;
    case "buildPattern":
      return status === "built" || status === "progressing" ? "world_block_delta" : null;
    case "collectLogs":
    case "craftItem":
    case "craftWithTable":
    case "consumeItem":
      return ["collected", "crafted", "consumed"].includes(status) ? "inventory_delta" : null;
    case "equipItem":
      return status === "equipped" || status === "already_equipped" ? "equipment_delta" : null;
    case "say":
      return status === "delivered" ? "social_delta" : null;
    case "observe":
      return status === "ok" ? "diagnostic_delta" : null;
    default:
      return null;
  }
}

export function defaultExpectedOutcomeForPrimitive(primitiveId: string): ActorTurnExpectedOutcome {
  switch (primitiveId) {
    case "collect_logs":
    case "craft_item":
    case "craft_with_table":
    case "consume_item":
    case "mine_block":
    case "deposit_shared":
    case "withdraw_shared":
      return "inventory_delta";
    case "equip_item":
      return "equipment_delta";
    case "place_block":
    case "build_pattern":
      return "world_block_delta";
    case "move_to":
      return "position_delta";
    case "say":
      return "social_delta";
    case "observe":
    case "inspect_chest":
      return "diagnostic_unlock";
    default:
      return "record_blocker_or_done";
  }
}

export function defaultExpectedOutcomeForActionSkill(actionSkillId: string): ActorTurnExpectedOutcome {
  if (/build|place|shelter|hut|structure/i.test(actionSkillId)) {
    return "world_block_delta";
  }
  if (/collect|craft|mine|eat|consume|deposit|withdraw|handoff/i.test(actionSkillId)) {
    return "inventory_delta";
  }
  if (/equip|equipment|hold|tool/i.test(actionSkillId)) {
    return "equipment_delta";
  }
  if (/announce|approach|request|say|busy/i.test(actionSkillId)) {
    return "social_delta";
  }
  if (/observe|inspect/i.test(actionSkillId)) {
    return "diagnostic_unlock";
  }
  return "record_blocker_or_done";
}

export function observedDeltasFromToolStatuses(
  toolStatuses: readonly SocialPrimitiveAttemptStatus[]
): ObservedEvidenceDeltaKind[] {
  const deltas = new Set<ObservedEvidenceDeltaKind>();
  for (const entry of toolStatuses) {
    const key = statusKey(entry);
    if (worldBlockDeltaToolStatuses.has(key)) {
      addDelta(deltas, "world_block_delta");
    }
    if (inventoryDeltaToolStatuses.has(key)) {
      addDelta(deltas, "inventory_delta");
    }
    if (equipmentDeltaToolStatuses.has(key)) {
      addDelta(deltas, "equipment_delta");
    }
    if (positionDeltaToolStatuses.has(key)) {
      addDelta(deltas, "position_delta");
    }
    if (socialDeltaToolStatuses.has(key)) {
      addDelta(deltas, "social_delta");
    }
    if (diagnosticToolNames.has(entry.tool) && entry.status !== "blocked" && entry.status !== "failed") {
      addDelta(deltas, "diagnostic_delta");
    }
    if (["blocked", "failed", "timeout", "cancelled", "rejected"].includes(entry.status)) {
      addDelta(deltas, "blocker_recorded");
    }
  }
  return [...deltas];
}

export function observedDeltasFromHelperEvents(helperEvents: readonly JsonValue[]): ObservedEvidenceDeltaKind[] {
  const deltas = new Set<ObservedEvidenceDeltaKind>();
  for (const event of helperEvents) {
    if (typeof event !== "object" || event === null || Array.isArray(event)) {
      continue;
    }
    const delta = helperDeltaKind(event as HelperEvent);
    if (delta) {
      addDelta(deltas, delta);
    }
  }
  return [...deltas];
}

function expectedDelta(expectedOutcome: ActorTurnExpectedOutcome): ObservedEvidenceDeltaKind | null {
  switch (expectedOutcome) {
    case "world_block_delta":
    case "inventory_delta":
    case "equipment_delta":
    case "position_delta":
    case "social_delta":
      return expectedOutcome;
    case "diagnostic_unlock":
      return "diagnostic_delta";
    default:
      return null;
  }
}

export function evaluateActorTurnOutcomeContract(input: {
  action: ActorTurnResolvedAction;
  verifierStatus: "passed" | "failed" | "not_applicable";
  toolStatuses: readonly SocialPrimitiveAttemptStatus[];
}): ActorTurnOutcomeContractEvaluation {
  return evaluateExpectedOutcomeAgainstDeltas({
    expectedOutcome: input.action.expected_outcome,
    verifierStatus: input.verifierStatus,
    observedDeltas: observedDeltasFromToolStatuses(input.toolStatuses)
  });
}

export function evaluateExpectedOutcomeAgainstDeltas(input: {
  expectedOutcome: ActorTurnExpectedOutcome;
  verifierStatus: "passed" | "failed" | "not_applicable";
  observedDeltas: readonly ObservedEvidenceDeltaKind[];
}): ActorTurnOutcomeContractEvaluation {
  const observed = new Set(input.observedDeltas);
  const expected = expectedDelta(input.expectedOutcome);
  if (input.verifierStatus === "failed" || observed.has("blocker_recorded")) {
    return {
      schema: "actor-turn-outcome-contract-evaluation/v1",
      expected_outcome: input.expectedOutcome,
      observed_deltas: [...observed],
      status: "blocked",
      branch_recommended: true,
      reason: "runtime evidence recorded a blocked or failed attempt before the expected outcome was satisfied"
    };
  }
  if (input.expectedOutcome === "record_blocker_or_done") {
    return {
      schema: "actor-turn-outcome-contract-evaluation/v1",
      expected_outcome: input.expectedOutcome,
      observed_deltas: [...observed],
      status: "recorded",
      outcome_override: "no_progress",
      branch_recommended: true,
      reason: "the action was expected to record a blocker or stop condition, not to claim Minecraft progress"
    };
  }
  if (input.expectedOutcome === "diagnostic_unlock") {
    return {
      schema: "actor-turn-outcome-contract-evaluation/v1",
      expected_outcome: input.expectedOutcome,
      observed_deltas: [...observed],
      status: observed.has("diagnostic_delta") ? "diagnostic_only" : "unsatisfied",
      outcome_override: "no_progress",
      branch_recommended: true,
      reason: observed.has("diagnostic_delta")
        ? "diagnostic evidence was recorded, but it is not physical progress until a later turn uses it for a world, inventory, position, or social delta"
        : "the action expected diagnostic evidence but did not record a useful diagnostic delta"
    };
  }
  if (expected && observed.has(expected)) {
    return {
      schema: "actor-turn-outcome-contract-evaluation/v1",
      expected_outcome: input.expectedOutcome,
      observed_deltas: [...observed],
      status: "satisfied",
      branch_recommended: false,
      reason: `runtime evidence satisfied expected outcome ${input.expectedOutcome}`
    };
  }
  return {
    schema: "actor-turn-outcome-contract-evaluation/v1",
    expected_outcome: input.expectedOutcome,
    observed_deltas: [...observed],
    status: "unsatisfied",
    outcome_override: input.verifierStatus === "passed" ? "no_progress" : undefined,
    branch_recommended: input.verifierStatus === "passed",
    reason: `runtime verifier did not produce the expected ${input.expectedOutcome} evidence delta`
  };
}
