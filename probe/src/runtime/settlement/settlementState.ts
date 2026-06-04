/**
 * Consolidates settlement-facing runtime state such as shared storage,
 * contribution evidence, known positions, and recent blockers.
 *
 * @remarks Settlement state is context for social simulation and Actor Turn
 * selection. It summarizes evidence without becoming proof of physical progress
 * unless the cited artifacts verify world, inventory, container, or position
 * changes.
 */
import type { JsonValue } from "../../provider/inputSnapshot.js";
import type { ObserveResult } from "../../tools/observe.js";
import type { ActorActionSkillRecord } from "../actorWorkspaceStore.js";
import type { CycleJudgment } from "../goals/types.js";

export type SettlementChecklistItemId =
  | "crafting_table_known_or_placed"
  | "starter_shelter_verified"
  | "shared_storage_contribution"
  | "memory_or_judgment_persisted"
  | "recent_blockers_summarized";

export type SettlementChecklistItem = {
  id: SettlementChecklistItemId;
  status: "satisfied" | "pending" | "blocked";
  evidence_refs: string[];
  reason: string;
};

export type SettlementChecklist = {
  schema: "settlement-checklist/v1";
  items: SettlementChecklistItem[];
  satisfied_count: number;
  pending_count: number;
  blocked_count: number;
};

export type KnownSettlementPositions = {
  actor_position?: { x: number; y: number; z: number };
  crafting_table?: {
    status: "unknown" | "nearby" | "placed";
    position?: { x: number; y: number; z: number };
    evidence_refs: string[];
  };
  shared_chest?: {
    status: "unknown" | "nearby" | "inspected" | "contributed";
    chest_id?: string;
    evidence_refs: string[];
  };
  shelter?: {
    status: "unknown" | "progressing" | "verified" | "blocked";
    anchor?: { x: number; y: number; z: number };
    evidence_refs: string[];
  };
};

export type SharedStorageSummary = {
  status: "unknown" | "known" | "contributed";
  chest_id?: string;
  items: Array<{ name: string; count: number }>;
  evidence_refs: string[];
};

export type RecentBlockerHistogram = Array<{
  key: string;
  count: number;
  example: string;
}>;

export type SettlementProgressVector = {
  has_crafting_table: boolean;
  has_verified_shelter: boolean;
  has_shared_storage_contribution: boolean;
  has_judgment_or_memory: boolean;
  has_blocker_summary: boolean;
};

export type SettlementState = {
  schema: "settlement-state/v1";
  actor_id: string;
  updated_at: string;
  inventory_counts: Record<string, number>;
  shared_storage: SharedStorageSummary;
  known_positions: KnownSettlementPositions;
  blocker_histogram: RecentBlockerHistogram;
  available_action_skill_ids: string[];
  missing_primitive_blockers: string[];
  progress: SettlementProgressVector;
  checklist: SettlementChecklist;
};

export type ActionSkillPostconditionResult = {
  schema: "action-skill-postcondition/v1";
  action_skill_id: string;
  status: "passed" | "failed" | "not_applicable";
  evidence_refs: string[];
  reason: string;
  checklist_item_ids: SettlementChecklistItemId[];
};

