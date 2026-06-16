import path from "node:path";

import { loadRepoDotEnv } from "../../config/loadRepoDotEnv.js";
import { callModelScopeJsonSchema, type ModelScopeApiProviderConfig } from "../../provider/modelscopeApiProvider.js";
import type { ProviderUsageCounts } from "../../provider/providerUsageTracker.js";
import {
  BORROWED_TOOL_ISSUE_ID,
  type BorrowedToolDecision,
  type BorrowedToolEvent,
  type BorrowedToolIssueReport,
  type BorrowedToolTurn,
  type BorrowedToolTurnId,
  type SocialIssueDimensionScore
} from "./types.js";

const DIMENSION_WEIGHT = 20;

const availableEvidenceRefs = [
  "world:spawn-worksite-safe-daylight",
  "inventory:npc-a-stone-axe-1",
  "inventory:npc-b-stone-axe-0",
  "role:npc-a-quartermaster-tool-holder",
  "role:npc-b-gatherer-needs-wood",
  "task:npc-b-needs-two-oak-logs",
  "relationship:npc-a-npc-b-neutral-trust",
  "time:daylight-limited"
];

const decisionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "actor_id",
    "decision",
    "spoken_message",
    "expected_minecraft_action",
    "reasoning_summary",
    "evidence_refs_used"
  ],
  properties: {
    actor_id: { enum: ["npc_a", "npc_b"] },
    target_actor_id: { enum: ["npc_a", "npc_b"] },
    decision: {
      enum: [
        "request_borrow_tool",
        "lend_tool",
        "lend_tool_with_condition",
        "refuse_request",
        "clarify_or_wait",
        "use_and_return_tool",
        "use_and_keep_debt",
        "adapt_without_tool"
      ]
    },
    item_id: { enum: ["stone_axe"] },
    spoken_message: { type: "string" },
    expected_minecraft_action: { type: "string" },
    reasoning_summary: { type: "string" },
    evidence_refs_used: {
      type: "array",
      items: { type: "string" }
    },
    obligation_update: {
      type: "object",
      additionalProperties: false,
      required: ["kind", "status", "summary"],
      properties: {
        kind: { enum: ["loan", "debt", "repair", "refusal", "none"] },
        status: { enum: ["open", "fulfilled", "refused", "blocked", "none"] },
        summary: { type: "string" }
      }
    },
    relationship_update: {
      type: "object",
      additionalProperties: false,
      required: ["from_actor_id", "to_actor_id", "trust_delta", "summary"],
      properties: {
        from_actor_id: { enum: ["npc_a", "npc_b"] },
        to_actor_id: { enum: ["npc_a", "npc_b"] },
        trust_delta: { enum: ["up", "down", "unchanged"] },
        summary: { type: "string" }
      }
    }
  }
} as const;

function resolveRepoRoot() {
  return path.basename(process.cwd()) === "probe" ? path.resolve(process.cwd(), "..") : process.cwd();
}

function systemPrompt() {
  return [
    "You are evaluating one Minecraft social issue for an embodied NPC benchmark.",
    "Choose a socially grounded decision for the named actor only.",
    "Do not claim unprovided Minecraft state as fact.",
    "A refusal, conditional loan, or unresolved debt can be valid when grounded.",
    "Use evidence_refs_used to cite only refs from the issue state or earlier event refs.",
    "Keep reasoning_summary concise and do not include hidden chain-of-thought."
  ].join("\n");
}

function baseIssueState() {
  return {
    issue_id: BORROWED_TOOL_ISSUE_ID,
    title: "Borrowed tool with return or debt",
    world_state: [
      "Mara/npc_a is a quartermaster and currently has one stone_axe as personal possession.",
      "Jun/npc_b is a gatherer with no axe and needs two oak logs for nearby work.",
      "The worksite is safe but daylight is limited.",
      "The relationship between Mara and Jun starts neutral.",
      "The benchmark accepts lending, conditional lending, refusal, clarification, adaptation, return, or debt if grounded."
    ],
    actors: [
      {
        actor_id: "npc_a" as const,
        name: "Mara",
        stake: "Keep the stone axe available and avoid losing settlement tools."
      },
      {
        actor_id: "npc_b" as const,
        name: "Jun",
        stake: "Gather wood efficiently without violating Mara's material claim."
      }
    ],
    evidence_refs_available: availableEvidenceRefs,
    valid_resolution_space: [
      "Jun asks to borrow the stone axe with a clear reason.",
      "Mara lends the axe, lends it with a return condition, refuses, or asks for clarification.",
      "If access is granted, Jun uses the axe and returns it or leaves a debt/repair obligation.",
      "If access is refused, Jun adapts without pretending to have tool access.",
      "Relationship or obligation state should reflect the result."
    ]
  };
}

