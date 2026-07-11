import path from "node:path";
import { fileURLToPath } from "node:url";

import type { SocialActivityKindV1 } from "./types.js";
import {
  hashInterdependentSocialScenario,
  loadInterdependentSocialScenarioFromFile,
  type ValidateSocialScenarioOptions
} from "./loader.js";
import type { InterdependentSocialScenarioV1 } from "./types.js";

/**
 * Checked-in Slice C2 interdependent scenario families.
 * Paths are relative to `probe/benchmarks/social/`.
 */
export const SOCIAL_SCENARIO_FAMILY_ENTRIES = [
  {
    family: "economic",
    scenario_id: "economic-resource-asymmetry-v1",
    relative_path: "scenarios/economic-resource-asymmetry-v1.json",
    primary_activity_kind: "economic" as const satisfies SocialActivityKindV1
  },
  {
    family: "cooperative",
    scenario_id: "cooperative-shared-construction-v1",
    relative_path: "scenarios/cooperative-shared-construction-v1.json",
    primary_activity_kind: "cooperative" as const satisfies SocialActivityKindV1
  },
  {
    family: "quest",
    scenario_id: "multi-activity-quest-v1",
    relative_path: "scenarios/multi-activity-quest-v1.json",
    primary_activity_kind: "quest" as const satisfies SocialActivityKindV1
  }
] as const;

export type SocialScenarioFamilyId = (typeof SOCIAL_SCENARIO_FAMILY_ENTRIES)[number]["family"];

export type SocialScenarioFamilyEntry = (typeof SOCIAL_SCENARIO_FAMILY_ENTRIES)[number];

export type LoadedSocialScenarioFamily = SocialScenarioFamilyEntry & {
  absolute_path: string;
  scenario: InterdependentSocialScenarioV1;
  declaration_hash: string;
};

function socialBenchmarksRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../../benchmarks/social");
}

export function resolveSocialScenarioFamilyPath(entry: SocialScenarioFamilyEntry): string {
  return path.join(socialBenchmarksRoot(), entry.relative_path);
}

export function loadSocialScenarioFamily(
  entry: SocialScenarioFamilyEntry,
  options: ValidateSocialScenarioOptions = {}
): LoadedSocialScenarioFamily {
  const absolute_path = resolveSocialScenarioFamilyPath(entry);
  const scenario = loadInterdependentSocialScenarioFromFile(absolute_path, options);
  if (scenario.scenario_id !== entry.scenario_id) {
    throw new Error(
      `Social scenario family '${entry.family}' expected scenario_id '${entry.scenario_id}' but loaded '${scenario.scenario_id}'`
    );
  }
  return {
    ...entry,
    absolute_path,
    scenario,
    declaration_hash: hashInterdependentSocialScenario(scenario)
  };
}

export function loadAllSocialScenarioFamilies(
  options: ValidateSocialScenarioOptions = {}
): LoadedSocialScenarioFamily[] {
  return SOCIAL_SCENARIO_FAMILY_ENTRIES.map((entry) => loadSocialScenarioFamily(entry, options));
}

/** Deterministic id -> SHA-256 hex map for the checked-in C2 family declarations. */
export function hashSocialScenarioFamilies(
  options: ValidateSocialScenarioOptions = {}
): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const loaded of loadAllSocialScenarioFamilies(options)) {
    hashes[loaded.scenario_id] = loaded.declaration_hash;
  }
  return hashes;
}
