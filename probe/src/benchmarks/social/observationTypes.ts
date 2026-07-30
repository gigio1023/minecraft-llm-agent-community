/**
 * Offline observation labels for interdependent social opportunity scoring.
 *
 * These are report/scoring enums only. Scenario declarations must not embed
 * prescribed social responses; runners and reports may record which of these
 * outcomes was observed from runtime evidence.
 *
 * Step C2: schema-only. No runner wiring yet (C3+).
 */
export const SOCIAL_INTERACTION_OPPORTUNITY_OBSERVATIONS = [
  "opportunity_absent",
  "opportunity_present_ignored",
  "refused",
  "attempted",
  "runtime_execution_failed",
  "material_handoff_verified",
  "no_subsequent_response"
] as const;

export type SocialInteractionOpportunityObservationV1 =
  (typeof SOCIAL_INTERACTION_OPPORTUNITY_OBSERVATIONS)[number];

/**
 * Optional structured observation row for a declared interaction opportunity
 * inside a response window. Joinable later by run/cycle/actor/opportunity.
 */
export type SocialOpportunityObservationRecordV1 = {
  schema: "social-opportunity-observation/v1";
  scenario_id: string;
  scenario_version: string;
  opportunity_id: string;
  observation: SocialInteractionOpportunityObservationV1;
  /** Actors whose subsequent turns were required to close the window. */
  response_window_actor_ids: string[];
  /** Evidence refs that ground the observation; never provider prose alone. */
  evidence_refs: string[];
  notes?: string;
};
