/** Regression coverage for action skill verifier contract definitions. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { runtimePrimitiveIds } from "../src/gameplay/primitives/registry.js";
import {
  actionSkillVerificationContracts,
  getActionSkillVerificationContract
} from "../src/gameplay/seedSkills/verificationContracts.js";
import { listImplementedSeedActionSkills } from "../src/gameplay/seedSkills/registry.js";

test("every implemented seed action skill has a verification contract", () => {
  const implementedIds = listImplementedSeedActionSkills().map((actionSkill) => actionSkill.id).sort();
  const contractIds = actionSkillVerificationContracts.map((contract) => contract.skillId).sort();

  assert.deepEqual(contractIds, implementedIds);
});

test("verification contracts stay aligned with seed action skill primitive ownership", () => {
  for (const actionSkill of listImplementedSeedActionSkills()) {
    const contract = getActionSkillVerificationContract(actionSkill.id);

    assert.deepEqual(contract.primitiveIds, actionSkill.primitiveIds);
    assert.ok(contract.evidence.length > 0, `${actionSkill.id} needs at least one evidence requirement`);

    for (const primitiveId of contract.primitiveIds) {
      assert.ok(
        runtimePrimitiveIds.includes(primitiveId),
        `${actionSkill.id} references unknown primitive ${primitiveId}`
      );
    }
  }
});

test("verification contracts point at checked-in test files", async () => {
  for (const contract of actionSkillVerificationContracts) {
    assert.ok(contract.protectedBy.length > 0, `${contract.skillId} needs at least one test file`);

    for (const testFile of contract.protectedBy) {
      await fs.access(path.join(process.cwd(), testFile));
    }
  }
});
