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
import { readRelationshipEdge } from "../src/npc/relationships/relationshipStore.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const testArtifactRoot = path.resolve(
  here,
  "test-artifacts",
  `actor-workspace-${process.pid}-${Date.now()}`
);

test("initializes actor workspaces without deleting existing actor artifacts", async () => {
  const keepPath = path.join(
    testArtifactRoot,
    "npc_b",
    "action-skills",
    "candidates",
    "keep.json"
  );

  await fs.mkdir(path.dirname(keepPath), { recursive: true });
  await fs.writeFile(keepPath, "{\"kept\":true}\n", "utf8");
  const staleEvidencePath = path.join(testArtifactRoot, "npc_b", "evidence", "stale.json");
  const staleProviderInputPath = path.join(testArtifactRoot, "npc_b", "provider-inputs", "turn-0001.json");
  const staleProviderOutputPath = path.join(testArtifactRoot, "npc_b", "provider-outputs", "turn-0001.json");
  const staleActiveSkillPath = path.join(
    testArtifactRoot,
    "npc_b",
    "action-skills",
    "active",
    "craftCraftingTable.json"
  );
  await fs.mkdir(path.dirname(staleEvidencePath), { recursive: true });
  await fs.mkdir(path.dirname(staleProviderInputPath), { recursive: true });
  await fs.mkdir(path.dirname(staleProviderOutputPath), { recursive: true });
  await fs.mkdir(path.dirname(staleActiveSkillPath), { recursive: true });
  await fs.writeFile(staleEvidencePath, "{\"category\":\"stale_failure\"}\n", "utf8");
  await fs.writeFile(staleProviderInputPath, "{\"turn_id\":\"stale\"}\n", "utf8");
  await fs.writeFile(staleProviderOutputPath, "{\"turn_id\":\"stale\"}\n", "utf8");
  await fs.writeFile(
    path.join(testArtifactRoot, "npc_b", "action-skills", "index.json"),
    JSON.stringify({
      schema: "action-skill-library/v1",
      owner_actor_id: "npc_b",
      initialized_at: "2026-05-19T00:00:00.000Z",
      active: ["craftCraftingTable"],
      candidates: ["keep"],
      retired: ["oldShelterTrial"],
      rejected: ["unsafeDigTrial"]
    }, null, 2),
    "utf8"
  );
  await fs.writeFile(
    staleActiveSkillPath,
    JSON.stringify({
      schema: "actor-action-skill/v1",
      skill_id: "craftCraftingTable",
      owner_actor_id: "npc_b",
      source_kind: "seed",
      status: "active",
      created_at: "2026-05-19T00:00:00.000Z",
      updated_at: "2026-05-19T00:00:00.000Z",
      required_primitives: ["observe", "craft_item", "wait"],
      preconditions: ["inventory has planks"],
      success_verifier: "runtime verifier for craftCraftingTable",
      known_failure_modes: [],
      evidence_refs: [],
      review_refs: []
    }, null, 2),
    "utf8"
  );

  try {
    const result = await initializeActorWorkspaces({
      rootDir: testArtifactRoot,
      initializedAt: "2026-05-20T00:00:00.000Z",
      actors: [
        {
          actor_id: "npc_b",
          username: "npc_b",
          role_id: "gatherer"
        },
        {
          actor_id: "npc_a",
          username: "npc_a",
          role_id: "quartermaster"
        }
      ],
      seedActionSkillOwnership: [
        {
          skill_id: "collectLogs",
          owner_actor_id: "npc_b",
          source_kind: "seed",
          status: "active",
          supersession: null
        }
      ]
    });

    assert.equal(result.actors.length, 2);
    assert.equal(await fs.readFile(keepPath, "utf8"), "{\"kept\":true}\n");

    const actorFile = JSON.parse(
      await fs.readFile(path.join(testArtifactRoot, "npc_b", "actor.json"), "utf8")
    );
    assert.equal(actorFile.schema, "actor-workspace/v1");
    assert.equal(actorFile.actor_id, "npc_b");
    assert.equal(actorFile.actor_profile.display_name, "Jun");
    assert.equal(actorFile.actor_profile.gameplay_role, "settler");
    assert.equal(actorFile.action_skill_library, "action-skills/index.json");

    const paths = getActorWorkspacePaths(testArtifactRoot, "npc_b");
    const actionSkillIndex = JSON.parse(
      await fs.readFile(
        paths.actionSkills.indexFile,
        "utf8"
      )
    );
    assert.equal(actionSkillIndex.schema, "action-skill-library/v1");
    assert.deepEqual(actionSkillIndex.active, ["collectLogs"]);
    assert.deepEqual(actionSkillIndex.candidates, ["keep"]);
    assert.deepEqual(actionSkillIndex.retired, ["oldShelterTrial"]);
    assert.deepEqual(actionSkillIndex.rejected, ["unsafeDigTrial"]);

    const activeRecords = await listActiveActorActionSkillRecords(testArtifactRoot, "npc_b");
    assert.deepEqual(activeRecords, [
      {
        schema: "actor-action-skill/v1",
        skill_id: "collectLogs",
        owner_actor_id: "npc_b",
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
    await fs.access(paths.memory.workingDir);
    await fs.access(paths.memory.episodicDir);
    await fs.access(paths.memory.semanticDir);
    await fs.access(paths.memory.proceduralDir);
    await fs.access(paths.memory.socialDir);
    await fs.access(paths.memory.beliefsDir);
    await fs.access(paths.memory.guardrailsDir);
    await fs.access(paths.memory.indexDir);
    await fs.access(paths.evidenceDir);
    await fs.access(paths.reviewsDir);
    await fs.access(paths.relationshipsDir);
    const relationshipEdge = await readRelationshipEdge(testArtifactRoot, "npc_a", "npc_b");
    assert.equal(relationshipEdge.from_actor_id, "npc_a");
    assert.equal(relationshipEdge.to_actor_id, "npc_b");
    assert.equal(relationshipEdge.trust, "unproven");
    assert.equal(relationshipEdge.friction, "none");
    await fs.access(paths.providerInputsDir);
    await fs.access(paths.providerOutputsDir);
    assert.equal(await fs.readFile(staleEvidencePath, "utf8"), "{\"category\":\"stale_failure\"}\n");
    assert.equal(await fs.readFile(staleProviderInputPath, "utf8"), "{\"turn_id\":\"stale\"}\n");
    assert.equal(await fs.readFile(staleProviderOutputPath, "utf8"), "{\"turn_id\":\"stale\"}\n");
    await fs.access(path.join(testArtifactRoot, "index.json"));
  } finally {
    await fs.rm(testArtifactRoot, { recursive: true, force: true });
  }
});
