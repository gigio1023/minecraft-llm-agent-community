import type { Bot } from "mineflayer";

export type ActorId = "npc_a" | "npc_b" | "npc_c";

export type SkillProposal = {
  actorId: ActorId;
  utterance: string;
  skillName: string;
  skillDescription: string;
  skillCode: string;
};

export type CodexInputMessage = {
  role: "user" | "assistant";
  content: Array<{ type: "input_text" | "output_text"; text: string }>;
};

export type BotRecord = Record<ActorId, Bot>;

export type HelperEvent = {
  name: string;
  args: unknown[];
  result?: unknown;
  error?: string;
};

export type WorldObservation = {
  actorId: ActorId;
  name: string;
  persona: string;
  sharedGoal: string;
  position: { x: number; y: number; z: number };
  facing: { yaw: number; pitch: number };
  health: number;
  food: number;
  inventory: Array<{ name: string; count: number }>;
  nearbyEntities: Array<{ name?: string; username?: string; type: string; distance: number }>;
  nearbyBlocks: Array<{ name: string; distance: number }>;
  nearbyItems: Array<{ name?: string; type: string; distance: number }>;
  recentPublicEvents: PublicEvent[];
  episodicMemory: MemoryEntry[];
};

export type SkillExecution = {
  filePath: string;
  result: unknown;
  helperEvents: HelperEvent[];
  preObservation: WorldObservation;
  postObservation: WorldObservation;
  diff: Record<string, unknown>;
};

export type BudgetRecord = {
  calls: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
};

export type MemoryEntry = {
  turn: number;
  text: string;
};

export type PublicEvent = {
  actorId: ActorId;
  actorName: string;
  utterance: string;
  skillName?: string;
  skillDescription?: string;
  skillResult?: string;
};

export type SkillContext = {
  bot: Bot;
  bots: BotRecord;
  say(text: string): void;
  wait(ms: number): Promise<void>;
  moveForward(ms?: number): Promise<void>;
  stop(): void;
  lookAtNearestEntity(): Promise<void>;
  faceActor(actorId: ActorId): Promise<void>;
  moveTowardActor(actorId: ActorId, ms?: number): Promise<void>;
  inspectInventory(): Array<{ name: string; count: number }>;
  scanNearbyEntities(): Array<{ name: string; username?: string; type: string; distance: number }>;
  scanNearbyBlocks(): Array<{ name: string; distance: number }>;
  findNearestBlock(names: string[]): { name: string; distance: number } | null;
  digNearestBlock(names: string[]): Promise<unknown>;
  approachNearestEntityByName(name: string, ms?: number): Promise<unknown>;
  collectNearbyDroppedItem(ms?: number): Promise<unknown>;
  runSkill(name: string): Promise<unknown>;
};

export type SeedSkill = {
  name: string;
  description: string;
  run(ctx: SkillContext): Promise<unknown>;
};
