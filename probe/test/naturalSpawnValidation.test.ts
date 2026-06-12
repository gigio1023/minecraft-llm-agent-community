import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNaturalSpawnValidationArtifact,
  evaluateNaturalSpawnCandidate,
  type NaturalSpawnValidationPosition
} from "../src/server/naturalSpawnValidation.js";

type FakeBlockLookup = (position: NaturalSpawnValidationPosition) => {
  name: string;
  position: NaturalSpawnValidationPosition;
} | undefined;

function key(position: NaturalSpawnValidationPosition) {
  return `${position.x}:${position.y}:${position.z}`;
}

function blockMap(
  entries: Array<[NaturalSpawnValidationPosition, string]>
): FakeBlockLookup {
  const blocks = new Map(
    entries.map(([position, name]) => [
      key(position),
      {
        name,
        position
      }
    ])
  );

  return (position) => blocks.get(key(position));
}

test("builds passed natural spawn validation artifact from loaded-world block data", async () => {
  const center = { x: 0, y: 64, z: 0 };
  const artifact = await buildNaturalSpawnValidationArtifact({
    runId: "run-natural",
    actorId: "npc_01",
    center,
    blockLookup: blockMap([
      [{ x: 0, y: 63, z: 0 }, "minecraft:grass_block"],
      [{ x: 0, y: 64, z: 0 }, "minecraft:air"],
      [{ x: 0, y: 65, z: 0 }, "minecraft:air"],
      [{ x: 4, y: 64, z: 0 }, "minecraft:oak_log"]
    ]),
    candidatePositions: [center],
    logSearchPositions: [{ x: 4, y: 64, z: 0 }],
    world: {
      seed: "seed-a",
      dimension: "overworld",
      server_version: "1.21.11",
      level_type: "default"
    }
  });

  assert.equal(artifact.schema, "natural-spawn-validation/v1");
  assert.equal(artifact.scenario_id, "natural-safe-spawn-v1");
  assert.equal(artifact.status, "passed");
  assert.equal(artifact.credited_as_actor_progress, false);
  assert.equal(artifact.scan.loaded_world_only, true);
  assert.deepEqual(artifact.selected_candidate?.position, center);
  assert.equal(artifact.selected_candidate?.support_block, "minecraft:grass_block");
  assert.equal(artifact.selected_candidate?.feet_block, "minecraft:air");
  assert.equal(artifact.selected_candidate?.head_block, "minecraft:air");
  assert.equal(artifact.selected_candidate?.nearest_logs[0]?.name, "minecraft:oak_log");
  assert.ok(
    artifact.selected_candidate?.acceptance_reasons.includes("nearby_loaded_log_observed")
  );
  assert.deepEqual(artifact.post_validation_commands, []);
});

test("rejects candidates standing on leaves or logs", async () => {
  const center = { x: 0, y: 64, z: 0 };
  const artifact = await buildNaturalSpawnValidationArtifact({
    runId: "run-log-support",
    actorId: "npc_01",
    center,
    blockLookup: blockMap([
      [{ x: 0, y: 63, z: 0 }, "minecraft:oak_log"],
      [{ x: 0, y: 64, z: 0 }, "minecraft:air"],
      [{ x: 0, y: 65, z: 0 }, "minecraft:air"]
    ]),
    candidatePositions: [center],
    logSearchPositions: [{ x: 0, y: 63, z: 0 }]
  });

  assert.equal(artifact.status, "failed");
  assert.equal(artifact.selected_candidate, null);
  assert.equal(artifact.rejected_candidates[0]?.reason, "leaf_or_log_support");
  assert.deepEqual(artifact.rejected_candidates[0]?.reasons, ["leaf_or_log_support"]);
  assert.equal(artifact.rejected_candidates[0]?.support_block, "minecraft:oak_log");
});

test("missing nearby loaded log fails without claiming unloaded chunks were searched", async () => {
  const center = { x: 0, y: 64, z: 0 };
  const artifact = await buildNaturalSpawnValidationArtifact({
    runId: "run-no-log",
    actorId: "npc_01",
    center,
    blockLookup: blockMap([
      [{ x: 0, y: 63, z: 0 }, "minecraft:grass_block"],
      [{ x: 0, y: 64, z: 0 }, "minecraft:air"],
      [{ x: 0, y: 65, z: 0 }, "minecraft:air"]
    ]),
    candidatePositions: [center],
    logSearchPositions: [{ x: 8, y: 64, z: 0 }]
  });

  assert.equal(artifact.status, "failed");
  assert.equal(artifact.scan.loaded_world_only, true);
  assert.ok(artifact.scan.null_or_unloaded_block_count > 0);
  assert.equal(artifact.rejected_candidates[0]?.reason, "nearby_loaded_log_missing");
  assert.match(artifact.notes.join("\n"), /unloaded chunks are not absence evidence/);
});

test("candidate evaluation accepts Mineflayer-like async blockAt adapters", async () => {
  const center = { x: 2, y: 70, z: -3 };
  const lookup = blockMap([
    [{ x: 2, y: 69, z: -3 }, "grass_block"],
    [{ x: 2, y: 70, z: -3 }, "air"],
    [{ x: 2, y: 71, z: -3 }, "air"],
    [{ x: 5, y: 70, z: -3 }, "oak_log"]
  ]);

  const evaluation = await evaluateNaturalSpawnCandidate({
    candidate: center,
    blockLookup: {
      async blockAt(position) {
        return lookup(position);
      }
    },
    logSearchPositions: [{ x: 5, y: 70, z: -3 }]
  });

  assert.equal(evaluation.status, "accepted");
  assert.equal(evaluation.selected?.support_block, "minecraft:grass_block");
  assert.equal(evaluation.selected?.nearest_logs[0]?.distance, 3);
});
