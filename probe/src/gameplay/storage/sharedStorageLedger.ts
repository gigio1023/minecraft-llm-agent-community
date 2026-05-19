export type ItemStack = {
  name: string;
  count: number;
};

export type SharedStorageLedgerEntry = {
  seq: number;
  kind: "inspect" | "deposit" | "withdraw";
  actorId: string;
  chestId: string;
  itemName?: string;
  movedCount?: number;
  reason?: string;
  snapshot?: ItemStack[];
  beforeChest?: ItemStack[];
  afterChest?: ItemStack[];
  beforeInventory?: ItemStack[];
  afterInventory?: ItemStack[];
};

function snapshotItems(items: readonly ItemStack[]) {
  return [...items]
    .map((item) => ({ name: item.name, count: item.count }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function createSharedStorageLedger() {
  let seq = 0;
  const entries: SharedStorageLedgerEntry[] = [];
  const chestSnapshots = new Map<string, ItemStack[]>();

  function nextSeq() {
    seq += 1;
    return seq;
  }

  function syncChest(chestId: string, items: readonly ItemStack[]) {
    chestSnapshots.set(chestId, snapshotItems(items));
  }

  return {
    latestChest(chestId: string) {
      return snapshotItems(chestSnapshots.get(chestId) ?? []);
    },
    entries() {
      return entries.map((entry) => ({
        ...entry,
        ...(entry.snapshot ? { snapshot: snapshotItems(entry.snapshot) } : {}),
        ...(entry.beforeChest ? { beforeChest: snapshotItems(entry.beforeChest) } : {}),
        ...(entry.afterChest ? { afterChest: snapshotItems(entry.afterChest) } : {}),
        ...(entry.beforeInventory ? { beforeInventory: snapshotItems(entry.beforeInventory) } : {}),
        ...(entry.afterInventory ? { afterInventory: snapshotItems(entry.afterInventory) } : {})
      }));
    },
    recordInspect(input: {
      actorId: string;
      chestId: string;
      snapshot: readonly ItemStack[];
    }) {
      const entry: SharedStorageLedgerEntry = {
        seq: nextSeq(),
        kind: "inspect",
        actorId: input.actorId,
        chestId: input.chestId,
        snapshot: snapshotItems(input.snapshot)
      };

      syncChest(input.chestId, input.snapshot);
      entries.push(entry);
      return entry;
    },
    recordDeposit(input: {
      actorId: string;
      chestId: string;
      itemName: string;
      movedCount: number;
      beforeChest: readonly ItemStack[];
      afterChest: readonly ItemStack[];
      beforeInventory: readonly ItemStack[];
      afterInventory: readonly ItemStack[];
    }) {
      const entry: SharedStorageLedgerEntry = {
        seq: nextSeq(),
        kind: "deposit",
        actorId: input.actorId,
        chestId: input.chestId,
        itemName: input.itemName,
        movedCount: input.movedCount,
        beforeChest: snapshotItems(input.beforeChest),
        afterChest: snapshotItems(input.afterChest),
        beforeInventory: snapshotItems(input.beforeInventory),
        afterInventory: snapshotItems(input.afterInventory)
      };

      syncChest(input.chestId, input.afterChest);
      entries.push(entry);
      return entry;
    },
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
    }) {
      const entry: SharedStorageLedgerEntry = {
        seq: nextSeq(),
        kind: "withdraw",
        actorId: input.actorId,
        chestId: input.chestId,
        itemName: input.itemName,
        movedCount: input.movedCount,
        reason: input.reason,
        beforeChest: snapshotItems(input.beforeChest),
        afterChest: snapshotItems(input.afterChest),
        beforeInventory: snapshotItems(input.beforeInventory),
        afterInventory: snapshotItems(input.afterInventory)
      };

      syncChest(input.chestId, input.afterChest);
      entries.push(entry);
      return entry;
    }
  };
}
