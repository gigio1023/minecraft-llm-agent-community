import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPattern,
  starterShelterShellPositions,
  verifyShelterStructure
} from "../src/tools/buildPattern.js";
import type { Positioned } from "../src/tools/placeBlock.js";

function key(position: Positioned) {
  return `${position.x}:${position.y}:${position.z}`;
}

function createBuildBot(itemName = "dirt", itemCount = 64) {
  const blocks = new Map<string, { name: string; position: Positioned; boundingBox?: string }>();
  let equippedItem: { name: string; count: number } | undefined;
  const item = { name: itemName, count: itemCount };

  return {
    blocks,
    item,
    entity: {
      position: { x: 0, y: 64, z: 0 }
    },
    inventory: {
      items() {
        return item.count > 0 ? [item] : [];
      }
    },
    blockAt(position: Positioned) {
      const normalized = {
        x: Math.floor(position.x),
        y: Math.floor(position.y),
        z: Math.floor(position.z)
      };
      if (blocks.has(key(normalized))) {
        return blocks.get(key(normalized))!;
      }
      return normalized.y === 63
        ? { name: "grass_block", position: normalized, boundingBox: "block" }
        : { name: "air", position: normalized };
    },
    async equip(nextItem: { name: string; count: number }) {
      equippedItem = nextItem;
    },
    async placeBlock(referenceBlock: { position: Positioned }, faceVector: Positioned) {
      assert.ok(equippedItem, "buildPattern should equip before placement");
      const target = {
        x: referenceBlock.position.x + faceVector.x,
        y: referenceBlock.position.y + faceVector.y,
        z: referenceBlock.position.z + faceVector.z
      };
      blocks.set(key(target), {
        name: equippedItem.name,
        position: target,
        boundingBox: "block"
      });
      equippedItem.count -= 1;
    },
    async lookAt() {},
    setControlState() {}
  };
}

test("buildPattern builds and verifies a starter shelter shell from available material", async () => {
  const bot = createBuildBot("dirt", 64);
  const result = await buildPattern({
    bot,
    anchor: { x: 2, y: 64, z: 2 },
    preferredMaterials: ["dirt"]
  });

  assert.equal(result.status, "built");
  assert.equal(result.verification.status, "passed");
  assert.equal(result.verification.missingCells.length, 0);
  assert.equal(result.verification.interiorClear, true);
  assert.equal(result.verification.floorSupported, true);
  assert.ok(result.verification.placedShellBlocks >= 20);
  assert.ok(bot.item.count < 64);
});

test("verifyShelterStructure rejects a partial shelter without roof coverage", () => {
  const bot = createBuildBot("dirt", 64);
  const anchor = { x: 2, y: 64, z: 2 };
  const blueprint = starterShelterShellPositions(anchor);

  for (const position of blueprint.wallPositions) {
    bot.blocks.set(key(position), {
      name: "dirt",
      position,
      boundingBox: "block"
    });
  }

  const verification = verifyShelterStructure({
    bot,
    anchor,
    placementLedger: []
  });

  assert.equal(verification.status, "progressing");
  assert.equal(verification.roofCoverage, 0);
  assert.ok(verification.missingCells.length > 0);
});

test("verifyShelterStructure rejects a shelter with blocked doorway cells", () => {
  const bot = createBuildBot("dirt", 64);
  const anchor = { x: 2, y: 64, z: 2 };
  const blueprint = starterShelterShellPositions(anchor);

  for (const position of blueprint.shellPositions) {
    bot.blocks.set(key(position), {
      name: "dirt",
      position,
      boundingBox: "block"
    });
  }
  bot.blocks.set(key({ x: anchor.x + 1, y: anchor.y, z: anchor.z }), {
    name: "dirt",
    position: { x: anchor.x + 1, y: anchor.y, z: anchor.z },
    boundingBox: "block"
  });

  const verification = verifyShelterStructure({
    bot,
    anchor,
    placementLedger: blueprint.shellPositions.map((position) => ({
      status: "placed",
      itemName: "dirt",
      targetPosition: position,
      expectedBlockNames: ["dirt"],
      reason: "test placement"
    }))
  });

  assert.equal(verification.status, "progressing");
  assert.equal(verification.wallCoverage, 1);
  assert.equal(verification.roofCoverage, 1);
  assert.equal(verification.interiorClear, false);
});

test("buildPattern blocks truthfully when no solid build material is available", async () => {
  const result = await buildPattern({
    bot: createBuildBot("dirt", 0),
    anchor: { x: 2, y: 64, z: 2 }
  });

  assert.equal(result.status, "blocked");
  assert.match(result.reason, /no solid build material/);
});