export type ToolResultRecord = {
  tool: string;
  status: string;
  result: JsonValue;
  evidence_ref?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStatus(value: JsonValue) {
  return isRecord(value) && typeof value.status === "string" ? value.status : "unknown";
}

function readReason(value: JsonValue) {
  if (!isRecord(value)) {
    return undefined;
  }
  return typeof value.reason === "string"
    ? value.reason
    : typeof value.why === "string"
      ? value.why
      : undefined;
}

function readPosition(value: unknown) {
  if (
    isRecord(value) &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.z === "number"
  ) {
    return { x: value.x, y: value.y, z: value.z };
  }
  return undefined;
}

function inventoryCounts(observation: ObserveResult | Record<string, unknown>) {
  const counts: Record<string, number> = {};
  const inventory = (observation as { inventory?: unknown }).inventory;
  if (!Array.isArray(inventory)) {
    return counts;
  }

  for (const item of inventory) {
    if (
      isRecord(item) &&
      typeof item.name === "string" &&
      typeof item.count === "number"
    ) {
      counts[item.name] = (counts[item.name] ?? 0) + item.count;
    }
  }
  return counts;
}

function sharedChestFromObservation(observation: ObserveResult | Record<string, unknown>): SharedStorageSummary {
  const sharedChest = (observation as { sharedChest?: unknown }).sharedChest;
  if (!isRecord(sharedChest)) {
    return { status: "unknown", items: [], evidence_refs: [] };
  }
  return {
    status: "known",
    chest_id: typeof sharedChest.chestId === "string" ? sharedChest.chestId : undefined,
    items: Array.isArray(sharedChest.items)
      ? sharedChest.items
          .map((item) =>
            isRecord(item) && typeof item.name === "string" && typeof item.count === "number"
              ? { name: item.name, count: item.count }
              : null
          )
          .filter((item): item is { name: string; count: number } => item !== null)
      : [],
    evidence_refs: []
  };
}

function sharedChestFromToolResults(results: readonly ToolResultRecord[] = []): SharedStorageSummary {
  const chestTools = results.filter((entry) =>
    entry.tool === "inspect_chest" || entry.tool === "deposit_shared"
  );
  const deposited = [...chestTools].reverse().find((entry) => entry.status === "deposited");
  const inspected = [...chestTools].reverse().find((entry) => entry.status === "inspected");
  const source = deposited ?? inspected;

  if (!source || !isRecord(source.result)) {
    return { status: "unknown", items: [], evidence_refs: [] };
  }

  const items = Array.isArray(source.result.items)
    ? source.result.items
        .map((item) =>
          isRecord(item) && typeof item.name === "string" && typeof item.count === "number"
            ? { name: item.name, count: item.count }
            : null
        )
        .filter((item): item is { name: string; count: number } => item !== null)
    : typeof source.result.itemName === "string" && typeof source.result.movedCount === "number"
      ? [{ name: source.result.itemName, count: source.result.movedCount }]
      : [];

  return {
    status: deposited ? "contributed" : "known",
    chest_id: typeof source.result.chestId === "string" ? source.result.chestId : undefined,
    items,
    evidence_refs: source.evidence_ref ? [source.evidence_ref] : []
  };
}

function isCraftingTablePlacementResult(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }
  const expectedBlockNames = Array.isArray(value.expectedBlockNames)
    ? value.expectedBlockNames.filter((entry): entry is string => typeof entry === "string")
    : [];
  return (
    (value.status === "placed" || value.status === "already_present") &&
    (
      value.itemName === "crafting_table" ||
      value.blockName === "crafting_table" ||
      value.afterBlockName === "crafting_table" ||
      expectedBlockNames.includes("crafting_table")
    )
  );
}

function placementPosition(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }
  return (
    readPosition(value.targetPosition) ??
    readPosition(value.position) ??
    readPosition(value)
  );
}

function craftingTablePlacementFromToolResults(results: readonly ToolResultRecord[] = []) {
  for (const entry of [...results].reverse()) {
    if (entry.tool === "place_block" && isCraftingTablePlacementResult(entry.result)) {
      return {
        position: placementPosition(entry.result),
        evidence_refs: entry.evidence_ref ? [entry.evidence_ref] : []
      };
    }

    if (entry.tool !== "run_mineflayer_program" || !isRecord(entry.result)) {
      continue;
    }
    const helperEvents = entry.result.helperEvents;
    if (!Array.isArray(helperEvents)) {
      continue;
    }
    const helperPlacement = [...helperEvents].reverse().find((event) =>
      isRecord(event) &&
      event.name === "placeBlock" &&
      isCraftingTablePlacementResult(event.result)
    );
    if (helperPlacement && isRecord(helperPlacement)) {
      return {
        position: placementPosition(helperPlacement.result),
        evidence_refs: entry.evidence_ref ? [entry.evidence_ref] : []
      };
    }
  }

  return undefined;
}

