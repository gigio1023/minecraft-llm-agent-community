import type {
  LegibilityMaterialAccessLabel,
  LegibilitySocialResponseLabel,
  ResponseWindowRecord
} from "./types.js";

export type EvidenceGroundedLabelDecision<T extends string> = {
  classes: T[];
  evidence_refs: string[];
};

export type MaterialAccessEvidenceEvent = {
  schema: "material-access-evidence/v1";
  event_kind:
    | "inventory_delta"
    | "container_delta"
    | "access_event"
    | "typed_claim_or_obligation"
    | "verified_absence";
  classes: LegibilityMaterialAccessLabel[];
  evidence_refs: string[];
};

const materialAccessLabels = new Set<LegibilityMaterialAccessLabel>([
  "no_material_delta",
  "inventory_gain",
  "inventory_loss",
  "container_gain",
  "container_loss",
  "possession_or_access_granted",
  "possession_or_access_refused",
  "public_affordance_created",
  "public_affordance_used",
  "claim_or_obligation_event_recorded",
  "unknown_material_delta"
]);

function unique(values: readonly string[]) {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function requireEvidenceRefs(refs: readonly string[], labelContext: string) {
  const uniqueRefs = unique(refs);
  if (uniqueRefs.length === 0) {
    throw new Error(`Evidence-grounded label ${labelContext} has no evidence refs`);
  }
  return uniqueRefs;
}

function requireClosedNonVacuousWindow(window: ResponseWindowRecord) {
  if (
    window.status !== "closed" ||
    !window.closed_at ||
    !window.close_reason ||
    window.required_responder_actor_ids.length === 0
  ) {
    throw new Error(`Cannot label social response from non-closed or vacuous window ${window.window_id}`);
  }
}

export function labelSocialResponseFromWindow(
  window: ResponseWindowRecord
): EvidenceGroundedLabelDecision<LegibilitySocialResponseLabel> {
  requireClosedNonVacuousWindow(window);
  if (window.response_chat_events.length === 0) {
    return {
      classes: ["no_observable_response"],
      evidence_refs: requireEvidenceRefs(window.evidence_refs, "no_observable_response")
    };
  }
  return {
    classes: ["unknown_social_response"],
    evidence_refs: requireEvidenceRefs(
      window.response_chat_events.flatMap((chatEvent) => chatEvent.evidence_refs),
      "unknown_social_response"
    )
  };
}

function validateMaterialEvidence(event: MaterialAccessEvidenceEvent) {
  if (event.schema !== "material-access-evidence/v1") {
    throw new Error(`Unknown material evidence schema: ${(event as { schema?: unknown }).schema}`);
  }
  if (event.classes.length === 0) {
    throw new Error("Material evidence must declare at least one material label class");
  }
  for (const label of event.classes) {
    if (!materialAccessLabels.has(label)) {
      throw new Error(`Unknown material access label: ${label}`);
    }
  }
  requireEvidenceRefs(event.evidence_refs, "material_access");
}

export function labelMaterialAccessFromEvidence(input: {
  materialEvidence: readonly MaterialAccessEvidenceEvent[];
  fallbackEvidenceRefs: readonly string[];
}): EvidenceGroundedLabelDecision<LegibilityMaterialAccessLabel> {
  if (input.materialEvidence.length === 0) {
    return {
      classes: ["unknown_material_delta"],
      evidence_refs: requireEvidenceRefs(input.fallbackEvidenceRefs, "unknown_material_delta")
    };
  }

  for (const event of input.materialEvidence) {
    validateMaterialEvidence(event);
  }
  return {
    classes: [...new Set(input.materialEvidence.flatMap((event) => event.classes))],
    evidence_refs: requireEvidenceRefs(
      input.materialEvidence.flatMap((event) => event.evidence_refs),
      "material_access"
    )
  };
}
