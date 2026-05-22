import assert from "node:assert/strict";
import test from "node:test";

import { createSharedStorageLedger } from "../src/gameplay/storage/sharedStorageLedger.js";
import { createTeamBulletin } from "../src/npc/social/teamBulletin.js";
import {
  depositToSharedChest,
  inspectChest,
  withdrawFromSharedChest
} from "../src/tools/sharedChest.js";

function createInventoryStore(initial: Record<string, number>) {
  const items = new Map(Object.entries(initial));

  return {
    items() {
      return [...items.entries()]
        .filter(([, count]) => count > 0)
        .map(([name, count]) => ({ name, count }));
    },
    add(itemName: string, count: number) {
      items.set(itemName, (items.get(itemName) ?? 0) + count);
    },
    remove(itemName: string, count: number) {
      const next = Math.max(0, (items.get(itemName) ?? 0) - count);
      items.set(itemName, next);
    }
  };
}

function createSharedChest(initial: Record<string, number>) {
  const slots = new Map(Object.entries(initial));

  return {
    chestId: "shared-chest-1",
    async open() {
      return {
        items() {
          return [...slots.entries()]
            .filter(([, count]) => count > 0)
            .map(([name, count]) => ({ name, count }));
        },
        deposit(itemName: string, count: number) {
          slots.set(itemName, (slots.get(itemName) ?? 0) + count);
          return count;
        },
        withdraw(itemName: string, count: number) {
          const movedCount = Math.min(count, slots.get(itemName) ?? 0);
          slots.set(itemName, Math.max(0, (slots.get(itemName) ?? 0) - movedCount));
          return movedCount;
        },
        close() {}
      };
    }
  };
}

test("inspectChest records observed contents into the shared storage ledger", async () => {
  const ledger = createSharedStorageLedger();
  const bulletin = createTeamBulletin();
  const chest = createSharedChest({ oak_log: 5, stick: 2 });

  const result = await inspectChest({
    actorId: "npc_a",
    roleId: "quartermaster",
    chest,
    ledger,
    bulletin,
    currentTask: "inspect shared storage"
  });

  assert.deepEqual(result, {
    status: "inspected",
    actorId: "npc_a",
    roleId: "quartermaster",
    chestId: "shared-chest-1",
    currentTask: "inspect shared storage",
    ledgerSeq: 1,
    items: [
      { name: "oak_log", count: 5 },
      { name: "stick", count: 2 }
    ]
  });
  assert.deepEqual(ledger.latestChest("shared-chest-1"), [
    { name: "oak_log", count: 5 },
    { name: "stick", count: 2 }
  ]);
  assert.equal(bulletin.snapshot()[0]?.lastContribution, "inspected shared chest shared-chest-1");
});

test("depositToSharedChest moves allowed items and records one ledger contribution", async () => {
  const ledger = createSharedStorageLedger();
  const bulletin = createTeamBulletin();
  const chest = createSharedChest({ oak_log: 1 });
  const inventory = createInventoryStore({ oak_log: 8 });

  const result = await depositToSharedChest({
    actorId: "npc_a",
    roleId: "gatherer",
    chest,
    inventory: {
      items: inventory.items
    },
    ledger,
    bulletin,
    itemName: "oak_log",
    count: 5,
    currentTask: "deposit logs"
  });

  inventory.remove("oak_log", result.movedCount);

  assert.deepEqual(result, {
    status: "deposited",
    actorId: "npc_a",
    roleId: "gatherer",
    chestId: "shared-chest-1",
    currentTask: "deposit logs",
    ledgerSeq: 1,
    itemName: "oak_log",
    movedCount: 5
  });
  assert.deepEqual(inventory.items(), [{ name: "oak_log", count: 3 }]);
  assert.deepEqual(ledger.latestChest("shared-chest-1"), [{ name: "oak_log", count: 6 }]);
  assert.equal(ledger.entries()[0]?.kind, "deposit");
});

test("depositToSharedChest blocks keep-items violations without mutating ledger or chest", async () => {
  const ledger = createSharedStorageLedger();
  const bulletin = createTeamBulletin();
  const chest = createSharedChest({ bread: 1 });
  const inventory = createInventoryStore({ bread: 3 });

  const result = await depositToSharedChest({
    actorId: "npc_a",
    roleId: "gatherer",
    chest,
    inventory: {
      items: inventory.items
    },
    ledger,
    bulletin,
    itemName: "bread",
    count: 3,
    currentTask: "deposit food"
  });

  assert.equal(result.status, "blocked");
  assert.deepEqual(inventory.items(), [{ name: "bread", count: 3 }]);
  assert.deepEqual(ledger.latestChest("shared-chest-1"), []);
  assert.equal(ledger.entries().length, 0);
});

test("depositToSharedChest blocks zero-move adapters without writing contribution evidence", async () => {
  const ledger = createSharedStorageLedger();
  const bulletin = createTeamBulletin();
  const inventory = createInventoryStore({ oak_log: 4 });
  const chest = {
    chestId: "shared-chest-1",
    async open() {
      return {
        items() {
          return [];
        },
        deposit() {
          return 0;
        },
        withdraw() {
          return 0;
        },
        close() {}
      };
    }
  };

  const result = await depositToSharedChest({
    actorId: "npc_a",
    roleId: "gatherer",
    chest,
    inventory: {
      items: inventory.items
    },
    ledger,
    bulletin,
    itemName: "oak_log",
    count: 2,
    currentTask: "deposit logs"
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.movedCount, 0);
  assert.deepEqual(ledger.entries(), []);
  assert.deepEqual(bulletin.snapshot(), []);
});

test("withdrawFromSharedChest lets a crafter take needed inputs and updates bulletin state", async () => {
  const ledger = createSharedStorageLedger();
  const bulletin = createTeamBulletin();
  const chest = createSharedChest({ oak_log: 6 });
  const inventory = createInventoryStore({});

  const result = await withdrawFromSharedChest({
    actorId: "npc_b",
    roleId: "crafter",
    chest,
    inventory: {
      items: inventory.items
    },
    ledger,
    bulletin,
    itemName: "oak_log",
    count: 4,
    reason: "craft planks",
    currentTask: "craft planks and sticks"
  });

  inventory.add("oak_log", result.movedCount);

  assert.deepEqual(result, {
    status: "withdrew",
    actorId: "npc_b",
    roleId: "crafter",
    chestId: "shared-chest-1",
    currentTask: "craft planks and sticks",
    ledgerSeq: 1,
    itemName: "oak_log",
    movedCount: 4,
    reason: "craft planks"
  });
  assert.deepEqual(inventory.items(), [{ name: "oak_log", count: 4 }]);
  assert.deepEqual(ledger.latestChest("shared-chest-1"), [{ name: "oak_log", count: 2 }]);
  assert.equal(bulletin.snapshot()[0]?.lastContribution, "withdrew 4 oak_log from shared chest");
});
