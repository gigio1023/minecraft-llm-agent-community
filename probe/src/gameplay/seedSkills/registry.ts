import type { IntentKind } from "../../runtime/pressureIntent.js";
import type { RoleId } from "../../npc/roles/contracts.js";
import type { RuntimePrimitiveId } from "../primitives/registry.js";

// ---------------------------------------------------------------------------
// Seed Skill Definition
// ---------------------------------------------------------------------------

export type SeedSkillId =
  // Core progression (12)
  | "collectLogs"
  | "craftPlanksAndSticks"
  | "craftCraftingTable"
  | "craftWoodenPickaxe"
  | "mineCobblestone"
  | "craftStonePickaxe"
  | "craftFurnace"
  | "mineCoal"
  | "smeltRawIron"
  | "inspectSharedChest"
  | "depositSharedItems"
  | "collectDroppedItems"
  // Social (4)
  | "approachAndRequestItem"
  | "announceResourceDiscovery"
  | "handoffItemAtChest"
  | "waitForBusyCrafter"
  // Hostile (4)
  | "patrolArea"
  | "threatenApproach"
  | "stealFromChestIfExposed"
  | "attackThenRetreat";

export type SeedSkill = {
  id: SeedSkillId;
  summary: string;
  intentKinds: IntentKind[];
  validRoles: RoleId[];
  preconditions: string[];
  primitiveIds: RuntimePrimitiveId[];
};

// ---------------------------------------------------------------------------
// Core Progression Skills
// ---------------------------------------------------------------------------

const coreSkills: SeedSkill[] = [
  {
    id: "collectLogs",
    summary: "Mine nearby trees to gather logs",
    intentKinds: ["bootstrap_progress", "resupply_shared_storage", "recover_basic_tools"],
    validRoles: ["gatherer", "quartermaster"],
    preconditions: [],
    primitiveIds: ["observe", "collect_logs", "wait"]
  },
  {
    id: "craftPlanksAndSticks",
    summary: "Craft planks and sticks from logs",
    intentKinds: ["bootstrap_progress", "recover_basic_tools"],
    validRoles: ["crafter", "quartermaster"],
    preconditions: ["inventory has logs"],
    primitiveIds: ["observe", "craft_item", "wait"]
  },
  {
    id: "craftCraftingTable",
    summary: "Craft a crafting table from planks",
    intentKinds: ["bootstrap_progress", "recover_basic_tools"],
    validRoles: ["crafter", "quartermaster"],
    preconditions: ["inventory has planks"],
    primitiveIds: ["observe", "craft_item", "wait"]
  },
  {
    id: "craftWoodenPickaxe",
    summary: "Craft a wooden pickaxe from planks and sticks",
    intentKinds: ["bootstrap_progress", "recover_basic_tools"],
    validRoles: ["crafter"],
    preconditions: ["inventory has planks", "inventory has sticks", "crafting_table nearby"],
    primitiveIds: ["observe", "craft_item", "wait"]
  },
  {
    id: "mineCobblestone",
    summary: "Mine stone blocks to gather cobblestone",
    intentKinds: ["bootstrap_progress"],
    validRoles: ["gatherer"],
    preconditions: ["inventory has wooden_pickaxe or stone_pickaxe"],
    primitiveIds: ["observe", "collect_logs", "wait"]
  },
  {
    id: "craftStonePickaxe",
    summary: "Upgrade to a stone pickaxe from cobblestone and sticks",
    intentKinds: ["bootstrap_progress"],
    validRoles: ["crafter"],
    preconditions: ["inventory has cobblestone", "inventory has sticks", "crafting_table nearby"],
    primitiveIds: ["observe", "craft_item", "wait"]
  },
  {
    id: "craftFurnace",
    summary: "Craft a furnace from cobblestone",
    intentKinds: ["bootstrap_progress"],
    validRoles: ["crafter"],
    preconditions: ["inventory has cobblestone >= 8", "crafting_table nearby"],
    primitiveIds: ["observe", "craft_item", "wait"]
  },
  {
    id: "mineCoal",
    summary: "Mine coal ore to gather coal",
    intentKinds: ["bootstrap_progress", "resupply_shared_storage"],
    validRoles: ["gatherer"],
    preconditions: ["inventory has pickaxe"],
    primitiveIds: ["observe", "collect_logs", "wait"]
  },
  {
    id: "smeltRawIron",
    summary: "Smelt raw iron in a furnace using coal",
    intentKinds: ["bootstrap_progress"],
    validRoles: ["crafter"],
    preconditions: ["inventory has raw_iron", "inventory has coal", "furnace nearby"],
    primitiveIds: ["observe", "craft_item", "wait"]
  },
  {
    id: "inspectSharedChest",
    summary: "Inspect the shared chest to check what is available",
    intentKinds: ["inspect_settlement_state", "resupply_shared_storage"],
    validRoles: ["gatherer", "crafter", "quartermaster"],
    preconditions: ["shared chest nearby"],
    primitiveIds: ["observe", "inspect_chest", "wait"]
  },
  {
    id: "depositSharedItems",
    summary: "Deposit surplus items into the shared chest",
    intentKinds: ["resupply_shared_storage", "fulfill_obligation", "bootstrap_progress"],
    validRoles: ["gatherer", "quartermaster"],
    preconditions: ["shared chest nearby", "inventory has depositable items"],
    primitiveIds: ["observe", "inspect_chest", "deposit_shared", "wait"]
  },
  {
    id: "collectDroppedItems",
    summary: "Pick up dropped items from the ground",
    intentKinds: ["claim_nearby_opportunity", "recover_basic_tools"],
    validRoles: ["gatherer", "crafter", "quartermaster"],
    preconditions: ["dropped items visible"],
    primitiveIds: ["observe", "move_to", "wait"]
  }
];