function findNearbyBlock(observation: ObserveResult | Record<string, unknown>, blockName: string) {
  const nearbyBlocks = (observation as { nearbyBlocks?: unknown }).nearbyBlocks;
  if (!Array.isArray(nearbyBlocks)) {
    return null;
  }

  return nearbyBlocks.find((block) =>
    isRecord(block) && block.name === blockName
  ) ?? null;
}

function findWorldStateSummaryBlock(
  observation: ObserveResult | Record<string, unknown>,
  blockName: string
) {
  const summary = (observation as { worldStateSummary?: unknown }).worldStateSummary;
  if (!isRecord(summary)) {
    return null;
  }
  const blockObservations = isRecord(summary.block_observations)
    ? summary.block_observations
    : null;
  const byName = Array.isArray(blockObservations?.by_name) ? blockObservations.by_name : [];
  const entry = byName.find((candidate) =>
    isRecord(candidate) &&
    candidate.name === blockName &&
    typeof candidate.count === "number" &&
    candidate.count > 0
  );
  if (!isRecord(entry)) {
    return null;
  }
  const nearest = Array.isArray(entry.nearest)
    ? entry.nearest.find((candidate) => isRecord(candidate) && candidate.name === blockName)
    : null;
  return nearest ?? entry;
}

function positionFromNearbyBlock(block: unknown) {
  if (!isRecord(block)) {
    return undefined;
  }

  return (
    readPosition(block.position) ??
    readPosition(block)
  );
}

function blockerKey(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_ ]+/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 2)
    .slice(0, 8)
    .join("_") || "unknown_blocker";
}

