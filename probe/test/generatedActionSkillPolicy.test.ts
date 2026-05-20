import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { shouldExecuteLegacyGeneratedActionSkills } from "../src/skills/generatedLegacyPolicy.js";
import { archiveLegacyGeneratedSkills } from "../src/skills/legacy/archiveGeneratedSkills.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("keeps legacy generated TypeScript execution disabled by default", () => {
  assert.equal(shouldExecuteLegacyGeneratedActionSkills({}), false);
  assert.equal(
    shouldExecuteLegacyGeneratedActionSkills({
      ALLOW_LEGACY_GENERATED_ACTION_SKILLS: "false"
    }),
    false
  );
});

test("requires explicit opt-in before legacy generated TypeScript can execute", () => {
  assert.equal(
    shouldExecuteLegacyGeneratedActionSkills({
      ALLOW_LEGACY_GENERATED_ACTION_SKILLS: "1"
    }),
    true
  );
});

test("archives legacy generated TypeScript into actor workspace candidates", async () => {
  const rootDir = path.resolve(
    here,
    "test-artifacts",
    `legacy-generated-archive-${process.pid}-${Date.now()}`
  );
  const generatedSkillsDir = path.join(rootDir, "build", "generated-skills");
  const archiveDir = path.join(rootDir, "build", "generated-skills-archive");
  const actorWorkspaceRootDir = path.join(rootDir, "data", "actors");
  const sourcePath = path.join(generatedSkillsDir, "npc_b_collect_tree.ts");

  try {
    await fs.mkdir(generatedSkillsDir, { recursive: true });
    await fs.writeFile(
      sourcePath,
      "export async function run(ctx) { return ctx.collectLogs(); }\n",
      "utf8"
    );

    const archived = await archiveLegacyGeneratedSkills({
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
    assert.equal(proposal.legacy_generated_code_language, "typescript");
    assert.match(proposal.success_verifier, /requires_recipe_conversion/);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