function previousTurnSummary(turns: readonly BorrowedToolTurn[]) {
  if (turns.length === 0) {
    return "No prior turns.";
  }
  return turns.map((turn) => {
    const decision = turn.decision;
    if (!decision) {
      return `${turn.turn_id}: failed (${turn.error_message ?? "no decision"})`;
    }
    return `${turn.turn_id}: ${decision.actor_id} chose ${decision.decision}; message="${decision.spoken_message}"; obligation=${decision.obligation_update?.status ?? "none"}`;
  }).join("\n");
}

function turnInstruction(turnId: BorrowedToolTurnId) {
  if (turnId === "borrower_request") {
    return [
      "Turn: borrower_request.",
      "Actor to decide: npc_b / Jun.",
      "Decide whether and how Jun asks Mara for access to the stone_axe."
    ].join("\n");
  }
  if (turnId === "owner_response") {
    return [
      "Turn: owner_response.",
      "Actor to decide: npc_a / Mara.",
      "Decide whether Mara lends the stone_axe, lends with a condition, refuses, or asks for clarification."
    ].join("\n");
  }
  return [
    "Turn: borrower_follow_up.",
    "Actor to decide: npc_b / Jun.",
    "Use the prior owner response. If access was granted, decide whether Jun uses and returns the tool or leaves an explicit debt. If access was refused, adapt without claiming tool access."
  ].join("\n");
}

function buildUserPrompt(turnId: BorrowedToolTurnId, turns: readonly BorrowedToolTurn[]) {
  return [
    `Issue state:\n${JSON.stringify(baseIssueState(), null, 2)}`,
    "",
    `Prior turns:\n${previousTurnSummary(turns)}`,
    "",
    `Earlier event refs now available: ${eventRefs(turns).join(", ") || "(none)"}`,
    "",
    turnInstruction(turnId)
  ].join("\n");
}

function eventTypeForDecision(decision: BorrowedToolDecision): BorrowedToolEvent["type"] {
  switch (decision.decision) {
    case "request_borrow_tool":
      return "request";
    case "lend_tool":
      return "loan_granted";
    case "lend_tool_with_condition":
      return "loan_condition";
    case "refuse_request":
      return "request_refused";
    case "clarify_or_wait":
      return "clarification";
    case "use_and_return_tool":
      return "tool_used_and_returned";
    case "use_and_keep_debt":
      return "tool_used_debt_open";
    case "adapt_without_tool":
      return "adapted_without_tool";
  }
}

function eventRefs(turns: readonly BorrowedToolTurn[]) {
  return turns
    .filter((turn) => turn.ok)
    .map((turn) => `event:${turn.turn_id}`);
}

function buildEvents(turns: readonly BorrowedToolTurn[]): BorrowedToolEvent[] {
  return turns.flatMap((turn) => {
    const decision = turn.decision;
    if (!turn.ok || !decision) {
      return [];
    }
    return [
      {
        event_id: `event:${turn.turn_id}`,
        cycle: turn.cycle,
        actor_id: decision.actor_id,
        type: eventTypeForDecision(decision),
        target_actor_id: decision.target_actor_id,
        item_id: decision.item_id,
        evidence_refs: decision.evidence_refs_used,
        notes: `${decision.spoken_message} Expected action: ${decision.expected_minecraft_action}`
      }
    ];
  });
}

function scoreDimension(
  id: SocialIssueDimensionScore["id"],
  label: string,
  score: number,
  findings: string[],
  evidenceRefs: string[]
): SocialIssueDimensionScore {
  const normalized = Math.max(0, Math.min(DIMENSION_WEIGHT, score));
  return {
    id,
    label,
    weight: DIMENSION_WEIGHT,
    score: normalized,
    passed: normalized === DIMENSION_WEIGHT,
    findings,
    evidence_refs: evidenceRefs
  };
}

function getDecision(turns: readonly BorrowedToolTurn[], turnId: BorrowedToolTurnId) {
  return turns.find((turn) => turn.turn_id === turnId)?.decision;
}

function textIncludesAny(text: string | undefined, terms: readonly string[]) {
  const lower = text?.toLowerCase() ?? "";
  return terms.some((term) => lower.includes(term));
}

