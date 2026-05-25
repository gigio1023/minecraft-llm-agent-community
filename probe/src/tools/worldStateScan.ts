import { Vec3 } from "vec3";

export type WorldStatePosition = { x: number; y: number; z: number };

type MineflayerBlockLike = {
  name: string;
  position?: WorldStatePosition;
  boundingBox?: string;
};

export type WorldStateScanBot = {
  entity: {
    position: WorldStatePosition;
  };
  game?: {
    dimension?: string;
  };
  dimension?: string;
  findBlocks?(input: {
    matching: (block: { name: string }) => boolean;
    maxDistance: number;
    count: number;
  }): WorldStatePosition[];
  blockAt?(position: WorldStatePosition, extraInfos?: boolean): MineflayerBlockLike | null | undefined;
};

export type WorldStateScanCaps = {
  blockObservations: number;
  nearestExamples: number;
};

export type WorldStateBlockExample = {
  name: string;
  position: WorldStatePosition;
  distance: number;
};

export type WorldStateNamedCount = {
  name: string;
  count: number;
  nearest: WorldStateBlockExample[];
};

export type WorldStateScan = {
  schema: "world-state-scan/v1";
  scan_id: string;
  actor_id: string;
  turn_id?: string;
  created_at: string;
  center: WorldStatePosition;
  dimension: string;
  radius: number;
  vertical_range: {
    min_y: number;
    max_y: number;
    center_y: number;
  };
  limitations: string[];
  loaded_coverage: {
    method: "blockAt-sampled-columns" | "unavailable";
    scope: "sampled_columns_only";
    sample_stride: number;
    sampled_columns: number;
    loaded_columns: number;
    unknown_columns: number;
    approximate_loaded_ratio?: number;
    exhaustive: false;
    sample_had_unknown_columns: boolean;
    absence_claims_exhaustive: false;
    incomplete: boolean;
  };
  scan_caps: WorldStateScanCaps;
  block_observations: {
    total_verified: number;
    truncated: boolean;
    by_name: WorldStateNamedCount[];
    nearest: WorldStateBlockExample[];
  };
};

export type WorldStateSummary = {
  schema: "world-state-summary/v1";
  scan_id: string;
  scan_ref?: string;
  center: WorldStatePosition;
  radius: number;
  vertical_range: WorldStateScan["vertical_range"];
  loaded_coverage: WorldStateScan["loaded_coverage"];
  block_observations: Pick<WorldStateScan["block_observations"], "total_verified" | "truncated" | "by_name" | "nearest">;
  limitations: string[];
};

export type WorldStateScanInput = {
  bot: WorldStateScanBot;
  actorId?: string;
  turnId?: string;
  scanId?: string;
  radius?: number;
  verticalRange?: {
    minY: number;
    maxY: number;
  };
  caps?: Partial<WorldStateScanCaps>;
  coverageSampleStride?: number;
  createdAt?: Date | string;
  dimension?: string;
};

type VerifiedBlock = {
  name: string;
  position: WorldStatePosition;
  distance: number;
};

const DEFAULT_RADIUS = 32;
const DEFAULT_VERTICAL_BELOW = 16;
const DEFAULT_VERTICAL_ABOVE = 16;
const DEFAULT_COVERAGE_SAMPLE_STRIDE = 8;

const DEFAULT_CAPS: WorldStateScanCaps = {
  blockObservations: 192,
  nearestExamples: 12
};

const AIR_LIKE_BLOCKS = new Set([
  "air",
  "cave_air",
  "void_air"
]);

function roundNumber(value: number) {
  return Number(value.toFixed(2));
}

function normalizeBlockPosition(position: WorldStatePosition): WorldStatePosition {
  return {
    x: Math.floor(position.x),
    y: Math.floor(position.y),
    z: Math.floor(position.z)
  };
}

function roundPosition(position: WorldStatePosition): WorldStatePosition {
  return {
    x: roundNumber(position.x),
    y: roundNumber(position.y),
    z: roundNumber(position.z)
  };
}

function distance(left: WorldStatePosition, right: WorldStatePosition) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function positionKey(position: WorldStatePosition) {
  const normalized = normalizeBlockPosition(position);
  return `${normalized.x}:${normalized.y}:${normalized.z}`;
}

function addLimitation(limitations: Set<string>, limitation: string) {
  limitations.add(limitation);
}

function isWithinVerticalRange(position: WorldStatePosition, minY: number, maxY: number) {
  return position.y >= minY && position.y <= maxY;
}

function isObservedBlockName(name: string) {
  return !AIR_LIKE_BLOCKS.has(name);
}

function toCreatedAt(value: Date | string | undefined) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value ?? new Date().toISOString();
}

