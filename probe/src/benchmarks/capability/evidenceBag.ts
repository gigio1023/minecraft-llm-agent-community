/**
 * Offline structured evidence for capability predicates.
 *
 * Every observed value used for scoring carries non-empty source artifact refs.
 * Setup/fixture values must set origin "setup" and never satisfy acquisition or
 * placement targets. Free-form prose facts are not scoring authority.
 */

export type EvidenceOriginV1 = "setup" | "run";

/** Observed value with at least one resolvable source artifact ref. */
export type EvidencedValueV1<T> = {
  value: T;
  evidence_refs: [string, ...string[]];
  origin: EvidenceOriginV1;
};

export type CapabilityEvidenceBagV1 = {
  schema: "capability-evidence-bag/v1";
  actor_id: string;
  inventory?: EvidencedValueV1<Record<string, number>>;
  held_item?: EvidencedValueV1<{ name: string; count?: number } | null>;
  actor_position?: EvidencedValueV1<{ x: number; y: number; z: number }>;
  known_blocks?: Array<{
    block: string;
    position?: { x: number; y: number; z: number };
    evidence_ref: string;
    origin: EvidenceOriginV1;
  }>;
  named_positions?: Record<string, EvidencedValueV1<{ x: number; y: number; z: number }>>;
  containers?: Array<{
    container_ref: string;
    items: Record<string, number>;
    evidence_ref: string;
    origin: EvidenceOriginV1;
  }>;
  available: {
    inventory: boolean;
    held_item: boolean;
    position: boolean;
    blocks: boolean;
    containers: boolean;
  };
};
