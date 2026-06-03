import {
  validateAuthorAndTrialActionSkillIntent
} from "../../../skills/generated/authoringSchemas.js";
import {
  validateActionIntent,
  type ActionIntent,
  type GeneratedActionSkillCandidate
} from "../types.js";
import {
  resolveActionCardMapping,
  type ActionCardProjection
} from "./actionCards.js";
import type {
  ActionCard,
  ActorTurnCurrentStateProjection,
  ActorTurnOutput
} from "./types.js";
import { validateActorTurnOutput } from "./validators.js";

export type ActorTurnResolutionInput = {
  actorId: string;
  cycleId: string;
  cycleGoalId: string;
  output: ActorTurnOutput;
  actionCardProjection: ActionCardProjection;
  currentState?: ActorTurnCurrentStateProjection;
};

export type ActorTurnResolutionResult =
  | {
      ok: true;
      intent: ActionIntent;
    }
  | {
      ok: false;
      errors: string[];
    };

export type CurrentStateRequirementValidationMode = "selection" | "resolution";

const plankItemNames = [
  "oak_planks",
  "spruce_planks",
  "birch_planks",
  "jungle_planks",
  "acacia_planks",
  "dark_oak_planks",
  "mangrove_planks",
  "cherry_planks",
  "crimson_planks",
  "warped_planks"
] as const;

const logToPlanks = [
  { logs: ["oak_log"] as const, planks: "oak_planks" },
  { logs: ["spruce_log"] as const, planks: "spruce_planks" },
  { logs: ["birch_log"] as const, planks: "birch_planks" },
  { logs: ["jungle_log"] as const, planks: "jungle_planks" },
  { logs: ["acacia_log"] as const, planks: "acacia_planks" },
  { logs: ["dark_oak_log"] as const, planks: "dark_oak_planks" },
  { logs: ["mangrove_log"] as const, planks: "mangrove_planks" },
  { logs: ["cherry_log"] as const, planks: "cherry_planks" },
  { logs: ["crimson_stem"] as const, planks: "crimson_planks" },
  { logs: ["warped_stem"] as const, planks: "warped_planks" }
] as const;

const logItemNames = logToPlanks.flatMap((entry) => [...entry.logs]);

const tableBoundRecipeItemNameList = [
  "wooden_pickaxe",
  "stone_pickaxe",
  "iron_pickaxe",
  "golden_pickaxe",
  "diamond_pickaxe",
  "wooden_axe",
  "stone_axe",
  "iron_axe",
  "wooden_shovel",
  "stone_shovel",
  "wooden_sword",
  "stone_sword",
  "furnace",
  "chest"
] as const;

const tableBoundRecipeItemNames: ReadonlySet<string> = new Set(tableBoundRecipeItemNameList);

const discoverableResourceBlockNames = [
  "oak_log",
  "spruce_log",
  "birch_log",
  "jungle_log",
  "acacia_log",
  "dark_oak_log",
  "mangrove_log",
  "cherry_log",
  "coal_ore",
  "iron_ore",
  "copper_ore",
  "crafting_table",
  "chest"
] as const;

function validateResolvedIntent(intent: ActionIntent): ActorTurnResolutionResult {
  const result = validateActionIntent(intent);
  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }
  if (result.intent.kind === "author_and_trial_action_skill") {
    const generated = validateAuthorAndTrialActionSkillIntent(result.intent);
    if (!generated.ok) {
      return { ok: false, errors: generated.errors };
    }
  }
  return { ok: true, intent: result.intent };
}

function generatedCandidateFromOutput(output: Extract<ActorTurnOutput, { choice: "author_mineflayer_action" }>): GeneratedActionSkillCandidate {
  return {
    schema: "generated-action-skill-candidate/v1",
    proposed_skill_id: output.proposed_action_skill_id,
    purpose: output.purpose,
    source_language: output.source_language,
    source: output.source,
    input_schema: output.input_schema,
    helper_api_version: output.helper_api_version,
    helper_allowlist: [...output.helper_allowlist],
    timeout_ms: output.timeout_ms,
    verifier: output.verifier,
    promotion_policy: output.promotion_policy,
    known_failure_modes: [...output.known_failure_modes]
  };
}

function countForInventoryLike(
  state: ActorTurnCurrentStateProjection,
  names: readonly string[]
) {
  return inventoryCountForNames(state, names) > 0;
}

