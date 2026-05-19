import assert from "node:assert/strict";
import test from "node:test";

import { createMineflayerSharedChestAccessor } from "../src/tools/liveSharedChest.js";
import { observe } from "../src/tools/observe.js";
import { createDialogueState } from "../src/runtime/dialogueState.js";
import { createMemory } from "../src/runtime/memory.js";

function createPosition(x: number, y = 0, z = 0) {
  return {
    x,
    y,
    z,
    distanceTo(other: { x: number; y: number; z: number }) {
      return Math.hypot(this.x - other.x, this.y - other.y, this.z - other.z);
    }
  };
}

test("observe includes nearby shared chest contents through the live chest accessor", async () => {
  const chestSlots = new Map<string, number>([["oak_log", 3]]);
  const actor = {
    username: "npc_a",
    entity: {
      position: createPosition(0)
    },
    inventory: {
      items() {
        return [{ name: "oak_log", count: 2, type: 17, metadata: 0 }];
      }
    },
    registry: {
      itemsByName: {
        oak_log: { id: 17 }
      }
    },
    findBlock() {
      return { name: "chest" };
    },
    async openChest() {
      return {
        containerItems() {
          return [...chestSlots.entries()].map(([name, count]) => ({ name, count, type: 17, metadata: 0 }));
        },
        async deposit() {},
        async withdraw() {},
        close() {}
      };
    }
  };
  const target = {
    username: "npc_b",
    entity: {
      position: createPosition(2)
    }
  };

  const result = await observe({
    actor,
    target,
    dialogueState: createDialogueState({ busyRepliesBeforeAvailable: 0 }),
    memory: createMemory(4),
    sharedChest: createMineflayerSharedChestAccessor(actor)
  });

  assert.deepEqual(result.sharedChest, {
    chestId: "shared-chest-1",
    items: [{ name: "oak_log", count: 3 }]
  });
});
