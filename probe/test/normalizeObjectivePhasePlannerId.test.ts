import assert from "node:assert/strict";
import test from "node:test";

import { normalizeObjectivePhasePlannerId } from "../src/provider/planner/normalizeObjectivePhasePlannerId.js";

function withEnv(name: string, value: string | undefined, run: () => void) {
  const previous = process.env[name];
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
  try {
    run();
  } finally {
    if (previous === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = previous;
    }
  }
}

test("normalizeObjectivePhasePlannerId maps provider aliases to canonical ids", () => {
  assert.equal(normalizeObjectivePhasePlannerId("deterministic"), "builtin-planner");
  assert.equal(normalizeObjectivePhasePlannerId("builtin"), "builtin-planner");
  assert.equal(normalizeObjectivePhasePlannerId("openai-codex"), "openai-codex-planner");
  assert.equal(normalizeObjectivePhasePlannerId("gemini-planner"), "gemini-planner");
  assert.equal(normalizeObjectivePhasePlannerId("gemini-live-planner"), "gemini-planner");
});

test("normalizeObjectivePhasePlannerId defaults to gemini when unset", () => {
  withEnv("PROBE_LONG_OBJECTIVE_PROVIDER", undefined, () => {
    assert.equal(normalizeObjectivePhasePlannerId(undefined), "gemini-planner");
  });
});

test("normalizeObjectivePhasePlannerId uses env only when explicit provider is omitted", () => {
  withEnv("PROBE_LONG_OBJECTIVE_PROVIDER", "openai-codex", () => {
    assert.equal(normalizeObjectivePhasePlannerId(undefined), "openai-codex-planner");
    assert.equal(normalizeObjectivePhasePlannerId("deterministic"), "builtin-planner");
  });
});

test("normalizeObjectivePhasePlannerId rejects unknown explicit providers", () => {
  assert.throws(
    () => normalizeObjectivePhasePlannerId("not-a-real-planner"),
    /Unknown objective phase planner/
  );
});

test("normalizeObjectivePhasePlannerId rejects unknown env providers", () => {
  withEnv("PROBE_LONG_OBJECTIVE_PROVIDER", "bogus-provider", () => {
    assert.throws(
      () => normalizeObjectivePhasePlannerId(undefined),
      /Unknown objective phase planner/
    );
  });
});