function inventoryCountForNames(
  state: ActorTurnCurrentStateProjection,
  names: readonly string[]
) {
  let total = 0;
  for (const name of names) {
    const count = state.inventory_counts[name] ?? state.settlement_progress.inventory_counts[name] ?? 0;
    if (count > 0) {
      total += count;
    }
  }
  return total;
}

function basicPlanksAndSticksNeedSatisfied(state: ActorTurnCurrentStateProjection) {
  return inventoryCountForNames(state, plankItemNames) >= 8 &&
    inventoryCountForNames(state, ["stick", "sticks"]) >= 4;
}

type IngredientRequirement =
  | { kind: "planks"; count: number }
  | { kind: "sticks"; count: number }
  | { kind: "items"; names: readonly string[]; count: number; label: string };

function ingredientRequirementCount(
  state: ActorTurnCurrentStateProjection,
  requirement: IngredientRequirement
) {
  if (requirement.kind === "planks") {
    return inventoryCountForNames(state, plankItemNames);
  }
  if (requirement.kind === "sticks") {
    return inventoryCountForNames(state, ["stick", "sticks"]);
  }
  return inventoryCountForNames(state, requirement.names);
}

function ingredientRequirementLabel(requirement: IngredientRequirement) {
  if (requirement.kind === "planks") {
    return "planks";
  }
  if (requirement.kind === "sticks") {
    return "sticks";
  }
  return requirement.label;
}

function tableBoundRecipeRequirements(itemName: string): IngredientRequirement[] {
  switch (itemName) {
    case "wooden_pickaxe":
    case "wooden_axe":
      return [{ kind: "planks", count: 3 }, { kind: "sticks", count: 2 }];
    case "wooden_shovel":
      return [{ kind: "planks", count: 1 }, { kind: "sticks", count: 2 }];
    case "wooden_sword":
      return [{ kind: "planks", count: 2 }, { kind: "sticks", count: 1 }];
    case "stone_pickaxe":
    case "stone_axe":
      return [
        { kind: "items", names: ["cobblestone"], count: 3, label: "cobblestone" },
        { kind: "sticks", count: 2 }
      ];
    case "stone_shovel":
      return [
        { kind: "items", names: ["cobblestone"], count: 1, label: "cobblestone" },
        { kind: "sticks", count: 2 }
      ];
    case "stone_sword":
      return [
        { kind: "items", names: ["cobblestone"], count: 2, label: "cobblestone" },
        { kind: "sticks", count: 1 }
      ];
    case "iron_pickaxe":
    case "iron_axe":
      return [
        { kind: "items", names: ["iron_ingot"], count: 3, label: "iron_ingot" },
        { kind: "sticks", count: 2 }
      ];
    case "golden_pickaxe":
      return [
        { kind: "items", names: ["gold_ingot"], count: 3, label: "gold_ingot" },
        { kind: "sticks", count: 2 }
      ];
    case "diamond_pickaxe":
      return [
        { kind: "items", names: ["diamond"], count: 3, label: "diamond" },
        { kind: "sticks", count: 2 }
      ];
    case "furnace":
      return [{ kind: "items", names: ["cobblestone"], count: 8, label: "cobblestone" }];
    case "chest":
      return [{ kind: "planks", count: 8 }];
    default:
      return [];
  }
}

export function missingTableBoundRecipeIngredients(
  state: ActorTurnCurrentStateProjection,
  itemName: string
) {
  return tableBoundRecipeRequirements(itemName)
    .map((requirement) => {
      const count = ingredientRequirementCount(state, requirement);
      return count >= requirement.count
        ? null
        : `${ingredientRequirementLabel(requirement)} ${count}/${requirement.count}`;
    })
    .filter((entry): entry is string => entry !== null);
}

export function feasibleTableBoundRecipeNames(state: ActorTurnCurrentStateProjection) {
  return tableBoundRecipeItemNameList.filter((itemName) =>
    missingTableBoundRecipeIngredients(state, itemName).length === 0
  );
}

function tableBoundRecipeIngredientsSatisfied(
  state: ActorTurnCurrentStateProjection,
  itemName: string | undefined
) {
  if (!itemName) {
    return feasibleTableBoundRecipeNames(state).length > 0;
  }
  return missingTableBoundRecipeIngredients(state, itemName).length === 0;
}

