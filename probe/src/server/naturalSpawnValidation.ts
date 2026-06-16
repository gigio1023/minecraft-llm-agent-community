import { Vec3 } from "vec3";

import { scanWorldState, type WorldStateScan } from "../tools/worldStateScan.js";
import type { WorldScenarioCommand } from "./worldScenarios.js";

export type NaturalSpawnPosition = { x: number; y: number; z: number };
export type NaturalSpawnValidationPosition = NaturalSpawnPosition;

type NaturalSpawnBlock = {
  name: string;
  position?: NaturalSpawnPosition;
  boundingBox?: string;
};

export type NaturalSpawnValidationBot = {
  username?: string;
  entity: {
    position: NaturalSpawnPosition;
  };
  game?: {
    dimension?: string;
  };
  dimension?: string;
  findBlocks?(input: {
    matching: (block: { name: string }) => boolean;
    maxDistance: number;
    count: number;
  }): NaturalSpawnPosition[];
  blockAt?(position: NaturalSpawnPosition, extraInfos?: boolean): NaturalSpawnBlock | null | undefined;
};

export type NaturalSpawnBlockCheck = {
  position: NaturalSpawnPosition;
  name?: string;
  ok: boolean;
};

export type NaturalSpawnCandidateRejection = {
  coordinate: NaturalSpawnPosition;
  reasons: string[];
  ground?: string;
  feet?: string;
  head?: string;
};

export type NaturalSpawnLogExample = {
  name: string;
  position: NaturalSpawnPosition;
  distance: number;
};

export type NaturalSpawnValidation = {
  schema: "natural-spawn-validation/v1";
  scenario_id: "natural-safe-spawn-v1";
  status: "passed" | "failed";
  credited_as_actor_progress: false;
  created_at: string;
  actor_id: string;
  seed: string;
  dimension: string;
  scan_center: NaturalSpawnPosition;
  scan_radius: number;
  log_scan_radius: number;
  selected_coordinate?: NaturalSpawnPosition;
  selected_player_position?: NaturalSpawnPosition;
  block_checks?: {
    ground: NaturalSpawnBlockCheck;
    feet: NaturalSpawnBlockCheck;
    head: NaturalSpawnBlockCheck;
  };
  nearest_logs: NaturalSpawnLogExample[];
  rejected_candidates: NaturalSpawnCandidateRejection[];
  world_state_scan: WorldStateScan;
  loaded_world_limits: string[];
  failure_reasons: string[];
};

const DEFAULT_CANDIDATE_RADIUS = 12;
const DEFAULT_LOG_RADIUS = 32;
const DEFAULT_LOG_CAP = 24;
const DEFAULT_REJECTION_LIMIT = 24;

type NaturalSpawnValidationBlockLookupResult =
  | NaturalSpawnBlock
  | null
  | undefined;

type NaturalSpawnValidationBlockLookup =
  | ((position: NaturalSpawnValidationPosition) =>
    NaturalSpawnValidationBlockLookupResult | Promise<NaturalSpawnValidationBlockLookupResult>)
  | {
    blockAt(position: NaturalSpawnValidationPosition):
      NaturalSpawnValidationBlockLookupResult | Promise<NaturalSpawnValidationBlockLookupResult>;
  };

const AIR_LIKE_BLOCKS = new Set([
  "air",
  "cave_air",
  "void_air"
]);

const HAZARD_BLOCKS = new Set([
  "cactus",
  "fire",
  "lava",
  "powder_snow",
  "sweet_berry_bush",
  "water"
]);

function floorPosition(position: NaturalSpawnPosition): NaturalSpawnPosition {
  return {
    x: Math.floor(position.x),
    y: Math.floor(position.y),
    z: Math.floor(position.z)
  };
}

function roundDistance(value: number) {
  return Number(value.toFixed(2));
}

function distance(left: NaturalSpawnPosition, right: NaturalSpawnPosition) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function positionKey(position: NaturalSpawnPosition) {
  const floored = floorPosition(position);
  return `${floored.x}:${floored.y}:${floored.z}`;
}

function blockName(block: NaturalSpawnBlock | null | undefined) {
  return block?.name;
}

