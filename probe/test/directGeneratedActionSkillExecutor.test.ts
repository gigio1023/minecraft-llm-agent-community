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
      }) {
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
        export async function run(ctx) { return fs; }
      `),
    /blocked API/
  );
});

test("direct generated action skill executor reports timeout", async () => {
  const result = await runDirectGeneratedActionSkill({
    actorId: "npc_b",
    skillName: "slowSkill",
    timeoutMs: 5,
    source: `
      export async function run(ctx: { wait(ms: number): Promise<void> }) {
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