function plankSourceNamesForRecipe(itemName: string) {
  const exact = logToPlanks.find((entry) => entry.planks === itemName);
  return exact ? [...exact.logs] : logItemNames;
}

function inventoryGridRecipeRequirements(itemName: string): IngredientRequirement[] {
  if ((plankItemNames as readonly string[]).includes(itemName) || itemName === "planks") {
    return [{ kind: "items", names: plankSourceNamesForRecipe(itemName), count: 1, label: "logs or stems" }];
  }
  switch (itemName) {
    case "stick":
    case "sticks":
      return [{ kind: "planks", count: 2 }];
    case "crafting_table":
      return [{ kind: "planks", count: 4 }];
    case "torch":
    case "torches":
      return [
        { kind: "items", names: ["coal", "charcoal"], count: 1, label: "coal or charcoal" },
        { kind: "sticks", count: 1 }
      ];
    default:
      return [];
  }
}

export function missingInventoryGridRecipeIngredients(
  state: ActorTurnCurrentStateProjection,
  itemName: string
) {
  const requirements = inventoryGridRecipeRequirements(itemName);
  if (requirements.length === 0) {
    return [`known inventory-grid recipe for ${itemName}`];
  }
  return requirements
    .map((requirement) => {
      const count = ingredientRequirementCount(state, requirement);
      return count >= requirement.count
        ? null
        : `${ingredientRequirementLabel(requirement)} ${count}/${requirement.count}`;
    })
    .filter((entry): entry is string => entry !== null);
}

export function feasibleInventoryGridRecipeNames(state: ActorTurnCurrentStateProjection) {
  const feasiblePlanks = logToPlanks
    .filter((entry) => inventoryCountForNames(state, entry.logs) > 0)
    .map((entry) => entry.planks);
  return [
    ...feasiblePlanks,
    ...(inventoryCountForNames(state, plankItemNames) >= 2 ? ["stick"] : []),
    ...(inventoryCountForNames(state, plankItemNames) >= 4 ? ["crafting_table"] : []),
    ...(inventoryCountForNames(state, ["coal", "charcoal"]) >= 1 &&
      inventoryCountForNames(state, ["stick", "sticks"]) >= 1
      ? ["torch"]
      : [])
  ];
}

function inventoryGridRecipeIngredientsSatisfied(
  state: ActorTurnCurrentStateProjection,
  itemName: string | undefined
) {
  if (!itemName) {
    return feasibleInventoryGridRecipeNames(state).length > 0;
  }
  if (tableBoundRecipeItemNames.has(itemName)) {
    return false;
  }
  return missingInventoryGridRecipeIngredients(state, itemName).length === 0;
}

function hasNearbyBlockLike(state: ActorTurnCurrentStateProjection, names: readonly string[]) {
  const wanted = new Set(names);
  if (state.nearby_block_hints.some((block) => wanted.has(block.name))) {
    return true;
  }
  return state.world_scan?.retained_block_counts.some((block) => wanted.has(block.name) && block.count > 0) ?? false;
}

export function craftingTableAlreadyUsable(state: ActorTurnCurrentStateProjection) {
  return hasNearbyBlockLike(state, ["crafting_table"]) ||
    state.settlement_progress.known_position_summaries.some((entry) =>
      entry.includes("crafting_table=placed") ||
      entry.includes("crafting_table=nearby") ||
      entry.includes("crafting_table=known")
    ) ||
    state.settlement_progress.checklist.some((item) =>
      item.id === "crafting_table_known_or_placed" && item.status === "satisfied"
    );
}

function hasAnyInventoryEntry(state: ActorTurnCurrentStateProjection) {
  return Object.values(state.inventory_counts).some((count) => count > 0) ||
    Object.values(state.settlement_progress.inventory_counts).some((count) => count > 0);
}

function hasSolidBuildMaterial(state: ActorTurnCurrentStateProjection) {
  return inventoryCountForNames(state, [
    ...plankItemNames,
    "oak_log",
    "spruce_log",
    "birch_log",
    "jungle_log",
    "acacia_log",
    "dark_oak_log",
    "mangrove_log",
    "cherry_log",
    "crimson_stem",
    "warped_stem",
    "dirt",
    "cobblestone"
  ]) > 0;
}