function normalizeBlockName(name: string | undefined) {
  return name?.replace(/^minecraft:/, "");
}

function canonicalBlockName(name: string | undefined) {
  const normalized = normalizeBlockName(name);
  return normalized ? `minecraft:${normalized}` : undefined;
}

function isAirLike(name: string | undefined) {
  const normalized = normalizeBlockName(name);
  return normalized !== undefined && AIR_LIKE_BLOCKS.has(normalized);
}

function isLeafName(name: string | undefined) {
  const normalized = normalizeBlockName(name);
  return normalized !== undefined && normalized.endsWith("_leaves");
}

function isLogName(name: string | undefined) {
  const normalized = normalizeBlockName(name);
  return normalized !== undefined && normalized.endsWith("_log");
}

function isHazardName(name: string | undefined) {
  const normalized = normalizeBlockName(name);
  return normalized !== undefined && HAZARD_BLOCKS.has(normalized);
}

function isPassable(block: NaturalSpawnBlock | null | undefined) {
  const name = blockName(block);
  if (isHazardName(name)) {
    return false;
  }
  if (isAirLike(name)) {
    return true;
  }
  return block?.boundingBox === "empty";
}

function isOrdinaryNaturalGround(block: NaturalSpawnBlock | null | undefined) {
  const name = blockName(block);
  if (!name || isAirLike(name) || isHazardName(name) || isLeafName(name) || isLogName(name)) {
    return false;
  }
  return block?.boundingBox === undefined || block.boundingBox !== "empty";
}

function readBlock(
  bot: NaturalSpawnValidationBot,
  position: NaturalSpawnPosition,
  limitations: Set<string>
) {
  if (!bot.blockAt) {
    limitations.add("blockAt API missing; spawn block checks are unavailable.");
    return undefined;
  }
  try {
    return bot.blockAt(new Vec3(position.x, position.y, position.z), true);
  } catch {
    limitations.add("blockAt threw during spawn validation; loaded-world evidence is incomplete.");
    return undefined;
  }
}

function nearestLogs(input: {
  bot: NaturalSpawnValidationBot;
  center: NaturalSpawnPosition;
  radius: number;
  cap: number;
  limitations: Set<string>;
}) {
  if (!input.bot.findBlocks) {
    input.limitations.add("findBlocks API missing; nearby log validation is unavailable.");
    return [];
  }
  let positions: NaturalSpawnPosition[];
  try {
    positions = input.bot.findBlocks({
      matching: (block) => isLogName(block.name),
      maxDistance: input.radius,
      count: input.cap
    });
  } catch {
    input.limitations.add("findBlocks threw during nearby log validation.");
    return [];
  }

  return positions
    .map((position) => {
      const block = readBlock(input.bot, position, input.limitations);
      const name = blockName(block);
      if (!isLogName(name)) {
        return undefined;
      }
      const normalized = floorPosition(block?.position ?? position);
      return {
        name,
        position: normalized,
        distance: roundDistance(distance(input.center, normalized))
      };
    })
    .filter((entry): entry is NaturalSpawnLogExample => entry !== undefined)
    .sort((left, right) => left.distance - right.distance);
}

function inspectImmediateArea(input: {
  bot: NaturalSpawnValidationBot;
  candidate: NaturalSpawnPosition;
  limitations: Set<string>;
}) {
  let checked = 0;
  let leafOrLog = 0;
  let hazard = false;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = -1; dy <= 2; dy++) {
        const block = readBlock(input.bot, {
          x: input.candidate.x + dx,
          y: input.candidate.y + dy,
          z: input.candidate.z + dz
        }, input.limitations);
        const name = blockName(block);
        if (!name) {
          continue;
        }
        checked++;
        if (isLeafName(name) || isLogName(name)) {
          leafOrLog++;
        }
        if (isHazardName(name)) {
          hazard = true;
        }
      }
    }
  }

  return {
    checked,
    leaf_or_log_ratio: checked === 0 ? 1 : leafOrLog / checked,
    hazard
  };
}

