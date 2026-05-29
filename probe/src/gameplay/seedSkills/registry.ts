import type { IntentKind } from "../../runtime/contextIntent.js";
import type { RoleId } from "../../npc/roles/contracts.js";
import type { RuntimePrimitiveId } from "../primitives/registry.js";

// Seed action skills describe owned Minecraft behaviors above runtime
// primitives. Planned entries must name their missing primitive boundary instead
// of implying that prompt text alone can make the behavior trustworthy.

export type SeedActionSkillId =
  | "runtimeObserveAndRemember"
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
  // Survival / utility roadmap (8)
  | "exploreForMaterials"
  | "placeCraftingTable"
  | "buildBasicShelter"
  | "equipBestTool"
  | "placeTorchLightArea"
  | "eatFoodWhenHungry"
  | "sleepAtNight"
  | "fleeDanger"
  | "setupSharedStash"
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

export type SeedActionSkill = {
  id: SeedActionSkillId;
  summary: string;
  runtimeStatus: "implemented" | "planned";
  implementationNotes: string;
  intentKinds: IntentKind[];
  validRoles: RoleId[];
  preconditions: string[];
  primitiveIds: RuntimePrimitiveId[];
  missingPrimitives?: string[];
};

const runtimeControlActionSkills: SeedActionSkill[] = [
  {
    id: "runtimeObserveAndRemember",
    summary: "Observe current state, wait safely, and write runtime memory notes",
    runtimeStatus: "implemented",
    implementationNotes:
      "Baseline control bundle. It keeps sensing, explicit wait, and terminal/status memory notes inside actor workspace ownership.",
    intentKinds: ["wait_or_defer", "inspect_settlement_state"],
    validRoles: ["gatherer", "crafter", "quartermaster", "settler"],
    preconditions: [],
    primitiveIds: ["observe", "wait", "remember"]
  }
];

// Core progression is the current proof path: gather wood, craft the first
// station, and make shared storage evidence visible before expanding the loop.

