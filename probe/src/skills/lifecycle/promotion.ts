import fs from "node:fs/promises";

import type { RoleId } from "../../npc/roles/contracts.js";
import {
  getActorActionSkillRecordPath,
  type ActorActionSkillStatusPath
} from "../../runtime/actorWorkspacePaths.js";
import {
  addActorActionSkillToLibraryIndex,
  writeActorActionSkillRecord,
  type ActorActionSkillRecord
} from "../../runtime/actorWorkspaceStore.js";
import { writeActorEvidenceRecord } from "../../runtime/evidence/actorEvidence.js";
import type { ActionSkillProposalRecord } from "../proposals/types.js";
import type { ActionSkillRecipe } from "../recipes/types.js";
import { validateActionSkillRecipe } from "../recipes/validator.js";

export type ActionSkillTrialResult = {
  status: "passed" | "failed";
  evidence_refs: string[];
  verifier_reason: string;
};

export type RecordActionSkillTrialInput = {
  actorWorkspaceRootDir: string;
  proposal: ActionSkillProposalRecord;
  recipe: ActionSkillRecipe;
  trial: ActionSkillTrialResult;
  created_at?: string;
};

export type PromoteActionSkillInput = RecordActionSkillTrialInput & {
  actorRole: RoleId;
  activeActionSkills: readonly ActorActionSkillRecord[];
  review_refs?: string[];
};

function now(input?: string) {
  return input ?? new Date().toISOString();
}

function assertPassedTrial(trial: ActionSkillTrialResult) {
  if (trial.status !== "passed") {
    throw new Error("Cannot promote action skill without a passed trial");
  }

  if (trial.evidence_refs.length === 0) {
    throw new Error("Cannot promote action skill without trial evidence refs");
  }
}

async function removeActionSkillRecordIfExists(
  rootDir: string,
  actorId: string,
  status: ActorActionSkillStatusPath,
  skillId: string
) {
  await fs.rm(getActorActionSkillRecordPath(rootDir, actorId, status, skillId), {
    force: true
  });
}

export async function recordActionSkillTrial(input: RecordActionSkillTrialInput) {
  const createdAt = now(input.created_at);

  return writeActorEvidenceRecord(input.actorWorkspaceRootDir, {
    schema: "actor-evidence/v1",
    evidence_id: `recipe-trial-${input.proposal.proposal_id}`,
    actor_id: input.proposal.owner_actor_id,
    category: "recipe_trial",
    created_at: createdAt,
    target: input.proposal.skill_id,
    verifier_reason: input.trial.verifier_reason,
    data: {
      proposal_id: input.proposal.proposal_id,
      recipe_id: input.recipe.recipe_id,
      skill_id: input.proposal.skill_id,
      status: input.trial.status,
      evidence_refs: [...input.trial.evidence_refs],
      verifier: input.recipe.verifier
    }
  });
}

function buildActiveRecord(input: PromoteActionSkillInput): ActorActionSkillRecord {
  const createdAt = now(input.created_at);

  return {
    schema: "actor-action-skill/v1",
    skill_id: input.proposal.skill_id,
    owner_actor_id: input.proposal.owner_actor_id,
    source_kind: input.proposal.source_kind,
    status: "active",
    created_at: createdAt,
    updated_at: createdAt,
    required_primitives: [...input.recipe.steps.map((step) => step.primitive)],
    preconditions: [...input.recipe.steps.map((step) => step.guard).filter((guard): guard is string => Boolean(guard))],
    success_verifier: `${input.recipe.verifier.kind}:${input.recipe.verifier.target}`,
    known_failure_modes: [...input.proposal.known_failure_modes],
    evidence_refs: [...input.proposal.evidence_refs, ...input.trial.evidence_refs],
    review_refs: [...(input.review_refs ?? [])],
    notes: `Promoted from ${input.proposal.proposal_id} after ${input.recipe.recipe_id} trial.`
  };
}

export async function promoteActionSkillAfterTrial(input: PromoteActionSkillInput) {
  assertPassedTrial(input.trial);

  const validation = validateActionSkillRecipe(input.recipe, {
    actorRole: input.actorRole,
    activeSkillIds: input.activeActionSkills.map((record) => record.skill_id)
  });

  if (!validation.ok) {
    throw new Error(`Cannot promote invalid action skill recipe: ${validation.errors.join("; ")}`);
  }

  const trialEvidencePath = await recordActionSkillTrial(input);
  const superseded = input.activeActionSkills.find(
    (record) => record.skill_id === input.proposal.skill_id
  );

  if (superseded) {
    const supersededRecord: ActorActionSkillRecord = {
      ...superseded,
      status: "superseded",
      updated_at: now(input.created_at),
      supersession: {
        superseded_by_skill_id: input.proposal.skill_id,
        reason: input.recipe.supersession_note ?? `superseded by ${input.proposal.proposal_id}`,
        evidence_refs: [trialEvidencePath]
      }
    };
    await writeActorActionSkillRecord(input.actorWorkspaceRootDir, supersededRecord);
    await removeActionSkillRecordIfExists(
      input.actorWorkspaceRootDir,
      superseded.owner_actor_id,
      "active",
      superseded.skill_id
    );
  }

  const activeRecord = buildActiveRecord({
    ...input,
    trial: {
      ...input.trial,
      evidence_refs: [...input.trial.evidence_refs, trialEvidencePath]
    }
  });
  const activePath = await writeActorActionSkillRecord(
    input.actorWorkspaceRootDir,
    activeRecord
  );
  await addActorActionSkillToLibraryIndex({
    rootDir: input.actorWorkspaceRootDir,
    actorId: activeRecord.owner_actor_id,
    status: "active",
    skillId: activeRecord.skill_id,
    updatedAt: now(input.created_at)
  });

  return {
    activePath,
    trialEvidencePath,
    supersededSkillId: superseded?.skill_id
  };
}
