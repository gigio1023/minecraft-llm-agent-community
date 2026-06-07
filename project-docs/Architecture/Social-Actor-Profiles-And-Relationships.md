---
sidebar_position: 4
---

# Social Actor Profiles And Relationships

This page defines the active design direction for actor profiles, goals, and
relationships.

The repo should not model relationships as vague `0..1` floats. Use explicit
categories first, then use a small ordinal score inside each category only when
the runtime needs ordering or threshold behavior.

## Design Principle

Persona text is not the source of truth for behavior.

Actor behavior should come from:

- gameplay role;
- public obligation;
- private goal;
- relationship stance;
- action skill ownership;
- evidence-backed memory.

Dialogue style can make an actor sound distinct, but the actor's next action
must still be grounded in Minecraft state, owned action skills, and runtime
evidence.

## Actor Profile

Each actor should have one canonical profile that feeds gameplay, dialogue, actor
workspace initialization, and provider context.

```ts
type ActorProfile = {
  actor_id: string;
  display_name: string;
  gameplay_role: "quartermaster" | "gatherer" | "crafter";
  social_archetype: SocialArchetype;
  public_responsibility: PublicResponsibility;
  private_goal: PrivateGoal;
  learning_bias: LearningBias;
  risk_posture: RiskPosture;
  speech_style: SpeechStyle;
};
```

Suggested initial profiles:

| Actor | Profile |
|-------|---------|
| `npc_a` / Mara | `quartermaster`, storage auditor, wants reliable shared state, trusts evidence more than claims |
| `npc_b` / Jun | `gatherer`, field worker, wants to prove usefulness through real resource delivery |
| `npc_c` / Iris | `crafter`, workstation maker, wants predictable inputs and dislikes broken material promises |

## Relationship Axes

Each relationship edge should be directional. `npc_a -> npc_b` and
`npc_b -> npc_a` can differ.

```ts
type RelationshipEdge = {
  from_actor_id: string;
  to_actor_id: string;
  trust: TrustCategory;
  obligation: ObligationCategory;
  dependency: DependencyCategory;
  friction: FrictionCategory;
  familiarity: FamiliarityCategory;
  recent_events: RelationshipEventRef[];
};
```

### TrustCategory

Trust answers: "Will I believe this actor's claims and rely on their work?"

| Category | Score | Meaning |
|----------|-------|---------|
| `unproven` | 0 | No useful evidence yet. |
| `distrusted` | 1 | Repeated false claims, hidden failures, or harmful actions. |
| `cautious` | 2 | Some failures or missing evidence; verify before relying. |
| `reliable` | 3 | Recent evidence shows completed obligations. |
| `trusted` | 4 | Repeated completion across multiple obligations. |

Rules:

- Start most edges at `unproven`.
- Move toward `reliable` only from runtime evidence, not dialogue confidence.
- Move down on fake progress, repeated blockers, or taking shared resources
  without visible contribution.

### ObligationCategory

Obligation answers: "How much does this actor currently owe the other actor?"

| Category | Score | Meaning |
|----------|-------|---------|
| `none` | 0 | No current debt or request. |
| `requested` | 1 | A request exists but has not been accepted. |
| `accepted` | 2 | Actor agreed or role context assigned the work. |
| `overdue` | 3 | Accepted work is stalled or blocking another actor. |
| `fulfilled` | 4 | Obligation was recently completed. |

Rules:

- `fulfilled` is transient; it should decay to `none` after it has been recorded
  into memory or relationship trust.
- `overdue` should generate context, not direct punishment.

### DependencyCategory

Dependency answers: "Does my next meaningful task depend on this actor?"

| Category | Score | Meaning |
|----------|-------|---------|
| `independent` | 0 | My next task can proceed without them. |
| `helpful` | 1 | Their work improves my path but is not required. |
| `blocked_by` | 2 | My current task is blocked until they act. |
| `critical_path` | 3 | The shared objective cannot advance without them. |

Rules:

- This is computed from current goals and shared inventory, not personality.
- It should change quickly as world state changes.

### FrictionCategory

Friction answers: "How socially costly is the next interaction?"

| Category | Score | Meaning |
|----------|-------|---------|
| `none` | 0 | No active tension. |
| `annoyed` | 1 | Minor repeated inconvenience. |
| `frustrated` | 2 | A blocker or broken expectation is affecting work. |
| `resentful` | 3 | Repeated failures or selfish resource behavior. |
| `hostile` | 4 | Only allowed for explicitly hostile scenarios. |

Rules:

- Cooperative Phase 1 actors should not jump to `hostile`.
- Friction should affect wording and request style before it affects tool
  permissions.

### FamiliarityCategory

Familiarity answers: "How much shared history exists?"

