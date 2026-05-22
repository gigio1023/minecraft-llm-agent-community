import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  actionSkillPostconditionSpecs,
  buildSkillProbeActionSkillRecords,
  loadSkillProbeContract,
  validateSkillProbeConfig,
  validateProbePostcondition,
  type ActionSkillProbeConfig
} from "../src/runtime/actionSkillProbeRunner.js";
import {
  listImplementedSeedActionSkills
} from "../src/gameplay/seedSkills/registry.js";

async function writeTranscriptPayload(payload: unknown) {
  const dir = await mkdtemp(path.join(tmpdir(), "action-skill-probe-"));
  const transcriptPath = path.join(dir, "transcript.json");
  await writeFile(transcriptPath, JSON.stringify(payload));
  return transcriptPath;
}

test("actionSkillProbeRunner builds active records restricted to the target skill primitives", () => {
  const baseConfig: ActionSkillProbeConfig = {
    actorId: "npc_a",
    skillId: "collectLogs",
    roleId: "gatherer",
    maxActions: 1
  };

  const records = buildSkillProbeActionSkillRecords(baseConfig);

  assert.equal(records.length, 2);

  const collectLogsRecord = records.find((r) => r.skill_id === "collectLogs");
  assert.ok(collectLogsRecord);
  assert.equal(collectLogsRecord.status, "active");
  assert.equal(collectLogsRecord.owner_actor_id, "npc_a");
  assert.ok(collectLogsRecord.required_primitives.includes("collect_logs"));
  assert.ok(collectLogsRecord.required_primitives.includes("observe"));
});

test("actionSkillProbeRunner includes runtimeObserveAndRemember for loop termination", () => {
  const records = buildSkillProbeActionSkillRecords({
    actorId: "npc_a",
    skillId: "collectLogs",
    roleId: "gatherer",
    maxActions: 1
  });
  const baseline = records.find((r) => r.skill_id === "runtimeObserveAndRemember");

  assert.ok(baseline);
  assert.ok(baseline.required_primitives.includes("observe"));
  assert.ok(baseline.required_primitives.includes("wait"));
  assert.ok(baseline.required_primitives.includes("remember"));
});

test("actionSkillProbeRunner does not duplicate runtimeObserveAndRemember when probing it directly", () => {
  const config: ActionSkillProbeConfig = {
    actorId: "npc_a",
    skillId: "runtimeObserveAndRemember",
    roleId: "gatherer",
    maxActions: 1
  };

  const records = buildSkillProbeActionSkillRecords(config);
  assert.equal(records.length, 1);
  assert.equal(records[0].skill_id, "runtimeObserveAndRemember");
});

test("actionSkillProbeRunner throws for planned unimplemented skills", () => {
  const config: ActionSkillProbeConfig = {
    actorId: "npc_a",
    skillId: "craftWoodenPickaxe",
    roleId: "crafter",
    maxActions: 1
  };

  assert.throws(() => buildSkillProbeActionSkillRecords(config), /not "implemented"/);
});

test("actionSkillProbeRunner throws when the role is not valid for the skill", () => {
  const config: ActionSkillProbeConfig = {
    actorId: "npc_a",
    skillId: "collectLogs",
    roleId: "crafter",
    maxActions: 1
  };

  assert.throws(() => buildSkillProbeActionSkillRecords(config), /not valid for role/);
});

test("actionSkillProbeRunner returns the verification contract and allowed primitives for collectLogs", () => {
  const { contract, allowedPrimitives } = loadSkillProbeContract("collectLogs");

  assert.equal(contract.skillId, "collectLogs");
  assert.ok(contract.evidence.length > 0);
  assert.ok(allowedPrimitives.includes("collect_logs"));
  assert.ok(allowedPrimitives.includes("observe"));
  assert.ok(allowedPrimitives.includes("wait"));
  assert.ok(allowedPrimitives.includes("remember"));
});

test("actionSkillProbeRunner returns contract for craftPlanksAndSticks", () => {
  const { contract, allowedPrimitives } = loadSkillProbeContract("craftPlanksAndSticks");

  assert.equal(contract.skillId, "craftPlanksAndSticks");
  assert.ok(allowedPrimitives.includes("craft_item"));
  assert.ok(allowedPrimitives.includes("observe"));
});

