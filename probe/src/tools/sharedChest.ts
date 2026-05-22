import {
  canDepositSharedItem,
  canRoleUseTool,
  canWithdrawSharedItem,
  readKeepItemCount,
  type RoleId
} from "../npc/roles/contracts.js";
import type { BulletinEntry } from "../npc/social/teamBulletin.js";
import type { ItemStack } from "../gameplay/storage/sharedStorageLedger.js";

type InventoryStore = {
  items(): ItemStack[];
};

type SharedChestContainer = {
  items(): ItemStack[];
  deposit(itemName: string, count: number): Promise<number> | number;
  withdraw(itemName: string, count: number): Promise<number> | number;
  close(): Promise<void> | void;
};

type SharedChestAccessor = {
  chestId: string;
  open(): Promise<SharedChestContainer> | SharedChestContainer;
};

type Ledger = {
  recordInspect(input: { actorId: string; chestId: string; snapshot: readonly ItemStack[] }): { seq: number };
  recordDeposit(input: {
    actorId: string;
    chestId: string;
    itemName: string;
    movedCount: number;
    beforeChest: readonly ItemStack[];
    afterChest: readonly ItemStack[];
    beforeInventory: readonly ItemStack[];
    afterInventory: readonly ItemStack[];
  }): { seq: number };
  recordWithdraw(input: {
    actorId: string;
    chestId: string;
    itemName: string;
    movedCount: number;
    reason: string;
    beforeChest: readonly ItemStack[];
    afterChest: readonly ItemStack[];
    beforeInventory: readonly ItemStack[];
    afterInventory: readonly ItemStack[];
  }): { seq: number };
};

type Bulletin = {
  update(entry: BulletinEntry): void;
};