const coreActionSkills: SeedActionSkill[] = [
  {
    id: "collectLogs",
    summary: "Mine nearby trees to gather logs",
    runtimeStatus: "implemented",
    implementationNotes:
      "Uses Mineflayer block search, pathfinder movement, dig, dropped-item pickup, and inventory-increase evidence.",
    intentKinds: ["bootstrap_progress", "resupply_shared_storage", "recover_basic_tools"],
    validRoles: ["gatherer", "settler"],
    preconditions: [],
    primitiveIds: ["observe", "collect_logs", "wait"]
  },
  {
    id: "craftPlanksAndSticks",
    summary: "Craft planks and sticks from logs",
    runtimeStatus: "implemented",
    implementationNotes: "Uses inventory crafting recipes that do not require a crafting table.",
    intentKinds: ["bootstrap_progress", "recover_basic_tools"],
    validRoles: ["crafter", "settler"],
    preconditions: ["inventory has logs"],
    primitiveIds: ["observe", "craft_item", "wait"]
  },
  {
    id: "craftCraftingTable",
    summary: "Craft a crafting table from planks",
    runtimeStatus: "implemented",
    implementationNotes: "Uses inventory crafting; crafting table itself does not require an existing table.",
    intentKinds: ["bootstrap_progress", "recover_basic_tools"],
    validRoles: ["crafter", "settler"],
    preconditions: ["inventory has planks"],
    primitiveIds: ["observe", "craft_item", "wait"]
  },
  {
    id: "craftWoodenPickaxe",
    summary: "Craft a wooden pickaxe from planks and sticks",
    runtimeStatus: "implemented",
    implementationNotes:
      "Uses a nearby observed crafting table block and verifies wooden_pickaxe inventory increase.",
    intentKinds: ["bootstrap_progress", "recover_basic_tools"],
    validRoles: ["crafter", "settler"],
    preconditions: ["inventory has planks", "inventory has sticks", "crafting_table nearby"],
    primitiveIds: ["observe", "craft_with_table", "wait"]
  },
  {
    id: "mineCobblestone",
    summary: "Mine stone blocks to gather cobblestone",
    runtimeStatus: "implemented",
    implementationNotes:
      "Uses the bounded mine_block primitive for nearby stone and verifies cobblestone inventory increase.",
    intentKinds: ["bootstrap_progress"],
    validRoles: ["gatherer", "settler"],
    preconditions: ["inventory has wooden_pickaxe or stone_pickaxe"],
    primitiveIds: ["observe", "mine_block", "wait"]
  },
  {
    id: "craftStonePickaxe",
    summary: "Upgrade to a stone pickaxe from cobblestone and sticks",
    runtimeStatus: "planned",
    implementationNotes: "Requires crafting-table support and cobblestone acquisition first.",
    intentKinds: ["bootstrap_progress"],
    validRoles: ["crafter", "settler"],
    preconditions: ["inventory has cobblestone", "inventory has sticks", "crafting_table nearby"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["use_crafting_table"]
  },
  {
    id: "craftFurnace",
    summary: "Craft a furnace from cobblestone",
    runtimeStatus: "planned",
    implementationNotes: "Requires cobblestone acquisition and crafting-table support.",
    intentKinds: ["bootstrap_progress"],
    validRoles: ["crafter", "settler"],
    preconditions: ["inventory has cobblestone >= 8", "crafting_table nearby"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["mine_block", "use_crafting_table"]
  },
  {
    id: "mineCoal",
    summary: "Mine coal ore to gather coal",
    runtimeStatus: "planned",
    implementationNotes: "Requires a mine_block primitive, ore targeting, and pickaxe/tool gating.",
    intentKinds: ["bootstrap_progress", "resupply_shared_storage"],
    validRoles: ["gatherer", "settler"],
    preconditions: ["inventory has pickaxe"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["mine_block"]
  },
  {
    id: "smeltRawIron",
    summary: "Smelt raw iron in a furnace using coal",
    runtimeStatus: "planned",
    implementationNotes: "Requires furnace interaction, fuel/input/output handling, and smelting verification.",
    intentKinds: ["bootstrap_progress"],
    validRoles: ["crafter", "settler"],
    preconditions: ["inventory has raw_iron", "inventory has coal", "furnace nearby"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["use_furnace"]
  },
  {
    id: "inspectSharedChest",
    summary: "Inspect the shared chest to check what is available",
    runtimeStatus: "implemented",
    implementationNotes: "Uses the shared chest accessor and ledger-backed storage observation.",
    intentKinds: ["inspect_settlement_state", "resupply_shared_storage"],
    validRoles: ["gatherer", "crafter", "quartermaster", "settler"],
    preconditions: ["shared chest nearby"],
    primitiveIds: ["observe", "inspect_chest", "wait"]
  },
  {
    id: "depositSharedItems",
    summary: "Deposit surplus items into the shared chest",
    runtimeStatus: "implemented",
    implementationNotes: "Uses shared storage ledger rules and role-specific deposit permissions.",
    intentKinds: ["resupply_shared_storage", "fulfill_obligation", "bootstrap_progress"],
    validRoles: ["gatherer", "quartermaster", "settler"],
    preconditions: ["shared chest nearby", "inventory has depositable items"],
    primitiveIds: ["observe", "inspect_chest", "deposit_shared", "wait"]
  },
  {
    id: "collectDroppedItems",
    summary: "Pick up dropped items from the ground",
    runtimeStatus: "planned",
    implementationNotes: "move_to alone is not enough; this needs dropped-item targeting and pickup verification.",
    intentKinds: ["claim_nearby_opportunity", "recover_basic_tools"],
    validRoles: ["gatherer", "crafter", "quartermaster", "settler"],
    preconditions: ["dropped items visible"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["collect_dropped_item"]
  }
];

// Roadmap skills stay listed so future growth has a contract, but they remain
// inactive until their primitive boundary and verification evidence exist.

const survivalUtilityActionSkills: SeedActionSkill[] = [
  {
    id: "exploreForMaterials",
    summary: "Explore a bounded area until needed materials or landmarks are found",
    runtimeStatus: "planned",
    implementationNotes:
      "References Voyager exploreUntil and yearn_for_mines reposition/status loops. Needs bounded exploration, observation diffs, and abortable pathing before it can be active.",
    intentKinds: ["claim_nearby_opportunity", "bootstrap_progress"],
    validRoles: ["gatherer", "settler"],
    preconditions: ["current area lacks the needed block or item"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["explore_until", "world_diff"]
  },
  {
    id: "placeCraftingTable",
    summary: "Place or approach a crafting table so table recipes become available",
    runtimeStatus: "implemented",
    implementationNotes:
      "Uses place_block to put a crafting_table into the world and verifies the target block afterward. Table-bound recipe use remains handled by craft_with_table.",
    intentKinds: ["bootstrap_progress", "recover_basic_tools"],
    validRoles: ["crafter", "quartermaster", "settler"],
    preconditions: ["inventory has crafting_table"],
    primitiveIds: ["observe", "place_block", "wait"]
  },
  {
    id: "buildBasicShelter",
    summary: "Run one bounded starter shelter shell action skill when current context makes shelter relevant",
    runtimeStatus: "implemented",
    implementationNotes:
      "Uses build_pattern to place and verify a small shell. This is one seed action skill, not a core runtime strategy or default social goal.",
    intentKinds: ["bootstrap_progress", "inspect_settlement_state"],
    validRoles: ["settler"],
    preconditions: ["inventory has solid build material such as planks, logs, dirt, or cobblestone", "safe build site nearby"],
    primitiveIds: ["observe", "build_pattern", "remember"]
  },
  {
    id: "equipBestTool",
    summary: "Equip the best available tool for the next block or combat task",
    runtimeStatus: "planned",
    implementationNotes:
      "References mindcraft-ce equip and mineflayer-chatgpt craft_gear. Needs inventory tool ranking and verification that the held item changed.",
    intentKinds: ["bootstrap_progress", "recover_basic_tools", "avoid_or_retreat"],
    validRoles: ["gatherer", "crafter", "settler"],
    preconditions: ["inventory has a usable tool"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["equip_item", "held_item_observation"]
  },
  {
    id: "placeTorchLightArea",
    summary: "Place torches around the work area to make night or mining safer",
    runtimeStatus: "planned",
    implementationNotes:
      "References mineflayer-chatgpt light_area and Voyager torch workflows. Needs block placement, light-level observation, and torch inventory verification.",
    intentKinds: ["bootstrap_progress", "avoid_or_retreat", "claim_nearby_opportunity"],
    validRoles: ["gatherer", "quartermaster", "settler"],
    preconditions: ["inventory has torches", "area is dark or route is unsafe"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["place_block", "light_level_observation"]
  },
  {
    id: "eatFoodWhenHungry",
    summary: "Eat available food when hunger blocks safe work",
    runtimeStatus: "planned",
    implementationNotes:
      "References Voyager hunger-aware eating, mindcraft-ce consume, and yearn_for_mines interact:eat. Needs vitals observation and consume verification.",
    intentKinds: ["avoid_or_retreat", "recover_basic_tools"],
    validRoles: ["gatherer", "crafter", "quartermaster", "settler"],
    preconditions: ["food below safe threshold", "inventory has edible item"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["consume_item", "vitals_observation"]
  },
  {
    id: "sleepAtNight",
    summary: "Sleep in a nearby bed when night prevents safe work",
    runtimeStatus: "planned",
    implementationNotes:
      "References mineflayer-chatgpt sleep and mindcraft-ce goToBed. Needs time-of-day observation, bed targeting, and sleep/wake verification.",
    intentKinds: ["avoid_or_retreat", "wait_or_defer"],
    validRoles: ["gatherer", "crafter", "quartermaster", "settler"],
    preconditions: ["nighttime", "bed nearby or bed in inventory/placeable"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["use_bed", "time_observation"]
  },
  {
    id: "fleeDanger",
    summary: "Move away from nearby hostile mobs or unsafe terrain",
    runtimeStatus: "planned",
    implementationNotes:
      "References mindcraft-ce avoidEnemies and yearn_for_mines combat/flee separation. Needs hostile observation, bounded flee target selection, and distance verification.",
    intentKinds: ["avoid_or_retreat"],
    validRoles: ["gatherer", "crafter", "quartermaster", "settler"],
    preconditions: ["hostile mob or hazard within danger range"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["observe_hostiles", "flee_from_entity"]
  },
  {
    id: "setupSharedStash",
    summary: "Create a simple shared stash by placing and registering a chest",
    runtimeStatus: "planned",
    implementationNotes:
      "References mineflayer-chatgpt setup_stash and mindcraft-ce chest helpers. Current storage ledger can model a chest, but runtime cannot place/open a real chest as setup.",
    intentKinds: ["resupply_shared_storage", "inspect_settlement_state", "bootstrap_progress"],
    validRoles: ["quartermaster", "crafter", "settler"],
    preconditions: ["inventory has chest or enough planks", "flat safe placement nearby"],
    primitiveIds: ["observe", "wait"],
    missingPrimitives: ["place_block", "open_container", "register_shared_chest"]
  }
];

// Social skills are action skills only when they pass through runtime
// primitives such as movement, chat, memory, and storage ledger updates.

const socialActionSkills: SeedActionSkill[] = [
  {
    id: "approachAndRequestItem",
    summary: "Walk to a teammate and ask for a specific item",
    runtimeStatus: "implemented",
    implementationNotes: "Uses move_to and say; success still depends on distance and dialogue-state verification.",
    intentKinds: ["request_or_handoff", "unblock_teammate"],
    validRoles: ["crafter", "quartermaster", "settler"],
    preconditions: ["target actor visible", "target actor not busy"],
    primitiveIds: ["observe", "move_to", "say", "wait"]
  },
  {
    id: "announceResourceDiscovery",
    summary: "Tell teammates about a new resource location",
    runtimeStatus: "implemented",
    implementationNotes: "Uses say plus remember; resource-location grounding is still minimal.",
    intentKinds: ["claim_nearby_opportunity", "inspect_settlement_state"],
    validRoles: ["gatherer", "crafter", "quartermaster", "settler"],
    preconditions: ["resource found"],
    primitiveIds: ["observe", "say", "remember"]
  },
  {
    id: "handoffItemAtChest",
    summary: "Deposit an item at the shared chest for a requesting teammate",
    runtimeStatus: "implemented",
    implementationNotes: "Uses shared chest deposit and say; item transfer is ledger-backed.",
    intentKinds: ["fulfill_obligation", "unblock_teammate"],
    validRoles: ["gatherer", "quartermaster", "settler"],
    preconditions: ["shared chest nearby", "obligation pending"],
    primitiveIds: ["observe", "inspect_chest", "deposit_shared", "say", "wait"]
  },
  {
    id: "waitForBusyCrafter",
    summary: "Wait nearby while a crafter finishes their current task",
    runtimeStatus: "implemented",
    implementationNotes: "Uses wait and say around runtime-owned busy state.",
    intentKinds: ["wait_or_defer", "request_or_handoff"],
    validRoles: ["gatherer", "quartermaster", "settler"],
    preconditions: ["target actor busy"],
    primitiveIds: ["observe", "wait", "say"]
  }
];

// Hostile behavior is intentionally bounded and mostly planned; it needs
// explicit engagement budgets and evidence before it can affect live runs.

const hostileActionSkills: SeedActionSkill[] = [
  {
    id: "patrolArea",
    summary: "Walk a short patrol route around the home area",
    runtimeStatus: "planned",
    implementationNotes: "Requires area anchors, bounded route targets, and patrol verification.",
    intentKinds: ["avoid_or_retreat", "claim_nearby_opportunity"],
    validRoles: [],
    preconditions: [],
    primitiveIds: ["observe", "move_to", "wait"]
  },
  {
    id: "threatenApproach",
    summary: "Move toward a cooperative NPC with bounded hostile-role context",
    runtimeStatus: "planned",
    implementationNotes: "Requires hostile role runtime, engagement budget, and social-context verification.",
    intentKinds: ["avoid_or_retreat"],
    validRoles: [],
    preconditions: ["target visible", "engagement timeout not exceeded"],
    primitiveIds: ["observe", "move_to", "say", "wait"]
  },
  {
    id: "stealFromChestIfExposed",
    summary: "Take items from an unguarded shared chest",
    runtimeStatus: "planned",
    implementationNotes: "Requires hostile role runtime, guard checks, theft cooldown, and withdrawal rules.",
    intentKinds: ["claim_nearby_opportunity"],
    validRoles: [],
    preconditions: ["shared chest unguarded", "theft cooldown expired"],
    primitiveIds: ["observe", "inspect_chest", "withdraw_shared", "wait"]
  },
  {
    id: "attackThenRetreat",
    summary: "Brief attack on a target followed by immediate retreat",
    runtimeStatus: "planned",
    implementationNotes: "Requires combat primitive, health checks, target safety, and retreat verification.",
    intentKinds: ["avoid_or_retreat"],
    validRoles: [],
    preconditions: ["target in range", "engagement timeout not exceeded", "health above retreat threshold"],
    primitiveIds: ["observe", "move_to", "wait"]
  }
];

// Registry lookup is the stable ownership map used by planners and tests. Keep
// ids here synchronized with runtime primitive support rather than duplicating
// behavior in callers.

const allActionSkills: SeedActionSkill[] = [
  ...runtimeControlActionSkills,
  ...coreActionSkills,
  ...survivalUtilityActionSkills,
  ...socialActionSkills,
  ...hostileActionSkills
];

const actionSkillById = new Map<SeedActionSkillId, SeedActionSkill>(
  allActionSkills.map((actionSkill) => [actionSkill.id, actionSkill])
);

export function getSeedActionSkill(id: SeedActionSkillId): SeedActionSkill {
  const actionSkill = actionSkillById.get(id);

  if (!actionSkill) {
    throw new Error(`Unknown seed action skill: ${id}`);
  }

  return actionSkill;
}

export function listSeedActionSkills(): SeedActionSkill[] {
  return [...allActionSkills];
}

export function listImplementedSeedActionSkills(): SeedActionSkill[] {
  return allActionSkills.filter((actionSkill) => actionSkill.runtimeStatus === "implemented");
}

export function listPlannedSeedActionSkills(): SeedActionSkill[] {
  return allActionSkills.filter((actionSkill) => actionSkill.runtimeStatus === "planned");
}

export function listCoreActionSkillIds(): SeedActionSkillId[] {
  return coreActionSkills.map((actionSkill) => actionSkill.id);
}

export function listSocialActionSkillIds(): SeedActionSkillId[] {
  return socialActionSkills.map((actionSkill) => actionSkill.id);
}

export function listSurvivalUtilityActionSkillIds(): SeedActionSkillId[] {
  return survivalUtilityActionSkills.map((actionSkill) => actionSkill.id);
}

export function listHostileActionSkillIds(): SeedActionSkillId[] {
  return hostileActionSkills.map((actionSkill) => actionSkill.id);
}
