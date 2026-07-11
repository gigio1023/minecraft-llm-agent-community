/** Regression coverage for world-state scan evidence and limitations. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  scanWorldState,
  type WorldStatePosition
} from "../src/tools/worldStateScan.js";

type TestBlock = {
  name: string;
  position: WorldStatePosition;
};

function key(position: WorldStatePosition) {
  const normalized = {
    x: Math.floor(position.x),
    y: Math.floor(position.y),
    z: Math.floor(position.z)
  };
  return `${normalized.x}:${normalized.y}:${normalized.z}`;
}

function distance(left: WorldStatePosition, right: WorldStatePosition) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function createScanBot(input: {
  center?: WorldStatePosition;
  blocks: TestBlock[];
  staleFindBlocks?: TestBlock[];
  unloaded?: (position: WorldStatePosition) => boolean;
}) {
  const center = input.center ?? { x: 0, y: 64, z: 0 };
  const blocks = new Map(input.blocks.map((block) => [key(block.position), block]));
  const findableBlocks = [...input.blocks, ...(input.staleFindBlocks ?? [])];
  const blockAtCalls: WorldStatePosition[] = [];

  return {
    blockAtCalls,
    bot: {
      entity: { position: center },
      findBlocks(options: {
        matching: (block: { name: string; position?: WorldStatePosition }) => boolean;
        maxDistance: number;
        count: number;
        useExtraInfo?: (block: {
          name: string;
          position?: WorldStatePosition;
        }) => boolean;
      }) {
        return findableBlocks
          .filter((block) => options.matching(block))
          .filter((block) => options.useExtraInfo?.(block) ?? true)
          .filter((block) => distance(center, block.position) <= options.maxDistance)
          .sort((left, right) => distance(center, left.position) - distance(center, right.position))
          .slice(0, options.count)
          .map((block) => block.position);
      },
      blockAt(position: WorldStatePosition) {
        const normalized = {
          x: Math.floor(position.x),
          y: Math.floor(position.y),
          z: Math.floor(position.z)
        };
        blockAtCalls.push(normalized);

        if (input.unloaded?.(normalized)) {
          return null;
        }

        return blocks.get(key(normalized)) ?? { name: "air", position: normalized };
      }
    }
  };
}

function countFor(scan: ReturnType<typeof scanWorldState>, blockName: string) {
  return scan.block_observations.by_name.find((entry) => entry.name === blockName)?.count ?? 0;
}

test("scanWorldState summarizes raw verified block names without resource categories", () => {
  const stalePosition = { x: 6, y: 64, z: 0 };
  const { bot, blockAtCalls } = createScanBot({
    blocks: [
      { name: "grass_block", position: { x: 1, y: 63, z: 0 } },
      { name: "crafting_table", position: { x: 2, y: 64, z: 2 } },
      { name: "oak_log", position: { x: 3, y: 64, z: 0 } }
    ],
    staleFindBlocks: [
      { name: "oak_log", position: stalePosition }
    ]
  });

  const scan = scanWorldState({
    bot,
    actorId: "npc_b",
    scanId: "scan-test",
    radius: 8,
    verticalRange: { minY: 60, maxY: 66 },
    coverageSampleStride: 8,
    createdAt: "2026-05-25T00:00:00.000Z",
    dimension: "overworld"
  });

  assert.equal(scan.schema, "world-state-scan/v1");
  assert.equal(scan.actor_id, "npc_b");
  assert.equal(scan.scan_id, "scan-test");
  assert.equal(scan.block_observations.total_verified, 3);
  assert.equal(countFor(scan, "oak_log"), 1);
  assert.equal(countFor(scan, "crafting_table"), 1);
  assert.equal("resource_groups" in scan, false);
  assert.equal("buildable_surface_candidates" in scan, false);
  assert.ok(blockAtCalls.some((position) => key(position) === key(stalePosition)));
  assert.ok(scan.limitations.some((limitation) => limitation.includes("currently loaded client cache")));
});

test("scanWorldState marks raw block observations truncated when the cap is reached", () => {
  const { bot } = createScanBot({
    blocks: [
      { name: "dirt", position: { x: 1, y: 64, z: 0 } },
      { name: "dirt", position: { x: 2, y: 64, z: 0 } },
      { name: "granite", position: { x: 3, y: 64, z: 0 } }
    ]
  });

  const scan = scanWorldState({
    bot,
    radius: 8,
    verticalRange: { minY: 60, maxY: 66 },
    caps: { blockObservations: 2 },
    createdAt: "2026-05-25T00:00:00.000Z",
    dimension: "overworld"
  });

  assert.equal(scan.block_observations.truncated, true);
  assert.equal(scan.block_observations.total_verified, 2);
  assert.ok(scan.limitations.some((limitation) => limitation.includes("into cap 2")));
});

test("scanWorldState retains a farther block type beside dense nearby ground", () => {
  const ground = Array.from({ length: 320 }, (_, index) => {
    const ring = 2 + Math.floor(index / 32);
    const angle = (index % 32) * (Math.PI * 2 / 32);
    return {
      name: index % 2 === 0 ? "grass_block" : "dirt",
      position: {
        x: Math.round(Math.cos(angle) * ring),
        y: 63 - (index % 2),
        z: Math.round(Math.sin(angle) * ring)
      }
    };
  });
  const { bot } = createScanBot({
    blocks: [
      ...ground,
      { name: "oak_log", position: { x: 22, y: 66, z: 4 } },
      { name: "oak_leaves", position: { x: 22, y: 69, z: 4 } }
    ]
  });

  const scan = scanWorldState({
    bot,
    radius: 32,
    verticalRange: { minY: 48, maxY: 80 },
    caps: { blockObservations: 32, nearestExamples: 8 },
    createdAt: "2026-05-25T00:00:00.000Z",
    dimension: "overworld"
  });

  assert.ok(countFor(scan, "oak_log") >= 1);
  assert.ok(countFor(scan, "oak_leaves") >= 1);
  assert.equal(
    scan.block_observations.sampling.method,
    "distance-direction-height-stratified/v1"
  );
  assert.equal(scan.block_observations.sampling.retained, 32);
  assert.ok(scan.block_observations.sampling.candidate_verified > 32);
  assert.ok(scan.block_observations.sampling.distance_bands_retained[2]! > 0);
});

test("scanWorldState records missing API limits without fabricated counts", () => {
  const scan = scanWorldState({
    bot: {
      entity: {
        position: { x: 0, y: 64, z: 0 }
      }
    },
    createdAt: "2026-05-25T00:00:00.000Z"
  });

  assert.equal(scan.block_observations.total_verified, 0);
  assert.equal(scan.loaded_coverage.method, "unavailable");
  assert.equal(scan.loaded_coverage.incomplete, true);
  assert.equal(scan.loaded_coverage.exhaustive, false);
  assert.equal(scan.loaded_coverage.absence_claims_exhaustive, false);
  assert.equal(scan.loaded_coverage.sample_had_unknown_columns, true);
  assert.ok(scan.limitations.some((limitation) => limitation.includes("findBlocks API missing")));
  assert.ok(scan.limitations.some((limitation) => limitation.includes("blockAt API is missing")));
});

test("scanWorldState reports sampled loaded coverage as non-exhaustive even when the sample is clean", () => {
  const { bot } = createScanBot({
    blocks: [
      { name: "grass_block", position: { x: 0, y: 63, z: 0 } }
    ]
  });

  const scan = scanWorldState({
    bot,
    radius: 8,
    verticalRange: { minY: 60, maxY: 66 },
    coverageSampleStride: 8,
    createdAt: "2026-05-25T00:00:00.000Z",
    dimension: "overworld"
  });

  assert.equal(scan.loaded_coverage.method, "blockAt-sampled-columns");
  assert.equal(scan.loaded_coverage.incomplete, true);
  assert.equal(scan.loaded_coverage.exhaustive, false);
  assert.equal(scan.loaded_coverage.sample_had_unknown_columns, false);
  assert.equal(scan.loaded_coverage.absence_claims_exhaustive, false);
  assert.ok(scan.limitations.some((limitation) => limitation.includes("sampled, not exhaustive")));
});

test("scanWorldState reports unknown sampled columns separately from global completeness", () => {
  const { bot } = createScanBot({
    blocks: [
      { name: "grass_block", position: { x: 0, y: 63, z: 0 } }
    ],
    unloaded: (position) => position.x === -8 && position.z === 0
  });

  const scan = scanWorldState({
    bot,
    radius: 8,
    verticalRange: { minY: 60, maxY: 66 },
    coverageSampleStride: 8,
    createdAt: "2026-05-25T00:00:00.000Z",
    dimension: "overworld"
  });

  assert.equal(scan.loaded_coverage.method, "blockAt-sampled-columns");
  assert.equal(scan.loaded_coverage.incomplete, true);
  assert.equal(scan.loaded_coverage.exhaustive, false);
  assert.equal(scan.loaded_coverage.sample_had_unknown_columns, true);
  assert.equal(scan.loaded_coverage.absence_claims_exhaustive, false);
  assert.ok(scan.loaded_coverage.unknown_columns > 0);
  assert.ok(scan.limitations.some((limitation) => limitation.includes("unknown columns")));
});
