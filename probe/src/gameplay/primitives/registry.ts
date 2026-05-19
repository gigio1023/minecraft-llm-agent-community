export const runtimePrimitives = [
  { id: "observe", category: "sensing" },
  { id: "move_to", category: "movement" },
  { id: "collect_logs", category: "gathering" },
  { id: "craft_item", category: "crafting" },
  { id: "inspect_chest", category: "storage" },
  { id: "deposit_shared", category: "storage" },
  { id: "withdraw_shared", category: "storage" },
  { id: "say", category: "social" },
  { id: "wait", category: "control" },
  { id: "remember", category: "memory" }
] as const;

export type RuntimePrimitive = (typeof runtimePrimitives)[number];
export type RuntimePrimitiveId = RuntimePrimitive["id"];

export const runtimePrimitiveIds = runtimePrimitives.map((primitive) => primitive.id) as RuntimePrimitiveId[];

export function getRuntimePrimitive(id: string): RuntimePrimitive {
  const primitive = runtimePrimitives.find((entry) => entry.id === id);

  if (!primitive) {
    throw new Error(`Unknown runtime primitive: ${id}`);
  }

  return primitive;
}
