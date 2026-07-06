import fs from "node:fs/promises";
import path from "node:path";

import { isLegibilityCondition } from "./types.js";
import type {
  LegibilityConditionDeclaration,
  SeedResetDeterministicMode,
  SeedResetRecordV1,
  SeedResetSessionKind
} from "./types.js";
import type { SocialCycleProviderId } from "../runtime/goals/types.js";

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function actorSoulRouteMode(value: unknown) {
  return value === "not_applicable" ||
    value === "stable_actor_soul" ||
    value === "resampled_actor_soul";
}

function hostPlatform() {
  return `${process.platform}/${process.arch}`;
}

export function conditionProvenanceForSeedReset(
  condition: LegibilityConditionDeclaration
): NonNullable<SeedResetRecordV1["condition_provenance"]> {
  return {
    condition_id: condition.condition_id,
    condition: condition.condition,
    actor_soul_route: condition.soul_provenance.actor_soul_route,
    soul_family_id: condition.soul_provenance.soul_family_id,
    soul_instance_id: condition.soul_provenance.soul_instance_id,
    soul_generation_seed: condition.soul_provenance.soul_generation_seed,
    ...(condition.soul_provenance.resampled_from_soul_instance_id
      ? { resampled_from_soul_instance_id: condition.soul_provenance.resampled_from_soul_instance_id }
      : {}),
    family_holdout: condition.soul_provenance.family_holdout,
    private_soul_text_in_record: false
  };
}

export function createSeedResetRecord(input: {
  recordId: string;
  runId: string;
  recordedAt?: string;
  seedOrResetId: string;
  sessionKind: SeedResetSessionKind;
  countsTowardLegibilitySeedRequirement: boolean;
  countingRationale: string;
  world?: Partial<SeedResetRecordV1["world"]>;
  runtime: {
    platform?: string;
    serverMode: string;
    minecraftVersion?: string;
    mineflayerVersion?: string;
    provider: SocialCycleProviderId | "none" | "mixed";
    model: string;
    offline: boolean;
    deterministicMode: SeedResetDeterministicMode;
    providerBudgetGuard: string;
  };
  scope: {
    activeActorIds: string[];
    passiveObservedActorIds?: string[];
    scenarioFamilyIdsDeclared: string[];
    worldSetupLaneIds?: string[];
  };
  evidenceRefs?: Partial<SeedResetRecordV1["evidence_refs"]>;
  conditionProvenance?: SeedResetRecordV1["condition_provenance"];
  negativeResultNotes?: string[];
}): SeedResetRecordV1 {
  return {
    schema_version: "seed-reset-record/v1",
    record_id: input.recordId,
    run_id: input.runId,
    recorded_at: input.recordedAt ?? new Date().toISOString(),
    seed_or_reset_id: input.seedOrResetId,
    session_kind: input.sessionKind,
    counts_toward_legibility_seed_requirement: input.countsTowardLegibilitySeedRequirement,
    counting_rationale: input.countingRationale,
    world: {
      ...input.world,
      setup_artifact_refs: input.world?.setup_artifact_refs ?? [],
      loaded_world_caveats: input.world?.loaded_world_caveats ?? []
    },
    runtime: {
      platform: input.runtime.platform ?? hostPlatform(),
      server_mode: input.runtime.serverMode,
      ...(input.runtime.minecraftVersion ? { minecraft_version: input.runtime.minecraftVersion } : {}),
      ...(input.runtime.mineflayerVersion ? { mineflayer_version: input.runtime.mineflayerVersion } : {}),
      provider: input.runtime.provider,
      model: input.runtime.model,
      offline: input.runtime.offline,
      deterministic_mode: input.runtime.deterministicMode,
      provider_budget_guard: input.runtime.providerBudgetGuard
    },
    scope: {
      active_actor_ids: [...input.scope.activeActorIds],
      passive_observed_actor_ids: [...(input.scope.passiveObservedActorIds ?? [])],
      scenario_family_ids_declared: [...input.scope.scenarioFamilyIdsDeclared],
      world_setup_lane_ids: [...(input.scope.worldSetupLaneIds ?? [])]
    },
    evidence_refs: {
      ...input.evidenceRefs,
      environment_log_refs: [...(input.evidenceRefs?.environment_log_refs ?? [])]
    },
    ...(input.conditionProvenance ? { condition_provenance: input.conditionProvenance } : {}),
    negative_result_notes: [...(input.negativeResultNotes ?? [])]
  };
}

