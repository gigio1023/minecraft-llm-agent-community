import type { DeterministicTask } from "../gameplay/curriculum/deterministicCurriculum.js";

// ---------------------------------------------------------------------------
// Lifecycle Mode
// ---------------------------------------------------------------------------

export type LifecycleMode =
  | "bootstrap"
  | "normal"
  | "recovery"
  | "scarcity"
  | "danger"
  | "social_obligation";

// ---------------------------------------------------------------------------
// Pressure
// ---------------------------------------------------------------------------

export type PressureKind =
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

export type PressureRecord = {
  id: string;
  actorId: string;
  kind: PressureKind;
  summary: string;
  source: "world" | "memory" | "bulletin" | "mailbox" | "lifecycle" | "runtime";
  relatedActorId?: string;
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
};

// ---------------------------------------------------------------------------
// Intent
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Context Output
// ---------------------------------------------------------------------------

export type IntentTransition = "selected" | "continued" | "interrupted" | "replaced";

export type PressureIntentContext = {
  actorId: string;
  turn: number;
  lifecycleMode: LifecycleMode;
  pressures: PressureRecord[];
  currentIntent: IntentRecord;
  intentTransition: IntentTransition;
};

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

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

export type BuildPressureIntentContextArgs = {
  actorId: string;
  turn: number;
  observation: Observation;
  currentTask: DeterministicTask | null;
  completedTaskIds: string[];
  previousIntent?: IntentRecord;
  /** External pressures injected by obligation router, hostile system, etc. */
  externalPressures?: PressureRecord[];
  /** Reinjection triggers from settlement state */
  reinjectionHints?: {
    hasPickaxe?: boolean;
    hasCraftingTable?: boolean;
    sharedEssentialsBelowFloor?: boolean;
    recentDeathCount?: number;
  };
};

// ---------------------------------------------------------------------------
// Bootstrap / Recovery progression IDs (deterministic curriculum order)
// ---------------------------------------------------------------------------

const BOOTSTRAP_TASK_IDS = [
  "collect_4_logs",
  "craft_planks_and_sticks",
  "craft_crafting_table"
] as const;

// If a previously completed task reappears, the actor lost gear → recovery.
function detectRecovery(
  currentTask: DeterministicTask | null,
  completedTaskIds: string[]
): boolean {
  if (!currentTask) {
    return false;
  }

  return completedTaskIds.some(
    (completedId) =>
      BOOTSTRAP_TASK_IDS.indexOf(completedId as typeof BOOTSTRAP_TASK_IDS[number]) >
      BOOTSTRAP_TASK_IDS.indexOf(currentTask.id as typeof BOOTSTRAP_TASK_IDS[number])
  );
}

// ---------------------------------------------------------------------------
// Lifecycle mode computation
// ---------------------------------------------------------------------------

