/** Regression coverage for direct generated action skill executor limits. */
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assertDirectGeneratedActionSkillSource,
  runDirectGeneratedActionSkill
} from "../src/generatedActionSkills/directExecutor.js";

test("direct generated action skill executor runs TypeScript and records helper calls", async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), "direct-generated-test-"));
  const inventory: Record<string, number> = {};
  const result = await runDirectGeneratedActionSkill({
    actorId: "npc_b",
    skillName: "craftStoneAxe",
    artifactDir,
    source: `
      export async function run(ctx: {
        ensureItem(name: string, count: number): Promise<{ name: string; count: number }>;
        craftWithTable(name: string, count: number): Promise<{ name: string; count: number }>;
      }, params: Record<string, never>) {
        await ctx.ensureItem("cobblestone", 3);
        await ctx.ensureItem("stick", 2);
        return ctx.craftWithTable("stone_axe", 1);
      }
    `,
    ctx: {
      async ensureItem(name: string, count: number) {
        inventory[name] = Math.max(inventory[name] ?? 0, count);
        return { name, count: inventory[name] };
      },
      async craftWithTable(name: string, count: number) {
        inventory[name] = (inventory[name] ?? 0) + count;
        return { name, count: inventory[name] };
      }
    }
  });

  assert.equal(result.status, "completed");
  assert.equal(inventory.stone_axe, 1);
  assert.equal(
    result.helperEvents
      .filter((event) => event.status === "completed")
      .map((event) => event.name)
      .join(","),
    "ensureItem,ensureItem,craftWithTable"
  );
  assert.match(result.sourcePath ?? "", /craftStoneAxe/);
});

test("direct generated action skill source guard rejects Node escape hatches", () => {
  assert.throws(
    () =>
      assertDirectGeneratedActionSkillSource(`
        import fs from "node:fs";
        export async function run(ctx, params) { return fs; }
      `),
    /blocked API/
  );
});

test("direct generated action skill source guard rejects obvious unbounded loops", () => {
  assert.throws(
    () =>
      assertDirectGeneratedActionSkillSource(`
        export async function run(ctx, params) { while (true) { await ctx.wait(100); } }
      `),
    /blocked API or obvious unbounded loop/
  );
});

test("direct generated action skill source guard requires ctx and params signature", () => {
  assert.throws(
    () =>
      assertDirectGeneratedActionSkillSource(`
        export async function run(ctx) { return ctx.observe(); }
      `),
    /run\(ctx, params\)/
  );
});

test("direct generated action skill executor passes schema-bound params", async () => {
  const result = await runDirectGeneratedActionSkill({
    actorId: "npc_b",
    skillName: "sayParam",
    source: `
      export async function run(ctx: { say(text: string): Promise<{ status: string; text: string }> }, params: { text: string }) {
        return ctx.say(params.text);
      }
    `,
    ctx: {
      async say(text: string) {
        return { status: "delivered", text };
      }
    },
    params: { text: "bring logs to the chest" },
    helperAllowlist: ["say"]
  });

  assert.equal(result.status, "completed");
  assert.deepEqual(result.result, { status: "delivered", text: "bring logs to the chest" });
  assert.equal(result.helperEvents[1]?.name, "say");
  assert.equal(result.helperEvents[1]?.status, "completed");
});

test("direct generated action skill executor enforces helper allowlist", async () => {
  const result = await runDirectGeneratedActionSkill({
    actorId: "npc_b",
    skillName: "blockedHelper",
    source: `
      export async function run(ctx: { mineBlock(args: { blockName: string }): Promise<unknown> }, params: Record<string, never>) {
        return ctx.mineBlock({ blockName: "stone" });
      }
    `,
    ctx: {
      async mineBlock(args: { blockName: string }) {
        return { status: "completed", args };
      }
    },
    helperAllowlist: ["observe"]
  });

  assert.equal(result.status, "skill_error");
  assert.match(result.errorMessage ?? "", /not in this candidate's helper_allowlist/);
  assert.equal(result.helperEvents[0]?.name, "mineBlock");
  assert.equal(result.helperEvents[0]?.status, "failed");
});

test("direct generated action skill source guard allows bounded ctx.mineflayer helper calls", () => {
  assert.doesNotThrow(() =>
    assertDirectGeneratedActionSkillSource(`
      export async function run(ctx, params) {
        return ctx.mineflayer("lookAtNearestBlock", { blockName: "chest" });
      }
    `)
  );
});

test("direct generated action skill source guard rejects unsupported ctx shapes", () => {
  for (const source of [
    `export async function run(ctx, params) { return ctx.helpers.observe({}); }`,
    `export async function run(ctx, params) { return ctx.sharedStorage.chest; }`,
    `export async function run(ctx, params) { return ctx.bot.entity.position; }`,
    `export async function run(ctx, params) { return ctx.mineflayer().activateItem(); }`
  ]) {
    assert.throws(
      () => assertDirectGeneratedActionSkillSource(source),
      /direct helper API only/
    );
  }
});

test("direct generated action skill executor reports timeout", async () => {
  const result = await runDirectGeneratedActionSkill({
    actorId: "npc_b",
    skillName: "slowSkill",
    timeoutMs: 5,
    source: `
      export async function run(ctx: { wait(ms: number): Promise<void> }, params: Record<string, never>) {
        await ctx.wait(100);
        return { status: "late" };
      }
    `,
    ctx: {
      wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
    }
  });

  assert.equal(result.status, "timeout");
});