function inventoryHasRequestedItem(
  state: ActorTurnCurrentStateProjection,
  parameters: Record<string, unknown>
) {
  const itemName = typeof parameters.itemName === "string"
    ? parameters.itemName
    : typeof parameters.blockName === "string"
      ? parameters.blockName
      : undefined;
  return itemName ? countForInventoryLike(state, [itemName]) : hasAnyInventoryEntry(state);
}

function requestedItemName(parameters: Record<string, unknown>) {
  return typeof parameters.itemName === "string"
    ? parameters.itemName
    : typeof parameters.targetItem === "string"
      ? parameters.targetItem
      : typeof parameters.recipe === "string"
        ? parameters.recipe
        : undefined;
}

function actionSkillParameterErrors(input: {
  actionSkillId: string;
  card: ActionCard;
  parameters: Record<string, unknown>;
}) {
  const errors: string[] = [];
  const itemName = requestedItemName(input.parameters);
  if (input.actionSkillId === "craftPlanksAndSticks" && itemName) {
    const craftableOutputs = new Set([
      "planks",
      "stick",
      "sticks",
      ...plankItemNames
    ]);
    if (!craftableOutputs.has(itemName)) {
      errors.push(
        `${input.card.action_card_id} ${input.card.title} cannot use itemName=${itemName}; choose empty parameters or a craftable output such as oak_planks or stick`
      );
    }
  }
  return errors;
}

function visibleActionCardTitles(projection: ActionCardProjection) {
  return new Set(projection.action_cards.map((card) => card.title));
}

function authoringProbeCoveredByExistingSurface(input: {
  output: Extract<ActorTurnOutput, { choice: "author_mineflayer_action" }>;
  projection: ActionCardProjection;
  currentState?: ActorTurnCurrentStateProjection;
}) {
  const visibleTitles = visibleActionCardTitles(input.projection);
  const text = [
    input.output.proposed_action_skill_id,
    input.output.purpose,
    input.output.why_this_action,
    input.output.fallback_if_blocked,
    input.output.source
  ].join(" ").toLowerCase();
  const looksLikeProbe = /\b(check|probe|inspect|verify|confirm|test|openability|reachable|reachability|access|open|snapshot)\b/
    .test(text);
  if (!looksLikeProbe) {
    return undefined;
  }
  const containerProbe = /\b(chest|container|shared storage|shared_storage|inventory snapshot)\b/.test(text);
  if (
    containerProbe &&
    (visibleTitles.has("Inspect Chest") ||
      visibleTitles.has("Inspect Shared Chest") ||
      input.currentState?.shared_storage.status === "known" ||
      input.currentState?.shared_storage.status === "contributed")
  ) {
    return "author_mineflayer_action rejected because shared chest/container probing is already covered by Inspect Chest or current shared_storage state";
  }
  const stationProbe = /\b(crafting_table|crafting table|table-bound|station|workbench)\b/.test(text);
  if (
    stationProbe &&
    (visibleTitles.has("Craft With Table") ||
      visibleTitles.has("Place Crafting Table") ||
      visibleTitles.has("Craft Crafting Table") ||
      (input.currentState ? craftingTableAlreadyUsable(input.currentState) : false))
  ) {
    return "author_mineflayer_action rejected because crafting-table/station probing is already covered by visible Action Cards or current crafting_table state";
  }
  return undefined;
}

