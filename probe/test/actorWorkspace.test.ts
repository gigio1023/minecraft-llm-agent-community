import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  initializeActorWorkspaces,
  listActiveActorActionSkillRecords
} from "../src/runtime/actorWorkspace.js";
import {
  getActorPlanBeadEventLogPath,
  getActorPlanBeadHistorySnapshotPath,
  getActorPlanBeadRecordPath,
  getActorWorkspacePaths,
  sanitizeWorkspaceFileId
} from "../src/runtime/actorWorkspacePaths.js";
import { readRelationshipEdge } from "../src/npc/relationships/relationshipStore.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const testArtifactRoot = path.resolve(
  here,
  "test-artifacts",
  `actor-workspace-${process.pid}-${Date.now()}`
);

test("workspace file ids are sanitized and bounded for filesystem limits", () => {
  const id = `cycle-0009-${"blocked_actionintent_args_contract_failed_move_to_requires_structured_args_".repeat(8)}`;
  const sanitized = sanitizeWorkspaceFileId(id);
  assert.equal(/^[a-zA-Z0-9_.-]+$/.test(sanitized), true);
  assert.equal(sanitized.length <= 120, true);
  assert.match(sanitized, /-[a-f0-9]{12}$/);
});

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
  const preExistingPaths = getActorWorkspacePaths(testArtifactRoot, "npc_b");
  const stalePlanBeadPath = getActorPlanBeadRecordPath(
    testArtifactRoot,
    "npc_b",
    "concern:A"
  );
  const stalePlanBeadEventPath = getActorPlanBeadEventLogPath(
    testArtifactRoot,
    "npc_b",
    "concern:A"
  );
  const stalePlanBeadHistoryPath = getActorPlanBeadHistorySnapshotPath(
    testArtifactRoot,
    "npc_b",
    "concern:A",
    1,
    "startup"
  );
  await fs.mkdir(path.dirname(staleEvidencePath), { recursive: true });
  await fs.mkdir(path.dirname(staleProviderInputPath), { recursive: true });
  await fs.mkdir(path.dirname(staleProviderOutputPath), { recursive: true });
  await fs.mkdir(path.dirname(staleActiveSkillPath), { recursive: true });
  await fs.mkdir(path.dirname(stalePlanBeadPath), { recursive: true });
  await fs.mkdir(path.dirname(preExistingPaths.planBeads.dependenciesFile), { recursive: true });
  await fs.mkdir(path.dirname(stalePlanBeadEventPath), { recursive: true });
  await fs.mkdir(path.dirname(stalePlanBeadHistoryPath), { recursive: true });
  await fs.mkdir(path.dirname(preExistingPaths.planBeads.readyCacheFile), { recursive: true });
  await fs.writeFile(staleEvidencePath, "{\"category\":\"stale_failure\"}\n", "utf8");
  await fs.writeFile(staleProviderInputPath, "{\"turn_id\":\"stale\"}\n", "utf8");
  await fs.writeFile(staleProviderOutputPath, "{\"turn_id\":\"stale\"}\n", "utf8");
  await fs.writeFile(stalePlanBeadPath, "{\"schema\":\"actor-plan-bead/v1\"}\n", "utf8");
  await fs.writeFile(
    preExistingPaths.planBeads.dependenciesFile,
    "{\"schema\":\"actor-plan-bead-dependency/v1\"}\n",
    "utf8"
  );
  await fs.writeFile(stalePlanBeadEventPath, "{\"schema\":\"plan-bead-event/v1\"}\n", "utf8");
  await fs.writeFile(stalePlanBeadHistoryPath, "{\"schema\":\"plan-bead-history/v1\"}\n", "utf8");
  await fs.writeFile(preExistingPaths.planBeads.readyCacheFile, "{\"stale\":true}\n", "utf8");
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
    await fs.access(paths.planBeads.rootDir);
    await fs.access(paths.planBeads.beadsDir);
    await fs.access(paths.planBeads.dependenciesDir);
    await fs.access(paths.planBeads.eventsDir);
    await fs.access(paths.planBeads.historyDir);
    await fs.access(paths.planBeads.indexesDir);
    assert.equal(paths.planBeads.dependenciesFile, preExistingPaths.planBeads.dependenciesFile);
    assert.equal(paths.planBeads.readyCacheFile, preExistingPaths.planBeads.readyCacheFile);
    assert.equal(await fs.readFile(staleEvidencePath, "utf8"), "{\"category\":\"stale_failure\"}\n");
    assert.equal(await fs.readFile(staleProviderInputPath, "utf8"), "{\"turn_id\":\"stale\"}\n");
    assert.equal(await fs.readFile(staleProviderOutputPath, "utf8"), "{\"turn_id\":\"stale\"}\n");
    assert.equal(await fs.readFile(stalePlanBeadPath, "utf8"), "{\"schema\":\"actor-plan-bead/v1\"}\n");
    assert.equal(
      await fs.readFile(preExistingPaths.planBeads.dependenciesFile, "utf8"),
      "{\"schema\":\"actor-plan-bead-dependency/v1\"}\n"
    );
    assert.equal(
      await fs.readFile(stalePlanBeadEventPath, "utf8"),
      "{\"schema\":\"plan-bead-event/v1\"}\n"
    );
    assert.equal(
      await fs.readFile(stalePlanBeadHistoryPath, "utf8"),
      "{\"schema\":\"plan-bead-history/v1\"}\n"
    );
    assert.equal(
      await fs.readFile(preExistingPaths.planBeads.readyCacheFile, "utf8"),
      "{\"stale\":true}\n"
    );
    await fs.access(path.join(testArtifactRoot, "index.json"));
  } finally {
    await fs.rm(testArtifactRoot, { recursive: true, force: true });
  }
});
