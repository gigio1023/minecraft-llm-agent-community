/**
 * Optional enricher for the multi-hop furnace case.
 *
 * Maps place_block furnace evidence into `named_positions.placed_furnace` and
 * matching `known_blocks` entries. Settlement state does not track furnace
 * positions the way it tracks crafting tables, so this adapter fills that gap
 * without becoming generic V4 schema authority.
 *
 * Must not be imported by `report.ts`. Callers (runner / offline scripts) apply
 * it after `adaptSocialCycleReportToEvidenceBag` when furnace placement scoring
 * is needed. Does not import `FURNACE_BLOCK_SCORING_PLAN` or `BenchmarkMilestoneId`.
 */

import { readFileSync } from "node:fs";

import type { SocialCycleRunReport } from "../../runtime/goals/types.js";
import { resolveRootSafeArtifactRef } from "./artifactRefs.js";
import type {
  CapabilityEvidenceBagV1,
  EvidenceOriginV1,
  EvidencedValueV1
} from "./evidenceBag.js";
import type { AdaptSocialCycleEvidenceBagInput } from "./evidenceBagAdapter.js";
import { normalizeMinecraftId } from "./minecraftIds.js";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function dedupeRefs(refs: readonly string[]): string[] {
  return [
    ...new Set(
      refs.filter((ref) => typeof ref === "string" && ref.trim().length > 0).map((ref) => ref.trim())
    )
  ].sort((a, b) => a.localeCompare(b));
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

function lookupArtifact(
  ref: string,
  input: AdaptSocialCycleEvidenceBagInput
): unknown | null {
  const map = input.artifactsByRef;
  if (map) {
    if (map instanceof Map) {
      if (map.has(ref)) {
        return map.get(ref) ?? null;
      }
    } else if (Object.prototype.hasOwnProperty.call(map, ref)) {
      return (map as Record<string, unknown>)[ref] ?? null;
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

function positionFromResult(result: JsonRecord): { x: number; y: number; z: number } | null {
  const candidates = [result.targetPosition, result.position, result.post_position];
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

function detectSetupContamination(report: SocialCycleRunReport): boolean {
  if (report.agency_status.fixture_dependency) {
    return true;
  }
  if (report.server?.starter_inventory_seeded) {
    return true;
  }
  const scenario = report.server?.world_scenario;
  if (scenario?.fixture_dependency || scenario?.lane === "fixture_probe") {
    return true;
  }
  return false;
}

type FurnacePlacement = {
  position: { x: number; y: number; z: number };
  evidence_ref: string;
  origin: EvidenceOriginV1;
};

/**
 * Find the latest place_block furnace placement with coordinates in cycle evidence.
 */
function findFurnacePlacement(input: AdaptSocialCycleEvidenceBagInput): FurnacePlacement | null {
  const setupContamination = detectSetupContamination(input.report);
  let found: FurnacePlacement | null = null;

  for (const ref of collectCycleEvidenceRefs(input.report)) {
    const artifact = lookupArtifact(ref, input);
    if (!isRecord(artifact) || !isRecord(artifact.tool_attempt)) {
      continue;
    }
    const toolAttempt = artifact.tool_attempt;
    const tool = typeof toolAttempt.tool === "string" ? toolAttempt.tool : "";
    if (tool !== "place_block" && tool !== "placeBlock") {
      continue;
    }
    const args = isRecord(toolAttempt.args) ? toolAttempt.args : {};
    const result = isRecord(toolAttempt.result) ? toolAttempt.result : {};
    const status =
      typeof result.status === "string" ? result.status.trim().toLowerCase() : "";
    if (status !== "placed") {
      continue;
    }
    const itemName =
      normalizeMinecraftId(
        typeof result.itemName === "string"
          ? result.itemName
          : typeof args.itemName === "string"
            ? args.itemName
            : ""
      ) ||
      normalizeMinecraftId(
        typeof result.afterBlockName === "string" ? result.afterBlockName : ""
      );
    if (itemName !== "furnace") {
      continue;
    }
    const position = positionFromResult(result);
    if (!position) {
      continue;
    }
    found = {
      position,
      evidence_ref: ref,
      origin: setupContamination ? "setup" : "run"
    };
  }

  return found;
}

/**
 * Enrich an evidence bag with furnace placement observations when present.
 * No-ops when no furnace place evidence exists or `placed_furnace` is already set.
 */
export function applyFurnaceObservationAdapter(
  bag: CapabilityEvidenceBagV1,
  input: AdaptSocialCycleEvidenceBagInput
): CapabilityEvidenceBagV1 {
  if (bag.named_positions?.placed_furnace) {
    return bag;
  }

  const placement = findFurnacePlacement(input);
  if (!placement) {
    return bag;
  }

  const position = evidencedValue(placement.position, [placement.evidence_ref], placement.origin);
  if (!position) {
    return bag;
  }

  const known_blocks = [...(bag.known_blocks ?? [])];
  const alreadyListed = known_blocks.some(
    (entry) =>
      normalizeMinecraftId(entry.block) === "furnace" &&
      entry.evidence_ref === placement.evidence_ref
  );
  if (!alreadyListed) {
    known_blocks.push({
      block: "furnace",
      position: placement.position,
      evidence_ref: placement.evidence_ref,
      origin: placement.origin
    });
    known_blocks.sort((a, b) =>
      `${a.block}:${a.evidence_ref}`.localeCompare(`${b.block}:${b.evidence_ref}`)
    );
  }

  const named_positions = {
    ...(bag.named_positions ?? {}),
    placed_furnace: position
  };

  return {
    ...bag,
    known_blocks,
    named_positions: Object.fromEntries(
      Object.entries(named_positions).sort(([a], [b]) => a.localeCompare(b))
    ),
    available: {
      ...bag.available,
      blocks: true
    }
  };
}
