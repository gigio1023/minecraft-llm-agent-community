export type NaturalSpawnValidationPosition = {
  x: number;
  y: number;
  z: number;
};

export type NaturalSpawnValidationBlock = {
  name: string;
  position?: NaturalSpawnValidationPosition;
  boundingBox?: string;
};

export type NaturalSpawnBlockLookupResult =
  | NaturalSpawnValidationBlock
  | null
  | undefined;

export type NaturalSpawnBlockLookup =
  | ((position: NaturalSpawnValidationPosition) =>
    NaturalSpawnBlockLookupResult | Promise<NaturalSpawnBlockLookupResult>)
  | {
    blockAt(position: NaturalSpawnValidationPosition):
      NaturalSpawnBlockLookupResult | Promise<NaturalSpawnBlockLookupResult>;
  };

export type NaturalSpawnValidationWorld = {
  seed?: string;
  dimension?: string;
  server_version?: string;
  level_type?: string;
};

export type NaturalSpawnValidationScan = {
  center: NaturalSpawnValidationPosition;
  radius: number;
  vertical_range: {
    min_y: number;
    max_y: number;
  };
  loaded_world_only: true;
  null_or_unloaded_block_count: number;
  candidate_limit: number;
};

export type NaturalSpawnValidationAcceptanceReason =
  | "feet_passable"
  | "head_passable"
  | "solid_natural_support"
  | "nearby_loaded_log_observed"
  | "not_leaf_or_log_dominated"
  | "no_loaded_hazard_observed"
  | "no_loaded_cave_drop_observed";

export type NaturalSpawnValidationRejectionReason =
  | "support_block_unloaded"
  | "feet_block_unloaded"
  | "head_block_unloaded"
  | "feet_not_passable"
  | "head_not_passable"
  | "support_not_solid_natural_ground"
  | "leaf_or_log_support"
  | "hazard_block_nearby"
  | "leaf_or_log_dominated"
  | "cave_drop_nearby"
  | "nearby_loaded_log_missing";

export type NaturalSpawnValidationLogExample = {
  name: string;
  x: number;
  y: number;
  z: number;
  distance: number;
};

export type NaturalSpawnValidationSelectedCandidate = {
  position: NaturalSpawnValidationPosition;
  support_block: string;
  feet_block: string;
  head_block: string;
  nearest_logs: NaturalSpawnValidationLogExample[];
  acceptance_reasons: NaturalSpawnValidationAcceptanceReason[];
};

export type NaturalSpawnValidationRejectedCandidate = {
  position: NaturalSpawnValidationPosition;
  reason: NaturalSpawnValidationRejectionReason;
  reasons: NaturalSpawnValidationRejectionReason[];
  support_block?: string;
  feet_block?: string;
  head_block?: string;
  nearest_logs?: NaturalSpawnValidationLogExample[];
};

export type NaturalSpawnValidationArtifact = {
  schema: "natural-spawn-validation/v1";
  scenario_id: string;
  run_id: string;
  actor_id: string;
  credited_as_actor_progress: false;
  status: "passed" | "failed";
  world: {
    seed: string;
    dimension: string;
    server_version: string;
    level_type: string;
  };
  scan: NaturalSpawnValidationScan;
  selected_candidate?: NaturalSpawnValidationSelectedCandidate | null;
  rejected_candidates: NaturalSpawnValidationRejectedCandidate[];
  post_validation_commands: string[][];
  notes: string[];
};

export type NaturalSpawnValidationInput = {
  scenarioId?: string;
  runId: string;
  actorId: string;
  world?: NaturalSpawnValidationWorld;
  center: NaturalSpawnValidationPosition;
  blockLookup: NaturalSpawnBlockLookup;
  radius?: number;
  verticalRange?: {
    minY: number;
    maxY: number;
  };
  candidateLimit?: number;
  rejectedCandidateLimit?: number;
  candidatePositions?: NaturalSpawnValidationPosition[];
  logSearchPositions?: NaturalSpawnValidationPosition[];
  logSearchRadius?: number;
  maxNearestLogs?: number;
  leafLogDominanceRadius?: number;
  hazardScanRadius?: number;
  postValidationCommands?: string[][];
  notes?: string[];
};

