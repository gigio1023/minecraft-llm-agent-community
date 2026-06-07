import type { MinecraftBasicGuideProjection } from "./types.js";

export function buildMinecraftBasicGuideProjection(): MinecraftBasicGuideProjection {
  return {
    schema: "minecraft-basic-guide/v1",
    guide_ref: "project-docs/Architecture/Minecraft-Basic-Guide.md",
    item_flows: [
      "log -> matching planks -> sticks",
      "four planks -> crafting_table item",
      "crafting_table item itself is an inventory-grid recipe; use craft_item or a crafting-table action skill, not craft_with_table",
      "wooden_pickaxe needs planks, sticks, and reachable placed crafting_table"
    ],
    station_requirements: [
      "inventory 2x2 can craft planks, sticks, and crafting_table",
      "table-sized recipes require a reachable crafting_table world block",
      "inventory station items are not usable stations until placed"
    ],
    blocker_recovery_guides: [
      "missing prerequisite should pivot to the nearest executable prerequisite action",
      "occupied placement target should pick another explicit adjacent valid cell",
      "repeated exact blocker should repair parameters or choose a different action"
    ],
    observe_stop_guides: [
      "do not repeat observe when the same scan and inventory already explain the blocker",
      "observe is useful when it can reveal new reachable evidence or after movement"
    ]
  };
}