export function createResampledSoulSeedResetRecord(input: {
  recordId: string;
  runId: string;
  seedOrResetId: string;
  recordedAt?: string;
  activeActorIds: string[];
  scenarioFamilyIdsDeclared: string[];
  preRunDeclarationRef?: string;
  transitionRowBatchRef?: string;
  batchAuditRef?: string;
  providerUsageRef?: string;
  environmentLogRefs?: string[];
  conditionProvenance?: SeedResetRecordV1["condition_provenance"];
}): SeedResetRecordV1 {
  return createSeedResetRecord({
    recordId: input.recordId,
    runId: input.runId,
    recordedAt: input.recordedAt,
    seedOrResetId: input.seedOrResetId,
    sessionKind: "deterministic_no_world",
    countsTowardLegibilitySeedRequirement: false,
    countingRationale:
      "Provider-free resampled_soul rehearsal provenance only; deterministic/no-world rows do not count toward live legibility seed/reset thresholds.",
    world: {
      world_setup_id: "provider-free-resampled-soul-rehearsal",
      setup_artifact_refs: [],
      loaded_world_caveats: [
        "No live Minecraft world provenance is claimed for this deterministic resampled_soul rehearsal."
      ]
    },
    runtime: {
      serverMode: "none",
      provider: "deterministic-social",
      model: "deterministic-social/resampled-soul-standin",
      offline: true,
      deterministicMode: "deterministic_provider",
      providerBudgetGuard: "provider-free Phase A route; no live provider request"
    },
    scope: {
      activeActorIds: input.activeActorIds,
      scenarioFamilyIdsDeclared: input.scenarioFamilyIdsDeclared
    },
    evidenceRefs: {
      pre_run_declaration_ref: input.preRunDeclarationRef,
      transition_row_batch_ref: input.transitionRowBatchRef,
      batch_audit_ref: input.batchAuditRef,
      provider_usage_ref: input.providerUsageRef,
      environment_log_refs: input.environmentLogRefs ?? []
    },
    conditionProvenance: input.conditionProvenance,
    negativeResultNotes: []
  });
}

