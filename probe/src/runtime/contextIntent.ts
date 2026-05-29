import type { DeterministicTask } from "../gameplay/curriculum/deterministicCurriculum.js";

/** Runtime mode used by deterministic probe loops before provider planning. */
export type LifecycleMode =
  | "bootstrap"
  | "normal"
  | "recovery"
  | "scarcity"
  | "danger"
  | "social_obligation";

/**
 * Runtime-observed context that can explain deterministic intent continuity.
 *
 * These signals are not architectural "needs" or provider commands. They are
 * compact evidence markers derived from observations, lifecycle state, or social
 * artifacts so transcripts can explain why a deterministic fallback intent was
 * kept, switched, or deferred.
 */
export type ContextSignalKind =
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

export type ContextSignalRecord = {
  id: string;
  actorId: string;
  kind: ContextSignalKind;
  summary: string;
  source: "world" | "memory" | "bulletin" | "mailbox" | "lifecycle" | "runtime";
  relatedActorId?: string;
  relatedTaskId?: string;
  relatedItemNames?: string[];
  salience: number;
  roleRelevance: number;
  sharedImportance: number;
  personalImportance: number;
  accessibility: number;
  novelty: number;
  recoveryWeight: number;
  interruptsCurrentIntent: boolean;
};

/** The compact intent chosen for deterministic probe fallback. */
export type IntentKind =
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

export type IntentRecord = {
  id: string;
  actorId: string;
  kind: IntentKind;
  summary: string;
  chosenFromContextSignalIds: string[];
  lifecycleMode: LifecycleMode;
  status: "active" | "completed" | "abandoned" | "interrupted";
  source: "llm" | "runtime_default";
  successCondition: string;
  abandonmentCondition?: string;
  interruptible: boolean;
  createdAtTurn: number;
  lastUpdatedTurn: number;
};

export type IntentTransition = "selected" | "continued" | "interrupted" | "replaced";

export type ContextIntentState = {
  actorId: string;
  turn: number;
  lifecycleMode: LifecycleMode;
  contextSignals: ContextSignalRecord[];
  currentIntent: IntentRecord;
  intentTransition: IntentTransition;
};

type VisibleActor = {
  id: string;
  distance: number;
  busy?: boolean;
};

type InventoryItem = {
  name: string;
  count: number;
};

type Observation = {
  status: string;
  visibleActors: VisibleActor[];
  inventory?: InventoryItem[];
  memory: unknown[];
};

export type BuildContextIntentStateArgs = {
  actorId: string;
  turn: number;
  observation: Observation;
  currentTask: DeterministicTask | null;
  completedTaskIds: string[];
  previousIntent?: IntentRecord;
  /** External context signals injected by obligation router, hostile system, etc. */
  externalContextSignals?: ContextSignalRecord[];
  /** Reinjection triggers from settlement state */
  reinjectionHints?: {
    hasPickaxe?: boolean;
    hasCraftingTable?: boolean;
    sharedEssentialsBelowFloor?: boolean;
    recentDeathCount?: number;
  };
};

// Deterministic curriculum order is also the recovery spine: regressing to an
// earlier task after it was completed is evidence of lost gear or station state.
const BOOTSTRAP_TASK_IDS = [
  "collect_4_logs",
  "craft_planks_and_sticks",
  "craft_crafting_table"
] as const;

function detectRecovery(
  currentTask: DeterministicTask | null,
  completedTaskIds: string[]
): boolean {
  if (!currentTask) {
    return false;
  }

  // If a task earlier than completed progression becomes current again, assume
  // inventory/station loss until observation-specific recovery signals improve.
  return completedTaskIds.some(
    (completedId) =>
      BOOTSTRAP_TASK_IDS.indexOf(completedId as typeof BOOTSTRAP_TASK_IDS[number]) >
      BOOTSTRAP_TASK_IDS.indexOf(currentTask.id as typeof BOOTSTRAP_TASK_IDS[number])
  );
}

function resolveLifecycleMode(
  currentTask: DeterministicTask | null,
  completedTaskIds: string[],
  previousIntent?: IntentRecord,
  reinjectionHints?: BuildContextIntentStateArgs["reinjectionHints"]
): LifecycleMode {
  // External reinjection hints outrank intent continuity because death, lost
  // tools, and shared scarcity need to interrupt stale plans.
  if (reinjectionHints) {
    if (reinjectionHints.recentDeathCount && reinjectionHints.recentDeathCount > 0) {
      return "recovery";
    }

    if (completedTaskIds.length > 0 && reinjectionHints.hasPickaxe === false && reinjectionHints.hasCraftingTable === false) {
      return "recovery";
    }

    if (reinjectionHints.sharedEssentialsBelowFloor) {
      return "scarcity";
    }
  }

  if (currentTask && detectRecovery(currentTask, completedTaskIds)) {
    return "recovery";
  }

  if (currentTask && BOOTSTRAP_TASK_IDS.includes(currentTask.id as typeof BOOTSTRAP_TASK_IDS[number])) {
    return "bootstrap";
  }

  if (previousIntent) {
    return previousIntent.lifecycleMode === "bootstrap" || previousIntent.lifecycleMode === "recovery"
      ? "normal"
      : previousIntent.lifecycleMode;
  }

  return "normal";
}

