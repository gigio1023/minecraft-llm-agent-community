export type RoleId = "gatherer" | "crafter" | "quartermaster";

export type RoleContract = {
  roleId: RoleId;
  allowedTools: string[];
  depositAllowedItemNames: string[];
  withdrawAllowedItemNames: string[];
  keepItems: Record<string, number>;
  priorityList: string[];
};

// Role contracts are runtime permissions, not persona flavor. They gate which
// primitives and shared-storage actions an actor can execute.
const roleContracts: Record<RoleId, RoleContract> = {
  gatherer: {
    roleId: "gatherer",
    allowedTools: ["observe", "move_to", "collect_logs", "inspect_chest", "deposit_shared", "say", "wait", "remember"],
    depositAllowedItemNames: [
      "oak_log",
      "birch_log",
      "spruce_log",
      "jungle_log",
      "acacia_log",
      "dark_oak_log",
      "mangrove_log",
      "cherry_log",
      "oak_planks",
      "birch_planks",
      "spruce_planks",
      "jungle_planks",
      "acacia_planks",
      "dark_oak_planks",
      "mangrove_planks",
      "cherry_planks",
      "crafting_table"
    ],
    withdrawAllowedItemNames: [],
    keepItems: {
      bread: 2
    },
    priorityList: ["collect resources", "deposit shared materials"]
  },
  crafter: {
    roleId: "crafter",
    allowedTools: ["observe", "move_to", "craft_item", "inspect_chest", "withdraw_shared", "deposit_shared", "say", "wait", "remember"],
    depositAllowedItemNames: [
      "oak_planks",
      "birch_planks",
      "spruce_planks",
      "jungle_planks",
      "acacia_planks",
      "dark_oak_planks",
      "mangrove_planks",
      "cherry_planks",
      "stick",
      "crafting_table"
    ],
    withdrawAllowedItemNames: [
      "oak_log",
      "birch_log",
      "spruce_log",
      "jungle_log",
      "acacia_log",
      "dark_oak_log",
      "mangrove_log",
      "cherry_log",
      "oak_planks",
      "birch_planks",
      "spruce_planks",
      "jungle_planks",
      "acacia_planks",
      "dark_oak_planks",
      "mangrove_planks",
      "cherry_planks",
      "stick"
    ],
    keepItems: {
      bread: 2
    },
    priorityList: ["withdraw crafting inputs", "produce tools and stations"]
  },
  quartermaster: {
    roleId: "quartermaster",
    allowedTools: ["observe", "move_to", "inspect_chest", "deposit_shared", "withdraw_shared", "say", "wait", "remember"],
    depositAllowedItemNames: ["*"],
    withdrawAllowedItemNames: ["*"],
    keepItems: {
      bread: 2
    },
    priorityList: ["inspect chest", "rebalance shared storage"]
  }
};

function allowsItem(allowedItemNames: readonly string[], itemName: string) {
  return allowedItemNames.includes("*") || allowedItemNames.includes(itemName);
}

/** Returns the immutable contract used for role-based primitive gating. */
export function getRoleContract(roleId: RoleId): RoleContract {
  return roleContracts[roleId];
}

export function canRoleUseTool(roleId: RoleId, toolName: string) {
  return getRoleContract(roleId).allowedTools.includes(toolName);
}

export function canDepositSharedItem(roleId: RoleId, itemName: string) {
  return allowsItem(getRoleContract(roleId).depositAllowedItemNames, itemName);
}

export function canWithdrawSharedItem(roleId: RoleId, itemName: string) {
  return allowsItem(getRoleContract(roleId).withdrawAllowedItemNames, itemName);
}

export function readKeepItemCount(roleId: RoleId, itemName: string) {
  return getRoleContract(roleId).keepItems[itemName] ?? 0;
}
