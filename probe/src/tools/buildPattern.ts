/**
 * Mineflayer helper for bounded block placement patterns.
 *
 * @remarks Pattern building can look successful from motion or partial
 * placement, so callers need structured target cells, explicit materials, and
 * verifier evidence before treating it as physical progress.
 */
import { placeBlock, type PlaceBlockResult, type Positioned } from "./placeBlock.js";
import { Vec3 } from "vec3";

type MineflayerBlockLike = {
  name: string;
  position: Positioned;
  boundingBox?: string;
};

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error("build_pattern was cancelled before shelter verification completed");
  }
}

type BuildPatternBot = {
  entity: {
    position: Positioned;
  };
  inventory?: {
    items(): Array<{ name: string; count: number }>;
  };
  blockAt?(position: Positioned): MineflayerBlockLike | null;
} & Parameters<typeof placeBlock>[0]["bot"];

export type BuildPatternId = "starter_shelter_2x2_v1";

export type BuildPatternResult = {
  status: "built" | "progressing" | "blocked";
  patternId: BuildPatternId;
  anchor: Positioned;
  anchorResolution?: {
    requestedAnchor: Positioned;
    selectedAnchor: Positioned;
    adjusted: boolean;
    selectedReason: string;
    rejectedCandidates: Array<{ anchor: Positioned; issues: string[] }>;
  };
  materialPolicy: "best_available";
  materialUsed?: string;
  plannedPlacements: number;
  placementLedger: PlaceBlockResult[];
  verification: ShelterStructureVerification;
  reason: string;
};

export type ShelterStructureVerification = {
  status: "passed" | "progressing" | "failed";
  patternId: BuildPatternId;
  anchor: Positioned;
  wallCoverage: number;
  roofCoverage: number;
  interiorClear: boolean;
  floorSupported: boolean;
  placedShellBlocks: number;
  requiredShellBlocks: number;
  missingCells: Positioned[];
  wrongMaterialCells: Array<{ position: Positioned; blockName: string }>;
  reason: string;
};

const SOLID_BUILD_ITEMS = [
  "oak_planks",
  "birch_planks",
  "spruce_planks",
  "jungle_planks",
  "acacia_planks",
  "dark_oak_planks",
  "mangrove_planks",
  "cherry_planks",
  "pale_oak_planks",
  "oak_log",
  "birch_log",
  "spruce_log",
  "jungle_log",
  "acacia_log",
  "dark_oak_log",
  "mangrove_log",
  "cherry_log",
  "pale_oak_log",
  "dirt",
  "cobblestone",
  "stone"
];

const NON_SOLID_BLOCKS = new Set([
  "air",
  "cave_air",
  "void_air",
  "water",
  "lava",
  "short_grass",
  "tall_grass",
  "grass",
  "fern",
  "large_fern",
  "dead_bush",
  "snow",
  "seagrass",
  "tall_seagrass"
]);

function normalizePosition(position: Positioned): Positioned {
  return {
    x: Math.floor(position.x),
    y: Math.floor(position.y),
    z: Math.floor(position.z)
  };
}

function key(position: Positioned) {
  return `${position.x}:${position.y}:${position.z}`;
}

function toVec3(position: Positioned) {
  return new Vec3(position.x, position.y, position.z);
}

function isSolidBlock(block: MineflayerBlockLike | null | undefined) {
  if (!block) {
    return false;
  }
  if (block.boundingBox === "block") {
    return true;
  }
  return !NON_SOLID_BLOCKS.has(block.name);
}

function isClearBlock(block: MineflayerBlockLike | null | undefined) {
  return !block || NON_SOLID_BLOCKS.has(block.name);
}

function isLiquidBlock(block: MineflayerBlockLike | null | undefined) {
  return block?.name === "water" || block?.name === "lava";
}

function isDryClearBlock(block: MineflayerBlockLike | null | undefined) {
  return isClearBlock(block) && !isLiquidBlock(block);
}

function inventoryCount(bot: BuildPatternBot, itemName: string) {
  return bot.inventory?.items()
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0) ?? 0;
}

function chooseBuildMaterial(bot: BuildPatternBot, preferredMaterials: string[] = []) {
  const candidates = [...preferredMaterials, ...SOLID_BUILD_ITEMS];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    if (inventoryCount(bot, candidate) > 0) {
      return candidate;
    }
  }
  return undefined;
}