// ---------------------------------------------------------------------------
// Social Skills
// ---------------------------------------------------------------------------

const socialSkills: SeedSkill[] = [
  {
    id: "approachAndRequestItem",
    summary: "Walk to a teammate and ask for a specific item",
    intentKinds: ["request_or_handoff", "unblock_teammate"],
    validRoles: ["crafter", "quartermaster"],
    preconditions: ["target actor visible", "target actor not busy"],
    primitiveIds: ["observe", "move_to", "say", "wait"]
  },
  {
    id: "announceResourceDiscovery",
    summary: "Tell teammates about a new resource location",
    intentKinds: ["claim_nearby_opportunity", "inspect_settlement_state"],
    validRoles: ["gatherer", "crafter", "quartermaster"],
    preconditions: ["resource found"],
    primitiveIds: ["observe", "say", "remember"]
  },
  {
    id: "handoffItemAtChest",
    summary: "Deposit an item at the shared chest for a requesting teammate",
    intentKinds: ["fulfill_obligation", "unblock_teammate"],
    validRoles: ["gatherer", "quartermaster"],
    preconditions: ["shared chest nearby", "obligation pending"],
    primitiveIds: ["observe", "inspect_chest", "deposit_shared", "say", "wait"]
  },
  {
    id: "waitForBusyCrafter",
    summary: "Wait nearby while a crafter finishes their current task",
    intentKinds: ["wait_or_defer", "request_or_handoff"],
    validRoles: ["gatherer", "quartermaster"],
    preconditions: ["target actor busy"],
    primitiveIds: ["observe", "wait", "say"]
  }
];

// ---------------------------------------------------------------------------
// Hostile Skills (bounded)
// ---------------------------------------------------------------------------

const hostileSkills: SeedSkill[] = [
  {
    id: "patrolArea",
    summary: "Walk a short patrol route around the home area",
    intentKinds: ["avoid_or_retreat", "claim_nearby_opportunity"],
    validRoles: [],
    preconditions: [],
    primitiveIds: ["observe", "move_to", "wait"]
  },
  {
    id: "threatenApproach",
    summary: "Move toward a cooperative NPC to apply social pressure",
    intentKinds: ["avoid_or_retreat"],
    validRoles: [],
    preconditions: ["target visible", "engagement timeout not exceeded"],
    primitiveIds: ["observe", "move_to", "say", "wait"]
  },
  {
    id: "stealFromChestIfExposed",
    summary: "Take items from an unguarded shared chest",
    intentKinds: ["claim_nearby_opportunity"],
    validRoles: [],
    preconditions: ["shared chest unguarded", "theft cooldown expired"],
    primitiveIds: ["observe", "inspect_chest", "withdraw_shared", "wait"]
  },
  {
    id: "attackThenRetreat",
    summary: "Brief attack on a target followed by immediate retreat",
    intentKinds: ["avoid_or_retreat"],
    validRoles: [],
    preconditions: ["target in range", "engagement timeout not exceeded", "health above retreat threshold"],
    primitiveIds: ["observe", "move_to", "wait"]
  }
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const allSkills: SeedSkill[] = [...coreSkills, ...socialSkills, ...hostileSkills];

const skillById = new Map<SeedSkillId, SeedSkill>(
  allSkills.map((skill) => [skill.id, skill])
);

export function getSeedSkill(id: SeedSkillId): SeedSkill {
  const skill = skillById.get(id);

  if (!skill) {
    throw new Error(`Unknown seed skill: ${id}`);
  }

  return skill;
}

export function listSeedSkills(): SeedSkill[] {
  return [...allSkills];
}

export function listCoreSkillIds(): SeedSkillId[] {
  return coreSkills.map((skill) => skill.id);
}

export function listSocialSkillIds(): SeedSkillId[] {
  return socialSkills.map((skill) => skill.id);
}

export function listHostileSkillIds(): SeedSkillId[] {
  return hostileSkills.map((skill) => skill.id);
}