let contextSignalIdCounter = 0;

function nextContextSignalId() {
  contextSignalIdCounter += 1;
  return `context-signal-${contextSignalIdCounter}`;
}

function computeContextSignals(
  actorId: string,
  observation: Observation,
  currentTask: DeterministicTask | null,
  lifecycleMode: LifecycleMode,
  reinjectionHints?: BuildContextIntentStateArgs["reinjectionHints"]
): ContextSignalRecord[] {
  const contextSignals: ContextSignalRecord[] = [];

  if (currentTask && lifecycleMode === "bootstrap") {
    contextSignals.push({
      id: nextContextSignalId(),
      actorId,
      kind: "bootstrap_missing_progress",
      summary: `${currentTask.id}: ${currentTask.reason}`,
      source: "lifecycle",
      relatedTaskId: currentTask.id,
      salience: 0.9,
      roleRelevance: 0.9,
      sharedImportance: 0.8,
      personalImportance: 0.7,
      accessibility: 0.8,
      novelty: 0.5,
      recoveryWeight: 0.0,
      interruptsCurrentIntent: false
    });
  }

  if (lifecycleMode === "recovery") {
    contextSignals.push({
      id: nextContextSignalId(),
      actorId,
      kind: "recovery_after_death",
      summary: currentTask
        ? `Recovery needed: ${currentTask.reason}`
        : "Recovery needed: previously completed progression is missing",
      source: "lifecycle",
      relatedTaskId: currentTask?.id,
      salience: 0.95,
      roleRelevance: 0.9,
      sharedImportance: 0.85,
      personalImportance: 0.9,
      accessibility: 0.7,
      novelty: 0.8,
      recoveryWeight: 1.0,
      interruptsCurrentIntent: true
    });
  }

  if (lifecycleMode === "scarcity" && reinjectionHints?.sharedEssentialsBelowFloor) {
    contextSignals.push({
      id: nextContextSignalId(),
      actorId,
      kind: "shared_shortage",
      summary: "Shared essential resources are below minimum threshold",
      source: "lifecycle",
      salience: 0.85,
      roleRelevance: 0.8,
      sharedImportance: 0.95,
      personalImportance: 0.6,
      accessibility: 0.7,
      novelty: 0.4,
      recoveryWeight: 0.3,
      interruptsCurrentIntent: true
    });
  }

  if (reinjectionHints?.hasCraftingTable === false && lifecycleMode !== "recovery") {
    contextSignals.push({
      id: nextContextSignalId(),
      actorId,
      kind: "station_missing",
      summary: "No crafting table available - progression blocked",
      source: "world",
      salience: 0.7,
      roleRelevance: 0.8,
      sharedImportance: 0.7,
      personalImportance: 0.6,
      accessibility: 0.6,
      novelty: 0.5,
      recoveryWeight: 0.2,
      interruptsCurrentIntent: false
    });
  }

  const nearActors = observation.visibleActors.filter(
    (actor) => actor.distance <= 3 && !actor.busy
  );

  if (nearActors.length > 0 && !currentTask) {
    contextSignals.push({
      id: nextContextSignalId(),
      actorId,
      kind: "nearby_opportunity",
      summary: `${nearActors[0].id} is nearby and available`,
      source: "world",
      relatedActorId: nearActors[0].id,
      salience: 0.55,
      roleRelevance: 0.7,
      sharedImportance: 0.5,
      personalImportance: 0.45,
      accessibility: 0.95,
      novelty: 0.6,
      recoveryWeight: 0.0,
      interruptsCurrentIntent: false
    });
  }

  // Inventory overload (more than 27 slots used is close to full)
  if (observation.inventory && observation.inventory.length > 27) {
    contextSignals.push({
      id: nextContextSignalId(),
      actorId,
      kind: "inventory_overload",
      summary: "Inventory is nearly full, need to deposit items",
      source: "world",
      salience: 0.6,
      roleRelevance: 0.7,
      sharedImportance: 0.5,
      personalImportance: 0.8,
      accessibility: 0.8,
      novelty: 0.3,
      recoveryWeight: 0.0,
      interruptsCurrentIntent: false
    });
  }

  return contextSignals;
}

let intentIdCounter = 0;

function nextIntentId() {
  intentIdCounter += 1;
  return `intent-${intentIdCounter}`;
}

