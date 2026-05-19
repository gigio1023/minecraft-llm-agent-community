# Pressure, Intent, And Lifecycle Data Model

Status: branch-local working design for `feature/runtime-contract-refactor`
Date: 2026-05-20

## Purpose

This file defines the branch-local data model for the new control loop.

It is intentionally compact. The runtime should compute structured pressure and
intent objects that are easy to serialize into transcript, checkpoint, and LLM
context.

## Lifecycle Mode

```ts
type LifecycleMode =
  | "bootstrap"
  | "normal"
  | "recovery"
  | "scarcity"
  | "danger"
  | "social_obligation";
```

## Pressure Kind

```ts
type PressureKind =
  | "bootstrap_missing_progress"
  | "recovery_after_death"
  | "shared_shortage"
  | "blocked_teammate"
  | "public_obligation_due"
  | "private_obligation_due"
  | "nearby_opportunity"
  | "hostile_risk"
  | "inventory_overload"
  | "station_missing"
  | "conversation_backlog"
  | "exploration_gap";
```

## Pressure Record

```ts
type PressureRecord = {
  id: string;
  actorId: string;
  kind: PressureKind;
  summary: string;
  source: "world" | "memory" | "bulletin" | "mailbox" | "lifecycle" | "runtime";
  relatedActorId?: string;
  relatedChestId?: string;
  relatedTaskId?: string;
  relatedItemNames?: string[];
  urgency: number;
  roleRelevance: number;
  sharedImportance: number;
  personalImportance: number;
  accessibility: number;
  novelty: number;
  recoveryWeight: number;
  interruptsCurrentIntent: boolean;
  expiresAtTurn?: number;
};
```

## Intent Record

```ts
type IntentRecord = {
  id: string;
  actorId: string;
  kind:
    | "bootstrap_progress"
    | "resupply_shared_storage"
    | "unblock_teammate"
    | "fulfill_obligation"
    | "inspect_settlement_state"
    | "claim_nearby_opportunity"
    | "recover_basic_tools"
    | "avoid_or_retreat"
    | "request_or_handoff"
    | "wait_or_defer";
  summary: string;
  chosenFromPressureIds: string[];
  lifecycleMode: LifecycleMode;
  status: "active" | "completed" | "abandoned" | "interrupted";
  source: "llm" | "runtime_default";
  successCondition: string;
  abandonmentCondition?: string;
  interruptible: boolean;
  createdAtTurn: number;
  lastUpdatedTurn: number;
};
```

## Intent Candidate Envelope For LLM Input

```ts
type IntentSelectionContext = {
  actorId: string;
  roleId: string;
  lifecycleMode: LifecycleMode;
  currentIntent: IntentRecord | null;
  topPressures: PressureRecord[];
  bulletinSummary: unknown[];
  mailboxSummary: unknown[];
  recentFailures: string[];
  privateMemorySummary: string[];
  sharedSettlementSummary: Record<string, unknown>;
  allowedSkillIds: string[];
};
```

## Skill Candidate Envelope

```ts
type SkillCandidate = {
  id: string;
  summary: string;
  intentKinds: IntentRecord["kind"][];
  validRoles: string[];
  preconditionSummary: string[];
};
```

## Example Pressure Set

```json
[
  {
    "id": "p1",
    "actorId": "npc_a",
    "kind": "blocked_teammate",
    "summary": "crafter is waiting on logs for planks",
    "source": "bulletin",
    "relatedActorId": "npc_b",
    "relatedItemNames": ["oak_log"],
    "urgency": 0.85,
    "roleRelevance": 0.95,
    "sharedImportance": 0.9,
    "personalImportance": 0.35,
    "accessibility": 0.8,
    "novelty": 0.4,
    "recoveryWeight": 0.0,
    "interruptsCurrentIntent": true
  },
  {
    "id": "p2",
    "actorId": "npc_a",
    "kind": "nearby_opportunity",
    "summary": "exposed oak tree is within short travel distance",
    "source": "world",
    "urgency": 0.55,
    "roleRelevance": 0.9,
    "sharedImportance": 0.7,
    "personalImportance": 0.45,
    "accessibility": 0.95,
    "novelty": 0.6,
    "recoveryWeight": 0.0,
    "interruptsCurrentIntent": false
  }
]
```

## Example Selected Intent

```json
{
  "id": "i7",
  "actorId": "npc_a",
  "kind": "unblock_teammate",
  "summary": "gather logs and restock the shared chest for the crafter",
  "chosenFromPressureIds": ["p1", "p2"],
  "lifecycleMode": "normal",
  "status": "active",
  "source": "llm",
  "successCondition": "shared chest contains at least 4 logs or crafter is no longer blocked",
  "abandonmentCondition": "hostile pressure becomes urgent near the actor",
  "interruptible": true,
  "createdAtTurn": 14,
  "lastUpdatedTurn": 14
}
```

## Reinjection Rules

Bootstrap and recovery should be lifecycle-driven, not hardcoded forever.

Suggested reinjection triggers:

- actor death
- no pickaxe and no crafting table after respawn
- no known shared chest
- shared essentials below floor threshold
- repeated failure to resume current social or production chain

Suggested dampening triggers:

- stable shared storage exists
- actor has usable gear
- another actor already covers the same missing progression slice
- stronger obligation or danger pressure exists

## Transcript Expectations

At minimum, each turn should be able to record:

- lifecycle mode
- top pressure ids and summaries
- selected intent
- whether intent was continued, interrupted, or replaced
- executed bounded skill/tool
- post-action refresh

This keeps pressure and intent reconstructable from transcript later.
