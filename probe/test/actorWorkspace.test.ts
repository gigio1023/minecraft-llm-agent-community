import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  initializeActorWorkspaces,
  listActiveActorActionSkillRecords
} from "../src/runtime/actorWorkspace.js";
import { getActorWorkspacePaths } from "../src/runtime/actorWorkspacePaths.js";

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

    const paths = getActorWorkspacePaths(testArtifactRoot, "npc_a");
    const actionSkillIndex = JSON.parse(
      await fs.readFile(
        paths.actionSkills.indexFile,
        "utf8"
      )
    );
    assert.equal(actionSkillIndex.schema, "action-skill-library/v1");
    assert.deepEqual(actionSkillIndex.active, ["collectLogs"]);

    const activeRecords = await listActiveActorActionSkillRecords(testArtifactRoot, "npc_a");
    assert.deepEqual(activeRecords, [
      {
        schema: "actor-action-skill/v1",
        skill_id: "collectLogs",
        owner_actor_id: "npc_a",
        source_kind: "seed",
        status: "active",
        created_at: "2026-05-20T00:00:00.000Z",
        updated_at: "2026-05-20T00:00:00.000Z",
        required_primitives: ["observe", "collect_logs", "wait"],
        preconditions: [],
        success_verifier: "runtime verifier for collectLogs",
        known_failure_modes: [],
        evidence_refs: [],
        review_refs: [],
        notes: "Mine nearby trees to gather logs"
      }
    ]);

    await fs.access(paths.actionSkills.activeDir);
    await fs.access(paths.actionSkills.candidatesDir);
    await fs.access(paths.actionSkills.retiredDir);
    await fs.access(paths.actionSkills.rejectedDir);
    await fs.access(paths.memoryDir);
    await fs.access(paths.evidenceDir);
    await fs.access(paths.reviewsDir);
    await fs.access(paths.providerInputsDir);
    await fs.access(path.join(testArtifactRoot, "index.json"));
  } finally {
    await fs.rm(testArtifactRoot, { recursive: true, force: true });
  }
});