function selectIntent(
  actorId: string,
  turn: number,
  contextSignals: ContextSignalRecord[],
  lifecycleMode: LifecycleMode,
  currentTask: DeterministicTask | null,
  previousIntent?: IntentRecord
): { intent: IntentRecord; transition: IntentTransition } {
  if (previousIntent && previousIntent.status === "active") {
    const interruptingSignal = contextSignals.find((signal) => signal.interruptsCurrentIntent);

    if (!interruptingSignal) {
      // Preserve the intent ID across turns so transcripts distinguish real
      // continuity from repeatedly selecting the same-looking goal.
      return {
        intent: {
          ...previousIntent,
          lastUpdatedTurn: turn
        },
        transition: "continued"
      };
    }
  }

  // Deterministic fallback picks the most salient signal only to keep the probe
  // moving and the transcript explainable. Provider paths still interpret raw
  // observation themselves.
  const topSignal = [...contextSignals].sort((a, b) => b.salience - a.salience)[0];

  if (lifecycleMode === "recovery") {
    return {
      intent: {
        id: nextIntentId(),
        actorId,
        kind: "recover_basic_tools",
        summary: topSignal?.summary ?? "recover lost gear and resume progression",
        chosenFromContextSignalIds: topSignal ? [topSignal.id] : [],
        lifecycleMode,
        status: "active",
        source: "runtime_default",
        successCondition: "actor has basic tools and crafting station again",
        interruptible: true,
        createdAtTurn: turn,
        lastUpdatedTurn: turn
      },
      transition: previousIntent ? "replaced" : "selected"
    };
  }

  if (lifecycleMode === "scarcity") {
    return {
      intent: {
        id: nextIntentId(),
        actorId,
        kind: "resupply_shared_storage",
        summary: topSignal?.summary ?? "shared resources critically low",
        chosenFromContextSignalIds: topSignal ? [topSignal.id] : [],
        lifecycleMode,
        status: "active",
        source: "runtime_default",
        successCondition: "shared storage has essential materials above floor threshold",
        interruptible: true,
        createdAtTurn: turn,
        lastUpdatedTurn: turn
      },
      transition: previousIntent ? "replaced" : "selected"
    };
  }

  if (lifecycleMode === "bootstrap" && currentTask) {
    return {
      intent: {
        id: nextIntentId(),
        actorId,
        kind: "bootstrap_progress",
        summary: currentTask.reason,
        chosenFromContextSignalIds: topSignal ? [topSignal.id] : [],
        lifecycleMode,
        status: "active",
        source: "runtime_default",
        successCondition: `task ${currentTask.id} passes verification`,
        interruptible: true,
        createdAtTurn: turn,
        lastUpdatedTurn: turn
      },
      transition: previousIntent ? "replaced" : "selected"
    };
  }

  if (topSignal?.kind === "nearby_opportunity" && previousIntent?.kind === "request_or_handoff") {
    return {
      intent: {
        ...previousIntent,
        lastUpdatedTurn: turn
      },
      transition: "continued"
    };
  }

  const intentKind = mapContextSignalToIntentKind(topSignal?.kind);

  return {
    intent: {
      id: nextIntentId(),
      actorId,
      kind: intentKind,
      summary: topSignal?.summary ?? "no salient context signal detected, waiting for opportunity",
      chosenFromContextSignalIds: topSignal ? [topSignal.id] : [],
      lifecycleMode,
      status: "active",
      source: "runtime_default",
      successCondition: "context changes or a better opportunity arises",
      interruptible: true,
      createdAtTurn: turn,
      lastUpdatedTurn: turn
    },
    transition: previousIntent ? "replaced" : "selected"
  };
}

function mapContextSignalToIntentKind(signalKind?: ContextSignalKind): IntentKind {
  switch (signalKind) {
    case "bootstrap_missing_progress":
      return "bootstrap_progress";
    case "recovery_after_death":
      return "recover_basic_tools";
    case "shared_shortage":
      return "resupply_shared_storage";
    case "blocked_teammate":
      return "unblock_teammate";
    case "public_obligation_due":
    case "private_obligation_due":
      return "fulfill_obligation";
    case "hostile_risk":
      return "avoid_or_retreat";
    case "nearby_opportunity":
      return "claim_nearby_opportunity";
    case "conversation_backlog":
      return "request_or_handoff";
    case "inventory_overload":
      return "resupply_shared_storage";
    case "station_missing":
      return "bootstrap_progress";
    default:
      return "wait_or_defer";
  }
}

/**
 * Builds the context-signal and intent state recorded by each runtime-loop turn.
 *
 * This is runtime-owned scaffolding, not a social-simulation model by itself:
 * it explains why the loop chose or continued an intent before any provider
 * proposal is accepted.
 */
export function buildContextIntentState({
  actorId,
  turn,
  observation,
  currentTask,
  completedTaskIds,
  previousIntent,
  externalContextSignals = [],
  reinjectionHints
}: BuildContextIntentStateArgs): ContextIntentState {
  const lifecycleMode = resolveLifecycleMode(currentTask, completedTaskIds, previousIntent, reinjectionHints);
  const coreSignals = computeContextSignals(actorId, observation, currentTask, lifecycleMode, reinjectionHints);
  const contextSignals = [...coreSignals, ...externalContextSignals];
  const { intent, transition } = selectIntent(
    actorId,
    turn,
    contextSignals,
    lifecycleMode,
    currentTask,
    previousIntent
  );

  return {
    actorId,
    turn,
    lifecycleMode,
    contextSignals,
    currentIntent: intent,
    intentTransition: transition
  };
}
