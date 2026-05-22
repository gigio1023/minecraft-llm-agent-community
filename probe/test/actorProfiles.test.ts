import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActorProfiles,
  canonicalActorProfiles,
  getActorProfile
} from "../src/npc/profiles.js";
import { getRoleContract } from "../src/npc/roles/contracts.js";
import {
  getDialoguePersona,
  mutualPersonas as dialogueMutualPersonas
} from "../src/mutual/dialogueContext.js";
import {
  getScenarioPersona,
  mutualPersonas as scenarioMutualPersonas
} from "../src/mutual/personas.js";

test("canonical actor profiles expose social fields and role-aligned gameplay roles", () => {
  assert.equal(canonicalActorProfiles.npc_a.gameplay_role, "quartermaster");
  assert.equal(canonicalActorProfiles.npc_b.gameplay_role, "gatherer");
  assert.equal(canonicalActorProfiles.npc_c.gameplay_role, "crafter");
  assert.equal(canonicalActorProfiles.npc_d.gameplay_role, "gatherer");

  for (const profile of Object.values(canonicalActorProfiles)) {
    assert.equal(getRoleContract(profile.gameplay_role).roleId, profile.gameplay_role);
    assert.ok(profile.display_name.length > 0);
    assert.ok(profile.social_archetype.length > 0);
    assert.ok(profile.public_responsibility.length > 0);
    assert.ok(profile.private_goal.length > 0);
    assert.ok(profile.learning_bias.length > 0);
    assert.ok(profile.risk_posture.length > 0);
    assert.ok(profile.speech_style.length > 0);
  }
});

test("mutual personas derive from canonical actor profiles", () => {
  assert.deepEqual(dialogueMutualPersonas.npc_a, {
    name: canonicalActorProfiles.npc_a.display_name,
    role: canonicalActorProfiles.npc_a.gameplay_role,
    style: canonicalActorProfiles.npc_a.speech_style,
    objective: canonicalActorProfiles.npc_a.public_responsibility
  });
  assert.deepEqual(scenarioMutualPersonas.npc_b, {
    name: canonicalActorProfiles.npc_b.display_name,
    summary: canonicalActorProfiles.npc_b.social_archetype,
    goal: canonicalActorProfiles.npc_b.private_goal
  });
});

test("profile and persona fallbacks remain deterministic for extra actors", () => {
  assert.deepEqual(buildActorProfiles(["npc_c"]).npc_c, canonicalActorProfiles.npc_c);
  assert.equal(getActorProfile("npc_x", 3).gameplay_role, "gatherer");
  assert.equal(getActorProfile("npc_x", 3).display_name, "NPC 4");
  assert.equal(getDialoguePersona("npc_x", 2).role, "crafter");
  assert.equal(getScenarioPersona("npc_x", 2).name, "NPC 3");
});
