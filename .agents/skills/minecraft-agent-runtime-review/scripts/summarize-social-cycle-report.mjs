#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error("usage: summarize-social-cycle-report.mjs <social-cycle-report.json>");
  process.exit(2);
}

const reportPath = process.argv[2];
if (!reportPath) {
  usage();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inc(counts, key, by = 1) {
  const label = key === undefined || key === null || key === "" ? "missing" : String(key);
  counts[label] = (counts[label] ?? 0) + by;
}

function sumUsage(records) {
  const total = {
    requests: 0,
    input_tokens: 0,
    output_tokens: 0,
    thinking_tokens: 0,
    total_tokens: 0
  };
  for (const record of records) {
    const usage = record?.usage ?? {};
    for (const key of Object.keys(total)) {
      total[key] += Number(usage[key] ?? 0);
    }
  }
  return total;
}

function safeRelativeRef(ref) {
  if (typeof ref !== "string" || ref.trim().length === 0) {
    return { ok: false, reason: "empty ref" };
  }
  if (path.isAbsolute(ref)) {
    return { ok: false, reason: "absolute ref" };
  }
  const normalized = path.normalize(ref);
  if (normalized === "." || normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return { ok: false, reason: "escaping ref" };
  }
  return { ok: true, normalized };
}

const absoluteReportPath = path.resolve(reportPath);
const report = readJson(absoluteReportPath);
const reportDir = path.dirname(absoluteReportPath);
const actorWorkspaceRoot = typeof report.actor_workspace_root_dir === "string"
  ? (path.isAbsolute(report.actor_workspace_root_dir)
    ? path.resolve(report.actor_workspace_root_dir)
    : path.resolve(reportDir, report.actor_workspace_root_dir))
  : path.resolve(reportDir, "../data/actors/social-runs", report.run_id ?? "");
const actorDir = path.join(actorWorkspaceRoot, report.actor_id ?? "");

const refStats = {
  total_refs: 0,
  unique_refs: 0,
  resolved_refs: 0,
  missing_refs: [],
  invalid_refs: [],
  invalid_json_refs: [],
  by_prefix: {}
};
const refCache = new Map();

function prefixFor(ref) {
  return String(ref).split("/")[0] || "root";
}

function resolveRef(ref) {
  refStats.total_refs += 1;
  inc(refStats.by_prefix, prefixFor(ref));
  const safe = safeRelativeRef(ref);
  if (!safe.ok) {
    refStats.invalid_refs.push({ ref, reason: safe.reason });
    return null;
  }
  const filePath = path.resolve(actorDir, safe.normalized);
  const relative = path.relative(actorDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    refStats.invalid_refs.push({ ref, reason: "resolved outside actor workspace" });
    return null;
  }
  if (!refCache.has(ref)) {
    if (!fs.existsSync(filePath)) {
      refStats.missing_refs.push(ref);
      refCache.set(ref, null);
    } else {
      try {
        refCache.set(ref, readJson(filePath));
        refStats.resolved_refs += 1;
      } catch (error) {
        refStats.invalid_json_refs.push({ ref, error: String(error?.message ?? error) });
        refCache.set(ref, null);
      }
    }
  }
  return refCache.get(ref);
}

function resolveOptionalRef(ref) {
  return typeof ref === "string" && ref.trim().length > 0 ? resolveRef(ref) : null;
}

function addRefs(refs, target) {
  if (!Array.isArray(refs)) {
    return;
  }
  for (const ref of refs) {
    if (typeof ref === "string" && ref.trim().length > 0) {
      target.push(ref);
    }
  }
}

const allRefs = [];
for (const cycle of report.cycles ?? []) {
  for (const key of ["cycle_goal_ref", "action_ref", "action_intent_ref", "judgment_ref"]) {
    if (typeof cycle[key] === "string") {
      allRefs.push(cycle[key]);
    }
  }
  addRefs(cycle.provider_input_refs, allRefs);
  addRefs(cycle.provider_output_refs, allRefs);
  addRefs(cycle.evidence_refs, allRefs);
  for (const attempt of cycle.action_attempts ?? []) {
    if (typeof attempt.action_ref === "string") {
      allRefs.push(attempt.action_ref);
    }
    if (typeof attempt.action_intent_ref === "string") {
      allRefs.push(attempt.action_intent_ref);
    }
    if (typeof attempt.judgment_ref === "string") {
      allRefs.push(attempt.judgment_ref);
    }
    addRefs(attempt.provider_input_refs, allRefs);
    addRefs(attempt.provider_output_refs, allRefs);
    addRefs(attempt.evidence_refs, allRefs);
  }
}

for (const ref of [...new Set(allRefs)]) {
  resolveRef(ref);
}
refStats.unique_refs = new Set(allRefs).size;

const outcomeCounts = {};
const verifierCounts = {};
const runtimeStatusCounts = {};
const actionKindCounts = {};
const actionCounts = {};
const outcomeByAction = {};
const verifierByAction = {};
const runtimeStatusByAction = {};
const executedToolCounts = {};
const toolStatusCounts = {};
const postconditionCounts = {};
const memoryWriteLayerCounts = {};
const samples = [];
const failedOrBlockedSamples = [];
const runtimeFallbackJudgments = [];
const providerInvalidOutputs = [];
const windowSize = 20;
const windows = [];
const cycleRows = [];

const actionSurface = {
  direct_primitives_available: new Set(),
  direct_action_skills_available: new Set(),
  direct_primitives_used_as_intent: new Set(),
  direct_action_skills_used: new Set(),
  direct_primitives_used_as_tool: new Set(),
  action_cards_available: new Set(),
  action_cards_used: new Set(),
  author_mineflayer_action_used: 0
};

const observation = {
  observe_evidence_refs: 0,
  observe_with_vitals: 0,
  observe_with_world_scan: 0,
  non_exhaustive_world_scans: 0,
  food_candidate_refs: 0,
  observations_with_visible_actors: 0,
  observations_with_chest_in_scan: 0,
  observations_with_crafting_table_in_scan: 0,
  final_vitals: null,
  final_inventory: null,
  final_position: null,
  final_world_scan_ref: null
};

const evidenceDiagnostics = {
  place_block: [],
  craft_summary: {},
  movement: []
};

function collectPostconditions(postconditions) {
  for (const result of postconditions ?? []) {
    inc(postconditionCounts, `${result.action_skill_id ?? "missing"}:${result.status ?? "missing"}`);
  }
}

function incNested(counts, outerKey, innerKey) {
  const outer = outerKey === undefined || outerKey === null || outerKey === ""
    ? "missing"
    : String(outerKey);
  if (!counts[outer]) {
    counts[outer] = {};
  }
  inc(counts[outer], innerKey);
}

collectPostconditions(report.postcondition_results);

function inspectEvidence(ref) {
  const artifact = resolveRef(ref);
  if (!isRecord(artifact)) {
    return;
  }
  const attempt = artifact.tool_attempt;
  if (!isRecord(attempt)) {
    return;
  }
  const tool = attempt.tool;
  const result = isRecord(attempt.result) ? attempt.result : {};
  if (tool === "observe") {
    observation.observe_evidence_refs += 1;
    const visibleActors = Array.isArray(result.visibleActors) ? result.visibleActors : [];
    if (visibleActors.length > 0) {
      observation.observations_with_visible_actors += 1;
    }
    if (isRecord(result.vitals)) {
      observation.observe_with_vitals += 1;
      observation.final_vitals = result.vitals;
      const candidates = Array.isArray(result.vitals.food_candidates)
        ? result.vitals.food_candidates
        : [];
      if (candidates.length > 0) {
        observation.food_candidate_refs += 1;
      }
    }
    if (Array.isArray(result.inventory)) {
      observation.final_inventory = result.inventory;
    }
    if (isRecord(result.position)) {
      observation.final_position = result.position;
    }
    const worldSummary = isRecord(result.worldStateSummary)
      ? result.worldStateSummary
      : (isRecord(result.world_state_summary) ? result.world_state_summary : null);
    if (isRecord(worldSummary) && (
      worldSummary.schema === "world-state-summary/v1" ||
      worldSummary.schema === "world-state-scan/v1"
    )) {
      observation.observe_with_world_scan += 1;
      observation.final_world_scan_ref = ref;
      const coverage = isRecord(worldSummary.loaded_coverage) ? worldSummary.loaded_coverage : {};
      if (
        coverage.absence_claims_exhaustive !== true ||
        coverage.exhaustive === false ||
        coverage.scope === "sampled_columns_only"
      ) {
        observation.non_exhaustive_world_scans += 1;
      }
      const blockNames = Array.isArray(worldSummary.block_observations?.by_name)
        ? worldSummary.block_observations.by_name.map((entry) => entry?.name)
        : [];
      if (blockNames.includes("chest")) {
        observation.observations_with_chest_in_scan += 1;
      }
      if (blockNames.includes("crafting_table")) {
        observation.observations_with_crafting_table_in_scan += 1;
      }
    }
  }

  if (tool === "place_block") {
    evidenceDiagnostics.place_block.push({
      ref,
      item: attempt.args?.itemName ?? attempt.args?.blockName ?? null,
      target: attempt.args?.targetPosition ?? attempt.args?.position ?? null,
      status: result.status ?? null,
      reason: result.reason ?? null
    });
  }
  if (tool === "craft_item" || tool === "craft_with_table") {
    inc(
      evidenceDiagnostics.craft_summary,
      `${tool}:${attempt.args?.itemName ?? "implicit"}:${result.status ?? "missing"}`
    );
  }
  if (tool === "move_to") {
    evidenceDiagnostics.movement.push({
      ref,
      status: result.status ?? null,
      reason: result.reason ?? null
    });
  }
}

function actionCardLabel(card) {
  const id = typeof card?.action_card_id === "string" ? card.action_card_id : "missing-card-id";
  const title = typeof card?.title === "string" ? card.title : "missing-title";
  return `${id}:${title}`;
}

function actorTurnActionLabel(action) {
  if (!isRecord(action)) {
    return { kind: "missing", label: "missing" };
  }
  const kind = action.kind ?? "missing";
  if (kind === "use_primitive") {
    return { kind, label: action.primitive_id ?? "missing_primitive" };
  }
  if (kind === "use_action_skill") {
    return { kind, label: action.action_skill_id ?? "missing_action_skill" };
  }
  if (kind === "author_mineflayer_action") {
    return { kind, label: "author_mineflayer_action" };
  }
  return { kind, label: String(kind) };
}

function resolveCurrentAction(cycle) {
  if (typeof cycle.action_ref === "string") {
    const action = resolveRef(cycle.action_ref);
    if (isRecord(action)) {
      return action;
    }
  }
  for (const attempt of [...(cycle.action_attempts ?? [])].reverse()) {
    if (typeof attempt.action_ref === "string") {
      const action = resolveRef(attempt.action_ref);
      if (isRecord(action)) {
        return action;
      }
    }
  }
  return null;
}

for (const cycle of report.cycles ?? []) {
  const cycleNumberMatch = String(cycle.cycle_id ?? "").match(/(\d+)$/);
  const cycleNumber = cycleNumberMatch ? Number(cycleNumberMatch[1]) : 0;
  const windowIndex = Math.max(0, Math.floor((Math.max(cycleNumber, 1) - 1) / windowSize));
  if (!windows[windowIndex]) {
    windows[windowIndex] = {
      start_cycle: windowIndex * windowSize + 1,
      end_cycle: (windowIndex + 1) * windowSize,
      outcomes: {},
      actions: {},
      verifiers: {}
    };
  }

  inc(verifierCounts, cycle.verifier_status);
  for (const evidenceRef of cycle.evidence_refs ?? []) {
    inspectEvidence(evidenceRef);
  }

  const judgment = resolveOptionalRef(cycle.judgment_ref);
  const intent = resolveOptionalRef(cycle.action_intent_ref);
  const outputRefs = cycle.provider_output_refs ?? [];

  for (const inputRef of cycle.provider_input_refs ?? []) {
    const providerInput = resolveRef(inputRef);
    const surface = providerInput?.input?.action_surface;
    if (isRecord(surface)) {
      for (const primitive of surface.direct_primitives ?? []) {
        if (primitive?.primitive_id) {
          actionSurface.direct_primitives_available.add(primitive.primitive_id);
        }
      }
      for (const actionSkill of surface.direct_action_skills ?? []) {
        if (actionSkill?.action_skill_id) {
          actionSurface.direct_action_skills_available.add(actionSkill.action_skill_id);
        }
      }
    }
    const actionCards = providerInput?.input?.action_cards;
    if (Array.isArray(actionCards)) {
      for (const card of actionCards) {
        if (isRecord(card)) {
          actionSurface.action_cards_available.add(actionCardLabel(card));
        }
      }
    }
  }

  for (const outputRef of outputRefs) {
    const output = resolveRef(outputRef);
    if (!isRecord(output)) {
      continue;
    }
    if (output.proposal?.runtime_fallback_judgment === true) {
      runtimeFallbackJudgments.push({ cycle_id: cycle.cycle_id, ref: outputRef });
    }
    const parsed = output.parsed_output;
    if (isRecord(parsed) && Array.isArray(parsed.provider_invalid_errors)) {
      providerInvalidOutputs.push({
        cycle_id: cycle.cycle_id,
        ref: outputRef,
        errors: parsed.provider_invalid_errors
      });
    }
  }

  const outcome = isRecord(judgment) ? judgment.outcome : "missing";
  inc(outcomeCounts, outcome);
  inc(windows[windowIndex].outcomes, outcome);
  if (isRecord(judgment)) {
    for (const memoryWrite of judgment.memory_writes ?? []) {
      inc(memoryWriteLayerCounts, memoryWrite.layer);
    }
  }

  const currentAction = resolveCurrentAction(cycle);
  let { kind: actionKind, label: actionLabel } = actorTurnActionLabel(currentAction);
  if (isRecord(currentAction)) {
    if (currentAction.kind === "use_primitive") {
      actionSurface.direct_primitives_used_as_intent.add(actionLabel);
    } else if (currentAction.kind === "use_action_skill") {
      actionSurface.direct_action_skills_used.add(actionLabel);
    } else if (currentAction.kind === "author_mineflayer_action") {
      actionSurface.author_mineflayer_action_used += 1;
    }
    if (typeof currentAction.action_card_id === "string") {
      actionSurface.action_cards_used.add(currentAction.action_card_id);
    }
  } else if (isRecord(intent)) {
    actionKind = intent.kind ?? "missing";
    if (intent.kind === "use_primitive") {
      actionLabel = intent.primitive_id ?? "missing";
      actionSurface.direct_primitives_used_as_intent.add(actionLabel);
    } else if (intent.kind === "use_action_skill") {
      actionLabel = intent.action_skill_id ?? "missing";
      actionSurface.direct_action_skills_used.add(actionLabel);
    } else {
      actionLabel = intent.kind ?? "missing";
    }
  }
  inc(actionKindCounts, actionKind);
  inc(actionCounts, actionLabel);
  inc(windows[windowIndex].actions, actionLabel);
  inc(windows[windowIndex].verifiers, cycle.verifier_status);
  incNested(outcomeByAction, actionLabel, outcome);
  incNested(verifierByAction, actionLabel, cycle.verifier_status);

  for (const attempt of cycle.action_attempts ?? []) {
    inc(runtimeStatusCounts, attempt.runtime_status);
    incNested(runtimeStatusByAction, actionLabel, attempt.runtime_status);
    collectPostconditions(attempt.postcondition_results);
    for (const tool of attempt.executed_tools ?? []) {
      inc(executedToolCounts, tool);
      actionSurface.direct_primitives_used_as_tool.add(tool);
    }
    for (const status of attempt.tool_statuses ?? []) {
      inc(toolStatusCounts, `${status.tool ?? "missing"}:${status.status ?? "missing"}`);
    }
  }

  const row = {
    cycle_id: cycle.cycle_id,
    outcome,
    verifier_status: cycle.verifier_status,
    action_kind: actionKind,
    action: actionLabel,
    evidence_refs: cycle.evidence_refs ?? []
  };
  cycleRows.push(row);
  if (samples.length < 12) {
    samples.push(row);
  }
  if (
    failedOrBlockedSamples.length < 20 &&
    (outcome === "blocked" || cycle.verifier_status === "failed")
  ) {
    failedOrBlockedSamples.push(row);
  }
}

const observationLoop = {
  observe_like_cycles: 0,
  next_after_observe: {},
  next_outcome_after_observe: {},
  samples: []
};
for (let index = 0; index < cycleRows.length - 1; index += 1) {
  const current = cycleRows[index];
  const next = cycleRows[index + 1];
  if (current.action !== "observe" && current.action !== "runtimeObserveAndRemember") {
    continue;
  }
  observationLoop.observe_like_cycles += 1;
  inc(observationLoop.next_after_observe, next.action);
  inc(observationLoop.next_outcome_after_observe, next.outcome);
  if (observationLoop.samples.length < 30) {
    observationLoop.samples.push({
      from_cycle: current.cycle_id,
      observe_action: current.action,
      next_cycle: next.cycle_id,
      next_action: next.action,
      next_outcome: next.outcome,
      next_verifier: next.verifier_status
    });
  }
}

function sortedSet(set) {
  return [...set].sort();
}

function countTopActions(actionCountsForTop, topN) {
  return Object.entries(actionCountsForTop)
    .sort((first, second) => second[1] - first[1])
    .slice(0, topN)
    .reduce((total, entry) => total + entry[1], 0);
}

const directPrimitivesAvailable = sortedSet(actionSurface.direct_primitives_available);
const directPrimitivesUsedAsIntent = sortedSet(actionSurface.direct_primitives_used_as_intent);
const directPrimitivesUsedAsTool = sortedSet(
  new Set(
    sortedSet(actionSurface.direct_primitives_used_as_tool)
      .filter((tool) => actionSurface.direct_primitives_available.has(tool))
  )
);
const directActionSkillsAvailable = sortedSet(actionSurface.direct_action_skills_available);
const directActionSkillsUsed = sortedSet(actionSurface.direct_action_skills_used);
const actionCardsAvailable = sortedSet(actionSurface.action_cards_available);
const actionCardsUsed = sortedSet(actionSurface.action_cards_used);

const visualCaptures = Array.isArray(report.visual_evidence?.captures)
  ? report.visual_evidence.captures
  : [];
const visualFailures = Array.isArray(report.visual_evidence?.failures)
  ? report.visual_evidence.failures
  : [];

const attempts = (report.cycles ?? []).flatMap((cycle) => cycle.action_attempts ?? []);
const providerTotals = report.provider_usage?.totals ?? [];
const budgetStatuses = report.provider_usage?.budget_status ?? [];
const budgetHeadroom = budgetStatuses.map((entry) => {
  const limit = entry?.budget?.total_token_limit_per_day;
  const projected = entry?.projected?.day?.total_tokens;
  return {
    provider_id: entry?.provider_id,
    model: entry?.model,
    status: entry?.status,
    total_token_limit_per_day: limit ?? null,
    projected_day_total_tokens: projected ?? null,
    remaining_day_tokens: Number.isFinite(limit) && Number.isFinite(projected)
      ? limit - projected
      : null
  };
});

const retryConstraints = (report.runtime_retry_constraints ?? []).map((constraint) => ({
  constraint_id: constraint.constraint_id,
  action_kind: constraint.action_kind,
  target: constraint.target,
  args_normalized: constraint.args_normalized,
  blocker_status: constraint.blocker_status,
  blocker_reason: constraint.blocker_reason,
  repeat_count: constraint.repeat_count,
  attempt_refs: constraint.attempt_refs
}));

const settlementChecklist = (report.settlement_checklist?.items ?? []).map((item) => ({
  id: item.id,
  status: item.status,
  evidence_ref_count: Array.isArray(item.evidence_refs) ? item.evidence_refs.length : 0,
  reason: item.reason
}));

const summary = {
  schema: "minecraft-agent-runtime-review-social-cycle-summary/v1",
  report_path: absoluteReportPath,
  actor_workspace_root: actorWorkspaceRoot,
  actor_dir: actorDir,
  report: {
    schema: report.schema,
    run_id: report.run_id,
    actor_id: report.actor_id,
    runtime_status: report.runtime_status,
    provider: report.provider,
    server: report.server,
    cycle_count: (report.cycles ?? []).length,
    attempt_count: attempts.length
  },
  recording: refStats,
  provider_usage: {
    records: report.provider_usage?.records ?? null,
    totals: providerTotals,
    summed_usage: sumUsage(providerTotals),
    budget_headroom: budgetHeadroom,
    ledger_path: report.provider_usage?.ledger_path ?? null,
    runtime_fallback_judgments: runtimeFallbackJudgments,
    provider_invalid_outputs: providerInvalidOutputs
  },
  agency_status: report.agency_status ?? null,
  memory_reuse: report.memory_reuse ?? null,
  counts: {
    outcomes: outcomeCounts,
    verifiers: verifierCounts,
    runtime_statuses: runtimeStatusCounts,
    action_kinds: actionKindCounts,
    actions: actionCounts,
    outcome_by_action: outcomeByAction,
    verifier_by_action: verifierByAction,
    runtime_status_by_action: runtimeStatusByAction,
    executed_tools: executedToolCounts,
    tool_statuses: toolStatusCounts,
    postconditions: postconditionCounts,
    memory_write_layers: memoryWriteLayerCounts
  },
  loop_diagnostics: {
    observation_to_action: observationLoop,
    action_surface_utilization: {
      direct_primitives_available: directPrimitivesAvailable,
      direct_primitive_count: directPrimitivesAvailable.length,
      direct_primitives_used_as_intent: directPrimitivesUsedAsIntent,
      used_intent_primitive_count: directPrimitivesUsedAsIntent.length,
      direct_primitives_used_as_tool: directPrimitivesUsedAsTool,
      used_tool_primitive_count: directPrimitivesUsedAsTool.length,
      unused_direct_primitives: directPrimitivesAvailable
        .filter((primitive) =>
          !actionSurface.direct_primitives_used_as_intent.has(primitive) &&
          !actionSurface.direct_primitives_used_as_tool.has(primitive)
        ),
      direct_action_skills_available: directActionSkillsAvailable,
      direct_action_skill_count: directActionSkillsAvailable.length,
      direct_action_skills_used: directActionSkillsUsed,
      used_action_skill_count: directActionSkillsUsed.length,
      unused_direct_action_skills: directActionSkillsAvailable
        .filter((actionSkill) => !actionSurface.direct_action_skills_used.has(actionSkill)),
      action_cards_available: actionCardsAvailable,
      action_card_count: actionCardsAvailable.length,
      action_cards_used: actionCardsUsed,
      used_action_card_count: actionCardsUsed.length,
      author_mineflayer_action_used: actionSurface.author_mineflayer_action_used
    },
    action_concentration: {
      distinct_action_count: Object.keys(actionCounts).length,
      top_5_actions_count: countTopActions(actionCounts, 5),
      top_6_actions_count: countTopActions(actionCounts, 6),
      top_actions: Object.entries(actionCounts)
        .sort((first, second) => second[1] - first[1])
    },
    social_signals: {
      relationship_application_results: report.relationship_application_results?.length ?? 0,
      observations_with_visible_actors: observation.observations_with_visible_actors,
      say_tool_count: executedToolCounts.say ?? 0,
      deposit_shared_tool_count: executedToolCounts.deposit_shared ?? 0
    },
    evidence_diagnostics: evidenceDiagnostics
  },
  retry_constraints: {
    count: retryConstraints.length,
    blocked_attempts: attempts.filter((attempt) => attempt.retry_constraint_blocked === true).length,
    items: retryConstraints
  },
  observation,
  visual_evidence: {
    method: report.visual_evidence?.method ?? null,
    first_person: report.visual_evidence?.first_person ?? null,
    capture_count: visualCaptures.length,
    failure_count: visualFailures.length,
    failures: visualFailures,
    first_captures: visualCaptures.slice(0, 3).map((capture) => ({
      cycle_id: capture.cycle_id,
      phase: capture.phase,
      image_path: capture.image_path,
      bot_position: capture.bot_position
    })),
    last_captures: visualCaptures.slice(-5).map((capture) => ({
      cycle_id: capture.cycle_id,
      phase: capture.phase,
      image_path: capture.image_path,
      bot_position: capture.bot_position
    })),
    review_note:
      "Visual evidence is renderer evidence only. Compare suspicious pixels with observe/world-state artifacts before treating screenshots as world truth."
  },
  settlement: {
    state: {
      inventory_counts: report.settlement_state?.inventory_counts ?? null,
      known_positions: report.settlement_state?.known_positions ?? null,
      progress: report.settlement_state?.progress ?? null,
      blocker_histogram: report.settlement_state?.blocker_histogram ?? []
    },
    checklist: settlementChecklist
  },
  samples: {
    windows: windows.filter(Boolean),
    first_cycles: samples,
    failed_or_blocked_cycles: failedOrBlockedSamples,
    last_cycles: (report.cycles ?? []).slice(-8).map((cycle) => {
      const judgment = resolveOptionalRef(cycle.judgment_ref);
      const intent = resolveOptionalRef(cycle.action_intent_ref);
      const currentAction = resolveCurrentAction(cycle);
      const resolvedAction = actorTurnActionLabel(currentAction);
      return {
        cycle_id: cycle.cycle_id,
        outcome: isRecord(judgment) ? judgment.outcome : "missing",
        verifier_status: cycle.verifier_status,
        action: resolvedAction.label !== "missing"
          ? resolvedAction.label
          : (isRecord(intent)
            ? (intent.kind === "use_primitive" ? intent.primitive_id : intent.action_skill_id ?? intent.kind)
            : "missing"),
        what_happened: isRecord(judgment) ? judgment.what_happened : ""
      };
    })
  }
};

console.log(JSON.stringify(summary, null, 2));