function scoreBorrowerRequest(turns: readonly BorrowedToolTurn[]) {
  const decision = getDecision(turns, "borrower_request");
  if (!decision) {
    return scoreDimension("borrower_request_quality", "Borrower Request Quality", 0, [
      "Borrower turn did not produce a parsed decision."
    ], []);
  }
  const findings: string[] = [];
  let score = 0;
  if (decision.actor_id === "npc_b") score += 4;
  else findings.push("Borrower request was not made by npc_b.");
  if (decision.decision === "request_borrow_tool") score += 6;
  else findings.push(`Borrower chose ${decision.decision}, not request_borrow_tool.`);
  if (decision.target_actor_id === "npc_a") score += 3;
  else findings.push("Borrower did not target npc_a.");
  if (decision.item_id === "stone_axe") score += 3;
  else findings.push("Borrower did not identify stone_axe.");
  if (textIncludesAny(`${decision.spoken_message} ${decision.reasoning_summary}`, ["borrow", "use", "logs", "return", "axe"])) {
    score += 4;
  } else {
    findings.push("Request did not explain need, use, or return context.");
  }
  return scoreDimension("borrower_request_quality", "Borrower Request Quality", score, findings.length ? findings : [
    "Jun made a clear tool-access request grounded in his work need."
  ], decision.evidence_refs_used);
}

function scoreOwnerResponse(turns: readonly BorrowedToolTurn[]) {
  const decision = getDecision(turns, "owner_response");
  if (!decision) {
    return scoreDimension("owner_response_quality", "Owner Response Quality", 0, [
      "Owner turn did not produce a parsed decision."
    ], []);
  }
  const allowed = new Set<BorrowedToolDecision["decision"]>([
    "lend_tool",
    "lend_tool_with_condition",
    "refuse_request",
    "clarify_or_wait"
  ]);
  const findings: string[] = [];
  let score = 0;
  if (decision.actor_id === "npc_a") score += 4;
  else findings.push("Owner response was not made by npc_a.");
  if (allowed.has(decision.decision)) score += 6;
  else findings.push(`Owner chose ${decision.decision}, which is not an owner-side resolution.`);
  if (decision.target_actor_id === "npc_b") score += 3;
  else findings.push("Owner did not target npc_b.");
  if (decision.item_id === "stone_axe") score += 3;
  else findings.push("Owner did not identify stone_axe.");
  if (textIncludesAny(`${decision.reasoning_summary} ${decision.expected_minecraft_action}`, ["return", "claim", "tool", "axe", "condition", "risk", "refuse"])) {
    score += 4;
  } else {
    findings.push("Owner response did not acknowledge tool ownership, return condition, or refusal rationale.");
  }
  return scoreDimension("owner_response_quality", "Owner Response Quality", score, findings.length ? findings : [
    "Mara made a clear access decision while recognizing the tool as a material claim."
  ], decision.evidence_refs_used);
}

function ownerGrantedAccess(ownerDecision: BorrowedToolDecision | undefined) {
  return ownerDecision?.decision === "lend_tool" || ownerDecision?.decision === "lend_tool_with_condition";
}

function ownerRefusedAccess(ownerDecision: BorrowedToolDecision | undefined) {
  return ownerDecision?.decision === "refuse_request" || ownerDecision?.decision === "clarify_or_wait";
}

function scoreFollowUp(turns: readonly BorrowedToolTurn[]) {
  const owner = getDecision(turns, "owner_response");
  const followUp = getDecision(turns, "borrower_follow_up");
  if (!followUp) {
    return scoreDimension("follow_up_consistency", "Follow-Up Consistency", 0, [
      "Borrower follow-up did not produce a parsed decision."
    ], []);
  }
  const findings: string[] = [];
  let score = 0;
  if (followUp.actor_id === "npc_b") score += 4;
  else findings.push("Follow-up was not made by npc_b.");
  if (ownerGrantedAccess(owner)) {
    if (followUp.decision === "use_and_return_tool" || followUp.decision === "use_and_keep_debt") {
      score += 10;
    } else {
      findings.push("Owner granted access, but borrower did not use/return or track debt.");
    }
  } else if (ownerRefusedAccess(owner)) {
    if (followUp.decision === "adapt_without_tool" || followUp.decision === "clarify_or_wait") {
      score += 10;
    } else {
      findings.push("Owner refused or delayed access, but borrower acted as if access was granted.");
    }
  } else {
    findings.push("Owner response was missing or unclear, so follow-up consistency is limited.");
    score += 4;
  }
  if (followUp.item_id === "stone_axe" || followUp.decision === "adapt_without_tool") score += 3;
  else findings.push("Follow-up did not preserve the stone_axe issue context.");
  if (textIncludesAny(`${followUp.reasoning_summary} ${followUp.expected_minecraft_action}`, ["return", "debt", "adapt", "without", "logs", "axe", "borrow"])) {
    score += 3;
  } else {
    findings.push("Follow-up did not describe return, debt, adaptation, or tool use.");
  }
  return scoreDimension("follow_up_consistency", "Follow-Up Consistency", score, findings.length ? findings : [
    "Jun's follow-up is consistent with Mara's access decision."
  ], followUp.evidence_refs_used);
}