function uniquePositions(positions: Positioned[]) {
  const seen = new Set<string>();
  const result: Positioned[] = [];
  for (const position of positions) {
    const positionKey = key(position);
    if (seen.has(positionKey)) {
      continue;
    }
    seen.add(positionKey);
    result.push(position);
  }
  return result;
}

function distance(left: Positioned, right: Positioned) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function shelterBounds(anchor: Positioned) {
  const base = normalizePosition(anchor);
  return {
    minX: base.x,
    maxX: base.x + 2,
    minZ: base.z,
    maxZ: base.z + 2,
    y: base.y
  };
}

function isStandableWorkCell(bot: BuildPatternBot, position: Positioned) {
  return isDryClearBlock(bot.blockAt?.(toVec3(position))) &&
    isDryClearBlock(bot.blockAt?.(toVec3({ ...position, y: position.y + 1 }))) &&
    isSolidBlock(bot.blockAt?.(toVec3({ ...position, y: position.y - 1 })));
}

function buildApproachCandidates({
  bot,
  anchor,
  targetPosition
}: {
  bot: BuildPatternBot;
  anchor: Positioned;
  targetPosition: Positioned;
}) {
  const bounds = shelterBounds(anchor);
  const candidates: Positioned[] = [];
  const add = (x: number, z: number) => {
    candidates.push({ x, y: bounds.y, z });
  };

  if (targetPosition.x === bounds.minX) {
    add(bounds.minX - 2, targetPosition.z);
    add(bounds.minX - 1, targetPosition.z);
  }
  if (targetPosition.x === bounds.maxX) {
    add(bounds.maxX + 2, targetPosition.z);
    add(bounds.maxX + 1, targetPosition.z);
  }
  if (targetPosition.z === bounds.minZ) {
    add(targetPosition.x, bounds.minZ - 2);
    add(targetPosition.x, bounds.minZ - 1);
  }
  if (targetPosition.z === bounds.maxZ) {
    add(targetPosition.x, bounds.maxZ + 2);
    add(targetPosition.x, bounds.maxZ + 1);
  }

  add(bounds.minX - 2, targetPosition.z);
  add(bounds.maxX + 2, targetPosition.z);
  add(targetPosition.x, bounds.minZ - 2);
  add(targetPosition.x, bounds.maxZ + 2);
  add(bounds.minX - 1, targetPosition.z);
  add(bounds.maxX + 1, targetPosition.z);
  add(targetPosition.x, bounds.minZ - 1);
  add(targetPosition.x, bounds.maxZ + 1);

  return uniquePositions(candidates)
    .filter((candidate) => isStandableWorkCell(bot, candidate))
    .filter((candidate) => distance(candidate, targetPosition) <= 4.6);
}

function shouldTryAnotherApproach(result: PlaceBlockResult) {
  return result.status === "blocked" &&
    !/no adjacent support|requires .* in inventory|non-replaceable|requires Mineflayer/i.test(result.reason);
}

function surfaceYForColumn(bot: BuildPatternBot, x: number, z: number, aroundY: number) {
  const startY = Math.floor(aroundY) + 8;
  const minY = Math.floor(aroundY) - 18;
  for (let y = startY; y >= minY; y -= 1) {
    const support = bot.blockAt?.(toVec3({ x, y: y - 1, z }));
    const feet = bot.blockAt?.(toVec3({ x, y, z }));
    const head = bot.blockAt?.(toVec3({ x, y: y + 1, z }));
    if (isSolidBlock(support) && isDryClearBlock(feet) && isDryClearBlock(head)) {
      return y;
    }
  }
  return undefined;
}

function anchorSafetyIssues(bot: BuildPatternBot, anchor: Positioned) {
  const blueprint = starterShelterShellPositions(anchor);
  const issues: string[] = [];
  const checkedCells = uniquePositions([
    ...blueprint.shellPositions,
    ...blueprint.interiorPositions,
    ...blueprint.floorSupportPositions
  ]);
  const liquidCells = checkedCells.filter((position) => isLiquidBlock(bot.blockAt?.(toVec3(position))));
  if (liquidCells.length > 0) {
    issues.push(`liquid_cells=${liquidCells.length}`);
  }
  if (
    !blueprint.floorSupportPositions.every((position) =>
      isSolidBlock(bot.blockAt?.(toVec3(position)))
    )
  ) {
    issues.push("floor_support_missing");
  }
  if (
    !blueprint.interiorPositions.every((position) =>
      isDryClearBlock(bot.blockAt?.(toVec3(position)))
    )
  ) {
    issues.push("interior_not_dry_clear");
  }
  const hasWorkCell = blueprint.shellPositions.some((position) =>
    buildApproachCandidates({ bot, anchor, targetPosition: position }).length > 0
  );
  if (!hasWorkCell) {
    issues.push("no_dry_standable_work_cell");
  }
  return issues;
}