export function validateSeedResetRecordV1(
  value: unknown
): { ok: true; record: SeedResetRecordV1 } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const record = value as SeedResetRecordV1;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { ok: false, errors: ["Seed reset record must be an object"] };
  }
  if (record.schema_version !== "seed-reset-record/v1") {
    errors.push("schema_version must be seed-reset-record/v1");
  }
  for (const field of ["record_id", "run_id", "recorded_at", "seed_or_reset_id", "counting_rationale"] as const) {
    if (!nonEmptyString(record[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }
  if (!["fresh_seed", "reset_session", "reused_live_session", "deterministic_no_world", "offline_control"].includes(record.session_kind)) {
    errors.push("session_kind is not a seed-reset-record/v1 session kind");
  }
  if (typeof record.counts_toward_legibility_seed_requirement !== "boolean") {
    errors.push("counts_toward_legibility_seed_requirement must be boolean");
  }
  if (record.counts_toward_legibility_seed_requirement && !["fresh_seed", "reset_session"].includes(record.session_kind)) {
    errors.push("only fresh_seed or reset_session records may count toward the legibility seed requirement");
  }
  if (!record.world || typeof record.world !== "object") {
    errors.push("world must be an object");
  } else {
    if (!stringArray(record.world.setup_artifact_refs)) {
      errors.push("world.setup_artifact_refs must be a string array");
    }
    if (!stringArray(record.world.loaded_world_caveats)) {
      errors.push("world.loaded_world_caveats must be a string array");
    }
  }
  if (!record.runtime || typeof record.runtime !== "object") {
    errors.push("runtime must be an object");
  } else {
    for (const field of ["platform", "server_mode", "model", "provider_budget_guard"] as const) {
      if (!nonEmptyString(record.runtime[field])) {
        errors.push(`runtime.${field} must be a non-empty string`);
      }
    }
    if (!["none", "deterministic_provider", "deterministic_fixture", "no_world"].includes(record.runtime.deterministic_mode)) {
      errors.push("runtime.deterministic_mode is not a seed-reset-record/v1 deterministic mode");
    }
    if (typeof record.runtime.offline !== "boolean") {
      errors.push("runtime.offline must be boolean");
    }
  }
  if (!record.scope || typeof record.scope !== "object") {
    errors.push("scope must be an object");
  } else {
    if (!stringArray(record.scope.active_actor_ids)) {
      errors.push("scope.active_actor_ids must be a string array");
    }
    if (!stringArray(record.scope.passive_observed_actor_ids)) {
      errors.push("scope.passive_observed_actor_ids must be a string array");
    }
    if (!stringArray(record.scope.scenario_family_ids_declared)) {
      errors.push("scope.scenario_family_ids_declared must be a string array");
    }
    if (!stringArray(record.scope.world_setup_lane_ids)) {
      errors.push("scope.world_setup_lane_ids must be a string array");
    }
  }
  if (!record.evidence_refs || typeof record.evidence_refs !== "object") {
    errors.push("evidence_refs must be an object");
  } else if (!stringArray(record.evidence_refs.environment_log_refs)) {
    errors.push("evidence_refs.environment_log_refs must be a string array");
  }
  if (record.condition_provenance !== undefined) {
    const provenance = record.condition_provenance;
    if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) {
      errors.push("condition_provenance must be an object when present");
    } else {
      for (const field of [
        "condition_id",
        "soul_family_id",
        "soul_instance_id",
        "soul_generation_seed"
      ] as const) {
        if (!nonEmptyString(provenance[field])) {
          errors.push(`condition_provenance.${field} must be a non-empty string`);
        }
      }
      if (!isLegibilityCondition(provenance.condition)) {
        errors.push("condition_provenance.condition is not a known legibility condition");
      }
      if (!actorSoulRouteMode(provenance.actor_soul_route)) {
        errors.push("condition_provenance.actor_soul_route is not a known ActorSoul route mode");
      }
      if (provenance.private_soul_text_in_record !== false) {
        errors.push("condition_provenance.private_soul_text_in_record must be false");
      }
      const holdout = provenance.family_holdout;
      if (!holdout || typeof holdout !== "object" || Array.isArray(holdout)) {
        errors.push("condition_provenance.family_holdout must be an object");
      } else {
        for (const field of ["actor_model_family", "predictor_model_family"] as const) {
          if (!nonEmptyString(holdout[field])) {
            errors.push(`condition_provenance.family_holdout.${field} must be a non-empty string`);
          }
        }
        if (holdout.held_out_family_required !== true) {
          errors.push("condition_provenance.family_holdout.held_out_family_required must be true");
        }
        if (holdout.held_out_family_satisfied !== true) {
          errors.push("condition_provenance.family_holdout.held_out_family_satisfied must be true");
        }
        if (holdout.same_family_predictor_role !== "diagnostic_only") {
          errors.push("condition_provenance.family_holdout.same_family_predictor_role must be diagnostic_only");
        }
      }
    }
  }
  if (!stringArray(record.negative_result_notes)) {
    errors.push("negative_result_notes must be a string array");
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, record };
}

export function assertSeedResetRecordV1(value: unknown): asserts value is SeedResetRecordV1 {
  const result = validateSeedResetRecordV1(value);
  if (!result.ok) {
    throw new Error(`Invalid seed-reset-record/v1: ${result.errors.join("; ")}`);
  }
}

export async function writeSeedResetRecord(filePath: string, record: SeedResetRecordV1) {
  assertSeedResetRecordV1(record);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return filePath;
}
