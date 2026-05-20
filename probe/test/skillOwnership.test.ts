import assert from "node:assert/strict";
import test from "node:test";

import { defaultActorRoles } from "../src/runtime/actorRoster.js";
import { createProbeSession } from "../src/runtime/session/probeSession.js";
import { assignSeedActionSkillOwnership } from "../src/skills/ownership.js";

test("assigns visible active seed action skill ownership per actor role", () => {
  const actorIds = ["npc_a", "npc_b"];
  const actorRoles = defaultActorRoles(actorIds);
  const ownership = assignSeedActionSkillOwnership(actorIds, actorRoles);

  assert.ok(
    ownership.some((record) =>
      record.owner_actor_id === "npc_a" &&
      record.skill_id === "inspectSharedChest" &&
      record.source_kind === "seed" &&
      record.status === "active" &&
      record.supersession === null
    )
  );
  assert.ok(
    ownership.some((record) =>
      record.owner_actor_id === "npc_b" &&
      record.skill_id === "collectLogs" &&
      record.source_kind === "seed" &&
      record.status === "active" &&
      record.supersession === null
    )
  );
  assert.equal(
    ownership.some((record) =>
      record.owner_actor_id === "npc_a" &&
      record.skill_id === "collectLogs"
    ),
    false,
    "quartermaster must not actively own collectLogs because its role contract cannot use collect_logs"
  );
  assert.equal(
    ownership.some((record) => record.skill_id === "mineCobblestone"),
    false,
    "planned Minecraft roadmap action skills must not appear as active ownership"
  );
});

test("creates a two-actor session artifact boundary with action skill ownership", () => {
  const actorIds = ["npc_a", "npc_b"];
  const actorRoles = defaultActorRoles(actorIds);
  const seedActionSkillOwnership = assignSeedActionSkillOwnership(actorIds, actorRoles);
  const session = createProbeSession({
    actorIds,
    actorRoles,
    seedActionSkillOwnership,
    bots: {
      npc_a: { username: "npc_a" },
      npc_b: { username: "npc_b" }
    } as any
  });

  assert.deepEqual(session.actors, [
    { actor_id: "npc_a", username: "npc_a", role_id: "quartermaster" },
    { actor_id: "npc_b", username: "npc_b", role_id: "gatherer" }
  ]);
  assert.equal(session.seed_skill_ownership.length, seedActionSkillOwnership.length);
});
