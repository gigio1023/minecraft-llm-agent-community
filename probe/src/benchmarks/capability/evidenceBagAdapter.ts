/**
 * Adapt a social-cycle run report into a repaired CapabilityEvidenceBagV1.
 *
 * Scoring values require non-empty artifact refs and an explicit origin.
 * Settlement inventory without source refs is omitted (never fabricated as
 * `settlement:*`). Fixture/setup contamination is tagged `origin: "setup"`.
 */

import { readFileSync } from "node:fs";

import type { SocialCycleRunReport } from "../../runtime/goals/types.js";
import type { SettlementState } from "../../runtime/settlement/settlementState.js";
import { resolveRootSafeArtifactRef } from "./artifactRefs.js";
import type {
  CapabilityEvidenceBagV1,
  EvidenceOriginV1,
  EvidencedValueV1
} from "./evidenceBag.js";
import { normalizeMinecraftId } from "./minecraftIds.js";

export type AdaptSocialCycleEvidenceBagInput = {
  report: SocialCycleRunReport;
  /** Actor workspace directory used to resolve relative evidence refs. */
  actorDir?: string;
  /**
   * Preloaded artifacts keyed by relative ref. When present, preferred over
   * reading from `actorDir`.
   */
  artifactsByRef?: ReadonlyMap<string, unknown> | Record<string, unknown>;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function evidencedValue<T>(
  value: T,
  refs: string[],
  origin: EvidenceOriginV1
): EvidencedValueV1<T> | undefined {
  const evidence_refs = dedupeRefs(refs);
  if (evidence_refs.length === 0) {
    return undefined;
  }
  return {
    value,
    evidence_refs: evidence_refs as [string, ...string[]],
    origin
  };
}

function dedupeRefs(refs: readonly string[]): string[] {
  return [
    ...new Set(
      refs.filter((ref) => typeof ref === "string" && ref.trim().length > 0).map((ref) => ref.trim())
    )
  ].sort((a, b) => a.localeCompare(b));
}

function lookupArtifact(
  ref: string,
  input: AdaptSocialCycleEvidenceBagInput
): unknown | null {
  if (!isRootSafeRelativeRefLocal(ref)) {
    return null;
  }
  const map = input.artifactsByRef;
  if (map) {
    if (map instanceof Map) {
      if (map.has(ref)) {
        return map.get(ref) ?? null;
      }
    } else {
      const record = map as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(record, ref)) {
        return record[ref] ?? null;
      }
    }
  }
  if (!input.actorDir) {
    return null;
  }
  const resolved = resolveRootSafeArtifactRef(input.actorDir, ref);
  if (!resolved.ok) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(resolved.absolute_path, "utf8")) as unknown;
  } catch {
    return null;
  }
}

function isRootSafeRelativeRefLocal(ref: string): boolean {
  return resolveRootSafeArtifactRef("/tmp/capability-ref-probe", ref).ok;
}

function detectSetupContamination(report: SocialCycleRunReport): boolean {
  if (report.agency_status.fixture_dependency) {
    return true;
  }
  if (report.server?.starter_inventory_seeded) {
    return true;
  }
  const scenario = report.server?.world_scenario;
  if (scenario?.fixture_dependency) {
    return true;
  }
  if (scenario?.lane === "fixture_probe") {
    return true;
  }
  return false;
}

function normalizeItemName(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return normalizeMinecraftId(value);
}

function recordInventoryObservation(
  inventory: Record<string, number>,
  tool: string,
  args: JsonRecord,
  result: JsonRecord
): boolean {
  const status = normalizeItemName(result.status);
  const candidateItem =
    normalizeItemName(result.itemName) ||
    normalizeItemName(result.block) ||
    normalizeItemName(args.itemName) ||
    normalizeItemName(args.blockName);
  const afterCount = result.afterCount;
  if (candidateItem && isFiniteNumber(afterCount) && afterCount >= 0) {
    inventory[candidateItem] = afterCount;
    return true;
  }
  const delta = result.inventoryDelta;
  if (
    candidateItem &&
    isFiniteNumber(delta) &&
    delta !== 0 &&
    ["crafted", "collected", "mined"].includes(status)
  ) {
    inventory[candidateItem] = Math.max(0, (inventory[candidateItem] ?? 0) + delta);
    return true;
  }
  if (tool === "collect_logs" && isFiniteNumber(result.afterLogCount)) {
    const logItem = normalizeItemName(result.block) || "log";
    inventory[logItem] = result.afterLogCount;
    return true;
  }
  return false;
}

