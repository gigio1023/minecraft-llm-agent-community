import minecraftData from "minecraft-data";

export const DEFAULT_CAPABILITY_MC_VERSION = "1.21.11";

const mcData = minecraftData(DEFAULT_CAPABILITY_MC_VERSION);

export function normalizeMinecraftId(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("minecraft:") ? trimmed.slice("minecraft:".length) : trimmed;
}

export function isKnownMinecraftItem(id: string): boolean {
  const normalized = normalizeMinecraftId(id);
  return normalized.length > 0 && mcData.itemsByName[normalized] !== undefined;
}

export function isKnownMinecraftBlock(id: string): boolean {
  const normalized = normalizeMinecraftId(id);
  return normalized.length > 0 && mcData.blocksByName[normalized] !== undefined;
}

export function isKnownMinecraftItemOrBlock(id: string): boolean {
  return isKnownMinecraftItem(id) || isKnownMinecraftBlock(id);
}
