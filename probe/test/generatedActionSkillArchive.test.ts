/** Regression coverage for archived generated action skill records. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { archiveGeneratedSkills } from "../src/skills/archive/archiveGeneratedSkills.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("archives generated TypeScript into actor workspace candidates", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `generated-source-archive-${process.pid}-${Date.now()}`
  );
  const generatedSkillsDir = path.join(rootDir, "build", "generated-skills");
  const archiveDir = path.join(rootDir, "build", "generated-skills-archive");
  const actorWorkspaceRootDir = path.join(rootDir, "data", "actors");
  const sourcePath = path.join(generatedSkillsDir, "npc_b_collect_tree.ts");

  try {
    await fs.mkdir(generatedSkillsDir, { recursive: true });
    await fs.writeFile(
      sourcePath,
      "export async function run(ctx, params) { return ctx.collectLogs(); }\n",
      "utf8"
    );

    const archived = await archiveGeneratedSkills({
      generatedSkillsDir,
      archiveDir,
      actorWorkspaceRootDir,
      actorId: "npc_b",
      archivedAt: "2026-05-20T00:00:00.000Z"
    });

    assert.equal(archived.length, 1);
    await assert.rejects(() => fs.access(sourcePath));
    await fs.access(archived[0].archivePath);
    const proposal = JSON.parse(await fs.readFile(archived[0].proposalPath, "utf8"));
    assert.equal(proposal.schema, "action-skill-proposal/v1");
    assert.equal(proposal.owner_actor_id, "npc_b");
    assert.equal(proposal.generated_source_language, "typescript");
    assert.match(proposal.generated_source, /collectLogs/);
    assert.match(proposal.success_verifier, /requires_recipe_conversion/);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
