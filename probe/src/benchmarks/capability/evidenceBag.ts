export type CapabilityEvidenceBagV1 = {
  schema: "capability-evidence-bag/v1";
  actor_id: string;
  inventory_counts?: Record<string, number>;
  held_item?: { name: string; count?: number } | null;
  actor_position?: { x: number; y: number; z: number };
  known_blocks?: Array<{
    block: string;
    position?: { x: number; y: number; z: number };
    evidence_ref: string;
  }>;
  named_positions?: Record<
    string,
    { x: number; y: number; z: number; evidence_ref?: string }
  >;
  containers?: Array<{
    container_ref: string;
    items: Record<string, number>;
    evidence_ref: string;
  }>;
  facts?: Array<{
    evidence_ref: string;
    kind: string;
    tool?: string;
    status?: string;
    item?: string;
    block?: string;
    [key: string]: unknown;
  }>;
  available: {
    inventory: boolean;
    held_item: boolean;
    position: boolean;
    blocks: boolean;
    containers: boolean;
    facts: boolean;
  };
};