function requirementSatisfied(
  requirement: string,
  state: ActorTurnCurrentStateProjection,
  parameters: Record<string, unknown>,
  mode: CurrentStateRequirementValidationMode
) {
  const normalized = requirement.toLowerCase();
  if (
    mode === "selection" &&
    normalized.includes("provider supplied an explicit target cell or support surface")
  ) {
    return true;
  }
  const requiredCount = normalized.match(/inventory has ([a-z_ ]+?)\s*>=\s*(\d+)/);
  if (requiredCount) {
    const itemFamily = requiredCount[1]?.trim();
    const count = Number(requiredCount[2]);
    if (itemFamily === "planks") {
      return inventoryCountForNames(state, plankItemNames) >= count;
    }
    if (itemFamily === "sticks") {
      return inventoryCountForNames(state, ["stick", "sticks"]) >= count;
    }
    if (itemFamily === "cobblestone") {
      return inventoryCountForNames(state, ["cobblestone"]) >= count;
    }
  }
  if (
    normalized.includes("inventory has the requested block item") ||
    normalized.includes("inventory contains the block item")
  ) {
    return inventoryHasRequestedItem(state, parameters);
  }
  if (normalized.includes("inventory has solid build material")) {
    return hasSolidBuildMaterial(state);
  }
  if (normalized.includes("inventory has crafting_table")) {
    return countForInventoryLike(state, ["crafting_table"]);
  }
  if (
    normalized.includes("no usable crafting_table already known") ||
    normalized.includes("crafting_table placement still needed")
  ) {
    return !craftingTableAlreadyUsable(state);
  }
  if (normalized.includes("no crafting_table item already carried")) {
    return !countForInventoryLike(state, ["crafting_table"]);
  }
  if (normalized.includes("no wooden_pickaxe already carried")) {
    return !countForInventoryLike(state, ["wooden_pickaxe"]);
  }
  if (normalized.includes("basic planks/sticks need not already satisfied")) {
    return !basicPlanksAndSticksNeedSatisfied(state);
  }
  if (normalized.includes("inventory has logs")) {
    return countForInventoryLike(state, [
      "oak_log",
      "spruce_log",
      "birch_log",
      "jungle_log",
      "acacia_log",
      "dark_oak_log",
      "mangrove_log",
      "cherry_log",
      "crimson_stem",
      "warped_stem"
    ]);
  }
  if (normalized.includes("inventory has planks")) {
    return countForInventoryLike(state, plankItemNames);
  }
  if (normalized.includes("inventory has sticks")) {
    return countForInventoryLike(state, ["stick", "sticks"]);
  }
  if (normalized.includes("inventory has wooden_pickaxe or stone_pickaxe")) {
    return countForInventoryLike(state, ["wooden_pickaxe", "stone_pickaxe"]);
  }
  if (normalized.includes("inventory has ingredients for the requested table-bound recipe")) {
    return tableBoundRecipeIngredientsSatisfied(state, requestedItemName(parameters));
  }
  if (normalized.includes("inventory has ingredients for the requested inventory-grid recipe")) {
    return inventoryGridRecipeIngredientsSatisfied(state, requestedItemName(parameters));
  }
  if (normalized.includes("inventory has ingredients")) {
    return inventoryGridRecipeIngredientsSatisfied(state, requestedItemName(parameters));
  }
  if (normalized.includes("inventory has depositable items") ||
      normalized.includes("inventory has requested depositable item")) {
    return hasAnyInventoryEntry(state);
  }
  if (normalized.includes("inventory has edible item") ||
      normalized.includes("inventory has the requested edible item")) {
    return (state.vitals?.food_candidates.length ?? 0) > 0;
  }
  if (normalized.includes("food below safe threshold")) {
    return typeof state.vitals?.food === "number" && state.vitals.food < 18;
  }
  if (normalized.includes("target actor visible")) {
    return state.visible_actors.length > 0;
  }
  if (normalized.includes("target actor not busy")) {
    return state.visible_actors.some((actor) => actor.busy !== true);
  }
  if (normalized.includes("target actor busy")) {
    return state.visible_actors.some((actor) => actor.busy === true);
  }
  if (normalized.includes("obligation pending")) {
    return (state.obligation_summaries?.length ?? 0) > 0;
  }
  if (normalized.includes("resource found")) {
    return state.visible_actors.length > 0 &&
      hasNearbyBlockLike(state, discoverableResourceBlockNames);
  }
  if (normalized.includes("shared chest nearby")) {
    return hasNearbyBlockLike(state, ["chest"]) ||
      state.settlement_progress.shared_storage_status === "known" ||
      state.settlement_progress.known_position_summaries.some((entry) => entry.includes("shared_chest=inspected"));
  }
  if (normalized.includes("crafting_table nearby") ||
      normalized.includes("reachable crafting_table block")) {
    return hasNearbyBlockLike(state, ["crafting_table"]) ||
      state.settlement_progress.known_position_summaries.some((entry) =>
        entry.includes("crafting_table=known") || entry.includes("crafting_table=placed")
      );
  }
  if (normalized.includes("nearby loaded world evidence contains reachable log blocks")) {
    return hasNearbyBlockLike(state, [
      "oak_log",
      "spruce_log",
      "birch_log",
      "jungle_log",
      "acacia_log",
      "dark_oak_log",
      "mangrove_log",
      "cherry_log",
      "crimson_stem",
      "warped_stem"
    ]);
  }
  if (normalized.includes("nearby loaded world evidence contains the requested block")) {
    const blockName = typeof parameters.blockName === "string"
      ? parameters.blockName
      : typeof parameters.targetBlock === "string"
        ? parameters.targetBlock
        : undefined;
    return blockName ? hasNearbyBlockLike(state, [blockName]) : true;
  }
  if (normalized.includes("provider supplied an explicit target cell or support surface")) {
    return parameters.targetPosition !== undefined ||
      parameters.target_position !== undefined ||
      parameters.position !== undefined ||
      parameters.surfacePosition !== undefined;
  }
  return true;
}