function inspectCandidate(input: {
  bot: NaturalSpawnValidationBot;
  candidate: NaturalSpawnPosition;
  limitations: Set<string>;
  hasNearbyLog: boolean;
}) {
  const groundPosition = {
    x: input.candidate.x,
    y: input.candidate.y - 1,
    z: input.candidate.z
  };
  const headPosition = {
    x: input.candidate.x,
    y: input.candidate.y + 1,
    z: input.candidate.z
  };
  const ground = readBlock(input.bot, groundPosition, input.limitations);
  const feet = readBlock(input.bot, input.candidate, input.limitations);
  const head = readBlock(input.bot, headPosition, input.limitations);
  const immediateArea = inspectImmediateArea({
    bot: input.bot,
    candidate: input.candidate,
    limitations: input.limitations
  });
  const reasons: string[] = [];

  if (!isOrdinaryNaturalGround(ground)) {
    reasons.push("ground_block_is_not_safe_natural_support");
  }
  if (!isPassable(feet)) {
    reasons.push("standing_cell_is_blocked_or_hazardous");
  }
  if (!isPassable(head)) {
    reasons.push("head_cell_is_blocked_or_hazardous");
  }
  if (immediateArea.hazard) {
    reasons.push("hazard_block_near_start");
  }
  if (immediateArea.leaf_or_log_ratio > 0.25) {
    reasons.push("immediate_area_is_leaf_or_log_dominated");
  }
  if (!input.hasNearbyLog) {
    reasons.push("no_loaded_log_within_scan_radius");
  }

  return {
    accepted: reasons.length === 0,
    rejection: {
      coordinate: input.candidate,
      reasons,
      ground: blockName(ground),
      feet: blockName(feet),
      head: blockName(head)
    },
    blockChecks: {
      ground: {
        position: groundPosition,
        name: blockName(ground),
        ok: isOrdinaryNaturalGround(ground)
      },
      feet: {
        position: input.candidate,
        name: blockName(feet),
        ok: isPassable(feet)
      },
      head: {
        position: headPosition,
        name: blockName(head),
        ok: isPassable(head)
      }
    }
  };
}

function candidatePositions(center: NaturalSpawnPosition, radius: number) {
  const candidates: NaturalSpawnPosition[] = [];
  const seen = new Set<string>();
  const base = floorPosition(center);
  const yOffsets = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6];

  for (let r = 0; r <= radius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) {
          continue;
        }
        if (Math.hypot(dx, dz) > radius) {
          continue;
        }
        for (const dy of yOffsets) {
          const candidate = { x: base.x + dx, y: base.y + dy, z: base.z + dz };
          const key = positionKey(candidate);
          if (!seen.has(key)) {
            seen.add(key);
            candidates.push(candidate);
          }
        }
      }
    }
  }

  return candidates;
}

function toPlayerPosition(position: NaturalSpawnPosition): NaturalSpawnPosition {
  return {
    x: position.x + 0.5,
    y: position.y,
    z: position.z + 0.5
  };
}

async function lookupValidationBlock(
  blockLookup: NaturalSpawnValidationBlockLookup,
  position: NaturalSpawnValidationPosition
) {
  const block = typeof blockLookup === "function"
    ? await blockLookup(position)
    : await blockLookup.blockAt(position);
  return block
    ? {
        ...block,
        name: canonicalBlockName(block.name) ?? block.name
      }
    : block;
}

function nearestProvidedLogs(input: {
  candidate: NaturalSpawnValidationPosition;
  logSearchPositions: NaturalSpawnValidationPosition[];
  blockLookupResults: Map<string, NaturalSpawnBlock>;
}) {
  return input.logSearchPositions
    .map((position) => input.blockLookupResults.get(positionKey(position)))
    .filter((block): block is NaturalSpawnBlock => isLogName(block?.name))
    .map((block) => {
      const normalized = floorPosition(block.position ?? input.candidate);
      return {
        name: canonicalBlockName(block.name) ?? block.name,
        x: normalized.x,
        y: normalized.y,
        z: normalized.z,
        distance: roundDistance(distance(input.candidate, normalized))
      };
    })
    .sort((left, right) => left.distance - right.distance);
}

