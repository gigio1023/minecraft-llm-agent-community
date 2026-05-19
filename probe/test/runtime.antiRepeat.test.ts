import assert from "node:assert/strict";
import test from "node:test";

import { createAntiRepeatPolicy } from "../src/runtime/antiRepeat.js";

test("anti-repeat blocks only the fourth identical failed attempt for the same actor and args", () => {
  const policy = createAntiRepeatPolicy();
  const repeatedAttempt = {
    actorId: "npc_a",
    tool: "move_to",
    args: { target: "npc_b" }
  };

  assert.equal(policy.shouldBlock(repeatedAttempt), false);
  policy.record({ ...repeatedAttempt, verificationStatus: "failed" });
  assert.equal(policy.shouldBlock(repeatedAttempt), false);
  policy.record({ ...repeatedAttempt, verificationStatus: "failed" });
  assert.equal(policy.shouldBlock(repeatedAttempt), false);
  policy.record({ ...repeatedAttempt, verificationStatus: "failed" });
  assert.equal(policy.shouldBlock(repeatedAttempt), true);

  policy.record({
    actorId: "npc_a",
    tool: "move_to",
    args: { target: "npc_c" },
    verificationStatus: "failed"
  });
  assert.equal(policy.shouldBlock(repeatedAttempt), false);
});