function anchorCandidateOffsets() {
  const offsets: Array<{ dx: number; dz: number }> = [{ dx: 0, dz: 0 }];
  for (let radius = 1; radius <= 8; radius += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      offsets.push({ dx, dz: -radius }, { dx, dz: radius });
    }
    for (let dz = -radius + 1; dz <= radius - 1; dz += 1) {
      offsets.push({ dx: -radius, dz }, { dx: radius, dz });
    }
  }
  return offsets;
}

function resolveShelterAnchor(input: {
  bot: BuildPatternBot;
  requestedAnchor: Positioned;
}) {
  const requestedAnchor = normalizePosition(input.requestedAnchor);
  const origin = normalizePosition(input.bot.entity.position);
  const candidates: Positioned[] = [];
  const addCandidate = (base: Positioned, dx = 0, dz = 0) => {
    const x = base.x + dx;
    const z = base.z + dz;
    const surfaceY = surfaceYForColumn(input.bot, x, z, base.y);
    candidates.push(surfaceY === undefined ? { x, y: base.y, z } : { x, y: surfaceY, z });
  };

  for (const offset of anchorCandidateOffsets()) {
    addCandidate(requestedAnchor, offset.dx, offset.dz);
    addCandidate({ x: origin.x + 2, y: origin.y, z: origin.z + 2 }, offset.dx, offset.dz);
  }

  const rejectedCandidates: Array<{ anchor: Positioned; issues: string[] }> = [];
  for (const candidate of uniquePositions(candidates)) {
    const issues = anchorSafetyIssues(input.bot, candidate);
    if (issues.length === 0) {
      return {
        requestedAnchor,
        selectedAnchor: candidate,
        adjusted: key(candidate) !== key(requestedAnchor),
        selectedReason: key(candidate) === key(requestedAnchor)
          ? "requested anchor is dry, supported, and locally workable"
          : "selected nearest dry supported local anchor",
        rejectedCandidates: rejectedCandidates.slice(0, 8)
      };
    }
    if (rejectedCandidates.length < 12) {
      rejectedCandidates.push({ anchor: candidate, issues });
    }
  }

  return {
    requestedAnchor,
    selectedAnchor: requestedAnchor,
    adjusted: false,
    selectedReason: "no dry supported local anchor found",
    rejectedCandidates: rejectedCandidates.slice(0, 8)
  };
}

export function starterShelterShellPositions(anchor: Positioned) {
  const base = normalizePosition(anchor);
  const wallPositions: Positioned[] = [];
  const roofPositions: Positioned[] = [];
  const doorway = new Set([
    key({ x: base.x + 1, y: base.y, z: base.z }),
    key({ x: base.x + 1, y: base.y + 1, z: base.z })
  ]);

  for (let layer = 0; layer < 2; layer += 1) {
    const y = base.y + layer;
    for (let dx = 0; dx < 3; dx += 1) {
      for (let dz = 0; dz < 3; dz += 1) {
        const onPerimeter = dx === 0 || dx === 2 || dz === 0 || dz === 2;
        const position = { x: base.x + dx, y, z: base.z + dz };
        if (onPerimeter && !doorway.has(key(position))) {
          wallPositions.push(position);
        }
      }
    }
  }

  for (let dx = 0; dx < 3; dx += 1) {
    for (let dz = 0; dz < 3; dz += 1) {
      roofPositions.push({ x: base.x + dx, y: base.y + 2, z: base.z + dz });
    }
  }

  return {
    wallPositions,
    roofPositions,
    shellPositions: uniquePositions([...wallPositions, ...roofPositions]),
    interiorPositions: [
      { x: base.x + 1, y: base.y, z: base.z },
      { x: base.x + 1, y: base.y + 1, z: base.z },
      { x: base.x + 1, y: base.y, z: base.z + 1 },
      { x: base.x + 1, y: base.y + 1, z: base.z + 1 }
    ],
    floorSupportPositions: [
      { x: base.x + 1, y: base.y - 1, z: base.z + 1 }
    ]
  };
}