test("actionSkillProbeRunner always includes observe, wait, remember in allowed primitives", () => {
  const { allowedPrimitives } = loadSkillProbeContract("collectLogs");

  assert.ok(allowedPrimitives.includes("observe"));
  assert.ok(allowedPrimitives.includes("wait"));
  assert.ok(allowedPrimitives.includes("remember"));
});

test("actionSkillProbeRunner accepts a valid config for an implemented skill", () => {
  assert.doesNotThrow(() =>
    validateSkillProbeConfig({
      actorId: "npc_a",
      skillId: "collectLogs",
      roleId: "gatherer",
      maxActions: 1
    })
  );
});

test("actionSkillProbeRunner throws for empty actorId", () => {
  assert.throws(
    () =>
      validateSkillProbeConfig({
        actorId: "",
        skillId: "collectLogs",
        roleId: "gatherer",
        maxActions: 1
      }),
    /--actor is required/
  );
});

test("actionSkillProbeRunner throws for empty skillId", () => {
  assert.throws(
    () =>
      validateSkillProbeConfig({
        actorId: "npc_a",
        skillId: "" as any,
        roleId: "gatherer",
        maxActions: 1
      }),
    /--skill is required/
  );
});

test("actionSkillProbeRunner throws for a planned skill", () => {
  assert.throws(
    () =>
      validateSkillProbeConfig({
        actorId: "npc_a",
        skillId: "craftWoodenPickaxe",
        roleId: "crafter",
        maxActions: 1
      }),
    /planned but not implemented/
  );
});

test("actionSkillProbeRunner throws for maxActions less than 1", () => {
  assert.throws(
    () =>
      validateSkillProbeConfig({
        actorId: "npc_a",
        skillId: "collectLogs",
        roleId: "gatherer",
        maxActions: 0
      }),
    /--max-actions must be at least 1/
  );
});

test("action skill probe postcondition rejects craft completion without passed verification", async () => {
  const transcriptPath = await writeTranscriptPayload({
      steps: [
        {
          tool: "craft_item",
          result: { status: "crafted", itemName: "crafting_table" },
          verification: { status: "progressing" }
        },
        {
          tool: "remember",
          result: { status: "remembered", note: "looks done" }
        }
      ]
    });

  const failure = await validateProbePostcondition("craftCraftingTable", transcriptPath);

  assert.match(failure ?? "", /crafting table inventory evidence/);
});

test("action skill probe postcondition rejects passed craft verification without required output evidence", async () => {
  const craftingTableTranscript = await writeTranscriptPayload({
      steps: [
        {
          tool: "craft_item",
          result: { status: "crafted", itemName: "stick" },
          verification: {
            status: "passed",
            progress: {
              itemNames: ["stick"],
              beforeCount: 0,
              afterCount: 4,
              targetCount: 2
            }
          }
        }
      ]
    });

  const planksAndSticksTranscript = await writeTranscriptPayload({
      steps: [
        {
          tool: "craft_item",
          result: { status: "crafted", itemName: "planks" },
          verification: {
            status: "passed",
            progress: {
              outputs: [
                { itemNames: ["oak_planks"], beforeCount: 0, afterCount: 4, targetCount: 4 }
              ]
            }
          }
        }
      ]
    });

  assert.match(
    await validateProbePostcondition("craftCraftingTable", craftingTableTranscript) ?? "",
    /crafting table inventory evidence/
  );
  assert.match(
    await validateProbePostcondition("craftPlanksAndSticks", planksAndSticksTranscript) ?? "",
    /plank and stick inventory evidence/
  );
});

test("action skill probe postcondition accepts shared storage movement evidence", async () => {
  const transcriptPath = await writeTranscriptPayload({
      steps: [
        {
          tool: "deposit_shared",
          result: { status: "deposited", movedCount: 1, itemName: "crafting_table" }
        },
        {
          tool: "remember",
          result: { status: "remembered", note: "done" }
        }
      ]
    });

  const failure = await validateProbePostcondition("depositSharedItems", transcriptPath);

  assert.equal(failure, null);
});

