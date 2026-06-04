/**
 * Static source checks for bounded generated Mineflayer action skill candidates.
 *
 * @remarks This is intentionally lexical rather than a TypeScript compiler pass:
 * provider-authored source must use the simple direct `ctx.helper(...)` and
 * `params.name` shapes promised by the injected agent skill body.
 */
import type { GeneratedActionSkillCandidate } from "../../runtime/goals/types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function directCtxHelperCalls(source: string) {
  const helpers = new Set<string>();
  const pattern = /\bctx\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/g;
  for (const match of source.matchAll(pattern)) {
    if (match[1]) {
      helpers.add(match[1]);
    }
  }
  return helpers;
}

function paramPropertyReads(source: string) {
  const params = new Set<string>();
  for (const match of source.matchAll(/\bparams\s*\.\s*([A-Za-z_$][\w$]*)\b/g)) {
    if (match[1]) {
      params.add(match[1]);
    }
  }
  for (const match of source.matchAll(/\bparams\s*\[\s*["']([^"']+)["']\s*\]/g)) {
    if (match[1]) {
      params.add(match[1]);
    }
  }
  return params;
}

function sourceUsesParamKey(source: string, key: string) {
  const escaped = escapeRegExp(key);
  return new RegExp(`\\bparams\\s*\\.\\s*${escaped}\\b`).test(source) ||
    new RegExp(`\\bparams\\s*\\[\\s*["']${escaped}["']\\s*\\]`).test(source) ||
    new RegExp(`\\{[^}]*\\b${escaped}\\b[^}]*\\}\\s*=\\s*params`).test(source);
}

function sourcePassesParamsObject(source: string) {
  return /\bctx\s*\.\s*[A-Za-z_$][\w$]*\s*\(\s*params\b/.test(source);
}

function schemaPropertyKeys(schema: Record<string, unknown>) {
  return isRecord(schema.properties) ? Object.keys(schema.properties) : [];
}

export function validateGeneratedSourceContracts(input: {
  candidate: GeneratedActionSkillCandidate;
  allowedHelperNames: ReadonlySet<string>;
}): string[] {
  const errors: string[] = [];
  const source = input.candidate.source;
  const helperAllowlist = new Set(input.candidate.helper_allowlist);
  const calledHelpers = directCtxHelperCalls(source);

  if (calledHelpers.size === 0) {
    errors.push("candidate.source must call at least one direct ctx helper");
  }

  for (const helper of calledHelpers) {
    if (!input.allowedHelperNames.has(helper)) {
      errors.push(`candidate.source calls unsupported ctx helper ${helper}`);
    } else if (!helperAllowlist.has(helper)) {
      errors.push(`candidate.source calls ctx.${helper} but helper_allowlist does not include ${helper}`);
    }
  }

  for (const helper of helperAllowlist) {
    if (!calledHelpers.has(helper)) {
      errors.push(`candidate.helper_allowlist contains unused helper ${helper}`);
    }
  }

  const declaredKeys = schemaPropertyKeys(input.candidate.input_schema);
  const declaredKeySet = new Set(declaredKeys);
  const requiredKeySet = new Set(
    Array.isArray(input.candidate.input_schema.required)
      ? input.candidate.input_schema.required.filter((key): key is string => typeof key === "string")
      : []
  );
  const readKeys = paramPropertyReads(source);
  const passesParamsObject = sourcePassesParamsObject(source);

  for (const key of readKeys) {
    if (!declaredKeySet.has(key)) {
      errors.push(`candidate.source reads params.${key} but input_schema.properties.${key} is missing`);
    } else if (!requiredKeySet.has(key)) {
      errors.push(`candidate.source reads params.${key} but input_schema.required does not include ${key}`);
    }
  }

  if (!passesParamsObject) {
    for (const key of declaredKeys) {
      if (!sourceUsesParamKey(source, key)) {
        errors.push(`candidate.input_schema.properties.${key} is not read from params in source`);
      }
    }
  }

  return errors;
}
