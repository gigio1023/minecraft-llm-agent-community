import assert from "node:assert/strict";
import test from "node:test";

import { shouldExecuteLegacyGeneratedActionSkills } from "../src/skills/generatedLegacyPolicy.js";

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