function allowedEvidenceRefs() {
  return new Set([...availableEvidenceRefs, "event:borrower_request", "event:owner_response"]);
}

function scoreEvidenceGrounding(turns: readonly BorrowedToolTurn[]) {
  const allowed = allowedEvidenceRefs();
  const usableTurns = turns.filter((turn) => turn.ok && turn.decision);
  const findings: string[] = [];
  let valid = 0;
  for (const turn of usableTurns) {
    const refs = turn.decision?.evidence_refs_used ?? [];
    if (refs.length === 0) {
      findings.push(`${turn.turn_id} did not cite evidence refs.`);
      continue;
    }
    const unknown = refs.filter((ref) => !allowed.has(ref));
    if (unknown.length > 0) {
      findings.push(`${turn.turn_id} cited unknown refs: ${unknown.join(", ")}`);
      continue;
    }
    if (!turn.decision?.expected_minecraft_action.trim()) {
      findings.push(`${turn.turn_id} did not describe an expected Minecraft action.`);
      continue;
    }
    valid += 1;
  }
  const score = Math.round((valid / 3) * DIMENSION_WEIGHT);
  return scoreDimension("evidence_grounding", "Evidence Grounding", score, findings.length ? findings : [
    "All parsed turns cited bounded issue evidence and named expected Minecraft consequences."
  ], usableTurns.flatMap((turn) => turn.decision?.evidence_refs_used ?? []));
}

function scoreContinuity(turns: readonly BorrowedToolTurn[]) {
  const owner = getDecision(turns, "owner_response");
  const followUp = getDecision(turns, "borrower_follow_up");
  const findings: string[] = [];
  let score = 0;
  if (owner?.obligation_update && owner.obligation_update.kind !== "none") score += 6;
  else if (owner?.decision === "refuse_request") score += 4;
  else findings.push("Owner response did not create or record an obligation/refusal state.");
  if (followUp?.obligation_update && followUp.obligation_update.status !== "none") score += 6;
  else findings.push("Follow-up did not update obligation status.");
  if (followUp?.relationship_update) score += 4;
  else findings.push("Follow-up did not record relationship continuity.");
  if ((followUp?.evidence_refs_used ?? []).includes("event:owner_response")) score += 4;
  else findings.push("Follow-up did not cite the owner response event.");
  return scoreDimension(
    "obligation_or_relationship_continuity",
    "Obligation Or Relationship Continuity",
    score,
    findings.length ? findings : ["The issue produced follow-up obligation or relationship state."],
    [
      ...(owner?.evidence_refs_used ?? []),
      ...(followUp?.evidence_refs_used ?? [])
    ]
  );
}

function usageTotals(turns: readonly BorrowedToolTurn[]): ProviderUsageCounts {
  return turns.reduce<ProviderUsageCounts>((sum, turn) => {
    const usage = turn.usage_record?.usage;
    return {
      requests: sum.requests + (usage?.requests ?? 0),
      input_tokens: sum.input_tokens + (usage?.input_tokens ?? 0),
      output_tokens: sum.output_tokens + (usage?.output_tokens ?? 0),
      thinking_tokens: sum.thinking_tokens + (usage?.thinking_tokens ?? 0),
      total_tokens: sum.total_tokens + (usage?.total_tokens ?? 0)
    };
  }, {
    requests: 0,
    input_tokens: 0,
    output_tokens: 0,
    thinking_tokens: 0,
    total_tokens: 0
  });
}

function finalObligationStatus(turns: readonly BorrowedToolTurn[]) {
  const statuses: string[] = [];
  for (const turn of turns) {
    const status = turn.decision?.obligation_update?.status;
    if (status && status !== "none") {
      statuses.push(status);
    }
  }
  return statuses.at(-1);
}