| Category | Score | Meaning |
|----------|-------|---------|
| `stranger` | 0 | No shared interaction. |
| `acquaintance` | 1 | One or two observed interactions. |
| `teammate` | 2 | Repeated shared task participation. |
| `partner` | 3 | Repeated successful dependency loops. |

Rules:

- Familiarity should not imply trust. A familiar actor can still be unreliable.
- Use familiarity to make dialogue less generic and memory retrieval more
  specific.

## Relationship Event Types

Relationship changes must cite event categories.

```ts
type RelationshipEventKind =
  | "resource_delivered"
  | "shared_storage_updated"
  | "request_made"
  | "request_accepted"
  | "request_ignored"
  | "fake_progress_rejected"
  | "verification_failed"
  | "action_skill_promoted"
  | "action_skill_retired"
  | "helped_unblock_task"
  | "took_shared_resource"
  | "returned_shared_value";
```

Examples:

- `npc_b` collects logs for itself: no positive social relationship event is
  emitted yet, because inventory gain is not a social handoff.
- `npc_b` deposits logs into shared storage: `shared_storage_updated`, trust can
  improve because another actor can inspect the shared value.
- `npc_b` swings at a tree but no inventory changes: `fake_progress_rejected`,
  trust can move `unproven -> cautious`.
- `npc_c` returns a crafted item or otherwise creates observable shared value:
  `returned_shared_value`, trust can move `cautious -> reliable`.
- `npc_a` detects a shortage and asks `npc_b` for logs: `request_made`,
  obligation can move `none -> requested`.

## Goal Stack

Provider context should expose goals as categories rather than one untyped
sentence.

```ts
type ActorGoalStack = {
  public_obligation?: GoalFrame;
  private_goal?: GoalFrame;
  relationship_goal?: GoalFrame;
  learning_goal?: GoalFrame;
  recovery_goal?: GoalFrame;
};

type GoalFrame = {
  kind: GoalKind;
  priority: GoalPriority;
  status: GoalStatus;
  target_actor_id?: string;
  target_item?: string;
  evidence_refs: string[];
};
```

### GoalKind

```ts
type GoalKind =
  | "gather_resource"
  | "craft_item"
  | "deposit_shared"
  | "withdraw_shared"
  | "inspect_storage"
  | "ask_for_help"
  | "answer_request"
  | "repair_action_skill"
  | "recover_from_failure"
  | "reduce_friction";
```

### GoalPriority

```ts
type GoalPriority = "background" | "normal" | "urgent" | "blocking";
```

### GoalStatus

```ts
type GoalStatus =
  | "unstarted"
  | "in_progress"
  | "blocked"
  | "waiting_on_actor"
  | "verified_complete"
  | "failed";
```

This lets the provider see "why this matters" without relying on ambiguous
numeric context values.

## Scaling Rule

If a numeric value is needed for sorting, derive it from the enum category.

Do not store arbitrary values such as `trust: 0.73`.

Store:

```json
{
  "trust": "reliable",
  "trust_score": 3,
  "trust_reason": "npc_b delivered logs to shared storage",
  "evidence_refs": ["data/actors/npc_b/evidence/tool-attempt-turn-0003-collect_logs.json"]
}
```

The score is a projection of the category, not a separate source of truth.

## Relationship Action Context Signal

Relationship state can influence intent, but it must not grant new tools.

The runtime projects relationship edges into bounded context signal records such as:

```ts
type RelationshipActionContextSignalKind =
  | "recovery_social_caution"
  | "obligation_repair"
  | "friction_reduction"
  | "cooperative_confidence";
```

Every context signal record carries these guardrails:

```json
{
  "action_boundary": "intent_context_only",
  "active_action_skill_required": true,
  "role_contract_boundary": "unchanged"
}
```

That means relationship context signal can make a provider prefer a cautious request,
repair an overdue obligation, or coordinate with a reliable actor, but it cannot
bypass active action skill records or role contracts.

## Reviewer Proposal Application

Per-actor reviewers may propose relationship events, but they do not mutate
relationship memory directly.

The guarded runtime applier is the only path that applies
`relationship_event_proposals`. It validates:

- supported relationship event enum;
- known actor workspace and workspace-safe actor id;
- non-self target actor;
- non-empty evidence refs;
- evidence refs under the reviewed actor workspace;
- idempotent runtime-generated event ids plus a durable applied marker.

For a review of `npc_b` with `target_actor_id: "npc_a"`, the applied edge is
`npc_a -> npc_b`. The target actor is the observer whose stance toward the
reviewed actor changed.

Unapplied `relationship_event_proposals` remain visible in recent reviewer
context as proposal-only records. They do not become relationship context signal until
the guarded applier writes the relationship edge.