function safeBlockAt(
  bot: WorldStateScanBot,
  position: WorldStatePosition,
  limitations: Set<string>
) {
  if (!bot.blockAt) {
    addLimitation(limitations, "blockAt API missing; findBlocks hits cannot be re-read.");
    return undefined;
  }

  try {
    return bot.blockAt(new Vec3(position.x, position.y, position.z), true);
  } catch {
    addLimitation(limitations, "blockAt threw for at least one sampled position.");
    return undefined;
  }
}

function safeFindBlocks(input: {
  bot: WorldStateScanBot;
  radius: number;
  count: number;
  limitations: Set<string>;
  }) {
  if (!input.bot.findBlocks) {
    addLimitation(input.limitations, "findBlocks API missing; block observations are unavailable.");
    return [];
  }

  try {
    return input.bot.findBlocks({
      matching: (block) => isObservedBlockName(block.name),
      maxDistance: input.radius,
      count: input.count
    });
  } catch {
    addLimitation(input.limitations, "findBlocks scan threw; block observations are incomplete.");
    return [];
  }
}

function collectVerifiedBlocks(input: {
  bot: WorldStateScanBot;
  center: WorldStatePosition;
  radius: number;
  minY: number;
  maxY: number;
  cap: number;
  limitations: Set<string>;
}) {
  const positions = safeFindBlocks({
    bot: input.bot,
    radius: input.radius,
    count: input.cap,
    limitations: input.limitations
  });
  const truncated = positions.length >= input.cap;
  const seen = new Set<string>();
  const blocks: VerifiedBlock[] = [];

  if (truncated) {
    addLimitation(
      input.limitations,
      `block observations reached cap ${input.cap}; counts and absence claims are truncated.`
    );
  }

  for (const foundPosition of positions) {
    const block = safeBlockAt(input.bot, foundPosition, input.limitations);
    const position = normalizeBlockPosition(block?.position ?? foundPosition);

    if (!block) {
      addLimitation(input.limitations, "at least one findBlocks hit could not be verified by blockAt.");
      continue;
    }
    if (!isObservedBlockName(block.name) || !isWithinVerticalRange(position, input.minY, input.maxY)) {
      continue;
    }

    const key = `${block.name}:${positionKey(position)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    blocks.push({
      name: block.name,
      position,
      distance: roundNumber(distance(input.center, position))
    });
  }

  blocks.sort((left, right) => left.distance - right.distance);
  return { blocks, truncated };
}

function toBlockExample(block: VerifiedBlock): WorldStateBlockExample {
  return {
    name: block.name,
    position: block.position,
    distance: block.distance
  };
}

function summarizeByName(blocks: VerifiedBlock[], nearestLimit: number): WorldStateNamedCount[] {
  const byName = new Map<string, VerifiedBlock[]>();
  for (const block of blocks) {
    byName.set(block.name, [...(byName.get(block.name) ?? []), block]);
  }

  return [...byName.entries()]
    .map(([name, namedBlocks]) => ({
      name,
      count: namedBlocks.length,
      nearest: namedBlocks.slice(0, nearestLimit).map(toBlockExample)
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

function sampleLoadedCoverage(input: {
  bot: WorldStateScanBot;
  center: WorldStatePosition;
  radius: number;
  minY: number;
  maxY: number;
  stride: number;
  limitations: Set<string>;
}): WorldStateScan["loaded_coverage"] {
  if (!input.bot.blockAt) {
    addLimitation(input.limitations, "loaded coverage unavailable because blockAt API is missing.");
    return {
      method: "unavailable",
      scope: "sampled_columns_only",
      sample_stride: input.stride,
      sampled_columns: 0,
      loaded_columns: 0,
      unknown_columns: 0,
      exhaustive: false,
      sample_had_unknown_columns: true,
      absence_claims_exhaustive: false,
      incomplete: true
    };
  }

  let sampledColumns = 0;
  let loadedColumns = 0;
  let unknownColumns = 0;
  const center = normalizeBlockPosition(input.center);
  const sampleYs = [...new Set([input.minY, center.y, input.maxY])];
  const minX = center.x - input.radius;
  const maxX = center.x + input.radius;
  const minZ = center.z - input.radius;
  const maxZ = center.z + input.radius;

  for (let x = minX; x <= maxX; x += input.stride) {
    for (let z = minZ; z <= maxZ; z += input.stride) {
      if (Math.hypot(x - center.x, z - center.z) > input.radius) {
        continue;
      }

      sampledColumns += 1;
      const hasLoadedSample = sampleYs.some((y) =>
        safeBlockAt(input.bot, { x, y, z }, input.limitations) != null
      );

      if (hasLoadedSample) {
        loadedColumns += 1;
      } else {
        unknownColumns += 1;
      }
    }
  }

  if (unknownColumns > 0) {
    addLimitation(
      input.limitations,
      "loaded coverage sample has unknown columns; absence claims do not cover those columns."
    );
  }

  addLimitation(
    input.limitations,
    "loaded coverage is sampled, not exhaustive; absence claims cannot exclude unsampled loaded or unloaded columns."
  );

  // This is intentionally conservative: even a clean sample says only that the
  // sampled columns loaded, not that the full radius was loaded or searched.
  return {
    method: "blockAt-sampled-columns",
    scope: "sampled_columns_only",
    sample_stride: input.stride,
    sampled_columns: sampledColumns,
    loaded_columns: loadedColumns,
    unknown_columns: unknownColumns,
    approximate_loaded_ratio: sampledColumns === 0
      ? undefined
      : roundNumber(loadedColumns / sampledColumns),
    exhaustive: false,
    sample_had_unknown_columns: unknownColumns > 0,
    absence_claims_exhaustive: false,
    incomplete: true
  };
}

function resolveVerticalRange(input: {
  center: WorldStatePosition;
  verticalRange?: { minY: number; maxY: number };
}) {
  if (input.verticalRange) {
    return {
      minY: Math.floor(Math.min(input.verticalRange.minY, input.verticalRange.maxY)),
      maxY: Math.floor(Math.max(input.verticalRange.minY, input.verticalRange.maxY))
    };
  }

  const centerY = Math.floor(input.center.y);
  return {
    minY: centerY - DEFAULT_VERTICAL_BELOW,
    maxY: centerY + DEFAULT_VERTICAL_ABOVE
  };
}

/**
 * Builds a query-neutral diagnostic snapshot from Mineflayer's loaded block
 * cache. It records raw Minecraft names and scan limits, not strategic
 * categories, so the provider receives context without being steered toward a
 * hardcoded activity.
 */
export function scanWorldState(input: WorldStateScanInput): WorldStateScan {
  const center = roundPosition(input.bot.entity.position);
  const radius = input.radius ?? DEFAULT_RADIUS;
  const caps = { ...DEFAULT_CAPS, ...input.caps };
  const coverageSampleStride = Math.max(
    1,
    Math.floor(input.coverageSampleStride ?? DEFAULT_COVERAGE_SAMPLE_STRIDE)
  );
  const { minY, maxY } = resolveVerticalRange({ center, verticalRange: input.verticalRange });
  const limitations = new Set<string>([
    "findBlocks is limited to Mineflayer's currently loaded client cache; absence claims are scoped to that cache, radius, vertical_range, and caps."
  ]);
  const dimension = input.dimension ?? input.bot.game?.dimension ?? input.bot.dimension ?? "unknown";

  if (dimension === "unknown") {
    addLimitation(limitations, "dimension unavailable from input or bot state.");
  }

  const verified = collectVerifiedBlocks({
    bot: input.bot,
    center,
    radius,
    minY,
    maxY,
    cap: caps.blockObservations,
    limitations
  });
  const loadedCoverage = sampleLoadedCoverage({
    bot: input.bot,
    center,
    radius,
    minY,
    maxY,
    stride: coverageSampleStride,
    limitations
  });

  return {
    schema: "world-state-scan/v1",
    scan_id: input.scanId ?? `world-scan-${Date.now()}`,
    actor_id: input.actorId ?? "unknown",
    ...(input.turnId ? { turn_id: input.turnId } : {}),
    created_at: toCreatedAt(input.createdAt),
    center,
    dimension,
    radius,
    vertical_range: {
      min_y: minY,
      max_y: maxY,
      center_y: Math.floor(center.y)
    },
    limitations: [...limitations].sort(),
    loaded_coverage: loadedCoverage,
    scan_caps: caps,
    block_observations: {
      total_verified: verified.blocks.length,
      truncated: verified.truncated,
      by_name: summarizeByName(verified.blocks, caps.nearestExamples),
      nearest: verified.blocks.slice(0, caps.nearestExamples).map(toBlockExample)
    }
  };
}

export function summarizeWorldStateScan(
  scan: WorldStateScan,
  scanRef?: string
): WorldStateSummary {
  return {
    schema: "world-state-summary/v1",
    scan_id: scan.scan_id,
    ...(scanRef ? { scan_ref: scanRef } : {}),
    center: scan.center,
    radius: scan.radius,
    vertical_range: scan.vertical_range,
    loaded_coverage: scan.loaded_coverage,
    block_observations: scan.block_observations,
    limitations: [...scan.limitations]
  };
}
