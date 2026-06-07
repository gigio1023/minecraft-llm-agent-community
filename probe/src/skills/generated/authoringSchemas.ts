/**
 * Schema and contract checks for provider-authored Mineflayer action skill
 * candidates.
 *
 * @remarks Authoring is allowed only through the action-selection path. These
 * checks keep generated source helper-limited, parameter-schema-bound, timed,
 * and verifier-backed before trial or promotion can happen.
 */
import { assertDirectGeneratedActionSkillSource } from "../../generatedActionSkills/directExecutor.js";
import type {
  GeneratedActionSkillCandidate,
  LegacyPlannerAction
} from "../../runtime/goals/types.js";
import { mineflayerActionSkillHelperNames } from "../../runtime/goals/actorEpisode/mineflayerCodegenSkill.js";
import { validateGeneratedSourceContracts } from "./sourceContracts.js";

export const GENERATED_ACTION_SKILL_CANDIDATE_SCHEMA =
  "generated-action-skill-candidate/v1" as const;
export const ACTION_SKILL_AUTHORING_HELPER_API_VERSION =
  "mineflayer-action-skill-helper/v1" as const;

export type GeneratedActionSkillLifecycleStatus =
  | "draft"
  | "trial_failed"
  | "diagnostic_only"
  | "promotable";

const allowedHelperNames = new Set<string>(mineflayerActionSkillHelperNames);

const helperPrimitiveMap: Record<string, string> = {
  observe: "observe",
  wait: "wait",
  collectLogs: "collect_logs",
  mineBlock: "mine_block",
  craftItem: "craft_item",
  craftWithTable: "craft_with_table",
  consumeItem: "consume_item",
  placeBlock: "place_block",
  buildPattern: "build_pattern",
  say: "say",
  mineflayer: "run_mineflayer_program"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    return null;
  }
  return value;
}

function readJsonSchemaType(schema: Record<string, unknown>) {
  const raw = schema.type;
  return typeof raw === "string" ? raw : undefined;
}

function validateScalarType(input: {
  value: unknown;
  type: string;
  path: string;
  errors: string[];
}) {
  switch (input.type) {
    case "string":
      if (typeof input.value !== "string") {
        input.errors.push(`${input.path} must be a string`);
      }
      return;
    case "number":
      if (typeof input.value !== "number" || !Number.isFinite(input.value)) {
        input.errors.push(`${input.path} must be a finite number`);
      }
      return;
    case "integer":
      if (typeof input.value !== "number" || !Number.isInteger(input.value)) {
        input.errors.push(`${input.path} must be an integer`);
      }
      return;
    case "boolean":
      if (typeof input.value !== "boolean") {
        input.errors.push(`${input.path} must be a boolean`);
      }
      return;
    case "object":
      if (!isRecord(input.value)) {
        input.errors.push(`${input.path} must be an object`);
      }
      return;
    case "array":
      if (!Array.isArray(input.value)) {
        input.errors.push(`${input.path} must be an array`);
      }
      return;
    default:
      input.errors.push(`${input.path} uses unsupported schema type ${input.type}`);
  }
}

function validateProperty(input: {
  schema: Record<string, unknown>;
  value: unknown;
  path: string;
  errors: string[];
}) {
  if ("const" in input.schema && input.value !== input.schema.const) {
    input.errors.push(`${input.path} must equal ${String(input.schema.const)}`);
  }

  const type = readJsonSchemaType(input.schema);
  if (!type) {
    return;
  }

  validateScalarType({
    value: input.value,
    type,
    path: input.path,
    errors: input.errors
  });

  const enumValues = input.schema.enum;
  if (Array.isArray(enumValues) && !enumValues.includes(input.value)) {
    input.errors.push(`${input.path} must be one of ${enumValues.map(String).join(", ")}`);
  }

  if (
    typeof input.value === "number" &&
    typeof input.schema.minimum === "number" &&
    input.value < input.schema.minimum
  ) {
    input.errors.push(`${input.path} must be >= ${input.schema.minimum}`);
  }
  if (
    typeof input.value === "number" &&
    typeof input.schema.maximum === "number" &&
    input.value > input.schema.maximum
  ) {
    input.errors.push(`${input.path} must be <= ${input.schema.maximum}`);
  }
}

function validateInputSchemaDefinition(
  schema: Record<string, unknown>,
  path: string,
  errors: string[]
) {
  if (readJsonSchemaType(schema) !== "object") {
    errors.push(`${path}.type must be object`);
  }
  if (schema.additionalProperties !== false) {
    errors.push(`${path}.additionalProperties must be false`);
  }
  const properties = isRecord(schema.properties) ? schema.properties : null;
  if (!properties) {
    errors.push(`${path}.properties must be an object`);
  }
  const required = stringArray(schema.required);
  if (!required) {
    errors.push(`${path}.required must be a string array`);
  }
  if (!properties || !required) {
    return;
  }
  for (const key of required) {
    if (properties[key] === undefined) {
      errors.push(`${path}.required includes ${key} but properties.${key} is missing`);
    }
  }
  for (const [key, propertySchema] of Object.entries(properties)) {
    if (!isRecord(propertySchema)) {
      errors.push(`${path}.properties.${key} must be an object`);
    }
  }
}

