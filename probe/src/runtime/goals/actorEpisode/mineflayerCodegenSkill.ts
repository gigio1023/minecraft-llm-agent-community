import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { MineflayerCodegenSkillProjection } from "./types.js";

export const mineflayerActionSkillHelperNames = [
  "position",
  "inventoryItems",
  "observe",
  "wait",
  "collectLogs",
  "mineBlock",
  "craftItem",
  "craftWithTable",
  "consumeItem",
  "placeBlock",
  "buildPattern",
  "say",
  "mineflayer"
] as const;

export const boundedMineflayerMethodNames = [
  "lookAt",
  "lookAtNearestBlock",
  "setControlState",
  "clearControlStates",
  "swingArm",
  "equipByName",
  "activateItem",
  "deactivateItem",
  "chat"
] as const;

export const mineflayerCodegenSkillRef =
  ".agents/skills/mineflayer-code-generation/SKILL.md" as const;

export const mineflayerCodegenUpstreamRef =
  "PrismarineJS/mineflayer@03eba44f" as const;

function readMineflayerCodegenSkillMarkdown() {
  const candidatePaths = [
    path.resolve(process.cwd(), mineflayerCodegenSkillRef),
    path.resolve(process.cwd(), "..", mineflayerCodegenSkillRef)
  ];
  const skillPath = candidatePaths.find((candidatePath) => existsSync(candidatePath));
  if (!skillPath) {
    throw new Error(
      `Mineflayer codegen agent skill file is required but missing: ${mineflayerCodegenSkillRef}`
    );
  }
  return readFileSync(skillPath, "utf8");
}

export function buildMineflayerCodegenSkillProjection(): MineflayerCodegenSkillProjection {
  return {
    schema: "mineflayer-codegen-skill/v1",
    skill_ref: mineflayerCodegenSkillRef,
    skill_markdown: readMineflayerCodegenSkillMarkdown(),
    upstream_ref: mineflayerCodegenUpstreamRef,
    applies_when: "outer Actor Turn selected author_mineflayer_action",
    helper_api_version: "mineflayer-action-skill-helper/v1",
    allowed_ctx_helpers: [...mineflayerActionSkillHelperNames],
    bounded_mineflayer_methods: [...boundedMineflayerMethodNames],
    output_schema_rules: [
      "input_schema must be a JSON Schema object with type=object, properties, required, and additionalProperties=false",
      "parameters must contain only runtime inputs declared in input_schema.properties",
      "source_language must be typescript",
      "source must define export async function run(ctx, params)",
      "promotion_policy must be promote_after_passed_trial"
    ],
    helper_call_contracts: [
      "call only direct ctx helpers listed in helper_allowlist",
      "do not use ctx.bot, ctx.helpers, ctx.sharedStorage, or ctx.mineflayer() object access",
      "use ctx.mineflayer(method,args) only for bounded methods in bounded_mineflayer_methods",
      "await helper calls before relying on their result",
      "keep movement controls time-limited and clear them after use"
    ],
    mineflayer_api_notes: [
      "findBlock/findBlocks see loaded world only; null is not a global absence proof",
      "dig must be awaited; starting another dig before completion can abort progress",
      "placeBlock uses an adjacent support block plus face vector; the target cell must be empty or replaceable",
      "crafting should be sequential and awaited; inventory 2x2 recipes differ from placed-table 3x3 recipes",
      "a crafting_table item is not a station until placed as a world block",
      "opening a container is separate from proving inventory transfer"
    ],
    forbidden_source_patterns: [
      "import",
      "require",
      "process",
      "Bun",
      "Deno",
      "filesystem",
      "network",
      "eval",
      "Function",
      "while(true)",
      "for(;;)",
      "ctx.bot",
      "ctx.helpers",
      "ctx.sharedStorage",
      "ctx.mineflayer().method"
    ],
    verifier_and_evidence_rules: [
      "verifier.kind should use a supported vocabulary: helper_event_progress, helper_result_status, helper_event, inventory_delta, inventory_contains, inventory_count, world_scan, container_snapshot, or block_or_inventory_delta",
      "use helper_event_progress for general physical progress proven by completed helper events instead of inventing runtime-evidence or unknown verifier kinds",
      "provider prose and memory notes are not proof of physical success",
      "known_failure_modes should be concrete enough to guide one regeneration attempt"
    ],
    common_failure_modes: [
      "no loaded matching block within search radius",
      "missing inventory prerequisite",
      "target placement cell occupied or unsupported",
      "crafting table item not placed as reachable world block",
      "dig interrupted before Mineflayer resolved bot.dig",
      "container visible but not reachable/openable"
    ]
  };
}
