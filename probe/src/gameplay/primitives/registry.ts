// Runtime primitives are the small action boundaries the loop can validate,
// execute, and record. Seed action skills compose these; they should not add
// new behavior unless the primitive list can expose an observable boundary.
export const runtimePrimitives = [
  { id: "observe", category: "sensing" },
  { id: "move_to", category: "movement" },
  { id: "collect_logs", category: "gathering" },
  { id: "mine_block", category: "gathering" },
  { id: "craft_item", category: "crafting" },
  { id: "craft_with_table", category: "crafting" },
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