export function validateJsonObjectAgainstSimpleSchema(input: {
  schema: Record<string, unknown>;
  parameters: Record<string, unknown>;
}): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (readJsonSchemaType(input.schema) !== "object") {
    errors.push("input_schema.type must be object");
  }

  const required = stringArray(input.schema.required) ?? [];
  for (const key of required) {
    if (input.parameters[key] === undefined) {
      errors.push(`parameters.${key} is required by input_schema`);
    }
  }

  const properties = isRecord(input.schema.properties)
    ? input.schema.properties
    : {};
  for (const [key, value] of Object.entries(input.parameters)) {
    const propertySchema = properties[key];
    if (propertySchema === undefined) {
      if (input.schema.additionalProperties === false) {
        errors.push(`parameters.${key} is not allowed by input_schema`);
      }
      continue;
    }
    if (!isRecord(propertySchema)) {
      continue;
    }
    validateProperty({
      schema: propertySchema,
      value,
      path: `parameters.${key}`,
      errors
    });
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function validateGeneratedActionSkillCandidate(
  value: unknown
): { ok: true; candidate: GeneratedActionSkillCandidate } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["candidate must be an object"] };
  }

  if (value.schema !== GENERATED_ACTION_SKILL_CANDIDATE_SCHEMA) {
    errors.push(`candidate.schema must be ${GENERATED_ACTION_SKILL_CANDIDATE_SCHEMA}`);
  }
  for (const key of ["proposed_skill_id", "purpose", "source"] as const) {
    if (!nonEmptyString(value[key])) {
      errors.push(`candidate.${key} must be a non-empty string`);
    }
  }
  if (value.source_language !== "typescript") {
    errors.push("candidate.source_language must be typescript");
  }
  if (!isRecord(value.input_schema)) {
    errors.push("candidate.input_schema must be an object JSON schema");
  } else {
    validateInputSchemaDefinition(value.input_schema, "candidate.input_schema", errors);
  }
  if (value.helper_api_version !== ACTION_SKILL_AUTHORING_HELPER_API_VERSION) {
    errors.push(`candidate.helper_api_version must be ${ACTION_SKILL_AUTHORING_HELPER_API_VERSION}`);
  }
  const helperAllowlist = stringArray(value.helper_allowlist);
  if (!helperAllowlist || helperAllowlist.length === 0) {
    errors.push("candidate.helper_allowlist must be a non-empty string array");
  } else {
    for (const helper of helperAllowlist) {
      if (!allowedHelperNames.has(helper)) {
        errors.push(`candidate.helper_allowlist contains unsupported helper ${helper}`);
      }
    }
  }
  if (
    typeof value.timeout_ms !== "number" ||
    !Number.isFinite(value.timeout_ms) ||
    value.timeout_ms < 500 ||
    value.timeout_ms > 120_000
  ) {
    errors.push("candidate.timeout_ms must be a number between 500 and 120000");
  }
  if (!isRecord(value.verifier)) {
    errors.push("candidate.verifier must be an object");
  }
  if (value.promotion_policy !== "promote_after_passed_trial") {
    errors.push("candidate.promotion_policy must be promote_after_passed_trial");
  }
  if (!stringArray(value.known_failure_modes)) {
    errors.push("candidate.known_failure_modes must be a string array");
  }
  if (nonEmptyString(value.source)) {
    try {
      assertDirectGeneratedActionSkillSource(value.source);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
    if (isRecord(value.input_schema) && helperAllowlist) {
      errors.push(
        ...validateGeneratedSourceContracts({
          candidate: value as GeneratedActionSkillCandidate,
          allowedHelperNames
        })
      );
    }
  }

  return errors.length === 0
    ? { ok: true, candidate: value as GeneratedActionSkillCandidate }
    : { ok: false, errors };
}

export function validateGeneratedActionSkillTrialRequest(input: {
  candidate: unknown;
  parameters: Record<string, unknown>;
}): {
  ok: true;
  candidate: GeneratedActionSkillCandidate;
  parameters: Record<string, unknown>;
} | { ok: false; errors: string[] } {
  const candidateResult = validateGeneratedActionSkillCandidate(input.candidate);
  if (!candidateResult.ok) {
    return candidateResult;
  }
  if (candidateResult.candidate.promotion_policy !== "promote_after_passed_trial") {
    return {
      ok: false,
      errors: [
        "author_and_trial_action_skill requires candidate.promotion_policy promote_after_passed_trial"
      ]
    };
  }

  const schemaResult = validateJsonObjectAgainstSimpleSchema({
    schema: candidateResult.candidate.input_schema,
    parameters: input.parameters
  });
  if (!schemaResult.ok) {
    return schemaResult;
  }

  return {
    ok: true,
    candidate: candidateResult.candidate,
    parameters: input.parameters
  };
}

export function validateAuthorAndTrialActionSkillRequest(
  action: LegacyPlannerAction
) {
  return validateGeneratedActionSkillTrialRequest({
    candidate: action.candidate,
    parameters: action.parameters ?? action.args ?? {}
  });
}

export function generatedCandidateRequiredPrimitives(
  candidate: GeneratedActionSkillCandidate
) {
  return [
    ...new Set([
      "run_mineflayer_program",
      ...candidate.helper_allowlist
        .map((helper) => helperPrimitiveMap[helper])
        .filter((primitive): primitive is string => Boolean(primitive))
    ])
  ];
}

export function generatedCandidateSuccessVerifier(
  candidate: GeneratedActionSkillCandidate
) {
  const verifierKind =
    isRecord(candidate.verifier) && typeof candidate.verifier.kind === "string"
      ? candidate.verifier.kind
      : "helper_event_progress";
  return `generated-action-skill:${verifierKind}`;
}