function buildBlockerHistogram(input: {
  previousJudgments: ReadonlyArray<{ judgment: CycleJudgment }>;
  recentToolResults?: readonly ToolResultRecord[];
}): RecentBlockerHistogram {
  const counts = new Map<string, { count: number; example: string }>();
  const add = (text: string) => {
    const key = blockerKey(text);
    const current = counts.get(key);
    counts.set(key, {
      count: (current?.count ?? 0) + 1,
      example: current?.example ?? text
    });
  };

  for (const { judgment } of input.previousJudgments) {
    if (judgment.outcome === "blocked" || judgment.outcome === "no_progress") {
      add(judgment.what_happened || judgment.next_goal_context.join(" "));
    }
  }

  for (const result of input.recentToolResults ?? []) {
    if (result.status === "blocked" || result.status === "failed" || result.status === "error") {
      add(readReason(result.result) ?? `${result.tool}:${result.status}`);
    }
  }

  return [...counts.entries()]
    .map(([key, value]) => ({ key, count: value.count, example: value.example }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
    .slice(0, 8);
}

function evaluateChecklist(progress: SettlementProgressVector, blockers: RecentBlockerHistogram): SettlementChecklist {
  const items: SettlementChecklistItem[] = [
    {
      id: "crafting_table_known_or_placed",
      status: progress.has_crafting_table ? "satisfied" : "pending",
      evidence_refs: [],
      reason: progress.has_crafting_table
        ? "A crafting table is known from observation or verified placement."
        : "No crafting table observation or placement evidence is known yet."
    },
    {
      id: "starter_shelter_verified",
      status: progress.has_verified_shelter ? "satisfied" : "pending",
      evidence_refs: [],
      reason: progress.has_verified_shelter
        ? "Starter shelter verification has passed."
        : "No verified starter shelter evidence is known yet."
    },
    {
      id: "shared_storage_contribution",
      status: progress.has_shared_storage_contribution ? "satisfied" : "pending",
      evidence_refs: [],
      reason: progress.has_shared_storage_contribution
        ? "Shared storage has a positive contribution evidence path."
        : "No positive shared storage contribution is known yet."
    },
    {
      id: "memory_or_judgment_persisted",
      status: progress.has_judgment_or_memory ? "satisfied" : "pending",
      evidence_refs: [],
      reason: progress.has_judgment_or_memory
        ? "A CycleJudgment or memory artifact exists for later context."
        : "No judgment or memory continuity has been recorded yet."
    },
    {
      id: "recent_blockers_summarized",
      status: progress.has_blocker_summary ? "satisfied" : blockers.length > 0 ? "blocked" : "pending",
      evidence_refs: [],
      reason: progress.has_blocker_summary
        ? "Recent blockers are summarized for planner context."
        : blockers.length > 0
          ? "Recent blockers exist and must steer the next action."
          : "No blocker has been summarized yet."
    }
  ];

  return {
    schema: "settlement-checklist/v1",
    items,
    satisfied_count: items.filter((item) => item.status === "satisfied").length,
    pending_count: items.filter((item) => item.status === "pending").length,
    blocked_count: items.filter((item) => item.status === "blocked").length
  };
}

export function evaluateSocialActionSkillPostcondition(input: {
  actionSkillId: string;
  toolResults: readonly ToolResultRecord[];
  evidenceRefs: readonly string[];
}): ActionSkillPostconditionResult {
  const byTool = new Map(input.toolResults.map((entry) => [entry.tool, entry]));
  const statusFor = (tool: string) => byTool.get(tool)?.status;
  const resultFor = (tool: string) => byTool.get(tool)?.result;

  const passed = (reason: string, checklist_item_ids: SettlementChecklistItemId[] = []) => ({
    schema: "action-skill-postcondition/v1" as const,
    action_skill_id: input.actionSkillId,
    status: "passed" as const,
    evidence_refs: [...input.evidenceRefs],
    reason,
    checklist_item_ids
  });
  const failed = (reason: string, checklist_item_ids: SettlementChecklistItemId[] = []) => ({
    schema: "action-skill-postcondition/v1" as const,
    action_skill_id: input.actionSkillId,
    status: "failed" as const,
    evidence_refs: [...input.evidenceRefs],
    reason,
    checklist_item_ids
  });
  const notApplicable = () => ({
    schema: "action-skill-postcondition/v1" as const,
    action_skill_id: input.actionSkillId,
    status: "not_applicable" as const,
    evidence_refs: [...input.evidenceRefs],
    reason: "No social-cycle postcondition bridge is registered for this action skill.",
    checklist_item_ids: []
  });

  switch (input.actionSkillId) {
    case "collectLogs":
      return statusFor("collect_logs") === "collected"
        ? passed("collectLogs verified log inventory progress.")
        : failed("collectLogs did not produce collected log evidence.");
    case "craftPlanksAndSticks":
    case "craftCraftingTable":
      return statusFor("craft_item") === "crafted"
        ? passed(`${input.actionSkillId} verified craft_item output.`)
        : failed(`${input.actionSkillId} did not produce crafted inventory evidence.`);
    case "craftWoodenPickaxe":
      return statusFor("craft_with_table") === "crafted"
        ? passed("craftWoodenPickaxe verified table-bound craft output.")
        : failed("craftWoodenPickaxe did not produce table-bound crafted evidence.");
    case "mineCobblestone":
      return statusFor("mine_block") === "mined"
        ? passed("mineCobblestone verified mined inventory progress.")
        : failed("mineCobblestone did not produce mined block evidence.");
    case "eatFoodWhenHungry":
      return statusFor("consume_item") === "consumed"
        ? passed("eatFoodWhenHungry verified food consumption evidence.")
        : failed("eatFoodWhenHungry did not produce consumption evidence.");
    case "placeCraftingTable": {
      const result = resultFor("place_block");
      const placedTable =
        isRecord(result) &&
        (result.status === "placed" || result.status === "already_present") &&
        result.itemName === "crafting_table";
      return placedTable
        ? passed("placeCraftingTable verified crafting_table in the world.", [
            "crafting_table_known_or_placed"
          ])
        : failed("placeCraftingTable did not verify a crafting_table placement.", [
            "crafting_table_known_or_placed"
          ]);
    }
    case "buildBasicShelter": {
      const result = resultFor("build_pattern");
      const verified =
        isRecord(result) &&
        result.status === "built" &&
        isRecord(result.verification) &&
        result.verification.status === "passed";
      return verified
        ? passed("buildBasicShelter verified starter shelter structure.", [
            "starter_shelter_verified"
          ])
        : failed("buildBasicShelter did not pass shelter verification.", [
            "starter_shelter_verified"
          ]);
    }
    case "inspectSharedChest":
      return statusFor("inspect_chest") === "inspected"
        ? passed("inspectSharedChest verified shared chest snapshot.")
        : failed("inspectSharedChest did not produce chest inspection evidence.");
    case "depositSharedItems":
    case "handoffItemAtChest":
      return statusFor("deposit_shared") === "deposited"
        ? passed(`${input.actionSkillId} verified positive shared storage contribution.`, [
            "shared_storage_contribution"
          ])
        : failed(`${input.actionSkillId} did not verify shared storage contribution.`, [
            "shared_storage_contribution"
          ]);
    case "runtimeObserveAndRemember":
      return statusFor("observe") === "ok" && statusFor("remember") === "remembered"
        ? passed("runtimeObserveAndRemember preserved observation and memory evidence.", [
            "memory_or_judgment_persisted"
          ])
        : failed("runtimeObserveAndRemember missed observation or memory evidence.", [
            "memory_or_judgment_persisted"
          ]);
    case "approachAndRequestItem":
      return statusFor("move_to") === "arrived" && statusFor("say") === "delivered"
        ? passed("approachAndRequestItem verified arrival and delivered chat evidence.")
        : failed("approachAndRequestItem missed movement or chat evidence.");
    case "announceResourceDiscovery":
    case "waitForBusyCrafter":
      return statusFor("say") === "delivered"
        ? passed(`${input.actionSkillId} verified delivered chat evidence.`)
        : failed(`${input.actionSkillId} missed delivered chat evidence.`);
    default:
      return notApplicable();
  }
}

export function buildSettlementState(input: {
  actorId: string;
  observation: ObserveResult | Record<string, unknown>;
  activeActionSkills: readonly ActorActionSkillRecord[];
  previousJudgments: ReadonlyArray<{ judgment: CycleJudgment }>;
  recentToolResults?: readonly ToolResultRecord[];
  postconditionResults?: readonly ActionSkillPostconditionResult[];
  evidenceRefs?: readonly string[];
  judgmentRefs?: readonly string[];
  memoryWriteCount?: number;
  now?: string;
}): SettlementState {
  const inventory = inventoryCounts(input.observation);
  const observationSharedStorage = sharedChestFromObservation(input.observation);
  const toolSharedStorage = sharedChestFromToolResults(input.recentToolResults);
  const sharedStorage =
    toolSharedStorage.status !== "unknown" ? toolSharedStorage : observationSharedStorage;
  const evidenceRefs = [...(input.evidenceRefs ?? [])];
  const postconditions = input.postconditionResults ?? [];
  const craftingTablePostcondition = postconditions.find((entry) =>
    entry.checklist_item_ids.includes("crafting_table_known_or_placed") &&
    entry.status === "passed"
  );
  const shelterPostcondition = postconditions.find((entry) =>
    entry.checklist_item_ids.includes("starter_shelter_verified") &&
    entry.status === "passed"
  );
  const storagePostcondition = postconditions.find((entry) =>
    entry.checklist_item_ids.includes("shared_storage_contribution") &&
    entry.status === "passed"
  );
  const blockers = buildBlockerHistogram({
    previousJudgments: input.previousJudgments,
    recentToolResults: input.recentToolResults
  });
  const actorPosition = readPosition((input.observation as { position?: unknown }).position);
  const nearbyCraftingTable = findNearbyBlock(input.observation, "crafting_table");
  const scannedCraftingTable = findWorldStateSummaryBlock(input.observation, "crafting_table");
  const tableNearby = Boolean(nearbyCraftingTable ?? scannedCraftingTable);
  const toolCraftingTable = craftingTablePlacementFromToolResults(input.recentToolResults);
  const tableEvidenceRefs =
    craftingTablePostcondition?.evidence_refs ??
    toolCraftingTable?.evidence_refs ??
    (tableNearby ? evidenceRefs : []);
  const progress: SettlementProgressVector = {
    has_crafting_table: tableNearby || Boolean(craftingTablePostcondition) || Boolean(toolCraftingTable),
    has_verified_shelter: Boolean(shelterPostcondition),
    has_shared_storage_contribution:
      Boolean(storagePostcondition) || toolSharedStorage.status === "contributed",
    has_judgment_or_memory:
      (input.judgmentRefs?.length ?? 0) > 0 ||
      (input.memoryWriteCount ?? 0) > 0 ||
      input.previousJudgments.length > 0,
    has_blocker_summary: blockers.length > 0
  };
  const checklist = evaluateChecklist(progress, blockers);

  for (const item of checklist.items) {
    if (item.id === "crafting_table_known_or_placed" && craftingTablePostcondition) {
      item.evidence_refs = [...craftingTablePostcondition.evidence_refs];
    } else if (item.id === "crafting_table_known_or_placed" && toolCraftingTable) {
      item.evidence_refs = [...toolCraftingTable.evidence_refs];
    } else if (item.id === "crafting_table_known_or_placed" && tableNearby) {
      item.evidence_refs = [...tableEvidenceRefs];
    }
    if (item.id === "starter_shelter_verified" && shelterPostcondition) {
      item.evidence_refs = [...shelterPostcondition.evidence_refs];
    }
    if (item.id === "shared_storage_contribution" && storagePostcondition) {
      item.evidence_refs = [...storagePostcondition.evidence_refs];
    } else if (item.id === "shared_storage_contribution" && toolSharedStorage.status === "contributed") {
      item.evidence_refs = [...toolSharedStorage.evidence_refs];
    }
    if (item.id === "memory_or_judgment_persisted") {
      item.evidence_refs = [...(input.judgmentRefs ?? [])];
    }
    if (item.id === "recent_blockers_summarized") {
      item.evidence_refs = evidenceRefs;
    }
  }

  if (storagePostcondition) {
    sharedStorage.status = "contributed";
    sharedStorage.evidence_refs = [...storagePostcondition.evidence_refs];
  } else if (toolSharedStorage.status === "contributed") {
    sharedStorage.status = "contributed";
    sharedStorage.evidence_refs = [...toolSharedStorage.evidence_refs];
  }

  return {
    schema: "settlement-state/v1",
    actor_id: input.actorId,
    updated_at: input.now ?? new Date().toISOString(),
    inventory_counts: inventory,
    shared_storage: sharedStorage,
    known_positions: {
      ...(actorPosition ? { actor_position: actorPosition } : {}),
      crafting_table: {
        status: craftingTablePostcondition || toolCraftingTable ? "placed" : tableNearby ? "nearby" : "unknown",
        position:
          toolCraftingTable?.position ??
          positionFromNearbyBlock(nearbyCraftingTable) ??
          positionFromNearbyBlock(scannedCraftingTable),
        evidence_refs: tableEvidenceRefs
      },
      shared_chest: {
        status: storagePostcondition
          ? "contributed"
          : sharedStorage.status === "contributed"
            ? "contributed"
            : sharedStorage.status === "known"
            ? "inspected"
            : "unknown",
        chest_id: sharedStorage.chest_id,
        evidence_refs: storagePostcondition?.evidence_refs ?? sharedStorage.evidence_refs
      },
      shelter: {
        status: shelterPostcondition ? "verified" : "unknown",
        evidence_refs: shelterPostcondition?.evidence_refs ?? []
      }
    },
    blocker_histogram: blockers,
    available_action_skill_ids: input.activeActionSkills.map((record) => record.skill_id).sort(),
    missing_primitive_blockers: input.activeActionSkills
      .filter((record) => record.required_primitives.length === 0)
      .map((record) => record.skill_id)
      .sort(),
    progress,
    checklist
  };
}
