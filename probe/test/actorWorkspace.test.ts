import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { initializeActorWorkspaces } from "../src/runtime/actorWorkspace.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const testArtifactRoot = path.resolve(
  here,
  "test-artifacts",
  `actor-workspace-${process.pid}-${Date.now()}`
);

test("initializes actor workspaces without deleting existing actor artifacts", async () => {
  const keepPath = path.join(
    testArtifactRoot,
    "npc_a",
    "action-skills",
    "candidates",
    "keep.json"
  );

  await fs.mkdir(path.dirname(keepPath), { recursive: true });
  await fs.writeFile(keepPath, "{\"kept\":true}\n", "utf8");

  try {
    const result = await initializeActorWorkspaces({
      rootDir: testArtifactRoot,
      initializedAt: "2026-05-20T00:00:00.000Z",
      actors: [
        {
          actor_id: "npc_a",
          username: "npc_a",
          role_id: "gatherer"
        }
      ],
      seedActionSkillOwnership: [
        {
          skill_id: "collectLogs",
          owner_actor_id: "npc_a",
          source_kind: "seed",
          status: "active",
          supersession: null
        }
      ]
    });

    assert.equal(result.actors.length, 1);
    assert.equal(await fs.readFile(keepPath, "utf8"), "{\"kept\":true}\n");

    const actorFile = JSON.parse(
      await fs.readFile(path.join(testArtifactRoot, "npc_a", "actor.json"), "utf8")
    );
    assert.equal(actorFile.schema, "actor-workspace/v1");
    assert.equal(actorFile.actor_id, "npc_a");
    assert.equal(actorFile.action_skill_library, "action-skills/index.json");

    const actionSkillIndex = JSON.parse(
      await fs.readFile(
        path.join(testArtifactRoot, "npc_a", "action-skills", "index.json"),
        "utf8"
      )
    );
    assert.equal(actionSkillIndex.schema, "action-skill-library/v1");
    assert.deepEqual(actionSkillIndex.active_seed_action_skills, [
      {
        skill_id: "collectLogs",
        owner_actor_id: "npc_a",
        source_kind: "seed",
        status: "active",
        supersession: null
      }
    ]);

    await fs.access(path.join(testArtifactRoot, "npc_a", "action-skills", "active"));
    await fs.access(path.join(testArtifactRoot, "npc_a", "action-skills", "retired"));
    await fs.access(path.join(testArtifactRoot, "npc_a", "memory"));
    await fs.access(path.join(testArtifactRoot, "npc_a", "evidence"));
    await fs.access(path.join(testArtifactRoot, "index.json"));
  } finally {
    await fs.rm(testArtifactRoot, { recursive: true, force: true });
  }
});