function extractToolAttempt(artifact: unknown): {
  tool: string;
  args: JsonRecord;
  result: JsonRecord;
} | null {
  if (!isRecord(artifact) || !isRecord(artifact.tool_attempt)) {
    return null;
  }
  const toolAttempt = artifact.tool_attempt;
  const tool = typeof toolAttempt.tool === "string" ? toolAttempt.tool : "unknown";
  const args = isRecord(toolAttempt.args) ? toolAttempt.args : {};
  const result = isRecord(toolAttempt.result) ? toolAttempt.result : {};
  return { tool, args, result };
}

function inventoryFromObserve(artifact: unknown): Record<string, number> | null {
  if (!isRecord(artifact)) {
    return null;
  }
  const data = isRecord(artifact.data) ? artifact.data : artifact;
  const result = isRecord(artifact.tool_attempt)
    ? isRecord((artifact.tool_attempt as JsonRecord).result)
      ? ((artifact.tool_attempt as JsonRecord).result as JsonRecord)
      : null
    : null;
  const inventorySource =
    (isRecord(data) && Array.isArray(data.inventory) ? data.inventory : null) ??
    (result && Array.isArray(result.inventory) ? result.inventory : null) ??
    (Array.isArray(artifact.inventory) ? artifact.inventory : null);
  if (!inventorySource) {
    return null;
  }
  const counts: Record<string, number> = {};
  for (const entry of inventorySource) {
    if (!isRecord(entry)) {
      continue;
    }
    const name = normalizeItemName(entry.name);
    if (!name || !isFiniteNumber(entry.count) || entry.count < 0) {
      continue;
    }
    counts[name] = (counts[name] ?? 0) + entry.count;
  }
  return Object.keys(counts).length > 0 ? counts : null;
}

function heldItemFromObserve(
  artifact: unknown
): { name: string; count?: number } | null | undefined {
  if (!isRecord(artifact)) {
    return undefined;
  }
  const data = isRecord(artifact.data) ? artifact.data : artifact;
  const vitals = isRecord(data.vitals)
    ? data.vitals
    : isRecord(artifact.vitals)
      ? artifact.vitals
      : null;
  if (!vitals) {
    return undefined;
  }
  if (!("held_item" in vitals)) {
    return undefined;
  }
  const held = vitals.held_item;
  if (held === null) {
    return null;
  }
  if (!isRecord(held) || typeof held.name !== "string" || held.name.trim().length === 0) {
    return undefined;
  }
  return {
    name: normalizeMinecraftId(held.name),
    ...(isFiniteNumber(held.count) ? { count: held.count } : {})
  };
}

function positionFromArtifact(artifact: unknown): { x: number; y: number; z: number } | null {
  if (!isRecord(artifact)) {
    return null;
  }
  const candidates = [
    artifact.position,
    isRecord(artifact.data) ? artifact.data.position : undefined,
    isRecord(artifact.tool_attempt) && isRecord((artifact.tool_attempt as JsonRecord).result)
      ? ((artifact.tool_attempt as JsonRecord).result as JsonRecord).position
      : undefined,
    artifact.post_position,
    artifact.pre_position
  ];
  for (const candidate of candidates) {
    if (
      isRecord(candidate) &&
      isFiniteNumber(candidate.x) &&
      isFiniteNumber(candidate.y) &&
      isFiniteNumber(candidate.z)
    ) {
      return { x: candidate.x, y: candidate.y, z: candidate.z };
    }
  }
  return null;
}

function sortedInventory(counts: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(counts).sort((a, b) => a.localeCompare(b))) {
    out[key] = counts[key]!;
  }
  return out;
}

function collectCycleEvidenceRefs(report: SocialCycleRunReport): string[] {
  const refs: string[] = [];
  for (const cycle of report.cycles) {
    refs.push(...cycle.evidence_refs);
    for (const attempt of cycle.action_attempts ?? []) {
      refs.push(...attempt.evidence_refs);
    }
  }
  return dedupeRefs(refs);
}