export function validateActionCardCurrentStateRequirements(input: {
  card: ActionCard;
  currentState?: ActorTurnCurrentStateProjection;
  parameters: Record<string, unknown>;
  mode?: CurrentStateRequirementValidationMode;
}) {
  if (input.card.readiness !== "requires_current_state_check" ||
      input.card.current_state_requirements.length === 0) {
    return [];
  }
  if (!input.currentState) {
    return [
      `${input.card.action_card_id} requires current_state checks but resolver did not receive current_state`
    ];
  }
  const mode = input.mode ?? "resolution";
  return input.card.current_state_requirements
    .filter((requirement) => !requirementSatisfied(requirement, input.currentState!, input.parameters, mode))
    .map((requirement) =>
      `${input.card.action_card_id} current_state requirement not satisfied: ${requirement}`
    );
}

export function resolveActorTurnOutputToActionIntent(
  input: ActorTurnResolutionInput
): ActorTurnResolutionResult {
  const outputValidation = validateActorTurnOutput(input.output);
  if (!outputValidation.ok) {
    return { ok: false, errors: outputValidation.errors };
  }
  const output = outputValidation.output;

  if (output.choice === "use_existing_action") {
    const mapping = resolveActionCardMapping(input.actionCardProjection, output.action_card_id);
    if (!mapping) {
      return {
        ok: false,
        errors: [`No runtime mapping found for Action Card ${output.action_card_id}`]
      };
    }
    const card = input.actionCardProjection.action_cards.find((entry) =>
      entry.action_card_id === output.action_card_id
    );
    if (!card) {
      return {
        ok: false,
        errors: [`No Action Card found for ${output.action_card_id}`]
      };
    }
    const currentStateErrors = validateActionCardCurrentStateRequirements({
      card,
      currentState: input.currentState,
      parameters: output.parameters
    });
    if (currentStateErrors.length > 0) {
      return { ok: false, errors: currentStateErrors };
    }
    const actionSkillErrors = mapping.kind === "use_action_skill"
      ? actionSkillParameterErrors({
          actionSkillId: mapping.action_skill_id,
          card,
          parameters: output.parameters
        })
      : [];
    if (actionSkillErrors.length > 0) {
      return { ok: false, errors: actionSkillErrors };
    }
    const intent: ActionIntent = {
      schema: "action-intent/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      cycle_goal_id: input.cycleGoalId,
      kind: mapping.kind,
      ...(mapping.kind === "use_primitive"
        ? { primitive_id: mapping.primitive_id }
        : { action_skill_id: mapping.action_skill_id }),
      args: output.parameters,
      parameters: output.parameters,
      why_this_action: output.why_this_action,
      expected_evidence: [...output.expected_evidence],
      fallback_if_blocked: output.fallback_if_blocked
    };
    return validateResolvedIntent(intent);
  }

  if (output.promotion_policy !== "promote_after_passed_trial") {
    return {
      ok: false,
      errors: [
        "author_mineflayer_action must use promotion_policy promote_after_passed_trial to become an executable ActionIntent"
      ]
    };
  }
  const coveredProbeReason = authoringProbeCoveredByExistingSurface({
    output,
    projection: input.actionCardProjection,
    currentState: input.currentState
  });
  if (coveredProbeReason) {
    return { ok: false, errors: [coveredProbeReason] };
  }

  const intent: ActionIntent = {
    schema: "action-intent/v1",
    actor_id: input.actorId,
    cycle_id: input.cycleId,
    cycle_goal_id: input.cycleGoalId,
    kind: "author_and_trial_action_skill",
    args: output.parameters,
    parameters: output.parameters,
    candidate: generatedCandidateFromOutput(output),
    why_this_action: output.why_this_action,
    expected_evidence: [...output.expected_evidence],
    fallback_if_blocked: output.fallback_if_blocked
  };
  return validateResolvedIntent(intent);
}
