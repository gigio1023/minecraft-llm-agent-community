import assert from "node:assert/strict";
import test from "node:test";

import { createUnavailableVisualEvidence } from "../src/runtime/visualEvidence.js";
import { formatReviewSummaryMarkdown, type SocialCycleReviewSummary } from "../src/runtime/goals/socialCycleReviewSummary.js";

test("unavailable visual evidence remains diagnostic report context", () => {
  const manifest = createUnavailableVisualEvidence({
    actorId: "npc_b",
    runId: "run-test",
    reason: "no bot",
    intervalCycles: 3,
    width: 800,
    height: 450
  });

  assert.equal(manifest.schema, "social-cycle-visual-evidence/v1");
  assert.equal(manifest.enabled, true);
  assert.equal(manifest.interval_cycles, 3);
  assert.deepEqual(manifest.viewport, { width: 800, height: 450 });
  assert.equal(manifest.captures.length, 0);
  assert.equal(manifest.failures[0]?.error, "no bot");
});

test("review markdown embeds visual evidence images with absolute paths", () => {
  const summary: SocialCycleReviewSummary = {
    schema: "social-cycle-review-summary/v1",
    report_path: "/tmp/report.json",
    actor_id: "npc_b",
    run_id: "run-test",
    provider_model: "deterministic-social",
    runtime_status: "passed",
    total_cycles: 1,
    outcome_counts: {},
    verifier_counts: {},
    primitive_counts: {},
    runtime_retry_constraint_count: 0,
    retry_constraint_blocked_attempts: 0,
    cycles_with_prior_judgment_context: 0,
    visual_captures: [{
      cycle_id: "cycle-0001",
      phase: "cycle_end",
      status: "captured",
      image_ref: "visual-evidence/cycle-0001-cycle-end.png",
      image_path: "/tmp/actors/npc_b/visual-evidence/cycle-0001-cycle-end.png",
      artifact_ref: "visual-evidence/cycle-0001-cycle-end.json"
    }],
    visual_failures: [],
    rows: []
  };

  const markdown = formatReviewSummaryMarkdown(summary);
  assert.match(markdown, /## Visual Evidence/);
  assert.match(
    markdown,
    /!\[cycle-0001 cycle_end\]\(\/tmp\/actors\/npc_b\/visual-evidence\/cycle-0001-cycle-end\.png\)/
  );
});