function adaptInventory(
  report: SocialCycleRunReport,
  input: AdaptSocialCycleEvidenceBagInput,
  setupContamination: boolean
): EvidencedValueV1<Record<string, number>> | undefined {
  const inventory: Record<string, number> = {};
  const runRefs: string[] = [];
  const observeRefs: string[] = [];
  let sawRunDelta = false;
  let sawObserveInventory = false;

  for (const ref of collectCycleEvidenceRefs(report)) {
    const artifact = lookupArtifact(ref, input);
    if (artifact === null) {
      continue;
    }
    const toolAttempt = extractToolAttempt(artifact);
    if (toolAttempt) {
      const changed = recordInventoryObservation(
        inventory,
        toolAttempt.tool,
        toolAttempt.args,
        toolAttempt.result
      );
      if (changed) {
        sawRunDelta = true;
        runRefs.push(ref);
      }
    }
    const observeInventory = inventoryFromObserve(artifact);
    if (observeInventory && !sawRunDelta) {
      for (const [name, count] of Object.entries(observeInventory)) {
        inventory[name] = count;
      }
      sawObserveInventory = true;
      observeRefs.push(ref);
    }
  }

  if (sawRunDelta) {
    return evidencedValue(sortedInventory(inventory), runRefs, "run");
  }
  if (sawObserveInventory) {
    return evidencedValue(
      sortedInventory(inventory),
      observeRefs,
      setupContamination ? "setup" : "run"
    );
  }

  // Settlement inventory without resolvable source refs is omitted — never
  // fabricate settlement:* authority.
  void report.settlement_state?.inventory_counts;
  return undefined;
}

function adaptHeldItem(
  report: SocialCycleRunReport,
  input: AdaptSocialCycleEvidenceBagInput,
  setupContamination: boolean
): EvidencedValueV1<{ name: string; count?: number } | null> | undefined {
  for (const ref of [...collectCycleEvidenceRefs(report)].reverse()) {
    const artifact = lookupArtifact(ref, input);
    if (artifact === null) {
      continue;
    }
    const held = heldItemFromObserve(artifact);
    if (held === undefined) {
      continue;
    }
    return evidencedValue(held, [ref], setupContamination ? "setup" : "run");
  }
  return undefined;
}

function adaptActorPosition(
  report: SocialCycleRunReport,
  input: AdaptSocialCycleEvidenceBagInput
): EvidencedValueV1<{ x: number; y: number; z: number }> | undefined {
  for (const ref of [...collectCycleEvidenceRefs(report)].reverse()) {
    const artifact = lookupArtifact(ref, input);
    if (artifact === null) {
      continue;
    }
    const position = positionFromArtifact(artifact);
    if (!position) {
      continue;
    }
    return evidencedValue(position, [ref], "run");
  }

  const settlementPos = report.settlement_state?.known_positions.actor_position;
  // Settlement position also lacks dedicated refs — omit rather than fabricate.
  void settlementPos;
  return undefined;
}

