import type { RuntimePrimitiveId } from "../primitives/registry.js";
import type { SeedActionSkillId } from "./registry.js";

export type ActionSkillVerificationContract = {
  skillId: SeedActionSkillId;
  primitiveIds: RuntimePrimitiveId[];
  evidence: string[];
  protectedBy: string[];
  liveProbe?: string;
};

// These contracts are the test-facing mirror of implemented seed action
// skills. They intentionally describe observable Mineflayer/runtime boundaries
// instead of persona intent, because live failures usually come from an action
// that "looked attempted" without producing inventory, distance, chat, storage,
// or memory evidence.
export const actionSkillVerificationContracts: ActionSkillVerificationContract[] = [
  {
    skillId: "runtimeObserveAndRemember",
    primitiveIds: ["observe", "wait", "remember"],
    evidence: [
      "observation snapshot is available to the provider",
      "wait resolves with positive ticks and bounded duration evidence",
      "memory note is persisted in runtime memory"
    ],
    protectedBy: ["test/runtimeLogic.test.ts", "test/transcript.test.ts"]
  },
  {
    skillId: "collectLogs",
    primitiveIds: ["observe", "collect_logs", "wait"],
    evidence: [
      "candidate log block is selected from live block search",
      "pathfinder movement does not drift farther from the selected log",
      "Mineflayer dig promise resolves without interruption",
      "log inventory count increases after dig or nearby drop pickup"
    ],
    protectedBy: ["test/collectLogs.test.ts"],
    liveProbe: "bun run src/cli.ts --npcs 1 --max-actions 20 --observe-ms 120000"
  },
  {
    skillId: "craftPlanksAndSticks",
    primitiveIds: ["observe", "craft_item", "wait"],
    evidence: [
      "craft target resolves to a concrete Mineflayer item id",
      "recipesFor returns an available inventory recipe",
      "bot.craft is awaited before crafted inventory evidence is reported",
      "crafted result is blocked when available inventory counts do not increase"
    ],
    protectedBy: ["test/craftItem.test.ts", "test/agentLoop.phase1.test.ts"]
  },
  {
    skillId: "craftCraftingTable",
    primitiveIds: ["observe", "craft_item", "wait"],
    evidence: [
      "crafting_table exists in registry",
      "inventory recipe is available without an existing crafting table",
      "bot.craft is awaited before success is returned",
      "crafted result is blocked when available inventory counts do not increase"
    ],
    protectedBy: ["test/craftItem.test.ts", "test/agentLoop.phase1.test.ts"]
  },
  {
    skillId: "inspectSharedChest",
    primitiveIds: ["observe", "inspect_chest", "wait"],
    evidence: [
      "shared chest accessor returns item counts",
      "ledger-backed storage observation is included in runtime state",
      "inspect result carries actor id, chest id, and positive ledger sequence"
    ],
    protectedBy: ["test/sharedChest.test.ts", "test/liveSharedChest.test.ts"]
  },
  {
    skillId: "depositSharedItems",
    primitiveIds: ["observe", "inspect_chest", "deposit_shared", "wait"],
    evidence: [
      "role deposit rules allow the item",
      "deposit operation moves a positive item count",
      "storage ledger records the contribution",
      "deposit result carries actor id, chest id, and positive ledger sequence"
    ],
    protectedBy: ["test/sharedChest.test.ts", "test/sharedChest.integration.test.ts"]
  },
  {
    skillId: "approachAndRequestItem",
    primitiveIds: ["observe", "move_to", "say", "wait"],
    evidence: [
      "move_to reports measured before/after distance",
      "pathfinder timeout is bounded and stopped",
      "say result records delivered target and text evidence"
    ],
    protectedBy: ["test/runtimeLogic.test.ts", "test/agentLoop.phase1.test.ts"]
  },
  {
    skillId: "announceResourceDiscovery",
    primitiveIds: ["observe", "say", "remember"],
    evidence: [
      "resource announcement is sent through runtime chat",
      "say result records delivered target and resource-discovery text evidence",
      "resource note is persisted for future provider context"
    ],
    protectedBy: ["test/runtimeLogic.test.ts", "test/transcript.test.ts"]
  },
  {
    skillId: "handoffItemAtChest",
    primitiveIds: ["observe", "inspect_chest", "deposit_shared", "say", "wait"],
    evidence: [
      "deposit operation moves a positive item count into shared storage",
      "ledger links contribution to actor and task",
      "say result records delivered target and handoff text evidence"
    ],
    protectedBy: ["test/sharedChest.test.ts", "test/sharedChest.integration.test.ts"]
  },
  {
    skillId: "waitForBusyCrafter",
    primitiveIds: ["observe", "wait", "say"],
    evidence: [
      "busy state is treated as a valid defer signal",
      "busy say result records actor and target evidence",
      "wait completes with positive ticks and bounded duration evidence",
      "follow-up say result records delivered target and text evidence"
    ],
    protectedBy: ["test/runtimeLogic.test.ts", "test/mutualSocialRuntime.test.ts"]
  }
];

export function getActionSkillVerificationContract(skillId: SeedActionSkillId) {
  const contract = actionSkillVerificationContracts.find((entry) => entry.skillId === skillId);

  if (!contract) {
    throw new Error(`Missing action skill verification contract: ${skillId}`);
  }

  return contract;
}