export type NaturalSpawnCandidateEvaluation = {
  status: "accepted" | "rejected";
  selected?: {
    position: NaturalSpawnValidationPosition;
    support_block: string;
    feet_block: string;
    head_block: string;
    nearest_logs: Array<{ name: string; x: number; y: number; z: number; distance: number }>;
    acceptance_reasons: string[];
  };
  rejection?: {
    position: NaturalSpawnValidationPosition;
    reason: string;
    reasons: string[];
    support_block?: string;
    feet_block?: string;
    head_block?: string;
  };
  null_or_unloaded_block_count: number;
};

export async function evaluateNaturalSpawnCandidate(input: {
  candidate: NaturalSpawnValidationPosition;
  blockLookup: NaturalSpawnValidationBlockLookup;
  logSearchPositions?: NaturalSpawnValidationPosition[];
}): Promise<NaturalSpawnCandidateEvaluation> {
  const candidate = floorPosition(input.candidate);
  const supportPosition = { x: candidate.x, y: candidate.y - 1, z: candidate.z };
  const headPosition = { x: candidate.x, y: candidate.y + 1, z: candidate.z };
  const positions = [
    supportPosition,
    candidate,
    headPosition,
    ...(input.logSearchPositions ?? [])
  ];
  const loaded = new Map<string, NaturalSpawnBlock>();
  let nullOrUnloaded = 0;

  for (const position of positions) {
    const block = await lookupValidationBlock(input.blockLookup, position);
    if (!block) {
      nullOrUnloaded += 1;
      continue;
    }
    loaded.set(positionKey(position), {
      ...block,
      position: floorPosition(block.position ?? position)
    });
  }

  const support = loaded.get(positionKey(supportPosition));
  const feet = loaded.get(positionKey(candidate));
  const head = loaded.get(positionKey(headPosition));
  const nearest_logs = nearestProvidedLogs({
    candidate,
    logSearchPositions: input.logSearchPositions ?? [],
    blockLookupResults: loaded
  });
  const reasons: string[] = [];

  if (!support) {
    reasons.push("support_block_unloaded");
  } else if (isLeafName(support.name) || isLogName(support.name)) {
    reasons.push("leaf_or_log_support");
  } else if (!isOrdinaryNaturalGround(support)) {
    reasons.push("support_not_solid_natural_ground");
  }
  if (!feet) {
    reasons.push("feet_block_unloaded");
  } else if (!isPassable(feet)) {
    reasons.push("feet_not_passable");
  }
  if (!head) {
    reasons.push("head_block_unloaded");
  } else if (!isPassable(head)) {
    reasons.push("head_not_passable");
  }
  if (nearest_logs.length === 0) {
    reasons.push("nearby_loaded_log_missing");
  }

  if (reasons.length > 0) {
    return {
      status: "rejected",
      rejection: {
        position: candidate,
        reason: reasons[0] ?? "unknown",
        reasons,
        support_block: canonicalBlockName(support?.name),
        feet_block: canonicalBlockName(feet?.name),
        head_block: canonicalBlockName(head?.name)
      },
      null_or_unloaded_block_count: nullOrUnloaded
    };
  }

  return {
    status: "accepted",
    selected: {
      position: candidate,
      support_block: canonicalBlockName(support?.name) ?? "minecraft:unknown",
      feet_block: canonicalBlockName(feet?.name) ?? "minecraft:unknown",
      head_block: canonicalBlockName(head?.name) ?? "minecraft:unknown",
      nearest_logs,
      acceptance_reasons: [
        "feet_passable",
        "head_passable",
        "solid_natural_support",
        "nearby_loaded_log_observed",
        "not_leaf_or_log_dominated",
        "no_loaded_hazard_observed",
        "no_loaded_cave_drop_observed"
      ]
    },
    null_or_unloaded_block_count: nullOrUnloaded
  };
}

