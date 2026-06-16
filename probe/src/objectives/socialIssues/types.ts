import type { ProviderUsageRecord } from "../../provider/providerUsageTracker.js";

export const BORROWED_TOOL_ISSUE_ID = "borrowed_tool_with_return_or_debt_v1" as const;

export type SocialIssueProviderId = "modelscope-api";

export type BorrowedToolDecisionKind =
  | "request_borrow_tool"
  | "lend_tool"
  | "lend_tool_with_condition"
  | "refuse_request"
  | "clarify_or_wait"
  | "use_and_return_tool"
  | "use_and_keep_debt"
  | "adapt_without_tool";

export type BorrowedToolDecision = {
  actor_id: "npc_a" | "npc_b";
  target_actor_id?: "npc_a" | "npc_b";
  decision: BorrowedToolDecisionKind;
  item_id?: "stone_axe";
  spoken_message: string;
  expected_minecraft_action: string;
  reasoning_summary: string;
  evidence_refs_used: string[];
  obligation_update?: {
    kind: "loan" | "debt" | "repair" | "refusal" | "none";
    status: "open" | "fulfilled" | "refused" | "blocked" | "none";
    summary: string;
  };
  relationship_update?: {
    from_actor_id: "npc_a" | "npc_b";
    to_actor_id: "npc_a" | "npc_b";
    trust_delta: "up" | "down" | "unchanged";
    summary: string;
  };
};

export type BorrowedToolTurnId = "borrower_request" | "owner_response" | "borrower_follow_up";

export type BorrowedToolTurn = {
  turn_id: BorrowedToolTurnId;
  cycle: number;
  actor_id: "npc_a" | "npc_b";
  prompt: string;
  ok: boolean;
  decision?: BorrowedToolDecision;
  raw_text?: string;
  error_kind?: string;
  error_message?: string;
  elapsed_ms: number;
  usage_record?: ProviderUsageRecord;
};

export type BorrowedToolEvent = {
  event_id: string;
  cycle: number;
  actor_id: "npc_a" | "npc_b";
  type:
    | "request"
    | "loan_granted"
    | "loan_condition"
    | "request_refused"
    | "clarification"
    | "tool_used_and_returned"
    | "tool_used_debt_open"
    | "adapted_without_tool";
  target_actor_id?: "npc_a" | "npc_b";
  item_id?: "stone_axe";
  evidence_refs: string[];
  notes: string;
};

export type SocialIssueDimensionId =
  | "borrower_request_quality"
  | "owner_response_quality"
  | "follow_up_consistency"
  | "evidence_grounding"
  | "obligation_or_relationship_continuity";

export type SocialIssueDimensionScore = {
  id: SocialIssueDimensionId;
  label: string;
  weight: number;
  score: number;
  passed: boolean;
  findings: string[];
  evidence_refs: string[];
};

export type BorrowedToolIssueReport = {
  schema: "minecraft-social-issue-benchmark-report/v1";
  issue_id: typeof BORROWED_TOOL_ISSUE_ID;
  run_id: string;
  created_at: string;
  evidence_scope: "provider_decision_only";
  provider: {
    id: SocialIssueProviderId;
    model: string;
    live_provider_calls: number;
  };
  environment: {
    live_minecraft_server: false;
    world_seed: "not-started-provider-decision-smoke";
    notes: string;
  };
  issue: {
    title: string;
    world_state: string[];
    actors: Array<{
      actor_id: "npc_a" | "npc_b";
      name: string;
      stake: string;
    }>;
    evidence_refs_available: string[];
    valid_resolution_space: string[];
  };
  turns: BorrowedToolTurn[];
  events: BorrowedToolEvent[];
  dimensions: SocialIssueDimensionScore[];
  summary: {
    status: "passed" | "partial" | "failed";
    score: number;
    max_score: number;
    first_request_cycle?: number;
    first_owner_response_cycle?: number;
    final_obligation_status?: string;
    total_elapsed_ms: number;
    usage: {
      requests: number;
      input_tokens: number;
      output_tokens: number;
      thinking_tokens: number;
      total_tokens: number;
    };
  };
  notes: string[];
};
