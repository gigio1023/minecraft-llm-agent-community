export type {
  CapabilityMilestoneV1,
  CapabilityPredicateResultV1,
  CapabilityPredicateV1,
  IndividualCapabilityCaseV1,
  IndividualCapabilityManifestV1
} from "./types.js";

export type { CapabilityEvidenceBagV1 } from "./evidenceBag.js";

export {
  DEFAULT_CAPABILITY_MC_VERSION,
  isKnownMinecraftBlock,
  isKnownMinecraftItem,
  isKnownMinecraftItemOrBlock,
  normalizeMinecraftId
} from "./minecraftIds.js";

export {
  assertIndividualCapabilityManifest,
  loadIndividualCapabilityManifestFromFile,
  validateIndividualCapabilityManifest
} from "./loader.js";

export {
  evaluateCapabilityMilestone,
  evaluateCapabilityPredicate
} from "./predicates.js";