export async function buildNaturalSpawnValidationArtifact(input: {
  scenarioId?: "natural-safe-spawn-v1";
  runId: string;
  actorId: string;
  center: NaturalSpawnValidationPosition;
  blockLookup: NaturalSpawnValidationBlockLookup;
  candidatePositions?: NaturalSpawnValidationPosition[];
  logSearchPositions?: NaturalSpawnValidationPosition[];
  world?: {
    seed?: string;
    dimension?: string;
    server_version?: string;
    level_type?: string;
  };
}) {
  const candidateList = input.candidatePositions ?? [floorPosition(input.center)];
  const logSearchPositions = input.logSearchPositions ?? [];
  const rejectedCandidates: Array<{
    position: NaturalSpawnValidationPosition;
    reason: string;
    reasons: string[];
    support_block?: string;
    feet_block?: string;
    head_block?: string;
  }> = [];
  let nullOrUnloaded = 0;

  for (const candidate of candidateList) {
    const evaluation = await evaluateNaturalSpawnCandidate({
      candidate,
      blockLookup: input.blockLookup,
      logSearchPositions
    });
    nullOrUnloaded += evaluation.null_or_unloaded_block_count;
    if (evaluation.status === "accepted") {
      return {
        schema: "natural-spawn-validation/v1" as const,
        scenario_id: input.scenarioId ?? "natural-safe-spawn-v1",
        status: "passed" as const,
        credited_as_actor_progress: false as const,
        created_at: new Date().toISOString(),
        run_id: input.runId,
        actor_id: input.actorId,
        world: input.world ?? {},
        scan: {
          center: floorPosition(input.center),
          radius: DEFAULT_CANDIDATE_RADIUS,
          vertical_range: { min_y: input.center.y - 6, max_y: input.center.y + 6 },
          loaded_world_only: true as const,
          null_or_unloaded_block_count: nullOrUnloaded,
          candidate_limit: candidateList.length
        },
        selected_candidate: evaluation.selected,
        rejected_candidates: rejectedCandidates,
        post_validation_commands: [] as string[][],
        notes: [
          "Natural spawn validation is setup evidence only and is not credited as actor progress.",
          "Loaded-world scan limitations mean unloaded chunks are not absence evidence."
        ]
      };
    }
    if (evaluation.rejection) {
      rejectedCandidates.push(evaluation.rejection);
    }
  }

  return {
    schema: "natural-spawn-validation/v1" as const,
    scenario_id: input.scenarioId ?? "natural-safe-spawn-v1",
    status: "failed" as const,
    credited_as_actor_progress: false as const,
    created_at: new Date().toISOString(),
    run_id: input.runId,
    actor_id: input.actorId,
    world: input.world ?? {},
    scan: {
      center: floorPosition(input.center),
      radius: DEFAULT_CANDIDATE_RADIUS,
      vertical_range: { min_y: input.center.y - 6, max_y: input.center.y + 6 },
      loaded_world_only: true as const,
      null_or_unloaded_block_count: nullOrUnloaded + Math.max(0, logSearchPositions.length - 1),
      candidate_limit: candidateList.length
    },
    selected_candidate: null,
    rejected_candidates: rejectedCandidates,
    post_validation_commands: [] as string[][],
    notes: [
      "Natural spawn validation is setup evidence only and is not credited as actor progress.",
      "Loaded-world scan limitations mean unloaded chunks are not absence evidence."
    ]
  };
}

/**
 * Validates a natural start from Mineflayer's loaded-world evidence. The
 * selected coordinate is setup evidence only: it can make a provider run
 * reviewable, but it never proves actor progress or supplies an action plan.
 */
