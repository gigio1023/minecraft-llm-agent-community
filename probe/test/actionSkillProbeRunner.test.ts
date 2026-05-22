import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  actionSkillPostconditionSpecs,
  buildSkillProbeActionSkillRecords,
  classifyActionSkillProbeOutcome,
  getActionSkillProbePreconditionMode,
  hasDeterministicActionSkillProbeDriver,
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

test("actionSkillProbeRunner requires deterministic live probe coverage for every implemented action skill", () => {
  for (const skill of listImplementedSeedActionSkills()) {
    assert.equal(
      hasDeterministicActionSkillProbeDriver(skill.id),
      true,
      `${skill.id} must have a deterministic live probe driver`
    );
    assert.ok(
      getActionSkillProbePreconditionMode(skill.id),
      `${skill.id} must declare a live probe precondition mode`
    );
  }
});

test("actionSkillProbeRunner classifies final status and postcondition evidence separately", () => {
  assert.deepEqual(
    classifyActionSkillProbeOutcome({
      final: { status: "success", why: "terminal memory reached" },
      postconditionFailure: null
    }),
    {
      status: "passed",
      finalWhy: "terminal memory reached",
      terminalStatus: "success",
      terminalWhy: "terminal memory reached",
      postconditionStatus: "passed"
    }
  );

  assert.deepEqual(
    classifyActionSkillProbeOutcome({
      final: { status: "success", why: "terminal memory reached" },
      postconditionFailure: "missing inventory evidence"
    }),
    {
      status: "failed",
      finalWhy: "missing inventory evidence",
      terminalStatus: "success",
      terminalWhy: "terminal memory reached",
      postconditionStatus: "failed",
      postconditionFailure: "missing inventory evidence",
      failureKind: "postcondition_failed"
    }
  );

  assert.deepEqual(
    classifyActionSkillProbeOutcome({
      final: { status: "failed", why: "blocked repeatedly" },
      postconditionFailure: null
    }),
    {
      status: "failed",
      finalWhy: "terminal status failed even though postcondition passed: blocked repeatedly",
      terminalStatus: "failed",
      terminalWhy: "blocked repeatedly",
      postconditionStatus: "passed",
      failureKind: "terminal_failed"
    }
  );

  assert.deepEqual(
    classifyActionSkillProbeOutcome({
      final: { status: "failed", why: "blocked repeatedly" },
      postconditionFailure: "missing inventory evidence"
    }),
    {
      status: "failed",
      finalWhy: "blocked repeatedly; postcondition: missing inventory evidence",
      terminalStatus: "failed",
      terminalWhy: "blocked repeatedly",
      postconditionStatus: "failed",
      postconditionFailure: "missing inventory evidence",
      failureKind: "terminal_and_postcondition_failed"
    }
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

test("action skill probe postcondition accepts non-oak log and plank families", async () => {
  const birchLogTranscript = await writeTranscriptPayload({
      steps: [
        {
          tool: "collect_logs",
          result: { status: "collected" },
          verification: {
            status: "passed",
            progress: {
              itemNames: ["birch_log"],
              beforeCount: 0,
              afterCount: 4,
              targetCount: 4
            }
          }
        }
      ]
    });
  const sprucePlankTranscript = await writeTranscriptPayload({
      steps: [
        {
          tool: "craft_item",
          result: { status: "crafted" },
          verification: {
            status: "passed",
            progress: {
              outputs: [
                { itemNames: ["spruce_planks"], beforeCount: 0, afterCount: 4, targetCount: 4 },
                { itemNames: ["stick"], beforeCount: 0, afterCount: 4, targetCount: 2 }
              ]
            }
          }
        }
      ]
    });

  assert.equal(await validateProbePostcondition("collectLogs", birchLogTranscript), null);
  assert.equal(await validateProbePostcondition("craftPlanksAndSticks", sprucePlankTranscript), null);
});

test("action skill probe postcondition rejects inventory evidence on the wrong tool", async () => {
  const collectEvidenceOnWait = await writeTranscriptPayload({
      steps: [
        {
          tool: "wait",
          result: { status: "waited" },
          verification: {
            status: "passed",
            progress: {
              itemNames: ["oak_log"],
              beforeCount: 0,
              afterCount: 4,
              targetCount: 4
            }
          }
        }
      ]
    });
  const craftEvidenceOnRemember = await writeTranscriptPayload({
      steps: [
        {
          tool: "remember",
          result: { status: "remembered", note: "crafted" },
          verification: {
            status: "passed",
            progress: {
              itemNames: ["crafting_table"],
              beforeCount: 0,
              afterCount: 1,
              targetCount: 1
            }
          }
        }
      ]
    });

  assert.match(
    await validateProbePostcondition("collectLogs", collectEvidenceOnWait) ?? "",
    /log inventory target evidence/
  );
  assert.match(
    await validateProbePostcondition("craftCraftingTable", craftEvidenceOnRemember) ?? "",
    /crafting table inventory evidence/
  );
});

test("action skill probe postcondition accepts shared storage movement evidence", async () => {
  const transcriptPath = await writeTranscriptPayload({
      steps: [
        {
          tool: "deposit_shared",
          result: { status: "deposited", chestId: "shared_spawn_chest", movedCount: 1, itemName: "crafting_table" }
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
        { tool: "deposit_shared", result: { status: "deposited", chestId: "shared_spawn_chest", movedCount: 1 } }
      ]
    });
  const unnamedHandoff = await writeTranscriptPayload({
      steps: [
        { tool: "deposit_shared", result: { status: "deposited", chestId: "shared_spawn_chest", movedCount: 1 } },
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

test("action skill probe postcondition rejects storage evidence without chest id", async () => {
  const inspectWithoutChestId = await writeTranscriptPayload({
      steps: [
        { tool: "inspect_chest", result: { status: "inspected", items: [{ name: "oak_log", count: 2 }] } }
      ]
    });
  const depositWithoutChestId = await writeTranscriptPayload({
      steps: [
        { tool: "deposit_shared", result: { status: "deposited", itemName: "crafting_table", movedCount: 1 } }
      ]
    });

  assert.match(
    await validateProbePostcondition("inspectSharedChest", inspectWithoutChestId) ?? "",
    /chest id/
  );
  assert.match(
    await validateProbePostcondition("depositSharedItems", depositWithoutChestId) ?? "",
    /shared storage/
  );
});

test("action skill probe postcondition rejects remember without observation snapshot", async () => {
  const weakRuntimeControl = await writeTranscriptPayload({
      steps: [
        { tool: "observe", result: { status: "ok" } },
        { tool: "remember", result: { status: "remembered", note: "observed" } }
      ]
    });

  assert.match(
    await validateProbePostcondition("runtimeObserveAndRemember", weakRuntimeControl) ?? "",
    /observation snapshot/
  );
});

test("action skill probe postcondition requires wait before runtime control memory", async () => {
  const skippedWait = await writeTranscriptPayload({
      steps: [
        { tool: "observe", result: { status: "ok", observation: { status: "ok", visibleActors: [], memory: [] } } },
        { tool: "remember", result: { status: "remembered", note: "observed" } }
      ]
    });
  const rememberedBeforeWait = await writeTranscriptPayload({
      steps: [
        { tool: "observe", result: { status: "ok", observation: { status: "ok", visibleActors: [], memory: [] } } },
        { tool: "remember", result: { status: "remembered", note: "observed" } },
        { tool: "wait", result: { status: "waited", ticks: 20 } }
      ]
    });

  assert.match(
    await validateProbePostcondition("runtimeObserveAndRemember", skippedWait) ?? "",
    /bounded wait/
  );
  assert.match(
    await validateProbePostcondition("runtimeObserveAndRemember", rememberedBeforeWait) ?? "",
    /memory note after waiting/
  );
});

test("action skill probe postcondition enforces ordered social evidence", async () => {
  const prematureRequest = await writeTranscriptPayload({
      steps: [
        { tool: "say", args: { target: "npc_target", text: "can you spare one oak log?" }, result: { status: "delivered" } },
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
        { tool: "say", args: { target: "npc_target", text: "I left a crafting table in the shared chest." }, result: { status: "delivered" } },
        { tool: "deposit_shared", result: { status: "deposited", chestId: "shared_spawn_chest", itemName: "crafting_table", movedCount: 1 } }
      ]
    });
  const prematureBusyFollowUp = await writeTranscriptPayload({
      steps: [
        { tool: "wait", result: { status: "waited" } },
        { tool: "say", args: { target: "npc_target" }, result: { status: "busy" } },
        { tool: "say", args: { target: "npc_target", text: "checking again when you are ready" }, result: { status: "delivered" } }
      ]
    });
  const prematureResourceMemory = await writeTranscriptPayload({
      steps: [
        { tool: "remember", result: { status: "remembered", note: "found oak logs near spawn" } },
        { tool: "say", args: { target: "npc_target", text: "I found oak logs near spawn." }, result: { status: "delivered" } }
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
  assert.match(
    await validateProbePostcondition("announceResourceDiscovery", prematureResourceMemory) ?? "",
    /resource memory note after announcing/
  );
});

test("action skill probe postcondition rejects delivered social chat with the wrong message intent", async () => {
  const vagueRequest = await writeTranscriptPayload({
      steps: [
        {
          tool: "move_to",
          result: {
            status: "arrived",
            arrived: true,
            beforeDistance: 3,
            afterDistance: 1,
            distanceDelta: 2
          }
        },
        { tool: "say", args: { target: "npc_target", text: "hello there" }, result: { status: "delivered" } }
      ]
    });
  const vagueAnnouncement = await writeTranscriptPayload({
      steps: [
        { tool: "say", args: { target: "npc_target", text: "hello there" }, result: { status: "delivered" } }
      ]
    });
  const vagueHandoff = await writeTranscriptPayload({
      steps: [
        { tool: "deposit_shared", result: { status: "deposited", chestId: "shared_spawn_chest", itemName: "crafting_table", movedCount: 1 } },
        { tool: "say", args: { target: "npc_target", text: "hello there" }, result: { status: "delivered" } }
      ]
    });
  const vagueFollowUp = await writeTranscriptPayload({
      steps: [
        { tool: "say", args: { target: "npc_target" }, result: { status: "busy" } },
        { tool: "wait", result: { status: "waited" } },
        { tool: "say", args: { target: "npc_target", text: "hello there" }, result: { status: "delivered" } }
      ]
    });

  assert.match(
    await validateProbePostcondition("approachAndRequestItem", vagueRequest) ?? "",
    /specific item/
  );
  assert.match(
    await validateProbePostcondition("announceResourceDiscovery", vagueAnnouncement) ?? "",
    /resource-discovery message/
  );
  assert.match(
    await validateProbePostcondition("handoffItemAtChest", vagueHandoff) ?? "",
    /handoff text/
  );
  assert.match(
    await validateProbePostcondition("waitForBusyCrafter", vagueFollowUp) ?? "",
    /follow-up message/
  );
});

test("action skill probe postcondition rejects delivered social chat without a target", async () => {
  const untargetedRequest = await writeTranscriptPayload({
      steps: [
        {
          tool: "move_to",
          result: {
            status: "arrived",
            arrived: true,
            beforeDistance: 3,
            afterDistance: 1,
            distanceDelta: 2
          }
        },
        { tool: "say", args: { text: "can you spare one oak log?" }, result: { status: "delivered" } }
      ]
    });
  const untargetedBusy = await writeTranscriptPayload({
      steps: [
        { tool: "say", result: { status: "busy" } },
        { tool: "wait", result: { status: "waited" } },
        { tool: "say", args: { target: "npc_target", text: "checking again when you are ready" }, result: { status: "delivered" } }
      ]
    });

  assert.match(
    await validateProbePostcondition("approachAndRequestItem", untargetedRequest) ?? "",
    /specific item/
  );
  assert.match(
    await validateProbePostcondition("waitForBusyCrafter", untargetedBusy) ?? "",
    /busy response/
  );
});

test("action skill probe postcondition rejects generic item requests", async () => {
  const genericRequest = await writeTranscriptPayload({
      steps: [
        {
          tool: "move_to",
          result: {
            status: "arrived",
            arrived: true,
            beforeDistance: 3,
            afterDistance: 1,
            distanceDelta: 2
          }
        },
        { tool: "say", args: { target: "npc_target", text: "can you spare one starter item?" }, result: { status: "delivered" } }
      ]
    });

  assert.match(
    await validateProbePostcondition("approachAndRequestItem", genericRequest) ?? "",
    /specific item/
  );
});

test("action skill probe postcondition requires resource memory after resource announcement", async () => {
  const announcedWithoutMemory = await writeTranscriptPayload({
      steps: [
        { tool: "say", args: { target: "npc_target", text: "I found oak logs near spawn." }, result: { status: "delivered" } }
      ]
    });
  const announcedWithVagueMemory = await writeTranscriptPayload({
      steps: [
        { tool: "say", args: { target: "npc_target", text: "I found oak logs near spawn." }, result: { status: "delivered" } },
        { tool: "remember", result: { status: "remembered", note: "hello there" } }
      ]
    });

  assert.match(
    await validateProbePostcondition("announceResourceDiscovery", announcedWithoutMemory) ?? "",
    /resource memory note/
  );
  assert.match(
    await validateProbePostcondition("announceResourceDiscovery", announcedWithVagueMemory) ?? "",
    /resource memory note/
  );
});

test("action skill probe postcondition requires measured arrival evidence before social request", async () => {
  const unmeasuredArrival = await writeTranscriptPayload({
      steps: [
        { tool: "move_to", result: { status: "arrived", arrived: true } },
        { tool: "say", args: { target: "npc_target", text: "can you spare one oak log?" }, result: { status: "delivered" } }
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