function resolveLifecycleMode(
  currentTask: DeterministicTask | null,
  completedTaskIds: string[],
  previousIntent?: IntentRecord,
  reinjectionHints?: BuildPressureIntentContextArgs["reinjectionHints"]
): LifecycleMode {
  // Reinjection: death or missing gear triggers recovery regardless
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

// ---------------------------------------------------------------------------
// Pressure computation
// ---------------------------------------------------------------------------

let pressureIdCounter = 0;

function nextPressureId() {
  pressureIdCounter += 1;
  return `pressure-${pressureIdCounter}`;
}

function computePressures(
  actorId: string,
  observation: Observation,
  currentTask: DeterministicTask | null,
  lifecycleMode: LifecycleMode,
  reinjectionHints?: BuildPressureIntentContextArgs["reinjectionHints"]
): PressureRecord[] {
  const pressures: PressureRecord[] = [];

  // Bootstrap missing progress
  if (currentTask && lifecycleMode === "bootstrap") {
    pressures.push({
      id: nextPressureId(),
      actorId,
      kind: "bootstrap_missing_progress",
      summary: `${currentTask.id}: ${currentTask.reason}`,
      source: "lifecycle",
      relatedTaskId: currentTask.id,
      urgency: 0.9,
      roleRelevance: 0.9,
      sharedImportance: 0.8,
      personalImportance: 0.7,
      accessibility: 0.8,
      novelty: 0.5,
      recoveryWeight: 0.0,
      interruptsCurrentIntent: false
    });
  }

  // Recovery after death / gear loss
  if (lifecycleMode === "recovery") {
    pressures.push({
      id: nextPressureId(),
      actorId,
      kind: "recovery_after_death",
      summary: currentTask
        ? `Recovery needed: ${currentTask.reason}`
        : "Recovery needed: previously completed progression is missing",
      source: "lifecycle",
      relatedTaskId: currentTask?.id,
      urgency: 0.95,
      roleRelevance: 0.9,
      sharedImportance: 0.85,
      personalImportance: 0.9,
      accessibility: 0.7,
      novelty: 0.8,
      recoveryWeight: 1.0,
      interruptsCurrentIntent: true
    });
  }

  // Scarcity pressure from reinjection
  if (lifecycleMode === "scarcity" && reinjectionHints?.sharedEssentialsBelowFloor) {
    pressures.push({
      id: nextPressureId(),
      actorId,
      kind: "shared_shortage",
      summary: "Shared essential resources are below minimum threshold",
      source: "lifecycle",
      urgency: 0.85,
      roleRelevance: 0.8,
      sharedImportance: 0.95,
      personalImportance: 0.6,
      accessibility: 0.7,
      novelty: 0.4,
      recoveryWeight: 0.3,
      interruptsCurrentIntent: true
    });
  }

  // Station missing pressure
  if (reinjectionHints?.hasCraftingTable === false && lifecycleMode !== "recovery") {
    pressures.push({
      id: nextPressureId(),
      actorId,
      kind: "station_missing",
      summary: "No crafting table available - progression blocked",
      source: "world",
      urgency: 0.7,
      roleRelevance: 0.8,
      sharedImportance: 0.7,
      personalImportance: 0.6,
      accessibility: 0.6,
      novelty: 0.5,
      recoveryWeight: 0.2,
      interruptsCurrentIntent: false
    });
  }

  // Nearby opportunity
  const nearActors = observation.visibleActors.filter(
    (actor) => actor.distance <= 3 && !actor.busy
  );

  if (nearActors.length > 0 && !currentTask) {
    pressures.push({
      id: nextPressureId(),
      actorId,
      kind: "nearby_opportunity",
      summary: `${nearActors[0].id} is nearby and available`,
      source: "world",
      relatedActorId: nearActors[0].id,
      urgency: 0.55,
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
    pressures.push({
      id: nextPressureId(),
      actorId,
      kind: "inventory_overload",
      summary: "Inventory is nearly full, need to deposit items",
      source: "world",
      urgency: 0.6,
      roleRelevance: 0.7,
      sharedImportance: 0.5,
      personalImportance: 0.8,
      accessibility: 0.8,
      novelty: 0.3,
      recoveryWeight: 0.0,
      interruptsCurrentIntent: false
    });
  }

  return pressures;
}

// ---------------------------------------------------------------------------
// Intent selection
// ---------------------------------------------------------------------------

let intentIdCounter = 0;

function nextIntentId() {
  intentIdCounter += 1;
  return `intent-${intentIdCounter}`;
}

function selectIntent(
  actorId: string,
  turn: number,
  pressures: PressureRecord[],
  lifecycleMode: LifecycleMode,
  currentTask: DeterministicTask | null,
  previousIntent?: IntentRecord
): { intent: IntentRecord; transition: IntentTransition } {
  // If previous intent exists and no stronger pressure interrupts, continue it
  if (previousIntent && previousIntent.status === "active") {
    const interruptingPressure = pressures.find((p) => p.interruptsCurrentIntent);

    if (!interruptingPressure) {
      return {
        intent: {
          ...previousIntent,
          lastUpdatedTurn: turn
        },
        transition: "continued"
      };
    }
  }

  // Select a new intent from the highest-urgency pressure
  const topPressure = [...pressures].sort((a, b) => b.urgency - a.urgency)[0];

  if (lifecycleMode === "recovery") {
    return {
      intent: {
        id: nextIntentId(),
        actorId,
        kind: "recover_basic_tools",
        summary: topPressure?.summary ?? "recover lost gear and resume progression",
        chosenFromPressureIds: topPressure ? [topPressure.id] : [],
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
        summary: topPressure?.summary ?? "shared resources critically low",
        chosenFromPressureIds: topPressure ? [topPressure.id] : [],
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
        chosenFromPressureIds: topPressure ? [topPressure.id] : [],
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

  // Normal mode: infer from the top pressure or continue previous intent kind
  if (topPressure?.kind === "nearby_opportunity" && previousIntent?.kind === "request_or_handoff") {
    return {
      intent: {
        ...previousIntent,
        lastUpdatedTurn: turn
      },
      transition: "continued"
    };
  }

  const intentKind = mapPressureToIntentKind(topPressure?.kind);

  return {
    intent: {
      id: nextIntentId(),
      actorId,
      kind: intentKind,
      summary: topPressure?.summary ?? "no strong pressure detected, waiting for opportunity",
      chosenFromPressureIds: topPressure ? [topPressure.id] : [],
      lifecycleMode,
      status: "active",
      source: "runtime_default",
      successCondition: "pressure resolved or a better opportunity arises",
      interruptible: true,
      createdAtTurn: turn,
      lastUpdatedTurn: turn
    },
    transition: previousIntent ? "replaced" : "selected"
  };
}

function mapPressureToIntentKind(pressureKind?: PressureKind): IntentKind {
  switch (pressureKind) {
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildPressureIntentContext({
  actorId,
  turn,
  observation,
  currentTask,
  completedTaskIds,
  previousIntent,
  externalPressures = [],
  reinjectionHints
}: BuildPressureIntentContextArgs): PressureIntentContext {
  const lifecycleMode = resolveLifecycleMode(currentTask, completedTaskIds, previousIntent, reinjectionHints);
  const corePressures = computePressures(actorId, observation, currentTask, lifecycleMode, reinjectionHints);
  const pressures = [...corePressures, ...externalPressures];
  const { intent, transition } = selectIntent(
    actorId,
    turn,
    pressures,
    lifecycleMode,
    currentTask,
    previousIntent
  );

  return {
    actorId,
    turn,
    lifecycleMode,
    pressures,
    currentIntent: intent,
    intentTransition: transition
  };
}