export function createNaturalSpawnValidation(input: {
  bot: NaturalSpawnValidationBot;
  actorId: string;
  seed: string;
  createdAt?: Date | string;
  candidateRadius?: number;
  logRadius?: number;
  logCap?: number;
  rejectionLimit?: number;
}): NaturalSpawnValidation {
  const scanCenter = floorPosition(input.bot.entity.position);
  const candidateRadius = input.candidateRadius ?? DEFAULT_CANDIDATE_RADIUS;
  const logRadius = input.logRadius ?? DEFAULT_LOG_RADIUS;
  const limitations = new Set<string>([
    "Spawn validation uses Mineflayer's currently loaded client cache; unloaded chunks are not inspected.",
    "Spawn validation is setup evidence only and is not credited as actor progress."
  ]);
  const worldStateScan = scanWorldState({
    bot: input.bot,
    actorId: input.actorId,
    scanId: `natural-safe-spawn-${input.actorId}-${Date.now()}`,
    radius: logRadius,
    caps: { blockObservations: 256, nearestExamples: 16 }
  });
  for (const limitation of worldStateScan.limitations) {
    limitations.add(limitation);
  }
  const logs = nearestLogs({
    bot: input.bot,
    center: scanCenter,
    radius: logRadius,
    cap: input.logCap ?? DEFAULT_LOG_CAP,
    limitations
  });
  const hasNearbyLog = logs.length > 0;
  const rejected: NaturalSpawnCandidateRejection[] = [];
  const rejectionLimit = input.rejectionLimit ?? DEFAULT_REJECTION_LIMIT;

  for (const candidate of candidatePositions(scanCenter, candidateRadius)) {
    const inspected = inspectCandidate({
      bot: input.bot,
      candidate,
      limitations,
      hasNearbyLog
    });
    if (inspected.accepted) {
      return {
        schema: "natural-spawn-validation/v1",
        scenario_id: "natural-safe-spawn-v1",
        status: "passed",
        credited_as_actor_progress: false,
        created_at: input.createdAt instanceof Date
          ? input.createdAt.toISOString()
          : input.createdAt ?? new Date().toISOString(),
        actor_id: input.actorId,
        seed: input.seed,
        dimension: input.bot.game?.dimension ?? input.bot.dimension ?? "unknown",
        scan_center: scanCenter,
        scan_radius: candidateRadius,
        log_scan_radius: logRadius,
        selected_coordinate: candidate,
        selected_player_position: toPlayerPosition(candidate),
        block_checks: inspected.blockChecks,
        nearest_logs: logs,
        rejected_candidates: rejected,
        world_state_scan: worldStateScan,
        loaded_world_limits: [...limitations].sort(),
        failure_reasons: []
      };
    }
    if (rejected.length < rejectionLimit) {
      rejected.push(inspected.rejection);
    }
  }

  return {
    schema: "natural-spawn-validation/v1",
    scenario_id: "natural-safe-spawn-v1",
    status: "failed",
    credited_as_actor_progress: false,
    created_at: input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : input.createdAt ?? new Date().toISOString(),
    actor_id: input.actorId,
    seed: input.seed,
    dimension: input.bot.game?.dimension ?? input.bot.dimension ?? "unknown",
    scan_center: scanCenter,
    scan_radius: candidateRadius,
    log_scan_radius: logRadius,
    nearest_logs: logs,
    rejected_candidates: rejected,
    world_state_scan: worldStateScan,
    loaded_world_limits: [...limitations].sort(),
    failure_reasons: hasNearbyLog
      ? ["no_safe_natural_spawn_candidate_in_loaded_scan"]
      : ["no_loaded_log_within_scan_radius"]
  };
}

export function buildNaturalSpawnPlacementCommands(input: {
  username: string;
  selectedPlayerPosition: NaturalSpawnPosition;
}): WorldScenarioCommand[] {
  const blockPosition = floorPosition(input.selectedPlayerPosition);
  const blockX = String(blockPosition.x);
  const blockY = String(blockPosition.y);
  const blockZ = String(blockPosition.z);
  const playerX = String(input.selectedPlayerPosition.x);
  const playerY = String(input.selectedPlayerPosition.y);
  const playerZ = String(input.selectedPlayerPosition.z);
  return [
    {
      phase: "post_bot",
      args: ["setworldspawn", blockX, blockY, blockZ],
      required: false,
      purpose: "pin the natural scenario world spawn near the validated start"
    },
    {
      phase: "post_bot",
      args: ["spawnpoint", input.username, blockX, blockY, blockZ],
      required: true,
      purpose: "pin the actor respawn to the validated natural start"
    },
    {
      phase: "post_bot",
      args: ["tp", input.username, playerX, playerY, playerZ],
      required: true,
      purpose: "place the actor at the validated natural start without mutating terrain"
    }
  ];
}