test("action skill probe postcondition rejects weak shared storage evidence", async () => {
  const emptyInspect = await writeTranscriptPayload({
      steps: [
        { tool: "inspect_chest", result: { status: "inspected", items: [] } }
      ]
    });
  const unnamedDeposit = await writeTranscriptPayload({
      steps: [
        { tool: "deposit_shared", result: { status: "deposited", movedCount: 1 } }
      ]
    });
  const unnamedHandoff = await writeTranscriptPayload({
      steps: [
        { tool: "deposit_shared", result: { status: "deposited", movedCount: 1 } },
        { tool: "say", result: { status: "delivered" } }
      ]
    });

  assert.match(
    await validateProbePostcondition("inspectSharedChest", emptyInspect) ?? "",
    /item evidence/
  );
  assert.match(
    await validateProbePostcondition("depositSharedItems", unnamedDeposit) ?? "",
    /named item/
  );
  assert.match(
    await validateProbePostcondition("handoffItemAtChest", unnamedHandoff) ?? "",
    /named item/
  );
});

test("action skill probe postcondition enforces ordered social evidence", async () => {
  const prematureRequest = await writeTranscriptPayload({
      steps: [
        { tool: "say", result: { status: "delivered" } },
        {
          tool: "move_to",
          result: {
            status: "arrived",
            arrived: true,
            beforeDistance: 3,
            afterDistance: 1,
            distanceDelta: 2
          }
        }
      ]
    });
  const prematureHandoff = await writeTranscriptPayload({
      steps: [
        { tool: "say", result: { status: "delivered" } },
        { tool: "deposit_shared", result: { status: "deposited", itemName: "crafting_table", movedCount: 1 } }
      ]
    });
  const prematureBusyFollowUp = await writeTranscriptPayload({
      steps: [
        { tool: "wait", result: { status: "waited" } },
        { tool: "say", result: { status: "busy" } },
        { tool: "say", result: { status: "delivered" } }
      ]
    });

  assert.match(
    await validateProbePostcondition("approachAndRequestItem", prematureRequest) ?? "",
    /after arriving/
  );
  assert.match(
    await validateProbePostcondition("handoffItemAtChest", prematureHandoff) ?? "",
    /announce the shared chest handoff/
  );
  assert.match(
    await validateProbePostcondition("waitForBusyCrafter", prematureBusyFollowUp) ?? "",
    /wait after busy response/
  );
});

test("action skill probe postcondition requires measured arrival evidence before social request", async () => {
  const unmeasuredArrival = await writeTranscriptPayload({
      steps: [
        { tool: "move_to", result: { status: "arrived", arrived: true } },
        { tool: "say", result: { status: "delivered" } }
      ]
    });

  assert.match(
    await validateProbePostcondition("approachAndRequestItem", unmeasuredArrival) ?? "",
    /measured distance evidence/
  );
});

test("action skill probe postcondition rejects empty transcripts for every implemented action skill", async () => {
  const transcriptPath = await writeTranscriptPayload({ steps: [] });

  for (const skill of listImplementedSeedActionSkills()) {
    assert.ok(actionSkillPostconditionSpecs[skill.id], `${skill.id} must declare a postcondition spec`);
    const failure = await validateProbePostcondition(skill.id, transcriptPath);
    assert.notEqual(failure, null, `${skill.id} must require explicit postcondition evidence`);
  }
});

test("action skill probe postcondition accepts spec-declared minimum evidence for every implemented action skill", async () => {
  for (const skill of listImplementedSeedActionSkills()) {
    const spec = actionSkillPostconditionSpecs[skill.id];
    assert.ok(spec, `${skill.id} must declare a postcondition spec`);
    assert.ok(spec.evidenceSummary.length > 0, `${skill.id} must summarize required evidence`);

    const transcriptPath = await writeTranscriptPayload(spec.minimumPassingTranscript);
    const failure = await validateProbePostcondition(skill.id, transcriptPath);
    assert.equal(failure, null, `${skill.id} should accept its minimum evidence payload`);
  }
});