function snapshotItems(items: readonly ItemStack[]) {
  return [...items]
    .map((item) => ({ name: item.name, count: item.count }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function countItems(items: readonly ItemStack[], itemName: string) {
  return items
    .filter((item) => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0);
}

async function usingChest<T>(chest: SharedChestAccessor, run: (container: SharedChestContainer) => Promise<T>) {
  const container = await chest.open();

  try {
    return await run(container);
  } finally {
    // Mineflayer chest windows are live container handles. Always close them
    // after the primitive so later storage actions do not inherit UI state.
    await container.close();
  }
}

export async function inspectChest(input: {
  actorId: string;
  roleId: RoleId;
  chest: SharedChestAccessor;
  ledger: Ledger;
  bulletin: Bulletin;
  currentTask?: string;
}) {
  if (!canRoleUseTool(input.roleId, "inspect_chest")) {
    return {
      status: "blocked",
      chestId: input.chest.chestId,
      message: `${input.roleId} cannot inspect the shared chest`
    };
  }

  const items = await usingChest(input.chest, async (container) => snapshotItems(container.items()));
  const ledgerEntry = input.ledger.recordInspect({
    actorId: input.actorId,
    chestId: input.chest.chestId,
    snapshot: items
  });

  input.bulletin.update({
    // The bulletin is intentionally derived from the ledger sequence so social
    // state can point back to the same transcript-visible storage event.
    actorId: input.actorId,
    roleId: input.roleId,
    chestId: input.chest.chestId,
    currentTask: input.currentTask,
    lastContribution: `inspected shared chest ${input.chest.chestId}`,
    updatedAt: ledgerEntry.seq
  });

  return {
    status: "inspected",
    actorId: input.actorId,
    roleId: input.roleId,
    chestId: input.chest.chestId,
    currentTask: input.currentTask,
    ledgerSeq: ledgerEntry.seq,
    items
  };
}

export async function depositToSharedChest(input: {
  actorId: string;
  roleId: RoleId;
  chest: SharedChestAccessor;
  inventory: InventoryStore;
  ledger: Ledger;
  bulletin: Bulletin;
  itemName: string;
  count: number;
  currentTask?: string;
}) {
  if (!canRoleUseTool(input.roleId, "deposit_shared") || !canDepositSharedItem(input.roleId, input.itemName)) {
    return {
      status: "blocked",
      chestId: input.chest.chestId,
      itemName: input.itemName,
      movedCount: 0,
      message: `${input.roleId} cannot deposit ${input.itemName} to shared storage`
    };
  }

  const beforeInventory = snapshotItems(input.inventory.items());
  const personalCount = countItems(beforeInventory, input.itemName);
  const reserve = readKeepItemCount(input.roleId, input.itemName);
  // Shared storage pressure must not drain the actor below its role-owned
  // personal reserve.
  const movableCount = Math.min(input.count, Math.max(0, personalCount - reserve));

  if (movableCount <= 0) {
    return {
      status: "blocked",
      chestId: input.chest.chestId,
      itemName: input.itemName,
      movedCount: 0,
      message: `${input.roleId} must keep personal reserve for ${input.itemName}`
    };
  }

  const transfer = await usingChest(input.chest, async (container) => {
    const beforeChest = snapshotItems(container.items());
    const depositResult = await container.deposit(input.itemName, movableCount);
    const afterChest = snapshotItems(container.items());
    return {
      beforeChest,
      afterChest,
      movedCount:
        // Live Mineflayer adapters return a moved count, while test/storage
        // doubles may only expose before/after snapshots. Both paths must feed
        // the ledger with the same semantic "actual moved" value.
        typeof depositResult === "number"
          ? depositResult
          : countItems(afterChest, input.itemName) - countItems(beforeChest, input.itemName)
    };
  });

  if (transfer.movedCount <= 0) {
    return {
      status: "blocked",
      chestId: input.chest.chestId,
      itemName: input.itemName,
      movedCount: 0,
      message: `${input.itemName} was not moved into shared storage`
    };
  }

  const afterInventory = snapshotItems(input.inventory.items());
  const ledgerEntry = input.ledger.recordDeposit({
    actorId: input.actorId,
    chestId: input.chest.chestId,
    itemName: input.itemName,
    movedCount: transfer.movedCount,
    beforeChest: transfer.beforeChest,
    afterChest: transfer.afterChest,
    beforeInventory,
    afterInventory
  });

  input.bulletin.update({
    actorId: input.actorId,
    roleId: input.roleId,
    chestId: input.chest.chestId,
    currentTask: input.currentTask,
    lastContribution: `deposited ${transfer.movedCount} ${input.itemName} into shared chest`,
    updatedAt: ledgerEntry.seq
  });

  return {
    status: "deposited",
    actorId: input.actorId,
    roleId: input.roleId,
    chestId: input.chest.chestId,
    currentTask: input.currentTask,
    ledgerSeq: ledgerEntry.seq,
    itemName: input.itemName,
    movedCount: transfer.movedCount
  };
}

export async function withdrawFromSharedChest(input: {
  actorId: string;
  roleId: RoleId;
  chest: SharedChestAccessor;
  inventory: InventoryStore;
  ledger: Ledger;
  bulletin: Bulletin;
  itemName: string;
  count: number;
  reason: string;
  currentTask?: string;
}) {
  if (!canRoleUseTool(input.roleId, "withdraw_shared") || !canWithdrawSharedItem(input.roleId, input.itemName)) {
    return {
      status: "blocked",
      chestId: input.chest.chestId,
      itemName: input.itemName,
      movedCount: 0,
      message: `${input.roleId} cannot withdraw ${input.itemName} from shared storage`
    };
  }

  const beforeInventory = snapshotItems(input.inventory.items());
  const transfer = await usingChest(input.chest, async (container) => {
    const beforeChest = snapshotItems(container.items());
    const availableCount = countItems(beforeChest, input.itemName);
    const requestedCount = Math.min(input.count, availableCount);

    if (requestedCount <= 0) {
      // A no-op withdrawal is blocked before ledger write; otherwise transcript
      // consumers would see a storage event that did not change shared state.
      return {
        beforeChest,
        afterChest: beforeChest,
        movedCount: 0
      };
    }

    const withdrawResult = await container.withdraw(input.itemName, requestedCount);
    const afterChest = snapshotItems(container.items());
    return {
      beforeChest,
      afterChest,
      movedCount:
        // As with deposits, prefer adapter-reported movement but preserve a
        // snapshot-delta fallback for deterministic tests and offline ledgers.
        typeof withdrawResult === "number"
          ? withdrawResult
          : countItems(beforeChest, input.itemName) - countItems(afterChest, input.itemName)
    };
  });

  if (transfer.movedCount <= 0) {
    return {
      status: "blocked",
      chestId: input.chest.chestId,
      itemName: input.itemName,
      movedCount: 0,
      message: `${input.itemName} is not available in shared storage`
    };
  }

  const afterInventory = snapshotItems(input.inventory.items());
  const ledgerEntry = input.ledger.recordWithdraw({
    actorId: input.actorId,
    chestId: input.chest.chestId,
    itemName: input.itemName,
    movedCount: transfer.movedCount,
    reason: input.reason,
    beforeChest: transfer.beforeChest,
    afterChest: transfer.afterChest,
    beforeInventory,
    afterInventory
  });

  input.bulletin.update({
    actorId: input.actorId,
    roleId: input.roleId,
    chestId: input.chest.chestId,
    currentTask: input.currentTask,
    lastContribution: `withdrew ${transfer.movedCount} ${input.itemName} from shared chest`,
    resourceNeeds: [input.reason],
    updatedAt: ledgerEntry.seq
  });

  return {
    status: "withdrew",
    actorId: input.actorId,
    roleId: input.roleId,
    chestId: input.chest.chestId,
    currentTask: input.currentTask,
    ledgerSeq: ledgerEntry.seq,
    itemName: input.itemName,
    movedCount: transfer.movedCount,
    reason: input.reason
  };
}