export type NaturalSpawnCandidateEvaluation = {
  status: "accepted" | "rejected";
  selected?: NaturalSpawnValidationSelectedCandidate;
  rejected?: NaturalSpawnValidationRejectedCandidate;
};

type LoadedBlock = {
  name: string;
  position: NaturalSpawnValidationPosition;
};

type LookupSession = {
  blockAt(position: NaturalSpawnValidationPosition): Promise<LoadedBlock | null>;
  nullCount(): number;
};

type LocalSafetyCheck = {
  hazardNearby: boolean;
  caveDropNearby: boolean;
  leafLogDominated: boolean;
};

const DEFAULT_RADIUS = 24;
const DEFAULT_VERTICAL_BELOW = 6;
const DEFAULT_VERTICAL_ABOVE = 8;
const DEFAULT_CANDIDATE_LIMIT = 128;
const DEFAULT_REJECTED_CANDIDATE_LIMIT = 128;
const DEFAULT_LOG_EXAMPLE_LIMIT = 8;
const DEFAULT_LEAF_LOG_DOMINANCE_RADIUS = 2;
const DEFAULT_HAZARD_SCAN_RADIUS = 1;
const DEFAULT_SCENARIO_ID = "natural-safe-spawn-v1";

const AIR_LIKE_BLOCKS = new Set([
  "air",
  "cave_air",
  "void_air",
  "short_grass",
  "grass",
  "fern",
  "large_fern",
  "dead_bush",
  "snow"
]);

const SOLID_NATURAL_SUPPORTS = new Set([
  "grass_block",
  "dirt",
  "coarse_dirt",
  "rooted_dirt",
  "podzol",
  "mycelium",
  "moss_block",
  "mud",
  "clay",
  "sand",
  "red_sand",
  "gravel",
  "stone",
  "granite",
  "diorite",
  "andesite",
  "calcite",
  "tuff",
  "deepslate",
  "snow_block",
  "terracotta",
  "white_terracotta",
  "orange_terracotta",
  "magenta_terracotta",
  "light_blue_terracotta",
  "yellow_terracotta",
  "lime_terracotta",
  "pink_terracotta",
  "gray_terracotta",
  "light_gray_terracotta",
  "cyan_terracotta",
  "purple_terracotta",
  "blue_terracotta",
  "brown_terracotta",
  "green_terracotta",
  "red_terracotta",
  "black_terracotta"
]);

const HAZARD_BLOCKS = new Set([
  "water",
  "lava",
  "fire",
  "soul_fire",
  "cactus",
  "powder_snow",
  "magma_block",
  "sweet_berry_bush",
  "campfire",
  "soul_campfire"
]);

function normalizePosition(position: NaturalSpawnValidationPosition): NaturalSpawnValidationPosition {
  return {
    x: Math.floor(position.x),
    y: Math.floor(position.y),
    z: Math.floor(position.z)
  };
}

function positionKey(position: NaturalSpawnValidationPosition) {
  const normalized = normalizePosition(position);
  return `${normalized.x}:${normalized.y}:${normalized.z}`;
}

function normalizeBlockName(name: string) {
  const trimmed = name.trim();
  return trimmed.includes(":") ? trimmed : `minecraft:${trimmed}`;
}

function blockBaseName(name: string) {
  return normalizeBlockName(name).replace(/^minecraft:/, "");
}

function distance(left: NaturalSpawnValidationPosition, right: NaturalSpawnValidationPosition) {
  return Number(Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z).toFixed(2));
}

function isPassableBlock(name: string) {
  return AIR_LIKE_BLOCKS.has(blockBaseName(name));
}

function isLeafOrLog(name: string) {
  const baseName = blockBaseName(name);
  return baseName.endsWith("_log") ||
    baseName.endsWith("_wood") ||
    baseName.endsWith("_leaves") ||
    baseName === "mushroom_stem";
}

function isHazardBlock(name: string) {
  return HAZARD_BLOCKS.has(blockBaseName(name));
}

