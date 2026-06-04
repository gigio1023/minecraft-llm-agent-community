/** Regression coverage for the generated Mineflayer program sandbox contract. */
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runMineflayerProgram } from "../src/tools/runMineflayerProgram.js";

function createTestBot(username = "npc_b", x = 0) {
  const chatMessages: string[] = [];
  const position = {
    x,
    y: 64,
    z: 0,
    distanceTo(other: { x?: number; y?: number; z?: number }) {
      return Math.hypot(
        this.x - (other.x ?? 0),
        this.y - (other.y ?? 0),
        this.z - (other.z ?? 0)
      );
    }
  };

  const bot = {
    username,
    entity: { position },
    inventory: { items: () => [] },
    registry: { foodsByName: {} },
    chat(text: string) {
      chatMessages.push(text);
    },
    setControlState() {},
    pathfinder: { stop() {} },
    stopDigging() {}
  };

  return { bot: bot as any, chatMessages };
}

test("run_mineflayer_program stores source, helper events, and post-observation evidence", async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), "run-mineflayer-program-"));
  const { bot, chatMessages } = createTestBot("npc_b", 0);
  const { bot: targetBot } = createTestBot("npc_a", 2);

  const result = await runMineflayerProgram({
    actorId: "npc_b",
    bot,
    targetBot,
    artifactDir,
    source: `
      export async function run(ctx: {
        observe(): Promise<unknown>;
        say(text: string): Promise<unknown>;
      }, params: Record<string, never>) {
        await ctx.observe();
        return ctx.say("I can report what I just saw.");
      }
    `
  });

  assert.equal(result.status, "completed_with_evidence");
  assert.equal(chatMessages[0], "I can report what I just saw.");
  assert.match(result.sourcePath ?? "", /socialCycleMineflayerProgram/);
  assert.deepEqual(
    result.helperEvents
      .filter((event: any) => event.status === "completed")
      .map((event: any) => event.name),
    ["observe", "say"]
  );
  assert.equal((result.postObservation as any).status, "ok");
});

test("run_mineflayer_program wait accepts structured duration args", async () => {
  const { bot } = createTestBot("npc_b", 0);
  const result = await runMineflayerProgram({
    actorId: "npc_b",
    bot,
    source: `
      export async function run(ctx, params) {
        await ctx.wait({ durationMs: 1 });
        return { status: "waited" };
      }
    `
  });

  assert.equal(result.status, "completed");
  assert.equal(result.errorMessage, undefined);
  assert.equal((result.helperEvents[1] as any)?.name, "wait");
  assert.equal((result.helperEvents[1] as any)?.status, "completed");
});

test("run_mineflayer_program wait rejects non-finite durations", async () => {
  const { bot } = createTestBot("npc_b", 0);
  const result = await runMineflayerProgram({
    actorId: "npc_b",
    bot,
    source: `
      export async function run(ctx, params) {
        await ctx.wait({ durationMs: "soon" });
        return { status: "waited" };
      }
    `
  });

  assert.equal(result.status, "skill_error");
  assert.match(result.errorMessage ?? "", /finite duration/);
  assert.equal((result.helperEvents[1] as any)?.name, "wait");
  assert.equal((result.helperEvents[1] as any)?.status, "failed");
});