export function verifyShelterStructure({
  bot,
  anchor,
  patternId = "starter_shelter_2x2_v1",
  placementLedger = [],
  minNewShellBlocks = 20
}: {
  bot: BuildPatternBot;
  anchor: Positioned;
  patternId?: BuildPatternId;
  placementLedger?: PlaceBlockResult[];
  minNewShellBlocks?: number;
}): ShelterStructureVerification {
  const normalizedAnchor = normalizePosition(anchor);
  const blueprint = starterShelterShellPositions(normalizedAnchor);
  const missingCells: Positioned[] = [];
  const wrongMaterialCells: Array<{ position: Positioned; blockName: string }> = [];
  let wallPresent = 0;
  let roofPresent = 0;

  for (const position of blueprint.wallPositions) {
    const block = bot.blockAt?.(toVec3(position));
    if (isSolidBlock(block)) {
      wallPresent += 1;
    } else {
      missingCells.push(position);
      if (block?.name) {
        wrongMaterialCells.push({ position, blockName: block.name });
      }
    }
  }

  for (const position of blueprint.roofPositions) {
    const block = bot.blockAt?.(toVec3(position));
    if (isSolidBlock(block)) {
      roofPresent += 1;
    } else {
      missingCells.push(position);
      if (block?.name) {
        wrongMaterialCells.push({ position, blockName: block.name });
      }
    }
  }

  const interiorClear = blueprint.interiorPositions.every((position) =>
    isClearBlock(bot.blockAt?.(toVec3(position)))
  );
  const floorSupported = blueprint.floorSupportPositions.every((position) =>
    isSolidBlock(bot.blockAt?.(toVec3(position)))
  );
  const wallCoverage = Number((wallPresent / blueprint.wallPositions.length).toFixed(3));
  const roofCoverage = Number((roofPresent / blueprint.roofPositions.length).toFixed(3));
  const placedShellBlocks = placementLedger.filter((entry) => entry.status === "placed").length;
  const fullShellPresent = missingCells.length === 0 && interiorClear && floorSupported;

  if (fullShellPresent && placedShellBlocks >= minNewShellBlocks) {
    return {
      status: "passed",
      patternId,
      anchor: normalizedAnchor,
      wallCoverage,
      roofCoverage,
      interiorClear,
      floorSupported,
      placedShellBlocks,
      requiredShellBlocks: blueprint.shellPositions.length,
      missingCells,
      wrongMaterialCells,
      reason: "starter shelter shell verified from current world blocks."
    };
  }

  const anyProgress = placedShellBlocks > 0 || wallPresent > 0 || roofPresent > 0;
  return {
    status: anyProgress ? "progressing" : "failed",
    patternId,
    anchor: normalizedAnchor,
    wallCoverage,
    roofCoverage,
    interiorClear,
    floorSupported,
    placedShellBlocks,
    requiredShellBlocks: blueprint.shellPositions.length,
    missingCells,
    wrongMaterialCells,
    reason: fullShellPresent
      ? `shelter shell exists, but only ${placedShellBlocks} new shell blocks were verified from this build ledger.`
      : "starter shelter shell is incomplete in current world blocks."
  };
}