function isSolidNaturalSupport(name: string) {
  const baseName = blockBaseName(name);
  return SOLID_NATURAL_SUPPORTS.has(baseName) &&
    !isPassableBlock(name) &&
    !isLeafOrLog(name) &&
    !isHazardBlock(name);
}

function isLogBlock(name: string) {
  return blockBaseName(name).endsWith("_log");
}

function resolveVerticalRange(input: NaturalSpawnValidationInput) {
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

function resolveBlockLookup(blockLookup: NaturalSpawnBlockLookup) {
  if (typeof blockLookup === "function") {
    return blockLookup;
  }
  return (position: NaturalSpawnValidationPosition) => blockLookup.blockAt(position);
}

function createLookupSession(blockLookup: NaturalSpawnBlockLookup): LookupSession {
  const readBlock = resolveBlockLookup(blockLookup);
  const cache = new Map<string, LoadedBlock | null>();
  const nullOrUnloadedPositions = new Set<string>();

  return {
    async blockAt(position) {
      const normalizedPosition = normalizePosition(position);
      const key = positionKey(normalizedPosition);
      if (cache.has(key)) {
        return cache.get(key) ?? null;
      }

      const block = await readBlock(normalizedPosition);
      if (!block) {
        nullOrUnloadedPositions.add(key);
        cache.set(key, null);
        return null;
      }

      const loadedBlock = {
        name: normalizeBlockName(block.name),
        position: normalizePosition(block.position ?? normalizedPosition)
      };
      cache.set(key, loadedBlock);
      return loadedBlock;
    },
    nullCount() {
      return nullOrUnloadedPositions.size;
    }
  };
}

function generateCandidatePositions(input: {
  center: NaturalSpawnValidationPosition;
  radius: number;
  minY: number;
  maxY: number;
  limit: number;
}) {
  const center = normalizePosition(input.center);
  const positions: NaturalSpawnValidationPosition[] = [];

  for (let y = input.minY; y <= input.maxY; y += 1) {
    for (let x = center.x - input.radius; x <= center.x + input.radius; x += 1) {
      for (let z = center.z - input.radius; z <= center.z + input.radius; z += 1) {
        if (Math.hypot(x - center.x, z - center.z) <= input.radius) {
          positions.push({ x, y, z });
        }
      }
    }
  }

  return positions
    .sort((left, right) =>
      distance(center, left) - distance(center, right) ||
      Math.abs(left.y - center.y) - Math.abs(right.y - center.y) ||
      left.x - right.x ||
      left.z - right.z
    )
    .slice(0, input.limit);
}

function resolveCandidatePositions(input: NaturalSpawnValidationInput, minY: number, maxY: number) {
  const limit = Math.max(1, Math.floor(input.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT));
  if (input.candidatePositions && input.candidatePositions.length > 0) {
    return input.candidatePositions
      .map(normalizePosition)
      .slice(0, limit);
  }
  return generateCandidatePositions({
    center: input.center,
    radius: Math.max(0, Math.floor(input.radius ?? DEFAULT_RADIUS)),
    minY,
    maxY,
    limit
  });
}

function generateLogSearchPositions(input: {
  center: NaturalSpawnValidationPosition;
  radius: number;
  minY: number;
  maxY: number;
}) {
  const center = normalizePosition(input.center);
  const positions: NaturalSpawnValidationPosition[] = [];

  for (let x = center.x - input.radius; x <= center.x + input.radius; x += 1) {
    for (let z = center.z - input.radius; z <= center.z + input.radius; z += 1) {
      if (Math.hypot(x - center.x, z - center.z) > input.radius) {
        continue;
      }
      for (let y = input.minY; y <= input.maxY; y += 1) {
        positions.push({ x, y, z });
      }
    }
  }

  return positions.sort((left, right) => distance(center, left) - distance(center, right));
}

async function findNearestLoadedLogs(input: {
  session: LookupSession;
  candidate: NaturalSpawnValidationPosition;
  positions: NaturalSpawnValidationPosition[];
  limit: number;
}) {
  const seen = new Set<string>();
  const logs: NaturalSpawnValidationLogExample[] = [];

  for (const position of input.positions) {
    const normalized = normalizePosition(position);
    const key = positionKey(normalized);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const block = await input.session.blockAt(normalized);
    if (!block || !isLogBlock(block.name)) {
      continue;
    }

    logs.push({
      name: block.name,
      x: block.position.x,
      y: block.position.y,
      z: block.position.z,
      distance: distance(input.candidate, block.position)
    });
  }

  return logs
    .sort((left, right) => left.distance - right.distance || left.name.localeCompare(right.name))
    .slice(0, input.limit);
}

function localScanPositions(input: {
  center: NaturalSpawnValidationPosition;
  radius: number;
  yValues: number[];
}) {
  const center = normalizePosition(input.center);
  const positions: NaturalSpawnValidationPosition[] = [];
  for (let x = center.x - input.radius; x <= center.x + input.radius; x += 1) {
    for (let z = center.z - input.radius; z <= center.z + input.radius; z += 1) {
      if (Math.hypot(x - center.x, z - center.z) > input.radius) {
        continue;
      }
      for (const y of input.yValues) {
        positions.push({ x, y, z });
      }
    }
  }
  return positions;
}

async function checkLocalSafety(input: {
  session: LookupSession;
  candidate: NaturalSpawnValidationPosition;
  leafLogDominanceRadius: number;
  hazardScanRadius: number;
}): Promise<LocalSafetyCheck> {
  const loadedBlocks: LoadedBlock[] = [];
  let hazardNearby = false;
  let caveDropNearby = false;

  for (const position of localScanPositions({
    center: input.candidate,
    radius: input.leafLogDominanceRadius,
    yValues: [input.candidate.y - 1, input.candidate.y, input.candidate.y + 1]
  })) {
    const block = await input.session.blockAt(position);
    if (block) {
      loadedBlocks.push(block);
    }
  }

  for (const position of localScanPositions({
    center: input.candidate,
    radius: input.hazardScanRadius,
    yValues: [input.candidate.y - 1, input.candidate.y, input.candidate.y + 1]
  })) {
    const block = await input.session.blockAt(position);
    if (block && isHazardBlock(block.name)) {
      hazardNearby = true;
    }
  }

  for (const position of localScanPositions({
    center: input.candidate,
    radius: input.hazardScanRadius,
    yValues: [input.candidate.y - 1]
  })) {
    const isCenterSupport = position.x === input.candidate.x &&
      position.y === input.candidate.y - 1 &&
      position.z === input.candidate.z;
    if (isCenterSupport) {
      continue;
    }

    const block = await input.session.blockAt(position);
    if (block && (isPassableBlock(block.name) || isHazardBlock(block.name))) {
      caveDropNearby = true;
    }
  }

  const leafOrLogCount = loadedBlocks.filter((block) => isLeafOrLog(block.name)).length;
  const leafLogDominated = loadedBlocks.length >= 6 && leafOrLogCount / loadedBlocks.length >= 0.45;

  return {
    hazardNearby,
    caveDropNearby,
    leafLogDominated
  };
}

function toRejectedCandidate(input: {
  position: NaturalSpawnValidationPosition;
  reasons: NaturalSpawnValidationRejectionReason[];
  support?: LoadedBlock | null;
  feet?: LoadedBlock | null;
  head?: LoadedBlock | null;
  nearestLogs?: NaturalSpawnValidationLogExample[];
}): NaturalSpawnValidationRejectedCandidate {
  const [reason] = input.reasons;
  return {
    position: normalizePosition(input.position),
    reason: reason ?? "support_block_unloaded",
    reasons: input.reasons,
    support_block: input.support?.name,
    feet_block: input.feet?.name,
    head_block: input.head?.name,
    nearest_logs: input.nearestLogs
  };
}

async function evaluateCandidateWithSession(input: {
  session: LookupSession;
  candidate: NaturalSpawnValidationPosition;
  logSearchPositions: NaturalSpawnValidationPosition[];
  maxNearestLogs: number;
  leafLogDominanceRadius: number;
  hazardScanRadius: number;
}): Promise<NaturalSpawnCandidateEvaluation> {
  const candidate = normalizePosition(input.candidate);
  const supportPosition = { x: candidate.x, y: candidate.y - 1, z: candidate.z };
  const headPosition = { x: candidate.x, y: candidate.y + 1, z: candidate.z };
  const [support, feet, head] = await Promise.all([
    input.session.blockAt(supportPosition),
    input.session.blockAt(candidate),
    input.session.blockAt(headPosition)
  ]);
  const reasons: NaturalSpawnValidationRejectionReason[] = [];

  if (!support) {
    reasons.push("support_block_unloaded");
  }
  if (!feet) {
    reasons.push("feet_block_unloaded");
  }
  if (!head) {
    reasons.push("head_block_unloaded");
  }
  if (reasons.length > 0) {
    return {
      status: "rejected",
      rejected: toRejectedCandidate({ position: candidate, reasons, support, feet, head })
    };
  }

  if (support && isLeafOrLog(support.name)) {
    reasons.push("leaf_or_log_support");
  } else if (support && !isSolidNaturalSupport(support.name)) {
    reasons.push("support_not_solid_natural_ground");
  }
  if (feet && !isPassableBlock(feet.name)) {
    reasons.push("feet_not_passable");
  }
  if (head && !isPassableBlock(head.name)) {
    reasons.push("head_not_passable");
  }

  if (reasons.length > 0) {
    return {
      status: "rejected",
      rejected: toRejectedCandidate({ position: candidate, reasons, support, feet, head })
    };
  }

  const safety = await checkLocalSafety({
    session: input.session,
    candidate,
    leafLogDominanceRadius: input.leafLogDominanceRadius,
    hazardScanRadius: input.hazardScanRadius
  });
  if (safety.hazardNearby) {
    reasons.push("hazard_block_nearby");
  }
  if (safety.caveDropNearby) {
    reasons.push("cave_drop_nearby");
  }
  if (safety.leafLogDominated) {
    reasons.push("leaf_or_log_dominated");
  }

  const nearestLogs = await findNearestLoadedLogs({
    session: input.session,
    candidate,
    positions: input.logSearchPositions,
    limit: input.maxNearestLogs
  });
  if (nearestLogs.length === 0) {
    reasons.push("nearby_loaded_log_missing");
  }

  if (reasons.length > 0) {
    return {
      status: "rejected",
      rejected: toRejectedCandidate({ position: candidate, reasons, support, feet, head, nearestLogs })
    };
  }

  return {
    status: "accepted",
    selected: {
      position: candidate,
      support_block: support?.name ?? "minecraft:unknown",
      feet_block: feet?.name ?? "minecraft:unknown",
      head_block: head?.name ?? "minecraft:unknown",
      nearest_logs: nearestLogs,
      acceptance_reasons: [
        "feet_passable",
        "head_passable",
        "solid_natural_support",
        "nearby_loaded_log_observed",
        "not_leaf_or_log_dominated",
        "no_loaded_hazard_observed",
        "no_loaded_cave_drop_observed"
      ]
    }
  };
}

export async function evaluateNaturalSpawnCandidate(input: {
  blockLookup: NaturalSpawnBlockLookup;
  candidate: NaturalSpawnValidationPosition;
  logSearchPositions: NaturalSpawnValidationPosition[];
  maxNearestLogs?: number;
  leafLogDominanceRadius?: number;
  hazardScanRadius?: number;
}): Promise<NaturalSpawnCandidateEvaluation> {
  return evaluateCandidateWithSession({
    session: createLookupSession(input.blockLookup),
    candidate: input.candidate,
    logSearchPositions: input.logSearchPositions.map(normalizePosition),
    maxNearestLogs: Math.max(1, Math.floor(input.maxNearestLogs ?? DEFAULT_LOG_EXAMPLE_LIMIT)),
    leafLogDominanceRadius: Math.max(
      0,
      Math.floor(input.leafLogDominanceRadius ?? DEFAULT_LEAF_LOG_DOMINANCE_RADIUS)
    ),
    hazardScanRadius: Math.max(0, Math.floor(input.hazardScanRadius ?? DEFAULT_HAZARD_SCAN_RADIUS))
  });
}

/**
 * Builds setup evidence from Mineflayer-visible block data only. The selected
 * candidate is a spawn-safety result for runtime setup; it is not an actor goal,
 * build plan, or provider-facing strategy recommendation.
 */
export async function buildNaturalSpawnValidationArtifact(
  input: NaturalSpawnValidationInput
): Promise<NaturalSpawnValidationArtifact> {
  const center = normalizePosition(input.center);
  const radius = Math.max(0, Math.floor(input.radius ?? DEFAULT_RADIUS));
  const { minY, maxY } = resolveVerticalRange(input);
  const candidateLimit = Math.max(1, Math.floor(input.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT));
  const rejectedCandidateLimit = Math.max(
    0,
    Math.floor(input.rejectedCandidateLimit ?? DEFAULT_REJECTED_CANDIDATE_LIMIT)
  );
  const maxNearestLogs = Math.max(1, Math.floor(input.maxNearestLogs ?? DEFAULT_LOG_EXAMPLE_LIMIT));
  const session = createLookupSession(input.blockLookup);
  const candidatePositions = resolveCandidatePositions(input, minY, maxY);
  const logSearchPositions = input.logSearchPositions
    ? input.logSearchPositions.map(normalizePosition)
    : generateLogSearchPositions({
      center,
      radius: Math.max(0, Math.floor(input.logSearchRadius ?? radius)),
      minY,
      maxY
    });
  const rejectedCandidates: NaturalSpawnValidationRejectedCandidate[] = [];
  let selectedCandidate: NaturalSpawnValidationSelectedCandidate | null = null;

  for (const candidate of candidatePositions) {
    const evaluation = await evaluateCandidateWithSession({
      session,
      candidate,
      logSearchPositions,
      maxNearestLogs,
      leafLogDominanceRadius: Math.max(
        0,
        Math.floor(input.leafLogDominanceRadius ?? DEFAULT_LEAF_LOG_DOMINANCE_RADIUS)
      ),
      hazardScanRadius: Math.max(0, Math.floor(input.hazardScanRadius ?? DEFAULT_HAZARD_SCAN_RADIUS))
    });

    if (evaluation.status === "accepted" && evaluation.selected) {
      selectedCandidate = evaluation.selected;
      break;
    }
    if (evaluation.rejected && rejectedCandidates.length < rejectedCandidateLimit) {
      rejectedCandidates.push(evaluation.rejected);
    }
  }

  const notes = [
    "Validation is scoped to Mineflayer-visible loaded world state; unloaded chunks are not absence evidence.",
    "The validation artifact is setup evidence only and must not be credited as actor progress.",
    ...(input.notes ?? [])
  ];
  if (!selectedCandidate) {
    notes.push("No candidate satisfied safe natural spawn checks within the configured scan limits.");
  }
  if (rejectedCandidates.length < candidatePositions.length && rejectedCandidateLimit < candidatePositions.length) {
    notes.push("Rejected candidate records were truncated by rejectedCandidateLimit.");
  }

  return {
    schema: "natural-spawn-validation/v1",
    scenario_id: input.scenarioId ?? DEFAULT_SCENARIO_ID,
    run_id: input.runId,
    actor_id: input.actorId,
    credited_as_actor_progress: false,
    status: selectedCandidate ? "passed" : "failed",
    world: {
      seed: input.world?.seed ?? "unknown",
      dimension: input.world?.dimension ?? "overworld",
      server_version: input.world?.server_version ?? "unknown",
      level_type: input.world?.level_type ?? "default"
    },
    scan: {
      center,
      radius,
      vertical_range: {
        min_y: minY,
        max_y: maxY
      },
      loaded_world_only: true,
      null_or_unloaded_block_count: session.nullCount(),
      candidate_limit: candidateLimit
    },
    selected_candidate: selectedCandidate,
    rejected_candidates: rejectedCandidates,
    post_validation_commands: input.postValidationCommands ?? [],
    notes
  };
}