function adaptBlocksAndPositions(
  settlement: SettlementState | undefined,
  setupContamination: boolean
): {
  known_blocks?: CapabilityEvidenceBagV1["known_blocks"];
  named_positions?: CapabilityEvidenceBagV1["named_positions"];
} {
  if (!settlement) {
    return {};
  }

  const known_blocks: NonNullable<CapabilityEvidenceBagV1["known_blocks"]> = [];
  const named_positions: NonNullable<CapabilityEvidenceBagV1["named_positions"]> = {};

  const crafting = settlement.known_positions.crafting_table;
  if (
    crafting &&
    crafting.status === "placed" &&
    crafting.position &&
    crafting.evidence_refs.length > 0
  ) {
    const refs = dedupeRefs(crafting.evidence_refs);
    const origin: EvidenceOriginV1 = setupContamination ? "setup" : "run";
    const position = evidencedValue(crafting.position, refs, origin);
    if (position) {
      named_positions.placed_crafting_table = position;
      known_blocks.push({
        block: "crafting_table",
        position: crafting.position,
        evidence_ref: refs[0]!,
        origin
      });
    }
  } else if (
    crafting &&
    crafting.status === "nearby" &&
    crafting.position &&
    crafting.evidence_refs.length > 0
  ) {
    // Pre-placed / nearby fixture tables are setup-only context.
    const refs = dedupeRefs(crafting.evidence_refs);
    const position = evidencedValue(crafting.position, refs, "setup");
    if (position) {
      named_positions.nearby_crafting_table = position;
      known_blocks.push({
        block: "crafting_table",
        position: crafting.position,
        evidence_ref: refs[0]!,
        origin: "setup"
      });
    }
  }

  const shelter = settlement.known_positions.shelter;
  if (shelter?.anchor && shelter.evidence_refs.length > 0) {
    const refs = dedupeRefs(shelter.evidence_refs);
    const origin: EvidenceOriginV1 =
      setupContamination || shelter.status === "unknown" ? "setup" : "run";
    const position = evidencedValue(shelter.anchor, refs, origin);
    if (position) {
      named_positions.shelter_anchor = position;
    }
  }

  return {
    ...(known_blocks.length > 0
      ? {
          known_blocks: known_blocks.sort((a, b) =>
            `${a.block}:${a.evidence_ref}`.localeCompare(`${b.block}:${b.evidence_ref}`)
          )
        }
      : {}),
    ...(Object.keys(named_positions).length > 0
      ? {
          named_positions: Object.fromEntries(
            Object.entries(named_positions).sort(([a], [b]) => a.localeCompare(b))
          )
        }
      : {})
  };
}

function adaptContainers(
  settlement: SettlementState | undefined,
  setupContamination: boolean
): CapabilityEvidenceBagV1["containers"] | undefined {
  if (!settlement) {
    return undefined;
  }
  const storage = settlement.shared_storage;
  if (!storage || storage.evidence_refs.length === 0) {
    return undefined;
  }
  const refs = dedupeRefs(storage.evidence_refs);
  if (refs.length === 0) {
    return undefined;
  }
  const items: Record<string, number> = {};
  for (const entry of storage.items) {
    const name = normalizeItemName(entry.name);
    if (!name || !isFiniteNumber(entry.count) || entry.count < 0) {
      continue;
    }
    items[name] = (items[name] ?? 0) + entry.count;
  }
  const container_ref =
    typeof storage.chest_id === "string" && storage.chest_id.trim().length > 0
      ? storage.chest_id.trim()
      : "shared_storage";
  // Contributed without fixture contamination → run; otherwise setup/context only.
  const origin: EvidenceOriginV1 =
    storage.status === "contributed" && !setupContamination ? "run" : "setup";

  return [
    {
      container_ref,
      items: sortedInventory(items),
      evidence_ref: refs[0]!,
      origin
    }
  ].sort((a, b) => a.container_ref.localeCompare(b.container_ref));
}

/**
 * Build a repaired evidence bag from a social-cycle report and optional actor
 * workspace artifacts. Missing or unreferenced fields leave `available` false
 * so predicates return `unknown` rather than fabricating success.
 */
export function adaptSocialCycleReportToEvidenceBag(
  input: AdaptSocialCycleEvidenceBagInput
): CapabilityEvidenceBagV1 {
  const { report } = input;
  const setupContamination = detectSetupContamination(report);
  const inventory = adaptInventory(report, input, setupContamination);
  const held_item = adaptHeldItem(report, input, setupContamination);
  const actor_position = adaptActorPosition(report, input);
  const { known_blocks, named_positions } = adaptBlocksAndPositions(
    report.settlement_state,
    setupContamination
  );
  const containers = adaptContainers(report.settlement_state, setupContamination);

  return {
    schema: "capability-evidence-bag/v1",
    actor_id: report.actor_id,
    ...(inventory ? { inventory } : {}),
    ...(held_item ? { held_item } : {}),
    ...(actor_position ? { actor_position } : {}),
    ...(known_blocks ? { known_blocks } : {}),
    ...(named_positions ? { named_positions } : {}),
    ...(containers ? { containers } : {}),
    available: {
      inventory: inventory !== undefined,
      held_item: held_item !== undefined,
      position: actor_position !== undefined,
      blocks: (known_blocks?.length ?? 0) > 0 || (named_positions !== undefined && Object.keys(named_positions).length > 0),
      containers: (containers?.length ?? 0) > 0
    }
  };
}