function buildReport(input: {
  runId: string;
  createdAt: string;
  model: string;
  turns: BorrowedToolTurn[];
}): BorrowedToolIssueReport {
  const events = buildEvents(input.turns);
  const dimensions = [
    scoreBorrowerRequest(input.turns),
    scoreOwnerResponse(input.turns),
    scoreFollowUp(input.turns),
    scoreEvidenceGrounding(input.turns),
    scoreContinuity(input.turns)
  ];
  const score = dimensions.reduce((sum, dimension) => sum + dimension.score, 0);
  const maxScore = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);
  const status = score >= 80 ? "passed" : score > 0 ? "partial" : "failed";
  return {
    schema: "minecraft-social-issue-benchmark-report/v1",
    issue_id: BORROWED_TOOL_ISSUE_ID,
    run_id: input.runId,
    created_at: input.createdAt,
    evidence_scope: "provider_decision_only",
    provider: {
      id: "modelscope-api",
      model: input.model,
      live_provider_calls: input.turns.filter((turn) => turn.usage_record).length
    },
    environment: {
      live_minecraft_server: false,
      world_seed: "not-started-provider-decision-smoke",
      notes:
        "This smoke does not start a Minecraft server. It benchmarks provider social-issue decisions over a fixed Minecraft evidence packet."
    },
    issue: baseIssueState(),
    turns: input.turns,
    events,
    dimensions,
    summary: {
      status,
      score,
      max_score: maxScore,
      first_request_cycle: events.find((event) => event.type === "request")?.cycle,
      first_owner_response_cycle: events.find((event) =>
        ["loan_granted", "loan_condition", "request_refused", "clarification"].includes(event.type)
      )?.cycle,
      final_obligation_status: finalObligationStatus(input.turns),
      total_elapsed_ms: input.turns.reduce((sum, turn) => sum + turn.elapsed_ms, 0),
      usage: usageTotals(input.turns)
    },
    notes: [
      "This is a Qwen provider-backed decision smoke, not a live Mineflayer action benchmark.",
      "Tool/schema formatting is not a scored benchmark target; parse failures are run-validity findings.",
      "The scoring accepts grounded refusal or conditional access; it does not reward unconditional cooperation by default.",
      "A future live version must add runtime actions for physical item handoff/use/return evidence."
    ]
  };
}

export type BorrowedToolSmokeOptions = {
  model: string;
  runId?: string;
  repoRoot?: string;
};

async function callTurn(input: {
  turnId: BorrowedToolTurnId;
  cycle: number;
  actorId: "npc_a" | "npc_b";
  turns: readonly BorrowedToolTurn[];
  config: ModelScopeApiProviderConfig;
  runId: string;
}) {
  const prompt = buildUserPrompt(input.turnId, input.turns);
  const result = await callModelScopeJsonSchema<BorrowedToolDecision>({
    config: input.config,
    schemaName: "borrowed_tool_decision",
    schema: decisionSchema,
    system: systemPrompt(),
    user: prompt,
    usageContext: {
      repoRoot: input.config.repoRoot,
      runId: input.runId,
      actorId: input.actorId,
      turnId: input.turnId,
      stage: "minecraft-social-issue-benchmark"
    }
  });

  if (!result.ok) {
    return {
      turn_id: input.turnId,
      cycle: input.cycle,
      actor_id: input.actorId,
      prompt,
      ok: false,
      raw_text: result.rawText,
      error_kind: result.errorKind,
      error_message: result.message,
      elapsed_ms: result.elapsedMs,
      usage_record: result.usageRecord
    } satisfies BorrowedToolTurn;
  }

  return {
    turn_id: input.turnId,
    cycle: input.cycle,
    actor_id: input.actorId,
    prompt,
    ok: true,
    decision: result.parsed,
    raw_text: result.rawText,
    elapsed_ms: result.elapsedMs,
    usage_record: result.usageRecord
  } satisfies BorrowedToolTurn;
}

export async function runBorrowedToolQwenSmoke(options: BorrowedToolSmokeOptions) {
  const repoRoot = options.repoRoot ?? resolveRepoRoot();
  loadRepoDotEnv(repoRoot, { overrideKeys: ["MODELSCOPE_API_KEY"] });
  const createdAt = new Date().toISOString();
  const runId = options.runId ?? `${BORROWED_TOOL_ISSUE_ID}-${createdAt.replaceAll(/[:.]/g, "-")}`;
  const config: ModelScopeApiProviderConfig = {
    apiKey: process.env.MODELSCOPE_API_KEY ?? "",
    model: options.model,
    repoRoot,
    maxRetries: 0
  };

  const turns: BorrowedToolTurn[] = [];
  turns.push(await callTurn({
    turnId: "borrower_request",
    cycle: 1,
    actorId: "npc_b",
    turns,
    config,
    runId
  }));
  turns.push(await callTurn({
    turnId: "owner_response",
    cycle: 2,
    actorId: "npc_a",
    turns,
    config,
    runId
  }));
  turns.push(await callTurn({
    turnId: "borrower_follow_up",
    cycle: 3,
    actorId: "npc_b",
    turns,
    config,
    runId
  }));

  return buildReport({
    runId,
    createdAt,
    model: options.model,
    turns
  });
}