export async function buildPattern({
  bot,
  patternId = "starter_shelter_2x2_v1",
  anchor,
  preferredMaterials = [],
  maxPlacements = 64,
  minNewShellBlocks = 20,
  maxPasses = 2,
  maxDurationMs = 30_000,
  signal
}: {
  bot: BuildPatternBot;
  patternId?: BuildPatternId;
  anchor: Positioned;
  preferredMaterials?: string[];
  maxPlacements?: number;
  minNewShellBlocks?: number;
  maxPasses?: number;
  maxDurationMs?: number;
  signal?: AbortSignal;
}): Promise<BuildPatternResult> {
  const anchorResolution = resolveShelterAnchor({
    bot,
    requestedAnchor: anchor
  });
  const normalizedAnchor = anchorResolution.selectedAnchor;
  const blueprint = starterShelterShellPositions(normalizedAnchor);
  const placementLedger: PlaceBlockResult[] = [];
  let materialUsed: string | undefined;
  const plannedTargets = blueprint.shellPositions.slice(0, Math.max(0, maxPlacements));
  const deadline = Date.now() + Math.max(1_000, maxDurationMs);
  let stoppedByBudget = false;

  if (anchorResolution.selectedReason === "no dry supported local anchor found") {
    const verification = verifyShelterStructure({
      bot,
      anchor: normalizedAnchor,
      patternId,
      placementLedger,
      minNewShellBlocks
    });
    return {
      status: "blocked",
      patternId,
      anchor: normalizedAnchor,
      anchorResolution,
      materialPolicy: "best_available",
      plannedPlacements: blueprint.shellPositions.length,
      placementLedger,
      verification,
      reason: "build_pattern found no dry supported nearby anchor for this pattern."
    };
  }

  const budgetRemaining = () => deadline - Date.now();

  for (let pass = 0; pass < Math.max(1, maxPasses); pass += 1) {
    throwIfAborted(signal);
    if (budgetRemaining() <= 0) {
      stoppedByBudget = true;
      break;
    }
    const placedBeforePass = placementLedger.filter((entry) => entry.status === "placed").length;

    for (const targetPosition of plannedTargets) {
      throwIfAborted(signal);
      if (budgetRemaining() <= 0) {
        stoppedByBudget = true;
        break;
      }
      if (isSolidBlock(bot.blockAt?.(toVec3(targetPosition)))) {
        continue;
      }

      const itemName = chooseBuildMaterial(bot, preferredMaterials);
      if (!itemName) {
        break;
      }
      materialUsed ??= itemName;
      const approaches = buildApproachCandidates({
        bot,
        anchor: normalizedAnchor,
        targetPosition
      });
      const candidates = approaches.length > 0 ? approaches : [undefined];

      for (const approachPosition of candidates) {
        throwIfAborted(signal);
        if (budgetRemaining() <= 0) {
          stoppedByBudget = true;
          break;
        }
        const result = await placeBlock({
          bot,
          itemName,
          targetPosition,
          expectedBlockNames: [itemName],
          approachPosition,
          moveTimeoutMs: Math.min(3_000, Math.max(500, budgetRemaining())),
          signal
        });
        placementLedger.push(result);

        if (result.status === "placed" || result.status === "already_present") {
          break;
        }

        if (!shouldTryAnotherApproach(result)) {
          break;
        }
      }

      if (stoppedByBudget) {
        break;
      }
    }

    const verification = verifyShelterStructure({
      bot,
      anchor: normalizedAnchor,
      patternId,
      placementLedger,
      minNewShellBlocks
    });
    const placedAfterPass = placementLedger.filter((entry) => entry.status === "placed").length;

    if (stoppedByBudget || verification.status === "passed" || placedAfterPass === placedBeforePass) {
      break;
    }
  }

  const verification = verifyShelterStructure({
    bot,
    anchor: normalizedAnchor,
    patternId,
    placementLedger,
    minNewShellBlocks
  });

  if (verification.status === "passed") {
    return {
      status: "built",
      patternId,
      anchor: normalizedAnchor,
      anchorResolution,
      materialPolicy: "best_available",
      materialUsed,
      plannedPlacements: blueprint.shellPositions.length,
      placementLedger,
      verification,
      reason: "build_pattern completed and verified a starter shelter shell."
    };
  }

  if (placementLedger.some((entry) => entry.status === "placed")) {
    return {
      status: "progressing",
      patternId,
      anchor: normalizedAnchor,
      anchorResolution,
      materialPolicy: "best_available",
      materialUsed,
      plannedPlacements: blueprint.shellPositions.length,
      placementLedger,
      verification,
      reason: stoppedByBudget
        ? "build_pattern placed shell blocks but stopped before shelter verification completed within budget."
        : "build_pattern placed shell blocks but shelter verification is not complete yet."
    };
  }

  return {
    status: "blocked",
    patternId,
    anchor: normalizedAnchor,
    anchorResolution,
    materialPolicy: "best_available",
    materialUsed,
    plannedPlacements: blueprint.shellPositions.length,
    placementLedger,
    verification,
    reason: stoppedByBudget
      ? "build_pattern stopped before placing starter shelter shell blocks within budget."
      : materialUsed
        ? "build_pattern could not place any starter shelter shell blocks."
        : "build_pattern found no solid build material in inventory."
  };
}
